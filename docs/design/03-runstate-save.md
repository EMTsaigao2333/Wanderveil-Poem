# 0.3 RunState 运行时状态 + 存档格式

> 所属步骤：第 0 步 · 设计补缺
> 状态：**待用户确认**
> 上游决策：2026-09-23（本轮全部决策）
> 关联代码：需新增 `miniprogram/engine/run-state.ts`；被 `engine/story-engine.ts` 使用

---

## 1. 定位

`RunState` 是「一局人生」的完整运行时快照。它承担三件事：

1. **引擎的输入输出**：事件抽取、检定结算、时间推进全部读写它
2. **存档格式**：直接序列化进 `wx.setStorageSync`，实现「继续人生」
3. **总结图的数据源**：`history` 字段就是人生时间线

---

## 2. 数据结构

```ts
export type LifeModel = 'full' | 'episodic';
export type RunStatus = 'playing' | 'dead' | 'finished';

/** 一次抉择的历史记录（总结图时间线） */
export interface HistoryEntry {
  age: number;
  eventId: string;
  title?: string;
  /** 玩家选择的选项文案；自动事件为空 */
  choiceLabel?: string;
  /** 检定结果 */
  checkResult?: 'crit' | 'success' | 'fail' | 'critFail';
  /** [骰面, 属性加值] */
  dice?: [number, number];
  /** 结果旁白 */
  text?: string;
  /** 本次产生的变化（总结图可展示关键节点） */
  effects?: Effects;
}

/**
 * 人际关系羁绊 —— 因果链的载体。
 * 选项可以通过 require.tags 依赖它（如「有可以倾诉的人」），
 * 也可以直接通过 require.relation 检查某个对象是否存在且状态达标。
 */
export interface Relation {
  /** 关系对象 id（对应世界设定中的角色，如 cyberpunk 的「阿鸾」） */
  id: string;
  name: string;
  /** 关系类型 */
  kind: 'kin' | 'friend' | 'lover' | 'mentor' | 'rival' | 'enemy' | 'acquaintance';
  /** 亲密度 0~20 */
  closeness: number;
  /** 是否仍然在世 / 仍在身边（母亲离开后置 false） */
  present: boolean;
  /** 该关系沉淀的标签，如 'has_close_friend' */
  tags?: string[];
}

export interface RunState {
  /** 存档版本号，用于迁移 */
  version: number;
  runId: string;
  /** 随机种子，保证同种子可复现 */
  seed: number;

  // —— 开局配置 ——
  worldId: string;
  lifeModel: LifeModel;
  attrSystem: AttrSystemId;
  /** 全随机模式下的人物卡；其余系统为 null */
  card: CharacterCard | null;

  // —— 当前状态 ——
  age: number;
  stage: Stage;
  /** episodic 世界的章节序号，从 1 开始 */
  chapter?: number;
  /** 当前属性系统的属性值：{ insight: 12, resolve: 8, ... } */
  attrs: Record<string, number>;
  /** 隐藏属性：{ fate: 11 } / { luck: 9 } */
  hidden: Record<string, number>;
  money: number;
  /** 六维系统下 charm / wealth 的落点 */
  backgroundScore: number;
  tags: string[];
  /** 能力标签（失明等），全随机模式从人物卡带入 */
  caps: string[];
  /** 心理状态量（见 02 文档第 4 节）：韧性 / 信任 / 自我价值 / 压抑度 / 已触发病理 */
  psyche: PsycheState;
  /** 人际关系羁绊（因果链的载体，见 02 文档第 12 节） */
  relations: Relation[];
  /**
   * 生效中的伤势 / 病根（2026-10-08 新增，见 09 文档第 5 节）
   * 与 tags / 特质三者分工：标签=发生过的事、特质=你是谁、伤势=正在消耗你的东西
   */
  debuffs: Debuff[];

  // —— 推演进度 ——
  /** 已触发过的 once 事件 id */
  firedOnce: string[];
  /** 连锁跳转目标（Outcome.next） */
  pendingNext?: string;
  /**
   * 后效队列（2026-10-08 新增，见 09 文档）：挂账到未来的后果
   * 例：签了义体贷款 → 15 年后催收程序找上门
   */
  pending: PendingOutcome[];
  /**
   * 单调递增的逻辑步序号（2026-10-08 新增）
   * 用途：给 rngFor 提供显式随机坐标 —— 现在用 history.length 代替，
   * 任何改变「历史长度 ↔ 逻辑步数」对应的改动都会静默平移整局随机数
   */
  step: number;
  history: HistoryEntry[];

  // —— 终局 ——
  status: RunStatus;
  deathCause?: string;

  // —— 元信息 ——
  createdAt: number;
  updatedAt: number;
}
```

---

## 3. 推进循环（引擎主流程）

```
loop:
  1. 取事件
     若 state.pendingNext 有值 → 取该 id 的事件（连锁）
     否则 → 从当前 stage 的事件池中筛选可用事件：
        - 未在 firedOnce 中（once 事件）
        - require 条件全部满足（年龄 / 属性 / 标签 / 能力 / 概率）
     按 weight 加权随机抽一条
     池空 → 进入「空转年」：仅执行时间推进

  2. 呈现事件
     有 choices → 等待玩家选择
        → 若 choice.check 存在：掷骰结算 → 取 success / fail 分支
        → 大成功 / 大失败由引擎在分支基础上强化
     无 choices → 直接应用 effects

  3. 应用 Effects
     attr → 经语义键映射折算到当前属性系统（正向增益按收益递减折减，见 10 文档 §1.3）
     超出上限的部分 → 2:1 转存为 mood 并回报上游（见 10 文档 §1.5）
     tags / caps / money / background / death
     gainTraits / loseTraits / gainCaps / loseCaps（全随机模式）
     cost → 与 effects 同时结算的「代价」（见 10 文档 §2）
     death 有值 → status = 'dead'，结束

  4. 记录 history（含本次的 effects 与 cost）

  5. 时间推进
     full 模型：age += years（事件耗时，默认 1）
                执行 TIME_DRIFT 漂移
                跨 stage 边界 → 切换 stage
     episodic：按章节推进（见 04-life-model.md）
     推进后 step += 1（显式步序号，见 10 文档 §3.1）

  6. 终局判定
     age 超上限 / **致命属性**跌破 DEATH_THRESHOLD（白名单见 09 文档 §3）/ 剧情完结 → 结束

  7. 返回结构化结果（见 10 文档 §3.2）
     StepResult.outcome = { check, text, delta, cost, overflow, death }
     ── 界面只消费 outcome，不再回查 history（这是骰子动画时序竞态的根源）

  8. 自动存档
```

### 3.1 死亡叙述（2026-09-24 新增，待确认）

死因文案按**三级解析**，不再由引擎猜：

| 顺序 | 来源 | 用法 |
|---|---|---|
| 1 | **事件写明的死因** `effects.death` | 值若是世界死因文案池的 key（如 `被通缉`）→ 查池；否则**原样展示**（作者可直接写一句完整的死亡文案） |
| 2 | 属性耗尽 / 寿终 | 属性跌破 `DEATH_THRESHOLD` → 世界文案池的 `default`；寿终 → 「寿终正寝。你活了 N 年。」 |
| 3 | 本地 AI（二期） | 见下 |

> **⚠ 2026-10-08 修订（待确认）**：本节的第 2 级解析有两个已实测的缺陷，已由 [09 文档](./09-fatality-and-consequence.md) 重新定义：
> 1. **"任何属性归零都判死"是错的** —— 实测出现「家境=0 穷死」「颜值=0 丑死」。09 文档第 3 节改为**致命属性白名单**（`AttrDef.fatal`），其余属性归零改为**「困境」**；
> 2. **属性耗尽时用的死因 key 是 `default`** —— 导致 120 局里 116 局显示同一句话（97% 的死亡文案坍缩）。09 文档把 `deathCauses` 扩展为分池结构 `{ byAttr, byCause, hazard, age, default }`，让"行力耗尽"和"穷困"能给出不同叙述。
>
> 另：`DeathKind` 由三类扩展为**五类**（`event` / `attr` / `age` / `hazard` 事故 / `debuff` 慢性），见 09 文档第 2 节。

**本地 AI 接口（现在留好，二期直接接）**：

- 引擎对外暴露一个「死亡叙述生成器」的挂载点；App 启动时可以挂上本地 AI，也可以不挂
- 引擎把一份**死因上下文**交给它：死因种类（事件 / 属性耗尽 / 寿终）、死因 key、耗尽的属性项、年龄、当时的标签、最近 5 条人生记录、以及兜底文案
- 返回非空字符串就用它当死因文案；返回空 / 未挂载 / 生成失败 → 回落兜底文案，**不影响任何流程**

约束：死亡叙述**只影响展示**，不参与判定 —— 不改变 `status`、不改属性、不写 `history`。

> 已实现（2026-09-24）：`engine/story-engine.ts` 的 `setDeathNarrator()` + `DeathContext` / `DeathNarrator`。

---

## 4. 存档设计

| 项 | 方案 |
|---|---|
| 存储位置 | `wx.setStorageSync`，key = `run:<runId>` |
| 当前局指针 | key = `run:current`，值为 `runId` |
| 保留局数 | **存档位上限 5 个，满了不自动删除** —— 由界面提示玩家自己删一个（2026-09-24 修正，见下） |
| 存档时机 | 每次事件结算后自动存 + 主动退出时存 |
| 版本迁移 | `version` 不匹配时走 `migrateRunState()`（**2026-10-08 改为逐级迁移**，见 4.2），无法迁移则提示「旧存档不可用」 |
| 体积控制 | `history` 只存摘要（不含完整事件正文），正文按 `eventId` 回查事件库 |

> `history` 不存正文是关键：146 条事件全存会撑爆 storage（单 key 上限 1MB）。总结图需要正文时按 `eventId` 回查。

### 4.1 存档位满时的行为（2026-09-24 修正，待确认）

首版设计是「最近 5 局，超出按 `updatedAt` 淘汰最旧」。**用户澄清：5 个是每位玩家能存的存档上限，不是自动清理池** —— 静默删掉别人通关过的人生是不可接受的。改为：

| 场景 | 行为 |
|---|---|
| 存档位未满 | 建新局 → 正常写入并进入索引 |
| **存档位已满**（5 个） | 建新局 → **拒绝写入**并回报「已满」；界面提示玩家从列表里删一个旧存档，再继续 |
| 已在索引中的局（含正在玩的这一局） | 随时覆盖更新，不受上限影响（玩到一半不会因为满位丢失进度） |

- 开局向导**在建新局之前**就要检查空位，别等玩家玩了一年才发现存不进去
- 判定入口与删除入口：`hasFreeRunSlot()` / `deleteRun()`；写入返回 `{ ok, full }`
- 云存档（二期）接上后，这 5 位是**本地位**，云端另行计算

### 4.2 版本迁移必须逐级 + 拒绝前备份（2026-10-08 新增，待确认）

**现状缺陷**：`migrateRunState()` 只做 `version === RUN_VERSION` 的相等判断，不匹配直接 `return null`
（`engine/run-state.ts:323-326`）；而 `play.ts` 把 `null` 统一显示成「上一局已经结束了」。
**玩家会以为是自己玩完了，实际是存档被判了死刑**，而且没有任何提示与备份。

**为什么现在就必须修**：10 文档的显式 `step` 会改变 `rngFor` 的随机序列，
需要把 `RUN_VERSION` 从 1 升到 2 —— 按现有实现，**这一升级会把所有存档整体丢掉**。

**规则**：

| 情形 | 行为 |
|---|---|
| `version === RUN_VERSION` | 直接返回 |
| `version < RUN_VERSION` | **逐级升级**（`1→2→3…`），每级一个迁移函数，缺失字段填默认值 |
| `version > RUN_VERSION`（存档比代码新） | 拒绝，并**先把原始数据备份到 `run:backup:<runId>`** |
| 迁移函数缺失 / 抛错 | 备份 + 拒绝，UI 提示「旧版本存档无法读取」，**不得显示为「上一局结束了」** |

`v1 → v2` 的迁移内容（与 10 文档 §3 配套）：

```ts
const MIGRATIONS: Record<number, (r: any) => any> = {
  1: (r) => ({
    ...r,
    step: r.history?.length ?? 0,   // 用历史长度回填显式步序号
    debuffs: [],                    // 09 文档的伤势
    pending: [],                    // 后效队列
  }),
};
```

验收：构造一个 v1 存档验证能升到 v2 且 `step` 回填正确；构造一个 v3 存档验证被拒绝、有备份、提示文案正确。

---

## 5. 与总结图的接口

总结图（P0-6）需要的全部数据都能从 `RunState` 取到：

| 总结图元素 | 数据来源 |
|---|---|
| 六维雷达图 | `attrs`（维度数量自适应，支持 5 / 6 维） |
| 人生时间线 | `history`（按 age 分组，取 `title` + 关键 effects） |
| 人物卡（发色 / 瞳色 / 体型 / 身高） | `card.traits[].visual` |
| 死因 / 结局 | `deathCause` / `status` |
| 关键标签 | `tags` + `card.tags` |

---

## 6. 确认记录（2026-09-23）

| # | 项目 | 结论 |
|---|---|---|
| 1 | 存档保留局数 | **5 局**，超出按最旧淘汰 → **2026-09-24 修正**：5 个是**存档位硬上限、绝不自动删除**，满位时拒绝新建并提示玩家自己删（见 4.1） |
| 2 | `history` 只存摘要 + 回查正文 | **采纳** —— 存档只写摘要与事件 id，正文按 id 回查事件库，避免存档膨胀 |
| 3 | 云存档 | **放二期**（依赖自建后端）；一期只做本地存储 |

### 6.1 新增待确认（2026-09-24）

| # | 项目 | 提案 |
|---|---|---|
| 4 | 第 3.1 节 死亡叙述三级解析 | 事件写明 → 世界死因池 → 兜底；**本地 AI 接口已预留**，只影响展示、不参与判定 |
| 5 | 第 4.1 节 存档位满行为 | 硬上限 5 位、不自动删除、开局向导建局前检查空位 |
