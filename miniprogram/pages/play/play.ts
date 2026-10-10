/**
 * 人生引擎页（最小可测版）
 *
 * 一页打通「选属性系统 → 开局 → 逐年事件与选项 → 检定与结果 → 死亡 / 结局」。
 * 目的只是让人能立刻自己玩一局试手感：
 *   转盘用文字人物卡、内容偏好用默认、辅以属性面板与心理状态量便于核对引擎行为。
 * 正式视觉小说主界面（转盘动画 / 背景与动效）见 P0-5，总结图与分享见 P0-6 / P0-7。
 *
 * 性能约定（2026-10-10）：一局 RunState 序列化约 22KB（history 占 17KB），
 * 而本页 WXML 只用得到 age / money / deathCause 与事件标题正文，
 * 因此 **run 与 event 一律不进 setData**，只放模块级变量，setData 只传派生标量。
 */

import type { AttrSystemId, Choice, Effects, LifeEvent, SemanticAttr, WorldPack } from '../../engine/schema';
import { STAGE_NAME } from '../../engine/schema';
import type { RunState } from '../../engine/run-state';
import { deleteRun, listRuns, loadCurrentRun, MAX_RUNS } from '../../engine/run-state';
import { nextStep, startRun, submitChoice } from '../../engine/story-engine';
import { ATTR_SYSTEMS } from '../../data/attributes';
import { PSYCHE_LABEL } from '../../data/traits/_psyche-state';
import { WORLD_LIST, WORLDS } from '../../data/worlds/index';
import type { AttrRow } from '../../utils/attr-rows';
import { attrRowsOf } from '../../utils/attr-rows';
import { readPendingStart } from '../../utils/pending-start';

type Phase = 'start' | 'life' | 'end';

interface SystemOption {
  id: AttrSystemId;
  name: string;
  brief: string;
}

interface ChoiceView {
  /** 在原选项数组里的下标（点击回传用） */
  idx: number;
  label: string;
  major: boolean;
  checkText: string;
}

interface ResultView {
  check: string;
  text: string;
  delta: string;
}

interface TimelineRow {
  key: string;
  age: number;
  text: string;
}

/** 页面里只用到「点一个带 data 的元素」这一种事件 */
interface TapEvent {
  currentTarget: { dataset: { id?: string; index?: string | number } };
}

/** 语义键 → 中文名（检定与变化展示用） */
const ATTR_NAME: Record<SemanticAttr, string> = {
  perception: '感知',
  will: '意志',
  empathy: '共情',
  ingenuity: '应变',
  reverie: '灵感',
  vitality: '行力',
  charm: '魅力',
  wealth: '家资',
  health: '身体',
  mood: '心境',
};

const CHECK_LABEL: Record<string, string> = {
  crit: '大成功',
  success: '成功',
  fail: '失败',
  critFail: '大失败',
};

const SYSTEMS: SystemOption[] = (['classic5', 'heart6', 'roulette'] as AttrSystemId[]).map((id) => ({
  id,
  name: ATTR_SYSTEMS[id].name,
  brief: ATTR_SYSTEMS[id].brief,
}));

/* ------------------------------------------------------------------ */
/* 模块级状态（不进 setData）                                            */
/* ------------------------------------------------------------------ */

/** 骰子动画计时器（一局页面同时只有一个骰子在滚） */
let diceTimer: ReturnType<typeof setInterval> | null = null;
/** 递增的揭示令牌：定时器回调只认自己那一轮的令牌，过期回调直接丢弃 */
let revealToken = 0;
/** 当前这一局的 run（一局约 22KB，不进 setData） */
let currentRun: RunState | null = null;
/** 当前待抉择的事件（只把 title / text 派生进 view） */
let currentEvent: LifeEvent | null = null;
/** 当前世界：由交接配置的 worldId 从注册表取；缺省用注册表第一个 */
let world: WorldPack = WORLD_LIST[0];

/* ------------------------------------------------------------------ */
/* 派生数据                                                            */
/* ------------------------------------------------------------------ */

/** 把一次结果的变化写成一行字（货币名从世界元数据来，不再硬编码「信用点」） */
function deltaText(effects: Effects | undefined, currency: string): string {
  if (!effects) return '';
  const parts: string[] = [];
  if (effects.attr) {
    for (const [key, value] of Object.entries(effects.attr) as [SemanticAttr, number][]) {
      parts.push(`${ATTR_NAME[key]} ${value > 0 ? '+' : ''}${value}`);
    }
  }
  if (effects.money) parts.push(`${currency} ${effects.money > 0 ? '+' : ''}${effects.money}`);
  if (effects.psyche) {
    for (const [key, value] of Object.entries(effects.psyche)) {
      const label = PSYCHE_LABEL[key as keyof typeof PSYCHE_LABEL] ?? key;
      parts.push(`${label} ${value > 0 ? '+' : ''}${value}`);
    }
  }
  for (const t of effects.tags ?? []) parts.push(`获得「${t}」`);
  for (const t of effects.dropTags ?? []) parts.push(`失去「${t}」`);
  for (const t of effects.gainTraits ?? []) parts.push(`特质 +${t}`);
  for (const t of effects.loseTraits ?? []) parts.push(`特质 −${t}`);
  for (const c of effects.gainCaps ?? []) parts.push(`能力 +${c}`);
  for (const c of effects.loseCaps ?? []) parts.push(`能力 −${c}`);
  return parts.join('　');
}

/** 选项按钮的展示数据 */
function choiceViews(choices: Choice[]): ChoiceView[] {
  return choices.map((c, idx) => ({
    idx,
    label: c.label,
    major: !!c.major,
    checkText: c.check ? `检定 ${ATTR_NAME[c.check.attr]} · DC ${c.check.dc}` : '无需检定',
  }));
}

/** 人生时间线（倒序，最近的在最上面） */
function timelineRows(run: RunState): TimelineRow[] {
  const rows: TimelineRow[] = [];
  for (let i = run.history.length - 1; i >= 0; i--) {
    const h = run.history[i];
    const bits: string[] = [];
    if (h.title) bits.push(h.title);
    if (h.choiceLabel) bits.push(h.choiceLabel);
    if (h.checkResult) bits.push(CHECK_LABEL[h.checkResult] ?? h.checkResult);
    if (h.text) bits.push(h.text.replace(/\n/g, ' '));
    rows.push({ key: `${i}-${h.eventId}`, age: h.age, text: bits.join('｜') });
  }
  return rows;
}

/** 人物卡一行（转盘模式用文字人物卡，其余模式展示出身背景包） */
function cardLine(run: RunState): string {
  if (run.card) return run.card.summaryText;
  const bg = world.meta.backgrounds.find((b) => b.id === run.backgroundId);
  return bg ? `出身：${bg.name}` : '';
}

/** 心理状态量一行（中文标签复用 PSYCHE_LABEL，不再手写一份） */
function psycheLine(run: RunState): string {
  const p = run.psyche;
  const order = ['suppression', 'resilience', 'trust', 'selfWorth'] as const;
  const parts = order.map((key) => `${PSYCHE_LABEL[key]} ${Math.round(p[key])}`);
  if (p.conditions.length > 0) parts.push(`病理 ${p.conditions.join('、')}`);
  return parts.join('　');
}

/**
 * 一局的展示标量 —— setData 只传这些，不传整个 run。
 * 属性面板含危险档位与致命标记（见 utils/attr-rows.ts）。
 */
function hudOf(run: RunState) {
  return {
    age: run.age,
    money: run.money,
    deathCause: run.deathCause ?? '',
    stage: STAGE_NAME[run.stage],
    card: cardLine(run),
    psyche: psycheLine(run),
    tags: run.tags.slice(-6).join(' · '),
    attrRows: attrRowsOf(ATTR_SYSTEMS[run.attrSystem], run.attrs) as AttrRow[],
  };
}

/** 世界相关的展示标量（世界名 / 货币名都从 WorldMeta 读，不再硬编码） */
function worldOf(pack: WorldPack) {
  return {
    worldName: pack.meta.name,
    worldBrief: pack.meta.brief,
    currencyName: pack.meta.currencyName ?? '金钱',
  };
}

Component({
  data: {
    phase: 'start' as Phase,
    systems: SYSTEMS,
    systemId: 'heart6' as AttrSystemId,

    worldName: '',
    worldBrief: '',
    currencyName: '金钱',

    // —— 一局的派生标量（不传 run 本体）——
    age: 0,
    money: 0,
    deathCause: '',

    stage: '',
    card: '',
    psyche: '',
    tags: '',

    view: { title: '', text: '', auto: false },
    choices: [] as ChoiceView[],
    result: null as ResultView | null,
    pendingEnd: false,
    note: '',

    attrRows: [] as AttrRow[],
    timeline: [] as TimelineRow[],
    saves: 0,
    maxRuns: MAX_RUNS,

    // —— 骰子动画（检定掷骰时先滚动再揭示结果） ——
    diceRolling: false,
    diceA: 0,
    diceMod: 0,
  },

  lifetimes: {
    /** 进来先看有没有向导留下的开局配置；没有则报一次存档位占用 */
    attached() {
      const pending = readPendingStart();
      this.setData(worldOf(world));
      if (pending) {
        // 世界从注册表取；选过的世界终于能一路带到人生页（此前世界选择是装饰）
        world = WORLDS[pending.worldId ?? ''] ?? world;
        this.setData(worldOf(world));
        if (pending.mode === 'continue') {
          this.onContinueSave();
          return;
        }
        if (pending.attrSystem) {
          const run = startRun(world, {
            attrSystem: pending.attrSystem,
            seed: pending.seed,
            prefs: pending.prefs,
            name: pending.name,
            backgroundId: pending.backgroundId,
            roll: pending.roll,
          });
          this.beginRun(run);
          return;
        }
      }
      this.setData({ saves: listRuns().length });
    },

    detached() {
      this.stopDiceAnim();
    },
  },

  methods: {
    onPickSystem(e: TapEvent) {
      const id = e.currentTarget.dataset.id as AttrSystemId | undefined;
      if (id === 'classic5' || id === 'heart6' || id === 'roulette') {
        this.setData({ systemId: id, note: '' });
      }
    },

    /** 新开一局 */
    onStartNew() {
      const run = startRun(world, { attrSystem: this.data.systemId });
      this.beginRun(run);
    },

    /** 继续上次的人生（读本地存档） */
    onContinueSave() {
      const run = loadCurrentRun();
      if (!run) {
        // 「读不出来」有两种原因，必须分开提示：
        // ① 确实没有存档；② 有存档但被 migrateRunState 判死（版本不认识）
        const saved = listRuns().length;
        this.setData({
          note: saved > 0
            ? '发现旧版本存档，当前引擎无法读取，只能开一局新的（可在下方清空存档）。'
            : '本地没有存档。',
        });
        return;
      }
      if (run.status !== 'playing') {
        this.setData({ note: '上一局已经结束了，开一局新的吧。' });
        return;
      }
      // 继续的这一局可能属于别的世界：按存档里的 worldId 取
      world = WORLDS[run.worldId] ?? world;
      this.setData(worldOf(world));
      this.beginRun(run);
    },

    beginRun(run: RunState) {
      this.stopDiceAnim();
      currentRun = run;
      currentEvent = null;
      this.setData({
        phase: 'life',
        ...hudOf(run),
        view: { title: '', text: '', auto: false },
        result: null,
        choices: [],
        timeline: [],
        pendingEnd: false,
        note: '',
        diceRolling: false,
      });
      this.advance();
    },

    /** 取下一个事件（或空转年） */
    advance() {
      const run = currentRun;
      if (!run) return;
      this.stopDiceAnim();
      const r = nextStep(run, world);
      const hud = { ...hudOf(run), pendingEnd: r.ended };

      if (r.event && r.choices.length > 0) {
        currentEvent = r.event;
        this.setData({
          ...hud,
          view: { title: r.event.title ?? '', text: r.event.text, auto: false },
          choices: choiceViews(r.choices),
          result: null,
        });
        return;
      }

      currentEvent = null;
      const last = run.history[run.history.length - 1];
      if (r.event) {
        // 自动事件：效果已在引擎里结算，直接展示
        this.setData({
          ...hud,
          view: { title: r.event.title ?? '', text: r.event.text, auto: true },
          choices: [],
          result: { check: '', text: '', delta: deltaText(r.event.effects ?? last?.effects, this.data.currencyName) },
        });
        return;
      }

      this.setData({
        ...hud,
        view: { title: '', text: '这一年没有发生什么。', auto: true },
        choices: [],
        result: null,
      });
    },

    /** 玩家选了一个选项 */
    onPick(e: TapEvent) {
      // 骰子还在滚时不允许再点：否则第二次选择会与动画回调互相覆盖
      if (this.data.diceRolling) return;
      const run = currentRun;
      const event = currentEvent;
      const index = Number(e.currentTarget.dataset.index);
      if (!run || !event || !Number.isFinite(index)) return;

      const r = submitChoice(run, world, event, index);
      currentEvent = null;
      const last = run.history[run.history.length - 1];
      const dice = last?.dice;
      const result: ResultView = {
        check: dice
          ? `掷骰 ${dice[0]} + ${dice[1]} = ${dice[0] + dice[1]}｜${CHECK_LABEL[last?.checkResult ?? ''] ?? ''}`
          : '',
        text: last?.text ?? '',
        delta: deltaText(last?.effects, this.data.currencyName),
      };
      this.setData({
        ...hudOf(run),
        choices: [],
        pendingEnd: r.ended,
        // 有检定先滚骰子（约 0.8s）再揭示结果；无检定直接出结果
        diceRolling: !!dice,
        diceA: dice ? 1 + Math.floor(Math.random() * 20) : 0,
        diceMod: dice ? dice[1] : 0,
        result: dice ? null : result,
      });
      if (dice) this.rollDiceAnim(result, dice[0]);
    },

    /** 停止骰子动画：清定时器并作废本轮令牌（onPick / onContinue / advance / beginRun / detached 都要调） */
    stopDiceAnim() {
      revealToken += 1;
      if (diceTimer) {
        clearInterval(diceTimer);
        diceTimer = null;
      }
    },

    /**
     * 骰子滚动动画：数字跳动约 0.8s 后落定，揭示真实结果。
     * realDice = 引擎掷出的真实骰面（结果面板的数据由调用方捕获后传入，
     * 回调里 **不再回读 run.history** —— 那正是旧实现把上一条结果盖到新事件上的原因）。
     */
    rollDiceAnim(final: ResultView, realDice: number) {
      this.stopDiceAnim();
      const token = revealToken;
      let ticks = 0;
      diceTimer = setInterval(() => {
        if (token !== revealToken) return; // 过期回调：本轮已被作废
        ticks += 1;
        if (ticks >= 10) {
          this.stopDiceAnim();
          this.setData({ diceRolling: false, diceA: realDice, result: final });
          return;
        }
        this.setData({ diceA: 1 + Math.floor(Math.random() * 20) });
      }, 80);
    },

    /** 「继续」：看下一段，或进入结局 */
    onContinue() {
      const run = currentRun;
      if (!run) return;
      this.stopDiceAnim();
      if (this.data.pendingEnd || run.status !== 'playing') {
        this.setData({
          phase: 'end',
          choices: [],
          result: null,
          ...hudOf(run),
          timeline: timelineRows(run),
        });
        return;
      }
      this.setData({ result: null, choices: [], diceRolling: false });
      this.advance();
    },

    /** 回到开始界面 */
    onBackToStart() {
      this.stopDiceAnim();
      currentRun = null;
      currentEvent = null;
      this.setData({
        phase: 'start',
        result: null,
        choices: [],
        note: '',
        timeline: [],
        saves: listRuns().length,
      });
    },

    /** 清空全部存档（测试期用；正式版应改成逐条删除 + 二次确认） */
    onClearSaves() {
      for (const r of listRuns()) deleteRun(r.runId);
      this.setData({ saves: listRuns().length, note: '存档已清空。' });
    },
  },
});