/**
 * 世界：赛博朋克 · 雾港 —— 壮年（26-40）
 */

import type { LifeEvent } from '../../../engine/schema';
import { DC } from '../../../engine/schema';

export const events: LifeEvent[] = [
  {
    id: 'cb_prime_001',
    stage: 'prime',
    title: '办公室',
    text: '二十七岁，你有了自己的工位，一把椅子，和一个比你大十岁的下属。\n窗外是桁架区永远的雨。玻璃是隔音的，你第一次发现雨其实是安静的。',
    require: { age: [26, 32], tags: ['慧眼数据员工'] },
    choices: [
      {
        label: '开始认真往上爬',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '三年里你递上去四份方案，第三份被采用了。', effects: { attr: { ingenuity: 3, perception: 1, wealth: 2 }, money: 15000, tags: ['中层'] } },
        fail: { text: '你的方案被别人署了名。你学会了在公司里该怎么做。', effects: { attr: { perception: 2, mood: -2 }, money: 5000 } },
      },
      {
        label: '利用权限查公司内部的旧档案',
        check: { attr: 'perception', dc: DC.extreme },
        success: { text: '你找到了「安宁疗养院」的股权穿透图——最终受益人一栏，是慧眼数据的一个影子基金。', effects: { attr: { perception: 4 }, tags: ['知道真相的一半'] } },
        fail: { text: '你触发了内部审计标记，三个月里每天都有人来查你的工位。', effects: { attr: { mood: -3 }, tags: ['被公司盯上'] } },
      },
    ],
  },

  {
    id: 'cb_prime_002',
    stage: 'prime',
    title: '第二次改造',
    text: '医生给你看了一张图：把整条脊柱换成军用级的神经脊，反应速度提升四成，代价是寿命少七年。\n「你这个年纪，正是时候。」',
    require: { age: [26, 35] },
    choices: [
      {
        label: '换',
        check: { attr: 'vitality', dc: DC.hard },
        major: true,
        success: { text: '术后第九天你就能跑得比巡逻机快。你觉得值。', effects: { attr: { vitality: 3, perception: 1, health: -6 }, money: -30000, tags: ['义体化', '神经脊'] } },
        fail: { text: '排异来得比谁都快。你在床上躺了四个月，从此右肩抬不过头顶。', effects: { attr: { health: -5, vitality: 1 }, money: -30000, tags: ['义体化', '神经脊', '右肩抬不起来'] } },
        critSuccess: { text: '手术做得干净，排异期只有两天。你跑过了那台巡逻机，还顺手把它的记录带走了。', effects: { attr: { vitality: 4, perception: 3, will: 2, health: -3 }, money: -30000, tags: ['义体化', '神经脊', '跑得过巡逻机'] } },
        critFail: { text: '神经脊在你的脊髓上烧了起来。', effects: { death: '神经脊在你体内熔断了。主刀医生签完字就走了，费用照收。' } },
      },
      {
        label: '不换，身体是自己的',
        check: { attr: 'will', dc: DC.hard },
        success: { effects: { attr: { will: 3, health: 1 }, tags: ['没有换神经脊'] } },
        fail: { text: '你拒绝了。六年后你在一场雨夜追不上一个人，才想起这件事。', effects: { attr: { will: 1, mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_prime_003',
    stage: 'prime',
    title: '孩子',
    text: '孩子出生在桁架区一间私人产房。护士把婴儿抱过来时，你看见他的手指是五根完整的、肉做的。\n余柚说：咱们不给他装任何东西，好不好。',
    require: { age: [26, 38], tags: ['和余柚同居'] },
    choices: [
      {
        label: '答应她',
        check: { attr: 'empathy', dc: DC.normal },
        success: { effects: { attr: { empathy: 3, mood: 3 }, tags: ['有个孩子', '孩子身上没有任何义体'] } },
        fail: { effects: { attr: { mood: 2 }, tags: ['有个孩子'] } },
      },
      {
        label: '先答应，但心里留了一手',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '你在孩子出生时就替他存了一份完整基因档案。以防万一。', effects: { attr: { ingenuity: 3, mood: 1 }, tags: ['有个孩子', '存了基因档案'] } },
        fail: { text: '档案被医院同步进了企业库。她发现了，一个星期没和你说话。', effects: { attr: { mood: -2 }, tags: ['有个孩子'] } },
      },
    ],
  },

  {
    id: 'cb_prime_004',
    stage: 'prime',
    title: '学校来电',
    text: '孩子八岁，学校建议他做「学习辅助接口」，说这是标准配置，全班只剩两个没做。\n孩子回家问你：爸爸，为什么我和别人不一样。',
    require: { age: [32, 40], tags: ['有个孩子'] },
    choices: [
      {
        label: '照余柚的意思，坚持不做',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你被学校的家长群排挤了半年，但孩子学会了用别的方式赢。', effects: { attr: { will: 3, empathy: 1 }, tags: ['孩子没有装接口'] } },
        fail: { text: '孩子在学校被孤立，开始自己偷着攒钱。', effects: { attr: { mood: -3 }, tags: ['孩子在偷偷攒钱'] } },
      },
      {
        label: '给他做，但不能是贷来的',
        check: { attr: 'wealth', dc: DC.hard },
        success: { text: '你全款买了一套最好的，装在孩子身上的东西，不能有第二个人能停机。', effects: { attr: { wealth: -2, perception: 2 }, money: -50000, tags: ['孩子装了接口'] } },
        fail: { text: '你还是分期了。合同第九页你这次读得很仔细，可你还是签了。', effects: { attr: { wealth: -2, mood: -2 }, money: -20000, tags: ['孩子装了接口', '义体贷款'] } },
      },
    ],
  },

  {
    id: 'cb_prime_005',
    stage: 'prime',
    title: '出卖',
    text: '你花两年做的项目，被同组的人拿去署了自己的名字，还顺带在报告里指出了你「数据来源可疑」。\n他是你带进来的。',
    require: { age: [28, 38], tags: ['中层'] },
    choices: [
      {
        label: '按公司规则，走申诉流程',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '你把两年前的原始日志全留着。公司给了他一个「另谋高就」。', effects: { attr: { perception: 3 }, money: 8000, tags: ['赢了申诉'] } },
        fail: { text: '流程走了半年，最后判定为「无明确证据」。你被调去管仓库。', effects: { attr: { mood: -3 }, psyche: { suppression: 3 }, money: 2000 } },
      },
      {
        label: '用公司外的方式解决',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '他把项目和你一起交了出来，然后离开了雾港。', effects: { attr: { will: 3 }, tags: ['用过外面的办法'] } },
        fail: { text: '你找人动了他，也留下了一条能指回你身上的线。', effects: { attr: { mood: -2 }, tags: ['被公司盯上', '手上不干净'] } },
      },
    ],
  },

  {
    id: 'cb_prime_006',
    stage: 'prime',
    title: '自己干',
    text: '你带着三个人和一台二手打印机，在锈带租下了一间地下室，挂了块牌子：\n「回声 · 义体维修与非授权数据服务」。',
    require: { age: [28, 40] },
    choices: [
      {
        label: '做正当的维修生意，先把口碑做起来',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '一年后，锈带的人修义体只找你。你开始赚钱了。', effects: { attr: { empathy: 2, wealth: 2, health: 1, vitality: 1 }, money: 20000, tags: ['自己的铺子', '小生意'] } },
        fail: { text: '正当生意赚不到钱。你三个月没给工人发工资。', effects: { attr: { wealth: -2, mood: -2 }, tags: ['自己的铺子'] } },
      },
      {
        label: '接数据那部分，风险高但来钱快',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '第一单就赚了六万。你把地下室的墙加厚了两层。', effects: { attr: { ingenuity: 3, wealth: 3 }, money: 60000, tags: ['自己的铺子', '黑活接单'] } },
        fail: { text: '第一单客户是缉查科的钓鱼。铺子被封，你赔了所有本钱。', effects: { attr: { wealth: -3, mood: -3 }, money: -10000, tags: ['被查封过'] } },
      },
    ],
  },

  {
    id: 'cb_prime_007',
    stage: 'prime',
    title: '老友',
    text: '你在街上遇见小满。他穿着客运公司的制服，头发剪短了，一只眼睛是义眼，说话很客气。\n他说：先生，需要帮忙吗。',
    require: { age: [30, 40], tags: ['小满上了车'] },
    choices: [
      {
        label: '叫他的名字',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '他愣了很久，然后用很小的声音说：我不记得你了。你信了。', effects: { attr: { empathy: 3, mood: -2 }, psyche: { suppression: 2 }, tags: ['小满还活着'] } },
        fail: { text: '他礼貌地摇头，说您认错人了，然后走了。', effects: { attr: { mood: -3 } } },
      },
      {
        label: '跟着他，看他住在哪',
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '他住在公司宿舍，一间八人间。窗台上摆着半盒旧的义体零件。', effects: { attr: { perception: 3 }, tags: ['小满还活着', '知道小满住哪'] } },
        fail: { text: '你跟着跟着跟丢了。他在云台方向的车站消失了。', effects: { attr: { mood: -2, perception: 1 } } },
      },
    ],
  },

  {
    id: 'cb_prime_008',
    stage: 'prime',
    title: '老范的葬礼',
    text: '老范死在第七监区，没有说明死因，骨灰盒里是空的。\n来的人有四十多个，一半是他治过的锈带人，一半是你不认识的、穿得很好的人。',
    require: { age: [30, 40], tags: ['在诊所打杂'] },
    choices: [
      {
        label: '替他接手那间诊所',
        check: { attr: 'empathy', dc: DC.extreme },
        success: { text: '你把诊所重新开起来了。门牌上还是他的名字，你没改。', effects: { attr: { empathy: 4, will: 2, health: 1, vitality: 1 }, money: -20000, tags: ['接手了诊所', '小生意'] } },
        fail: { text: '你办不下来执照，诊所被征收队封了。你在门口站了一夜。', effects: { attr: { mood: -4 }, psyche: { suppression: 4 }, money: -5000 } },
      },
      {
        label: '去查他的死因',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '他死前最后接的一个病人，是慧眼数据的高管。', effects: { attr: { perception: 3 }, tags: ['知道真相的一半'] } },
        fail: { text: '查了半年，档案上的死因写着「自然死亡」。', effects: { attr: { mood: -2, perception: 1 } } },
      },
    ],
  },

  {
    id: 'cb_prime_009',
    stage: 'prime',
    title: '追车',
    text: '雨夜，一辆黑色的悬浮车跟在孩子放学的路线后面，跟了两条街。\n你身上没有任何武器，只有一个还开着的维修铺子。',
    require: { age: [32, 40], tags: ['有个孩子'] },
    choices: [
      {
        label: '冲到车前面拦住它',
        check: { attr: 'vitality', dc: DC.extreme },
        success: { text: '车停下了。车窗降下来，里面的人给你看了一张征收令，然后开走了。', effects: { attr: { vitality: 3, will: 2 }, tags: ['拦过企业的车'] } },
        fail: { text: '车没有停。你被撞飞了七米，孩子跑过来的时候你已经爬起来了。', effects: { attr: { health: -5, will: 2 }, tags: ['腿上有阻尼器'] } },
      },
      {
        label: '先把孩子藏起来，再回头查这辆车',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '车牌是假的，车架号是真的——属于慧眼数据的资产池。', effects: { attr: { perception: 3 }, tags: ['知道真相的一半', '有辆车在跟着孩子'] } },
        fail: { text: '你查了两周，什么也没查到。孩子从此每天由你亲自接送。', effects: { attr: { perception: 1, will: 1 }, tags: ['有辆车在跟着孩子'] } },
      },
    ],
  },

  {
    id: 'cb_prime_010',
    stage: 'prime',
    title: '董事会',
    text: '有人在会议室里把一份提案推到你面前：锈带七号巷至十九号巷，整体清空，改建为数据中心。\n给出补偿方案的人，写的是你的名字。',
    require: { age: [32, 40], tags: ['中层'] },
    choices: [
      {
        label: '在提案上签字',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你签了，然后私下去把每户的补偿金额都翻了一倍。公司没有发现。', effects: { attr: { will: 2, empathy: 2, wealth: 2 }, money: 30000, tags: ['签过那份提案'] } },
        fail: { text: '你签了字，补偿方案按原样执行。七号巷的孩子在雨里搬了三天家。', effects: { attr: { mood: -4, wealth: 2 }, money: 30000, tags: ['签过那份提案'] } },
      },
      {
        label: '当场把提案推回去',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '你保住了那十三条巷子，也把自己的晋升路堵死了。', effects: { attr: { will: 4, empathy: 2 }, tags: ['挡过一次清空'] } },
        fail: { text: '提案照样通过，你被调离了这个项目。什么都没有改变。', effects: { attr: { mood: -3, will: 1 } } },
      },
    ],
  },

  {
    id: 'cb_prime_011',
    stage: 'prime',
    title: '神经退化',
    text: '你开始记不住上一周的事。医生说是接入过度造成的渐进性损伤，目前没有根治办法。\n「它会一直退，但很慢。慢到你有时间安排后事。」',
    require: { age: [33, 40], tags: ['神经污染'] },
    choices: [
      {
        label: '把重要的记忆全部备份到外部存储',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '你给自己做了一套索引：每天早上先读一遍「我是谁」。', effects: { attr: { ingenuity: 3, will: 2, mood: -1 }, tags: ['给自己做了索引'] } },
        fail: { text: '备份到一半，存储被慧眼数据的格式清洗了。你丢了三年。', effects: { attr: { mood: -4, reverie: -2 } } },
      },
      {
        label: '不做备份，用纸和笔写下来',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '你开始写日记。字很丑，但每一页都还在。', effects: { attr: { will: 3, mood: 1, reverie: 1 }, tags: ['写日记的人'] } },
        fail: { text: '你写到第十页就忘了自己写过。日记本被压在了一堆旧账下面。', effects: { attr: { mood: -3 } } },
      },
    ],
  },

  {
    id: 'cb_prime_012',
    stage: 'prime',
    title: '回流',
    text: '三号楼的档案在你手上过了一遍。里面有一份「回流计划」：把锈带孩子的记忆按年龄段采集，卖给云台上想要「重新活一次童年」的人。\n报价每段十二万。',
    require: { age: [30, 40], tags: ['知道真相的一半'] },
    choices: [
      {
        label: '把这份档案公布出去',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '全城的广告屏亮了四十分钟。之后有十七个人来找你，说他们愿意作证。', effects: { attr: { will: 4, empathy: 2, health: -2 }, psyche: { suppression: 2 }, tags: ['公布过回流计划', '被通缉'] } },
        fail: { text: '你发出去的十分钟内就被拦截了。你的脸重新出现在广告屏上。', effects: { attr: { mood: -3 }, tags: ['被通缉'] } },
      },
      {
        label: '先留着这份档案，用来做别的',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '你把它当作筹码，换来了铺子的十年经营许可。你告诉自己这只是暂时的。', effects: { attr: { ingenuity: 3, wealth: 3 }, money: 80000, tags: ['手里有一份要命的档案'] } },
        fail: { text: '档案被人偷走了。三天后，见过它的三个人都出了意外。', effects: { attr: { mood: -4 }, tags: ['手上有过那份档案'] } },
      },
    ],
  },

  {
    id: 'cb_prime_013',
    stage: 'prime',
    title: '那个跟着你的孩子',
    text: '当年那个接口流脓的孩子，现在二十出头，手上已经有两条人命。\n他来找你，说想干最后一票就收手，问你要不要一起。',
    require: { age: [33, 40], tags: ['有个跟着你的人'] },
    choices: [
      {
        label: '陪他干完这一票',
        check: { attr: 'vitality', dc: DC.hard },
        success: { text: '你们成了。他拿着钱去了荒原那边，走之前把刀留给了你。', effects: { attr: { vitality: 2, empathy: 2 }, money: 40000, tags: ['他的刀'] } },
        fail: { text: '他死在你怀里。刀还在他手上，没拔出来。', effects: { attr: { health: -4, mood: -5 }, psyche: { suppression: 5, selfWorth: -2 }, tags: ['埋过朋友'] } },
      },
      {
        label: '把他关在铺子里，不让他去',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '他砸了你的柜台，骂了你三天。第四天他哭了，说他不知道还能干什么。', effects: { attr: { will: 3, empathy: 2 }, tags: ['留住了他'] } },
        fail: { text: '他半夜撬开门走了。你后来在新闻里看见了他的编号。', effects: { attr: { mood: -4 } } },
      },
    ],
  },

  {
    id: 'cb_prime_014',
    stage: 'prime',
    title: '雨停了',
    text: '雾港下了四十年雨，这一年夏天，云台区的除雨系统升级，酸雨第一次在锈带上空停了三个小时。\n所有人都在抬头。',
    require: { age: [28, 40], chance: 0.4 },
    choices: [
      {
        label: '带孩子上屋顶看',
        check: { attr: 'empathy', dc: DC.easy },
        success: { text: '他问：爸爸，以后都会这样吗。你说：不知道。但你先记住今天。', effects: { attr: { empathy: 2, mood: 4 }, tags: ['见过雨停'] } },
        fail: { effects: { attr: { mood: 2 }, tags: ['见过雨停'] } },
      },
      {
        label: '一个人待在铺子里，把这天做完的活做完',
        check: { attr: 'will', dc: DC.normal },
        success: { effects: { attr: { will: 2, wealth: 1, health: 1, vitality: 1 }, money: 3000, tags: ['见过雨停', '小生意'] } },
        fail: { text: '你抬头看了一眼窗外的光，然后继续低头。', effects: { attr: { mood: -1 }, tags: ['见过雨停'] } },
      },
    ],
  },

  {
    id: 'cb_prime_015',
    stage: 'prime',
    title: '暗杀',
    text: '有人在你的维修台上放了一枚定向 EMP 弹，位置摆得很讲究——正好在你习惯伸手的那一格。\n放它的人知道你所有的习惯。',
    require: { age: [33, 40], tags: ['被公司盯上'] },
    choices: [
      {
        label: '看得出是谁放的，先不动声色',
        check: { attr: 'perception', dc: DC.extreme },
        success: { text: '台面上一粒不属于你的花粉，指向云台植物园。你顺着这条线找到了一家花店。', effects: { attr: { perception: 4 }, tags: ['摸到花店'] } },
        fail: { text: '你只是把它扔了。三天后你的腿被炸了一下。', effects: { attr: { health: -4 }, tags: ['腿上有阻尼器'] } },
      },
      {
        label: '直接把铺子关了，带着家人搬走',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '你们搬到桁架区的另一头。铺子重新开了张，招牌换了名字。', effects: { attr: { will: 2, wealth: -2 }, money: -20000, tags: ['搬过一次铺子'] } },
        fail: { text: '新铺子的门锁第二天就被撬了。你明白了这不是地址的问题。', effects: { attr: { mood: -3, wealth: -2 } } },
      },
    ],
  },

  {
    id: 'cb_prime_016',
    stage: 'prime',
    title: '花店',
    text: '云台植物园下面确实有一家花店，卖的是真花，价格贵得离谱。\n店主是个说话很轻的老人。他说：你知道你在找什么，但你不该找到。',
    require: { age: [34, 40], tags: ['摸到花店'] },
    choices: [
      {
        label: '坐下来，听他说完',
        check: { attr: 'reverie', dc: DC.hard },
        success: { text: '他告诉你「回流计划」真正的甲方：不是富人，是云台自己——他们需要新的童年。', effects: { attr: { reverie: 3, perception: 2 }, tags: ['知道真相的全部'] } },
        fail: { text: '他改了口，只卖给你一束花。花第二天就谢了。', effects: { attr: { mood: -1, reverie: 1 } } },
      },
      {
        label: '反过来查这个老人是谁',
        check: { attr: 'perception', dc: DC.extreme },
        success: { text: '他三十年前是慧眼数据的第一任架构师，现在档案上写着「已故」。', effects: { attr: { perception: 4 }, tags: ['知道真相的全部', '认识架构师'] } },
        fail: { text: '你用尽办法，只查到一张空白的户籍卡。', effects: { attr: { perception: 1, mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_prime_017',
    stage: 'prime',
    title: '孩子的手',
    text: '孩子十六岁，瞒着你用打工的钱装了一套接口。他回家时把手藏在身后。\n那套接口是最便宜的型号，接口处有一圈发红的炎症。',
    require: { age: [38, 40], tags: ['有个孩子'] },
    choices: [
      {
        label: '先处理炎症，别的什么都不说',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '你给他换了接口，装得比他自己的好。他一句话也没说，但哭了。', effects: { attr: { empathy: 3, mood: 1 }, money: -10000, tags: ['孩子装了接口'] } },
        fail: { text: '你手抖了。装完之后他抬不起右手，你比他更难受。', effects: { attr: { mood: -3 }, money: -10000, tags: ['孩子装了接口'] } },
      },
      {
        label: '问他为什么',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '他说：因为我不想一直在这一层。你无法反驳。', effects: { attr: { perception: 3, mood: -1 }, tags: ['孩子装了接口', '孩子想上去'] } },
        fail: { text: '他什么都不说，把门关上了。那道门之后关了很多年。', effects: { attr: { mood: -3 }, tags: ['孩子装了接口'] } },
      },
    ],
  },

  {
    id: 'cb_prime_018',
    stage: 'prime',
    title: '余柚的名单',
    text: '余柚在慧眼数据的三年里，陆陆续续抄了一份名单——所有被「回流计划」标记过的锈带孩子。\n她把名单给你的时候说：我一直在做这件事。',
    require: { age: [32, 40], tags: ['余柚'] },
    choices: [
      {
        label: '和她一起把名单送出去',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '你们把名单拆成四百份，通过维修铺的客户网络撒了出去。这次拦不住。', effects: { attr: { will: 4, empathy: 2 }, money: -10000, tags: ['公布过回流计划', '和余柚一起'] } },
        fail: { text: '名单在送出前被截了。余柚被叫去「谈话」，回来时不太一样了。', effects: { attr: { mood: -4 }, tags: ['余柚被谈话过'] } },
      },
      {
        label: '先藏起来，等一个更好的时机',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { effects: { attr: { ingenuity: 3, perception: 1 }, tags: ['手里有一份要命的档案', '和余柚一起'] } },
        fail: { text: '时机一直没来。名单在你们的床底下放了六年。', effects: { attr: { mood: -2 }, tags: ['手里有一份要命的档案'] } },
      },
    ],
  },

  {
    id: 'cb_prime_019',
    stage: 'prime',
    title: '四十岁',
    text: '四十岁生日，你站在铺子的门口，看着雨从楼上落下来。\n你身上有七处义体，一个铺子，一份名单，和一些埋在滩涂上的人。',
    require: { age: [40, 40] },
    effects: { attr: { perception: 1, will: 1, mood: 1 }, tags: ['四十岁'] },
  },

  {
    id: 'cb_prime_020',
    stage: 'prime',
    title: '旧刀',
    text: '锈牙的旧仓库要拆了。你去的时候，阿鸾留下的那把脉冲刀还在原来的铁柜里，和十九年前一样。\n刀柄上刻了一行小字，是她写的：别挡，要进。',
    require: { age: [34, 40], tags: ['欠阿鸾一次'] },
    choices: [
      {
        label: '把刀带走',
        check: { attr: 'will', dc: DC.normal },
        success: { effects: { attr: { will: 3 }, tags: ['带着那把刀'] } },
        fail: { text: '刀卡在柜子里拔不出来。你最后留了它在原地。', effects: { attr: { mood: -1, will: 1 } } },
      },
      {
        label: '把它留给还在这条街上混的年轻人',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '你把刀给了一个十五岁的女孩。她问你为什么。你说：因为有人这么给过我。', effects: { attr: { empathy: 3, mood: 2 }, tags: ['传下去过'] } },
        fail: { text: '年轻人嫌它是旧型号，拿去换了两百信用点。', effects: { attr: { mood: -3 } } },
      },
    ],
  },

  {
    id: 'cb_prime_021',
    stage: 'prime',
    title: '云台上的邀请',
    text: '慧眼数据送来一份邀请函：云台区住户资格审核通过，欢迎您成为合规住户。\n附了一张照片，是从云台往下看的雾港，雨在脚下。',
    require: { age: [34, 40], tags: ['合规住户'] },
    choices: [
      {
        label: '去',
        check: { attr: 'wealth', dc: DC.hard },
        success: { text: '你们上去了。你在阳台上站了一夜，看着下面那条巷子。', effects: { attr: { wealth: 3, mood: 2 }, money: -60000, tags: ['住在云台'] } },
        fail: { text: '审核在最后一刻被撤销。理由一栏写着「社会关联存在风险」。', effects: { attr: { mood: -3 } } },
      },
      {
        label: '把邀请函寄回，附一句「不必了」',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你把这句话写在邀请函背面，字很直。', effects: { attr: { will: 3, mood: 1 }, tags: ['拒绝过云台'] } },
        fail: { text: '你写了，又撕了，最后还是没寄。', effects: { attr: { mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_prime_022',
    stage: 'prime',
    title: '架构师',
    text: '花店的老人快不行了。他把你叫过去，交给你一枚旧的存储片。\n「里面是节点 0 的根密钥。我用它建了这座城市，也用它可以关掉一部分。」',
    require: { age: [35, 40], tags: ['认识架构师'] },
    choices: [
      {
        label: '接过它',
        check: { attr: 'will', dc: DC.extreme },
        major: true,
        success: { text: '你把它缝进了自己的义体里，那个位置只有你自己知道。', effects: { attr: { will: 3, ingenuity: 2 }, tags: ['拿着根密钥'] } },
        fail: { text: '存储片在你手上烧了。老人笑了，说：那也好。', effects: { attr: { mood: -2 } } },
        critSuccess: { text: '你不但接下了它，还当场读出了第一层结构。老人说：比我当年快。', effects: { attr: { will: 3, ingenuity: 3, perception: 3, reverie: 2 }, tags: ['拿着根密钥', '知道真相的全部', '认识架构师'] } },
        critFail: { text: '存储片认出你不是它等的人。它在你手上过了三秒的电。', effects: { death: '根密钥在你手里烧穿了。你到死都没看清里面存的是什么。' } },
      },
      {
        label: '问他：你为什么不自己用',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '他说：我建的时候以为是在修一座城。后来发现是在造一只胃。', effects: { attr: { perception: 3, reverie: 1 }, tags: ['知道真相的全部', '拿着根密钥'] } },
        fail: { text: '他没回答，只是闭上眼睛。第二天，花店关门了。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_prime_023',
    stage: 'prime',
    title: '节点 0',
    text: '你用根密钥打开了一个只对你可见的界面。三千四百个编号，实时跳动。\n旁边有一行灰色的字：本节点承载雾港全部「人生重开」请求，当前排队 2,147,483,647。',
    require: { age: [35, 40], tags: ['拿着根密钥'] },
    choices: [
      {
        label: '关掉它的一部分',
        check: { attr: 'ingenuity', dc: DC.extreme },
        success: { text: '你关了排水调度和税收结算。第二天云台区积了水。', effects: { attr: { ingenuity: 4, will: 2 }, tags: ['动过节点 0'] } },
        fail: { text: '你操作的瞬间，整个界面开始反向追踪你。你拔掉了接入环，耳朵流了血。', effects: { attr: { health: -4 }, psyche: { suppression: 2 }, gainTraits: ['cyber_neuro_pollution'], tags: ['神经污染', '动过节点 0'] } },
      },
      {
        label: '什么都不做，先把那个数字记住',
        check: { attr: 'reverie', dc: DC.hard },
        success: { text: '你记住了那个数字。你开始明白：这座城市本身，就是一台人生重开的机器。', effects: { attr: { reverie: 3, perception: 2 }, tags: ['看见了那台机器'] } },
        fail: { text: '你看得太久，接入环过热，你昏了过去。醒来时界面已经关了。', effects: { attr: { health: -2, mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_prime_024',
    stage: 'prime',
    title: '余柚的凉手',
    text: '余柚的手越来越凉。医生说是义体接口的老化，跟她母亲当年一样。\n她握着你的手说：我一直以为，我是在替她活着。',
    require: { age: [35, 40], tags: ['余柚'] },
    choices: [
      {
        label: '告诉她：不是，你是你自己',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '她笑了一下，说：那你早点说啊。', effects: { attr: { empathy: 4, mood: 3 }, tags: ['余柚的约定'] } },
        fail: { text: '她没听见你的话，已经睡着了。', effects: { attr: { mood: -2 } } },
      },
      {
        label: '把根密钥的事告诉她',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '她听完说：那我们得活着把这件事做完。你们第一次像两个人，而不是两个幸存者。', effects: { attr: { will: 3, empathy: 2 }, tags: ['余柚知道密钥'] } },
        fail: { text: '她听完很久没说话。她怕，你也怕。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_prime_025',
    stage: 'prime',
    title: '一场雨',
    text: '锈带十七号巷的一栋楼在雨里塌了，压死了九个人，全是孩子。\n官方通报说是因为违规改建。那栋楼的改建许可，是你在慧眼时签的字。',
    require: { age: [36, 40], tags: ['签过那份提案'] },
    choices: [
      {
        label: '公开说出你签过那个字',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '你站到了广告屏前，说了四十分钟。没有人打断你。', effects: { attr: { will: 4, empathy: 2, mood: -2 }, psyche: { suppression: 2 }, tags: ['公开认过账'] } },
        fail: { text: '你没能说出口。你在台上站了两分钟就走了。', effects: { attr: { mood: -5 }, psyche: { suppression: 5, selfWorth: -2 }, tags: ['没能说出口'] } },
      },
      {
        label: '用别的办法赔——把九户人家安置好',
        check: { attr: 'wealth', dc: DC.hard },
        success: { text: '你卖掉了铺子的楼上两层，把九户人安置在桁架区。没有一个人知道是你。', effects: { attr: { empathy: 3, wealth: -3, mood: 1 }, money: -80000, tags: ['安置过九户人'] } },
        fail: { text: '钱不够。你只安置了四户，另外五户搬去了城南。', effects: { attr: { wealth: -3, mood: -3 }, money: -50000 } },
      },
    ],
  },

  {
    id: 'cb_prime_026',
    stage: 'prime',
    title: '传承',
    text: '铺子里现在有六个学徒，最小的十四岁，最大的二十九。他们都叫你老板，只有最小的那个叫你哥。\n你把维修台的钥匙交出去那天，雨下得很大。',
    require: { age: [38, 40], tags: ['自己的铺子'] },
    choices: [
      {
        label: '把铺子交给他们，自己退到后面',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '他们做得比你当年好。你偶尔回来，坐在门口抽烟，看他们干活。', effects: { attr: { empathy: 3, mood: 3, wealth: 1, health: 1, vitality: 1 }, tags: ['退休的老板', '小生意'] } },
        fail: { text: '他们半年后把铺子卖了。你没说什么。', effects: { attr: { mood: -2 }, money: 30000 } },
      },
      {
        label: '继续自己管，手不能停',
        check: { attr: 'vitality', dc: DC.hard },
        success: { effects: { attr: { vitality: 2, wealth: 2 }, money: 40000, tags: ['一直干活的人'] } },
        fail: { text: '你的手在冬天开始抖。修不好的东西越来越多。', effects: { attr: { health: -3, mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_prime_027',
    stage: 'prime',
    title: '半年一次',
    text: '身上装了东西以后，日子就按「半年」切：半年一次清洗，半年一次校准，半年一次把排异压回去。\n这笔钱省不得 —— 省下来的那次，往往就是最后一次。',
    require: { age: [28, 40], tags: ['义体化', '小生意'] },
    once: false,
    weight: 3,
    choices: [
      {
        label: '按期做，该花就花',
        check: { attr: 'wealth', dc: DC.easy },
        success: { text: '接口清洗干净，排异数值压到了安全线以下。你还能接着干。', effects: { attr: { health: 2, vitality: 2 }, money: -15000 } },
        fail: { text: '你把这次的钱挪去进了批零件。校准拖到了下个季度。', effects: { attr: { health: 1, vitality: -1 } } },
      },
      {
        label: '自己拆开清理，省这笔钱',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '你按着老范教的手法拆洗了一遍，比外面做得细。', effects: { attr: { health: 2, vitality: 2, ingenuity: 1 } } },
        fail: { text: '你把一根排线接反了，右手麻了三个星期。', effects: { attr: { health: -2, vitality: 1 } } },
      },
    ],
  },

  {
    id: 'cb_prime_028',
    stage: 'prime',
    title: '货梯',
    text: '云台上的活要人上去。检修通道是七十米的竖梯，你的椅子过不去。\n运货电梯每晚会空着上行一次，门是坏的，锁是旧的。',
    require: { caps: ['wheelchair'], age: [28, 40] },
    choices: [
      {
        label: '把椅子拆成两半，坐货梯上去',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '你在梯厢里拆开，上去再装回去。上面的人看了你很久。', effects: { attr: { ingenuity: 2, will: 1 }, money: 3000, tags: ['上去过'] } },
        fail: { text: '轮轴掉进了梯缝。你在云台的地面上用手爬了二十米。', effects: { attr: { health: -2, mood: -2 } } },
      },
      {
        label: '找到货梯的检修员，给他钱',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '他收了钱，还告诉你有两部梯的锁一直是坏的。', effects: { attr: { empathy: 2 }, money: -1500, tags: ['认识货梯的人'] } },
        fail: { text: '他拿了钱，第二天换上了新锁。', effects: { attr: { mood: -2 }, money: -1500 } },
      },
    ],
  },
];
