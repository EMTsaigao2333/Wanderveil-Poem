/**
 * 世界：赛博朋克 · 雾港 —— 少年（7-15）
 */

import type { LifeEvent } from '../../../engine/schema';
import { DC } from '../../../engine/schema';

export const events: LifeEvent[] = [
  {
    id: 'cb_teen_001',
    stage: 'teen',
    title: '第一堂课',
    text: '桁架区的公立学堂按「义体适配等级」分班。你的名字被念到时，全班只有三个人没有义体。\n先生把你们三个安排在最后一排，说：坐这儿对耳朵好。',
    require: { age: [7, 9] },
    choices: [
      {
        label: '举手，问为什么',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '先生说：因为你听得见别人听不见的。第一次有人把穷说成优点。', effects: { attr: { will: 2, perception: 1 } } },
        fail: { text: '全班笑了。你在最后一排坐了三年。', effects: { attr: { will: 1, mood: -2 }, psyche: { suppression: 2, selfWorth: -1 } } },
      },
      {
        label: '不做声，把课本翻到底',
        check: { attr: 'perception', dc: DC.easy },
        success: { text: '你提前读完了整册，包括最后那页没人讲的附录。', effects: { attr: { perception: 2, ingenuity: 1 } } },
        fail: { effects: { attr: { perception: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_teen_002',
    stage: 'teen',
    title: '废船坞',
    text: '老船坞的搁浅货轮里塞满了报废义体，拆下来的神经节一根能卖十五信用点，好的能卖八十。\n危险的是船舱深处那些还没停机的东西——它们有时候还会动。',
    require: { age: [9, 13] },
    choices: [
      {
        label: '往最深的舱室走',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '你摸到一整箱密封完好的军用级神经节。', effects: { attr: { perception: 3 }, money: 400, tags: ['下过深舱'] } },
        fail: { text: '一具半活的维修义体抓住了你的小腿。你割开裤腿才脱身。', effects: { attr: { health: -3, mood: -2 }, tags: ['小腿的抓痕'] } },
      },
      {
        label: '在外围捡，天黑前回家',
        check: { attr: 'vitality', dc: DC.easy },
        success: { effects: { attr: { vitality: 1, perception: 1 }, money: 60 } },
        fail: { text: '你捡了一天，只换来一顿饭钱。', effects: { attr: { mood: -1 }, money: 20 } },
      },
      {
        label: '不下舱，在梯口敲钢梁，用回声量里面的深浅',
        require: { caps: ['blind'] },
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '你听出第三间舱是空的。带人进去时，货一动没动。', effects: { attr: { ingenuity: 2, perception: 1 }, money: 300, tags: ['习惯了回声'] } },
        fail: { text: '回声糊成一片。你把空的听成了实的，白跑一趟。', effects: { attr: { ingenuity: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_teen_003',
    stage: 'teen',
    title: '老范的诊所',
    text: '老范是锈带唯一还愿意给孩子看病的医生，兽医出身，器械是拼的，手是稳的。\n他在你的体检卡上写下「营养不良」，然后从抽屉里拿出一颗糖。',
    require: { age: [8, 12] },
    choices: [
      {
        label: '问他要不要人帮忙',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '他让你负责洗器械。一周三次，管一顿饭。', effects: { attr: { empathy: 2, perception: 1, health: 1 }, tags: ['在诊所打杂'] } },
        fail: { text: '他说：你太小了，别把命搭在别人的病上。', effects: { attr: { empathy: 1 } } },
      },
      {
        label: '把糖留给隔壁更小的孩子',
        check: { attr: 'will', dc: DC.easy },
        success: { text: '老范看了你一眼，第二天抽屉里多了两颗。', effects: { attr: { will: 2, mood: 1 }, tags: ['锈带的规矩'] } },
        fail: { text: '你留下了糖，甜味让你难受了一下午。', effects: { attr: { mood: -1, health: 1 } } },
      },
    ],
  },

  {
    id: 'cb_teen_004',
    stage: 'teen',
    title: '第一次接入',
    text: '阿鸾给了你一副二手的神经接入环，说：潮汐网里什么都有，就是别待太久。\n你戴上它，第一次看见雨幕后面的城市——每一堵墙都在发光，写着字。',
    require: { age: [10, 14] },
    choices: [
      {
        label: '顺着光一直往里走',
        check: { attr: 'reverie', dc: DC.normal },
        success: { text: '你闯进一片没人维护的旧数据坟场，那里安静得像雪地。', effects: { attr: { reverie: 3 }, tags: ['潮汐网常客', '去过数据坟场'] } },
        fail: { text: '你被广告程序缠住了，它在你的视网膜上连播了六个小时。', effects: { attr: { reverie: 1, health: -1, mood: -2 }, psyche: { suppression: 1 }, gainTraits: ['cyber_neuro_pollution'], tags: ['神经污染'] } },
      },
      {
        label: '只查一件有用的事：你母亲的档案',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '你搜到了她的员工编号，状态栏写着「转出 · 未登记」。', effects: { attr: { perception: 3 }, tags: ['查过母亲的档案'] } },
        fail: { text: '查询记录被记录了。三天后有人在巷口问你叫什么名字。', effects: { attr: { perception: 1, mood: -2 }, tags: ['被标记住户'] } },
      },
    ],
  },

  {
    id: 'cb_teen_005',
    stage: 'teen',
    title: '小满',
    text: '小满住在你隔壁，比你大一岁。他把偷来的义体零件藏在鞋盒里，分你一半。\n他说等攒够了钱，就买票坐轨道电梯上一次云台，「就上去看一眼，然后就下来」。',
    require: { age: [9, 13] },
    choices: [
      {
        label: '跟他一起攒',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '你们在一个铁盒里攒了一千四百信用点，谁也没动过。', effects: { attr: { will: 2, mood: 2 }, money: 100, tags: ['和小满的票钱'] } },
        fail: { text: '钱被小满的父亲拿去还债了。他哭了，你没哭。', effects: { attr: { mood: -2, empathy: 1 } } },
      },
      {
        label: '告诉他云台上的人不会让他下来',
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '他沉默了一会，说：那我就从上面看下来。', effects: { attr: { perception: 2, empathy: 1 }, tags: ['和小满的约定'] } },
        fail: { text: '他生气了，一星期没和你说话。', effects: { attr: { mood: -1, perception: 1 } } },
      },
    ],
  },

  {
    id: 'cb_teen_006',
    stage: 'teen',
    title: '锈牙的邀请',
    text: '阿鸾在诊所门口拦住你，给你看了一样东西：一把完好的、没有登记号的脉冲刀。\n「跟锈牙干三个月，你就有自己的铺位，不用再睡船坞。」',
    require: { age: [12, 15] },
    choices: [
      {
        label: '答应她，先干三个月',
        check: { attr: 'vitality', dc: DC.normal },
        major: true,
        success: { text: '你替人跑了七十趟货，一次也没被抓。', effects: { attr: { vitality: 2, ingenuity: 1 }, money: 500, tags: ['锈牙帮', '街头名声'] } },
        fail: { text: '第二趟就撞上了巡逻机。阿鸾替你顶了罪。', effects: { attr: { vitality: 1, mood: -2 }, psyche: { suppression: 2 }, tags: ['欠阿鸾一次'] } },
        critSuccess: { text: '你替锈牙跑穿了三条街的封锁线。回来那天，阿鸾把一把没有登记号的刀放在你面前。', effects: { attr: { vitality: 3, will: 2, charm: 1 }, money: 2000, tags: ['锈牙帮', '街头名声', '会用刀'] } },
        critFail: { text: '第一批货就出了问题。你在巷口被追上，没有跑出去。', effects: { death: '被通缉' } },
      },
      {
        label: '拒绝，说自己有别的事要做',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '阿鸾收起刀，说：那你最好真的做得到。', effects: { attr: { will: 3 }, tags: ['拒绝过锈牙'] } },
        fail: { text: '她笑了笑，第二天你的铺位被人占了。', effects: { attr: { will: 1, mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_teen_007',
    stage: 'teen',
    title: '征收队',
    text: '征收队带着扫描器上门，说这条巷子有三户欠税，其中一户是你家。\n他们没有找到值钱的东西，最后把目光停在你身上——「这孩子身上有接口，能抵两个月的税。」',
    require: { age: [11, 15], chance: 0.6 },
    choices: [
      {
        label: '自己拆掉接口，扔到他们脚下',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你没打麻药，血滴在扫描器上。他们走了。', effects: { attr: { will: 3, health: -2 }, tags: ['自己拆过接口'] } },
        fail: { text: '你拆到一半就晕了，是征收员顺手替你封住的。', effects: { attr: { health: -3, mood: -2 }, tags: ['颈部有疤'] } },
      },
      {
        label: '把藏在墙缝里的钱交出去',
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '你只交了一部分，藏在鞋底的那些留住了。', effects: { attr: { perception: 2, mood: -1 }, money: -200 } },
        fail: { text: '他们搜出了全部，包括小满的那一份。', effects: { attr: { mood: -3 }, money: -400 } },
      },
    ],
  },

  {
    id: 'cb_teen_008',
    stage: 'teen',
    title: '标准答案',
    text: '统考前一天，有人在厕所里卖答案卡，五十信用点一份。\n学堂的排名决定谁能进企业的少年班，少年班决定谁这辈子不用住铁皮屋。',
    require: { age: [12, 15] },
    choices: [
      {
        label: '买一份，抄进去',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '你把答案改动了两成——太完美会露馅。', effects: { attr: { ingenuity: 3 }, money: -50, tags: ['少年班'], } },
        fail: { text: '你抄得太顺，被先生当场按住了手。', effects: { attr: { mood: -3 }, tags: ['考场作弊记录'] } },
      },
      {
        label: '不买，自己考',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '你考进了前二十名。没有奖状，但先生记住了你的名字。', effects: { attr: { perception: 3, will: 1 }, tags: ['少年班'] } },
        fail: { text: '差七分。那七分你一辈子都记得。', effects: { attr: { will: 2, mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_teen_009',
    stage: 'teen',
    title: '黑市',
    text: '锈带的黑市在旧地铁站里，摊主把义体零件摊在报纸上卖。\n有人问你收不收「活的」——他说的是刚从人身上取下来的，还带着体温。',
    require: { age: [12, 15], chance: 0.6 },
    choices: [
      {
        label: '问他货从哪来',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '他从一家名为「安宁疗养院」的地方进货。你把名字记下来了。', effects: { attr: { perception: 3 }, tags: ['知道疗养院'] } },
        fail: { text: '他不肯说，还记住了你的脸。', effects: { attr: { perception: 1, mood: -1 }, tags: ['被黑市记住'] } },
      },
      {
        label: '转身就走',
        check: { attr: 'will', dc: DC.easy },
        success: { effects: { attr: { will: 2 }, tags: ['不碰活货'] } },
        fail: { text: '走了两步你又回头了。你太需要钱了。', effects: { attr: { mood: -2, wealth: 1 }, money: 150, tags: ['碰过活货'] } },
      },
    ],
  },

  {
    id: 'cb_teen_010',
    stage: 'teen',
    title: '追捕',
    text: '慧眼数据的两架巡逻机在桁架区巡线，它们的探照灯扫过每一个没有住户卡的人。\n你手里那包货还没送出去，前面是通道口，后面是死墙。',
    require: { age: [12, 15], chance: 0.55 },
    choices: [
      {
        label: '钻进排水管，货咬在嘴里',
        check: { attr: 'vitality', dc: DC.hard },
        success: { text: '你在污水里爬了四百米，货一滴没湿。', effects: { attr: { vitality: 3, health: -1 }, tags: ['熟路'] } },
        fail: { text: '管道太窄，你被卡住，机器人在外面等了两分钟才走。', effects: { attr: { health: -2, mood: -2 } } },
      },
      {
        label: '把货扔掉，装成一个回家的孩子',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '你哼着歌往前走，探照灯从你背后移开了。', effects: { attr: { ingenuity: 2 } } },
        fail: { text: '机器人拦下你，扫了三分钟，记录在案。', effects: { attr: { mood: -2 }, tags: ['被标记住户'] } },
      },
    ],
  },

  {
    id: 'cb_teen_011',
    stage: 'teen',
    title: '第一件义体',
    text: '老范从抽屉里拿出一副旧的指尖触觉增强器，是给义体工人用的，能让你在拆零件时不出错。\n「装上它，你以后拆东西不会再划破手。但接上去，就回不来了。」',
    require: { age: [12, 15] },
    choices: [
      {
        label: '装上',
        check: { attr: 'vitality', dc: DC.normal },
        success: { text: '你的手指第一次摸到了电流的形状。', effects: { attr: { vitality: 2, perception: 2, health: -1 }, tags: ['义体化', '指尖触觉增强器'] } },
        fail: { text: '接口不合，你疼了两个星期，手指一直抖。', effects: { attr: { health: -2, perception: 1 }, tags: ['义体化', '指尖触觉增强器'] } },
      },
      {
        label: '不装，手还是自己的好',
        check: { attr: 'will', dc: DC.normal },
        success: { effects: { attr: { will: 3 }, tags: ['双手完好'] } },
        fail: { text: '你拒绝了，却在当晚梦见那只手变成了别人的。', effects: { attr: { will: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_teen_012',
    stage: 'teen',
    title: '巷战',
    text: '另一条巷子的孩子来抢船坞的地盘，两边约在退潮的滩涂上。\n他们六个人，你们四个。你认识你们这边每一个人，包括那个还在发抖的。',
    require: { age: [12, 15], chance: 0.5 },
    choices: [
      {
        label: '冲在最前面',
        check: { attr: 'vitality', dc: DC.hard },
        success: { text: '你把对方领头的按在了碎贝壳上，剩下的人退了。', effects: { attr: { vitality: 3 }, tags: ['街头名声'] } },
        fail: { text: '你的肋骨裂了一根，躺了半个月。', effects: { attr: { health: -3, will: 1 } } },
      },
      {
        label: '护住那个发抖的，站到后面去',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '你们输了那场架，但他后来跟了你很多年。', effects: { attr: { empathy: 3, mood: 1 }, tags: ['有人跟着你'] } },
        fail: { text: '他丢下你跑了。你在滩涂上躺到退潮。', effects: { attr: { empathy: 1, mood: -2, health: -1 } } },
      },
    ],
  },

  {
    id: 'cb_teen_013',
    stage: 'teen',
    title: '教室后面',
    text: '有个女生的义体耳是二手的，收音功能坏不了，永远在漏音。全班都拿这个笑她。\n她在你桌上放了一张纸条，只有一行字：别把这件事告诉别人。',
    require: { age: [13, 15] },
    choices: [
      {
        label: '回一张纸条：我什么都没听见',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '你们开始用纸条说话，说了两年。', effects: { attr: { empathy: 3, mood: 2 }, tags: ['纸条上的话'] } },
        fail: { text: '纸条掉在了地上，被前排的人捡走了。', effects: { attr: { empathy: 1, mood: -2 }, psyche: { suppression: 2, trust: -1 } } },
      },
      {
        label: '当众把嘲笑的人顶回去',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你说了一次，从此没人再笑。', effects: { attr: { will: 3 }, tags: ['街头名声'] } },
        fail: { text: '你被堵在楼梯间打了一顿，她转学走了。', effects: { attr: { health: -2, mood: -3 }, psyche: { suppression: 3 } } },
      },
    ],
  },

  {
    id: 'cb_teen_014',
    stage: 'teen',
    title: '被诬陷',
    text: '学堂的义体实验室丢了三副军用级神经接口，价值够买下整条巷子。\n保安在你床下搜出了一个空盒子，盒子上的编号是你的。',
    require: { age: [13, 15], chance: 0.55 },
    choices: [
      {
        label: '咬死说不是自己偷的',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '查了九天，真凶是小满的堂哥。你被放出来时瘦了六斤。', effects: { attr: { will: 3, health: -2 }, tags: ['被冤枉过'] } },
        fail: { text: '没人信你。你在少年班的名单上被划掉了。', effects: { attr: { mood: -3 }, psyche: { suppression: 3, trust: -1 }, tags: ['前科记录'] } },
      },
      {
        label: '承认了，换一笔了结的钱',
        check: { attr: 'ingenuity', dc: DC.extreme },
        success: { text: '你认了罪，也拿到了封口费。你比他们更懂规则。', effects: { attr: { ingenuity: 3, wealth: 2, mood: -1 }, money: 600, tags: ['前科记录', '知道怎么谈条件'] } },
        fail: { text: '你认了罪，工钱一分没拿到，档案上多了两行字。', effects: { attr: { mood: -3 }, tags: ['前科记录'] } },
      },
    ],
  },

  {
    id: 'cb_teen_015',
    stage: 'teen',
    title: '先生的选择',
    text: '先生发现全班有十一个人买了答案卡。他没有上报，只在黑板上写了一句话：\n「在这座城里，你们只有一次把人当人的机会。」然后他问，谁愿意站出来。',
    require: { age: [13, 15] },
    choices: [
      {
        label: '站起来',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '十一个人里，站起来了四个，你是其中之一。先生把名单烧了。', effects: { attr: { will: 4 }, tags: ['站过起来'] } },
        fail: { text: '你站起来了，可另外三个没有。你被单独叫去了办公室。', effects: { attr: { will: 2, mood: -2 } } },
      },
      {
        label: '坐着不动',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '你坐在那里，心里把每个站着的人的鞋都记住了。', effects: { attr: { ingenuity: 2, perception: 1 }, tags: ['学会了藏'] } },
        fail: { text: '先生的目光在你身上停了很久才移开。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_teen_016',
    stage: 'teen',
    title: '火并',
    text: '锈牙和一支外来帮派在旧码头对上，二十几把枪，四台改装过的搬运义体。\n你只是来送货的，推着一辆装了三百个神经节的手推车。',
    require: { age: [13, 15], chance: 0.5 },
    choices: [
      {
        label: '丢下车，贴着墙往外爬',
        check: { attr: 'vitality', dc: DC.normal },
        success: { effects: { attr: { vitality: 2, perception: 1 } } },
        fail: { text: '流弹擦过你的肩膀，你在排水沟里躺了两个小时。', effects: { attr: { health: -2, mood: -1 } } },
      },
      {
        label: '推着车从中间冲过去，把货保住',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '你把车推到了出口。阿鸾当着所有人说：这孩子可以。', effects: { attr: { will: 3, vitality: 1 }, money: 300, tags: ['锈牙帮', '街头名声'] } },
        fail: { text: '车翻了，你摔在两百个神经节里。有人把你拖了出来。', effects: { attr: { health: -3, mood: -2 }, tags: ['欠阿鸾一次'] } },
      },
    ],
  },

  {
    id: 'cb_teen_017',
    stage: 'teen',
    title: '沉船里的服务器',
    text: '退潮的第五个小时，你在搁浅货轮的底层发现一间还通电的舱室。\n里面是一排服务器，指示灯像一群不肯睡的眼睛。屏幕上跳着一行字：潮汐网 · 节点 0。',
    require: { age: [13, 15], chance: 0.35 },
    choices: [
      {
        label: '把接口插上去',
        check: { attr: 'reverie', dc: DC.hard },
        success: { text: '你看见雾港的骨架——整座城的雨水税、义体贷款、记忆交易都在这里结算。', effects: { attr: { reverie: 3, perception: 2 }, tags: ['见过节点 0'] } },
        fail: { text: '防火墙咬了你一口，你三天听不见右耳的声音。', effects: { attr: { health: -3 }, psyche: { suppression: 1 }, gainTraits: ['func_deaf_one_ear'], tags: ['神经污染'] } },
      },
      {
        label: '记下位置，先回去找个人一起来',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '你把坐标刻在了腿上的义体里——没人能偷走那里。', effects: { attr: { ingenuity: 3 }, tags: ['藏着坐标'] } },
        fail: { text: '你画在纸上的坐标被雨水泡烂了。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_teen_018',
    stage: 'teen',
    title: '卖记忆',
    text: '记忆行的人说，孩子时期的记忆最干净，一段能卖两千信用点。\n「你想想，你母亲的脸，值两千。反正你以后也会忘的。」',
    require: { age: [13, 15], chance: 0.5 },
    choices: [
      {
        label: '卖掉一段无关紧要的',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '你卖掉了学堂的第一堂课。醒来时你不记得自己坐在哪一排。', effects: { attr: { ingenuity: 2, wealth: 2, mood: -2 }, money: 2000, tags: ['记忆交易'] } },
        fail: { text: '他们抽走的不止那一段。你再也想不起母亲哼的那个调子。', effects: { attr: { mood: -4, reverie: -1 }, psyche: { suppression: 3 }, gainTraits: ['cyber_memory_edit'], money: 2000, tags: ['记忆交易', '忘了那个调子'] } },
      },
      {
        label: '把报价单撕了',
        check: { attr: 'will', dc: DC.hard },
        success: { effects: { attr: { will: 3, mood: 1 }, tags: ['不肯卖记忆'] } },
        fail: { text: '你撕了单子，却在三天后自己找了回去。', effects: { attr: { mood: -2 }, money: 800, tags: ['记忆交易'] } },
      },
    ],
  },

  {
    id: 'cb_teen_019',
    stage: 'teen',
    title: '筹钱',
    text: '小满的义体接口感染了，老范说再拖三天就要截掉整条手臂，手术费一千二。\n你手上只有四百。锈带的孩子筹钱只有三种办法，每一种都要付出点东西。',
    require: { age: [13, 15], tags: ['和小满的票钱'] },
    choices: [
      {
        label: '去打地下拳赛',
        check: { attr: 'vitality', dc: DC.hard },
        success: { text: '你赢了两场，第三场被打断了两根牙。钱凑够了。', effects: { attr: { vitality: 2, health: -2 }, money: 900, tags: ['打过黑拳'] } },
        fail: { text: '你被抬出来的。小满自己把接口拆了，用不着了。', effects: { attr: { health: -3, mood: -3 } } },
      },
      {
        label: '去求阿鸾',
        check: { attr: 'empathy', dc: DC.extreme },
        success: { text: '阿鸾扔给你一叠钱，说：记住，锈带没有免费的东西。', effects: { attr: { empathy: 2 }, money: 900, tags: ['欠阿鸾一次'] } },
        fail: { text: '她让你先去替锈牙办一件事。那件事你到现在都不敢细想。', effects: { attr: { mood: -3, will: 1 }, money: 900, tags: ['欠阿鸾一次', '手上不干净'] } },
      },
    ],
  },

  {
    id: 'cb_teen_020',
    stage: 'teen',
    title: '涟漪',
    text: '潮汐网的旧数据坟场里，有人给你留了一行字：\n「你查过 C-7734 的档案，对吧。我也是。她在哪？」\n署名是一个水波纹的符号。',
    require: { age: [13, 15], tags: ['查过母亲的档案'] },
    choices: [
      {
        label: '回信，约在锈带见面',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '来的是一个比你大了四岁的女孩，她自称涟漪。她手里有一份完整名单。', effects: { attr: { ingenuity: 2, perception: 1 }, tags: ['认识涟漪', '潮汐网常客'] } },
        fail: { text: '来的是两个穿灰制服的人。你从后门翻窗跑掉了。', effects: { attr: { mood: -2 }, tags: ['被跟踪'] } },
      },
      {
        label: '不回，把接入环埋了',
        check: { attr: 'will', dc: DC.normal },
        success: { effects: { attr: { will: 2 }, tags: ['埋掉了接入环'] } },
        fail: { text: '你埋了它，第二天又挖出来戴上。', effects: { attr: { will: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_teen_021',
    stage: 'teen',
    title: '第一次',
    text: '事情发生在船坞，一个比你大的男孩先动的手。等你反应过来，他已经不动了。\n你手上沾着血，雨很快就把它冲掉了，冲得干干净净。',
    require: { age: [14, 15], chance: 0.45 },
    choices: [
      {
        label: '蹲下来看看他是不是还活着',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '他还在喘气。你替他叫了老范，然后走了。你保住了某样东西。', effects: { attr: { empathy: 3, will: 1 }, tags: ['第一次见血'] } },
        fail: { text: '你不敢碰他，跑了。三天后你听说他活了，可你整夜整夜地听见雨声。', effects: { attr: { mood: -3 }, psyche: { suppression: 3 }, tags: ['第一次见血', '雨夜里睡不着'] } },
      },
      {
        label: '继续，确保他站不起来',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '你成了这条街上没人愿意招惹的人。', effects: { attr: { will: 3 }, psyche: { suppression: 2, resilience: 1 }, tags: ['第一次见血', '街头名声', '手上不干净'] } },
        fail: { text: '你收手了。那一刻你知道了自己的底线在哪。', effects: { attr: { will: 1, mood: -2 }, tags: ['第一次见血'] } },
      },
    ],
  },

  {
    id: 'cb_teen_022',
    stage: 'teen',
    title: '小满走了',
    text: '企业来锈带「招募」少年工，签三年合同，预付八千。小满签了。\n他走那天把那半盒零件留给你，说：等我回来，我们一起上云台。',
    require: { age: [14, 15], tags: ['和小满的票钱'] },
    choices: [
      {
        label: '追到车站，把他拉下来',
        check: { attr: 'vitality', dc: DC.extreme },
        success: { text: '你把他拽下车，他打了你一拳，然后抱住你哭了。他没去。', effects: { attr: { vitality: 2, empathy: 2 } } },
        fail: { text: '车开了。你在站台上站到灯灭。', effects: { attr: { mood: -4, will: 1 }, psyche: { suppression: 3, trust: -1 }, tags: ['小满上了车'] } },
      },
      {
        label: '收下那半盒零件，什么也没说',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你把盒子收好，第二天去做了一件一直不敢做的事：查那批少年的去向。', effects: { attr: { will: 2, perception: 2 }, tags: ['小满上了车', '在查那批少年'] } },
        fail: { text: '你把盒子砸在了墙上。零件滚了一地，你又一个个捡回来。', effects: { attr: { mood: -3 } } },
      },
    ],
  },

  {
    id: 'cb_teen_023',
    stage: 'teen',
    title: '校园宣讲',
    text: '寰宇生物来学堂宣讲，说「人体升级是每个孩子的权利」，前五十名报名者免首期。\n台下所有孩子都举手了。先生站在门口，看着你们，没说话。',
    require: { age: [13, 15] },
    choices: [
      {
        label: '也举手，把名额拿到手',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '你拿到了免首期名额，也拿到了那份合同的第九页——利息写在小字里。', effects: { attr: { ingenuity: 3 }, tags: ['义体贷款'] } },
        fail: { text: '你签了字，额度只有别人的一半，利息高出一倍。', effects: { attr: { wealth: -2 }, tags: ['义体贷款'] } },
      },
      {
        label: '不举手，等散场后去问先生',
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '他告诉你：真正的好东西，从来不用来学校发。', effects: { attr: { perception: 3 }, tags: ['先生的学生'] } },
        fail: { text: '他只是摇头，让你快回家。', effects: { attr: { perception: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_teen_024',
    stage: 'teen',
    title: '最后通牒',
    text: '慧眼数据在巷口贴了一张新的公告：本区住户须在三十日内补缴全部雨水税，否则迁移至城南安置区。\n所谓安置区，所有人都知道那是一块填海的空地。',
    require: { age: [13, 15] },
    choices: [
      {
        label: '去查「城南安置区」到底是什么',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '你找到了三年前的卫星图：那里没有房子，只有一条正在修的跑道。', effects: { attr: { perception: 3 }, tags: ['知道安置区是什么'] } },
        fail: { text: '除了一段官方的宣传片，你什么也查不到。', effects: { attr: { perception: 1, mood: -2 } } },
      },
      {
        label: '开始攒钱，先活过这个月',
        check: { attr: 'vitality', dc: DC.normal },
        success: { effects: { attr: { vitality: 2, will: 1 }, money: 300 } },
        fail: { text: '你干了二十天，工钱被人卷走了。', effects: { attr: { mood: -2, wealth: -1 } } },
      },
    ],
  },

  {
    id: 'cb_teen_025',
    stage: 'teen',
    title: '排异',
    text: '你身上的那件便宜义体开始发烫。夜里你听见它在骨头里嗡嗡响，像一台不肯停的小机器。\n老范说这是排异，唯一办法是换一件好的，而那件好的够你吃一年。',
    require: { age: [13, 15], tags: ['义体化'] },
    choices: [
      {
        label: '硬扛，多打一针抑制剂',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '炎症压下去了，但你知道它只是被压住了。', effects: { attr: { will: 3, health: -1 }, tags: ['神经污染'] } },
        fail: { text: '你烧了三天，醒来时左手的三根手指不太听使唤了。', effects: { attr: { health: -3, vitality: -1 }, tags: ['神经污染', '手指不太听话'] } },
      },
      {
        label: '把它拆掉，从此不用义体',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '你自己拆的，拆得很干净。你的身体重新属于你。', effects: { attr: { will: 4 }, dropTags: ['义体化'], tags: ['双手完好'] } },
        fail: { text: '拆到一半你后悔了，又装了回去。它从此再没舒服过。', effects: { attr: { health: -2, mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_teen_026',
    stage: 'teen',
    title: '上去看一眼',
    text: '运货的轨道电梯每晚会空着上行一次。检修口的位置小满查了半年，画在一张烟盒纸上。\n只要七分钟，你就能站在云台区的地面上。',
    require: { age: [14, 15], chance: 0.6 },
    choices: [
      {
        label: '爬进去',
        check: { attr: 'vitality', dc: DC.hard },
        success: { text: '你上去了。云台的地面是干的，雨在离你头顶两百米的地方就被挡住了。', effects: { attr: { vitality: 3, reverie: 2 }, tags: ['上去过'] } },
        fail: { text: '你在第七十米被检修员发现，被扔了下来，摔断了一根锁骨。', effects: { attr: { health: -3 }, tags: ['锁骨旧伤'] } },
      },
      {
        label: '把烟盒纸收好，等更合适的时候',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { effects: { attr: { ingenuity: 2, will: 1 }, tags: ['留着那张烟盒纸'] } },
        fail: { text: '你把纸搓烂了，那晚你在检修口下面站到天亮。', effects: { attr: { mood: -2, reverie: 1 } } },
      },
      {
        label: '不走检修口，去找运货电梯的检修板',
        require: { caps: ['wheelchair'] },
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '你在第七十米处找到那块板。上去的时候，轮子是干的。', effects: { attr: { perception: 2, will: 1 }, tags: ['上去过'] } },
        fail: { text: '检修板是焊死的。你在井道口听着运货梯上去了两次。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_teen_027',
    stage: 'teen',
    title: '名号',
    text: '巷子里开始有人给你起名字。有的叫你「拆手的」，有的叫你「不要命的」。\n名字传得越远，愿意找你办事的人越多，愿意捅你一刀的人也越多。',
    require: { age: [14, 15], tags: ['街头名声'] },
    choices: [
      {
        label: '接受那个名号，把它做实',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '你开始按名号的规矩做事，规矩比人好活。', effects: { attr: { will: 2 }, money: 400, tags: ['名号坐实'] } },
        fail: { text: '有人为了这个名号来挑战你，你输了，名号被拿走。', effects: { attr: { mood: -3, health: -1 } } },
      },
      {
        label: '做一件事，把名号换掉',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '你替一个老人追回了被抢的义腿。从此他们叫你「还东西的」。', effects: { attr: { empathy: 3, mood: 2 }, tags: ['名号坐实'] } },
        fail: { text: '你想做件好事，结果两边都不认你了。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_teen_028',
    stage: 'teen',
    title: '十五岁的岔路',
    text: '十五岁生日那天，你在船坞的沙地上划了四条路：\n跟锈牙干、跟涟漪学技术、跟老范学医、或者离开雾港。\n潮水上来的时候，四条路都会消失，你必须现在选。',
    require: { age: [15, 15] },
    choices: [
      {
        label: '写下：跟锈牙干',
        check: { attr: 'vitality', dc: DC.normal },
        success: { effects: { attr: { vitality: 2, will: 1 }, tags: ['定向·街头'] } },
        fail: { effects: { attr: { vitality: 1, mood: -1 }, tags: ['定向·街头'] } },
      },
      {
        label: '写下：学技术，去潮汐网深处',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { effects: { attr: { ingenuity: 2, perception: 1 }, tags: ['定向·技术'] } },
        fail: { effects: { attr: { ingenuity: 1, mood: -1 }, tags: ['定向·技术'] } },
      },
      {
        label: '写下：跟老范学医',
        check: { attr: 'empathy', dc: DC.normal },
        success: { effects: { attr: { empathy: 2, perception: 1 }, tags: ['定向·行医'] } },
        fail: { effects: { attr: { empathy: 1, mood: -1 }, tags: ['定向·行医'] } },
      },
      {
        label: '写下：离开雾港',
        check: { attr: 'reverie', dc: DC.hard },
        success: { effects: { attr: { reverie: 2, will: 2 }, tags: ['定向·远方'] } },
        fail: { effects: { attr: { vitality: 1, mood: -1 }, tags: ['定向·远方'] } },
      },
    ],
  },

  {
    id: 'cb_teen_029',
    stage: 'teen',
    title: '口型',
    text: '学堂没有手语课。先生站在讲台上说话，你只能看他的嘴。\n他讲得快的时候，一句话你要在心里拼三次。',
    require: { caps: ['deaf'], age: [9, 13] },
    choices: [
      {
        label: '盯住先生的嘴，把整节课的口型抄下来',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '你抄了两年，连他咳嗽时的口型都读得出来。', effects: { attr: { perception: 2, will: 1 }, tags: ['读唇'] } },
        fail: { text: '你抄到第三段就跟丢了。那天晚上你把课本翻了三遍。', effects: { attr: { perception: 1, mood: -1 } } },
      },
      {
        label: '换到前排，让先生在你桌上敲指节',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '一节指节一个词。你和先生有了一套别人看不懂的暗号。', effects: { attr: { ingenuity: 2, empathy: 1 }, tags: ['读唇', '桌上暗号'] } },
        fail: { text: '先生以为你走神，把你调回了最后一排。', effects: { attr: { mood: -1, ingenuity: 1 } } },
      },
    ],
  },

  {
    id: 'cb_teen_030',
    stage: 'teen',
    title: '钩竿',
    text: '退潮的滩涂上没人跟你抢——因为你下不去。\n你在岸上绑了一根六米长的钩竿，专捞搁浅货轮边缝里的零件。',
    require: { caps: ['wheelchair'], age: [12, 15] },
    choices: [
      {
        label: '把钩竿再加长一节，探进更远的缝',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '你捞上来一整条神经链，卖了六百。', effects: { attr: { ingenuity: 2 }, money: 600, tags: ['钩竿'] } },
        fail: { text: '竿子太长，你连人带椅翻进了泥里。', effects: { attr: { health: -2, mood: -1 }, tags: ['钩竿'] } },
      },
      {
        label: '把出过东西的位置记在本子上',
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '你标出七处缝。别人照着捡，只捡到泥。', effects: { attr: { perception: 2 }, money: 200, tags: ['钩竿'] } },
        fail: { text: '第二天潮水高了一掌，你标的七处全被淹了。', effects: { attr: { mood: -1 } } },
      },
    ],
  },
];
