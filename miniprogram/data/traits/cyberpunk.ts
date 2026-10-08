/**
 * 幻行诗篇 · 赛博朋克专属特质池（G 组 · 世界专属）
 *
 * 设计依据：docs/design/02-character-layer.md 第 8 节 G 表
 *   义体等级（0-3）/ 神经污染等级 / 企业公民身份 / 黑客体质
 *
 * 与世界事件库共用 tags，供 LifeEvent.require.tags 做因果关系判定。
 */

import type { TraitOption, TraitSlotDef } from './types';

/** 世界专属槽：义体化 + 身份/污染 各抽一次 */
export const CYBERPUNK_SLOTS: TraitSlotDef[] = [
  { slot: 'world', name: '世界专属', picks: 2, required: false, poolChance: 0.6 },
];

export const CYBERPUNK_TRAITS: TraitOption[] = [
  // —— 义体 ——
  {
    id: 'cyber_chrome_level',
    name: '义体化程度',
    desc: '身上有多少不是原装的。',
    slot: 'world', paths: ['innate', 'acquired'], rarity: 'common',
    offset: { vitality: 1, empathy: -1 },
    tiers: [
      { level: 0, name: '零级 · 纯血肉', desc: '一件义体都没有。', offset: { empathy: 1, vitality: -1 }, promptTags: ['organic_body_no_implants'], promptNegative: ['cybernetic_implants'], moodTags: ['unmodified'] },
      { level: 1, name: '一级 · 轻度改造', desc: '一个接口，一副好用的眼睛。', offset: { vitality: 1 }, promptTags: ['small_neural_port', 'subtle_cybernetic_eye'], promptNegative: ['full_body_chrome'], moodTags: ['street_normal'] },
      { level: 2, name: '二级 · 中度改造', desc: '半条手臂是铁的。', offset: { vitality: 2, empathy: -1 }, promptTags: ['chrome_arm', 'visible_implants'], promptNegative: ['fully_organic_body'], moodTags: ['hardened'] },
      { level: 3, name: '三级 · 重度改造', desc: '你比机器更像机器。', offset: { vitality: 3, empathy: -3, resolve: 1 }, promptTags: ['full_body_chrome', 'cyber_limbs_all', 'glowing_implant_seams'], promptNegative: ['organic_skin', 'human_face_unmodified'], moodTags: ['inhuman', 'detached'] },
    ],
    tags: ['义体_改造'],
    unlock: { models: ['full', 'episodic'] },
    world: 'cyberpunk',
  },
  { id: 'cyber_neuro_port', name: '神经接入端口', desc: '后颈上那个插口让你能进网。', slot: 'world', paths: ['innate'], rarity: 'common', offset: { ingenuity: 2, empathy: -1 }, tags: ['义体_神经端口'], promptTags: ['neural_port_nape'], promptNegative: ['smooth_unbroken_skin'], world: 'cyberpunk' },
  { id: 'cyber_optics', name: '义眼', desc: '会放大，也会记录。', slot: 'world', paths: ['innate', 'acquired'], rarity: 'common', offset: { insight: 2, empathy: -1 }, tags: ['义体_义眼'], promptTags: ['cybernetic_eye', 'glowing_iris'], promptNegative: ['natural_human_eyes'], world: 'cyberpunk' },
  { id: 'cyber_dermal', name: '皮下装甲', desc: '刀划上去会打滑。', slot: 'world', paths: ['acquired'], rarity: 'rare', offset: { vitality: 3, empathy: -2, ingenuity: -1 }, tags: ['义体_皮下装甲'], promptTags: ['subdermal_plating', 'matte_armored_skin'], promptNegative: ['soft_flesh_skin'], unlock: { acquiredOnly: true }, world: 'cyberpunk' },
  { id: 'cyber_synth_voice', name: '合成声带', desc: '你的声音里有一点电子味。', slot: 'world', paths: ['innate', 'acquired'], rarity: 'common', offset: { empathy: -1, ingenuity: 1 }, tags: ['义体_合成声带'], promptTags: ['synthetic_voice_module', 'throat_implant'], promptNegative: ['natural_throat'], world: 'cyberpunk' },
  { id: 'cyber_purist', name: '原装主义', desc: '你拒绝在身上装任何东西。', slot: 'world', paths: ['innate'], rarity: 'rare', offset: { resolve: 2, empathy: 1, vitality: -1 }, tags: ['义体_拒绝'], moodTags: ['defiant'], world: 'cyberpunk' },

  // —— 神经污染 ——
  {
    id: 'cyber_neuro_pollution',
    name: '神经污染',
    desc: '网里的东西留了一点在你脑子里。',
    slot: 'world', paths: ['innate', 'acquired'], rarity: 'rare',
    offset: { resolve: -2, insight: 1 },
    tiers: [
      { level: 1, name: '轻度污染', desc: '偶尔听见不属于你的声音。', offset: { resolve: -2, insight: 1 }, promptTags: [], promptNegative: [], moodTags: ['static_hum'] },
      { level: 2, name: '中度污染', desc: '分不清哪些记忆是自己的。', offset: { resolve: -4, insight: 2, empathy: -2 }, promptTags: [], promptNegative: [], moodTags: ['fractured', 'glitching'] },
      { level: 3, name: '重度污染', desc: '你已经不太确定“你”还在不在。', offset: { resolve: -6, insight: 2, empathy: -4, reverie: 2 }, promptTags: [], promptNegative: [], moodTags: ['ghost_in_machine', 'unstable'] },
    ],
    tags: ['神经_污染'],
    safety: { sensitive: true, category: 'neuro', neutralLabel: '长期受网络信号影响' },
    world: 'cyberpunk',
  },
  { id: 'cyber_ghost_static', name: '神经底噪', desc: '安静的时候有嗡嗡声。', slot: 'world', paths: ['innate', 'acquired'], rarity: 'common', offset: { resolve: -1, insight: 1 }, tags: ['神经_底噪'], moodTags: ['buzzing'], world: 'cyberpunk' },
  { id: 'cyber_flatline_scar', name: '死过一次', desc: '你的档案上有一次临床死亡记录。', slot: 'world', paths: ['acquired'], rarity: 'rare', offset: { resolve: 3, empathy: -2, vitality: -2 }, tags: ['神经_死亡体验'], safety: { sensitive: true, category: 'neuro', neutralLabel: '曾一度停止生命体征' }, unlock: { acquiredOnly: true, minAge: 14 }, world: 'cyberpunk' },

  // —— 身份 ——
  { id: 'cyber_corp_citizen', name: '企业公民', desc: '你的身份是公司发的。', slot: 'world', paths: ['innate'], rarity: 'rare', offset: { insight: 1, empathy: -1, resolve: 1 }, tags: ['身份_企业公民'], moodTags: ['credentialed'], world: 'cyberpunk' },
  { id: 'cyber_corp_brat', name: '高管子弟', desc: '你在公司塔里长大。', slot: 'world', paths: ['innate'], rarity: 'rare', offset: { ingenuity: 2, empathy: -2, vitality: -1 }, tags: ['身份_企业高层'], moodTags: ['entitled'], world: 'cyberpunk' },
  { id: 'cyber_stateless', name: '无籍者', desc: '系统里查不到你。', slot: 'world', paths: ['innate'], rarity: 'common', offset: { insight: 2, resolve: 1, empathy: -1 }, tags: ['身份_无籍'], safety: { sensitive: true, category: 'origin', neutralLabel: '没有登记在册的身份' }, moodTags: ['invisible'], world: 'cyberpunk' },
  { id: 'cyber_nomad', name: '游牧者', desc: '你的家在车轮上。', slot: 'world', paths: ['innate'], rarity: 'rare', offset: { vitality: 2, ingenuity: 1, empathy: -1 }, tags: ['身份_游牧'], moodTags: ['road_worn'], world: 'cyberpunk' },
  { id: 'cyber_fixer_kid', name: '中间人子弟', desc: '你从小听大人谈价。', slot: 'world', paths: ['innate'], rarity: 'rare', offset: { empathy: 2, ingenuity: 2, insight: -1 }, tags: ['身份_中间人'], moodTags: ['streetwise'], world: 'cyberpunk' },
  { id: 'cyber_black_id', name: '黑市身份', desc: '你有一份别人的人生存档。', slot: 'world', paths: ['acquired'], rarity: 'rare', offset: { ingenuity: 2, resolve: -1 }, tags: ['身份_伪造'], safety: { sensitive: true, category: 'origin', neutralLabel: '使用非本人身份资料' }, unlock: { acquiredOnly: true, minAge: 14 }, world: 'cyberpunk' },

  // —— 黑客体质 ——
  { id: 'cyber_netrunner', name: '网潜者体质', desc: '你进网比别人快半拍。', slot: 'world', paths: ['innate'], rarity: 'rare', offset: { ingenuity: 3, insight: 1, vitality: -1 }, caps: ['netrunner'], tags: ['黑客_网潜'], moodTags: ['wired_in'], world: 'cyberpunk' },
  { id: 'cyber_ice_sense', name: '冰感', desc: '你能感觉到对面有陷阱。', slot: 'world', paths: ['innate'], rarity: 'rare', offset: { insight: 3, resolve: 1 }, caps: ['ice_sense'], tags: ['黑客_冰感'], world: 'cyberpunk' },
  { id: 'cyber_burnout_resist', name: '抗烧脑', desc: '别人过一次就废了的事，你扛得住。', slot: 'world', paths: ['innate'], rarity: 'rare', offset: { resolve: 3, vitality: 1 }, caps: ['burnout_resist'], tags: ['黑客_抗烧脑'], world: 'cyberpunk' },
  { id: 'cyber_data_intuition', name: '数据直觉', desc: '一堆日志里你能直接看出哪条不对。', slot: 'world', paths: ['innate'], rarity: 'common', offset: { insight: 2, ingenuity: 1, empathy: -1 }, tags: ['黑客_数据直觉'], world: 'cyberpunk' },

  // —— 赛博环境 ——
  { id: 'cyber_street_meds', name: '廉价仿制药依赖', desc: '便宜的止痛片，一天三次。', slot: 'world', paths: ['acquired'], rarity: 'common', offset: { vitality: -2, resolve: -1 }, tags: ['赛博_仿制药'], safety: { sensitive: true, category: 'addiction', neutralLabel: '长期依赖廉价药物' }, unlock: { acquiredOnly: true, minAge: 10 }, world: 'cyberpunk' },
  { id: 'cyber_chrome_rejection', name: '排异体质', desc: '装的每一样都和你打架。', slot: 'world', paths: ['innate', 'acquired'], rarity: 'rare', offset: { vitality: -3, resolve: 1 }, tags: ['义体_排异'], safety: { sensitive: true, category: 'internal', neutralLabel: '身体排斥植入物' }, world: 'cyberpunk' },
  { id: 'cyber_synth_blood', name: '合成血', desc: '输血的时候只能找你自己的型号。', slot: 'world', paths: ['innate', 'acquired'], rarity: 'common', offset: { vitality: 2, empathy: -1 }, tags: ['赛博_合成血'], safety: { sensitive: true, category: 'internal', neutralLabel: '体内是人造血' }, world: 'cyberpunk' },
  { id: 'cyber_memory_edit', name: '记忆编辑痕迹', desc: '你有几段记忆是买来的。', slot: 'world', paths: ['acquired'], rarity: 'rare', offset: { insight: -2, reverie: 2, resolve: -1 }, tags: ['赛博_记忆编辑'], safety: { sensitive: true, category: 'neuro', neutralLabel: '部分记忆并非亲身经历' }, unlock: { acquiredOnly: true, minAge: 12 }, world: 'cyberpunk' },
  { id: 'cyber_drone_affinity', name: '无人机亲和', desc: '机器听你的。', slot: 'world', paths: ['innate'], rarity: 'common', offset: { ingenuity: 2, insight: 1 }, caps: ['drone_link'], tags: ['赛博_无人机'], world: 'cyberpunk' },
];