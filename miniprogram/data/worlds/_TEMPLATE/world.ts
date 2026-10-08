/**
 * 世界元数据模板 —— 复制本文件到 <worldId>/world.ts 后逐项替换
 */

import type { WorldMeta } from '../../../engine/schema';

export const worldMeta: WorldMeta = {
  id: '<worldId>', // 英文小写下划线，例：cyberpunk
  name: '<世界名>',
  brief: '<一句话世界观简介，20~40 字>',
  opening: '<进入世界时的开场独白，2~4 句，建立基调>',
  // 人生模型：full 生到死 / episodic 片段连载（04 文档第 2 节）
  lifeModel: 'full',
  // 检定题材标签：realistic / fantasy / mystery / horror / ancient（01 文档第 5 节）
  genre: 'realistic',
  // 支持的属性系统：开局由玩家选；有专属特质池时再加 'roulette'
  attrSystems: ['classic5', 'heart6'],
  // 本世界货币显示名，留空则用「金钱」
  currencyName: '<货币名>',
  // 开局背景包 6~8 个：跑团系统下替代外貌与家境，五维系统下作为附加特质
  backgrounds: [
    {
      id: 'bg_<worldId>_<name>',
      name: '<背景名>',
      desc: '<一两句描述，说明出身与处境>',
      attr: { perception: 1, health: -1 }, // 初始属性修正，用语义键
      tags: ['<开局标签>'],
      money: 0,
    },
  ],
  // 专属标签池：本世界特有的状态标记，结局判定与检索用
  specialTags: ['<专属标签1>', '<专属标签2>'],
  // 死亡原因文案池（分池结构，解析顺序 byCause → byAttr → age → default）
  // byCause：事件写明的死因 key；byAttr：属性耗尽时是哪一项；age：寿终；default：兜底（必填）
  deathCauses: {
    byCause: {
      '<死因 key>': '<死因文案>',
    },
    byAttr: {
      vitality: '<行力耗尽>', // heart6 / roulette
      constitution: '<体质耗尽>', // classic5
    },
    age: '<寿终文案>',
    default: '<通用死因文案>',
  },
};
