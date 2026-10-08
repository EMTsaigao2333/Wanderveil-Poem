/**
 * 事件写法示例模板 —— 覆盖全部 7 种写法，复制到 <worldId>/<stage>.ts 后按需删减、替换内容。
 * 注意：本文件的 id 全部带 TPL_ 前缀，不会被任何世界的 index.ts 引入。
 */

import type { LifeEvent } from '../../../engine/schema';
import { DC } from '../../../engine/schema';

export const events: LifeEvent[] = [
  /* 1. 纯自动事件：无 choices，必须有 effects。用于推演命运、制造节奏喘息。 */
  {
    id: 'TPL_child_001',
    stage: 'childhood',
    title: '<标题>',
    text: '<正文 40~80 字，具体画面优先，不要写「你感到…」这类概括>',
    require: { age: [4, 6] },
    effects: { attr: { mood: -1 }, tags: ['<事件标签>'] },
  },

  /* 2. 二选一，两个选项都带检定：最常用的写法。 */
  {
    id: 'TPL_teen_002',
    stage: 'teen',
    title: '<标题>',
    text: '<正文>',
    require: { age: [10, 15] },
    choices: [
      {
        label: '<选项 A：走「共情」路线>',
        check: { attr: 'empathy', dc: DC.normal },
        success: {
          text: '<成功的短旁白 10~25 字>',
          effects: { attr: { empathy: 2, mood: 1 }, tags: ['<成功标签>'] },
        },
        fail: {
          text: '<失败的短旁白>',
          effects: { attr: { empathy: -1, mood: -1 }, tags: ['<失败标签>'] },
        },
      },
      {
        label: '<选项 B：走「硬闯」路线>',
        check: { attr: 'vitality', dc: DC.hard },
        success: { effects: { attr: { vitality: 2 }, money: 50 } },
        fail: { text: '<受伤的短旁白>', effects: { attr: { health: -2 }, tags: ['<受伤标签>'] } },
      },
    ],
  },

  /* 3. 条件隐藏选项：属性或标签达标才会出现该选项。 */
  {
    id: 'TPL_youth_003',
    stage: 'youth',
    title: '<标题>',
    text: '<正文>',
    require: { age: [18, 25] },
    choices: [
      {
        label: '<普通选项>',
        check: { attr: 'perception', dc: DC.easy },
        success: { effects: { attr: { perception: 1 } } },
        fail: { effects: { attr: { mood: -1 } } },
      },
      {
        // 只有「感知」够高（或持有特定标签）的玩家才看得见这条路
        label: '<隐藏选项：只有洞察足够的人才看得到>',
        require: { attr: { perception: [14, 99] } },
        check: { attr: 'perception', dc: DC.hard },
        success: { effects: { attr: { perception: 2 }, tags: ['<看破真相>'] } },
        fail: { effects: { attr: { mood: -2 } } },
      },
    ],
  },

  /* 4. 连锁事件：用 next 指定后续事件，形成一段连续剧情（不是回到事件池随机）。 */
  {
    id: 'TPL_prime_004',
    stage: 'prime',
    title: '<标题>',
    text: '<正文>',
    require: { age: [26, 40], tags: ['<前置标签>'] },
    choices: [
      {
        label: '<触发后续剧情的选项>',
        check: { attr: 'will', dc: DC.normal },
        success: { effects: { attr: { will: 2 } }, next: 'TPL_prime_004b' },
        fail: { effects: { attr: { will: -1 } }, next: 'TPL_prime_004b' },
      },
    ],
  },
  {
    id: 'TPL_prime_004b',
    stage: 'prime',
    title: '<后续标题>',
    text: '<后续正文>',
    choices: [
      {
        label: '<收尾选项>',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { effects: { attr: { ingenuity: 2 }, money: 300 } },
        fail: { effects: { attr: { health: -2, mood: -2 } } },
      },
    ],
  },

  /* 5. 死亡事件：death 必须写死因文案。触发条件要合理，不能随机暴毙。 */
  {
    id: 'TPL_middle_005',
    stage: 'middle',
    title: '<标题>',
    text: '<正文：足以致命的处境>',
    require: { age: [41, 60], tags: ['<重病标签>'], chance: 0.25 },
    choices: [
      {
        label: '<赌命选项>',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '<活下来的旁白>', effects: { attr: { will: 3 }, dropTags: ['<重病标签>'] } },
        fail: { effects: { death: '<死因文案>' } },
      },
    ],
  },

  /* 6. 概率事件：靠 require.chance 控制稀有度，用来做「偶遇」「意外」。 */
  {
    id: 'TPL_youth_006',
    stage: 'youth',
    title: '<偶遇标题>',
    text: '<正文>',
    require: { age: [16, 25], chance: 0.08 },
    choices: [
      {
        label: '<把握机会>',
        check: { attr: 'reverie', dc: DC.normal },
        success: { effects: { attr: { reverie: 3 }, tags: ['<奇遇标签>'] } },
        fail: { effects: { attr: { mood: -1 } } },
      },
      { label: '<走开>', check: { attr: 'will', dc: DC.easy }, success: { effects: { attr: { will: 1 } } }, fail: { effects: { attr: { mood: -1 } } } },
    ],
  },

  /* 7. 组合条件事件：all / any 嵌套，用于复杂触发表述。 */
  {
    id: 'TPL_elder_007',
    stage: 'elder',
    title: '<标题>',
    text: '<正文>',
    require: {
      all: [
        { age: [61, 120] },
        { any: [{ attr: { wealth: [13, 99] } }, { tags: ['<富贵标签>'] }] },
        { notTags: ['<背弃标签>'] },
      ],
    },
    choices: [
      {
        label: '<选项>',
        check: { attr: 'empathy', dc: DC.normal },
        success: { effects: { attr: { mood: 3 }, tags: ['<善终标签>'] } },
        fail: { effects: { attr: { mood: -2 } } },
      },
    ],
  },
];
