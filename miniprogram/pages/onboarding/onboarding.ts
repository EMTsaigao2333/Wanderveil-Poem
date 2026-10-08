/**
 * 开局向导（07 文档）
 *
 * 六屏流程：选世界 → 选属性系统 → 内容偏好 → 抽取人物（转盘动画）→ 人物卡确认 → 起名。
 *   - 全随机模式：主线槽逐个定格展示（约 0.6s/个，可跳过），副线可在人物卡上改写一次
 *   - 经典五维 / 心之禀赋：开局属性按区间随机 roll，暂无重抽（点数方案待确认，见 07 文档第 7 节）
 *   - 内容偏好面板：9 类分组，每类可全开 / 全关，也可单条勾选；选择存本地，
 *     key 为 content:prefs —— 设置页将来共用同一份偏好（07 文档 3.3）
 *   - 结束时把开局配置（含已抽好的人物卡）写入 storage 交接给人生页，跳转 pages/play/play
 *
 * 按文档待确认项采用的 P0 默认：名字默认随机可改；性别不自选（全随机由性别槽决定）；
 * 心理状态量在人物卡上隐藏，避免开局信息过载。
 */

import type { AttrSystemId } from '../../engine/schema';
import { deleteRun, hasFreeRunSlot, listRuns, MAX_RUNS } from '../../engine/run-state';
import type { RollResult, RollStep } from '../../engine/roulette';
import { rollCharacter, rerollSideSlot } from '../../engine/roulette';
import { startRun } from '../../engine/story-engine';
import type { AttrSystem } from '../../data/attributes';
import { ATTR_SYSTEMS } from '../../data/attributes';
import type { ContentPrefs } from '../../data/traits/index';
import { getTraitPool, groupByCategory } from '../../data/traits/index';
import type { TraitCategory, TraitSlot } from '../../data/traits/types';
import { cyberpunkPack } from '../../data/worlds/cyberpunk/index';
import type { PendingStart } from '../../utils/pending-start';
import { PENDING_START_KEY } from '../../utils/pending-start';

type StepId = 'world' | 'system' | 'prefs' | 'build' | 'card' | 'name';

interface WorldOption {
  id: string;
  name: string;
  brief: string;
  model: string;
}

interface SystemOption {
  id: AttrSystemId;
  name: string;
  brief: string;
}

interface PrefItem {
  id: string;
  name: string;
  gate: 'sensitive' | 'tender';
  on: boolean;
}

interface PrefGroup {
  key: string;
  name: string;
  items: PrefItem[];
  allOn: boolean;
}

interface BuildRow {
  key: string;
  name: string;
  text: string;
  done: boolean;
}

interface CardRow {
  name: string;
  text: string;
}

interface AttrRow {
  key: string;
  name: string;
  value: number;
  pct: number;
}

interface SlotOption {
  slot: string;
  name: string;
}

/** 页面里只用到「点一个带 data 的元素」这一种事件 */
interface TapEvent {
  currentTarget: { dataset: { id?: string; key?: string; slot?: string } };
}

/* ------------------------------------------------------------------ */
/* 常量                                                                */
/* ------------------------------------------------------------------ */

const POOL = getTraitPool('cyberpunk');
const META = cyberpunkPack.meta;

const STEP_FLOW_ROULETTE: StepId[] = ['world', 'system', 'prefs', 'build', 'card', 'name'];
const STEP_FLOW_ROLL: StepId[] = ['world', 'system', 'prefs', 'card', 'name'];
const STEP_NAME: Record<StepId, string> = {
  world: '选择世界',
  system: '选择属性系统',
  prefs: '内容偏好',
  build: '抽取人物',
  card: '人物卡确认',
  name: '起名',
};

/** 内容偏好面板的类别顺序与中文名（02 文档第 10 节的 9 类） */
const CATEGORY_ORDER: TraitCategory[] = [
  'looks', 'senses', 'limbs', 'internal', 'neuro', 'psyche', 'addiction', 'family', 'origin',
];
const CATEGORY_NAME: Record<string, string> = {
  looks: '外貌',
  senses: '感官',
  limbs: '肢体',
  internal: '内脏慢病',
  neuro: '神经',
  psyche: '心理病理',
  addiction: '成瘾',
  family: '家庭处境',
  origin: '族裔与教育',
};

/** 内容偏好的本地存储 key（设置页将来共用，07 文档 3.3） */
const PREFS_KEY = 'content:prefs';

/** 起名池：雾港贫民窟语感；正式的按世界名库后续再扩 */
const NAME_POOL = [
  '阿拾', '小满', '零一', '灰雀', '白鸦', '陈默', '九斤', '阿貂',
  '林晚', '苏离', '老鬼', '半夏', '祝余', '柳三更', '秦九', '雾生',
];

/* 模块级向导中间态（单页面实例使用；离开页面时清理计时器） */
let wizardRoll: RollResult | null = null;
let wizardSeed = 0;
let wizardBackgroundId: string | undefined;
let wizardTimers: ReturnType<typeof setTimeout>[] = [];

function clearWizardTimers(): void {
  for (const t of wizardTimers) clearTimeout(t);
  wizardTimers = [];
}

/** 读本地内容偏好 */
function loadPrefs(): ContentPrefs {
  if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') return {};
  const v = wx.getStorageSync(PREFS_KEY) as ContentPrefs | '' | null | undefined;
  return v && typeof v === 'object' ? v : {};
}

/** 面板勾选状态 → ContentPrefs（只收集打开的 id，空 = 全部关闭） */
function prefsOf(groups: PrefGroup[]): ContentPrefs {
  const sensitive: string[] = [];
  const tender: string[] = [];
  for (const g of groups) {
    for (const i of g.items) {
      if (!i.on) continue;
      (i.gate === 'sensitive' ? sensitive : tender).push(i.id);
    }
  }
  return { sensitive, tender };
}

/** 一个转盘槽位的展示文案（出身槽展示背景包名，其余展示特质中性名或「无」） */
function stepText(s: RollStep): string {
  if (s.slot === 'origin') return s.background ? s.background.name : '无';
  if (!s.hit || s.traits.length === 0) return '无';
  return s.traits.map((t) => t.safety?.neutralLabel ?? t.name).join('、');
}

/** 人物卡分组行（出身 + 各槽位） */
function cardRowsOf(roll: RollResult): CardRow[] {
  const rows: CardRow[] = [];
  if (roll.background) rows.push({ name: '出身', text: roll.background.name });
  for (const s of roll.steps) {
    if (s.slot === 'origin') continue;
    rows.push({ name: s.name, text: stepText(s) });
  }
  return rows;
}

/** 属性条数据 */
function attrRowsOf(values: Record<string, number>, system: AttrSystem): AttrRow[] {
  return system.attrs.map((def) => {
    const value = Math.round((values[def.key] ?? 0) * 10) / 10;
    const span = def.max - def.min || 20;
    const pct = Math.max(0, Math.min(100, Math.round(((value - def.min) / span) * 100)));
    return { key: def.key, name: def.name, value, pct };
  });
}

function backgroundName(id: string | undefined): string {
  if (!id) return '—';
  return META.backgrounds.find((b) => b.id === id)?.name ?? id;
}

Component({
  data: {
    step: 'world' as StepId,
    stepLabel: '第 1 / 6 步',
    stepName: STEP_NAME.world,

    worlds: [
      { id: META.id, name: META.name, brief: META.brief, model: '完整一生' },
    ] as WorldOption[],
    worldId: '',
    worldOpening: '',
    systems: (['classic5', 'heart6', 'roulette'] as AttrSystemId[]).map((id) => ({
      id,
      name: ATTR_SYSTEMS[id].name,
      brief: ATTR_SYSTEMS[id].brief,
    })) as SystemOption[],
    systemId: 'heart6' as AttrSystemId,

    prefs: [] as PrefGroup[],
    prefsCount: 0,

    buildRows: [] as BuildRow[],
    building: false,

    cardRows: [] as CardRow[],
    systemName: '',
    previewAttrs: [] as AttrRow[],
    rerollLeft: 0,
    sideSlots: [] as SlotOption[],
    pickingSlot: false,

    name: '',
    note: '',
    saves: 0,
    maxRuns: MAX_RUNS,
  },

  lifetimes: {
    attached() {
      // 内容偏好：本地存过则沿用勾选状态，没存过则全部关闭（默认即安全）
      const saved = loadPrefs();
      const grouped = groupByCategory(POOL);
      const prefs: PrefGroup[] = CATEGORY_ORDER.filter((c) => (grouped[c] ?? []).length > 0).map(
        (c) => {
          const items: PrefItem[] = (grouped[c] ?? [])
            .filter((t) => t.safety?.sensitive || t.safety?.tender)
            .map((t) => {
              const gate: 'sensitive' | 'tender' = t.safety?.sensitive ? 'sensitive' : 'tender';
              const list = gate === 'sensitive' ? saved.sensitive : saved.tender;
              return {
                id: t.id,
                name: t.safety?.neutralLabel ?? t.name,
                gate,
                on: list?.includes(t.id) ?? false,
              };
            });
          return { key: c, name: CATEGORY_NAME[c] ?? c, items, allOn: items.every((i) => i.on) };
        },
      );
      this.setData({ prefs, prefsCount: this.countPrefs(prefs), saves: listRuns().length });
    },
  },

  pageLifetimes: {
    /** 从人生页返回时刷新存档位读数 */
    show() {
      this.setData({ saves: listRuns().length });
    },
  },

  methods: {
    /* —— 步骤跳转 —— */

    setStep(step: StepId) {
      const flow = this.data.systemId === 'roulette' ? STEP_FLOW_ROULETTE : STEP_FLOW_ROLL;
      const idx = Math.max(0, flow.indexOf(step));
      this.setData({ step, stepLabel: `第 ${idx + 1} / ${flow.length} 步`, stepName: STEP_NAME[step] });
    },

    onBackStep() {
      const flow = this.data.systemId === 'roulette' ? STEP_FLOW_ROULETTE : STEP_FLOW_ROLL;
      const idx = flow.indexOf(this.data.step);
      if (idx <= 0) return;
      clearWizardTimers();
      this.setData({ building: false, note: '' });
      this.setStep(flow[idx - 1]);
    },

    onPickWorld(e: TapEvent) {
      const id = e.currentTarget.dataset.id;
      if (id !== META.id) return;
      this.setData({ worldId: id, worldOpening: META.opening, note: '' });
    },

    onNextFromWorld() {
      if (!this.data.worldId) return;
      this.setStep('system');
    },

    onPickSystem(e: TapEvent) {
      const id = e.currentTarget.dataset.id as AttrSystemId | undefined;
      if (id !== 'classic5' && id !== 'heart6' && id !== 'roulette') return;
      this.setData({ systemId: id, note: '' });
      this.setStep('prefs');
    },

    /* —— 内容偏好 —— */

    countPrefs(groups: PrefGroup[]): number {
      return groups.reduce((n, g) => n + g.items.filter((i) => i.on).length, 0);
    },

    onToggleItem(e: TapEvent) {
      const gkey = e.currentTarget.dataset.key;
      const id = e.currentTarget.dataset.id;
      const prefs = this.data.prefs.map((g) => {
        if (g.key !== gkey) return g;
        const items = g.items.map((i) => (i.id === id ? { ...i, on: !i.on } : i));
        return { ...g, items, allOn: items.every((i) => i.on) };
      });
      savePrefsSafe(prefsOf(prefs));
      this.setData({ prefs, prefsCount: this.countPrefs(prefs) });
    },

    onToggleGroup(e: TapEvent) {
      const gkey = e.currentTarget.dataset.key;
      const prefs = this.data.prefs.map((g) => {
        if (g.key !== gkey) return g;
        const on = !g.allOn;
        return { ...g, allOn: on, items: g.items.map((i) => ({ ...i, on })) };
      });
      savePrefsSafe(prefsOf(prefs));
      this.setData({ prefs, prefsCount: this.countPrefs(prefs) });
    },

    /* —— 抽取 —— */

    onGoBuild() {
      if (this.data.systemId === 'roulette') {
        this.setStep('build');
        this.build();
        return;
      }
      // 经典五维 / 心之禀赋：直接按种子出预览（人生页用同一种子复现）
      wizardSeed = Date.now();
      this.toCard();
      this.setStep('card');
    },

    /** 转盘抽取 + 逐槽定格动画（约 0.6s/槽，可跳过） */
    build() {
      clearWizardTimers();
      const seed = Date.now();
      const prefs = prefsOf(this.data.prefs);
      wizardRoll = rollCharacter(POOL, META.lifeModel, {
        seed,
        prefs,
        age: 0,
        backgrounds: META.backgrounds,
      });
      wizardSeed = seed;
      const rows: BuildRow[] = wizardRoll.steps.map((s) => ({
        key: s.slot,
        name: s.name,
        text: stepText(s),
        done: false,
      }));
      this.setData({ buildRows: rows, building: true });

      rows.forEach((_, i) => {
        wizardTimers.push(
          setTimeout(() => {
            this.setData({ [`buildRows[${i}].done`]: true });
            if (i === rows.length - 1) {
              wizardTimers.push(setTimeout(() => this.setData({ building: false }), 500));
            }
          }, 650 * (i + 1)),
        );
      });
    },

    onSkipAnim() {
      clearWizardTimers();
      const buildRows = this.data.buildRows.map((r) => ({ ...r, done: true }));
      this.setData({ buildRows, building: false });
    },

    onToCard() {
      this.toCard();
      this.setStep('card');
    },

    /** 汇总人物卡（转盘用已抽好的卡；其余系统用同种子预览一局） */
    toCard() {
      const systemId = this.data.systemId;
      if (systemId === 'roulette' && wizardRoll) {
        wizardBackgroundId = wizardRoll.background?.id;
        // 属性面板用引擎真实建局后的值：出身背景包会在开局时追加属性加成
        const preview = startRun(cyberpunkPack, {
          attrSystem: 'roulette',
          seed: wizardRoll.seed,
          prefs: prefsOf(this.data.prefs),
          roll: wizardRoll,
        });
        this.setData({
          cardRows: cardRowsOf(wizardRoll),
          systemName: ATTR_SYSTEMS.roulette.name,
          previewAttrs: attrRowsOf(preview.attrs, ATTR_SYSTEMS.roulette),
          rerollLeft: 1,
          sideSlots: wizardRoll.steps
            .filter((s) => !s.required)
            .map((s) => ({ slot: s.slot, name: s.name })),
          pickingSlot: false,
        });
        return;
      }
      const run = startRun(cyberpunkPack, { attrSystem: systemId, seed: wizardSeed, prefs: prefsOf(this.data.prefs) });
      this.setData({
        cardRows: [{ name: '出身', text: backgroundName(run.backgroundId) }],
        systemName: ATTR_SYSTEMS[systemId].name,
        previewAttrs: attrRowsOf(run.attrs, ATTR_SYSTEMS[systemId]),
        rerollLeft: 0,
        sideSlots: [],
        pickingSlot: false,
      });
    },

    /* —— 重抽（仅全随机模式，副线池一次） —— */

    onToggleSlotPicker() {
      this.setData({ pickingSlot: !this.data.pickingSlot });
    },

    onPickRerollSlot(e: TapEvent) {
      const slot = e.currentTarget.dataset.slot as TraitSlot | undefined;
      if (!slot || !wizardRoll || this.data.rerollLeft <= 0) return;
      const next = rerollSideSlot(wizardRoll, POOL, META.lifeModel, slot, {
        prefs: prefsOf(this.data.prefs),
        age: 0,
        backgrounds: META.backgrounds,
      });
      wizardRoll = next;
      wizardSeed = next.seed;
      wizardBackgroundId = next.background?.id;
      const preview = startRun(cyberpunkPack, {
        attrSystem: 'roulette',
        seed: next.seed,
        prefs: prefsOf(this.data.prefs),
        roll: next,
      });
      this.setData({
        pickingSlot: false,
        rerollLeft: 0,
        cardRows: cardRowsOf(next),
        previewAttrs: attrRowsOf(preview.attrs, ATTR_SYSTEMS.roulette),
      });
    },

    /* —— 起名与开局 —— */

    onGoName() {
      this.setData({ name: this.data.name || randomName(), note: '' });
      this.setStep('name');
    },

    onNameInput(e: { detail: { value: string } }) {
      this.setData({ name: e.detail.value });
    },

    onRandomName() {
      this.setData({ name: randomName() });
    },

    onStartLife() {
      const systemId = this.data.systemId;
      if (!hasFreeRunSlot()) {
        this.setData({ note: `存档位已满（${listRuns().length}/${MAX_RUNS}），回到第一步清掉一个旧存档再来。` });
        return;
      }
      const name = this.data.name.trim();
      const pending: PendingStart =
        systemId === 'roulette' && wizardRoll
          ? {
              mode: 'new',
              attrSystem: systemId,
              seed: wizardRoll.seed,
              prefs: prefsOf(this.data.prefs),
              name: name || undefined,
              backgroundId: wizardBackgroundId,
              roll: wizardRoll,
            }
          : {
              mode: 'new',
              attrSystem: systemId,
              seed: wizardSeed,
              prefs: prefsOf(this.data.prefs),
              name: name || undefined,
            };
      if (typeof wx !== 'undefined' && typeof wx.setStorageSync === 'function') {
        wx.setStorageSync(PENDING_START_KEY, pending);
      }
      wx.navigateTo({ url: '/pages/play/play' });
    },

    /* —— 第一步的存档操作 —— */

    onContinueFromWizard() {
      if (listRuns().length === 0) {
        this.setData({ note: '本地没有存档。' });
        return;
      }
      if (typeof wx !== 'undefined' && typeof wx.setStorageSync === 'function') {
        wx.setStorageSync(PENDING_START_KEY, { mode: 'continue' } satisfies PendingStart);
      }
      wx.navigateTo({ url: '/pages/play/play' });
    },

    onClearSaves() {
      for (const r of listRuns()) deleteRun(r.runId);
      this.setData({ saves: listRuns().length, note: '存档已清空。' });
    },
  },
});

function randomName(): string {
  return NAME_POOL[Math.floor(Math.random() * NAME_POOL.length)];
}

function savePrefsSafe(prefs: ContentPrefs): void {
  if (typeof wx === 'undefined' || typeof wx.setStorageSync !== 'function') return;
  wx.setStorageSync(PREFS_KEY, prefs);
}
