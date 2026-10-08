/**
 * 幻行诗篇 · 通用特质池（第一部分）
 *
 * 设计依据：docs/design/02-character-layer.md
 *   第 2 节  三条获取路径 innate / acquired / state
 *   第 8 节  完整分类树
 *   第 11 节 稀有度与概率（sensitive × 0.3 由 types.ts 的 traitWeight 统一处理）
 *   第 12 节 因果关系（tags 供 Choice.require 使用）
 *
 * 本文件覆盖：主线槽 + A 生理·形态 + B 生理·机能 + C 心理·人格 + D 心理·病理 + E 天赋才能 + F 社会细项
 *
 * 写法约定：
 *   - `world: '*'` 表示通用池
 *   - 敏感特质必须带 safety.sensitive（权重会被压到 0.3 倍）
 *   - 带分档的特质用 tiers，其 offset / 提示词按档独立存
 *   - promptNegative 用于阻止绘图 AI「修复」残疾、疤痕、纹身等特征
 *   - D 组病理全部是后天型（acquired），必须带 unlock.requiresSuppression；
 *     未分档的病理（恐惧症 / 神经发育类）严重度变化由心理状态量承载，不再拆档
 */

import type { TraitOption, TraitSlotDef, SixOffset, PsycheState } from './types';
import { PSYCHE_BASELINE } from './_psyche-state';

/* ------------------------------------------------------------------ */
/* 池默认参数                                                          */
/* ------------------------------------------------------------------ */

/** 六维基线：每维起点 */
export const COMMON_BASELINE: SixOffset = {
  insight: 6,
  resolve: 6,
  empathy: 6,
  ingenuity: 6,
  reverie: 6,
  vitality: 6,
};

/** 数值预算上限：防「超人」与「废人」 */
export const COMMON_BUDGET_CAP = 8;

/** 六维合法区间 */
export const COMMON_RANGE: [number, number] = [0, 20];

export const COMMON_PSYCHE_BASELINE: PsycheState = { ...PSYCHE_BASELINE };

/** 槽位定义：主线槽必抽逐个定格；副线池先掷概率再翻命运牌 */
export const COMMON_SLOTS: TraitSlotDef[] = [
  // —— 主线槽 ——
  { slot: 'gender', name: '性别', picks: 1, required: true },
  { slot: 'height', name: '身高', picks: 1, required: true },
  { slot: 'build', name: '体型', picks: 1, required: true },
  { slot: 'hair', name: '发色', picks: 1, required: true },
  { slot: 'eye', name: '瞳色', picks: 1, required: true },
  { slot: 'vision', name: '视力', picks: 1, required: true },
  { slot: 'looks', name: '容貌', picks: 1, required: true },
  { slot: 'personality', name: '性格', picks: 1, required: true },
  { slot: 'morality', name: '道德', picks: 1, required: true },
  // 出身槽没有特质候选，抽的是世界背景包（05 文档主线槽第 10 项）
  { slot: 'origin', name: '出身', picks: 1, required: true },
  // —— 副线池（命运牌）——
  { slot: 'bodyForm', name: '生理·形态', picks: 1, required: false, poolChance: 0.4 },
  { slot: 'bodyFunc', name: '生理·机能', picks: 1, required: false, poolChance: 0.3 },
  { slot: 'psyche', name: '心理·人格', picks: 1, required: false, poolChance: 0.45 },
  { slot: 'psycheClinic', name: '心理·病理', picks: 1, required: false, poolChance: 0.2 },
  { slot: 'aptitude', name: '天赋才能', picks: 1, required: false, poolChance: 0.35 },
  { slot: 'social', name: '社会细项', picks: 1, required: false, poolChance: 0.3 },
];

/* ------------------------------------------------------------------ */
/* 主线槽特质                                                          */
/* ------------------------------------------------------------------ */

export const CORE_TRAITS: TraitOption[] = [
  // —— 性别 ——
  { id: 'gender_male', name: '男', desc: '生为男性。', slot: 'gender', paths: ['innate'], rarity: 'common', offset: {}, world: '*' },
  { id: 'gender_female', name: '女', desc: '生为女性。', slot: 'gender', paths: ['innate'], rarity: 'common', offset: {}, world: '*' },
  { id: 'gender_intersex', name: '间性', desc: '出生时性别特征不典型。', slot: 'gender', paths: ['innate'], rarity: 'rare', offset: { resolve: 1 }, tags: ['身份_间性'], safety: { sensitive: true, category: 'internal', neutralLabel: '性别特征不典型' }, world: '*' },

  // —— 身高 ——
  { id: 'height_dwarfism', name: '侏儒症', desc: '成年身高远低于常人。', slot: 'height', paths: ['innate'], rarity: 'rare', offset: { vitality: -1, resolve: 1 }, caps: ['short_stature'], visual: { value: 130, badge: '矮小' }, safety: { sensitive: true, category: 'internal', neutralLabel: '身材远低于常人' }, world: '*' },
  { id: 'height_short', name: '矮小', desc: '比同龄人矮一截。', slot: 'height', paths: ['innate'], rarity: 'common', offset: {}, visual: { value: 158 }, world: '*' },
  { id: 'height_average', name: '中等身材', desc: '不高不矮。', slot: 'height', paths: ['innate'], rarity: 'common', offset: {}, visual: { value: 170 }, world: '*' },
  { id: 'height_tall', name: '高挑', desc: '个子偏高。', slot: 'height', paths: ['innate'], rarity: 'common', offset: { vitality: 1 }, visual: { value: 182 }, world: '*' },
  { id: 'height_giant', name: '极高', desc: '走到哪里都显眼。', slot: 'height', paths: ['innate'], rarity: 'rare', offset: { vitality: 1, empathy: -1 }, visual: { value: 196 }, world: '*' },

  // —— 体型 ——
  { id: 'build_frail', name: '瘦弱', desc: '风一吹就要倒。', slot: 'build', paths: ['innate'], rarity: 'common', offset: { vitality: -2 }, visual: { badge: '瘦' }, world: '*' },
  { id: 'build_average', name: '匀称', desc: '标准身形。', slot: 'build', paths: ['innate'], rarity: 'common', offset: {}, world: '*' },
  { id: 'build_stout', name: '壮硕', desc: '肩宽背厚。', slot: 'build', paths: ['innate'], rarity: 'common', offset: { vitality: 2 }, world: '*' },
  { id: 'build_obese', name: '肥胖', desc: '体重超标。', slot: 'build', paths: ['innate'], rarity: 'common', offset: { vitality: -2, resolve: -1 }, tags: ['外貌_肥胖'], safety: { tender: true, category: 'looks', neutralLabel: '体重偏高' }, world: '*' },
  { id: 'build_muscular', name: '肌肉发达', desc: '一看就是练过的。', slot: 'build', paths: ['innate'], rarity: 'common', offset: { vitality: 2, resolve: 1 }, world: '*' },
  { id: 'build_big_frame', name: '骨架宽大', desc: '天生的好身板。', slot: 'build', paths: ['innate'], rarity: 'common', offset: { vitality: 1 }, world: '*' },

  // —— 发色 ——
  { id: 'hair_black', name: '乌黑', desc: '最寻常的发色。', slot: 'hair', paths: ['innate'], rarity: 'common', offset: {}, visual: { color: '#1B1B1B' }, world: '*' },
  { id: 'hair_dark_brown', name: '深棕', desc: '低调的褐色。', slot: 'hair', paths: ['innate'], rarity: 'common', offset: {}, visual: { color: '#4A2C17' }, world: '*' },
  { id: 'hair_light_brown', name: '亚麻', desc: '浅褐带一点灰。', slot: 'hair', paths: ['innate'], rarity: 'common', offset: {}, visual: { color: '#A87B4F' }, world: '*' },
  { id: 'hair_blonde', name: '金', desc: '阳光下很亮眼。', slot: 'hair', paths: ['innate'], rarity: 'rare', offset: { empathy: 1 }, visual: { color: '#E3C36B' }, world: '*' },
  { id: 'hair_red', name: '红褐', desc: '不多见的暖调。', slot: 'hair', paths: ['innate'], rarity: 'rare', offset: { reverie: 1 }, visual: { color: '#A63A2A' }, world: '*' },
  { id: 'hair_silver', name: '银白', desc: '像落了一层霜。', slot: 'hair', paths: ['innate'], rarity: 'rare', offset: { reverie: 1, empathy: -1 }, visual: { color: '#D8D8D2' }, world: '*' },
  { id: 'hair_gray', name: '灰', desc: '没什么存在感的颜色。', slot: 'hair', paths: ['innate'], rarity: 'common', offset: {}, visual: { color: '#8A8A86' }, world: '*' },
  { id: 'hair_bleached', name: '染彩', desc: '自己染的颜色，掉过几轮。', slot: 'hair', paths: ['innate', 'acquired'], rarity: 'common', offset: { reverie: 1 }, visual: { color: '#7B4FBF' }, world: '*' },

  // —— 瞳色 ——
  { id: 'eye_black', name: '墨黑', desc: '深得看不进底。', slot: 'eye', paths: ['innate'], rarity: 'common', offset: {}, visual: { color: '#141414' }, world: '*' },
  { id: 'eye_dark_brown', name: '深棕', desc: '最常见的瞳色。', slot: 'eye', paths: ['innate'], rarity: 'common', offset: {}, visual: { color: '#3B2416' }, world: '*' },
  { id: 'eye_light_brown', name: '琥珀', desc: '光下有暖色透出来。', slot: 'eye', paths: ['innate'], rarity: 'common', offset: { empathy: 1 }, visual: { color: '#B67A3A' }, world: '*' },
  { id: 'eye_green', name: '翠绿', desc: '少见，像有东西在里面活着。', slot: 'eye', paths: ['innate'], rarity: 'rare', offset: { reverie: 1 }, visual: { color: '#3F7A52' }, world: '*' },
  { id: 'eye_blue', name: '湖蓝', desc: '很浅的蓝。', slot: 'eye', paths: ['innate'], rarity: 'rare', offset: { empathy: 1 }, visual: { color: '#5C8FAF' }, world: '*' },
  { id: 'eye_gray', name: '灰蓝', desc: '像退色的天空。', slot: 'eye', paths: ['innate'], rarity: 'common', offset: {}, visual: { color: '#7C8A93' }, world: '*' },
  { id: 'eye_heterochromia', name: '异瞳', desc: '两只眼睛颜色不同。', slot: 'eye', paths: ['innate'], rarity: 'rare', offset: { reverie: 1, empathy: 1 }, tags: ['外貌_异瞳'], visual: { color: '#5C8FAF', color2: '#B67A3A', glyph: 'heterochromia' }, promptTags: ['heterochromia', 'two_different_eye_colors'], promptNegative: ['matching_eye_color'], moodTags: ['unsettling', 'memorable'], world: '*' },

  // —— 视力 ——
  { id: 'vision_normal', name: '视力良好', desc: '看得很清楚。', slot: 'vision', paths: ['innate'], rarity: 'common', offset: { insight: 1 }, world: '*' },
  { id: 'vision_myopia', name: '近视', desc: '远处一片糊。', slot: 'vision', paths: ['innate', 'acquired'], rarity: 'common', offset: { insight: -1 }, visual: { glyph: 'glasses' }, promptTags: ['glasses'], world: '*' },
  { id: 'vision_hyperopia', name: '远视', desc: '近处反而吃力。', slot: 'vision', paths: ['innate', 'acquired'], rarity: 'common', offset: { insight: -1 }, visual: { glyph: 'glasses' }, promptTags: ['glasses'], world: '*' },
  { id: 'vision_astigmatism', name: '散光', desc: '光会散成一片。', slot: 'vision', paths: ['innate', 'acquired'], rarity: 'common', offset: { insight: -1 }, visual: { glyph: 'glasses' }, world: '*' },
  { id: 'vision_colorblind', name: '色盲', desc: '世界少了几个频道。', slot: 'vision', paths: ['innate'], rarity: 'rare', offset: { insight: 1, empathy: -1 }, caps: ['colorblind'], safety: { sensitive: true, category: 'senses', neutralLabel: '辨色困难' }, world: '*' },
  { id: 'vision_nightblind', name: '夜盲', desc: '天一黑就什么都看不清。', slot: 'vision', paths: ['innate'], rarity: 'rare', offset: { insight: -1, vitality: -1 }, caps: ['nightblind'], safety: { sensitive: true, category: 'senses', neutralLabel: '暗处看不清' }, world: '*' },
  { id: 'vision_single_eye', name: '单眼视力', desc: '只有一只眼睛能用。', slot: 'vision', paths: ['innate', 'acquired'], rarity: 'rare', offset: { insight: -1, resolve: 1 }, caps: ['monocular'], safety: { sensitive: true, category: 'senses', neutralLabel: '单眼视物' }, promptTags: ['eye_patch', 'one_eye_covered'], promptNegative: ['two_healthy_eyes'], world: '*' },
  { id: 'vision_blind_innate', name: '先天失明', desc: '从出生起，世界就只有声音和触感。', slot: 'vision', paths: ['innate'], rarity: 'curse', offset: { insight: 4, empathy: 2, vitality: -3 }, caps: ['blind'], tags: ['感官_无视觉'], safety: { sensitive: true, category: 'senses', neutralLabel: '生来看不见' }, visual: { glyph: 'eye-off', badge: '盲' }, promptTags: ['blind_person', 'white_cane', 'sightless_eyes'], promptNegative: ['looking_at_camera', 'direct_eye_contact'], moodTags: ['attentive', 'inward'], world: '*' },
  { id: 'vision_blind_acquired', name: '后天失明', desc: '你记得光的样子，这让你更难熬。', slot: 'vision', paths: ['acquired'], rarity: 'curse', offset: { insight: 3, resolve: -2, vitality: -3 }, caps: ['blind'], tags: ['感官_无视觉', '创伤_失明'], safety: { sensitive: true, category: 'senses', neutralLabel: '后来看不见了' }, visual: { glyph: 'eye-off', badge: '盲' }, promptTags: ['blind_person', 'white_cane', 'sightless_eyes'], promptNegative: ['looking_at_camera', 'direct_eye_contact'], moodTags: ['grieving', 'guarded'], unlock: { acquiredOnly: true, minAge: 7 }, world: '*' },

  // —— 容貌 ——
  { id: 'looks_striking', name: '出众', desc: '走到哪里都被多看两眼。', slot: 'looks', paths: ['innate'], rarity: 'rare', offset: { empathy: 2 }, tags: ['外貌_出众'], visual: { badge: '美' }, promptTags: ['strikingly_beautiful'], moodTags: ['confident'], world: '*' },
  { id: 'looks_pleasant', name: '清秀', desc: '干净，让人愿意亲近。', slot: 'looks', paths: ['innate'], rarity: 'common', offset: { empathy: 1 }, world: '*' },
  { id: 'looks_ordinary', name: '寻常', desc: '丢进人堆找不出来。', slot: 'looks', paths: ['innate'], rarity: 'common', offset: {}, world: '*' },
  { id: 'looks_plain', name: '其貌不扬', desc: '不太起眼。', slot: 'looks', paths: ['innate'], rarity: 'common', offset: { empathy: -1 }, world: '*' },
  { id: 'looks_ugly', name: '丑陋', desc: '这张脸给你添过不少麻烦。', slot: 'looks', paths: ['innate'], rarity: 'rare', offset: { empathy: -2, resolve: 1 }, tags: ['外貌_丑陋'], safety: { tender: true, category: 'looks', neutralLabel: '不太受欢迎的长相' }, world: '*' },
  { id: 'looks_babyface', name: '娃娃脸', desc: '总被当成比实际小。', slot: 'looks', paths: ['innate'], rarity: 'common', offset: { empathy: 1, insight: -1 }, visual: { badge: '显小' }, world: '*' },
  { id: 'looks_aged', name: '显老', desc: '二十岁被叫老师。', slot: 'looks', paths: ['innate'], rarity: 'common', offset: { insight: 1, empathy: -1 }, visual: { badge: '显长' }, world: '*' },

  // —— 性格（大五 + 气质）——
  { id: 'pers_outgoing', name: '外向开朗', desc: '在人群里才活过来。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { empathy: 2, insight: -1 }, tags: ['性格_外向'], moodTags: ['cheerful', 'open'], world: '*' },
  { id: 'pers_introverted', name: '内向沉静', desc: '话少，但看得多。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { insight: 2, empathy: -1 }, tags: ['性格_内向'], moodTags: ['reserved', 'watchful'], world: '*' },
  { id: 'pers_diligent', name: '尽责自律', desc: '答应的事一定会做到。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { resolve: 2 }, tags: ['性格_自律'], moodTags: ['composed'], world: '*' },
  { id: 'pers_easygoing', name: '散漫随性', desc: '计划总在明天。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { resolve: -2, reverie: 1 }, tags: ['性格_散漫'], world: '*' },
  { id: 'pers_curious', name: '开放好奇', desc: '什么都要试一试。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { reverie: 2, insight: 1 }, tags: ['性格_好奇'], moodTags: ['curious'], world: '*' },
  { id: 'pers_conservative', name: '守成保守', desc: '熟悉的东西才安心。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { resolve: 1, reverie: -2 }, tags: ['性格_保守'], world: '*' },
  { id: 'pers_agreeable', name: '温和宜人', desc: '很少和人起冲突。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { empathy: 2, resolve: -1 }, tags: ['性格_温和'], moodTags: ['gentle'], world: '*' },
  { id: 'pers_harsh', name: '尖锐刻薄', desc: '嘴上从不饶人。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { empathy: -2, insight: 1 }, tags: ['性格_刻薄'], moodTags: ['sharp', 'sardonic'], world: '*' },
  { id: 'pers_stable', name: '情绪稳定', desc: '天塌下来也睡得着。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { resolve: 2, reverie: -1 }, tags: ['性格_稳定'], moodTags: ['steady'], world: '*' },
  { id: 'pers_sensitive', name: '敏感易扰', desc: '一句话能想一整夜。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { insight: 2, resolve: -2, reverie: 1 }, tags: ['性格_敏感'], moodTags: ['fragile', 'alert'], world: '*' },
  { id: 'pers_optimist', name: '乐观', desc: '总觉得会好起来。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { resolve: 1, empathy: 1 }, tags: ['性格_乐观'], moodTags: ['hopeful'], world: '*' },
  { id: 'pers_pessimist', name: '悲观', desc: '先想最坏的一种。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { insight: 1, resolve: -1 }, tags: ['性格_悲观'], moodTags: ['somber'], world: '*' },
  { id: 'pers_cynical', name: '愤世嫉俗', desc: '看什么都不顺眼。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { insight: 2, empathy: -2 }, tags: ['性格_愤世'], moodTags: ['cynical'], world: '*' },
  { id: 'pers_naive', name: '天真', desc: '还没被世界教过。', slot: 'personality', paths: ['innate'], rarity: 'common', offset: { empathy: 2, insight: -2 }, tags: ['性格_天真'], moodTags: ['innocent'], world: '*' },

  // —— 道德 ——
  { id: 'mor_altruist', name: '利他', desc: '先想别人。', slot: 'morality', paths: ['innate'], rarity: 'common', offset: { empathy: 2 }, tags: ['道德_利他'], world: '*' },
  { id: 'mor_egoist', name: '利己', desc: '先想自己。', slot: 'morality', paths: ['innate'], rarity: 'common', offset: { insight: 1, empathy: -1 }, tags: ['道德_利己'], world: '*' },
  { id: 'mor_orderly', name: '守序', desc: '规则就是规则。', slot: 'morality', paths: ['innate'], rarity: 'common', offset: { resolve: 2, ingenuity: -1 }, tags: ['道德_守序'], world: '*' },
  { id: 'mor_rebel', name: '叛逆', desc: '偏不。', slot: 'morality', paths: ['innate'], rarity: 'common', offset: { ingenuity: 2, resolve: -1 }, tags: ['道德_叛逆'], world: '*' },
  { id: 'mor_opportunist', name: '投机', desc: '哪边风大往哪边站。', slot: 'morality', paths: ['innate'], rarity: 'common', offset: { ingenuity: 2, empathy: -2 }, tags: ['道德_投机'], world: '*' },
  { id: 'mor_cynic', name: '犬儒', desc: '什么都不信。', slot: 'morality', paths: ['innate'], rarity: 'common', offset: { insight: 2, empathy: -2 }, tags: ['道德_犬儒'], world: '*' },
  { id: 'mor_upright', name: '正直', desc: '宁可吃亏也不弯腰。', slot: 'morality', paths: ['innate'], rarity: 'rare', offset: { resolve: 3, ingenuity: -1 }, tags: ['道德_正直'], moodTags: ['principled'], world: '*' },
  { id: 'mor_apathetic', name: '漠然', desc: '与我无关。', slot: 'morality', paths: ['innate'], rarity: 'common', offset: { empathy: -2, resolve: 1 }, tags: ['道德_漠然'], world: '*' },
];

/* ------------------------------------------------------------------ */
/* A 生理·形态（视觉可见）                                              */
/* ------------------------------------------------------------------ */

export const BODY_FORM_TRAITS: TraitOption[] = [
  // 面部
  { id: 'form_freckles', name: '雀斑', desc: '鼻梁上一片小点。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', offset: {}, safety: { tender: true, category: 'looks' }, visual: { badge: '雀斑' }, promptTags: ['freckles'], promptNegative: ['clear_skin'], world: '*' },
  { id: 'form_birthmark', name: '胎记', desc: '一块从出生就有的印。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', weight: 4, offset: {}, visual: { badge: '胎记' }, promptTags: ['birthmark_visible'], promptNegative: ['clear_skin'], world: '*' },
  { id: 'form_scar_face', name: '面部疤痕', desc: '一道消不掉的痕。', slot: 'bodyForm', paths: ['innate', 'acquired'], rarity: 'common', offset: { resolve: 1, empathy: -1 }, safety: { tender: true, category: 'looks' }, visual: { badge: '疤痕' }, promptTags: ['facial_scar'], promptNegative: ['flawless_skin', 'healed_without_trace'], moodTags: ['weathered'], world: '*' },
  { id: 'form_mole', name: '痣', desc: '一颗很显眼的痣。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', weight: 4, offset: {}, visual: { badge: '痣' }, world: '*' },
  { id: 'form_acne_scars', name: '痘印', desc: '少年时留下的痕迹。', slot: 'bodyForm', paths: ['innate', 'acquired'], rarity: 'common', offset: { empathy: -1 }, safety: { tender: true, category: 'looks' }, promptTags: ['acne_scars'], promptNegative: ['flawless_skin'], world: '*' },

  // 毛发
  { id: 'form_hair_thick', name: '发量浓密', desc: '绑起来一手都握不住。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', weight: 4, offset: {}, promptTags: ['thick_hair'], world: '*' },
  { id: 'form_hair_thin', name: '发量稀疏', desc: '梳头时总要多绕两圈。', slot: 'bodyForm', paths: ['innate', 'acquired'], rarity: 'common', offset: { empathy: -1 }, safety: { tender: true, category: 'looks' }, promptTags: ['thin_hair'], promptNegative: ['thick_lustrous_hair'], world: '*' },
  { id: 'form_bald_early', name: '早秃', desc: '还没到三十，头顶先亮了。', slot: 'bodyForm', paths: ['innate', 'acquired'], rarity: 'common', offset: { empathy: -1 }, safety: { tender: true, category: 'looks' }, promptTags: ['balding', 'receding_hairline'], promptNegative: ['full_head_of_hair'], unlock: { minAge: 20 }, world: '*' },
  { id: 'form_hair_curly', name: '卷发', desc: '天生的，梳不开。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', weight: 4, offset: {}, promptTags: ['curly_hair'], world: '*' },
  { id: 'form_hair_straight', name: '直发', desc: '顺顺地垂下来。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', weight: 4, offset: {}, promptTags: ['straight_hair'], world: '*' },
  { id: 'form_hair_coarse', name: '粗硬发质', desc: '像一把刷子。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', weight: 4, offset: {}, promptTags: ['coarse_hair'], world: '*' },
  { id: 'form_hair_fine', name: '细软发质', desc: '一吹就乱。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', weight: 4, offset: {}, promptTags: ['fine_fragile_hair'], world: '*' },
  { id: 'form_body_hair_heavy', name: '体毛浓密', desc: '夏天不太好过。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', offset: {}, safety: { tender: true, category: 'looks', neutralLabel: '体毛较多' }, world: '*' },
  { id: 'form_white_hair_early', name: '少白头', desc: '二十几岁就有白头发。', slot: 'bodyForm', paths: ['innate', 'acquired'], rarity: 'common', offset: { insight: 1 }, promptTags: ['premature_grey_hair'], world: '*' },

  // 眼睛（形象）
  { id: 'form_eye_almond', name: '杏眼', desc: '圆而亮。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', offset: { empathy: 1 }, promptTags: ['almond_eyes'], world: '*' },
  { id: 'form_eye_phoenix', name: '丹凤眼', desc: '眼尾长长地吊着。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', offset: { empathy: 1, insight: 1 }, promptTags: ['phoenix_eyes', 'upturned_eyes'], world: '*' },
  { id: 'form_eye_downturned', name: '下垂眼', desc: '总像有点委屈。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', offset: { empathy: 1 }, promptTags: ['downturned_eyes'], moodTags: ['melancholic'], world: '*' },
  { id: 'form_eye_bags', name: '眼袋', desc: '睡多久都有。', slot: 'bodyForm', paths: ['innate', 'acquired'], rarity: 'common', offset: { vitality: -1 }, promptTags: ['eye_bags', 'tired_eyes'], world: '*' },
  { id: 'form_dark_circles', name: '黑眼圈', desc: '常年挂着两团青。', slot: 'bodyForm', paths: ['innate', 'acquired'], rarity: 'common', offset: { vitality: -1 }, promptTags: ['dark_circles', 'sleep_deprived'], moodTags: ['weary'], world: '*' },

  // 牙齿
  { id: 'form_teeth_buck', name: '龅牙', desc: '笑起来有点不好意思。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', offset: { empathy: -1 }, safety: { tender: true, category: 'looks', neutralLabel: '牙齿前突' }, promptTags: ['buck_teeth'], promptNegative: ['perfect_teeth'], world: '*' },
  { id: 'form_teeth_missing', name: '缺牙', desc: '少了一颗，说话有点漏风。', slot: 'bodyForm', paths: ['innate', 'acquired'], rarity: 'common', offset: { empathy: -1 }, safety: { sensitive: true, category: 'looks' }, promptTags: ['missing_tooth'], promptNegative: ['perfect_teeth'], world: '*' },
  { id: 'form_teeth_braces', name: '牙套', desc: '金属的反光。', slot: 'bodyForm', paths: ['acquired'], rarity: 'common', offset: {}, promptTags: ['dental_braces'], unlock: { acquiredOnly: true }, world: '*' },
  { id: 'form_teeth_stained', name: '烟渍牙', desc: '刷不掉的黄。', slot: 'bodyForm', paths: ['acquired'], rarity: 'common', offset: { empathy: -1 }, safety: { tender: true, category: 'looks' }, promptTags: ['stained_teeth'], promptNegative: ['white_teeth'], unlock: { acquiredOnly: true }, world: '*' },

  // 皮肤
  { id: 'form_skin_dark', name: '肤色偏深', desc: '晒太阳不容易红。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', offset: {}, promptTags: ['dark_skin'], world: '*' },
  { id: 'form_skin_fair', name: '肤色白皙', desc: '一晒就红。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', offset: {}, promptTags: ['fair_skin'], world: '*' },
  { id: 'form_scar_forming', name: '疤痕体质', desc: '一点小伤也要留印。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', offset: { vitality: -1 }, promptTags: ['visible_scars_on_skin'], promptNegative: ['flawless_skin'], world: '*' },
  { id: 'form_vitiligo', name: '白癜风', desc: '皮肤上一块块地褪色。', slot: 'bodyForm', paths: ['innate', 'acquired'], rarity: 'rare', offset: { empathy: -1, resolve: 1 }, safety: { sensitive: true, category: 'looks', neutralLabel: '皮肤色素不均' }, promptTags: ['vitiligo_patches'], promptNegative: ['uniform_skin_tone'], world: '*' },
  { id: 'form_psoriasis', name: '银屑病', desc: '反复发作，很痒。', slot: 'bodyForm', paths: ['innate', 'acquired'], rarity: 'rare', offset: { vitality: -2, empathy: -1 }, safety: { sensitive: true, category: 'looks', neutralLabel: '皮肤反复脱屑' }, promptTags: ['psoriasis_plaques'], promptNegative: ['clear_skin'], world: '*' },
  { id: 'form_sensitive_skin', name: '敏感肌', desc: '换个洗衣粉就起疹。', slot: 'bodyForm', paths: ['innate'], rarity: 'common', offset: { vitality: -1 }, world: '*' },

  // 年龄感
  { id: 'form_premature_aging', name: '早衰', desc: '身体比年龄老得快。', slot: 'bodyForm', paths: ['innate', 'acquired'], rarity: 'rare', offset: { vitality: -2, insight: 1 }, safety: { sensitive: true, category: 'looks', neutralLabel: '比实际年龄显老' }, promptTags: ['prematurely_aged_face'], promptNegative: ['youthful_smooth_skin'], world: '*' },
];

/* ------------------------------------------------------------------ */
/* B 生理·机能（半可见）                                                */
/* ------------------------------------------------------------------ */

export const BODY_FUNC_TRAITS: TraitOption[] = [
  // 听力
  { id: 'func_hearing_keen', name: '听力敏锐', desc: '隔一层墙也能听出是谁。', slot: 'bodyFunc', paths: ['innate'], rarity: 'common', offset: { insight: 2 }, world: '*' },
  { id: 'func_hard_of_hearing', name: '弱听', desc: '总要别人再说一遍。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'common', offset: { insight: -1, empathy: -1 }, caps: ['hard_of_hearing'], safety: { sensitive: true, category: 'senses', neutralLabel: '听力偏弱' }, promptTags: ['hearing_aid'], promptNegative: ['perfect_hearing'], world: '*' },
  { id: 'func_deaf_one_ear', name: '单耳失聪', desc: '分不清声音从哪边来。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'rare', offset: { insight: -1, resolve: 1 }, caps: ['single_side_deaf'], safety: { sensitive: true, category: 'senses', neutralLabel: '一侧听不见' }, world: '*' },
  { id: 'func_deaf_innate', name: '先天耳聋', desc: '世界从一开始就是安静的。', slot: 'bodyFunc', paths: ['innate'], rarity: 'curse', offset: { insight: 3, empathy: 1, vitality: -2 }, caps: ['deaf'], tags: ['感官_无听觉'], safety: { sensitive: true, category: 'senses', neutralLabel: '生来听不见' }, visual: { glyph: 'ear-off', badge: '聋' }, promptTags: ['deaf_person', 'sign_language'], promptNegative: ['responding_to_sound'], moodTags: ['attentive', 'quiet'], world: '*' },
  { id: 'func_deaf_acquired', name: '后天耳聋', desc: '你记得声音，这让你更难熬。', slot: 'bodyFunc', paths: ['acquired'], rarity: 'curse', offset: { insight: 2, resolve: -2, vitality: -2 }, caps: ['deaf'], tags: ['感官_无听觉', '创伤_失聪'], safety: { sensitive: true, category: 'senses', neutralLabel: '后来听不见了' }, visual: { glyph: 'ear-off', badge: '聋' }, promptTags: ['deaf_person', 'sign_language'], promptNegative: ['responding_to_sound'], moodTags: ['grieving'], unlock: { acquiredOnly: true, minAge: 7 }, world: '*' },

  // 言语
  { id: 'func_stutter', name: '口吃', desc: '一句话要在嘴里绕很久。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'common', offset: { empathy: -1, resolve: 1 }, caps: ['stutter'], safety: { tender: true, category: 'senses', neutralLabel: '说话不顺畅' }, promptTags: ['stuttering', 'tense_expression_while_speaking'], world: '*' },
  { id: 'func_hoarse', name: '嗓音沙哑', desc: '像砂纸擦过。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'common', offset: { empathy: -1 }, promptTags: ['hoarse_voice_frame'], world: '*' },
  { id: 'func_aphasia', name: '失语', desc: '话都在，出不来。', slot: 'bodyFunc', paths: ['acquired'], rarity: 'curse', offset: { empathy: -3, insight: 2 }, caps: ['mute'], safety: { sensitive: true, category: 'senses', neutralLabel: '说不出话' }, promptTags: ['mute_person', 'notebook_for_writing'], promptNegative: ['speaking_confidently'], unlock: { acquiredOnly: true }, world: '*' },
  { id: 'func_voice_clear', name: '嗓音清亮', desc: '一开口就有人回头。', slot: 'bodyFunc', paths: ['innate'], rarity: 'common', offset: { empathy: 1 }, world: '*' },

  // 嗅觉 / 味觉
  { id: 'func_anosmia', name: '嗅觉失灵', desc: '闻不到雨后的味道。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'common', offset: { insight: -1 }, caps: ['anosmia'], safety: { sensitive: true, category: 'senses', neutralLabel: '闻不到气味' }, world: '*' },
  { id: 'func_smell_keen', name: '嗅觉敏锐', desc: '能闻出别人昨晚吃了什么。', slot: 'bodyFunc', paths: ['innate'], rarity: 'common', offset: { insight: 2, empathy: -1 }, world: '*' },
  { id: 'func_taste_weak', name: '味觉迟钝', desc: '吃什么都差不多。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'common', weight: 4, offset: { reverie: -1 }, world: '*' },

  // 触觉 / 痛觉
  { id: 'func_pain_insensitive', name: '痛觉迟钝', desc: '受伤了要好久才发觉。', slot: 'bodyFunc', paths: ['innate'], rarity: 'rare', offset: { resolve: 2, insight: -2 }, safety: { sensitive: true, category: 'neuro', neutralLabel: '对疼痛不敏感' }, world: '*' },
  { id: 'func_pain_hypersensitive', name: '痛觉过敏', desc: '轻轻一碰也很疼。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'rare', offset: { resolve: -2, insight: 1 }, safety: { sensitive: true, category: 'neuro', neutralLabel: '对疼痛格外敏感' }, world: '*' },
  { id: 'func_cip', name: '先天性无痛症', desc: '你从不知道疼是什么。', slot: 'bodyFunc', paths: ['innate'], rarity: 'rare', offset: { resolve: 3, insight: -2, vitality: -1 }, caps: ['pain_insensitive'], safety: { sensitive: true, category: 'neuro', neutralLabel: '天生感觉不到疼痛' }, world: '*' },

  // 运动
  { id: 'func_athletic', name: '运动天赋', desc: '身体比脑子先学会。', slot: 'bodyFunc', paths: ['innate'], rarity: 'common', offset: { vitality: 2 }, promptTags: ['athletic_build'], moodTags: ['energetic'], world: '*' },
  { id: 'func_clumsy', name: '动作笨拙', desc: '总在同一个门框撞到肩。', slot: 'bodyFunc', paths: ['innate'], rarity: 'common', offset: { vitality: -1, ingenuity: -1 }, moodTags: ['awkward'], world: '*' },
  { id: 'func_poor_balance', name: '平衡感差', desc: '走直线都费劲。', slot: 'bodyFunc', paths: ['innate'], rarity: 'common', offset: { vitality: -1 }, safety: { sensitive: true, category: 'neuro', neutralLabel: '平衡感不佳' }, world: '*' },

  // 肢体
  { id: 'func_limb_arm_innate', name: '先天缺臂', desc: '从出生起就少了一只手。', slot: 'bodyFunc', paths: ['innate'], rarity: 'curse', offset: { vitality: -3, resolve: 2, ingenuity: 1 }, caps: ['missing_arm'], tags: ['身体_缺肢'], safety: { sensitive: true, category: 'limbs', neutralLabel: '生来缺少手臂' }, visual: { glyph: 'arm-missing', badge: '缺臂' }, promptTags: ['amputee_arm', 'one_arm'], promptNegative: ['two_intact_arms', 'arms_regenerated'], moodTags: ['adaptable'], world: '*' },
  { id: 'func_limb_arm_acquired', name: '后天缺臂', desc: '你记得两只手时的样子。', slot: 'bodyFunc', paths: ['acquired'], rarity: 'curse', offset: { vitality: -3, resolve: -1 }, caps: ['missing_arm'], tags: ['身体_缺肢', '创伤_截肢'], safety: { sensitive: true, category: 'limbs', neutralLabel: '后来失去了手臂' }, visual: { glyph: 'arm-missing', badge: '缺臂' }, promptTags: ['amputee_arm', 'prosthetic_arm'], promptNegative: ['two_intact_arms'], moodTags: ['grieving'], unlock: { acquiredOnly: true }, world: '*' },
  { id: 'func_limb_leg_innate', name: '先天缺腿', desc: '从出生起就走不了路。', slot: 'bodyFunc', paths: ['innate'], rarity: 'curse', offset: { vitality: -4, resolve: 2, insight: 1 }, caps: ['missing_leg', 'wheelchair'], tags: ['身体_缺肢'], safety: { sensitive: true, category: 'limbs', neutralLabel: '生来缺少腿' }, visual: { glyph: 'leg-missing', badge: '缺腿' }, promptTags: ['amputee_legs', 'wheelchair'], promptNegative: ['standing_legs', 'walking_unaided', 'full_body_intact'], moodTags: ['determined'], world: '*' },
  { id: 'func_limb_leg_acquired', name: '后天缺腿', desc: '你记得走路的重量。', slot: 'bodyFunc', paths: ['acquired'], rarity: 'curse', offset: { vitality: -4, resolve: -1 }, caps: ['missing_leg', 'wheelchair'], tags: ['身体_缺肢', '创伤_截肢'], safety: { sensitive: true, category: 'limbs', neutralLabel: '后来失去了腿' }, visual: { glyph: 'leg-missing', badge: '缺腿' }, promptTags: ['amputee_legs', 'wheelchair', 'prosthetic_legs'], promptNegative: ['standing_legs', 'walking_unaided'], moodTags: ['grieving'], unlock: { acquiredOnly: true }, world: '*' },
  { id: 'func_paraplegia_innate', name: '先天截瘫', desc: '腰以下没有知觉。', slot: 'bodyFunc', paths: ['innate'], rarity: 'curse', offset: { vitality: -5, resolve: 3, insight: 1 }, caps: ['paraplegia', 'wheelchair'], tags: ['身体_截瘫'], safety: { sensitive: true, category: 'limbs', neutralLabel: '生来下半身无法活动' }, visual: { glyph: 'wheelchair', badge: '截瘫' }, promptTags: ['wheelchair_user', 'paraplegic'], promptNegative: ['standing', 'walking', 'legs_in_use'], moodTags: ['composed'], world: '*' },
  { id: 'func_paraplegia_acquired', name: '后天截瘫', desc: '某一天之后，腿就再也不听话了。', slot: 'bodyFunc', paths: ['acquired'], rarity: 'curse', offset: { vitality: -5, resolve: -2, insight: 1 }, caps: ['paraplegia', 'wheelchair'], tags: ['身体_截瘫', '创伤_瘫痪'], safety: { sensitive: true, category: 'limbs', neutralLabel: '后来下半身无法活动' }, visual: { glyph: 'wheelchair', badge: '截瘫' }, promptTags: ['wheelchair_user', 'paraplegic'], promptNegative: ['standing', 'walking'], moodTags: ['grieving', 'bitter'], unlock: { acquiredOnly: true }, world: '*' },
  { id: 'func_scoliosis', name: '脊柱侧弯', desc: '背总是歪的，久了会疼。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'common', offset: { vitality: -1, empathy: -1 }, safety: { sensitive: true, category: 'limbs', neutralLabel: '脊柱弯曲' }, world: '*' },
  { id: 'func_joint_disease', name: '关节病', desc: '天一阴就疼。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'common', offset: { vitality: -2 }, safety: { sensitive: true, category: 'limbs', neutralLabel: '关节常年疼痛' }, unlock: { minAge: 30 }, world: '*' },
  { id: 'func_prosthetic', name: '义体使用者', desc: '身上有一部分不是原装的。', slot: 'bodyFunc', paths: ['acquired'], rarity: 'rare', offset: { vitality: 2, resolve: -1, empathy: -1 }, tags: ['身体_义体'], promptTags: ['cybernetic_prosthetic', 'chrome_limb'], promptNegative: ['fully_organic_body'], moodTags: ['detached'], unlock: { acquiredOnly: true }, world: '*' },

  // 内脏与慢性
  { id: 'func_sickly', name: '体弱多病', desc: '换季必躺。', slot: 'bodyFunc', paths: ['innate'], rarity: 'common', offset: { vitality: -2 }, safety: { sensitive: true, category: 'internal', neutralLabel: '身体底子弱' }, world: '*' },
  { id: 'func_asthma', name: '哮喘', desc: '跑两步就要停下来喘。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'rare', offset: { vitality: -2, resolve: 1 }, caps: ['asthma'], safety: { sensitive: true, category: 'internal', neutralLabel: '呼吸道容易发作' }, promptTags: ['inhaler'], world: '*' },
  { id: 'func_heart_disease', name: '心脏病', desc: '不能激动，不能累。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'rare', offset: { vitality: -3 }, caps: ['heart_condition'], safety: { sensitive: true, category: 'internal', neutralLabel: '心脏有旧疾' }, unlock: { minAge: 12 }, world: '*' },
  { id: 'func_diabetes', name: '糖尿病', desc: '甜的都要算着吃。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'rare', offset: { vitality: -2 }, caps: ['diabetes'], safety: { sensitive: true, category: 'internal', neutralLabel: '血糖需要控制' }, unlock: { minAge: 20 }, world: '*' },
  { id: 'func_epilepsy', name: '癫痫', desc: '不知道什么时候会倒下。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'rare', offset: { vitality: -2, resolve: -1 }, caps: ['epilepsy'], safety: { sensitive: true, category: 'neuro', neutralLabel: '会突然失去意识' }, unlock: { minAge: 5 }, world: '*' },
  { id: 'func_migraine', name: '偏头痛', desc: '疼起来见不得光。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'common', offset: { insight: -1, vitality: -1 }, safety: { sensitive: true, category: 'neuro', neutralLabel: '反复剧烈头痛' }, world: '*' },
  { id: 'func_stomach', name: '胃病', desc: '饿不得也撑不得。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'common', offset: { vitality: -1 }, safety: { sensitive: true, category: 'internal', neutralLabel: '肠胃常年不适' }, world: '*' },
  { id: 'func_allergy', name: '过敏体质', desc: '花粉、海鲜、尘螨，总有一款。', slot: 'bodyFunc', paths: ['innate'], rarity: 'common', offset: { vitality: -1 }, caps: ['allergy'], safety: { sensitive: true, category: 'internal', neutralLabel: '对多种物质过敏' }, world: '*' },

  // 神经
  { id: 'func_tourette', name: '抽动症', desc: '身体会自己动一下。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'rare', offset: { empathy: -2, resolve: 1, insight: 1 }, caps: ['tics'], safety: { sensitive: true, category: 'neuro', neutralLabel: '不自主的抽动' }, unlock: { minAge: 4 }, world: '*' },
  { id: 'func_tremor', name: '手抖', desc: '端不稳一杯水。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'common', offset: { vitality: -1, ingenuity: -1 }, safety: { sensitive: true, category: 'neuro', neutralLabel: '手部颤抖' }, unlock: { minAge: 40 }, world: '*' },
  { id: 'func_facial_palsy', name: '面瘫', desc: '半边脸不听使唤。', slot: 'bodyFunc', paths: ['acquired'], rarity: 'rare', offset: { empathy: -2, resolve: 1 }, safety: { sensitive: true, category: 'neuro', neutralLabel: '面部肌肉无力' }, promptTags: ['facial_asymmetry'], promptNegative: ['symmetrical_face'], unlock: { acquiredOnly: true }, world: '*' },

  // 免疫
  { id: 'func_immunocompromised', name: '免疫低下', desc: '别人感冒你住院。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'rare', offset: { vitality: -3 }, safety: { sensitive: true, category: 'internal', neutralLabel: '免疫力偏弱' }, world: '*' },
  { id: 'func_autoimmune', name: '自体免疫病', desc: '身体在打自己。', slot: 'bodyFunc', paths: ['innate', 'acquired'], rarity: 'rare', offset: { vitality: -3, resolve: 1 }, safety: { sensitive: true, category: 'internal', neutralLabel: '免疫系统攻击自身' }, unlock: { minAge: 16 }, world: '*' },
];

/* ------------------------------------------------------------------ */
/* C 心理·人格（正常范围）                                              */
/* 与主线槽「性格」的分工：性格 = 先天气质底色；本组 = 意志 / 攻击性 / 社交姿态 */
/* ------------------------------------------------------------------ */

export const PSYCHE_TRAITS: TraitOption[] = [
  // 意志
  { id: 'will_grit', name: '坚毅', desc: '认准了的事就熬到底。', slot: 'psyche', paths: ['innate'], rarity: 'rare', offset: { resolve: 3, empathy: -1 }, tags: ['心理_坚毅'], moodTags: ['unwavering'], world: '*' },
  { id: 'will_quitter', name: '易放弃', desc: '难一点就想算了。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { resolve: -2 }, tags: ['心理_易放弃'], moodTags: ['defeatist'], world: '*' },
  { id: 'will_procrastinate', name: '拖延', desc: '事到临头才动手。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { resolve: -2, reverie: 1 }, tags: ['心理_拖延'], world: '*' },
  { id: 'will_indecisive', name: '优柔寡断', desc: '选哪个都要想很久。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { ingenuity: -2, insight: 1 }, tags: ['心理_寡断'], world: '*' },
  { id: 'will_stubborn', name: '执拗', desc: '撞了南墙也不回头。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { resolve: 2, insight: -1, empathy: -1 }, tags: ['心理_执拗'], world: '*' },
  { id: 'will_endurance', name: '隐忍', desc: '什么都往心里咽。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { resolve: 2, empathy: -1, reverie: -1 }, tags: ['心理_隐忍'], moodTags: ['silent', 'contained'], world: '*' },

  // 攻击性
  { id: 'aggr_irritable', name: '易怒', desc: '火气来得很突然。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { empathy: -2, vitality: 1 }, tags: ['心理_易怒'], moodTags: ['hot_tempered'], world: '*' },
  { id: 'aggr_combative', name: '好斗', desc: '先动手再想别的。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { vitality: 2, empathy: -2, insight: -1 }, tags: ['心理_好斗'], moodTags: ['belligerent'], world: '*' },
  { id: 'aggr_repressed', name: '极度压抑', desc: '所有情绪都被你按回原处。', slot: 'psyche', paths: ['innate'], rarity: 'rare', offset: { resolve: 2, empathy: -3, reverie: -2 }, tags: ['心理_压抑'], safety: { sensitive: true, category: 'psyche', neutralLabel: '习惯把情绪压下去' }, moodTags: ['masked', 'rigid'], world: '*' },
  { id: 'aggr_passive', name: '被动攻击', desc: '不吵，但让你难受。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { ingenuity: 1, empathy: -2 }, tags: ['心理_被动攻击'], world: '*' },
  { id: 'aggr_vengeful', name: '记仇', desc: '很久以前的事你还记得。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { insight: 2, empathy: -2 }, tags: ['心理_记仇'], moodTags: ['resentful'], world: '*' },

  // 社交
  { id: 'soc_phobia', name: '社交恐惧', desc: '人多的地方就喘不上气。', slot: 'psyche', paths: ['innate'], rarity: 'rare', offset: { empathy: -2, insight: 1, vitality: -1 }, tags: ['心理_社交恐惧'], safety: { sensitive: true, category: 'psyche', neutralLabel: '在人群里不安' }, moodTags: ['avoidant', 'tense'], world: '*' },
  { id: 'soc_ease', name: '社交自如', desc: '和谁都能聊起来。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { empathy: 2, resolve: 1 }, tags: ['心理_社交自如'], moodTags: ['sociable'], world: '*' },
  { id: 'soc_pleaser', name: '讨好型', desc: '宁可委屈自己也不让别人不高兴。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { empathy: 2, resolve: -2 }, tags: ['心理_讨好'], moodTags: ['yielding'], world: '*' },
  { id: 'soc_detached', name: '疏离型', desc: '和谁都隔着一层。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { empathy: -2, insight: 1 }, tags: ['心理_疏离'], moodTags: ['distant'], world: '*' },
  { id: 'soc_controlling', name: '控制欲强', desc: '什么都得按你说的来。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { resolve: 1, empathy: -2, ingenuity: 1 }, tags: ['心理_控制欲'], moodTags: ['domineering'], world: '*' },
  { id: 'soc_jealous', name: '嫉妒心重', desc: '见不得别人比你好。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { insight: 1, empathy: -2, reverie: -1 }, tags: ['心理_嫉妒'], world: '*' },
  { id: 'soc_gullible', name: '轻信他人', desc: '别人说什么你都信。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { empathy: 2, insight: -2 }, tags: ['心理_轻信'], world: '*' },
  { id: 'soc_suspicious', name: '多疑', desc: '总有人要害你。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { insight: 2, empathy: -2 }, tags: ['心理_多疑'], moodTags: ['wary'], world: '*' },
  { id: 'soc_competitive', name: '好胜', desc: '输一次能记一整年。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { vitality: 2, resolve: 1, empathy: -1 }, tags: ['心理_好胜'], moodTags: ['driven'], world: '*' },
  { id: 'soc_loyal', name: '重情义', desc: '认下的人，一辈子都认。', slot: 'psyche', paths: ['innate'], rarity: 'rare', offset: { empathy: 3, insight: -1 }, tags: ['心理_重情义'], moodTags: ['steadfast'], world: '*' },

  // 气质补充
  { id: 'temp_impulsive', name: '冲动', desc: '话出口了才想起要过脑。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { vitality: 2, insight: -2 }, tags: ['心理_冲动'], moodTags: ['rash'], world: '*' },
  { id: 'temp_cautious', name: '谨慎', desc: '每一步都要先看三遍。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { insight: 2, vitality: -1 }, tags: ['心理_谨慎'], moodTags: ['guarded'], world: '*' },
  { id: 'temp_volatile', name: '情绪起伏大', desc: '上一秒还在笑。', slot: 'psyche', paths: ['innate'], rarity: 'common', offset: { reverie: 2, resolve: -2 }, tags: ['心理_波动'], safety: { sensitive: true, category: 'psyche', neutralLabel: '情绪变化快' }, moodTags: ['mercurial'], world: '*' },
  { id: 'temp_flat', name: '情感淡漠', desc: '该有反应的时候你没有。', slot: 'psyche', paths: ['innate'], rarity: 'rare', offset: { resolve: 2, empathy: -3, reverie: -1 }, tags: ['心理_淡漠'], safety: { sensitive: true, category: 'psyche', neutralLabel: '情绪反应少' }, moodTags: ['blank', 'cold'], world: '*' },
];

/* ------------------------------------------------------------------ */
/* D 心理·病理（临床，后天型，需压抑度达标）                            */
/* 设计依据 02 文档第 4 节：阈值自动触发 + 可分档加重（8 / 14 / 20）     */
/* ------------------------------------------------------------------ */

export const PSYCHE_CLINIC_TRAITS: TraitOption[] = [
  // —— 情绪障碍 ——
  {
    id: 'clinic_depression',
    name: '抑郁',
    desc: '情绪长期往下沉，且靠自己回不来。',
    slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare',
    offset: { resolve: -2, vitality: -2, empathy: -1 },
    tiers: [
      { level: 1, name: '轻度抑郁', desc: '提不起劲，但日子还过得下去。', offset: { resolve: -2, vitality: -2, empathy: -1 }, promptTags: [], promptNegative: [], moodTags: ['low_energy', 'withdrawn'] },
      { level: 2, name: '中度抑郁', desc: '一天里大半时间在往下沉。', offset: { resolve: -4, vitality: -3, empathy: -2, reverie: -1 }, promptTags: [], promptNegative: [], moodTags: ['despondent', 'hollow'] },
      { level: 3, name: '重度抑郁', desc: '连起床都变成一件大事。', offset: { resolve: -6, vitality: -5, empathy: -3, reverie: -2, insight: -1 }, promptTags: [], promptNegative: [], moodTags: ['numb', 'barely_present'] },
    ],
    tags: ['心理_抑郁'],
    safety: { sensitive: true, category: 'psyche', neutralLabel: '情绪长期低沉' },
    unlock: { acquiredOnly: true, requiresSuppression: 8 },
    world: '*',
  },
  {
    id: 'clinic_bipolar',
    name: '双相',
    desc: '在两个极端之间来回摆。',
    slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare',
    offset: { resolve: -2, reverie: 2, vitality: -1 },
    tiers: [
      { level: 1, name: '轻度波动', desc: '偶尔高涨，偶尔低落。', offset: { resolve: -2, reverie: 2 }, promptTags: [], promptNegative: [], moodTags: ['swinging'] },
      { level: 2, name: '反复发作', desc: '几个月一个来回。', offset: { resolve: -4, reverie: 3, vitality: -2 }, promptTags: [], promptNegative: [], moodTags: ['manic_then_crushed'] },
      { level: 3, name: '严重', desc: '两端都到了伤人的程度。', offset: { resolve: -6, reverie: 2, vitality: -4, insight: -2 }, promptTags: [], promptNegative: [], moodTags: ['frenzied', 'despairing'] },
    ],
    tags: ['心理_双相'],
    safety: { sensitive: true, category: 'psyche', neutralLabel: '情绪大起大落' },
    unlock: { acquiredOnly: true, requiresSuppression: 14 },
    world: '*',
  },
  {
    id: 'clinic_dysthymia',
    name: '持续性心境低落',
    desc: '说不上病，但没一天是轻松的。',
    slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare',
    offset: { resolve: -1, vitality: -1 },
    tiers: [
      { level: 1, name: '长期低平', desc: '很久没有真正高兴过。', offset: { resolve: -1, vitality: -1 }, promptTags: [], promptNegative: [], moodTags: ['grey'] },
      { level: 2, name: '沉重', desc: '做什么都像背着东西。', offset: { resolve: -2, vitality: -2, empathy: -1 }, promptTags: [], promptNegative: [], moodTags: ['weighed_down'] },
      { level: 3, name: '难以支撑', desc: '连说话都觉得费力。', offset: { resolve: -4, vitality: -3, empathy: -1, reverie: -1 }, promptTags: [], promptNegative: [], moodTags: ['exhausted'] },
    ],
    tags: ['心理_心境低落'],
    safety: { sensitive: true, category: 'psyche', neutralLabel: '长期心情低落' },
    unlock: { acquiredOnly: true, requiresSuppression: 8 },
    world: '*',
  },
  { id: 'clinic_sad', name: '季节性心境低落', desc: '每年一到那个季节就不对。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'common', offset: { resolve: -1, reverie: -1 }, tags: ['心理_季节低落'], safety: { sensitive: true, category: 'psyche', neutralLabel: '某段时间容易低落' }, unlock: { acquiredOnly: true, requiresSuppression: 8 }, world: '*' },

  // —— 焦虑谱系 ——
  {
    id: 'clinic_anxiety',
    name: '广泛性焦虑',
    desc: '没有具体的事，但总是在担心。',
    slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare',
    offset: { resolve: -2, insight: 1 },
    tiers: [
      { level: 1, name: '轻度焦虑', desc: '总悬着一颗心。', offset: { resolve: -2, insight: 1 }, promptTags: [], promptNegative: [], moodTags: ['restless'] },
      { level: 2, name: '中度焦虑', desc: '睡不着，也停不下想。', offset: { resolve: -3, insight: 1, vitality: -2 }, promptTags: [], promptNegative: [], moodTags: ['anxious', 'fidgety'] },
      { level: 3, name: '重度焦虑', desc: '身体先替你紧张起来。', offset: { resolve: -5, insight: 2, vitality: -3, empathy: -1 }, promptTags: [], promptNegative: [], moodTags: ['panicked', 'wound_up'] },
    ],
    tags: ['心理_焦虑'],
    safety: { sensitive: true, category: 'psyche', neutralLabel: '长期容易紧张' },
    unlock: { acquiredOnly: true, requiresSuppression: 8 },
    world: '*',
  },
  {
    id: 'clinic_panic',
    name: '惊恐障碍',
    desc: '突然就来一次，像要死掉。',
    slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare',
    offset: { resolve: -2, vitality: -2 },
    tiers: [
      { level: 1, name: '偶发', desc: '一年里有那么几次。', offset: { resolve: -2, vitality: -2 }, promptTags: [], promptNegative: [], moodTags: ['startled'] },
      { level: 2, name: '频繁', desc: '开始不敢去人多的地方。', offset: { resolve: -3, vitality: -2, empathy: -2 }, promptTags: [], promptNegative: [], moodTags: ['hyperventilating'] },
      { level: 3, name: '严重影响', desc: '不敢出门，怕在路上发作。', offset: { resolve: -5, vitality: -3, empathy: -3, insight: -1 }, promptTags: [], promptNegative: [], moodTags: ['agoraphobic', 'terrified'] },
    ],
    tags: ['心理_惊恐'],
    safety: { sensitive: true, category: 'psyche', neutralLabel: '会突然极度恐慌' },
    unlock: { acquiredOnly: true, requiresSuppression: 14 },
    world: '*',
  },
  { id: 'clinic_social_anxiety', name: '社交焦虑', desc: '被人看着就手心出汗。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'common', offset: { empathy: -2, insight: 1 }, tags: ['心理_社交焦虑'], safety: { sensitive: true, category: 'psyche', neutralLabel: '在他人面前紧张' }, unlock: { acquiredOnly: true, requiresSuppression: 8 }, world: '*' },
  { id: 'clinic_phobia_claustro', name: '幽闭恐惧', desc: '门一关就受不了。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'common', offset: { resolve: -1, insight: 1 }, caps: ['claustrophobia'], tags: ['心理_幽闭恐惧'], safety: { sensitive: true, category: 'psyche', neutralLabel: '怕封闭的空间' }, unlock: { acquiredOnly: true, requiresSuppression: 8 }, world: '*' },
  { id: 'clinic_phobia_heights', name: '恐高', desc: '往下一看腿就软。', slot: 'psycheClinic', paths: ['innate', 'acquired'], rarity: 'common', offset: { resolve: -1 }, caps: ['acrophobia'], tags: ['心理_恐高'], safety: { sensitive: true, category: 'psyche', neutralLabel: '怕高处' }, world: '*' },
  { id: 'clinic_phobia_blood', name: '晕血', desc: '看见血就先晕过去。', slot: 'psycheClinic', paths: ['innate', 'acquired'], rarity: 'common', offset: { resolve: -1, vitality: -1 }, tags: ['心理_晕血'], safety: { sensitive: true, category: 'psyche', neutralLabel: '见血不适' }, world: '*' },
  { id: 'clinic_phobia_animal', name: '动物恐惧', desc: '毛茸茸的东西靠近就想跑。', slot: 'psycheClinic', paths: ['innate', 'acquired'], rarity: 'common', offset: { empathy: -1 }, tags: ['心理_动物恐惧'], safety: { sensitive: true, category: 'psyche', neutralLabel: '怕某类动物' }, world: '*' },

  // —— 创伤相关 ——
  {
    id: 'clinic_ptsd',
    name: '创伤后应激',
    desc: '那件事一直没过去。',
    slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare',
    offset: { resolve: -2, insight: 1, empathy: -1 },
    tiers: [
      { level: 1, name: '轻度应激', desc: '偶尔想起，会难受一阵。', offset: { resolve: -2, insight: 1 }, promptTags: [], promptNegative: [], moodTags: ['haunted'] },
      { level: 2, name: '中度应激', desc: '睡不好，容易受惊。', offset: { resolve: -3, insight: 1, vitality: -2, empathy: -1 }, promptTags: [], promptNegative: [], moodTags: ['hypervigilant', 'jumpy'] },
      { level: 3, name: '重度应激', desc: '像还在那件事里没出来。', offset: { resolve: -5, insight: 2, vitality: -3, empathy: -3 }, promptTags: [], promptNegative: [], moodTags: ['dissociated', 'hollow_eyed'] },
    ],
    tags: ['心理_创伤应激'],
    safety: { sensitive: true, category: 'psyche', neutralLabel: '旧事一直影响着你' },
    unlock: { acquiredOnly: true, requiresSuppression: 14 },
    world: '*',
  },
  {
    id: 'clinic_dissociation',
    name: '解离',
    desc: '有时候会觉得这不是自己在过。',
    slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare',
    offset: { insight: -2, resolve: -1, empathy: -1 },
    tiers: [
      { level: 1, name: '偶发抽离', desc: '走神走得有点远。', offset: { insight: -2, resolve: -1 }, promptTags: [], promptNegative: [], moodTags: ['absent'] },
      { level: 2, name: '频繁抽离', desc: '回过神来不知道过了多久。', offset: { insight: -3, resolve: -2, empathy: -2 }, promptTags: [], promptNegative: [], moodTags: ['unmoored'] },
      { level: 3, name: '严重', desc: '记忆中间有大段空白。', offset: { insight: -4, resolve: -3, empathy: -3, vitality: -2 }, promptTags: [], promptNegative: [], moodTags: ['fragmented', 'vacant'] },
    ],
    tags: ['心理_解离'],
    safety: { sensitive: true, category: 'psyche', neutralLabel: '会与自己和现实脱开' },
    unlock: { acquiredOnly: true, requiresSuppression: 14 },
    world: '*',
  },
  { id: 'clinic_flashback', name: '闪回', desc: '画面会自己冒出来。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'common', offset: { insight: 1, resolve: -2 }, tags: ['心理_闪回'], safety: { sensitive: true, category: 'psyche', neutralLabel: '会不受控地想起某些画面' }, unlock: { acquiredOnly: true, requiresSuppression: 8 }, world: '*' },
  { id: 'clinic_numbing', name: '情感麻木', desc: '什么都感觉不到，包括好事。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare', offset: { empathy: -3, resolve: 1, reverie: -2 }, tags: ['心理_麻木'], safety: { sensitive: true, category: 'psyche', neutralLabel: '情绪反应变少' }, unlock: { acquiredOnly: true, requiresSuppression: 14 }, world: '*' },

  // —— 强迫相关 ——
  {
    id: 'clinic_ocd',
    name: '强迫',
    desc: '不做那件事就安心不下来。',
    slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare',
    offset: { insight: 1, resolve: -1, vitality: -1 },
    tiers: [
      { level: 1, name: '轻度强迫', desc: '有些事必须按顺序来。', offset: { insight: 1, resolve: -1, vitality: -1 }, promptTags: [], promptNegative: [], moodTags: ['rigid_rituals'] },
      { level: 2, name: '中度强迫', desc: '检查三遍还是会再检查一遍。', offset: { insight: 1, resolve: -2, vitality: -2 }, promptTags: [], promptNegative: [], moodTags: ['compulsive'] },
      { level: 3, name: '重度强迫', desc: '一天里大半天交给了这些事。', offset: { insight: 2, resolve: -4, vitality: -3 }, promptTags: [], promptNegative: [], moodTags: ['trapped_in_ritual'] },
    ],
    tags: ['心理_强迫'],
    safety: { sensitive: true, category: 'psyche', neutralLabel: '有些事必须反复确认' },
    unlock: { acquiredOnly: true, requiresSuppression: 8 },
    world: '*',
  },
  { id: 'clinic_hoarding', name: '囤积', desc: '什么都不舍得扔。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'common', offset: { insight: -1, resolve: -1 }, tags: ['心理_囤积'], safety: { sensitive: true, category: 'psyche', neutralLabel: '难以丢弃物品' }, unlock: { acquiredOnly: true, requiresSuppression: 8 }, world: '*' },
  { id: 'clinic_trichotillomania', name: '拔毛', desc: '手一闲下来就去拔。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'common', offset: { resolve: -1, vitality: -1 }, tags: ['心理_拔毛'], safety: { sensitive: true, category: 'psyche', neutralLabel: '会不受控地拔自己的头发' }, promptTags: ['thinning_hair_patches'], promptNegative: ['full_even_hair'], unlock: { acquiredOnly: true, requiresSuppression: 8 }, world: '*' },

  // —— 进食 ——
  { id: 'clinic_anorexia', name: '厌食', desc: '吃下去的东西要还回来。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare', offset: { vitality: -3, resolve: -1, empathy: -1 }, tags: ['心理_厌食'], safety: { sensitive: true, category: 'psyche', neutralLabel: '进食出现严重困难' }, promptTags: ['visibly_thin_frame'], promptNegative: ['healthy_body_weight'], unlock: { acquiredOnly: true, requiresSuppression: 14 }, world: '*' },
  { id: 'clinic_binge', name: '暴食', desc: '吃到难受，然后更难受。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'common', offset: { vitality: -2, resolve: -2 }, tags: ['心理_暴食'], safety: { sensitive: true, category: 'psyche', neutralLabel: '进食容易失控' }, unlock: { acquiredOnly: true, requiresSuppression: 8 }, world: '*' },

  // —— 睡眠 ——
  {
    id: 'clinic_insomnia',
    name: '失眠',
    desc: '躺下就是清醒的开始。',
    slot: 'psycheClinic', paths: ['acquired'], rarity: 'common',
    offset: { vitality: -2, insight: -1 },
    tiers: [
      { level: 1, name: '偶尔失眠', desc: '总有一两个晚上睡不着。', offset: { vitality: -1, insight: -1 }, promptTags: ['dark_circles', 'tired_eyes'], promptNegative: ['rested_face'], moodTags: ['sleepless'] },
      { level: 2, name: '长期失眠', desc: '每天都在等天亮。', offset: { vitality: -2, insight: -1, resolve: -1 }, promptTags: ['dark_circles', 'tired_eyes', 'pale_skin'], promptNegative: ['rested_face'], moodTags: ['exhausted', 'wired'] },
      { level: 3, name: '严重失眠', desc: '身体已经不听使唤了。', offset: { vitality: -4, insight: -2, resolve: -2, empathy: -1 }, promptTags: ['dark_circles', 'tired_eyes', 'gaunt_face'], promptNegative: ['rested_face'], moodTags: ['haggard', 'hollow'] },
    ],
    tags: ['心理_失眠'],
    safety: { sensitive: true, category: 'psyche', neutralLabel: '长期睡不好' },
    unlock: { acquiredOnly: true, requiresSuppression: 8 },
    world: '*',
  },
  { id: 'clinic_hypersomnia', name: '嗜睡', desc: '睡多久都不够。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'common', offset: { vitality: -2, insight: -1 }, tags: ['心理_嗜睡'], safety: { sensitive: true, category: 'psyche', neutralLabel: '总是睡不够' }, moodTags: ['drowsy'], unlock: { acquiredOnly: true, requiresSuppression: 8 }, world: '*' },
  { id: 'clinic_sleepwalk', name: '梦游', desc: '醒来时人在别的地方。', slot: 'psycheClinic', paths: ['innate', 'acquired'], rarity: 'common', offset: { insight: -1 }, tags: ['心理_梦游'], safety: { sensitive: true, category: 'psyche', neutralLabel: '睡着后会走动' }, world: '*' },
  { id: 'clinic_night_terror', name: '夜惊', desc: '半夜坐起来喊，自己却不知道。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'common', offset: { vitality: -1, resolve: -1 }, tags: ['心理_夜惊'], safety: { sensitive: true, category: 'psyche', neutralLabel: '夜间会突然惊醒' }, unlock: { acquiredOnly: true, requiresSuppression: 8 }, world: '*' },
  { id: 'clinic_nightmare', name: '噩梦频繁', desc: '闭眼比睁眼还累。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'common', offset: { vitality: -2, resolve: -1 }, tags: ['心理_噩梦'], safety: { sensitive: true, category: 'psyche', neutralLabel: '常做令人难受的梦' }, unlock: { acquiredOnly: true, requiresSuppression: 8 }, world: '*' },

  // —— 成瘾 ——
  {
    id: 'clinic_alcohol',
    name: '酒精依赖',
    desc: '不喝就手抖。',
    slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare',
    offset: { vitality: -2, resolve: -1, insight: -1 },
    tiers: [
      { level: 1, name: '依赖初期', desc: '每天都得来一点。', offset: { vitality: -1, resolve: -1 }, promptTags: ['holding_bottle'], promptNegative: ['clear_sober_look'], moodTags: ['loose'] },
      { level: 2, name: '明显依赖', desc: '开始影响正事。', offset: { vitality: -3, resolve: -2, insight: -2 }, promptTags: ['holding_bottle', 'flushed_face'], promptNegative: ['clear_sober_look'], moodTags: ['slurring', 'bloated'] },
      { level: 3, name: '重度依赖', desc: '身体已经离不开它。', offset: { vitality: -5, resolve: -3, insight: -3, empathy: -2 }, promptTags: ['holding_bottle', 'flushed_face', 'trembling_hands'], promptNegative: ['clear_sober_look'], moodTags: ['ruined', 'shaking'] },
    ],
    tags: ['心理_酒精依赖'],
    safety: { sensitive: true, category: 'addiction', neutralLabel: '对酒精难以自控' },
    unlock: { acquiredOnly: true, requiresSuppression: 8, minAge: 16 },
    world: '*',
  },
  { id: 'clinic_substance', name: '药物依赖', desc: '一开始只是为了好受一点。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare', offset: { vitality: -4, resolve: -2, insight: -1 }, tags: ['心理_药物依赖'], safety: { sensitive: true, category: 'addiction', neutralLabel: '对药物难以自控' }, promptTags: ['gaunt_face', 'track_marks'], promptNegative: ['healthy_complexion'], unlock: { acquiredOnly: true, requiresSuppression: 14, minAge: 14 }, world: '*' },
  { id: 'clinic_nicotine', name: '尼古丁依赖', desc: '手总会往口袋里摸。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'common', offset: { vitality: -1 }, tags: ['心理_尼古丁依赖'], safety: { sensitive: true, category: 'addiction', neutralLabel: '对烟草难以自控' }, promptTags: ['cigarette', 'yellowed_fingers'], unlock: { acquiredOnly: true, requiresSuppression: 8, minAge: 14 }, world: '*' },
  { id: 'clinic_gambling', name: '赌博成瘾', desc: '总想着下一把能翻回来。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare', offset: { resolve: -3, ingenuity: 1, empathy: -1 }, tags: ['心理_赌博成瘾'], safety: { sensitive: true, category: 'addiction', neutralLabel: '难以停止下注' }, unlock: { acquiredOnly: true, requiresSuppression: 8, minAge: 16 }, world: '*' },
  { id: 'clinic_gaming', name: '游戏成瘾', desc: '屏幕一关就空得慌。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'common', offset: { vitality: -2, resolve: -2, insight: -1 }, tags: ['心理_游戏成瘾'], safety: { sensitive: true, category: 'addiction', neutralLabel: '很难离开屏幕' }, unlock: { acquiredOnly: true, requiresSuppression: 8 }, world: '*' },

  // —— 神经发育（多为先天，严重度不分档）——
  { id: 'clinic_adhd', name: '注意缺陷多动', desc: '脑子总开着一百个窗口。', slot: 'psycheClinic', paths: ['innate'], rarity: 'common', offset: { insight: -1, ingenuity: 2, resolve: -2 }, caps: ['adhd'], tags: ['心理_注意力'], safety: { sensitive: true, category: 'psyche', neutralLabel: '很难长时间专注' }, unlock: { minAge: 3 }, world: '*' },
  { id: 'clinic_asd', name: '自闭谱系', desc: '别人不用说出口的东西，你读不到。', slot: 'psycheClinic', paths: ['innate'], rarity: 'rare', offset: { empathy: -3, insight: 2, reverie: 1 }, caps: ['autism_spectrum'], tags: ['心理_社交解读'], safety: { sensitive: true, category: 'psyche', neutralLabel: '理解他人意图较困难' }, unlock: { minAge: 3 }, world: '*' },
  { id: 'clinic_dyslexia', name: '阅读障碍', desc: '字会自己换位置。', slot: 'psycheClinic', paths: ['innate'], rarity: 'common', offset: { insight: -1, ingenuity: 1 }, caps: ['dyslexia'], tags: ['心理_阅读障碍'], safety: { sensitive: true, category: 'psyche', neutralLabel: '阅读文字较吃力' }, unlock: { minAge: 6 }, world: '*' },
  { id: 'clinic_dyscalculia', name: '计算障碍', desc: '数字一多就乱。', slot: 'psycheClinic', paths: ['innate'], rarity: 'common', offset: { ingenuity: -1, insight: 1 }, caps: ['dyscalculia'], tags: ['心理_计算障碍'], safety: { sensitive: true, category: 'psyche', neutralLabel: '处理数字较吃力' }, unlock: { minAge: 6 }, world: '*' },
  { id: 'clinic_prosopagnosia', name: '脸盲', desc: '见过三次还是认不出。', slot: 'psycheClinic', paths: ['innate'], rarity: 'rare', offset: { empathy: -2, insight: 1 }, caps: ['prosopagnosia'], tags: ['心理_脸盲'], safety: { sensitive: true, category: 'psyche', neutralLabel: '难以记住他人长相' }, world: '*' },

  // —— 躯体化 ——
  { id: 'clinic_hypochondria', name: '疑病症', desc: '一点不舒服就往最坏处想。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'common', offset: { resolve: -2, insight: 1 }, tags: ['心理_疑病'], safety: { sensitive: true, category: 'psyche', neutralLabel: '总担心自己得了病' }, unlock: { acquiredOnly: true, requiresSuppression: 8 }, world: '*' },
  { id: 'clinic_chronic_pain', name: '慢性疼痛', desc: '疼了很久了，查不出原因。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'rare', offset: { vitality: -3, resolve: -1 }, tags: ['心理_慢性疼痛'], safety: { sensitive: true, category: 'psyche', neutralLabel: '身体长期不适' }, unlock: { acquiredOnly: true, requiresSuppression: 14 }, world: '*' },

  // —— 人格障碍（重度 curse）——
  { id: 'clinic_personality_bpd', name: '边缘型人格', desc: '把人推得远远的，又怕真的被推走。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'curse', offset: { empathy: -3, resolve: -2, reverie: 1 }, tags: ['心理_边缘型人格'], safety: { sensitive: true, category: 'psyche', neutralLabel: '情绪与人际关系极不稳定' }, unlock: { acquiredOnly: true, requiresSuppression: 20, minAge: 16 }, world: '*' },
  { id: 'clinic_personality_ppd', name: '偏执型人格', desc: '所有人的好意后面都藏着刀。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'curse', offset: { insight: 2, empathy: -4, resolve: 1 }, tags: ['心理_偏执型人格'], safety: { sensitive: true, category: 'psyche', neutralLabel: '很难相信别人的动机' }, unlock: { acquiredOnly: true, requiresSuppression: 20, minAge: 16 }, world: '*' },
  { id: 'clinic_personality_avpd', name: '回避型人格', desc: '宁可什么都不要，也不要被拒绝。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'curse', offset: { empathy: -3, vitality: -2, insight: 1 }, tags: ['心理_回避型人格'], safety: { sensitive: true, category: 'psyche', neutralLabel: '尽量避免一切人际接触' }, unlock: { acquiredOnly: true, requiresSuppression: 20, minAge: 14 }, world: '*' },
  { id: 'clinic_personality_npd', name: '自恋型人格', desc: '必须是所有人的中心。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'curse', offset: { empathy: -3, resolve: 1, ingenuity: 1 }, tags: ['心理_自恋型人格'], safety: { sensitive: true, category: 'psyche', neutralLabel: '需要持续被他人仰视' }, unlock: { acquiredOnly: true, requiresSuppression: 20, minAge: 16 }, world: '*' },
  { id: 'clinic_personality_aspd', name: '反社会人格', desc: '规则和别人的感受，对你都不算数。', slot: 'psycheClinic', paths: ['acquired'], rarity: 'curse', offset: { empathy: -5, resolve: 2, ingenuity: 1 }, tags: ['心理_反社会人格'], safety: { sensitive: true, category: 'psyche', neutralLabel: '无视规则与他人感受' }, unlock: { acquiredOnly: true, requiresSuppression: 20, minAge: 16 }, world: '*' },
];

/* ------------------------------------------------------------------ */
/* E 天赋才能                                                          */
/* ------------------------------------------------------------------ */

export const APTITUDE_TRAITS: TraitOption[] = [
  { id: 'apt_painting', name: '绘画天赋', desc: '手比嘴更会说话。', slot: 'aptitude', paths: ['innate'], rarity: 'rare', offset: { reverie: 2, insight: 1 }, caps: ['art_painting'], tags: ['天赋_绘画'], world: '*' },
  { id: 'apt_music', name: '音乐天赋', desc: '听一遍就能哼出来。', slot: 'aptitude', paths: ['innate'], rarity: 'rare', offset: { reverie: 2, empathy: 1 }, caps: ['art_music'], tags: ['天赋_音乐'], world: '*' },
  { id: 'apt_writing', name: '写作天赋', desc: '能把说不出的东西写出来。', slot: 'aptitude', paths: ['innate'], rarity: 'rare', offset: { reverie: 2, insight: 1, empathy: 1 }, caps: ['art_writing'], tags: ['天赋_写作'], world: '*' },
  { id: 'apt_math', name: '数理天赋', desc: '公式在你眼里是有形状的。', slot: 'aptitude', paths: ['innate'], rarity: 'rare', offset: { ingenuity: 3, insight: 1 }, caps: ['logic_math'], tags: ['天赋_数理'], world: '*' },
  { id: 'apt_language', name: '语言天赋', desc: '听两个月就能开口。', slot: 'aptitude', paths: ['innate'], rarity: 'rare', offset: { empathy: 2, insight: 1 }, caps: ['language_aptitude'], tags: ['天赋_语言'], world: '*' },
  { id: 'apt_craft', name: '机械手工艺', desc: '拆一遍就会装回去。', slot: 'aptitude', paths: ['innate'], rarity: 'common', offset: { ingenuity: 2, vitality: 1 }, caps: ['craft_mechanical'], tags: ['天赋_手工艺'], world: '*' },
  { id: 'apt_empathy', name: '共情天赋', desc: '别人还没开口你就知道了。', slot: 'aptitude', paths: ['innate'], rarity: 'rare', offset: { empathy: 3, insight: 1 }, caps: ['empathy_gift'], tags: ['天赋_共情'], moodTags: ['warm'], world: '*' },
  { id: 'apt_memory', name: '记忆天赋', desc: '看过的东西都在。', slot: 'aptitude', paths: ['innate'], rarity: 'rare', offset: { insight: 3, ingenuity: 1 }, caps: ['memory_gift'], tags: ['天赋_记忆'], world: '*' },
  { id: 'apt_direction', name: '方向感', desc: '从没走丢过。', slot: 'aptitude', paths: ['innate'], rarity: 'common', offset: { insight: 1, vitality: 1 }, caps: ['sense_of_direction'], tags: ['天赋_方向感'], world: '*' },
  { id: 'apt_taste', name: '味觉天赋', desc: '一口就能说出用了什么。', slot: 'aptitude', paths: ['innate'], rarity: 'common', offset: { insight: 2, reverie: 1 }, caps: ['taste_gift'], tags: ['天赋_味觉'], world: '*' },
  { id: 'apt_synesthesia', name: '联觉', desc: '声音有颜色，数字有质地。', slot: 'aptitude', paths: ['innate'], rarity: 'rare', offset: { reverie: 3, insight: -1 }, caps: ['synesthesia'], tags: ['天赋_联觉'], safety: { sensitive: true, category: 'neuro', neutralLabel: '感官会互相串线' }, world: '*' },
  { id: 'apt_rhythm', name: '节奏感', desc: '身体自己知道该怎么动。', slot: 'aptitude', paths: ['innate'], rarity: 'common', offset: { vitality: 2, reverie: 1 }, caps: ['rhythm_gift'], tags: ['天赋_节奏'], world: '*' },
  { id: 'apt_mimicry', name: '模仿天赋', desc: '学谁像谁。', slot: 'aptitude', paths: ['innate'], rarity: 'common', offset: { empathy: 2, ingenuity: 1, insight: -1 }, caps: ['mimicry'], tags: ['天赋_模仿'], world: '*' },
  { id: 'apt_acting', name: '表演天赋', desc: '一上台就变成另一个人。', slot: 'aptitude', paths: ['innate'], rarity: 'rare', offset: { empathy: 2, reverie: 2, resolve: -1 }, caps: ['acting'], tags: ['天赋_表演'], moodTags: ['expressive'], world: '*' },
  { id: 'apt_negotiation', name: '谈判天赋', desc: '你知道哪句话能让人松口。', slot: 'aptitude', paths: ['innate'], rarity: 'rare', offset: { empathy: 2, ingenuity: 2 }, caps: ['negotiation'], tags: ['天赋_谈判'], world: '*' },
];

/* ------------------------------------------------------------------ */
/* F 社会细项                                                          */
/* 说明：「阶层」由世界背景包（WorldMeta.backgrounds）承担，此处只列其余细项 */
/* ------------------------------------------------------------------ */

export const SOCIAL_TRAITS: TraitOption[] = [
  // 家庭结构
  { id: 'social_orphan', name: '孤儿', desc: '没有可以叫爸妈的人。', slot: 'social', paths: ['innate'], rarity: 'rare', offset: { resolve: 2, empathy: -1, insight: 1 }, tags: ['家庭_孤儿'], safety: { tender: true, category: 'family', neutralLabel: '自幼失去双亲' }, moodTags: ['self_reliant'], world: '*' },
  { id: 'social_single_parent', name: '单亲家庭', desc: '家里只有一个大人。', slot: 'social', paths: ['innate'], rarity: 'common', offset: { resolve: 1, empathy: 1 }, tags: ['家庭_单亲'], safety: { tender: true, category: 'family', neutralLabel: '由一位家长抚养' }, world: '*' },
  { id: 'social_foster', name: '寄养', desc: '在别人家里长大。', slot: 'social', paths: ['innate'], rarity: 'rare', offset: { empathy: -1, insight: 2, resolve: 1 }, tags: ['家庭_寄养'], safety: { tender: true, category: 'family', neutralLabel: '由非亲生家庭抚养' }, moodTags: ['guarded'], world: '*' },
  { id: 'social_big_family', name: '大家庭', desc: '一屋子人，热闹也吵。', slot: 'social', paths: ['innate'], rarity: 'common', offset: { empathy: 2, insight: -1 }, tags: ['家庭_大家庭'], moodTags: ['communal'], world: '*' },
  { id: 'social_only_child', name: '独生', desc: '所有期待都压在你一个人身上。', slot: 'social', paths: ['innate'], rarity: 'common', offset: { insight: 1, empathy: -1, resolve: 1 }, tags: ['家庭_独生'], world: '*' },
  { id: 'social_broken_home', name: '家庭失和', desc: '从小听着吵架声睡着。', slot: 'social', paths: ['innate', 'acquired'], rarity: 'common', offset: { insight: 2, resolve: -1, empathy: -1 }, tags: ['家庭_失和'], safety: { tender: true, category: 'family', neutralLabel: '家中长期冲突' }, moodTags: ['watchful'], world: '*' },

  // 族裔 / 迁徙
  { id: 'social_minority', name: '少数族裔', desc: '你的名字在班里总是最特别的那个。', slot: 'social', paths: ['innate'], rarity: 'common', offset: { insight: 1, empathy: -1, resolve: 1 }, tags: ['族裔_少数'], safety: { tender: true, category: 'origin', neutralLabel: '属于人口较少的族群' }, world: '*' },
  { id: 'social_migrant', name: '移民家庭', desc: '两个地方都不完全属于你。', slot: 'social', paths: ['innate'], rarity: 'common', offset: { insight: 2, empathy: 1, resolve: -1 }, tags: ['族裔_移民'], safety: { tender: true, category: 'origin' }, moodTags: ['between_worlds'], world: '*' },

  // 教育
  { id: 'social_illiterate', name: '未受教育', desc: '字认得你，你不认得它。', slot: 'social', paths: ['innate'], rarity: 'rare', offset: { insight: -2, vitality: 1 }, tags: ['教育_未受教育'], safety: { tender: true, category: 'origin', neutralLabel: '没有上过学' }, unlock: { minAge: 10 }, world: '*' },
  { id: 'social_scholarly', name: '书香门第', desc: '家里最不缺的就是书。', slot: 'social', paths: ['innate'], rarity: 'rare', offset: { insight: 2, reverie: 1, vitality: -1 }, tags: ['教育_书香'], world: '*' },
  { id: 'social_dropout', name: '辍学', desc: '你在某个年纪离开了学校。', slot: 'social', paths: ['acquired'], rarity: 'common', offset: { resolve: 1, insight: -1, vitality: 1 }, tags: ['教育_辍学'], safety: { tender: true, category: 'origin', neutralLabel: '中途停止了学业' }, unlock: { acquiredOnly: true, minAge: 10 }, world: '*' },

  // 信仰
  { id: 'social_devout', name: '虔信', desc: '你相信有人在看着你。', slot: 'social', paths: ['innate'], rarity: 'common', offset: { resolve: 2, insight: -1 }, tags: ['信仰_虔信'], moodTags: ['devout'], world: '*' },
  { id: 'social_atheist', name: '无信仰', desc: '你只信自己看到的。', slot: 'social', paths: ['innate'], rarity: 'common', offset: { insight: 2, resolve: 1 }, tags: ['信仰_无'], world: '*' },
  { id: 'social_superstitious', name: '迷信', desc: '出门要看日子。', slot: 'social', paths: ['innate'], rarity: 'common', offset: { reverie: 2, insight: -1 }, tags: ['信仰_迷信'], moodTags: ['ritualistic'], world: '*' },

  // 其他成长环境
  { id: 'social_military_family', name: '军人家庭', desc: '规矩比别家多。', slot: 'social', paths: ['innate'], rarity: 'common', offset: { resolve: 2, vitality: 1, empathy: -1 }, tags: ['成长_军人家庭'], world: '*' },
  { id: 'social_art_family', name: '艺术家庭', desc: '家里挂满了别人的画。', slot: 'social', paths: ['innate'], rarity: 'common', offset: { reverie: 2, empathy: 1, resolve: -1 }, tags: ['成长_艺术家庭'], world: '*' },
];

/** 本文件已产出的全部通用特质 */
export const COMMON_TRAITS_PART1: TraitOption[] = [
  ...CORE_TRAITS,
  ...BODY_FORM_TRAITS,
  ...BODY_FUNC_TRAITS,
  ...PSYCHE_TRAITS,
  ...PSYCHE_CLINIC_TRAITS,
  ...APTITUDE_TRAITS,
  ...SOCIAL_TRAITS,
];