/**
 * 幻行诗篇 · 特质池注册表
 *
 * 设计依据：docs/design/02-character-layer.md 第 15 节「数据文件规划」
 *
 * 用法：
 *   const pool = getTraitPool('cyberpunk');   // 通用池 + 该世界专属池合并
 *   const opts = getTraitsBySlot(pool, 'hair');
 *
 * 抽取流程（见 docs/design/05-roulette-mode.md）：
 *   主线槽逐个定格必抽；副线池先掷 poolChance，命中后按 traitWeight() 加权翻一张牌。
 */

import type { TraitOption, TraitPool, TraitSlot, TraitCategory, TraitPath, LifeModel } from './types';
import { traitWeight } from './types';
import {
  COMMON_SLOTS,
  COMMON_BASELINE,
  COMMON_BUDGET_CAP,
  COMMON_RANGE,
  COMMON_PSYCHE_BASELINE,
  COMMON_TRAITS_PART1,
} from './_common';
import { CYBERPUNK_SLOTS, CYBERPUNK_TRAITS } from './cyberpunk';

/** 通用池（world = '*'） */
export const COMMON_POOL: TraitPool = {
  world: '*',
  slots: COMMON_SLOTS,
  options: COMMON_TRAITS_PART1,
  baseline: COMMON_BASELINE,
  budgetCap: COMMON_BUDGET_CAP,
  range: COMMON_RANGE,
  psycheBaseline: COMMON_PSYCHE_BASELINE,
};

/** 赛博朋克池 = 通用 + 世界专属 */
export const CYBERPUNK_POOL: TraitPool = {
  world: 'cyberpunk',
  slots: [...COMMON_SLOTS, ...CYBERPUNK_SLOTS],
  options: [...COMMON_TRAITS_PART1, ...CYBERPUNK_TRAITS],
  baseline: COMMON_BASELINE,
  budgetCap: COMMON_BUDGET_CAP,
  range: COMMON_RANGE,
  psycheBaseline: COMMON_PSYCHE_BASELINE,
};

/** 世界 id → 池。未登记的世界回落到通用池 */
export const TRAIT_POOLS: Record<string, TraitPool> = {
  '*': COMMON_POOL,
  cyberpunk: CYBERPUNK_POOL,
};

/** 取某个世界的特质池；世界专属池不存在时回落通用池 */
export function getTraitPool(worldId?: string): TraitPool {
  if (worldId && TRAIT_POOLS[worldId]) return TRAIT_POOLS[worldId];
  return COMMON_POOL;
}

/** 取某槽位的全部候选（只含通用池与目标世界池的特质） */
export function getTraitsBySlot(pool: TraitPool, slot: TraitSlot): TraitOption[] {
  return pool.options.filter((t) => t.slot === slot);
}

/** 按 id 反查特质 */
export function traitById(pool: TraitPool, id: string): TraitOption | undefined {
  return pool.options.find((t) => t.id === id);
}

/**
 * 内容偏好：玩家在开局向导的「内容偏好」面板里逐项打开的特质 id。
 * 两项都缺省 = 全部关闭 —— 默认体验是「平凡的出生」，不会一开局就被抽到残疾或病理。
 * 面板支持按类别整组开关（把该类别全部 id 塞进来即可），也支持单条勾选。
 */
export interface ContentPrefs {
  /** 允许入池的重敏感特质 id（safety.sensitive） */
  sensitive?: string[];
  /** 允许入池的轻不适特质 id（safety.tender） */
  tender?: string[];
}

/** 抽取上下文：判断一条特质此刻是否可入池 */
export interface TraitContext {
  /** 人生模型，用于过滤 unlock.models */
  model: LifeModel;
  /** 该次抽取对应的年龄，用于过滤 unlock.minAge */
  age?: number;
  /** 当前压抑度，用于过滤病理 unlock.requiresSuppression */
  suppression?: number;
  /** 内容偏好，见 ContentPrefs。缺省即全部关闭 */
  prefs?: ContentPrefs;
}

/**
 * 开局池允许的获取路径（05 文档第 3 节）：
 *   full 生到死 —— 仅 innate；病理等后天特质只能由人生事件触发
 *   episodic 片段连载 —— innate + acquired，「这个人有故事」正是切入点
 * state 路径一律不入开局池。
 */
export function openingPaths(model: LifeModel): TraitPath[] {
  return model === 'episodic' ? ['innate', 'acquired'] : ['innate'];
}

/**
 * 一条特质此刻能否入池。
 * 本函数是入池判定的唯一入口，抽卡实现不要重复判断。
 */
export function canEnterOpeningPool(t: TraitOption, ctx: TraitContext): boolean {
  const u = t.unlock;
  const prefs = ctx.prefs ?? {};
  if (u?.models && !u.models.includes(ctx.model)) return false;
  const paths = openingPaths(ctx.model);
  if (!t.paths.some((p) => paths.includes(p))) return false;
  if (u?.minAge !== undefined && (ctx.age ?? 0) < u.minAge) return false;
  if (u?.requiresSuppression !== undefined) {
    if ((ctx.suppression ?? 0) < u.requiresSuppression) return false;
  }
  if (t.safety?.sensitive && !prefs.sensitive?.includes(t.id)) return false;
  if (t.safety?.tender && !prefs.tender?.includes(t.id)) return false;
  return true;
}

/** 该槽位此刻的可抽候选（已按上下文过滤） */
export function eligibleTraits(pool: TraitPool, slot: TraitSlot, ctx: TraitContext): TraitOption[] {
  return getTraitsBySlot(pool, slot).filter((t) => canEnterOpeningPool(t, ctx));
}

/** 该槽位候选的权重合计，供校验「槽位是否有可抽项」 */
export function slotWeightSum(options: TraitOption[]): number {
  return options.reduce((sum, t) => sum + traitWeight(t), 0);
}

/** 列出某类别下的全部候选，供「内容偏好」面板生成分组 */
export function listByCategory(pool: TraitPool, category: TraitCategory): TraitOption[] {
  return pool.options.filter((t) => t.safety?.category === category);
}

/** 把全部带内容标记的候选按类别分组返回（面板一次拿全，不必逐类查询） */
export function groupByCategory(pool: TraitPool): Record<string, TraitOption[]> {
  const out: Record<string, TraitOption[]> = {};
  for (const t of pool.options) {
    const c = t.safety?.category;
    if (!c) continue;
    (out[c] ??= []).push(t);
  }
  return out;
}

export * from './types';
export * from './_psyche-state';