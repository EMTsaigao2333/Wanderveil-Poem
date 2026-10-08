/**
 * 幻行诗篇 · 心理状态量常量
 *
 * 设计依据：docs/design/02-character-layer.md 第 4 节
 *
 * 心理不是有/无的标签，而是可累积、可释放的数值。
 * 核心量是 suppression（压抑度）：创伤事件累积它，被陪伴 / 宣泄释放它；
 * 累积过阈值即触发临床病理（后天型特质），并可分档加重。
 */

import type { PsycheState } from './types';

/** 心理状态量基线（每项起步值） */
export const PSYCHE_BASELINE: PsycheState = {
  resilience: 10,
  trust: 10,
  selfWorth: 10,
  suppression: 0,
  conditions: [],
};

/** 状态量合法区间 */
export const PSYCHE_RANGE: [number, number] = [0, 20];

/**
 * 病理触发阈值（按 suppression）
 * 过 1 档触发轻度、2 档升中度、3 档升重度；
 * 回落至阈值以下则降档，长期低于 1 档阈值则移除该病理。
 */
export const PATHOLOGY_THRESHOLD = {
  tier1: 8,
  tier2: 14,
  tier3: 20,
} as const;

/**
 * 病理分档映射：压抑度 → 档位
 * 返回 0 表示未触发
 */
export function pathologyTierOf(suppression: number): 0 | 1 | 2 | 3 {
  if (suppression >= PATHOLOGY_THRESHOLD.tier3) return 3;
  if (suppression >= PATHOLOGY_THRESHOLD.tier2) return 2;
  if (suppression >= PATHOLOGY_THRESHOLD.tier1) return 1;
  return 0;
}

/**
 * 病理候选池：压抑度触发时可命中的后天型病理特质 id。
 * 引擎按 unlock.requiresSuppression 与该表共同判定。
 */
export const PATHOLOGY_CANDIDATES = [
  'clinic_depression',
  'clinic_anxiety',
  'clinic_ptsd',
  'clinic_dissociation',
  'clinic_insomnia',
  'clinic_ocd',
] as const;

/** 各状态量的含义文案（总结图 / 人物卡展示用） */
export const PSYCHE_LABEL: Record<keyof Omit<PsycheState, 'conditions'>, string> = {
  resilience: '韧性',
  trust: '信任',
  selfWorth: '自我价值',
  suppression: '压抑',
};

/** 状态量的档位文案（0~20 分档） */
export function psycheTierLabel(value: number): string {
  if (value <= 3) return '极低';
  if (value <= 7) return '偏低';
  if (value <= 12) return '寻常';
  if (value <= 16) return '良好';
  return '极高';
}