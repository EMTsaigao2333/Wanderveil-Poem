/**
 * 幻行诗篇 · RunState 运行时状态 + 存档格式
 *
 * 设计依据：docs/design/03-runstate-save.md
 *   - RunState 是「一局人生」的完整运行时快照：引擎输入输出 / 存档格式 / 总结图数据源
 *   - history 只存摘要 + 事件 id，正文按 id 回查事件库（避免单个 storage key 超 1MB）
 *   - 保留最近 5 局，超出按 updatedAt 淘汰；云存档放二期
 */

import type { AttrSystemId, Debuff, Effects, LifeModel, Stage } from './schema';
import type { CharacterCard, PsycheState } from '../data/traits/types';

/** 一局的状态：进行中 / 已死亡 / 已完结（episodic 多结局用） */
export type RunStatus = 'playing' | 'dead' | 'finished';

/** 一次抉择的历史记录（总结图时间线） */
export interface HistoryEntry {
  age: number;
  eventId: string;
  title?: string;
  /** 玩家选择的选项文案；自动事件为空 */
  choiceLabel?: string;
  /** 检定结果：大成功 / 成功 / 失败 / 大失败 */
  checkResult?: 'crit' | 'success' | 'fail' | 'critFail';
  /** [骰面, 属性加值] */
  dice?: [number, number];
  /** 结果旁白 */
  text?: string;
  /** 本次产生的变化（总结图可展示关键节点） */
  effects?: Effects;
  /** 本次付出的「代价」（10 文档 §2：成功但有代价）；被 costUnless 免除时不记 */
  cost?: Effects;
}

/**
 * 人际关系羁绊 —— 因果链的载体。
 * 选项可以通过 require.tags 依赖它（如「有可以倾诉的人」），
 * 也可以直接通过 require.relation 检查某个对象是否存在且状态达标。
 */
export interface Relation {
  /** 关系对象 id（对应世界设定中的角色，如 cyberpunk 的「阿鸾」） */
  id: string;
  name: string;
  kind: 'kin' | 'friend' | 'lover' | 'mentor' | 'rival' | 'enemy' | 'acquaintance';
  /** 亲密度 0~20 */
  closeness: number;
  /** 是否仍然在世 / 仍在身边（母亲离开后置 false） */
  present: boolean;
  /** 该关系沉淀的标签，如 'has_close_friend' */
  tags?: string[];
}

export interface RunState {
  /** 存档版本号，用于迁移 */
  version: number;
  runId: string;
  /** 随机种子，保证同种子可复现 */
  seed: number;

  // —— 开局配置 ——
  worldId: string;
  lifeModel: LifeModel;
  attrSystem: AttrSystemId;
  /** 全随机模式下的人物卡；其余系统为 null */
  card: CharacterCard | null;
  /** 经典五维 / 心之禀赋模式下抽中的出身背景包 id（总结图展示用） */
  backgroundId?: string;
  /** 玩家给这段人生起的名字（07 文档第 7 步） */
  name?: string;

  // —— 当前状态 ——
  age: number;
  stage: Stage;
  /** episodic 世界的章节序号，从 1 开始 */
  chapter?: number;
  /** 当前属性系统的属性值：{ insight: 12, resolve: 8, ... } */
  attrs: Record<string, number>;
  /** 隐藏属性：{ fate: 11 } / { luck: 9 } */
  hidden: Record<string, number>;
  money: number;
  /** 六维系统下 charm / wealth 的落点 */
  backgroundScore: number;
  tags: string[];
  /** 能力标签（失明等），全随机模式从人物卡带入 */
  caps: string[];
  /** 心理状态量（见 02 文档第 4 节）：韧性 / 信任 / 自我价值 / 压抑度 / 已触发病理 */
  psyche: PsycheState;
  /** 人际关系羁绊（因果链的载体，见 02 文档第 12 节） */
  relations: Relation[];
  /**
   * 已获得特质的分档档位：{ clinic_depression: 2 }
   * 02 文档 7.1 的「分档升降只补差额」需要知道旧档位，03 文档未定义该字段，引擎暂存于此。
   */
  traitLevels: Record<string, number>;
  /**
   * 生效中的伤势 / 病根（09 文档 §5.2）：每年结算一次 perYear / costPerYear，
   * years 递减到期后移除，permanent 的永不自然痊愈。
   */
  debuffs: Debuff[];

  // —— 推演进度 ——
  /** 已触发过的 once 事件 id */
  firedOnce: string[];
  /** 连锁跳转目标（Outcome.next） */
  pendingNext?: string;
  history: HistoryEntry[];

  // —— 终局 ——
  status: RunStatus;
  deathCause?: string;

  // —— 元信息 ——
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/* 常量                                                                */
/* ------------------------------------------------------------------ */

/** 当前存档版本；结构变更时 +1 并补 migrateRunState 分支 */
export const RUN_VERSION = 2;

/** 本地存档 key 前缀 */
export const RUN_KEY_PREFIX = 'run:';
/** 当前局指针 */
export const RUN_CURRENT_KEY = 'run:current';
/** 存档索引（保留局数淘汰用） */
export const RUN_INDEX_KEY = 'run:index';
/** 存档位上限：每位玩家最多保留 5 个存档（超出不自动删除，由界面让玩家选择删哪个） */
export const MAX_RUNS = 5;

/** 一局存档的摘要（「继续人生」列表用，不读全文） */
export interface RunSummary {
  runId: string;
  worldId: string;
  lifeModel: LifeModel;
  age: number;
  status: RunStatus;
  updatedAt: number;
}

/** 开局向导产出的初值（07 文档第 5 节） */
export interface NewRunInput {
  worldId: string;
  lifeModel: LifeModel;
  attrSystem: AttrSystemId;
  seed: number;
  age: number;
  stage: Stage;
  chapter?: number;
  attrs: Record<string, number>;
  hidden: Record<string, number>;
  money: number;
  backgroundScore: number;
  tags: string[];
  caps: string[];
  psyche: PsycheState;
  card?: CharacterCard | null;
  backgroundId?: string;
  name?: string;
}

/* ------------------------------------------------------------------ */
/* 存储适配层                                                          */
/* 小程序里走 wx.setStorageSync；非小程序环境（批量模拟 / 单测）回落内存实现 */
/* ------------------------------------------------------------------ */

const memoryStore = new Map<string, unknown>();

function hasWxStorage(): boolean {
  return typeof wx !== 'undefined' && typeof wx.setStorageSync === 'function';
}

function storageGet<T>(key: string): T | undefined {
  if (hasWxStorage()) {
    const v = wx.getStorageSync(key);
    return v === '' || v === null || v === undefined ? undefined : (v as T);
  }
  return memoryStore.get(key) as T | undefined;
}

function storageSet(key: string, value: unknown): void {
  if (hasWxStorage()) {
    wx.setStorageSync(key, value);
    return;
  }
  memoryStore.set(key, value);
}

function storageRemove(key: string): void {
  if (hasWxStorage()) {
    wx.removeStorageSync(key);
    return;
  }
  memoryStore.delete(key);
}

/* ------------------------------------------------------------------ */
/* 创建与推进                                                          */
/* ------------------------------------------------------------------ */

/** 生成一个 runId（时间戳 + 随机尾数，保证本地唯一） */
export function newRunId(now = Date.now()): string {
  return `r${now.toString(36)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, '0')}`;
}

/** 开局：按向导产出的初值建一局 RunState */
export function createRunState(input: NewRunInput, now = Date.now()): RunState {
  return {
    version: RUN_VERSION,
    runId: newRunId(now),
    seed: input.seed,
    worldId: input.worldId,
    lifeModel: input.lifeModel,
    attrSystem: input.attrSystem,
    card: input.card ?? null,
    backgroundId: input.backgroundId,
    name: input.name,
    age: input.age,
    stage: input.stage,
    chapter: input.chapter,
    attrs: { ...input.attrs },
    hidden: { ...input.hidden },
    money: input.money,
    backgroundScore: input.backgroundScore,
    tags: [...input.tags],
    caps: [...input.caps],
    psyche: { ...input.psyche, conditions: [...input.psyche.conditions] },
    relations: [],
    traitLevels: {},
    debuffs: [],
    firedOnce: [],
    history: [],
    status: 'playing',
    createdAt: now,
    updatedAt: now,
  };
}

/** 追加一条人生记录 */
export function pushHistory(state: RunState, entry: HistoryEntry): void {
  state.history.push(entry);
}

/* ------------------------------------------------------------------ */
/* 存档读写                                                            */
/* ------------------------------------------------------------------ */

/** 存档位是否还有空位（开局向导应在建新局之前检查） */
export function hasFreeRunSlot(): boolean {
  const index = storageGet<string[]>(RUN_INDEX_KEY) ?? [];
  return index.length < MAX_RUNS;
}

export interface SaveResult {
  /** 是否已写入（存档位满、且这一局还没进索引时为 false） */
  ok: boolean;
  /** true = 5 个存档位已满，界面需提示玩家删掉一个旧存档 */
  full: boolean;
}

/**
 * 存一局（自动刷新 updatedAt 并维护索引）。
 * 存档位上限 5：**满了不会自动淘汰旧存档**，返回 { ok: false, full: true }，
 * 由界面提示玩家用 deleteRun() 删掉一个旧存档后再继续。
 * 已在索引中的局（含正在玩的这一局）随时可覆盖更新。
 */
export function saveRun(state: RunState, now = Date.now()): SaveResult {
  state.updatedAt = now;
  const index = storageGet<string[]>(RUN_INDEX_KEY) ?? [];
  const known = index.includes(state.runId);
  if (!known && index.length >= MAX_RUNS) return { ok: false, full: true };
  storageSet(RUN_KEY_PREFIX + state.runId, state);
  if (!known) index.push(state.runId);
  storageSet(RUN_INDEX_KEY, index);
  storageSet(RUN_CURRENT_KEY, state.runId);
  return { ok: true, full: false };
}

/**
 * 读一局；版本不匹配时走迁移，迁移不了返回 null（调用方提示「旧存档不可用」）
 */
export function loadRun(runId: string): RunState | null {
  const raw = storageGet<RunState>(RUN_KEY_PREFIX + runId);
  if (!raw) return null;
  return migrateRunState(raw);
}

/** 读「继续人生」指向的那一局 */
export function loadCurrentRun(): RunState | null {
  const runId = storageGet<string>(RUN_CURRENT_KEY);
  return runId ? loadRun(runId) : null;
}

/** 设置「继续人生」指针 */
export function setCurrentRun(runId: string): void {
  storageSet(RUN_CURRENT_KEY, runId);
}

/** 删一局（含索引与当前局指针清理） */
export function deleteRun(runId: string): void {
  storageRemove(RUN_KEY_PREFIX + runId);
  const index = (storageGet<string[]>(RUN_INDEX_KEY) ?? []).filter((id) => id !== runId);
  storageSet(RUN_INDEX_KEY, index);
  if (storageGet<string>(RUN_CURRENT_KEY) === runId) {
    storageRemove(RUN_CURRENT_KEY);
  }
}

/** 全部存档摘要，按最近更新倒序 */
export function listRuns(): RunSummary[] {
  const index = storageGet<string[]>(RUN_INDEX_KEY) ?? [];
  const out: RunSummary[] = [];
  for (const id of index) {
    const run = storageGet<RunState>(RUN_KEY_PREFIX + id);
    if (!run) continue;
    out.push({
      runId: run.runId,
      worldId: run.worldId,
      lifeModel: run.lifeModel,
      age: run.age,
      status: run.status,
      updatedAt: run.updatedAt,
    });
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * 版本迁移：**逐级**升级，升不动（结构不兼容）时返回 null。
 * v1 → v2：新增 `RunState.debuffs`（09 文档 §5.2），旧档补空数组即可，不影响已有进度。
 */
export function migrateRunState(raw: RunState): RunState | null {
  let cur = raw;
  if (cur.version === 1) {
    cur = { ...cur, debuffs: [], version: 2 };
  }
  // 未来版本继续在此按 version 逐级升级（迁移必须逐级，不能跳级判断）
  if (cur.version !== RUN_VERSION) return null;
  return cur;
}