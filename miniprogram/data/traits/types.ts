/**
 * 幻行诗篇 · 人物构建层类型定义
 *
 * 设计依据：docs/design/02-character-layer.md
 * 本文件只定义「人物构建层」的类型，不含剧情引擎类型（见 engine/schema.ts）。
 */

/** 特质槽位 */
export type TraitSlot =
  // —— 主线槽（逐个定格，必抽）——
  | 'gender'
  | 'height'
  | 'build'
  | 'hair'
  | 'eye'
  | 'vision'
  | 'looks'
  | 'personality'
  | 'morality'
  | 'origin'
  | 'startAge'
  // —— 副线池（命运牌，概率抽）——
  | 'bodyForm'
  | 'bodyFunc'
  | 'psyche'
  | 'psycheClinic'
  | 'aptitude'
  | 'social'
  /** 世界专属（G 组）：由世界池自行定义槽位含义，如赛博朋克的义体 / 神经污染 */
  | 'world';

/** 获取路径：先天 / 后天 / 状态 */
export type TraitPath = 'innate' | 'acquired' | 'state';

/** 人生模型 */
export type LifeModel = 'full' | 'episodic';

/** 六维偏移向量 */
export interface SixOffset {
  insight?: number;
  resolve?: number;
  empathy?: number;
  ingenuity?: number;
  reverie?: number;
  vitality?: number;
}

/** 稀有度 */
export type TraitRarity = 'common' | 'rare' | 'epic' | 'curse';

/** 特质的一档（有强度分档时使用；偏移 / 文案 / 提示词均按档独立存） */
export interface TraitTier {
  level: number;
  name: string;
  desc: string;
  offset: SixOffset;
  promptTags: string[];
  promptNegative: string[];
  moodTags: string[];
}

/** 可视化信息（总结图用，P0 不用于立绘） */
export interface TraitVisual {
  /** 主色，如发色 / 瞳色 #1B1B1B */
  color?: string;
  /** 异瞳第二色 */
  color2?: string;
  /** 数值型，如身高 cm */
  value?: number;
  /** 符号提示，如 'eye-off' 'heterochromia' */
  glyph?: string;
  /** 文字徽标，总结图上直接显示 */
  badge?: string;
}

/** 内容偏好面板的分组依据（玩家可按类别整组开关，也可单条勾选） */
export type TraitCategory =
  | 'looks'      // 外貌（肥胖 / 丑陋 / 龅牙 / 体毛 / 雀斑…）
  | 'senses'     // 感官（视 / 听 / 言语 / 嗅味 / 触痛）
  | 'limbs'      // 肢体（缺肢 / 截瘫 / 行动障碍）
  | 'internal'   // 内脏慢病（心肺 / 肠胃 / 免疫 / 内分泌）
  | 'neuro'      // 神经（癫痫 / 抽动 / 平衡 / 痛觉）
  | 'psyche'     // 心理病理（情绪 / 焦虑 / 创伤 / 强迫 / 睡眠 / 人格）
  | 'addiction'  // 成瘾（酒精 / 药物 / 赌博 / 烟草 / 游戏）
  | 'family'     // 家庭处境（孤儿 / 单亲 / 寄养 / 失和）
  | 'origin';    // 族裔与教育（少数族裔 / 移民 / 未受教育 / 辍学）

export interface TraitSafety {
  /** 重敏感：病理 / 残疾 / 成瘾 / 重疾。**默认关闭**，开启后权重 ×0.3 */
  sensitive?: boolean;
  /** 轻不适：肥胖 / 丑陋 / 龅牙 / 口吃 / 孤儿 / 单亲等。**默认关闭**，开启后权重 ×0.5 */
  tender?: boolean;
  /** 内容偏好面板的分组依据，见 TraitCategory */
  category?: TraitCategory;
  /** 展示用的中性文案，避免病理标签污名化 */
  neutralLabel?: string;
}

/** 解锁规则 */
export interface TraitUnlock {
  /** 仅在这些人生模型下可入开局池 */
  models?: LifeModel[];
  /** 该特质只能后天获得（等价于 paths 只含 'acquired'） */
  acquiredOnly?: boolean;
  /** 最小出现年龄 */
  minAge?: number;
  /** 心理病理：需压抑度达到阈值才可触发 */
  requiresSuppression?: number;
}

/** 一条特质 */
export interface TraitOption {
  id: string;
  name: string;
  desc: string;
  slot: TraitSlot;
  /** 获取路径，可多条 */
  paths: TraitPath[];
  rarity: TraitRarity;
  /** 显式抽取权重，省略则用 RARITY_WEIGHT */
  weight?: number;
  /** 数值预算成本，省略则用 RARITY_COST */
  cost?: number;

  /** 无分档时使用；有分档时以 tiers 为准 */
  offset: SixOffset;
  /** 有强度分档的特质；每档偏移与提示词独立存 */
  tiers?: TraitTier[];

  /** 正向提示词（绘图 AI 可见实体） */
  promptTags?: string[];
  /** 反向提示词（防止 AI「修复」特征） */
  promptNegative?: string[];
  /** 气质氛围提示词 */
  moodTags?: string[];

  /** 特质标签，供事件 require.tags 使用 */
  tags?: string[];
  /** 能力标签，供事件 require.caps 使用 */
  caps?: string[];
  visual?: TraitVisual;
  unlock?: TraitUnlock;
  safety?: TraitSafety;
  /** 归属世界；'*' 表示通用池 */
  world: string;
}

/** 槽位定义 */
export interface TraitSlotDef {
  slot: TraitSlot;
  name: string;
  /** 该槽抽取个数，默认 1 */
  picks: number;
  /** 主线槽 true；副线槽由 poolChance 决定 */
  required: boolean;
  /** 副线池的抽中概率 0~1 */
  poolChance?: number;
}

/** 心理状态量 */
export interface PsycheState {
  /** 韧性：抗打击能力 */
  resilience: number;
  /** 信任：对他人的开放度 */
  trust: number;
  /** 自我价值 */
  selfWorth: number;
  /** 压抑度：累积未释放的创伤 */
  suppression: number;
  /** 已触发的临床病理（后天型特质 id） */
  conditions: string[];
}

/** 特质池 */
export interface TraitPool {
  world: string;
  slots: TraitSlotDef[];
  options: TraitOption[];
  /** 六维基线 */
  baseline: SixOffset;
  /** 数值预算上限 */
  budgetCap: number;
  /** 六维合法区间 */
  range: [number, number];
  /** 心理状态量基线 */
  psycheBaseline: PsycheState;
}

/** 人物卡 */
export interface CharacterCard {
  seed: number;
  slots: Partial<Record<TraitSlot, string[]>>;
  traits: TraitOption[];
  six: SixOffset;
  psyche: PsycheState;
  budgetUsed: number;
  tags: string[];
  caps: string[];
  /** 文字版人物卡（P0 主要呈现形式） */
  summaryText: string;
}

/* ------------------------------------------------------------------ */
/* 常量                                                                */
/* ------------------------------------------------------------------ */

/** 稀有度默认抽取权重 */
export const RARITY_WEIGHT: Record<TraitRarity, number> = {
  common: 8,
  rare: 4,
  epic: 1.5,
  curse: 2,
};

/** 稀有度默认预算成本 */
export const RARITY_COST: Record<TraitRarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  curse: -1,
};

/** 重敏感系数：默认关闭，开启后权重压制到 0.3 */
export const SENSITIVE_WEIGHT_FACTOR = 0.3;
/** 轻不适系数：默认关闭，开启后权重压制到 0.5 */
export const TENDER_WEIGHT_FACTOR = 0.5;

/** 计算一条特质的实际抽取权重 */
export function traitWeight(t: TraitOption): number {
  const base = t.weight ?? RARITY_WEIGHT[t.rarity];
  if (t.safety?.sensitive) return base * SENSITIVE_WEIGHT_FACTOR;
  if (t.safety?.tender) return base * TENDER_WEIGHT_FACTOR;
  return base;
}

/** 计算一条特质的预算成本 */
export function traitCost(t: TraitOption): number {
  return t.cost ?? RARITY_COST[t.rarity];
}

/**
 * 互斥组：同组内只允许存在一个（先天 / 后天描述同一件事时不再叠加）
 * key 为组名，value 为组内特质 id 列表
 */
export const TRAIT_EXCLUSIVE_GROUP: Record<string, string[]> = {
  vision_blind: ['vision_blind_innate', 'vision_blind_acquired'],
  hearing_deaf: ['func_deaf_innate', 'func_deaf_acquired'],
  limb_missing_arm: ['func_limb_arm_innate', 'func_limb_arm_acquired'],
  limb_missing_leg: ['func_limb_leg_innate', 'func_limb_leg_acquired'],
  paralysis: ['func_paraplegia_innate', 'func_paraplegia_acquired'],
};

/** 反查：特质 id → 所属互斥组 */
export function exclusiveGroupOf(traitId: string): string | undefined {
  for (const [group, ids] of Object.entries(TRAIT_EXCLUSIVE_GROUP)) {
    if (ids.includes(traitId)) return group;
  }
  return undefined;
}