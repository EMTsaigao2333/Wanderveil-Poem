/**
 * 幻行诗篇 · 批量模拟（tools/simulate.mjs）
 *
 * 基于 _audit/_scratch/probe4.mjs 的「按活法策略分档」打法固化而来，
 * 用来复现 docs/design/01-heart6-spec.md 第 6 节的四条寿命档位。
 *
 * 用法：
 *   node tools/simulate.mjs --runs 480 [--system heart6] [--strategy random|first|life]
 *
 *   --runs     局数（默认 480）。--strategy life 时是「每档」局数，共 5 档
 *   --system   classic5 | heart6 | roulette（默认 heart6，寿命档位文档以六维为准）
 *   --strategy random = 随机选（默认） / first = 永远选第一项 / life = 按活法经营
 *
 * 输出：寿命分布（最小/p25/中位/p75/最大）、死因分布、检定成功率、属性饱和度，
 *       并把「实测值 vs 文档目标值」并排打印。
 *
 * 退出码：0 = 全部断言通过；1 = 有断言不通过（打印偏差）
 *
 * ⚠ 重要：当前实测与文档严重不符（文档 40/55/60/65+，实测五档中位全在 68~70，
 *   见 01 文档 §6.3 的 2026-10-08 复核）。因此本脚本【一开始一定会失败】——
 *   这是正确且预期的行为，它证明该缺陷存在。**不要为了让脚本通过而改断言值。**
 *   数值校准（P4 / 修改清单 D1~D4）拍板后才应该让它转绿。
 */

import { loadProject, silenceWx } from './lib/load-ts.mjs';

silenceWx();

const { startRun, nextStep, submitChoice, semanticValue } = await loadProject('miniprogram/engine/story-engine.ts');
const { cyberpunkPack: pack } = await loadProject('miniprogram/data/worlds/cyberpunk/index.ts');
const { ATTR_SYSTEMS } = await loadProject('miniprogram/data/attributes.ts');

/* ------------------------------------------------------------------ */
/* 参数                                                                */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const out = { runs: 480, system: 'heart6', strategy: 'random' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--runs') out.runs = Math.max(1, Number(argv[++i]) || 480);
    else if (a === '--system') out.system = argv[++i];
    else if (a === '--strategy') out.strategy = argv[++i];
    else if (a === '--help' || a === '-h') out.help = true;
    else {
      console.error(`未知参数：${a}（用 --help 看用法）`);
      process.exit(2);
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log('用法：node tools/simulate.mjs --runs 480 [--system heart6] [--strategy random|first|life]');
  process.exit(0);
}
if (!['classic5', 'heart6', 'roulette'].includes(args.system)) {
  console.error(`--system 只能是 classic5 / heart6 / roulette（收到 ${args.system}）`);
  process.exit(2);
}
if (!['random', 'first', 'life'].includes(args.strategy)) {
  console.error(`--strategy 只能是 random / first / life（收到 ${args.strategy}）`);
  process.exit(2);
}

/* ------------------------------------------------------------------ */
/* 工具                                                                */
/* ------------------------------------------------------------------ */

/** 与引擎同款的确定性随机（mulberry32），保证同 seed 结果可复现 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sorted = (arr) => [...arr].sort((a, b) => a - b);
const at = (arr, p) => arr[Math.min(arr.length - 1, Math.max(0, Math.floor(arr.length * p)))];
const median = (arr) => at(sorted(arr), 0.5);
const fmt = (n, w = 2) => (Number.isFinite(n) ? n.toFixed(w) : '—');

/** 活法策略：按终局想拿到的标签给选项打分（与 probe4.mjs 一致） */
const LIFE_MODES = [
  { key: 'none', label: '普通（不刻意经营）', want: [] },
  { key: 'gang', label: '只立住帮派', want: ['锈牙帮'] },
  { key: 'shop', label: '只立住小生意', want: ['小生意'] },
  { key: 'both', label: '帮派＋小生意', want: ['锈牙帮', '小生意'] },
  { key: 'all', label: '帮派＋小生意＋义体化', want: ['锈牙帮', '小生意', '义体化'] },
];

/** 一个选项在成功/失败/大成功/大失败各分支上可能产出的标签 */
function choiceTags(c) {
  const s = new Set();
  const branches = [c.effects, c.success?.effects, c.fail?.effects, c.critSuccess?.effects, c.critFail?.effects];
  for (const e of branches) for (const t of e?.tags ?? []) s.add(t);
  return s;
}

/** 选选项：first / random / life 三种打法 */
function pickIndex(choices, kind, want, rnd) {
  if (kind === 'first') return 0;
  if (kind === 'random') return Math.floor(rnd() * choices.length);
  let best = 0;
  let bestScore = -1;
  for (let i = 0; i < choices.length; i++) {
    const tags = choiceTags(choices[i]);
    let sc = 0;
    for (const w of want) if (tags.has(w)) sc += 1;
    sc += rnd() * 0.01; // 同分抖动，避免永远选同一个
    if (sc > bestScore) {
      bestScore = sc;
      best = i;
    }
  }
  return best;
}

/** 检定所用属性当前的饱和度（0~1，可多个落点） */
function saturationOf(state, attrKey) {
  const sys = ATTR_SYSTEMS[state.attrSystem];
  const mapping = sys.map[attrKey];
  if (!mapping || mapping === 'background') return [];
  const val = semanticValue(state, attrKey);
  const out = [];
  for (const key of Object.keys(mapping)) {
    const def = sys.attrs.find((a) => a.key === key);
    if (def && def.max > 0) out.push(val / def.max);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* 跑一局                                                              */
/* ------------------------------------------------------------------ */

function playOne(mode, seed, system, strategy) {
  const state = startRun(pack, { attrSystem: system, seed });
  const rnd = mulberry32(seed ^ 0x9e3779b9);
  const want = strategy === 'life' ? mode.want : [];
  const sat = [];
  let guard = 0;
  while (state.status === 'playing' && guard++ < 500) {
    const r = nextStep(state, pack);
    if (r.ended) break;
    if (r.choices.length > 0) {
      const idx = pickIndex(r.choices, strategy, want, rnd);
      const ch = r.choices[idx];
      if (ch.check) sat.push(...saturationOf(state, ch.check.attr));
      submitChoice(state, pack, r.event, idx);
    }
  }
  return { state, sat };
}

/** 汇总一批局 */
function summarize(results) {
  const ages = sorted(results.map((r) => r.state.age));
  const causes = {};
  let checks = 0;
  let checksOk = 0;
  const sat = [];
  const tagHold = {};
  for (const { state, sat: s } of results) {
    const cause = (state.deathCause ?? '（无死因）').slice(0, 14);
    causes[cause] = (causes[cause] ?? 0) + 1;
    for (const h of state.history) {
      if (!h.checkResult) continue;
      checks++;
      if (h.checkResult === 'crit' || h.checkResult === 'success') checksOk++;
    }
    sat.push(...s);
    for (const t of state.tags) tagHold[t] = (tagHold[t] ?? 0) + 1;
  }
  const satSorted = sorted(sat);
  return {
    n: results.length,
    min: ages[0],
    p25: at(ages, 0.25),
    med: at(ages, 0.5),
    p75: at(ages, 0.75),
    max: ages[ages.length - 1],
    causes,
    checkRate: checks ? checksOk / checks : 0,
    checks,
    satMed: satSorted.length ? at(satSorted, 0.5) : 0,
    satP90: satSorted.length ? at(satSorted, 0.9) : 0,
    satTop: satSorted.length ? satSorted.filter((x) => x >= 0.95).length / satSorted.length : 0,
    tagHold,
  };
}

const line = (s = '') => console.log(s);

line('════════════════════════════════════════════');
line(' 幻行诗篇 · 批量模拟');
line('════════════════════════════════════════════');
line(` 世界：${pack.meta.name} | 属性系统：${args.system} | 打法：${args.strategy} | 每档局数：${args.runs}`);
line('────────────────────────────────────────────');

const started = Date.now();
const groups = [];

if (args.strategy === 'life') {
  for (const mode of LIFE_MODES) {
    const results = [];
    for (let i = 1; i <= args.runs; i++) results.push(playOne(mode, i * 7919 + 11, args.system, 'life'));
    groups.push({ label: mode.label, mode, ...summarize(results) });
  }
} else {
  const results = [];
  for (let i = 1; i <= args.runs; i++) results.push(playOne(null, i * 7919 + 11, args.system, args.strategy));
  groups.push({ label: args.strategy === 'first' ? '永远选第一项' : '随机选择', mode: null, ...summarize(results) });
}

line(' 寿命分布（岁）');
line('   档位                       最小  p25  中位  p75  最大   | 成功率  饱和度中位(p90)  贴顶比例');
for (const g of groups) {
  line(
    `   ${g.label.padEnd(22)} ${String(g.min).padStart(4)} ${String(g.p25).padStart(4)} ${String(g.med).padStart(5)} ${String(g.p75).padStart(4)} ${String(g.max).padStart(5)}` +
      `   | ${(g.checkRate * 100).toFixed(1).padStart(5)}%  ${(g.satMed * 100).toFixed(0).padStart(5)}% (${(g.satP90 * 100).toFixed(0)}%)` +
      `   ${(g.satTop * 100).toFixed(1).padStart(5)}%`
  );
}
line(`   （检定样本 ${groups.reduce((a, g) => a + g.checks, 0)} 次）`);

line('');
line(' 死因分布（前 6 位）');
for (const g of groups) {
  const top = Object.entries(g.causes).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const total = g.n;
  line(`   ${g.label}`);
  for (const [cause, n] of top) line(`     ${String(n).padStart(4)}/${total}  ${((n / total) * 100).toFixed(1).padStart(5)}%  ${cause}`);
}

if (args.strategy === 'life') {
  line('');
  line(' 终局持有标签（经营是否真的立住）');
  for (const g of groups) {
    const keys = g.mode.want.length ? g.mode.want : ['锈牙帮', '小生意', '义体化'];
    line(`   ${g.label.padEnd(22)} ${keys.map((k) => `${k} ${g.tagHold[k] ?? 0}/${g.n}`).join(' · ')}`);
  }
}

/* ------------------------------------------------------------------ */
/* 断言：对照 docs/design/01-heart6-spec.md §6 的目标值                 */
/* ------------------------------------------------------------------ */

const TOL = 3; // 文档验收标准：各自落在目标 ±3 岁内

/** 文档 §6.1 的四条寿命档位（普通 40 / 立住一条 55 / 两条 60 / 改造＋两条 65 往后） */
const TARGETS = {
  none: { target: 40, upper: false, doc: '普通底层' },
  gang: { target: 55, upper: false, doc: '立住一条' },
  shop: { target: 55, upper: false, doc: '立住一条' },
  both: { target: 60, upper: false, doc: '两条都立住' },
  all: { target: 65, upper: true, doc: '改造＋两条都立住（65 往后）' },
};

const rows = [];
for (const g of groups) {
  if (g.mode) {
    const t = TARGETS[g.mode.key];
    const pass = t.upper ? g.med >= t.target - TOL : Math.abs(g.med - t.target) <= TOL;
    rows.push({ label: g.label, doc: t.doc, target: t.target, upper: t.upper, med: g.med, pass });
  } else {
    // 随机 / 永远选第一项 ≈「不刻意经营」，对照普通底层 40
    rows.push({ label: g.label, doc: '普通底层（不刻意经营）', target: 40, upper: false, med: g.med, pass: Math.abs(g.med - 40) <= TOL });
  }
}

line('');
line('════════════════════════════════════════════');
line(' 对照文档目标（docs/design/01-heart6-spec.md §6.1）');
line('════════════════════════════════════════════');
line('   档位                        文档目标      实测中位   偏差    结论');
for (const r of rows) {
  const targetText = r.upper ? `${r.target} 往后` : `${r.target} ±${TOL}`;
  const dev = r.upper ? `+${r.med - r.target}` : `${r.med - r.target >= 0 ? '+' : ''}${r.med - r.target}`;
  line(`   ${r.label.padEnd(24)} ${targetText.padEnd(12)} ${String(r.med).padStart(6)}    ${dev.padStart(6)}    ${r.pass ? '✔' : '✘'}`);
}

const failed = rows.filter((r) => !r.pass);
line('────────────────────────────────────────────');
if (failed.length === 0) {
  line(` ✔ 全部 ${rows.length} 档命中文档目标（±${TOL} 岁）`);
} else {
  line(` ✘ ${failed.length}/${rows.length} 档未命中文档目标`);
  line('   说明：这是【已知缺陷】而非脚本问题 —— 实测五档中位压在 68~70，');
  line('   「活法」只体现在左尾早死概率，而不是能活多久（见 01 文档 §6.3 复核）。');
  line('   ⚠ 不要为了让本脚本通过而放宽断言值；应等 D1~D4 数值决策拍板后重做校准。');
}
line(` （耗时 ${((Date.now() - started) / 1000).toFixed(1)}s）`);
line('════════════════════════════════════════════');

process.exit(failed.length === 0 ? 0 : 1);