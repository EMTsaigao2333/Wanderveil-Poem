# 0.6 AI 线路生成 · schema 预留

> 所属步骤：第 0 步 · 设计补缺（**仅预留字段与类型，实现放二期**）
> 状态：**待用户确认**
> 上游决策：2026-09-23 决策 18「AI 线路生成 = 立即生效 + 低权重入池 + 人工审查晋升」
> 关联代码：需扩展 `miniprogram/engine/schema.ts` 的 `LifeEvent` / `Choice` / `Condition`

---

## 1. 需求原文与落地理解

> 所有模式里的玩家选项可以真实改变剧本线路；改完的剧本由 AI 生成。玩家提出的线路权重会低一点，AI 再判断一下，比较离谱的权重又更小。但如果玩家线路比较正常、生成出来的线路也比较有趣，把线路发回我这边审查，可以会加入到剧情文本。

落地为三件事：

1. **自定义线路 / 自定义选项**：任何模式下，玩家可在关键节点提出「我想走另一条路」或**新增一个原本不存在的选项**，当前局**立即生效**
2. **权重入池**：生成的线路以**低权重**进入该世界事件池，供后续局抽取；越离谱权重越低
3. **审查晋升**：AI 判定「正常且有趣」的线路提交给你审查，通过后成为**正式剧情文本**（`source` 升级）

### 玩家创作的两层形态

| 层级 | 形态 | 期次 |
|---|---|---|
| 轻量 | 在既有事件中提出**自定义线路**或**新增选项**，后果由 AI 判定 | P2（本文档） |
| 完整 | **玩家工坊**：玩家构建整个世界与剧本（世界观 / 事件库 / 结局） | 远期 |

> **兼容性约定**：本节的 schema 字段（`source` / `reviewStatus` / `originRunId` / `weight`）在设计时须保持与「玩家工坊」的全剧本 UGC 兼容——即 workshop 产出的整份 `WorldPack` 应能直接用同一套来源与审查字段标记，无需改动结构。**现在不为工坊做额外设计，只保证结构不冲突。**

### 与因果关系规则的衔接

玩家新增的选项必须遵守因果前置检查（见 [02-character-layer.md](./02-character-layer.md) 第 12 节）：
若玩家提出的选项缺乏因果支撑（例如「找一个亲密的人倾诉」但本局从未建立亲密关系），AI 应**补足前置条件**（生成对应因果）或**降低权重**，不得凭空放行。

---

## 2. schema 预留字段

### 2.1 LifeEvent 扩展

```ts
export type EventSource = 'official' | 'ai' | 'player';
export type ReviewStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface LifeEvent {
  // ...原有字段
  /** 事件来源，默认 'official' */
  source?: EventSource;
  /** 审查状态，默认 'none'；official 事件无需审查 */
  reviewStatus?: ReviewStatus;
  /** 由哪一局生成（溯源用） */
  originRunId?: string;
  /** AI 判定的离谱度 0~1（0 = 完全合理，1 = 极离谱） */
  absurdity?: number;
  /** AI 判定的趣味度 0~1 */
  interest?: number;
  /** 玩家提出的原始线路文本（溯源 / 审查展示用） */
  playerInput?: string;
}
```

### 2.2 Choice 扩展

```ts
export interface Choice {
  // ...原有字段
  /** 该选项允许玩家自由输入线路（自定义线路入口） */
  allowCustomRoute?: boolean;
}
```

### 2.3 Condition 扩展

```ts
export interface Condition {
  // ...原有字段
  /** 需持有全部能力标签（全随机模式的失明等） */
  caps?: string[];
  /** 需不持有任何能力标签 */
  notCaps?: string[];
  /** 事件来源过滤：只从指定来源的事件中抽取 */
  sources?: EventSource[];
  /** 入池权重下限（低于该值的事件不被抽中） */
  minWeight?: number;
}
```

---

## 3. 权重规则

自定义线路进入事件池时，权重按下式折算：

```
poolWeight = max(1, round(BASE × normalcy² × interest))
其中：
  BASE     = 3          基础权重
  normalcy = 1 - absurdity   合理度（离谱度取反）
  interest = AI 判定的趣味度
```

设计意图：

| 情况 | 效果 |
|---|---|
| 玩家提出的线路 | 初始 `source = 'player'`，先乘 **0.5** 惩罚系数 |
| AI 判定离谱（`absurdity` 高） | `normalcy²` 平方衰减，权重迅速趋近 1 |
| AI 判定合理且有趣 | 权重回升至 2~3 |
| 经你审查通过 | `source → 'official'`（或 `reviewStatus = 'approved'`），权重恢复为标准值，进入正式剧情文本 |

---

## 4. 生成与审查链路（二期实现）

```
玩家在选项处输入自定义线路
  ↓
前端基础校验（长度 / 敏感词粗筛）
  ↓
① 内容安全：wx.msgSecCheck（必须通过才可展示）
  ↓
② 后端调 LLM，结构化输出候选事件：
     { title, text, choices?, effects?, tags? }
     必须通过 JSON Schema 校验，字段非法即丢弃重生成
  ↓
③ 数值护栏：
     - effects.attr 的增减受「单事件预算上限」约束
     - 不允许写入 death（除世界已声明的死因标签）
     - 不允许覆盖已有 official 事件的 id
  ↓
④ LLM 二次评分：absurdity / interest
  ↓
⑤ 立即在当前局生效（source='player'，不入正式库）
  ↓
⑥ 以 poolWeight 进入该世界事件池（低权重，后续局可能抽到）
  ↓
⑦ 若 normalcy 与 interest 均达阈值 → reviewStatus='pending'，提交给你审查
  ↓
⑧ 你审核通过 → source='official'，权重恢复，进入正式剧情文本
```

---

## 5. P0 只做什么

| 项 | P0 | 二期 |
|---|---|---|
| `LifeEvent` / `Choice` / `Condition` 新字段 | ✅ 落类型与默认值 | — |
| 事件池抽取时按 `source` / `minWeight` 过滤 | ✅ 引擎支持 | — |
| 自定义线路入口 UI | ❌ | ✅ |
| LLM 生成 / 评分 | ❌ | ✅ |
| 内容安全链路 | ❌ | ✅ |
| 审查后台（给你用） | ❌ | ✅ |

> P0 只需保证：**schema 装得下，引擎抽事件时能按来源和权重过滤**。其余留二期。

---

## 6. 风险与护栏

| 风险 | 护栏 |
|---|---|
| 玩家注入恶意内容 | 强制 `msgSecCheck` + 结构化输出校验，双重把关 |
| 生成事件数值超模 | 单事件预算上限，超出即 clamp |
| 生成事件与世界观冲突 | LLM prompt 注入世界元数据（世界观设定 + 已有标签池） |
| 低质线路污染事件池 | 低权重 + `minWeight` 阈值过滤，权重低于阈值直接不参与抽取 |
| 版权 / 审核风险 | 只有 `reviewStatus='approved'` 的才进正式剧情文本 |

---

## 7. 确认记录（2026-09-23）

| # | 项目 | 结论 |
|---|---|---|
| 1 | `absurdity` / `interest` 阈值 | **normalcy ≥ 0.6 且 interest ≥ 0.6** 才提交审查 |

**仍待确认**（均为 P2 事项，不阻塞第 1 步引擎）：

1. 权重公式的具体常数（`BASE`、惩罚系数 0.5）
2. 单事件数值预算上限
3. 是否需要「玩家自定义线路」的世界级开关（部分世界可关闭）
