/**
 * 世界：赛博朋克 · 雾港
 */

import type { WorldMeta } from '../../../engine/schema';

export const worldMeta: WorldMeta = {
  id: 'cyberpunk',
  name: '雾港 · 霓虹残响',
  brief:
    '建在旧海床上的垂直巨城，终年酸雨。三家巨型企业把城市切成三层：云台、桁架、锈带。你的身体、记忆与信用，都可以被买卖。',
  opening:
    '雾港的雨是酸的。\n它落在云台区的玻璃幕墙上，顺着排水槽一层层往下渗，最后滴进锈带那些永远干不了的巷子。\n有人统计过，一个锈带孩子活到成年的概率是百分之六十一。\n现在，轮到你了。',
  // 人生模型与题材（04 文档第 2 节 / 01 文档第 5 节）
  lifeModel: 'full',
  genre: 'realistic',
  // 开局可由玩家选：经典五维 / 心之禀赋 / 全随机（转盘）
  attrSystems: ['classic5', 'heart6', 'roulette'],
  // 全随机模式取本世界的专属特质池（义体 / 神经污染 / 企业身份）
  traitPoolId: 'cyberpunk',
  currencyName: '信用点',
  backgrounds: [
    {
      id: 'bg_cyberpunk_exec',
      name: '云台弃子',
      desc: '父母曾是寰宇生物的中层，一次「组织优化」后双双从系统里消失。你被从云台的高层公寓送到桁架区，档案上仍写着企业公民编号。',
      attr: { charm: 2, wealth: 2, will: -1 },
      tags: ['企业公民编号', '云台出身'],
      money: 800,
    },
    {
      id: 'bg_cyberpunk_scavenger',
      name: '锈带拾荒儿',
      desc: '你在废船坞长大，学会从报废义体里拆出还能用的神经节。认得这座城市每一种废弃物的价格。',
      attr: { perception: 2, vitality: 1, health: -1, wealth: -2 },
      tags: ['锈带长大', '识字不多'],
      money: 30,
    },
    {
      id: 'bg_cyberpunk_factory',
      name: '义体厂童工',
      desc: '沧溟重工的流水线上，你是最小的那双手。工头喜欢你，因为孩子的手指不会被静电击穿。',
      attr: { vitality: 2, health: -2, mood: -1 },
      tags: ['义体厂出身', '手掌有灼痕'],
      money: 120,
    },
    {
      id: 'bg_cyberpunk_cult',
      name: '白噪音之子',
      desc: '白噪音教团在神经频道里传教，你还没记事就被登记进名册。你的耳鸣其实是一段被加密的圣歌。',
      attr: { reverie: 3, empathy: 1, vitality: -1 },
      tags: ['教团记名', '常常耳鸣'],
      money: 60,
    },
    {
      id: 'bg_cyberpunk_smuggler',
      name: '记忆走私客的养子',
      desc: '养父把别人的记忆装进胶囊运过检查站，你负责把胶囊藏在义体玩具里。你见过太多不属于自己的人生。',
      attr: { ingenuity: 2, perception: 1, mood: -1 },
      tags: ['记忆走私', '没有出生记录'],
      money: 250,
    },
    {
      id: 'bg_cyberpunk_taxdodger',
      name: '雨水税逃户',
      desc: '你家欠了慧眼数据十九个月的雨水税。门口的征收单从薄薄一张贴成了厚厚一叠，像某种会繁殖的植物。',
      attr: { will: 3, wealth: -3, health: -1 },
      tags: ['欠雨水税', '被标记住户'],
      money: 0,
    },
  ],
  specialTags: [
    '欠雨水税',
    '义体化',
    '神经污染',
    '街头名声',
    '企业公民编号',
    '被标记住户',
    '记忆交易',
    '白噪音信徒',
    '锈牙帮',
    '潮汐网常客',
    '义体贷款',
    '被通缉',
  ],
  deathCauses: {
    神经污染: '你的神经末梢在第七次接入时烧穿了。最后一个念头是一段别人的广告歌。',
    义体贷款: '催收程序在你体内执行了停机指令。信用点还清了，人没有。',
    被通缉: '慧眼数据的巡逻机在你头上悬停了十一秒。十一秒之后，街上只剩一摊雨水。',
    义体化: '你的心脏是别人的，用了四十年，终于到期。修不好了，配件早就停产。',
    default: '你倒在雾港的雨里。路过的清洁机器人把你归入可回收物，效率很高。',
  },
};
