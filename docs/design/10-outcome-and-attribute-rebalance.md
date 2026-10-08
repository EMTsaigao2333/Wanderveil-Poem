# 0.10 结算模型与属性去饱和

> 状态：**2026-10-08 新增，待用户确认**
> 上游：[09 致死档位与失败代价](./09-fatality-and-consequence.md) · [01 六维规范](./01-heart6-spec.md) · [03 RunState/存档](./03-runstate-save.md)
> 定位：把「属性为什么会废」「代价怎么写」「随机数怎么复现」三件事从**隐式约定**变成**显式机制**。
> 本文件是**结构性决定**（改 schema / 改引擎），不是内容补充。

---

## 0. 三条结论（先看这个）

| # | 结论 | 性质 |
|---|---|---|
| 1 | **"提高属性上限"解决不了饱和，反而更糟**（实测：上限 20 → 30 后，16~25 岁属性中位 18.9 → 23.0，饱和度 90%） | 推翻了最初的诊断，机制要换 |
| 2 | **`floor(属性/2)` 必须保留**（骰子中心性是刻意设计，不能改成属性直接入检定） | 确认现状是对的 |
| 3 | **DC 16 会随上限提高而变得更水**（65.6% → 78.9%），所以**去饱和与 DC 重标必须同时做** | 强耦合 |

---

## 1. 属性去饱和（第 1 条建议）

### 1.1 问题复核（实测）

150 局 × 2 系统 = 14,878 次检定的属性值分布：

| 年龄段 | p10 | p25 | **中位** | p75 | p90 | 饱和度（中位/上限） |
|---|---|---|---|---|---|---|
| 0-6 | 7.0 | 9.0 | **11.0** | 13.1 | 15.5 | 55% |
| 7-15 | 11.1 | 14.3 | **17.6** | 20 | 20 | **88%** |
| 16-25 | 12.1 | 15.4 | **18.9** | 20 | 20 | **94%** |
| 26-40 | 10.2 | 14.0 | **18.4** | 20 | 20 | **92%** |
| 41-60 | 11.0 | 14.2 | **17.6** | 20 | 20 | **88%** |
| 61-90 | 10.7 | 14.0 | **17.6** | 19.4 | 20 | **88%** |

**注意 p75 与 p90 从 7 岁起就恒等于 20** —— 也就是**四分之三的检定，受检属性已经顶到上限**。这才是"成长感为零"的真实形态：不是"长得慢"，而是**7 岁就长满了**。

### 1.2 实测：只提高上限会发生什么（**这是本次最重要的发现**）

在内存里改 `AttrSystem.attrs[].max`（不动项目文件），跑四种配置各 240 局：

| 配置 | 16-25 岁<br>属性中位 | 26-40 岁<br>属性中位 | 该年龄段<br>饱和度 | DC 16 实测<br>成功率 | 寿命中位 |
|---|---|---|---|---|---|
| **现状**（上限 20） | 18.9 | 18.5 | 94% / 93% | **65.6%** | 69 |
| 只提上限到 30 | 23.0 | 24.0 | 77% / 80% | **78.9%** | 71 |
| 上限 30 + 漂移延长 | 23.3 | 26.0 | 78% / 87% | **79.7%** | 72 |
| 上限 30 + 漂移延长 + 事件数值 ×1.5 | **27.0** | **28.8** | **90% / 96%** | **83.3%** | 73 |

**结论：提高上限只把天花板抬高了，玩家的头照样顶在天花板上。** 而且同步放大事件数值之后，饱和度回到 90~96%，比现状还严重。

**根因**：属性增长是**纯加法**，而且供给量（事件效果的绝对值）相对于值域一直很大。**天花板设在哪，玩家就会顶到哪**。所以：

> **去饱和不能用"抬高上限"来做，必须改供给侧的曲线。**

### 1.3 提案 A（推荐）：收益递减 —— 越接近上限，涨得越慢

在 `addSemanticAttr`（`engine/story-engine.ts:89-104`）里把"无条件加法"改成"按剩余空间折减"：

```ts
/**
 * 收益递减：属性越接近上限，正向增益折减越强。
 * 逆风（负值）不折减 —— 受伤永远按全额算，这样"代价"才有分量。
 */
function diminishing(gain: number, cur: number, min: number, max: number): number {
  if (gain <= 0) return gain;
  const headroom = (max - cur) / (max - min);        // 剩余空间比例 0~1
  return gain * Math.sqrt(Math.max(0, headroom));    // 平方根：中段影响温和，末端迅速收敛
}
```

效果预估（上限 20、供给不变）：

| 当前属性 | 剩余空间 | 名义 +3 的实际收益 | +8 的实际收益 |
|---|---|---|---|
| 10（半满） | 50% | +2.1 | +5.7 |
| 15（75%） | 25% | +1.5 | +4.0 |
| 18（90%） | 10% | **+0.9** | **+2.5** |
| 19（95%） | 5% | **+0.7** | +1.7 |

**为什么推荐它**：
1. **一处改动、全局生效**：不用改 161 条事件的数值，也不用重估 `TIME_DRIFT`；
2. **天花板变成软约束**：属性越高越难涨，玩家自然会去补弱项——**这正好把"六维"变成六条都要经营的线**；
3. **它同时缓解了"大成功被吃掉"**：因为接近上限时增益变小，`trimByCap` 要扔掉的量也随之变小（见 §1.5）；
4. **对负向不折减**：保持"代价全额"的分量，与 09 文档的失败代价设计一致。

### 1.4 提案 B（备选）：上限提到 30 + 供给侧同步放大 + 收益递减

若希望"老年角色能明显强于青年角色"，需要**三个一起做**：
1. 上限 20 → 30；
2. `TIME_DRIFT` 的生长期延长（认知类到 32 岁、意志类到 40 岁），让 26-40 岁成为峰值而不是 16-25 岁；
3. **提案 A 的收益递减必须同时上**，否则 90% 饱和会在 3 岁内重新出现（实测已证明）。

> 单做 1+2 而不做 3 → 上表第三行：饱和度 87%，寿命中位 72，**白做**。

### 1.5 提案 C（配套，必做）：溢出转存 `trimByCap`

现状问题（实测）：**45.9% 的检定的受检属性剩余空间 ≤ 2，24.5% 已经贴顶**——大成功的 ×1.5 有接近一半被 `Math.min(def.max, …)` 直接抹平。玩家掷出 20，引擎说"你做得远比想象中好"，数值一点没多给。

**规则**：属性增益被上限截断时，**把被丢掉的部分按 2:1 折算成 `mood`**（心境），并在结果面板显式说明。

```ts
// addSemanticAttr 内部
const raw = ...;
const next = clamp(cur + raw, def.min, def.max);
const lost = raw - (next - cur);              // 被上限吃掉的量
if (lost > 0 && key !== 'mood') {
  addSemanticAttr(state, 'mood', lost / 2, true);   // 溢出转心境
  clampLost[key] = (clampLost[key] ?? 0) + lost;    // 供 UI 展示
}
```

UI 文案：**「行力已满，溢出的 2 点转为心境的提升。」** —— 这一句话就能把"白掷了"变成"没白掷"。

> 为什么转到 `mood` 而不是 `money`：`mood` 是所有属性系统都有的语义键（五维映射 `happiness`、六维映射 `resolve 0.5 + reverie 0.5`），且它本身有均值回归（`MOOD_REGRESSION`），转过去不会形成新的失衡。

### 1.6 保留 `floor(属性/2)`（确认现状）

**不改成"属性直接入检定"**，理由（实测）：

| 方案 | 能力跨度 | d20 跨度 | 运气 : 角色 | 判断 |
|---|---|---|---|---|
| `floor(属性/2)`，上限 20 | **10** | 19 | 1.9 : 1 | ✅ 可接受 |
| 属性直接入检定，上限 20 | 20 | 19 | 0.95 : 1 | 角色压过骰子，检定失去张力 |
| 属性直接入检定，上限 30 | **30** | 19 | **0.63 : 1** | ❌ 骰子几乎不起作用 |

而且改成直接入检定后，旧 DC 表会整体失效（实测：DC 19 的 extreme 档成功率从 49.3% 飙到 **87.4%**，等于"玩命"检定变成必成功）。

**结论：`CHECK_RULE.modDivisor = 2` 保持不变。** 去饱和靠 §1.3 的收益递减，不靠改检定位。

### 1.7 成长感：这是**另一个**问题，不要指望去饱和顺手解决

实测：`16-25 岁中位 18.9 → 41-60 岁中位 17.5`，**差 −1.4（负增长）**。即使把上限抬到 30 + 漂移延长，这个差值仍是 **−1.3**。

也就是说：**属性在青年期达峰，之后一路下滑**，玩家从 25 岁起就在"变弱"。这与「人生模拟」的直觉相反——中年应该是资源与能力的巅峰。

**根因**：`TIME_DRIFT` 的衰减从 20 岁开始（`attributes.ts:163`），而事件供给的增益不足以对冲。

**提案**：把 `TIME_DRIFT` 的**净衰减起点推迟到 40 岁**，20~40 岁改为"低速增长或持平"，即：

| 语义键 | 现在 | 提案 |
|---|---|---|
| `vitality` | 20~59 −0.5 / 60+ −1 | **20~39 −0.1** / 40~59 −0.5 / 60+ −1 |
| `health` | 20~59 −0.25 / 60+ −1 | **20~39 0** / 40~59 −0.25 / 60+ −1 |

> ⚠ 这**会直接改变寿命分布**（衰减推迟 → 活得更久），必须与 01 文档 §6.3 的寿命校准**一起重做**，且顺序在 D1 决策之后。

---

## 2. 「成功但有代价」——`Outcome.cost`（第 2 条建议）

### 2.1 为什么必须加

现在 `Outcome` 只有 `{ text, effects, next }`（`engine/schema.ts:141-147`），**数值层无法表达"你拿到了工作，但失去了她"**。而人生选择的本质是取舍，不是成败：

- 你拿到了那份云台的工作 —— 但你搬离了母亲
- 你和解了 —— 但你还是没说出那句话
- 你救下了孩子 —— 但你的腿废了

现状下作者只能把代价写进正文，**引擎结算的仍然是纯粹的收益**。这让"人生"这个题材失去了最重要的表达手段。

### 2.2 类型定义

```ts
export interface Outcome {
  text?: string;
  effects?: Effects;
  next?: string;
  /**
   * 这一次结果的「代价」：与 effects 同时结算。
   * success.cost = 成功但有代价（人生取舍）
   * fail.cost    = 失败的额外代价（等价于直接写进 fail.effects，留作显式表达）
   */
  cost?: Effects;
  /** 代价的免除条件：填 'critSuccess' 表示大成功时免除（你两边都保住了） */
  costUnless?: 'critSuccess';
}
```

### 2.3 与 09 文档的分工（不要混用）

| 机制 | 回答什么问题 | doc |
|---|---|---|
| `Choice.hazard` / `failLethal` | **会不会死、有多危险** | 09 第 4 节 |
| **`Outcome.cost`** | **付了什么价** | 本节 |
| `Debuff` | 代价如何**持续**消耗你 | 09 第 5 节 |
| `tags` / `gainTraits` | 代价如何**永久改变**你 | 02 第 7.2 节 |

`cost` 是**承载位置**，09 的"三档代价"是**内容标准**——两者是正交的，写事件时同时用。

### 2.4 事件写法

```ts
{
  label: '接受云台的工作',
  check: { attr: 'will', dc: DC.hard },
  success: {
    text: '你签了。电梯上行的时候，你没有回头看那条巷子。',
    effects: { attr: { wealth: 3 }, money: 20000, tags: ['云台职员'] },
    cost: {
      attr: { mood: -3 },
      psyche: { suppression: 2 },
      dropTags: ['和余柚一起'],
      debuff: [{ id: 'debuff_guilt', years: 5, label: '没说出口的话', perYear: { mood: -0.2 } }],
    },
    costUnless: 'critSuccess',   // 大成功 = 你两边都保住了
  },
  fail: { text: '…', effects: { attr: { mood: -2 } } },
}
```

### 2.5 结算规则

1. `success` / `fail` / `critSuccess` / `critFail` 四类分支**都可以带 `cost`**；
2. `cost` 与 `effects` **同一次**结算，顺序：先 `effects` 后 `cost`（让代价看到收益后的状态）；
3. `costUnless: 'critSuccess'` 时，`critSuccess` 分支（**含引擎自动强化的 crit**）**跳过 cost**；
4. **`cost` 不参与大成功/大失败的 ×1.5 / ×0.5 缩放** —— 代价是作者写死的因果，与 `tags` / `death` 同类（01 §4.1 第 90 行的原则）；
5. `cost` 计入 `HistoryEntry`，总结图可以把"得到了什么 / 付出了什么"并排展示。

### 2.6 改动量

| 位置 | 改动 |
|---|---|
| `engine/schema.ts` | `Outcome` 加 2 个字段 |
| `engine/story-engine.ts` `submitChoice()` | 结算 `cost`（约 6 行）+ 写进 `HistoryEntry` |
| `engine/story-engine.ts` `resolveOutcome()` | 把 `cost` 一起带出（大成功时不放大、不免除判断） |
| `engine/story-engine.ts` `amplifyEffects()` | **排除 `cost`**（一行判断） |
| `pages/play/*` | 结果面板加一行"代价" |

**总计约十几行引擎代码**，且**零破坏性**（不写 `cost` 的事件行为完全不变）。这是本文件里性价比最高的改动。

---

## 3. 显式 `step` 与结构化 `outcome`（第 3 条建议）

### 3.1 显式 `RunState.step`：把隐式契约变成显式的

**现状问题**（`engine/story-engine.ts:50-57`）：

```ts
export function rngFor(state: RunState, salt: string): Rng {
  let h = state.seed >>> 0;
  for (...) h = Math.imul(h ^ salt.charCodeAt(i), 16777619) >>> 0;
  h = (h + state.history.length * 2654435761) >>> 0;   // ← 用「历史长度」代表「进行到第几步」
  return createRng(h);
}
```

复现性目前是好的（已实测：同种子两次运行一致、JSON 往返后一致），但这是**靠运气维持的**：

1. `nextStep` 里 `drawEvent` 用 `rngFor(state, 'draw')` 时 `history.length = N`，而 `submitChoice` 用 `rngFor(...)` 时已是 `N+1`——**同一回合的两个阶段用了不同的随机坐标**，现在没撞车纯属巧合；
2. **任何改变"历史长度 ↔ 逻辑步数"对应关系的改动，都会整体平移整局的随机数，而且不会报错**。这类改动在正常迭代中很容易发生（比如加了"不写 history 的空转年"、或某分支不再 push history）。

**提案**：

```ts
export interface RunState {
  // ...
  /** 单调递增的逻辑步序号：每次事件推进（含自动结算、空转年）后 +1 */
  step: number;
}

export function rngFor(state: RunState, salt: string): Rng {
  let h = state.seed >>> 0;
  for (...) h = Math.imul(h ^ salt.charCodeAt(i), 16777619) >>> 0;
  h = (h + state.step * 2654435761) >>> 0;
  return createRng(h);
}
```

**注意**：改这一处会让**已有存档的随机序列整体改变**（存档里的 `step` 需要迁移时按 `history.length` 回填）。由于一期只有测试存档，建议直接 `RUN_VERSION 1 → 2` 并借此把 §3.3 的迁移机制一起做掉。

### 3.2 结构化 `StepResult.outcome`

**现状问题**（`pages/play/play.ts:323-373`）：页面从 `run.history` 末条取骰面来驱动动画：

```ts
const r = submitChoice(run, cyberpunkPack, event, index);
const last = run.history[run.history.length - 1];   // ← 回查历史
const dice = last?.dice;
...
// 动画结束时再回查一次
const dice = this.data.run?.history[this.data.run.history.length - 1]?.dice;
```

这既是**骰子动画竞态**（P1-4）的根源，也让"骰面与文字对不上"成为可能。

**提案**：让引擎直接返回本次结算的完整结果，页面不再回查：

```ts
export interface StepResult {
  state: RunState;
  event: LifeEvent | null;
  choices: Choice[];
  idleYears?: number;
  ended: boolean;
  /** 本次结算的完整结果（新增） */
  outcome?: {
    check?: CheckOutcome;
    /** 结果旁白（已含 crit 语气强化） */
    text?: string;
    /** 实际结算的收益 */
    delta?: Effects;
    /** 实际结算的代价（cost，若触发） */
    cost?: Effects;
    /** 因属性上限被丢弃的点数 → 已转存为 mood 的量（§1.5） */
    overflow?: Partial<Record<SemanticAttr, number>>;
    /** 死亡时填（含 hazard / debuff 两条新来源） */
    death?: { kind: DeathKind; cause?: string; text: string };
  };
}
```

**收益**：
1. **竞态从根上消失**——动画只消费 `outcome`，不再依赖 `history` 的时序；
2. 顺带让 §1.5 的"溢出转存"和 §2 的"代价"能在 UI 上表达；
3. 引擎与页面的**数据契约变明确**，页面不再需要知道 `history` 的内部结构；
4. 为 09 文档的 `hazard` / `debuff` 死亡来源提供统一的出口。

### 3.3 配套：存档迁移必须是逐级的（顺手修掉）

`engine/run-state.ts:323-326` 现在是：

```ts
export function migrateRunState(raw: RunState): RunState | null {
  if (raw.version === RUN_VERSION) return raw;
  return null;   // ← 版本不匹配直接判死
}
```

`play.ts:244-252` 把 `null` 统一显示成"上一局已经结束了"——**玩家会以为是自己玩完了，实际是存档被判了死刑**。而 `RUN_VERSION` 一旦从 1 升到 2（§3.1 就需要），**所有现存存档会被整体丢弃**。

**提案**：

```ts
const MIGRATIONS: Record<number, (r: any) => any> = {
  1: (r) => ({ ...r, step: r.history?.length ?? 0, debuffs: [], pending: [] }),
  // 2: (r) => ... 未来逐级追加
};

export function migrateRunState(raw: any): RunState | null {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.version > RUN_VERSION) return null;   // 存档比代码新 → 拒绝（并备份）
  let cur = raw;
  while (cur.version < RUN_VERSION) {
    const up = MIGRATIONS[cur.version];
    if (!up) return null;
    cur = up(cur);
    cur.version += 1;
  }
  return cur as RunState;
}
```

并且：**拒绝时先备份到 `run:backup:<runId>`**，UI 明确提示"旧版本存档无法读取"而不是"上一局已经结束了"。

---

## 4. 改动清单与顺序

| 序 | 改动 | 文件 | 量 | 依赖 |
|---|---|---|---|---|
| 1 | `Outcome.cost` + `costUnless`（§2） | `schema.ts`、`story-engine.ts`、`play.*` | **小（十几行）** | 无 |
| 2 | `RunState.step` + `rngFor` 改用 `step`（§3.1） | `run-state.ts`、`story-engine.ts` | 小 | 需存档迁移 |
| 3 | 逐级迁移 + 拒绝前备份（§3.3） | `run-state.ts`、`play.ts` | 小 | 与 2 一起做 |
| 4 | `StepResult.outcome` 结构化（§3.2） | `story-engine.ts`、`pages/play/*` | 中 | 顺带修 P1-4 竞态 |
| 5 | 收益递减 `diminishing()`（§1.3） | `story-engine.ts` `addSemanticAttr` | **小** | 需先定上限（D1） |
| 6 | 溢出转存 `trimByCap` + UI（§1.5） | `story-engine.ts`、`play.*` | 小 | 依赖 5 |
| 7 | `TIME_DRIFT` 净衰减推迟到 40 岁（§1.7） | `attributes.ts` | 小 | **必须与寿命重校准一起做** |

**建议顺序：1 → 2 → 3 → 4 → 5 → 6 → 7。** 前四项互不冲突且能立刻提升工程质量；后三项都属于数值层，必须等 D1（属性上限）拍板后统一校准。

---

## 5. 验收标准

| # | 条目 | 判定 |
|---|---|---|
| 1 | 去饱和生效 | `curvecheck.mjs` 的 **饱和度中位从 96% 降到 70% 以下**，且 p75 不再恒等于上限 |
| 2 | 成长感转正 | `curvecheck.mjs` 的 **41-60 岁属性中位 > 16-25 岁**（当前是 −1.4 的负增长） |
| 3 | 大成功不再被吃掉 | `trpgcheck.mjs` 的"属性剩余空间 ≤2 的检定占比"**从 45.9% 降到 20% 以下**；溢出转存必须可见（渲染断言） |
| 4 | 骰子中心性不变 | `trpgcheck.mjs` 的"运气跨度 : 能力跨度"**保持在 1.5~2.5 : 1**（当前 1.9） |
| 5 | DC 不失真 | 各档成功率落在目标 ±8pt 内（easy 85 / normal 70 / hard 50 / extreme 30） |
| 6 | `cost` 无破坏性 | 不写 `cost` 的事件行为**逐字节不变**（同种子对拍历史序列） |
| 7 | 复现性不回归 | 同种子两次运行一致 + JSON 往返一致（`probe.mjs`）——**改 `step` 后必须重跑** |
| 8 | 迁移可用 | 构造一个 v1 存档，验证能升到 v2 且 `step` 正确回填；v3（未来版本）存档被拒绝时**有备份且提示正确** |

---

## 6. 待确认项

| # | 项目 | 首版提案 | 说明 |
|---|---|---|---|
| 1 | 去饱和走哪条路 | **提案 A：收益递减**（不改上限、不改事件数值） | 改动最小且从根上解决；提案 B 需要三件事同时做 |
| 2 | 属性上限是否调整 | **暂不动（保持 20）** | 实测提高上限无益且会让 DC 更水 |
| 3 | 收益递减的曲线 | `gain × sqrt(剩余空间比例)` | 可换线性（更陡）或 `^0.75`（更缓） |
| 4 | 溢出转存目标 | **`mood`**（2:1） | 备选 `money`；`mood` 的优势是所有系统都有且自带均值回归 |
| 5 | `TIME_DRIFT` 衰减起点推迟到 40 岁 | 是 | **会改变寿命分布，须与 01 §6.3 一起重校准** |
| 6 | `cost` 是否参与 crit 缩放 | **不参与** | 与 `tags` / `death` 同类 |
| 7 | `RUN_VERSION` 是否借机升到 2 | 是 | 因为 `rngFor` 改 `step` 会平移随机序列 |

---

## 7. 确认记录

| # | 项目 | 结论 | 日期 |
|---|---|---|---|
| 1 | 「成功但有代价」`Outcome.cost` | **立项**，进正式文档 | 2026-10-08 用户指示 |
| 2 | 显式 `step` + 结构化 `outcome` | **立项**，进正式文档 | 2026-10-08 用户指示 |
| 3 | 属性去饱和 | **立项，但方案修正**：实测证明"提高上限"无效，改为**收益递减 + 溢出转存**；`floor(属性/2)` 保留 | 2026-10-08 实测 |
| 4 | 存档逐级迁移 + 拒绝前备份 | **立项**（`step` 改动的必要配套） | 2026-10-08 |

**仍待确认**：§6 的 7 项（其中第 3、5 项需要模拟校准后定稿）。
