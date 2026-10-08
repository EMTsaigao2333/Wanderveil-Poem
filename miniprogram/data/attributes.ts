/**
 * 幻行诗篇 · 属性系统
 *
 * 一期落地三套属性系统（开局可选）：
 *   1. classic5  经典五维   颜值 / 智力 / 体质 / 家境 / 快乐（+隐藏幸运）
 *   2. heart6    心之禀赋   洞见 / 持守 / 通感 / 机变 / 遐思 / 行力（+隐藏命途）
 *   3. roulette  全随机     沿用六维，但数值由转盘抽特质决定（见 05 文档）
 *
 * 【关键】事件库不直接写这些属性，而是写语义键（见 engine/schema.ts 的 SemanticAttr），
 * 由本文件的 map 把语义键折算到当前属性系统。因此一份事件库可同时跑多套系统。
 */

import type { AttrSystemId, SemanticAttr } from '../engine/schema';

/** 属性系统里的一条具体属性 */
export interface AttrDef {
  key: string;
  name: string;
  desc: string;
  min: number;
  max: number;
  /** 开局随机区间 */
  init: [number, number];
  /**
   * 致命属性白名单（09 文档 §3）：**只有 fatal 属性归零才等于死亡**，
   * 其余属性归零只是「困境」，不结束人生。缺省 = 非致命。
   */
  fatal?: boolean;
}

/** 属性系统定义 */
export interface AttrSystem {
  id: AttrSystemId;
  name: string;
  brief: string;
  attrs: AttrDef[];
  /** 隐藏属性（不显示，只影响判定） */
  hidden?: AttrDef;
  /**
   * 语义键 → 本系统属性权重表。
   * 权重可为小数，结算时按权重分配并四舍五入（不足 1 的变化按 1 计）。
   * 值为 `'background'` 表示该语义键在本系统下不落到属性，而落到「背景词条评分」。
   */
  map: Partial<Record<SemanticAttr, Record<string, number> | 'background'>>;
}

/** 经典五维 */
export const CLASSIC5: AttrSystem = {
  id: 'classic5',
  name: '经典五维',
  brief: '颜值 / 智力 / 体质 / 家境 / 快乐。直观易懂，适合第一次接触的玩家。',
  attrs: [
    { key: 'appearance', name: '颜值', desc: '外貌与外在吸引力，影响他人第一印象。', min: 0, max: 20, init: [4, 12] },
    { key: 'intelligence', name: '智力', desc: '学习、判断与洞察力。', min: 0, max: 20, init: [4, 12] },
    { key: 'constitution', name: '体质', desc: '身体与抗压能力，过低会病痛缠身。', min: 0, max: 20, init: [4, 12], fatal: true },
    { key: 'family', name: '家境', desc: '物质条件与社会资源。', min: 0, max: 20, init: [2, 14] },
    { key: 'happiness', name: '快乐', desc: '心境与精神状态。', min: 0, max: 20, init: [5, 12] },
  ],
  hidden: { key: 'luck', name: '幸运', desc: '隐藏属性，决定偶遇与意外的走向。', min: 0, max: 20, init: [3, 13] },
  map: {
    perception: { intelligence: 1 },
    will: { constitution: 0.5, happiness: 0.5 },
    empathy: { happiness: 0.7, appearance: 0.3 },
    ingenuity: { intelligence: 1 },
    reverie: { happiness: 1 },
    vitality: { constitution: 1 },
    charm: { appearance: 1 },
    wealth: { family: 1 },
    health: { constitution: 1 },
    mood: { happiness: 1 },
  },
};

/** 跑团六维「心之禀赋」 */
export const HEART6: AttrSystem = {
  id: 'heart6',
  name: '心之禀赋',
  brief: '只看内在：外貌与家境不入属性，改为开局背景词条。适合想要跑团检定手感的玩家。',
  attrs: [
    { key: 'insight', name: '洞见', desc: '感知、察言观色、发现隐藏线索。', min: 0, max: 20, init: [5, 13] },
    { key: 'resolve', name: '持守', desc: '意志、抗压、执念。低了容易走向崩坏。', min: 0, max: 20, init: [5, 13] },
    { key: 'empathy', name: '通感', desc: '共情与打动他人的能力。', min: 0, max: 20, init: [4, 12] },
    { key: 'ingenuity', name: '机变', desc: '应变与临场思考，危机时的额外选项。', min: 0, max: 20, init: [4, 12] },
    { key: 'reverie', name: '遐思', desc: '想象力与灵感，与世界异象交互的钥匙。', min: 0, max: 20, init: [3, 12] },
    { key: 'vitality', name: '行力', desc: '行动力与精力，能否主动踏出一步。', min: 0, max: 20, init: [4, 13], fatal: true },
  ],
  hidden: { key: 'fate', name: '命途', desc: '隐藏属性，由开局背景与属性倾向共同生成，决定偶遇与灾祸。', min: 0, max: 20, init: [3, 13] },
  map: {
    perception: { insight: 1 },
    will: { resolve: 1 },
    empathy: { empathy: 1 },
    ingenuity: { ingenuity: 1 },
    reverie: { reverie: 1 },
    vitality: { vitality: 1 },
    charm: 'background',
    wealth: 'background',
    health: { vitality: 1 },
    mood: { resolve: 0.5, reverie: 0.5 },
  },
};

/**
 * 转盘属性系统（全随机模式）
 * 它不创造新的属性名：输出仍是六维，差异只在于「开局如何得到数值」——
 * 转盘抽特质，特质直接定义六维（见 engine/roulette.ts 与 05-roulette-mode.md 第 1 节）。
 */
export const ROULETTE: AttrSystem = {
  id: 'roulette',
  name: '全随机',
  brief: '你无法选择自己是谁。转盘决定你的身体、出身与心性，也决定你的六维。',
  attrs: HEART6.attrs,
  hidden: HEART6.hidden,
  map: HEART6.map,
};

export const ATTR_SYSTEMS: Record<AttrSystemId, AttrSystem> = {
  classic5: CLASSIC5,
  heart6: HEART6,
  roulette: ROULETTE,
};

/** 玩家可见的隐藏属性文案（结算/总结图用） */
export const HIDDEN_ATTR_NOTE = '隐藏属性全程不显示，只影响判定结果。';

/* ------------------------------------------------------------------ */
/* 检定规则                                                            */
/* ------------------------------------------------------------------ */

export const CHECK_RULE = {
  /** 掷骰面数 */
  dice: 20,
  /** 属性修正 = floor(属性值 / 该除数) */
  modDivisor: 2,
  /** 骰面等于该值 => 大成功（success 结果强化） */
  critSuccess: 20,
  /** 骰面等于该值 => 大失败（fail 结果加剧） */
  critFail: 1,
  /** 基础成功率参考：DC 12 且属性 10 时约 65% */
  note: '掷 1d20 + floor(属性/2) ≥ DC 即成功；骰面 20 大成功，骰面 1 大失败。',
} as const;

/* ------------------------------------------------------------------ */
/* 时间漂移：每年结算一次，属性随年龄自然变化                            */
/* 规则写在语义键上，两套属性系统通用。                                  */
/* ------------------------------------------------------------------ */

export interface DriftRule {
  attr: SemanticAttr;
  /** 生效年龄区间 [from, to]，to 省略表示到人生结束 */
  from: number;
  to?: number;
  /** 每年变化值（可为小数） */
  perYear: number;
}

/**
 * 时间漂移：每年结算一次，属性随年龄自然变化。
 * 规则写在语义键上，两套属性系统通用。
 *
 * 平衡取向（见 01 文档第 6 节）：衰减从二十岁就开始，
 * 只「活着」的人会在四十岁前后耗尽；活得久是一种经营结果 ——
 * 立住帮派关系或自己的营生（+55 岁）、两条都立住（+60 岁）、
 * 义体改造叠加这两条（65 岁往后，因为维护义体要钱要门路）。
 */
export const TIME_DRIFT: DriftRule[] = [
  // 行力：少年时疯长，二十岁后开始逐年下滑
  { attr: 'vitality', from: 0, to: 17, perYear: 1 },
  { attr: 'vitality', from: 20, to: 59, perYear: -0.5 },
  { attr: 'vitality', from: 60, perYear: -1 },
  // 身体：与行力同步缓慢流失（合计 20~59 约 -0.75/年，是底层短寿的主因）
  { attr: 'health', from: 20, to: 59, perYear: -0.25 },
  { attr: 'health', from: 60, perYear: -1 },
  // 魅力：青年期到顶，之后逐年消退
  { attr: 'charm', from: 18, to: 25, perYear: 1 },
  { attr: 'charm', from: 26, perYear: -0.5 },
  // 认知类：二十岁前积累，老年衰退
  { attr: 'perception', from: 0, to: 20, perYear: 0.5 },
  { attr: 'perception', from: 66, perYear: -0.5 },
  { attr: 'ingenuity', from: 0, to: 20, perYear: 0.5 },
  { attr: 'ingenuity', from: 66, perYear: -0.5 },
  { attr: 'will', from: 7, to: 30, perYear: 0.5 },
  { attr: 'will', from: 66, perYear: -0.5 },
  // 心境：均值回归（高于 10 会降，低于 10 会升），基线由目标的 5 折半到 10 分制
  { attr: 'mood', from: 0, perYear: 0 },
];

/** 均值回归的基线值（0~20 制） */
export const MOOD_BASELINE = 10;
/** 均值回归强度：每年向基线靠拢的比例 */
export const MOOD_REGRESSION = 0.15;

/** 死亡判定阈值：属性跌到该值以下即触发死亡判定 */
export const DEATH_THRESHOLD = 0;
