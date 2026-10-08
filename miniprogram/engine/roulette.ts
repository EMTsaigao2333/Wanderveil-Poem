/**
 * 幻行诗篇 · 全随机模式（转盘）抽卡
 *
 * 设计依据：docs/design/05-roulette-mode.md
 *   主线槽（10 个）逐个定格必抽 → 副线池（命运牌）先掷 poolChance 再翻牌 →
 *   互斥检查 → 合成六维（基线 + Σ 偏移，clamp 到 [0,20]）→ 生成人物卡
 *
 * 抽取流程与入池过滤：
 *   过滤一律走 data/traits/index.ts 的 canEnterOpeningPool()，本文件不重复判断
 *   「抽不中」与「池空」都表达为「无」，池内不列 none 条目
 */

import type { BackgroundPack, LifeModel } from './schema';
import type {
  CharacterCard,
  PsycheState,
  SixOffset,
  TraitOption,
  TraitPool,
  TraitSlot,
  TraitSlotDef,
} from '../data/traits/types';
import { exclusiveGroupOf, traitCost, traitWeight } from '../data/traits/types';
import type { ContentPrefs, TraitContext } from '../data/traits/index';
import { eligibleTraits } from '../data/traits/index';
import { PATHOLOGY_THRESHOLD } from '../data/traits/_psyche-state';

/** 确定性随机数发生器（同种子同结果，存档可复现） */
export type Rng = () => number;

/** mulberry32：小而稳的种子随机 */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* 六维偏移                                                            */
/* ------------------------------------------------------------------ */

/** 取特质当前的六维偏移（有分档时按档取，缺省第 1 档） */
export function traitOffsetOf(t: TraitOption, level?: number): SixOffset {
  if (t.tiers && t.tiers.length > 0) {
    const lv = level ?? t.tiers[0].level;
    const tier = t.tiers.find((x) => x.level === lv) ?? t.tiers[0];
    return tier.offset;
  }
  return t.offset ?? {};
}

/** 计算两个偏移的差额：分档升降只补差额（02 文档 7.1） */
export function offsetDelta(from: SixOffset, to: SixOffset): SixOffset {
  const keys: (keyof SixOffset)[] = ['insight', 'resolve', 'empathy', 'ingenuity', 'reverie', 'vitality'];
  const out: SixOffset = {};
  for (const k of keys) {
    const d = (to[k] ?? 0) - (from[k] ?? 0);
    if (d !== 0) out[k] = d;
  }
  return out;
}

/** 把偏移叠加到六维上（正负号由 sign 决定），不改变入参 */
export function applyOffset(six: SixOffset, offset: SixOffset, sign = 1): SixOffset {
  const keys: (keyof SixOffset)[] = ['insight', 'resolve', 'empathy', 'ingenuity', 'reverie', 'vitality'];
  const out: SixOffset = { ...six };
  for (const k of keys) {
    const v = offset[k];
    if (v) out[k] = (out[k] ?? 0) + v * sign;
  }
  return out;
}

/** 按池的合法区间 clamp 六维 */
export function clampSix(six: SixOffset, range: [number, number]): SixOffset {
  const keys: (keyof SixOffset)[] = ['insight', 'resolve', 'empathy', 'ingenuity', 'reverie', 'vitality'];
  const out: SixOffset = { ...six };
  for (const k of keys) {
    out[k] = Math.min(range[1], Math.max(range[0], out[k] ?? range[0]));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 抽取                                                                */
/* ------------------------------------------------------------------ */

export interface RollOptions {
  /** 随机种子；省略则按时间戳 */
  seed?: number;
  /** 内容偏好：默认空 = 敏感 / 轻不适全部关闭 */
  prefs?: ContentPrefs;
  /** 起始年龄（episodic 世界为 startAge），用于过滤 unlock.minAge */
  age?: number;
  /** 世界背景包：主线槽「出身」的候选来源（05 文档主线槽第 10 项） */
  backgrounds?: BackgroundPack[];
  /** 重抽：复用上一次结果，主线槽原样保留 */
  carry?: RollResult;
  /** 本次重新掷的副线槽（重抽只允许副线池） */
  rerollSlots?: TraitSlot[];
}

/** 转盘的一个槽位结果（供逐帧动画播放） */
export interface RollStep {
  slot: TraitSlot;
  name: string;
  required: boolean;
  /** 副线池是否掷中；主线槽恒为 true；池空也记 false（= 「无」） */
  hit: boolean;
  /** 抽到的特质；空数组即「无」 */
  traits: TraitOption[];
  /** 出身槽专用：抽中的背景包 */
  background?: BackgroundPack;
}

export interface RollResult {
  seed: number;
  card: CharacterCard;
  /** 抽中的出身背景包（origin 槽） */
  background: BackgroundPack | null;
  /** 分档特质的当前档位：{ cyber_chrome_level: 2 } */
  levels: Record<string, number>;
  steps: RollStep[];
}

/** 加权随机取一条；总权重为 0 时返回 null */
function pickWeighted<T>(items: T[], weightOf: (item: T) => number, rng: Rng): T | null {
  if (items.length === 0) return null;
  let total = 0;
  for (const it of items) total += Math.max(0, weightOf(it));
  if (total <= 0) return items[0];
  let roll = rng() * total;
  for (const it of items) {
    roll -= Math.max(0, weightOf(it));
    if (roll <= 0) return it;
  }
  return items[items.length - 1];
}

/** 分档特质在开局抽取时的档位：低档更常见（n 档权重 n…1） */
function pickLevel(t: TraitOption, rng: Rng): number {
  const tiers = t.tiers;
  if (!tiers || tiers.length === 0) return 1;
  const weights = tiers.map((_, i) => tiers.length - i);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < tiers.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return tiers[i].level;
  }
  return tiers[tiers.length - 1].level;
}

function ctxOf(model: LifeModel, opts: RollOptions): TraitContext {
  return {
    model,
    age: opts.age ?? 0,
    // episodic 允许开局携带轻度病理（05 文档第 3 节）；full 从 0 起步，病理一律靠后天触发
    suppression: model === 'episodic' ? PATHOLOGY_THRESHOLD.tier1 : 0,
    prefs: opts.prefs ?? {},
  };
}

/** 已选特质集合：用于互斥检查与去重 */
class Picked {
  readonly traits: TraitOption[] = [];

  /** 能否再加入该特质（同互斥组只留一个） */
  canAdd(t: TraitOption): boolean {
    if (this.traits.some((x) => x.id === t.id)) return false;
    const g = exclusiveGroupOf(t.id);
    if (!g) return true;
    return !this.traits.some((x) => exclusiveGroupOf(x.id) === g);
  }

  add(t: TraitOption): void {
    this.traits.push(t);
  }

  remove(id: string): void {
    const idx = this.traits.findIndex((x) => x.id === id);
    if (idx >= 0) this.traits.splice(idx, 1);
  }
}

/** 抽一个槽位的候选（已过滤 + 去重 + 互斥） */
function drawSlot(
  pool: TraitPool,
  def: TraitSlotDef,
  ctx: TraitContext,
  rng: Rng,
  picked: Picked,
  banned: Set<string>,
): TraitOption[] {
  const out: TraitOption[] = [];
  for (let i = 0; i < Math.max(1, def.picks); i++) {
    const cands = eligibleTraits(pool, def.slot, ctx).filter(
      (t) => !banned.has(t.id) && picked.canAdd(t),
    );
    const hit = pickWeighted(cands, traitWeight, rng);
    if (!hit) break;
    picked.add(hit);
    out.push(hit);
  }
  return out;
}

/** 抽出身槽：候选来自世界背景包（05 文档主线槽第 10 项） */
function drawOrigin(backgrounds: BackgroundPack[], rng: Rng): BackgroundPack | null {
  return pickWeighted(backgrounds, () => 1, rng);
}

/** 合成六维：基线 + Σ 特质偏移，再 clamp 到池区间（下限抬到 1，见下） */
export function composeSix(
  traits: TraitOption[],
  levels: Record<string, number>,
  pool: TraitPool,
): SixOffset {
  let six: SixOffset = { ...pool.baseline };
  for (const t of traits) {
    six = applyOffset(six, traitOffsetOf(t, levels[t.id]), 1);
  }
  // 出场下限 1：六维里任何一项为 0 都会被终局判定当场判死（出生即死），不给玩家这种体验
  return clampSix(six, [Math.max(1, pool.range[0]), pool.range[1]]);
}

/** 生成文字版人物卡摘要 */
function buildSummary(steps: RollStep[], background: BackgroundPack | null): string {
  const parts: string[] = [];
  if (background) parts.push(`出身：${background.name}`);
  for (const s of steps) {
    if (s.traits.length === 0) continue;
    parts.push(`${s.name}：${s.traits.map((t) => t.safety?.neutralLabel ?? t.name).join('、')}`);
  }
  return parts.join('；');
}

/** 从槽位结果汇总人物卡 */
function composeCard(
  pool: TraitPool,
  steps: RollStep[],
  levels: Record<string, number>,
  background: BackgroundPack | null,
): CharacterCard {
  const traits = steps.flatMap((s) => s.traits);
  const slots: Partial<Record<TraitSlot, string[]>> = {};
  for (const s of steps) {
    if (s.traits.length > 0) slots[s.slot] = s.traits.map((t) => t.id);
  }
  if (background) slots.origin = [background.id];

  const tags = new Set<string>();
  const caps = new Set<string>();
  for (const t of traits) {
    (t.tags ?? []).forEach((x) => tags.add(x));
    (t.caps ?? []).forEach((x) => caps.add(x));
  }
  (background?.tags ?? []).forEach((x) => tags.add(x));

  // 预算只统计「可重抽的副线池」成本：主线槽抽的是「命」，不参与预算（见问题清单）
  const budgetUsed = steps
    .filter((s) => !s.required)
    .flatMap((s) => s.traits)
    .reduce((sum, t) => sum + traitCost(t), 0);

  return {
    seed: 0,
    slots,
    traits,
    six: composeSix(traits, levels, pool),
    psyche: { ...pool.psycheBaseline },
    budgetUsed,
    tags: [...tags],
    caps: [...caps],
    summaryText: buildSummary(steps, background),
  };
}

/** 预算校验：超预算时重抽成本最高的非必需特质（最多 20 次） */
function enforceBudget(
  pool: TraitPool,
  steps: RollStep[],
  ctx: TraitContext,
  rng: Rng,
  picked: Picked,
): RollStep[] {
  const banned = new Set<string>();
  for (let attempt = 0; attempt < 20; attempt++) {
    const budget = steps
      .filter((s) => !s.required)
      .flatMap((s) => s.traits)
      .reduce((sum, t) => sum + traitCost(t), 0);
    if (budget <= pool.budgetCap) break;

    const sideSteps = steps.filter((s) => !s.required && s.traits.length > 0);
    if (sideSteps.length === 0) break;

    let target = sideSteps[0];
    let worst = -Infinity;
    for (const s of sideSteps) {
      for (const t of s.traits) {
        const c = traitCost(t);
        if (c > worst) {
          worst = c;
          target = s;
        }
      }
    }
    if (worst <= 0) break; // 全是无成本的负面特质，无可优化

    // 把该槽当前抽中的特质拉黑，再从已选集合里摘掉，重掷
    for (const t of target.traits) {
      banned.add(t.id);
      picked.remove(t.id);
    }
    const def = pool.slots.find((d) => d.slot === target.slot);
    const redrawn = def ? drawSlot(pool, def, ctx, rng, picked, banned) : [];
    target.traits = redrawn;
    target.hit = redrawn.length > 0;
  }
  return steps;
}

/**
 * 转盘抽卡：主线槽逐个定格必抽 → 副线池逐个掷「是否抽中」→ 预算 → 人物卡
 * 支持 carry（复用上一次结果）与 rerollSlots（只重掷指定副线槽）
 */
export function rollCharacter(
  pool: TraitPool,
  model: LifeModel,
  opts: RollOptions = {},
): RollResult {
  const seed = opts.seed ?? Date.now();
  const rng = createRng(seed);
  const ctx = ctxOf(model, opts);
  const picked = new Picked();
  const levels: Record<string, number> = {};
  const carrySteps = new Map<TraitSlot, RollStep>();
  for (const s of opts.carry?.steps ?? []) carrySteps.set(s.slot, s);
  for (const [id, lv] of Object.entries(opts.carry?.levels ?? {})) levels[id] = lv;

  const steps: RollStep[] = [];
  let background: BackgroundPack | null = opts.carry?.background ?? null;

  // —— 主线槽：逐个定格必抽（carry 时原样保留，主线槽是「命」不可改） ——
  for (const def of pool.slots.filter((d) => d.required)) {
    const carried = carrySteps.get(def.slot);
    if (carried) {
      steps.push(carried);
      for (const t of carried.traits) if (!levels[t.id]) levels[t.id] = pickLevel(t, rng);
      continue;
    }
    if (def.slot === 'origin' && opts.backgrounds && opts.backgrounds.length > 0) {
      background = drawOrigin(opts.backgrounds, rng);
      steps.push({
        slot: def.slot,
        name: def.name,
        required: true,
        hit: background !== null,
        traits: [],
        background: background ?? undefined,
      });
      continue;
    }
    const traits = drawSlot(pool, def, ctx, rng, picked, new Set());
    for (const t of traits) levels[t.id] = pickLevel(t, rng);
    steps.push({ slot: def.slot, name: def.name, required: true, hit: traits.length > 0, traits });
  }

  // —— 副线池：先掷「是否抽中」，中了才翻牌 ——
  for (const def of pool.slots.filter((d) => !d.required)) {
    const carried = carrySteps.get(def.slot);
    if (carried && !(opts.rerollSlots ?? []).includes(def.slot)) {
      steps.push(carried);
      for (const t of carried.traits) if (!levels[t.id]) levels[t.id] = pickLevel(t, rng);
      continue;
    }
    const hit = rng() < (def.poolChance ?? 0.5);
    if (!hit) {
      steps.push({ slot: def.slot, name: def.name, required: false, hit: false, traits: [] });
      continue;
    }
    const traits = drawSlot(pool, def, ctx, rng, picked, new Set());
    for (const t of traits) levels[t.id] = pickLevel(t, rng);
    // 掷中但池内无可抽候选（如默认设置下的 psycheClinic / bodyFunc）→ 判定为「无」
    steps.push({ slot: def.slot, name: def.name, required: false, hit: traits.length > 0, traits });
  }

  enforceBudget(pool, steps, ctx, rng, picked);

  // —— 心理状态量：基线 + 开局携带病理的修正（05 文档第 5 节） ——
  const psyche: PsycheState = { ...pool.psycheBaseline, conditions: [] };
  for (const t of picked.traits) {
    const req = t.unlock?.requiresSuppression;
    if (req !== undefined) {
      psyche.suppression = Math.max(psyche.suppression, req);
      psyche.conditions.push(t.id);
    }
  }

  const card = composeCard(pool, steps, levels, background);
  card.seed = seed;
  card.psyche = psyche;
  return { seed, card, background, levels, steps };
}

/**
 * 重抽一个副线槽（每局限 1 次，只能副线池；主线槽抽的是「命」，不可改）
 */
export function rerollSideSlot(
  prev: RollResult,
  pool: TraitPool,
  model: LifeModel,
  slot: TraitSlot,
  opts: RollOptions = {},
): RollResult {
  const def = pool.slots.find((d) => d.slot === slot);
  if (!def || def.required) return prev;
  const seed = opts.seed ?? createRng(prev.seed + 1)() * 1e9;
  return rollCharacter(pool, model, {
    ...opts,
    seed: Math.floor(seed) || prev.seed + 1,
    carry: prev,
    rerollSlots: [slot],
  });
}