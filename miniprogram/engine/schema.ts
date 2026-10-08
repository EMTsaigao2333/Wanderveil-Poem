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
  /** 事件来源过滤：只从指定来源的事件中抽取（06 文档 2.3） */
  sources?: EventSource[];
  /** 入池权重下限（低于该值的事件不被抽中，06 文档 2.3） */
  minWeight?: number;
}

/** 检定结果分支（大成功 / 大失败由引擎在 success / fail 基础上自动强化） */
export interface Outcome {
  /** 结果旁白（可省略，省略时引擎用通用句式） */
  text?: string;
  effects?: Effects;
  /** 跳转到指定事件 id（省略则回到事件池继续推演） */
  next?: string;
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
  /** 重点选项（关键抉择）：界面高亮为「关键抉择」 */
  major?: boolean;
  /** 无检定选项的确定结果（用于纯叙事型选项） */
  effects?: Effects;
  /** 无检定选项跳转 */
  next?: string;
  /** 该选项允许玩家自由输入线路（自定义选项入口，P2 见 06 文档） */
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

  // ——— 06 文档 2.1：AI / 玩家线路预留字段（P0 只落类型，不做生成） ———
  /** 该事件消耗的年数，默认 1，上限 5（04 文档第 5 节） */
  years?: number;
  /** 事件来源，默认 'official' */
  source?: EventSource;
  /** 审查状态，默认 'none'；official 事件无需审查 */
  reviewStatus?: ReviewStatus;
  /** 由哪一局生成（溯源用） */
  originRunId?: string;
  /** AI 判定的离谱度 0~1（0 = 完全合理） */
  absurdity?: number;
  /** AI 判定的趣味度 0~1 */
  interest?: number;
  /** 玩家提出的原始线路文本（溯源 / 审查展示用） */
  playerInput?: string;
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
  /** 专属标签池（结局判定与检索用） */
  specialTags?: string[];
  /** 世界专属资源名（如「信用点」） */
  currencyName?: string;
  /** 死亡原因文案池：{ 死因标签: 文案 } */
  deathCauses?: Record<string, string>;

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
  /** 该世界推荐的美术风格（多风格切换系统的「适配模式」用） */
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
