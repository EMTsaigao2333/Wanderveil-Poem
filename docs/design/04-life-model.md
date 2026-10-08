# 0.4 人生模型与 WorldMeta 扩展

> 所属步骤：第 0 步 · 设计补缺
> 状态：**待用户确认**
> 上游决策：2026-09-23 决策 14「每个世界声明一种人生模型」
> 关联代码：需扩展 `miniprogram/engine/schema.ts` 的 `WorldMeta`、`STAGE_RANGE` 解析方式

---

## 1. 背景

现有 `schema.ts` 把年龄区间写死在 `STAGE_RANGE`（0→120），隐含「所有世界都是生到死」。

但按决策 14，**不是所有剧本都从生到死**：有些是轻小说式的「故事接故事」——从某个年龄切入，按章节推进，不一定覆盖完整一生。

因此需要引入**人生模型**概念，并由每个世界声明自己属于哪一种。

---

## 2. 人生模型

```ts
export type LifeModel =
  | 'full'       // 完整一生：0 岁 → 死亡，走六阶段
  | 'episodic';  // 片段连载：从起始年龄切入，按章节推进
```

| | `full` 完整一生 | `episodic` 片段连载 |
|---|---|---|
| 起点 | 固定 0 岁 | `startAge` 指定 |
| 推进单位 | 年龄（`years`，默认 1 年） | 章节（`chapter`） |
| 阶段划分 | 六阶段（幼年→老年） | 不按阶段，按章节 |
| 时间漂移 | 完整启用 | **默认关闭**（选择驱动，见 5.1） |
| 终局 | 死亡（年龄上限 / 属性跌破阈值 / 剧情死因） | 章节完结 / 多结局分支 |
| 总结图 | 完整人生时间线 + 六维雷达 | 章节时间线 + 结局分支图 |

---

## 3. WorldMeta 扩展

在现有字段基础上新增（标注 `NEW`）：

```ts
export type Genre = 'realistic' | 'fantasy' | 'mystery' | 'horror' | 'ancient';

export interface ChapterDef {
  id: string;
  name: string;
  /** 该章节的事件 id 池；为空表示沿用全局事件池 */
  eventIds?: string[];
  /** 章节完结条件 */
  endCondition?: Condition;
}

export interface WorldMeta {
  id: string;
  name: string;
  brief: string;
  opening: string;
  attrSystems: AttrSystemId[];
  backgrounds: BackgroundPack[];
  specialTags?: string[];
  currencyName?: string;
  deathCauses?: Record<string, string>;

  // ——— NEW ———
  /** 人生模型，每个世界声明一种 */
  lifeModel: LifeModel;
  /** 检定题材标签，供作者判断用哪个维度（见 01-heart6-spec.md） */
  genre: Genre;
  /** episodic 的起始年龄；full 世界省略（固定 0） */
  startAge?: number;
  /** episodic 的章节定义 */
  chapters?: ChapterDef[];
  /** 覆盖默认阶段区间；省略则用 STAGE_RANGE */
  stages?: Partial<Record<Stage, [number, number]>>;
  /** 时间漂移开关；episodic 可关闭 */
  timeDrift?: boolean;
  /** 该世界推荐的美术风格（多风格切换系统的「适配模式」用） */
  recommendedStyles?: string[];
  /** 全随机模式的特质池 id；省略则用通用池 */
  traitPoolId?: string;
  /** 事件池中允许出现的最低入池权重（用于 AI 线路过滤，见 06） */
  minEventWeight?: number;
}
```

> `recommendedStyles` 是 2026-09-21 已拍板的字段，本次一并落入正式 schema。

---

## 4. 阶段区间解析

`STAGE_RANGE` 从「唯一真相」降级为「默认值」，改为函数解析：

```ts
/** 默认阶段区间 */
export const DEFAULT_STAGE_RANGE: Record<Stage, [number, number]> = {
  childhood: [0, 6],
  teen: [7, 15],
  youth: [16, 25],
  prime: [26, 40],
  middle: [41, 60],
  elder: [61, 120],
};

/** 按世界解析阶段区间：世界覆盖优先，否则用默认 */
export function resolveStageRange(meta: WorldMeta): Record<Stage, [number, number]> {
  return { ...DEFAULT_STAGE_RANGE, ...(meta.stages ?? {}) };
}

/** 按年龄反查阶段 */
export function stageOfAge(age: number, range: Record<Stage, [number, number]>): Stage | null {
  for (const [stage, [from, to]] of Object.entries(range) as [Stage, [number, number]][]) {
    if (age >= from && age <= to) return stage;
  }
  return null;  // 超出上限 = 寿终
}
```

> 现有 `STAGE_RANGE` 常量保留导出以兼容已写好的事件库（赛博朋克），但引擎改为调用 `resolveStageRange`。

---

## 5. 事件字段扩展：`years`

`LifeEvent` 需要新增事件耗时字段，否则引擎只能默认「一事件 = 1 年」，一辈子会失真：

```ts
export interface LifeEvent {
  // ...原有字段
  /** 该事件消耗的年数，默认 1；跨度事件可写 2~5 */
  years?: number;
}
```

规则：

- `full` 模型：结算后 `age += years`（默认 1），再执行漂移
- `episodic` 模型：`years` 忽略，改为推进章节

### 5.1 episodic 不做时间漂移（已确认 2026-09-23）

`episodic` **默认关闭时间漂移**（`timeDrift` 缺省即 false）。原因：片段连载的重点是**选择带来的后果**，不是年龄的自然流逝 —— 属性变化应当来自玩家在事件里的抉择与因果链，而不是「又过了一年，所以行力 −1」。

后果：

- episodic 世界里 `TIME_DRIFT` 不参与结算；六维变化只来自事件 `effects`、特质 `offset`、心理状态量结算
- `years` 被忽略，`age` 不因事件推进而增长 —— `startAge` 是一个**固定坐标**，只用于 `require.age` 之类的条件判定
- 若某个 episodic 世界确实需要漂移（如长跨度章节），在 `WorldMeta` 显式写 `timeDrift: true` 覆盖默认

> `full` 模型的漂移曲线与寿命档位见 `01-heart6-spec.md` 第 6 节（2026-09-24 重定：普通底层 40 / 立住一条 55 / 两条都立住 60 / 改造叠加两条 65+）。

---

## 6. 各世界归属（现有 5 个世界）

| 世界 | 建议 lifeModel | 理由 |
|---|---|---|
| 赛博朋克（雾港） | `full` | 已写 146 条覆盖幼年→老年，是完整一生 |
| 三国 | 待定 | 若做「从生到死」则 full；若做「某段乱世经历」则 episodic |
| 现代美国底层 | `full` | 参考对象是完整人生叙事 |
| 中式古风仙侠 | 待定 | 修仙题材天然适合 episodic（多世/多章） |
| 日式西幻 | 待定 | 轻小说气质强，倾向 episodic |

> 表中「待定」项需你拍板，再落进各世界的 `world.ts`。已确认：赛博朋克、现代美国底层为 `full`。

---

## 7. 确认记录（2026-09-23）

| # | 项目 | 结论 |
|---|---|---|
| 1 | `episodic` 时间漂移 | **默认关闭**（选择驱动，见 5.1） |
| 2 | `episodic` 章节内年龄流动 | **不流动**，`startAge` 为固定坐标，只用于条件判定（见 5.1） |
| 3 | `years` 默认值与上限 | 默认 **1**，上限 **5** |
| 4 | 赛博朋克 / 现代美国底层 | `full` |

**仍待确认：**

1. 第 6 节三个世界的 `lifeModel` 归属：**三国 / 中式古风仙侠 / 日式西幻** —— 待你拍板后落进各自 `world.ts`
