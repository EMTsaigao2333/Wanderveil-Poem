/**
 * 人生引擎页（最小可测版）
 *
 * 一页打通「选属性系统 → 开局 → 逐年事件与选项 → 检定与结果 → 死亡 / 结局」。
 * 目的只是让人能立刻自己玩一局试手感：
 *   转盘用文字人物卡、内容偏好用默认、辅以属性面板与心理状态量便于核对引擎行为。
 * 正式视觉小说主界面（转盘动画 / 背景与动效）见 P0-5，总结图与分享见 P0-6 / P0-7。
 */

import type { AttrSystemId, Choice, Effects, LifeEvent, SemanticAttr } from '../../engine/schema';
import { STAGE_NAME } from '../../engine/schema';
import type { RunState } from '../../engine/run-state';
import { deleteRun, listRuns, loadCurrentRun, MAX_RUNS } from '../../engine/run-state';
import { nextStep, startRun, submitChoice } from '../../engine/story-engine';
import { ATTR_SYSTEMS } from '../../data/attributes';
import { cyberpunkPack } from '../../data/worlds/cyberpunk/index';
import { readPendingStart } from '../../utils/pending-start';

type Phase = 'start' | 'life' | 'end';

interface SystemOption {
  id: AttrSystemId;
  name: string;
  brief: string;
}

interface AttrRow {
  key: string;
  name: string;
  value: number;
  pct: number;
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

/** 骰子动画计时器（模块级：一局页面同时只有一个骰子在滚） */
let diceTimer: ReturnType<typeof setInterval> | null = null;

/** 当前属性系统的属性面板数据 */
function attrRows(run: RunState): AttrRow[] {
  const system = ATTR_SYSTEMS[run.attrSystem];
  return system.attrs.map((def) => {
    const value = Math.round((run.attrs[def.key] ?? 0) * 10) / 10;
    const span = def.max - def.min || 20;
    const pct = Math.max(0, Math.min(100, Math.round(((value - def.min) / span) * 100)));
    return { key: def.key, name: def.name, value, pct };
  });
}

/** 把一次结果的变化写成一行字 */
function deltaText(effects: Effects | undefined): string {
  if (!effects) return '';
  const parts: string[] = [];
  if (effects.attr) {
    for (const [key, value] of Object.entries(effects.attr) as [SemanticAttr, number][]) {
      parts.push(`${ATTR_NAME[key]} ${value > 0 ? '+' : ''}${value}`);
    }
  }
  if (effects.money) parts.push(`信用点 ${effects.money > 0 ? '+' : ''}${effects.money}`);
  if (effects.psyche) {
    for (const [key, value] of Object.entries(effects.psyche)) {
      parts.push(`${key} ${value > 0 ? '+' : ''}${value}`);
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
  const bg = cyberpunkPack.meta.backgrounds.find((b) => b.id === run.backgroundId);
  return bg ? `出身：${bg.name}` : '';
}

/** 心理状态量一行（测试期用来核对病理链是否触发） */
function psycheLine(run: RunState): string {
  const p = run.psyche;
  const parts = [`压抑 ${Math.round(p.suppression)}`, `韧性 ${Math.round(p.resilience)}`, `信任 ${Math.round(p.trust)}`, `自我价值 ${Math.round(p.selfWorth)}`];
  if (p.conditions.length > 0) parts.push(`病理 ${p.conditions.join('、')}`);
  return parts.join('　');
}

Component({
  data: {
    phase: 'start' as Phase,
    systems: SYSTEMS,
    systemId: 'heart6' as AttrSystemId,

    run: null as RunState | null,
    event: null as LifeEvent | null,

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
      if (pending) {
        if (pending.mode === 'continue') {
          this.onContinueSave();
          return;
        }
        if (pending.attrSystem) {
          const run = startRun(cyberpunkPack, {
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
      if (diceTimer) {
        clearInterval(diceTimer);
        diceTimer = null;
      }
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
      const run = startRun(cyberpunkPack, { attrSystem: this.data.systemId });
      this.beginRun(run);
    },

    /** 继续上次的人生（读本地存档） */
    onContinueSave() {
      const run = loadCurrentRun();
      if (!run) {
        this.setData({ note: '本地没有存档。' });
        return;
      }
      if (run.status !== 'playing') {
        this.setData({ note: '上一局已经结束了，开一局新的吧。' });
        return;
      }
      this.beginRun(run);
    },

    beginRun(run: RunState) {
      this.setData({
        phase: 'life',
        run,
        event: null,
        result: null,
        choices: [],
        timeline: [],
        pendingEnd: false,
        note: '',
        diceRolling: false,
        stage: STAGE_NAME[run.stage],
        card: cardLine(run),
        psyche: psycheLine(run),
        tags: run.tags.slice(-6).join(' · '),
        attrRows: attrRows(run),
      });
      this.advance(run);
    },

    /** 取下一个事件（或空转年） */
    advance(run: RunState) {
      const r = nextStep(run, cyberpunkPack);
      const hud = {
        run,
        stage: STAGE_NAME[run.stage],
        card: cardLine(run),
        psyche: psycheLine(run),
        tags: run.tags.slice(-6).join(' · '),
        attrRows: attrRows(run),
        pendingEnd: r.ended,
      };

      if (r.event && r.choices.length > 0) {
        this.setData({
          ...hud,
          event: r.event,
          view: { title: r.event.title ?? '', text: r.event.text, auto: false },
          choices: choiceViews(r.choices),
          result: null,
        });
        return;
      }

      const last = run.history[run.history.length - 1];
      if (r.event) {
        // 自动事件：效果已在引擎里结算，直接展示
        this.setData({
          ...hud,
          event: null,
          view: { title: r.event.title ?? '', text: r.event.text, auto: true },
          choices: [],
          result: { check: '', text: '', delta: deltaText(r.event.effects ?? last?.effects) },
        });
        return;
      }

      this.setData({
        ...hud,
        event: null,
        view: { title: '', text: '这一年没有发生什么。', auto: true },
        choices: [],
        result: null,
      });
    },

    /** 玩家选了一个选项 */
    onPick(e: TapEvent) {
      const run = this.data.run;
      const event = this.data.event;
      const index = Number(e.currentTarget.dataset.index);
      if (!run || !event || !Number.isFinite(index)) return;

      const r = submitChoice(run, cyberpunkPack, event, index);
      const last = run.history[run.history.length - 1];
      const dice = last?.dice;
      const result: ResultView = {
        check: dice
          ? `掷骰 ${dice[0]} + ${dice[1]} = ${dice[0] + dice[1]}｜${CHECK_LABEL[last?.checkResult ?? ''] ?? ''}`
          : '',
        text: last?.text ?? '',
        delta: deltaText(last?.effects),
      };
      this.setData({
        run,
        event: null,
        choices: [],
        pendingEnd: r.ended,
        stage: STAGE_NAME[run.stage],
        card: cardLine(run),
        psyche: psycheLine(run),
        tags: run.tags.slice(-6).join(' · '),
        attrRows: attrRows(run),
        // 有检定先滚骰子（约 0.8s）再揭示结果；无检定直接出结果
        diceRolling: !!dice,
        diceA: dice ? 1 + Math.floor(Math.random() * 20) : 0,
        diceMod: dice ? dice[1] : 0,
        result: dice ? null : result,
      });
      if (dice) this.rollDiceAnim(result);
    },

    /** 骰子滚动动画：数字跳动约 0.8s 后落定，揭示真实结果 */
    rollDiceAnim(final: ResultView) {
      if (diceTimer) clearInterval(diceTimer);
      let ticks = 0;
      diceTimer = setInterval(() => {
        ticks += 1;
        if (ticks >= 10) {
          if (diceTimer) clearInterval(diceTimer);
          diceTimer = null;
          const dice = this.data.run?.history[this.data.run.history.length - 1]?.dice;
          this.setData({ diceRolling: false, diceA: dice ? dice[0] : 0, result: final });
          return;
        }
        this.setData({ diceA: 1 + Math.floor(Math.random() * 20) });
      }, 80);
    },

    /** 「继续」：看下一段，或进入结局 */
    onContinue() {
      const run = this.data.run;
      if (!run) return;
      if (this.data.pendingEnd || run.status !== 'playing') {
        this.setData({
          phase: 'end',
          event: null,
          choices: [],
          result: null,
          timeline: timelineRows(run),
          attrRows: attrRows(run),
        });
        return;
      }
      this.setData({ result: null, choices: [], event: null, diceRolling: false });
      this.advance(run);
    },

    /** 回到开始界面 */
    onBackToStart() {
      this.setData({
        phase: 'start',
        run: null,
        event: null,
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