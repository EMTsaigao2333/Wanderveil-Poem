/**
 * 幻行诗篇 · 数据契约校验（tools/validate-data.mjs）
 *
 * 合并并取代 _audit/_scratch/ 下的历史文本探针：
 *   crosscheck.js（特质 id / 标签 / 能力 / 语义键交叉校验）
 *   gating.js（所有选项是否被门槛挡掉 + major / crit 配对）
 *   recheck.js（选项检定覆盖 / 正文字数 / years / 标签产出消费比）
 *   moneycheck.js（money 量级 vs 08 文档上限）
 *   tagnamespace.js（特质标签与事件标签的命名空间是否混用）
 *
 * 与旧脚本的区别：旧脚本用正则扫源码文本，本脚本**直接 import 真实数据结构**
 * （WorldPack / TraitPool），因此校验的是引擎真正读到的东西，而不是文本长相。
 *
 * 运行：node tools/validate-data.mjs
 * 退出码：0 = 全部通过；1 = 存在违规（逐条打印中文说明）
 *
 * 规则出处：docs/design/08-ai-text-spec.md（文本与数值）、
 *           02-character-layer.md 第 14 节（门槛硬约束）、
 *           03-runstate-save.md、PROJECT_SYNC.md 工作流规则。
 * 注意：本脚本**只读**数据，不做任何修改；发现违规请改数据，不要改断言。
 */

import { loadProject, silenceWx } from './lib/load-ts.mjs';

silenceWx();

const { cyberpunkPack: pack } = await loadProject('miniprogram/data/worlds/cyberpunk/index.ts');
const { TRAIT_POOLS } = await loadProject('miniprogram/data/traits/index.ts');
const { ATTR_SYSTEMS } = await loadProject('miniprogram/data/attributes.ts');
const { resolveStageRange } = await loadProject('miniprogram/engine/schema.ts');

/* ------------------------------------------------------------------ */
/* 基准常量（一律从真实源码派生，避免手抄后走样）                        */
/* ------------------------------------------------------------------ */

/** 合法语义键：直接取六维映射表的键（10 个） */
const LEGAL_ATTR = Object.keys(ATTR_SYSTEMS.heart6.map);
/** 合法心理状态量键：取特质池基线的键，去掉 conditions */
const LEGAL_PSYCHE = Object.keys(TRAIT_POOLS.cyberpunk.psycheBaseline).filter((k) => k !== 'conditions');
/**
 * 事件 id 命名：cb_<阶段缩写>_<三位序号>。
 * 各阶段缩写不是阶段名的机械拼接（middle → mid、elder → eld），照抄现有 161 条的用法。
 */
const ID_PREFIX = {
  childhood: 'cb_child_',
  teen: 'cb_teen_',
  youth: 'cb_youth_',
  prime: 'cb_prime_',
  middle: 'cb_mid_',
  elder: 'cb_eld_',
};
/** 阶段中文名（打印用） */
const STAGE_CN = { childhood: '幼年', teen: '少年', youth: '青年', prime: '壮年', middle: '中年', elder: '老年' };
/** 08 文档 §4.1 的 money 分阶段量级上限（仅作**报数**，不作为失败条件，见文末说明） */
const MONEY_LIMIT = { childhood: 0, teen: 20, youth: 100, prime: 500, middle: 500, elder: 500 };
/** 正文长度约束（08 文档：40~80 字） */
const TEXT_MIN = 40;
const TEXT_MAX = 80;

/* ------------------------------------------------------------------ */
/* 数据收集                                                            */
/* ------------------------------------------------------------------ */

const events = pack.events;
const meta = pack.meta;
const stageRange = resolveStageRange(meta);

// —— 特质池：id / 标签 / 能力 ——
// 注意：世界池（cyberpunk）的 options 是「通用池 + 世界专属」的合集，跨池有重复，
// 因此按 id 去重后再统计。
const traitById = new Map();
for (const [poolId, pool] of Object.entries(TRAIT_POOLS)) {
  for (const t of pool.options) if (!traitById.has(t.id)) traitById.set(t.id, { poolId, ...t });
}
const traits = [...traitById.values()];
const traitIds = new Set(traits.map((t) => t.id));
const traitTags = new Set();
const traitCaps = new Set();
for (const t of traits) {
  for (const x of t.tags ?? []) traitTags.add(x);
  for (const x of t.caps ?? []) traitCaps.add(x);
}

/** 开局背景包授予的标签（如赛博朋克的「欠雨水税」只从背景包来，事件与特质都不产） */
const bgTags = new Set();
for (const bg of meta.backgrounds ?? []) {
  for (const t of bg.tags ?? []) bgTags.add(t);
}

/** 遍历一个事件产生的所有 Effects（事件级 + 选项级 + 四条检定分支） */
function* eachEffects(ev) {
  if (ev.effects) yield { where: `${ev.id}（事件级 effects）`, effects: ev.effects };
  for (const [i, c] of (ev.choices ?? []).entries()) {
    const label = c.label ?? `选项${i}`;
    const takes = [
      ['effects', c.effects && { effects: c.effects }],
      ['success', c.success],
      ['fail', c.fail],
      ['critSuccess', c.critSuccess],
      ['critFail', c.critFail],
    ];
    for (const [branch, o] of takes) {
      if (o?.effects) yield { where: `${ev.id} → 「${label}」.${branch}`, effects: o.effects };
    }
  }
}

// —— 事件侧产出：标签 / 能力 / 移除标签 / 特质增删 ——
const eventGrantedTags = new Set();
const eventGrantedCaps = new Set();
const eventDroppedTags = new Set();
const refGainTraits = [];
const refLoseTraits = [];
const usedAttrKeys = new Map(); // key → 出现处
const usedPsycheKeys = new Map();
const illegalAttrKeys = [];
const illegalPsycheKeys = [];

for (const ev of events) {
  for (const { where, effects } of eachEffects(ev)) {
    for (const t of effects.tags ?? []) eventGrantedTags.add(t);
    for (const t of effects.dropTags ?? []) eventDroppedTags.add(t);
    for (const c of effects.gainCaps ?? []) eventGrantedCaps.add(c);
    for (const id of effects.gainTraits ?? []) refGainTraits.push({ id, where });
    for (const id of effects.loseTraits ?? []) refLoseTraits.push({ id, where });
    for (const k of Object.keys(effects.attr ?? {})) {
      usedAttrKeys.set(k, (usedAttrKeys.get(k) ?? 0) + 1);
      if (!LEGAL_ATTR.includes(k)) illegalAttrKeys.push(`${where} effects.attr.${k}`);
    }
    for (const k of Object.keys(effects.psyche ?? {})) {
      usedPsycheKeys.set(k, (usedPsycheKeys.get(k) ?? 0) + 1);
      if (!LEGAL_PSYCHE.includes(k)) illegalPsycheKeys.push(`${where} effects.psyche.${k}`);
    }
  }
}

/** 递归遍历 Condition（含 all / any 嵌套） */
function* eachCondition(cond, where) {
  if (!cond) return;
  yield { cond, where };
  for (const [i, sub] of (cond.all ?? []).entries()) yield* eachCondition(sub, `${where}.all[${i}]`);
  for (const [i, sub] of (cond.any ?? []).entries()) yield* eachCondition(sub, `${where}.any[${i}]`);
}

const reqTags = new Map(); // tag → 出现处
const reqCaps = new Map();
const condAttrKeys = [];

for (const ev of events) {
  for (const { cond, where } of eachCondition(ev.require, `${ev.id}.require`)) {
    for (const t of cond.tags ?? []) reqTags.set(t, where);
    for (const c of cond.caps ?? []) reqCaps.set(c, where);
    for (const k of Object.keys(cond.attr ?? {})) condAttrKeys.push(`${where}.attr.${k}`);
  }
  (ev.choices ?? []).forEach((c, i) => {
    for (const { cond, where } of eachCondition(c.require, `${ev.id} → 「${c.label ?? i}」.require`)) {
      for (const t of cond.tags ?? []) reqTags.set(t, where);
      for (const c2 of cond.caps ?? []) reqCaps.set(c2, where);
      for (const k of Object.keys(cond.attr ?? {})) condAttrKeys.push(`${where}.attr.${k}`);
    }
  });
}

/* ------------------------------------------------------------------ */
/* 校验项                                                              */
/* ------------------------------------------------------------------ */

const results = [];
function check(name, fn) {
  const errors = fn();
  results.push({ name, errors });
}

// 1. 事件 id 全局唯一 + 命名合规
check('事件 id 全局唯一且符合 cb_<阶段简称>_NNN 命名', () => {
  const out = [];
  const seen = new Map();
  const re = /^cb_(child|teen|youth|prime|mid|eld)_\d{3}$/;
  for (const ev of events) {
    if (seen.has(ev.id)) out.push(`id 重复：${ev.id}`);
    seen.set(ev.id, ev);
    if (!re.test(ev.id)) out.push(`命名不合规：${ev.id}（应为 cb_<阶段简称>_三位序号）`);
    const expect = ID_PREFIX[ev.stage];
    if (expect && !ev.id.startsWith(expect)) out.push(`id 前缀与 stage 不符：${ev.id} 的 stage 是 ${ev.stage}（应用 ${expect}）`);
  }
  return out;
});

// 2. gainTraits / loseTraits 引用的特质必须存在于特质池
check('gainTraits / loseTraits 引用的特质 id 都存在于特质池', () => {
  const out = [];
  for (const { id, where } of [...refGainTraits, ...refLoseTraits]) {
    if (!traitIds.has(id)) out.push(`${where} 引用了池中不存在的特质：${id}`);
  }
  return out;
});

// 3. require.tags 的标签一定有来源（特质授予 / 开局背景包 / 事件授予）
check('require.tags 引用的标签都有来源（特质 / 背景包 / 事件授予）', () => {
  const out = [];
  for (const [tag, where] of reqTags) {
    if (!traitTags.has(tag) && !bgTags.has(tag) && !eventGrantedTags.has(tag)) {
      out.push(`${where} 要求标签「${tag}」，但没有任何特质 / 背景包 / 事件授予它`);
    }
  }
  return out;
});

// 4. dropTags 移除的标签必须曾经存在
check('dropTags 移除的标签都曾经可能被授予', () => {
  const out = [];
  for (const tag of eventDroppedTags) {
    if (!traitTags.has(tag) && !bgTags.has(tag) && !eventGrantedTags.has(tag)) out.push(`dropTags 移除了从未被授予的标签：「${tag}」`);
  }
  return out;
});

// 5. require.caps 引用的能力标签必须有特质授予
check('require.caps 引用的能力标签都有来源（特质或事件授予）', () => {
  const out = [];
  for (const [cap, where] of reqCaps) {
    if (!traitCaps.has(cap) && !eventGrantedCaps.has(cap)) out.push(`${where} 要求能力「${cap}」，但没有任何特质或事件授予它`);
  }
  return out;
});

// 6. 所有 attr 键都是合法 SemanticAttr（10 个）
check(`所有 attr 键都是合法语义键（${LEGAL_ATTR.length} 个）`, () => {
  const out = [...illegalAttrKeys];
  for (const w of condAttrKeys) {
    const k = w.split('.').pop();
    if (!LEGAL_ATTR.includes(k)) out.push(`${w} 不是合法语义键`);
  }
  const badChecks = [];
  for (const ev of events) {
    (ev.choices ?? []).forEach((c, i) => {
      if (c.check && !LEGAL_ATTR.includes(c.check.attr)) badChecks.push(`${ev.id} → 「${c.label ?? i}」.check.attr = ${c.check.attr}`);
    });
  }
  return [...out, ...badChecks];
});

// 7. 所有 psyche 键合法
check(`所有 psyche 键合法（${LEGAL_PSYCHE.join(' / ')}）`, () => illegalPsycheKeys);

// 8. 硬规则：不存在「所有选项都被 require 挡掉」的事件
check('【硬规则】不存在「所有选项都被门槛挡掉」的事件', () => {
  const out = [];
  for (const ev of events) {
    const cs = ev.choices ?? [];
    if (cs.length === 0) continue;
    if (cs.every((c) => c.require)) out.push(`${ev.id} 的 ${cs.length} 个选项全都带 require（玩家可能无选项可选）`);
  }
  return out;
});

// 9. 硬规则：每个带 check 的选项都有 success + fail
check('【硬规则】每个带 check 的选项都有 success 与 fail 两条分支', () => {
  const out = [];
  for (const ev of events) {
    (ev.choices ?? []).forEach((c, i) => {
      if (!c.check) return;
      const label = `${ev.id} → 「${c.label ?? i}」`;
      if (!c.success) out.push(`${label} 有 check 但缺 success`);
      if (!c.fail) out.push(`${label} 有 check 但缺 fail`);
    });
  }
  return out;
});

// 10. 事件的 stage 与 require.age 区间不矛盾
check('事件的 stage 与 require.age 区间不矛盾', () => {
  const out = [];
  for (const ev of events) {
    const range = stageRange[ev.stage];
    if (!range) continue;
    const age = ev.require?.age;
    if (!age) continue;
    const [lo, hi] = age;
    if (hi < range[0] || lo > range[1]) {
      out.push(`${ev.id}（${STAGE_CN[ev.stage]} ${range[0]}~${range[1]}）写了 require.age = [${lo}, ${hi}]，两者永不可能同时成立`);
    }
  }
  return out;
});

// 11. critSuccess / critFail 只出现在 major: true 的选项上
check('critSuccess / critFail 只出现在 major: true 的选项上', () => {
  const out = [];
  for (const ev of events) {
    (ev.choices ?? []).forEach((c, i) => {
      if ((c.critSuccess || c.critFail) && !c.major) {
        out.push(`${ev.id} → 「${c.label ?? i}」写了 ${c.critSuccess ? 'critSuccess' : 'critFail'} 但未标 major: true`);
      }
    });
  }
  return out;
});

// 12. death 不出现在 success 分支上
check('death 不出现在 success（含 critSuccess 大成功）分支上', () => {
  const out = [];
  for (const ev of events) {
    (ev.choices ?? []).forEach((c, i) => {
      const label = `${ev.id} → 「${c.label ?? i}」`;
      if (c.success?.effects?.death) out.push(`${label} 的 success 分支写了 death（成功不该致死）`);
      if (c.critSuccess?.effects?.death) out.push(`${label} 的 critSuccess 分支写了 death（大成功不该致死）`);
    });
  }
  return out;
});

// 13. years 在 1~5
check('years 在 1~5 范围内', () => {
  const out = [];
  for (const ev of events) {
    if (ev.years === undefined) continue;
    if (!Number.isInteger(ev.years) || ev.years < 1 || ev.years > 5) out.push(`${ev.id} 的 years = ${ev.years}（应在 1~5）`);
  }
  return out;
});

// 14. 正文长度 40~80（不含换行符）
check(`事件正文字数在 ${TEXT_MIN}~${TEXT_MAX} 之间（不含换行）`, () => {
  const out = [];
  for (const ev of events) {
    const n = ev.text.replace(/\n/g, '').length;
    if (n < TEXT_MIN || n > TEXT_MAX) out.push(`${ev.id} 正文 ${n} 字（要求 ${TEXT_MIN}~${TEXT_MAX}）`);
  }
  return out;
});

// 15. 命名空间：特质内置标签（带下划线）与事件标签不应混用
check('特质标签与事件标签的命名空间没有混用', () => {
  const out = [];
  const underscored = (s) => [...s].filter((x) => x.includes('_'));
  const eventTagged = underscored(eventGrantedTags);
  if (eventTagged.length) out.push(`事件授予了带下划线的标签（那是特质内置标签的写法）：${eventTagged.join(', ')}`);
  const overlap = [...reqTags.keys()].filter((t) => traitTags.has(t) && eventGrantedTags.has(t));
  if (overlap.length) out.push(`同名标签既由特质授予、又由事件授予，来源含混：${overlap.join(', ')}`);
  return out;
});

// 16. 禁止目录导入：DevTools 的 TS 编译不做「目录 → index」解析，
//     `import x from './worlds/cyberpunk'` 运行时会按 cyberpunk.js 找模块直接报
//     「module is not defined」（2026-10-12 编译事故）。每个相对导入必须落在真实 .ts 文件上。
//     背景：本仓库的 Node 工具链（tools/lib/ts-resolve.mjs）会补 /index.ts，把这类 bug 在
//     Node 验证里掩盖掉，所以必须在这里静态拦住。
import fs from 'node:fs';
import path from 'node:path';
check('相对导入都指向真实 .ts 文件（禁止目录导入，DevTools 不解析 index）', () => {
  const out = [];
  const miniprogramDir = path.resolve(import.meta.dirname, '..', 'miniprogram');
  const files = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.ts')) files.push(p);
    }
  })(miniprogramDir);
  const re = /(?:from|import)\s*['"](\.[^'"]+)['"]/g;
  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(re)) {
      const spec = m[1];
      const resolved = path.resolve(path.dirname(file), spec);
      if (fs.existsSync(resolved + '.ts')) continue; // 指向真实文件 ✔
      if (fs.existsSync(path.join(resolved, 'index.ts'))) {
        out.push(`${path.relative(path.dirname(miniprogramDir), file).replace(/\\/g, '/')} 导入了目录 '${spec}' —— 请写全 '${spec}/index'（DevTools 运行时按 <路径>.js 找模块，目录导入必炸）`);
      } else {
        out.push(`${path.relative(path.dirname(miniprogramDir), file).replace(/\\/g, '/')} 导入了不存在的模块 '${spec}'（没有对应的 .ts 文件）`);
      }
    }
  }
  return out;
});

/* ------------------------------------------------------------------ */
/* 统计                                                                */
/* ------------------------------------------------------------------ */

const stageCount = {};
for (const ev of events) stageCount[ev.stage] = (stageCount[ev.stage] ?? 0) + 1;

const dcDist = {};
for (const ev of events) {
  for (const c of ev.choices ?? []) {
    if (!c.check) continue;
    dcDist[c.check.dc] = (dcDist[c.check.dc] ?? 0) + 1;
  }
}

const attrFreq = [...usedAttrKeys.entries()].sort((a, b) => b[1] - a[1]);
const producedTags = new Set([...traitTags, ...bgTags, ...eventGrantedTags]);
const consumedTags = [...reqTags.keys()];
const neverConsumed = [...producedTags].filter((t) => !reqTags.has(t));
const danglingConsumed = consumedTags.filter((t) => !producedTags.has(t));

// money 量级 vs 08 文档（08 文档写的是「壮年起 ±500」，而事件库实际到 ±800000，差 1600 倍）。
// 这是**已记录在案的数值尺度问题（修改清单 D3）**，不属于数据契约违规，
// 因此只报数、不判失败；等 D3 拍板后再决定是按新尺度缩放还是收紧文档。
let moneyCount = 0;
let moneyOver = 0;
let moneyMax = null;
for (const ev of events) {
  const limit = MONEY_LIMIT[ev.stage] ?? 500;
  for (const { effects } of eachEffects(ev)) {
    if (effects.money === undefined) continue;
    moneyCount++;
    if (Math.abs(effects.money) > limit) moneyOver++;
    if (!moneyMax || Math.abs(effects.money) > Math.abs(moneyMax.v)) moneyMax = { v: effects.money, id: ev.id, stage: ev.stage, limit };
  }
}

/* ------------------------------------------------------------------ */
/* 输出                                                                */
/* ------------------------------------------------------------------ */

const line = (s = '') => process.stdout.write(s + '\n');
const fails = results.filter((r) => r.errors.length > 0);

line('════════════════════════════════════════════');
line(' 幻行诗篇 · 数据契约校验');
line('════════════════════════════════════════════');
line(` 世界：${meta.name}（${meta.id}）  人生模型：${meta.lifeModel}  题材：${meta.genre}`);
line(` 事件 ${events.length} 条 · 特质 ${traits.length} 条 · 语义键来源 ${LEGAL_ATTR.length} 个`);
line('────────────────────────────────────────────');

results.forEach((r, i) => {
  const ok = r.errors.length === 0;
  line(`[${String(i + 1).padStart(2)}/${results.length}] ${ok ? '✔ 通过' : '✘ 不通过'}  ${r.name}`);
  if (!ok) for (const e of r.errors.slice(0, 20)) line(`        · ${e}`);
  if (!ok && r.errors.length > 20) line(`        · …另有 ${r.errors.length - 20} 条同类问题`);
});

line('────────────────────────────────────────────');
line(' 统计');
line(`   各阶段事件数：${Object.entries(stageCount).map(([s, n]) => `${STAGE_CN[s] ?? s} ${n}`).join(' · ')}`);
line(`   检定 DC 分布：${Object.entries(dcDist).sort((a, b) => Number(a[0]) - Number(b[0])).map(([dc, n]) => `DC${dc} ${n} 次`).join(' · ')}`);
line(`   语义键使用频次：${attrFreq.map(([k, n]) => `${k} ${n}`).join(' · ')}`);
line(`   心理状态量使用频次：${[...usedPsycheKeys.entries()].map(([k, n]) => `${k} ${n}`).join(' · ') || '（无）'}`);
line(`   标签：产出 ${producedTags.size} 种 / 被 require 消费 ${consumedTags.length} 种`);
line(`        · 产出但从未被消费：${neverConsumed.length} 种`);
line(`        · 消费但无来源：${danglingConsumed.length} 种`);
line(`   money 量级：出现 ${moneyCount} 处，超出 08 文档上限 ${moneyOver} 处` +
  (moneyMax ? `（最大 ${moneyMax.id} ${moneyMax.v}，${STAGE_CN[moneyMax.stage]}上限 ${moneyMax.limit}）` : ''));
if (moneyOver > 0) line('        ⚠ 这是已记录的数值尺度问题（修改清单 D3，文档 ±500 vs 数据 ±800000），本脚本只报数不判失败');
line('════════════════════════════════════════════');

if (fails.length === 0) {
  line(`✔ 全部 ${results.length} 项校验通过（数据层干净）`);
  process.exit(0);
} else {
  line(`✘ ${fails.length}/${results.length} 项校验不通过，共 ${fails.reduce((a, r) => a + r.errors.length, 0)} 条违规`);
  process.exit(1);
}