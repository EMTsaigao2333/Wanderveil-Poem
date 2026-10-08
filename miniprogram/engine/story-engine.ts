/**
 * 幻行诗篇 · 剧情引擎
 *
 * 设计依据：docs/design/03-runstate-save.md 第 3 节「推进循环」
 *   取事件（连锁 / 池抽 / 空转年）→ 呈现（有选项等玩家，无选项自动结算）→ 应用 Effects →
 *   记录 history → 时间推进（full 走年龄 + 漂移，episodic 走章节）→ 病理结算 → 终局判定 → 自动存档
 *
 * 两套属性系统共用同一份事件库：事件只写语义键，本文件按 AttrSystem.map 折算到当前系统。
 */

import type {
  Choice,
  Condition,
  Effects,
  LifeEvent,
  Outcome,
  SemanticAttr,
  WorldMeta,
  WorldPack,
} from './schema';
import { resolveStageRange, stageOfAge, shouldTimeDrift } from './schema';
import type { AttrSystem } from '../data/attributes';
import {
  ATTR_SYSTEMS,
  CHECK_RULE,
  DEATH_THRESHOLD,
  MOOD_BASELINE,
  MOOD_REGRESSION,
  TIME_DRIFT,
} from '../data/attributes';
import type { TraitOption, TraitPool } from '../data/traits/types';
import { exclusiveGroupOf, traitWeight } from '../data/traits/types';
import type { ContentPrefs } from '../data/traits/index';
import { getTraitPool, traitById } from '../data/traits/index';
import {
  PATHOLOGY_CANDIDATES,
  PSYCHE_RANGE,
  pathologyTierOf,
} from '../data/traits/_psyche-state';
import type { HistoryEntry, RunState } from './run-state';
import { createRunState, pushHistory, saveRun } from './run-state';
import type { RollResult, Rng } from './roulette';
import { applyOffset, clampSix, createRng, offsetDelta, rollCharacter, traitOffsetOf } from './roulette';

/* ------------------------------------------------------------------ */
/* 确定性随机：同 (seed, 已记录事件数, salt) 得到同一串随机数            */
/* 存档只存 seed，不存随机数生成器状态，读档后仍可复现                  */
/* ------------------------------------------------------------------ */

export function rngFor(state: RunState, salt: string): Rng {
  let h = state.seed >>> 0;
  for (let i = 0; i < salt.length; i++) {
    h = Math.imul(h ^ salt.charCodeAt(i), 16777619) >>> 0;
  }
  h = (h + state.history.length * 2654435761) >>> 0;
  return createRng(h);
}

/* ------------------------------------------------------------------ */
/* 语义键 ↔ 当前属性系统                                               */
/* ------------------------------------------------------------------ */

/** 语义键在「当前属性系统」下的实际数值（多权重取加权和；'background' 取背景评分） */
export function semanticValue(state: RunState, key: SemanticAttr): number {
  const system = ATTR_SYSTEMS[state.attrSystem];
  const map = system.map[key];
  if (map === 'background') return state.backgroundScore;
  if (!map) return 0;
  let sum = 0;
  for (const [attrKey, weight] of Object.entries(map)) {
    sum += (state.attrs[attrKey] ?? 0) * weight;
  }
  return sum;
}

/** 按权重折算成实际增量：不足 1 的变化按 1 计（attributes.ts 约定） */
function scaleDelta(weight: number, value: number): number {
  const raw = weight * value;
  if (raw === 0) return 0;
  const rounded = Math.round(raw);
  if (rounded !== 0) return rounded;
  return raw > 0 ? 1 : -1;
}

/**
 * 把语义键的变化写到当前属性系统上。
 * raw = true 时原样累加（时间漂移用，允许小数：衰老是连续过程，不该被四舍五入成整数）
 */
function addSemanticAttr(state: RunState, key: SemanticAttr, value: number, raw = false): void {
  const system = ATTR_SYSTEMS[state.attrSystem];
  const map = system.map[key];
  if (!map) return;
  if (map === 'background') {
    state.backgroundScore = Math.max(0, Math.min(20, state.backgroundScore + value));
    return;
  }
  for (const [attrKey, weight] of Object.entries(map)) {
    const def = system.attrs.find((a) => a.key === attrKey);
    if (!def) continue;
    const delta = raw ? weight * value : scaleDelta(weight, value);
    const next = (state.attrs[attrKey] ?? 0) + delta;
    state.attrs[attrKey] = Math.max(def.min, Math.min(def.max, next));
  }
}

/* ------------------------------------------------------------------ */
/* 条件判定                                                           */
/* ------------------------------------------------------------------ */

/**
 * 条件是否满足。
 * sources / minWeight 是「事件入池」维度的条件，在事件池筛选里处理，这里忽略。
 */
export function isConditionMet(
  cond: Condition | undefined,
  state: RunState,
  _meta: WorldMeta,
  rng?: Rng,
): boolean {
  if (!cond) return true;
  if (cond.age) {
    if (state.age < cond.age[0] || state.age > cond.age[1]) return false;
  }
  if (cond.attr) {
    for (const [key, range] of Object.entries(cond.attr) as [SemanticAttr, [number, number]][]) {
      const v = semanticValue(state, key);
      if (v < range[0] || v > range[1]) return false;
    }
  }
  if (cond.tags && !cond.tags.every((t) => state.tags.includes(t))) return false;
  if (cond.notTags && cond.notTags.some((t) => state.tags.includes(t))) return false;
  if (cond.caps && !cond.caps.every((c) => state.caps.includes(c))) return false;
  if (cond.notCaps && cond.notCaps.some((c) => state.caps.includes(c))) return false;
  if (cond.chance !== undefined && rng && rng() >= cond.chance) return false;
  if (cond.all && !cond.all.every((c) => isConditionMet(c, state, _meta, rng))) return false;
  if (cond.any && !cond.any.some((c) => isConditionMet(c, state, _meta, rng))) return false;
  return true;
}

/* ------------------------------------------------------------------ */
/* 检定                                                               */
/* ------------------------------------------------------------------ */

export interface CheckOutcome {
  /** 骰面 1~20 */
  dice: number;
  /** 属性加值 floor(语义属性值 / 2) */
  mod: number;
  total: number;
  dc: number;
  result: 'crit' | 'success' | 'fail' | 'critFail';
}

/** 掷 1d20 + floor(属性/2) ≥ DC 即成功；骰面 20 大成功、骰面 1 大失败 */
export function rollCheck(state: RunState, attr: SemanticAttr, dc: number, rng: Rng): CheckOutcome {
  const dice = 1 + Math.floor(rng() * CHECK_RULE.dice);
  const mod = Math.floor(semanticValue(state, attr) / CHECK_RULE.modDivisor);
  const total = dice + mod;
  const result: CheckOutcome['result'] =
    dice >= CHECK_RULE.critSuccess
      ? 'crit'
      : dice <= CHECK_RULE.critFail
        ? 'critFail'
        : total >= dc
          ? 'success'
          : 'fail';
  return { dice, mod, total, dc, result };
}

/**
 * 大成功 / 大失败：作者没写专用分支时的自动强化。
 * 数值口径 —— 顺风的那一半 ×1.5，逆风的那一半 ×0.5（至少 ±1）；
 * 标签、特质、能力、生死一律不动（那些是作者写死的因果，不该被随机数改写）。
 */
const CRIT_SCALE = 1.5;
const CRIT_DAMP = 0.5;

/** 按「是否顺着玩家」缩放一个数值 */
function critValue(v: number, favor: boolean): number {
  if (v === 0) return 0;
  const goingWell = v > 0;
  const r = v * (goingWell === favor ? CRIT_SCALE : CRIT_DAMP);
  if (r > 0) return Math.max(1, Math.round(r));
  if (r < 0) return Math.min(-1, Math.round(r));
  return goingWell ? 1 : -1;
}

/** 大成功 / 大失败时对结果数值做强化（favor = true 即大成功） */
export function amplifyEffects(effects: Effects | undefined, favor: boolean): Effects | undefined {
  if (!effects) return undefined;
  const out: Effects = { ...effects };
  if (effects.attr) {
    const attr: Partial<Record<SemanticAttr, number>> = {};
    for (const [k, v] of Object.entries(effects.attr) as [SemanticAttr, number][]) {
      attr[k] = critValue(v, favor);
    }
    out.attr = attr;
  }
  if (effects.background !== undefined) out.background = critValue(effects.background, favor);
  if (effects.money !== undefined) out.money = critValue(effects.money, favor);
  if (effects.psyche) {
    const psyche: Partial<Record<(typeof PSYCHE_KEYS)[number], number>> = {};
    for (const key of PSYCHE_KEYS) {
      const v = effects.psyche[key];
      if (v !== undefined) psyche[key] = critValue(v, favor);
    }
    out.psyche = psyche;
  }
  return out;
}

/**
 * 按检定结果挑结果分支：
 * 大成功 / 大失败时优先用作者写死的分支（重点选项可在这里直接改变人生结局）；
 * 作者没写，就把普通分支的数值按上面的口径强化，并加一层语气。
 */
function resolveOutcome(choice: Choice, result: CheckOutcome['result']): Outcome {
  const crit = result === 'crit';
  const critFail = result === 'critFail';
  if (crit && choice.critSuccess) return choice.critSuccess;
  if (critFail && choice.critFail) return choice.critFail;
  const base = crit || result === 'success' ? choice.success : choice.fail;
  if (!crit && !critFail) return base ?? {};
  return { ...base, effects: amplifyEffects(base?.effects, crit) };
}

/** 大成功 / 大失败的文案强化（作者只写 success / fail，引擎在此加一层语气） */
function strengthen(text: string | undefined, result: CheckOutcome['result']): string | undefined {
  if (result === 'crit') return text ? `${text}\n——你做得远比想象中好。` : '——你做得远比想象中好。';
  if (result === 'critFail') return text ? `${text}\n——而事情正往最坏的方向滑去。` : '——而事情正往最坏的方向滑去。';
  return text;
}

/* ------------------------------------------------------------------ */
/* 死亡叙述                                                            */
/* 默认：事件写明的死因 → 查世界死因文案池 → 兜底句                      */
/* 二期接入本地 AI 后，用 setDeathNarrator 替换文案生成（接口已就位）      */
/* ------------------------------------------------------------------ */

/** 死因来源：事件写明 / 属性耗尽 / 寿终 */
export type DeathKind = 'event' | 'attr' | 'age';

export interface DeathContext {
  kind: DeathKind;
  /** 事件写明的死因 key（kind = 'event' 时有值） */
  cause?: string;
  /** 属性耗尽时是哪一项（kind = 'attr' 时有值） */
  attrKey?: string;
  age: number;
  worldId: string;
  tags: string[];
  /** 最近几条人生记录，供本地 AI 参考（最多 5 条） */
  history: HistoryEntry[];
  /** 兜底文案：本地 AI 未接入 / 生成失败时直接展示 */
  fallback: string;
}

/** 本地 AI 死亡叙述（二期接入）；返回空字符串即回退到 fallback */
export type DeathNarrator = (ctx: DeathContext) => string | undefined;

let deathNarrator: DeathNarrator | null = null;

/** 接入 / 卸载本地 AI 死亡叙述；传 null 恢复默认查文案池 */
export function setDeathNarrator(fn: DeathNarrator | null): void {
  deathNarrator = fn;
}

/** 死因文案：先按死因 key 查世界文案池，查不到就用原文 */
export function deathText(meta: WorldMeta, cause: string): string {
  return meta.deathCauses?.[cause] ?? cause;
}

/** 死亡的统一出口：先问本地 AI，没有再退回兜底文案 */
function resolveDeath(
  state: RunState,
  meta: WorldMeta,
  partial: Pick<DeathContext, 'kind' | 'cause' | 'attrKey' | 'fallback'>,
): string {
  const ctx: DeathContext = {
    ...partial,
    age: state.age,
    worldId: meta.id,
    tags: [...state.tags],
    history: state.history.slice(-5),
  };
  const custom = deathNarrator?.(ctx);
  return custom && custom.trim() ? custom : ctx.fallback;
}

/* ------------------------------------------------------------------ */
/* Effects 结算                                                        */
/* ------------------------------------------------------------------ */

/** 心理状态量里可被 Effects 修改的键（conditions 走 gainTraits / loseTraits） */
const PSYCHE_KEYS = ['resilience', 'trust', 'selfWorth', 'suppression'] as const;

/** 应用一组 Effects（属性 / 标签 / 钱 / 背景 / 心理 / 特质 / 死亡） */
export function applyEffects(state: RunState, effects: Effects | undefined, pack: WorldPack): void {
  if (!effects) return;
  const meta = pack.meta;
  const pool = getTraitPool(meta.traitPoolId ?? meta.id);

  if (effects.attr) {
    for (const [key, v] of Object.entries(effects.attr) as [SemanticAttr, number][]) {
      addSemanticAttr(state, key, v);
    }
  }
  if (effects.background) {
    state.backgroundScore = Math.max(0, Math.min(20, state.backgroundScore + effects.background));
  }
  if (effects.money) state.money += effects.money;
  if (effects.tags) {
    for (const t of effects.tags) if (!state.tags.includes(t)) state.tags.push(t);
  }
  if (effects.dropTags) {
    state.tags = state.tags.filter((t) => !effects.dropTags!.includes(t));
  }
  if (effects.psyche) {
    for (const key of PSYCHE_KEYS) {
      const v = effects.psyche[key];
      if (v === undefined) continue;
      const cur = state.psyche[key];
      state.psyche[key] = Math.max(PSYCHE_RANGE[0], Math.min(PSYCHE_RANGE[1], cur + v));
    }
  }
  if (effects.gainCaps) {
    for (const c of effects.gainCaps) if (!state.caps.includes(c)) state.caps.push(c);
  }
  if (effects.loseCaps) {
    state.caps = state.caps.filter((c) => !effects.loseCaps!.includes(c));
  }
  if (effects.loseTraits) {
    for (const id of effects.loseTraits) loseTrait(state, pool, id);
  }
  if (effects.gainTraits) {
    for (const id of effects.gainTraits) gainTrait(state, pool, id);
  }
  if (effects.death) {
    state.status = 'dead';
    state.deathCause = resolveDeath(state, meta, {
      kind: 'event',
      cause: effects.death,
      fallback: deathText(meta, effects.death),
    });
  }
}

/** 给六维加上一条特质的偏移（仅六维 / 全随机系统生效） */
function addTraitOffset(state: RunState, offset: ReturnType<typeof traitOffsetOf>, sign = 1): void {
  if (state.attrSystem === 'classic5') return;
  const def = ATTR_SYSTEMS[state.attrSystem].attrs[0];
  const range: [number, number] = def ? [def.min, def.max] : [0, 20];
  const six = clampSix(
    applyOffset(
      {
        insight: state.attrs.insight,
        resolve: state.attrs.resolve,
        empathy: state.attrs.empathy,
        ingenuity: state.attrs.ingenuity,
        reverie: state.attrs.reverie,
        vitality: state.attrs.vitality,
      },
      offset,
      sign,
    ),
    range,
  );
  for (const [k, v] of Object.entries(six)) {
    if (v !== undefined) state.attrs[k] = v;
  }
}

/** 获得特质：互斥检查 → 记档位 → （分档则升档补差额，否则叠加偏移） → 带出 tags / caps */
export function gainTrait(state: RunState, pool: TraitPool, id: string): boolean {
  const t = traitById(pool, id);
  if (!t) return false;
  // 互斥组：同组内只留一个（失明先天 / 后天只保留其一）
  const group = exclusiveGroupOf(id);
  if (group) {
    const clash = Object.keys(state.traitLevels).find((x) => exclusiveGroupOf(x) === group);
    if (clash) return false;
  }
  const tiers = t.tiers;
  const oldLevel = state.traitLevels[id];
  let level = tiers && tiers.length > 0 ? tiers[0].level : 1;
  if (oldLevel !== undefined) {
    if (!tiers || tiers.length === 0) return false; // 无分档的特质重复获得不做叠加
    const idx = tiers.findIndex((x) => x.level === oldLevel);
    const next = tiers[Math.min(idx + 1, tiers.length - 1)];
    level = next.level;
    if (level === oldLevel) return false;
  }
  const oldOffset = oldLevel !== undefined ? traitOffsetOf(t, oldLevel) : {};
  addTraitOffset(state, offsetDelta(oldOffset, traitOffsetOf(t, level)), 1);
  state.traitLevels[id] = level;
  if (t.tags) for (const x of t.tags) if (!state.tags.includes(x)) state.tags.push(x);
  if (t.caps) for (const x of t.caps) if (!state.caps.includes(x)) state.caps.push(x);
  if (!state.psyche.conditions.includes(id) && t.unlock?.requiresSuppression !== undefined) {
    state.psyche.conditions.push(id);
  }
  return true;
}

/** 失去特质：反向扣减偏移，并撤掉它带来的 tags / caps */
export function loseTrait(state: RunState, pool: TraitPool, id: string): boolean {
  const t = traitById(pool, id);
  const level = state.traitLevels[id];
  if (!t || level === undefined) return false;
  addTraitOffset(state, traitOffsetOf(t, level), -1);
  delete state.traitLevels[id];
  state.psyche.conditions = state.psyche.conditions.filter((x) => x !== id);
  if (t.caps) state.caps = state.caps.filter((c) => !t.caps!.includes(c));
  if (t.tags) state.tags = state.tags.filter((x) => !t.tags!.includes(x));
  return true;
}

/* ------------------------------------------------------------------ */
/* 心理状态量结算：压抑度过阈值 → 触发 / 升档 / 降档 / 移除病理          */
/* ------------------------------------------------------------------ */

/** 压抑度结算（每次事件后调用，见 02 文档第 4 节） */
export function settlePsyche(state: RunState, pool: TraitPool, rng: Rng): void {
  const tier = pathologyTierOf(state.psyche.suppression);
  const owned = state.psyche.conditions.filter((id) =>
    (PATHOLOGY_CANDIDATES as readonly string[]).includes(id),
  );

  // 压抑度回落到 1 档阈值以下 → 病理移除
  if (tier === 0) {
    for (const id of owned) loseTrait(state, pool, id);
    return;
  }

  // 首次触发：按「压抑度是否达标」筛出候选，加权随机挑一条
  if (owned.length === 0) {
    const cands = (PATHOLOGY_CANDIDATES as readonly string[])
      .map((id) => traitById(pool, id))
      .filter((t): t is TraitOption => !!t && (t.unlock?.requiresSuppression ?? 0) <= state.psyche.suppression);
    if (cands.length === 0) return;
    let total = 0;
    for (const t of cands) total += traitWeight(t);
    let roll = rng() * total;
    let hit = cands[cands.length - 1];
    for (const t of cands) {
      roll -= traitWeight(t);
      if (roll <= 0) {
        hit = t;
        break;
      }
    }
    const level = hit.tiers && hit.tiers.length > 0 ? Math.min(tier, hit.tiers.length) : 1;
    gainTraitAtLevel(state, hit, level);
    return;
  }

  // 已有病理：按压缩度档位升 / 降档（只补差额）
  for (const id of owned) {
    const t = traitById(pool, id);
    if (!t) continue;
    const cur = state.traitLevels[id];
    if (cur === undefined) continue;
    const maxLevel = t.tiers && t.tiers.length > 0 ? t.tiers[t.tiers.length - 1].level : 1;
    const want = Math.min(tier, maxLevel);
    if (want === cur) continue;
    addTraitOffset(state, offsetDelta(traitOffsetOf(t, cur), traitOffsetOf(t, want)), 1);
    state.traitLevels[id] = want;
  }
}

/** 按指定档位获得特质（病理首次触发用） */
function gainTraitAtLevel(state: RunState, t: TraitOption, level: number): void {
  const group = exclusiveGroupOf(t.id);
  if (group) {
    const clash = Object.keys(state.traitLevels).find((x) => exclusiveGroupOf(x) === group);
    if (clash) return;
  }
  addTraitOffset(state, traitOffsetOf(t, level), 1);
  state.traitLevels[t.id] = level;
  if (t.tags) for (const x of t.tags) if (!state.tags.includes(x)) state.tags.push(x);
  if (t.caps) for (const x of t.caps) if (!state.caps.includes(x)) state.caps.push(x);
  if (!state.psyche.conditions.includes(t.id)) state.psyche.conditions.push(t.id);
}

/* ------------------------------------------------------------------ */
/* 事件池                                                             */
/* ------------------------------------------------------------------ */

/** 事件来源（缺省视为官方事件） */
export function eventSource(ev: LifeEvent): string {
  return ev.source ?? 'official';
}

/**
 * 当前阶段的可抽事件池：
 * 未触发过的 once 事件 + require 全部满足 + 来源 / 权重门槛（AI 与玩家线路过滤）
 */
export function eventPool(state: RunState, pack: WorldPack, rng: Rng): LifeEvent[] {
  const meta = pack.meta;
  return pack.events.filter((ev) => {
    if (ev.stage !== state.stage) return false;
    if (ev.once !== false && state.firedOnce.includes(ev.id)) return false;
    if (ev.require) {
      if (ev.require.sources && !ev.require.sources.includes(ev.source ?? 'official')) return false;
      if (ev.require.minWeight !== undefined && (ev.weight ?? 1) < ev.require.minWeight) return false;
    }
    // 世界级最低入池权重：只压 AI / 玩家线路，官方事件不受影响
    if (meta.minEventWeight !== undefined && eventSource(ev) !== 'official' && (ev.weight ?? 1) < meta.minEventWeight) {
      return false;
    }
    return isConditionMet(ev.require, state, meta, rng);
  });
}

/** 抽一条事件：连锁优先，否则按权重加权随机；池空返回 null（= 空转年） */
export function drawEvent(state: RunState, pack: WorldPack, rng: Rng): LifeEvent | null {
  if (state.pendingNext) {
    const chained = pack.events.find((ev) => ev.id === state.pendingNext);
    state.pendingNext = undefined;
    if (chained) return chained;
  }
  const pool = eventPool(state, pack, rng);
  if (pool.length === 0) return null;
  let total = 0;
  for (const ev of pool) total += Math.max(0, ev.weight ?? 1);
  let roll = rng() * total;
  for (const ev of pool) {
    roll -= Math.max(0, ev.weight ?? 1);
    if (roll <= 0) return ev;
  }
  return pool[pool.length - 1];
}

/** 本次呈现给玩家的可用选项（require 不满足的选项不出现 —— 选项的存在来自过去的因果） */
export function visibleChoices(state: RunState, pack: WorldPack, event: LifeEvent): Choice[] {
  if (!event.choices) return [];
  const rng = rngFor(state, `choice:${event.id}`);
  return event.choices.filter((c) => isConditionMet(c.require, state, pack.meta, rng));
}

/* ------------------------------------------------------------------ */
/* 时间推进                                                           */
/* ------------------------------------------------------------------ */

/** 时间漂移：按年龄逐条应用 TIME_DRIFT + 心境均值回归（允许小数） */
function applyDrift(state: RunState): void {
  for (const rule of TIME_DRIFT) {
    const to = rule.to ?? 999;
    if (state.age < rule.from || state.age > to) continue;
    if (rule.perYear !== 0) addSemanticAttr(state, rule.attr, rule.perYear, true);
  }
  const mood = semanticValue(state, 'mood');
  const regress = (MOOD_BASELINE - mood) * MOOD_REGRESSION;
  if (regress !== 0) addSemanticAttr(state, 'mood', regress, true);
}

/** 推进时间：full 走年龄 + 漂移（years 默认 1、上限 5）；episodic 走章节、不漂移 */
export function advanceTime(state: RunState, pack: WorldPack, years?: number): void {
  const meta = pack.meta;
  if (meta.lifeModel === 'episodic') {
    advanceChapter(state, meta);
    return;
  }
  const n = Math.max(1, Math.min(5, years ?? 1));
  const range = resolveStageRange(meta);
  const drift = shouldTimeDrift(meta);
  for (let i = 0; i < n; i++) {
    state.age += 1;
    if (drift) applyDrift(state);
  }
  state.stage = stageOfAge(state.age, range) ?? state.stage;
}

/** episodic：章节推进（当前章事件出完或满足 endCondition 即进下一章；没有下一章 → 完结） */
export function advanceChapter(state: RunState, meta: WorldMeta): void {
  const chapters = meta.chapters;
  if (!chapters || chapters.length === 0) return;
  const cur = state.chapter ?? 1;
  const def = chapters[cur - 1];
  if (!def) {
    state.status = 'finished';
    return;
  }
  // 事件池里的候选都已「触发过」不算耗尽；只有当章节确有指定事件且全部触发过才算
  const ids = def.eventIds ?? [];
  const exhausted = ids.length > 0 && ids.every((id) => state.firedOnce.includes(id));
  const rng = rngFor(state, `chapter:${def.id}`);
  const done = exhausted || isConditionMet(def.endCondition, state, meta, rng);
  if (!done) return;
  const next = cur + 1;
  state.chapter = next;
  if (next > chapters.length) {
    state.chapter = chapters.length;
    state.status = 'finished';
  }
}

/* ------------------------------------------------------------------ */
/* 终局判定                                                           */
/* ------------------------------------------------------------------ */

/** 属性跌破阈值 / 年龄超出上限 / 剧情完结 → 结束这一局 */
export function checkEnd(state: RunState, pack: WorldPack): void {
  if (state.status !== 'playing') return;
  const meta = pack.meta;
  const system = ATTR_SYSTEMS[state.attrSystem];
  for (const def of system.attrs) {
    if ((state.attrs[def.key] ?? 0) <= DEATH_THRESHOLD) {
      state.status = 'dead';
      state.deathCause = resolveDeath(state, meta, {
        kind: 'attr',
        attrKey: def.key,
        fallback: meta.deathCauses?.default ?? '你的人生走到了尽头。',
      });
      return;
    }
  }
  if (meta.lifeModel === 'full') {
    const range = resolveStageRange(meta);
    if (state.age > range.elder[1]) {
      state.status = 'dead';
      state.deathCause = resolveDeath(state, meta, {
        kind: 'age',
        fallback: `寿终正寝。你活了 ${state.age} 年。`,
      });
    }
  }
}

/* ------------------------------------------------------------------ */
/* 开局                                                               */
/* ------------------------------------------------------------------ */

export interface StartOptions {
  attrSystem: RunState['attrSystem'];
  /** 随机种子；省略按时间戳 */
  seed?: number;
  /** 内容偏好（仅全随机模式的抽卡使用） */
  prefs?: ContentPrefs;
  /**
   * 全随机模式：开局向导已抽好的人物卡（含改写副线后的结果）。
   * 传入则不再重掷，人物与向导展示的完全一致；省略则按 seed 现抽。
   */
  roll?: RollResult;
  /** classic5 / heart6：玩家分配的属性值；省略则按 init 区间随机 roll */
  attrs?: Record<string, number>;
  /** 指定出身背景包 id；省略则随机 */
  backgroundId?: string;
  /** 覆盖 episodic 的起始年龄 */
  startAge?: number;
  /** 玩家起的名字 */
  name?: string;
}

/** 六维 / 五维系统的开局属性：区间随机 roll */
function rollAttrs(system: AttrSystem, rng: Rng): Record<string, number> {
  const out: Record<string, number> = {};
  for (const def of system.attrs) {
    out[def.key] = def.init[0] + Math.floor(rng() * (def.init[1] - def.init[0] + 1));
  }
  return out;
}

/** 开局：由开局向导的产出建成一局 RunState（07 文档第 5 节） */
export function startRun(pack: WorldPack, opts: StartOptions): RunState {
  const meta = pack.meta;
  const seed = opts.roll?.seed ?? opts.seed ?? Date.now();
  const rng = createRng(seed);
  const system = ATTR_SYSTEMS[opts.attrSystem];
  const range = resolveStageRange(meta);
  const age = meta.lifeModel === 'episodic' ? (opts.startAge ?? meta.startAge ?? 0) : 0;
  const pool = getTraitPool(meta.traitPoolId ?? meta.id);

  let attrs: Record<string, number> = {};
  let tags: string[] = [];
  let caps: string[] = [];
  let psyche = { ...pool.psycheBaseline, conditions: [] as string[] };
  let card = null as RunState['card'];
  let traitLevels: Record<string, number> = {};
  let background = meta.backgrounds.find((b) => b.id === opts.backgroundId) ?? null;

  if (opts.attrSystem === 'roulette') {
    // 向导已抽好的卡直接用（含改写副线后的结果）；否则按 seed 现抽
    const rolled = opts.roll ?? rollCharacter(pool, meta.lifeModel, {
      seed,
      prefs: opts.prefs,
      age,
      backgrounds: meta.backgrounds,
    });
    card = rolled.card;
    attrs = { ...(rolled.card.six as Record<string, number>) };
    tags = [...rolled.card.tags];
    caps = [...rolled.card.caps];
    psyche = { ...rolled.card.psyche, conditions: [...rolled.card.psyche.conditions] };
    traitLevels = { ...rolled.levels };
    if (!background) background = rolled.background;
  } else {
    attrs = opts.attrs ? { ...opts.attrs } : rollAttrs(system, rng);
    if (!background && meta.backgrounds.length > 0) {
      background = meta.backgrounds[Math.floor(rng() * meta.backgrounds.length)];
    }
  }

  // 开局属性下限 1：0 会被终局判定当场判死（出生即死），不给玩家这种体验
  for (const def of system.attrs) {
    const v = attrs[def.key];
    if (v === undefined) continue;
    attrs[def.key] = Math.max(1, Math.min(def.max, v));
  }

  const state = createRunState({
    worldId: meta.id,
    lifeModel: meta.lifeModel,
    attrSystem: opts.attrSystem,
    seed,
    age,
    stage: stageOfAge(age, range) ?? 'childhood',
    chapter: meta.lifeModel === 'episodic' ? 1 : undefined,
    attrs,
    hidden: system.hidden
      ? { [system.hidden.key]: system.hidden.init[0] + Math.floor(rng() * (system.hidden.init[1] - system.hidden.init[0] + 1)) }
      : {},
    money: 0,
    backgroundScore: 10,
    tags,
    caps,
    psyche,
    card,
    backgroundId: background?.id,
    name: opts.name,
  });
  state.traitLevels = traitLevels;

  // 出身背景包：语义键走映射，money / tags 直接注入
  if (background) {
    applyEffects(state, { attr: background.attr, money: background.money, tags: background.tags }, pack);
  }
  return state;
}

/* ------------------------------------------------------------------ */
/* 推进一步                                                           */
/* ------------------------------------------------------------------ */

export interface StepResult {
  state: RunState;
  /** 本轮事件；null = 空转年（池空，只推进时间） */
  event: LifeEvent | null;
  /** 事件本体给出的可见选项（require 已过滤）；自动事件为空数组 */
  choices: Choice[];
  /** 空转年数 */
  idleYears?: number;
  ended: boolean;
}

/** 取下一个事件并返回给界面；玩家抉择 / 自动结算分别走 submitChoice / autoResolve */
export function nextStep(state: RunState, pack: WorldPack): StepResult {
  if (state.status !== 'playing') {
    return { state, event: null, choices: [], ended: true };
  }
  const rng = rngFor(state, 'draw');
  const event = drawEvent(state, pack, rng);
  if (!event) {
    // 空转年：没有合适的事件，只让时间流动
    advanceTime(state, pack, 1);
    checkEnd(state, pack);
    saveRun(state);
    return { state, event: null, choices: [], idleYears: 1, ended: state.status !== 'playing' };
  }
  if (event.once !== false && !state.firedOnce.includes(event.id)) {
    state.firedOnce.push(event.id);
  }
  const choices = visibleChoices(state, pack, event);
  if (choices.length === 0) {
    // 自动事件（或选项条件全不满足）：直接结算事件自身的 effects
    return autoResolve(state, pack, event);
  }
  return { state, event, choices, ended: false };
}

/** 结算一次玩家选择 */
export function submitChoice(
  state: RunState,
  pack: WorldPack,
  event: LifeEvent,
  choiceIndex: number,
): StepResult {
  const choices = visibleChoices(state, pack, event);
  const choice = choices[choiceIndex];
  if (!choice) {
    return { state, event, choices, ended: state.status !== 'playing' };
  }
  const rng = rngFor(state, `roll:${event.id}:${choiceIndex}`);
  const entry: HistoryEntry = {
    age: state.age,
    eventId: event.id,
    title: event.title,
    choiceLabel: choice.label,
  };

  let effects: Effects | undefined;
  let next: string | undefined;
  if (choice.check) {
    const outcome = rollCheck(state, choice.check.attr, choice.check.dc, rng);
    entry.checkResult = outcome.result;
    entry.dice = [outcome.dice, outcome.mod];
    const branch = resolveOutcome(choice, outcome.result);
    effects = branch.effects;
    next = branch.next;
    entry.text = strengthen(branch.text, outcome.result);
  } else {
    effects = choice.effects;
    next = choice.next;
  }

  applyEffects(state, effects, pack);
  entry.effects = effects;
  pushHistory(state, entry);
  if (next) state.pendingNext = next;

  // 当场死亡（事件写明的死因）就不再推进时间：时间停在死的那一年
  if (state.status === 'playing') {
    settlePsyche(state, getTraitPool(pack.meta.traitPoolId ?? pack.meta.id), rngFor(state, `psyche:${event.id}`));
    advanceTime(state, pack, event.years);
    checkEnd(state, pack);
  }
  saveRun(state);
  return { state, event: null, choices: [], ended: state.status !== 'playing' };
}

/** 结算一条自动事件（无选项，或选项条件全不满足） */
export function autoResolve(state: RunState, pack: WorldPack, event: LifeEvent): StepResult {
  const entry: HistoryEntry = {
    age: state.age,
    eventId: event.id,
    title: event.title,
    effects: event.effects,
  };
  applyEffects(state, event.effects, pack);
  pushHistory(state, entry);
  if (state.status === 'playing') {
    settlePsyche(state, getTraitPool(pack.meta.traitPoolId ?? pack.meta.id), rngFor(state, `psyche:${event.id}`));
    advanceTime(state, pack, event.years);
    checkEnd(state, pack);
  }
  saveRun(state);
  return { state, event, choices: [], ended: state.status !== 'playing' };
}