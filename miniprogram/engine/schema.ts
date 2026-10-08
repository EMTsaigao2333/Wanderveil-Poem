/**
 * 幻行诗篇 · 剧情数据结构定义（schema）
 *
 * 【核心设计】事件库只写「语义属性键」(SemanticAttr)。
 * 具体落到哪套属性系统（经典五维 / 跑团六维 / 转盘）由 data/attributes.ts 的映射表决定，
 * 因此同一份事件库可以同时支持多套属性系统（开局可选）。
 */

// 仅取类型：心理状态量的定义与特质池同源（02 文档第 4 节），避免两处重复定义
import type { PsycheState } from '../data/traits/types';

/** 人生阶段 */
export type Stage = 'childhood' | 'teen' | 'youth' | 'prime' | 'middle' | 'elder';

/** 人生模型：full 完整一生（0 岁 → 死亡）/ episodic 片段连载（从 startAge 切入，按章节推进） */
export type LifeModel = 'full' | 'episodic';

/** 检定题材标签（01 文档第 5 节）：供作者判断该用哪个维度，不影响引擎结算 */
export type Genre = 'realistic' | 'fantasy' | 'mystery' | 'horror' | 'ancient';

/** 事件来源（06 文档 2.1） */
export type EventSource = 'official' | 'ai' | 'player';

/** 事件审查状态（06 文档 2.1）；official 事件无需审查 */
export type ReviewStatus = 'none' | 'pending' | 'approved' | 'rejected';

/**
 * 默认阶段年龄区间。
 * 04 文档：STAGE_RANGE 从「唯一真相」降级为默认值，世界可用 meta.stages 覆盖。
 */
export const DEFAULT_STAGE_RANGE: Record<Stage, [number, number]> = {
  childhood: [0, 6],
  teen: [7, 15],
  youth: [16, 25],
  prime: [26, 40],
  middle: [41, 60],
  elder: [61, 120],
};

/** @deprecated 兼容旧事件库导出；引擎请用 resolveStageRange(meta) 取世界实配区间 */
export const STAGE_RANGE = DEFAULT_STAGE_RANGE;

/** 阶段中文名（总结图 / 日志用） */
export const STAGE_NAME: Record<Stage, string> = {
  childhood: '幼年',
  teen: '少年',
  youth: '青年',
  prime: '壮年',
  middle: '中年',
  elder: '老年',
};

/**
 * 语义属性键 —— 事件库唯一允许使用的属性名。
 * perception 感知/洞察 / will 意志/持守 / empathy 共情/通感 / ingenuity 应变/机变
 * reverie 灵感/遐思 / vitality 行动/行力 / charm 外在魅力 / wealth 家资
 * health 身体 / mood 心境
 */
export type SemanticAttr =
  | 'perception'
  | 'will'
  | 'empathy'
  | 'ingenuity'
  | 'reverie'
  | 'vitality'
  | 'charm'
  | 'wealth'
  | 'health'
  | 'mood';

/** 属性系统 ID */
export type AttrSystemId = 'classic5' | 'heart6' | 'roulette';

/** 检定难度档位 */
export const DC = {
  easy: 10,
  normal: 13,
  hard: 16,
  extreme: 19,
} as const;

/**
 * 事故危险等级（09 文档 §4.2）：决定普通失败的严重度与是否可能致死。
 * none 日常 / low 挨揍熬夜 / mid 械斗手术 / high 坠落车祸 / lethal 机器爆炸
 */
export type HazardLevel = 'none' | 'low' | 'mid' | 'high' | 'lethal';

/**
 * 大失败致死率上限（09 文档 §4.3 第 1 条）：
 * 即使是 `lethal` 等级，也不允许「大失败必死」——必死会让 slider 式的人生没有喘息空间。
 */
export const LETHAL_CAP = 0.35;

/**
 * 伤势 / 病根（09 文档 §5.2）——失败的第一档代价。
 * 与「一次性扣属性」不同：它每一年都在咬属性 / 扣钱，玩家必须主动处理才能止血。
 */
export interface Debuff {
  id: string;
  /** 持续年数；与 permanent 二选一 */
  years?: number;
  /** 永久伤势（不可自然痊愈，只能靠特定事件移除） */
  permanent?: boolean;
  /** 生效期内的语义属性年变化（允许小数，走与 TIME_DRIFT 相同的叠加通道） */
  perYear?: Partial<Record<SemanticAttr, number>>;
  /** 生效期内的检定修正（负值） */
  checkPenalty?: number;
  /** 每年扣钱（治疗费 / 药费） */
  costPerYear?: number;
  /** 展示文案（心理状态量面板旁显示，如「肋骨未愈 · 还剩 2 年」） */
  label: string;
  /** 可移除它的方式（供作者与 AI 参考，引擎不强制） */
  cure?: 'rest' | 'money' | 'surgery' | 'none';
}

/** 属性/标签/金钱等变化集合 */
export interface Effects {
  /** 语义属性增减，例：{ perception: 2, mood: -1 } */
  attr?: Partial<Record<SemanticAttr, number>>;
  /** 获得的标签 */
  tags?: string[];
  /** 移除的标签 */
  dropTags?: string[];
  /** 货币（信用点 / 通用） */
  money?: number;
  /** 六维系统下 charm / wealth 变化的落点：背景词条评分 */
  background?: number;
  /** 死亡判定：填写死亡原因即当场结束人生 */
  death?: string;
  /** 心理状态量增减（02 文档第 4 节）：{ suppression: 2, trust: -1 } */
  psyche?: Partial<Record<keyof Omit<PsycheState, 'conditions'>, number>>;
  /** 获得特质（全随机模式）：按该特质 offset 增量加减六维，见 02 文档 7.1 */
  gainTraits?: string[];
  /** 失去特质：按该特质 offset 反向扣减六维 */
  loseTraits?: string[];
  /** 获得能力标签（失明 / 轮椅等），供后续事件 require.caps 使用 */
  gainCaps?: string[];
  /** 失去能力标签 */
  loseCaps?: string[];
  /** 挂上伤势 / 病根（09 文档 §5.2）；已持有同 id 的不重复挂 */
  debuff?: Debuff[];
}

/** 属性检定配置：掷 1d20 + 属性修正（floor(属性/2)）≥ dc 即成功；骰面 20 大成功，骰面 1 大失败 */
export interface Check {
  attr: SemanticAttr;
  dc: number;
}

/** 触发条件 */
export interface Condition {
  /** 年龄区间（闭区间） */
  age?: [number, number];
  /** 属性区间：{ perception: [7, 99] } 表示感知 ≥ 7 才触发 */
  attr?: Partial<Record<SemanticAttr, [number, number]>>;
  /** 需持有全部标签 */
  tags?: string[];
  /** 需不持有任何标签 */
  notTags?: string[];
  /** 额外概率 0~1 */
  chance?: number;
  /** 全部满足 */
  all?: Condition[];
  /** 任一满足 */
  any?: Condition[];
  /** 需持有全部能力标签（全随机模式的失明等），见 02 文档第 14 节 */
  caps?: string[];
  /** 需不持有任何能力标签 */
  notCaps?: string[];
  /** 金钱区间 [下限, 上限]（闭区间）——「买不起就选不了」；缺省不判 */
  money?: [number, number];
  /** 事件来源过滤：只从指定来源的事件中抽取（06 文档 2.3）【已实现】 */
  sources?: EventSource[];
  /** 入池权重下限（低于该值的事件不被抽中，06 文档 2.3）【已实现，数据零使用】 */
  minWeight?: number;
}

/** 检定结果分支（大成功 / 大失败由引擎在 success / fail 基础上自动强化） */
export interface Outcome {
  /** 结果旁白（可省略，省略时引擎用通用句式） */
  text?: string;
  effects?: Effects;
  /** 跳转到指定事件 id（省略则回到事件池继续推演） */
  next?: string;
  /**
   * 这一次结果的「代价」（10 文档 §2）：与 effects 同时结算。
   * success.cost = 成功但有代价（人生取舍）
   * fail.cost    = 失败的额外代价（等价于直接写进 fail.effects，留作显式表达）
   * ⚠ 代价是作者写死的因果，**不参与大成功 / 大失败的 ×1.5 / ×0.5 缩放**。
   */
  cost?: Effects;
  /** 代价的免除条件：填 'critSuccess' 表示大成功时免除（你两边都保住了） */
  costUnless?: 'critSuccess';
}

/** 玩家选项 */
export interface Choice {
  label: string;
  /** 选项出现条件（如属性达标才可见） */
  require?: Condition;
  /** 属性检定；本题库中所有玩家抉择都必须带检定 */
  check?: Check;
  /** 检定成功 */
  success?: Outcome;
  /** 检定失败 */
  fail?: Outcome;
  /** 大成功分支：省略时引擎对 success 结果做数值强化（见 01 检定规则） */
  critSuccess?: Outcome;
  /** 大失败分支：省略时引擎对 fail 结果做数值强化；重点选项可在此写 death 直接终结人生 */
  critFail?: Outcome;
  /**
   * 「重大变故」：本次选择的风险等级（09 文档 §4）。
   * 缺省 = 安全（普通失败只造成重伤）。仅对 fail 分支生效。
   */
  hazard?: HazardLevel;
  /**
   * 这一档事故在**普通失败**下的致死概率 0~1（09 文档 §4.3）。
   * 引擎在 fail 分支结算后按此概率二次判定，命中则当场结束人生。
   * ⚠ 只允许写在 `hazard: 'lethal'` 的选项上，且不得超过 0.10（审查规则，引擎按 LETHAL_CAP 兜底）。
   */
  failLethal?: number;
  /** 重点选项（关键抉择）：界面高亮为「关键抉择」 */
  major?: boolean;
  /** 无检定选项的确定结果（用于纯叙事型选项） */
  effects?: Effects;
  /** 无检定选项跳转 */
  next?: string;
  /** 该选项允许玩家自由输入线路（自定义选项入口）【仅预留：P2 见 06 文档，引擎零消费】 */
  allowCustomRoute?: boolean;
}

/** 一条人生事件 */
export interface LifeEvent {
  /** 全局唯一 id，命名规则：世界前缀_阶段_三位序号，例 cb_teen_007 */
  id: string;
  stage: Stage;
  /** 事件标题（总结图时间线展示） */
  title?: string;
  /** 正文，建议 40~80 字，支持 \n 换行 */
  text: string;
  /** 同池抽取权重，默认 1 */
  weight?: number;
  /** 是否一生仅触发一次，默认 true */
  once?: boolean;
  /** 触发条件 */
  require?: Condition;
  /** 有 choices = 玩家抉择事件；无 choices = 自动推演事件 */
  choices?: Choice[];
  /** 自动事件的固定结果 */
  effects?: Effects;
  /** 事件检索标签 */
  tags?: string[];

  // ——— 06 文档 2.1：AI / 玩家线路预留字段 ———
  /** 该事件消耗的年数，默认 1，上限 5（04 文档第 5 节）【已实现，事件库当前零使用】 */
  years?: number;
  /** 事件来源，默认 'official'【已实现：require.sources / minEventWeight 会读】 */
  source?: EventSource;
  /** 审查状态，默认 'none'；official 事件无需审查【仅预留，引擎零消费】 */
  reviewStatus?: ReviewStatus;
  /** 由哪一局生成（溯源用）【仅预留，引擎零消费】 */
  originRunId?: string;
  /** AI 判定的离谱度 0~1（0 = 完全合理）【仅预留，引擎零消费】 */
  absurdity?: number;
  /** AI 判定的趣味度 0~1【仅预留，引擎零消费】 */
  interest?: number;
  /** 玩家提出的原始线路文本（溯源 / 审查展示用）【仅预留，引擎零消费】 */
  playerInput?: string;
}

/**
 * 死亡原因文案池（09 文档 §4，2026-10-08 由 Record<string,string> 改为分池结构）。
 * 解析顺序：byCause（事件写明的死因 key）→ byAttr（属性耗尽时是哪一项）→ age（寿终）→ default。
 * 只有一个 default 是必填的——其余三池按世界需要补，缺省即落到 default。
 */
export interface DeathCausePool {
  /** 按属性 key（classic5 的 constitution / heart6 的 vitality 等） */
  byAttr?: Record<string, string>;
  /** 按事件写明的死因 key */
  byCause?: Record<string, string>;
  /** 寿终（年龄超出阶段上限） */
  age?: string;
  /** 兜底句 */
  default: string;
}

/** 开局背景包（roll 出来的出身词条，跑团系统下替代外貌 / 家境属性） */
export interface BackgroundPack {
  id: string;
  name: string;
  desc: string;
  /** 初始语义属性修正 */
  attr?: Partial<Record<SemanticAttr, number>>;
  /** 开局标签 */
  tags?: string[];
  /** 初始货币 */
  money?: number;
}

/** 世界元数据 */
export interface WorldMeta {
  id: string;
  name: string;
  /** 一句话世界观简介 */
  brief: string;
  /** 开局独白（进入世界时展示） */
  opening: string;
  /** 支持/推荐的属性系统 */
  attrSystems: AttrSystemId[];
  /** 开局背景包 */
  backgrounds: BackgroundPack[];
  /** 专属标签池（结局判定与检索用）【仅预留：引擎 0 处读取】 */
  specialTags?: string[];
  /** 世界专属资源名（如「信用点」）【仅预留：页面目前硬编码，P2 改为读它】 */
  currencyName?: string;
  /** 死亡原因文案池（分池结构，解析顺序见 DeathCausePool） */
  deathCauses?: DeathCausePool;

  // ——— 04 文档：人生模型与多风格扩展 ———
  /** 人生模型，每个世界声明一种 */
  lifeModel: LifeModel;
  /** 检定题材标签，供作者判断用哪个维度（01 文档第 5 节） */
  genre: Genre;
  /** episodic 的起始年龄；full 世界省略（固定 0） */
  startAge?: number;
  /** episodic 的章节定义 */
  chapters?: ChapterDef[];
  /** 覆盖默认阶段区间；省略则用 DEFAULT_STAGE_RANGE */
  stages?: Partial<Record<Stage, [number, number]>>;
  /** 时间漂移开关；episodic 缺省关闭（04 文档 5.1），full 缺省开启 */
  timeDrift?: boolean;
  /** 该世界推荐的美术风格（多风格切换系统的「适配模式」用）【仅预留，引擎零消费】 */
  recommendedStyles?: string[];
  /** 全随机模式的特质池 id；省略则按世界 id 取池 */
  traitPoolId?: string;
  /** 事件池中允许出现的最低入池权重（用于 AI 线路过滤，见 06 文档） */
  minEventWeight?: number;
}

/** episodic 世界的一章（04 文档第 3 节） */
export interface ChapterDef {
  id: string;
  name: string;
  /** 该章节的事件 id 池；为空表示沿用全局事件池 */
  eventIds?: string[];
  /** 章节完结条件 */
  endCondition?: Condition;
}

/** 按世界解析阶段区间：世界覆盖优先，否则用默认 */
export function resolveStageRange(meta: WorldMeta): Record<Stage, [number, number]> {
  return { ...DEFAULT_STAGE_RANGE, ...(meta.stages ?? {}) };
}

/** 按年龄反查阶段；返回 null 表示超出上限（寿终） */
export function stageOfAge(age: number, range: Record<Stage, [number, number]>): Stage | null {
  for (const [stage, [from, to]] of Object.entries(range) as [Stage, [number, number]][]) {
    if (age >= from && age <= to) return stage;
  }
  return null;
}

/** 是否启用时间漂移：full 默认开、episodic 默认关，世界可显式覆盖 */
export function shouldTimeDrift(meta: WorldMeta): boolean {
  if (meta.timeDrift !== undefined) return meta.timeDrift;
  return meta.lifeModel === 'full';
}

/** 一个世界的完整剧情包 */
export interface WorldPack {
  meta: WorldMeta;
  events: LifeEvent[];
}
