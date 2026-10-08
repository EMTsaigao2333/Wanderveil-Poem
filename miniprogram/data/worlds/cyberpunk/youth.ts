/**
 * 世界：赛博朋克 · 雾港 —— 青年（16-25）
 */

import type { LifeEvent } from '../../../engine/schema';
import { DC } from '../../../engine/schema';

export const events: LifeEvent[] = [
  {
    id: 'cb_youth_001',
    stage: 'youth',
    title: '第一份工',
    text: '十六岁，你拿到了第一份正式工：桁架区第九层的义体零件分拣线，十二小时一班，工牌上印着你的名字和「临时」。\n工头说：干满三年，就能转正。',
    require: { age: [16, 18] },
    choices: [
      {
        label: '老老实实干满三年',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '第三年，你成了那条线上唯一一个没被换掉的人。', effects: { attr: { will: 2, vitality: 1 }, money: 1200, tags: ['线长'] } },
        fail: { text: '第二年你就被机器替掉了。工牌回收，欠你两个月工钱。', effects: { attr: { mood: -2, will: 1 }, money: 200 } },
      },
      {
        label: '一边干一边偷学线长的维修手艺',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '你学会了调校分拣机，成了整条线唯一会修它的人。', effects: { attr: { ingenuity: 3, perception: 1 }, money: 1800, tags: ['会修分拣机'] } },
        fail: { text: '被线长发现，他打断了你两根手指，把你赶出去。', effects: { attr: { health: -2, mood: -2 }, money: 300 } },
      },
    ],
  },

  {
    id: 'cb_youth_002',
    stage: 'youth',
    title: '催收',
    text: '催收程序每天早上七点准时响起，用合成女声念你的欠款金额，一天念三遍。\n它还附赠一段功能：只要你不还，它可以在三公里内广播你的名字和欠款数。',
    require: { age: [16, 20], tags: ['义体贷款'] },
    choices: [
      {
        label: '借钱先把这笔还清',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '你找了只收一成手续费的私人钱庄，利息反而低了。', effects: { attr: { ingenuity: 2 }, money: -600, tags: ['私人债'] } },
        fail: { text: '你借了高利贷，从此欠的是两笔。', effects: { attr: { wealth: -2, mood: -2 }, tags: ['高利贷'] } },
      },
      {
        label: '去把催收程序黑了',
        check: { attr: 'ingenuity', dc: DC.extreme },
        success: { text: '你把它的广播权限改成了播放你喜欢的歌。整栋楼听了三天。', effects: { attr: { ingenuity: 3, mood: 2 }, dropTags: ['义体贷款'] } },
        fail: { text: '你动的是慧眼数据的资产。二十四小时后有人来敲门。', effects: { attr: { mood: -3 }, tags: ['被通缉'] } },
      },
    ],
  },

  {
    id: 'cb_youth_003',
    stage: 'youth',
    title: '契约',
    text: '寰宇生物开出的合同有三十二页，第九页写着：公司可无偿使用乙方在合同期内产生的全部身体数据与记忆样本。\n签字费是四万信用点。够你在桁架区住十年。',
    require: { age: [17, 22] },
    choices: [
      {
        label: '把合同从头读到尾，改掉第九页',
        check: { attr: 'perception', dc: DC.extreme },
        success: { text: '法务看了你改的那一行，沉默了一会，换了另一份合同给你。', effects: { attr: { perception: 3, will: 2 }, money: 40000, tags: ['会看合同'] } },
        fail: { text: '你改了，但没看懂第七条。他们照原版执行。', effects: { attr: { perception: 1, mood: -2 }, money: 40000, tags: ['身体数据被收录'] } },
      },
      {
        label: '直接签，钱拿到手再说',
        check: { attr: 'will', dc: DC.normal },
        success: { effects: { attr: { will: 1, wealth: 2 }, money: 40000, tags: ['身体数据被收录'] } },
        fail: { text: '半年后你在别人的记忆店里，看见了自己的一段。', effects: { attr: { mood: -3 }, money: 40000, tags: ['身体数据被收录'] } },
      },
    ],
  },

  {
    id: 'cb_youth_004',
    stage: 'youth',
    title: '入伙',
    text: '阿鸾现在管着锈牙的三条街。她把一把脉冲刀推到你面前。\n「你要么拿它，要么就永远只配送快递。」',
    require: { age: [16, 22], tags: ['街头名声'] },
    choices: [
      {
        label: '拿起那把刀',
        check: { attr: 'vitality', dc: DC.normal },
        success: { text: '她教你用刀的第一件事是：不要挡，要进。', effects: { attr: { vitality: 3, will: 1 }, money: 800, tags: ['锈牙帮', '会用刀'] } },
        fail: { text: '刀比你想的重。你第一晚就割伤了自己。', effects: { attr: { health: -2, vitality: 1 }, tags: ['锈牙帮'] } },
      },
      {
        label: '推开刀，拿出另一件东西给她看',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '你给她看的是慧眼数据的征收路线图。她说：这比刀值钱。', effects: { attr: { ingenuity: 3 }, money: 1500, tags: ['锈牙帮', '给锈牙做事'] } },
        fail: { text: '她看都没看，把刀收回去了。', effects: { attr: { mood: -2 }, tags: ['拒绝过锈牙'] } },
      },
    ],
  },

  {
    id: 'cb_youth_005',
    stage: 'youth',
    title: '雨里的舞',
    text: '夜店「回声」在桁架区的地下，门票三十信用点，音乐是从云台上掉下来的。\n有个女孩请你跳舞，她的义体手很凉，和你母亲的一样。',
    require: { age: [17, 23] },
    choices: [
      {
        label: '跟她跳',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '她叫余柚。跳完之后你们在雨棚下聊到天亮。', effects: { attr: { empathy: 2, mood: 3 }, tags: ['余柚'] } },
        fail: { text: '你的脚步太僵。她笑了一下，转身进了人群。', effects: { attr: { mood: -1, empathy: 1 } } },
      },
      {
        label: '注意到她手背上的编号',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '编号是 C-7734 开头的。和母亲的，是同一批。', effects: { attr: { perception: 3 }, tags: ['余柚', '同一批编号'] } },
        fail: { effects: { attr: { perception: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_youth_006',
    stage: 'youth',
    title: '涟漪的活',
    text: '涟漪找你干一票：潜入沧溟重工在雾港的库存节点，取出一份报废清单。\n「名单上有三千四百件义体，编号都是活的。你猜它们的原主人在哪。」',
    require: { age: [17, 24], tags: ['认识涟漪'] },
    choices: [
      {
        label: '接下这票',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '你拿到了清单，也第一次看见了「回收来源」那一列写着什么。', effects: { attr: { ingenuity: 3, perception: 2 }, money: 2000, tags: ['知道疗养院', '潮汐网常客'] } },
        fail: { text: '你触了警报，涟漪替你引开了追踪，代价是她三根手指。', effects: { attr: { mood: -2, ingenuity: 1 }, tags: ['欠涟漪'] } },
      },
      {
        label: '先问清楚她要这份清单做什么',
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '她说要公布给全城。你决定帮她。', effects: { attr: { perception: 2, will: 1 }, tags: ['涟漪的同伴'] } },
        fail: { text: '她没回答，从此再没联系过你。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_youth_007',
    stage: 'youth',
    title: '同居',
    text: '你和余柚在桁架区租了一间十二平米的房间，窗户正对着一台永不停的排气扇。\n她把她母亲的义体手放在床头，说：这是她唯一留下的东西。',
    require: { age: [19, 25], tags: ['余柚'] },
    choices: [
      {
        label: '把自己的接入环也放上去，并排',
        check: { attr: 'empathy', dc: DC.normal },
        success: { effects: { attr: { empathy: 2, mood: 3 }, tags: ['和余柚同居'] } },
        fail: { effects: { attr: { mood: 1 }, tags: ['和余柚同居'] } },
      },
      {
        label: '问她愿不愿意一起去查那批编号',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '她说：我等你问这句话等了两年。', effects: { attr: { will: 2, empathy: 1 }, tags: ['和余柚同居', '一起查编号'] } },
        fail: { text: '她说：别查了。我们就这样过不行吗。那晚你们谁都没睡。', effects: { attr: { mood: -2 }, tags: ['和余柚同居'] } },
      },
    ],
  },

  {
    id: 'cb_youth_008',
    stage: 'youth',
    title: '排异夜',
    text: '凌晨三点你被疼醒，那件便宜的义体在骨头里发烫。余柚给你打了一支抑制剂，手在抖。\n老范的诊所关了门——他上周被征收队带走了。',
    require: { age: [17, 24], tags: ['义体化'] },
    choices: [
      {
        label: '自己动手，拆掉它',
        check: { attr: 'vitality', dc: DC.extreme },
        success: { text: '你照着记忆里的手法拆了四十分钟。天亮了，你还活着。', effects: { attr: { vitality: 3, will: 3, health: -1 }, dropTags: ['义体化'], tags: ['自己给自己动过刀'] } },
        fail: { text: '大出血。余柚背着你跑了三公里，敲开了黑诊所的门。', effects: { attr: { health: -4 }, money: -2000, tags: ['欠黑诊所', '神经污染'] } },
      },
      {
        label: '去黑诊所，把最后一点钱拿出来',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '黑诊所的医生从报废件里挑了一件给你装上了，意外的合身。', effects: { attr: { health: 1, ingenuity: 1 }, money: -1500, tags: ['欠黑诊所'] } },
        fail: { text: '你被收了钱，装上的东西三天后就坏了。', effects: { attr: { health: -3 }, money: -1500, tags: ['欠黑诊所'] } },
      },
    ],
  },

  {
    id: 'cb_youth_009',
    stage: 'youth',
    title: '猎头',
    text: '慧眼数据的人在你下班的路上等你，递来一张卡片：数据分析师，月薪一万二，配有独立宿舍。\n「你的潮汐网记录很漂亮。我们需要能进去的人。」',
    require: { age: [18, 25], tags: ['潮汐网常客'] },
    choices: [
      {
        label: '接下卡片',
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '你进了慧眼，工牌上写着「临时顾问」。你终于可以坐在有干燥地面的楼里。', effects: { attr: { perception: 2, wealth: 2 }, money: 8000, tags: ['慧眼数据员工'] } },
        fail: { text: '入职第一天你就发现，他们的「顾问」是消耗品。', effects: { attr: { mood: -2 }, money: 4000, tags: ['慧眼数据员工'] } },
      },
      {
        label: '把卡片烧了，当着他们的面',
        check: { attr: 'will', dc: DC.hard },
        success: { effects: { attr: { will: 3 }, tags: ['拒绝过慧眼'] } },
        fail: { text: '你烧了卡片，第二天你的潮汐网账号被封了。', effects: { attr: { mood: -2 }, tags: ['账号被封'] } },
      },
    ],
  },

  {
    id: 'cb_youth_010',
    stage: 'youth',
    title: '黑拳',
    text: '地下拳赛在旧体育馆，赌注是义体零件。你打了六场，赢了六场。\n第七场的对手是个十九岁的女孩，她的右手是沧溟最新款的。',
    require: { age: [18, 25] },
    choices: [
      {
        label: '照规矩打，把她打倒',
        check: { attr: 'vitality', dc: DC.hard },
        success: { text: '你打断了她的右臂接口。她下场时对你说了句谢谢。', effects: { attr: { vitality: 3 }, money: 3000, tags: ['打过黑拳', '拳场名号'] } },
        fail: { text: '你被打断了三根肋骨，躺了一个月。', effects: { attr: { health: -4 }, money: 500 } },
      },
      {
        label: '故意输，把赌注让给她',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '她后来成了锈带最好的义体医生，只给你一个人免费。', effects: { attr: { empathy: 3 }, money: 300, tags: ['拳场的朋友'] } },
        fail: { text: '观众看出了你放水。你被赶出了拳场。', effects: { attr: { mood: -2 }, tags: ['被拳场除名'] } },
      },
      {
        label: '不上台，去场边替人修被打坏的接口',
        require: { caps: ['wheelchair'] },
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '你修得比拳场的医生稳。半年后，所有人都先来找你。', effects: { attr: { ingenuity: 2 }, money: 3000, tags: ['拳场的人'] } },
        fail: { text: '你接坏了一只手，那晚的赌注全赔了出去。', effects: { attr: { mood: -2 }, money: -1000 } },
      },
    ],
  },

  {
    id: 'cb_youth_011',
    stage: 'youth',
    title: '走货',
    text: '一趟货，从锈带到云台的检修通道，报酬五千信用点。货物是一只密封箱，不许看。\n箱子会呼吸。',
    require: { age: [18, 25], chance: 0.6 },
    choices: [
      {
        label: '照规矩送，不看',
        check: { attr: 'will', dc: DC.normal },
        success: { effects: { attr: { will: 2 }, money: 5000, tags: ['走过货'] } },
        fail: { text: '箱子在中途动了。你吓得把它摔了，赔了三个月工钱。', effects: { attr: { mood: -2 }, money: -1500, tags: ['走过货'] } },
      },
      {
        label: '打开看',
        check: { attr: 'perception', dc: DC.extreme },
        success: { text: '里面是一个还在呼吸的人，插着管，胸牌上写着「安宁疗养院 · 转运」。你把它送回去了，然后记下了这条通道。', effects: { attr: { perception: 3, will: 2 }, money: 5000, tags: ['知道转运通道', '知道疗养院'] } },
        fail: { text: '你打开了一道缝，警报立刻响了。货没了，你被扣了一天一夜。', effects: { attr: { health: -3, mood: -2 }, tags: ['被通缉'] } },
      },
    ],
  },

  {
    id: 'cb_youth_012',
    stage: 'youth',
    title: '第一件自己的义体',
    text: '你在黑市上挑了很久，最后买下一对腿部阻尼器——能让你从八米高的地方落下来不断腿。\n钱是你攒了两年的。老范说过，人要有一样东西是自己的。',
    require: { age: [18, 25], tags: ['义体化'] },
    choices: [
      {
        label: '让拳场那个女孩替你装',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '她装得极好，还顺手把你旧的接口整平了。', effects: { attr: { empathy: 1, vitality: 2, health: 1 }, money: -3000, gainTraits: ['func_prosthetic'], tags: ['腿上有阻尼器'] } },
        fail: { text: '她手抖了一下。你走路从此带一点跛。', effects: { attr: { vitality: 1, health: -1 }, money: -3000, tags: ['腿上有阻尼器', '微跛'] } },
      },
      {
        label: '自己装',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { effects: { attr: { ingenuity: 3, vitality: 1 }, money: -3000, gainTraits: ['func_prosthetic'], tags: ['腿上有阻尼器', '自己给自己动过刀'] } },
        fail: { text: '位置偏了两毫米，你此后每逢雨天腿就疼。', effects: { attr: { health: -2 }, money: -3000, tags: ['腿上有阻尼器', '雨天腿疼'] } },
      },
    ],
  },

  {
    id: 'cb_youth_013',
    stage: 'youth',
    title: '朋友之死',
    text: '拳场的那个女孩死在一间仓库里，胸口被开了一个标准的取样口——专业手法，取的是神经节。\n她身上还穿着那天你送她的旧外套。',
    require: { age: [19, 25], tags: ['拳场的朋友'] },
    choices: [
      {
        label: '去查「取样口」的手法是谁的',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '那种切口只有沧溟的医用义体用。你顺着这条线，摸到了一家叫安宁疗养院的地方。', effects: { attr: { perception: 3, will: 2 }, tags: ['知道疗养院', '要查到底'] } },
        fail: { text: '你查了三个月，只在潮汐网里挖出一堆被删空的记录。', effects: { attr: { mood: -3, perception: 1 }, psyche: { suppression: 3 } } },
      },
      {
        label: '先把她埋了，别的以后再说',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '你把她葬在退潮的滩涂上，立了一块铁牌。', effects: { attr: { empathy: 3, mood: -1 }, tags: ['埋过朋友'] } },
        fail: { text: '你没能给她一个完整的葬礼。征收队把滩涂清空了。', effects: { attr: { mood: -4 }, psyche: { suppression: 4 } } },
      },
    ],
  },

  {
    id: 'cb_youth_014',
    stage: 'youth',
    title: '罢工',
    text: '桁架区第九层的分拣线停了。三千个工人坐在厂房里，没有喊口号，只是坐着。\n厂方在门外架起了声波驱散器，但他们还没开。',
    require: { age: [19, 25] },
    choices: [
      {
        label: '坐进人群中间',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你坐到第三天。第四天，厂方同意把夜班补贴提了两成。', effects: { attr: { will: 3, empathy: 1 }, money: 800, tags: ['罢工的人'] } },
        fail: { text: '声波器开了。你在医院躺了两天，耳鸣到现在都没好。', effects: { attr: { health: -2, mood: -2 }, tags: ['罢工的人', '耳鸣加重'] } },
      },
      {
        label: '去把声波驱散器的供电断了',
        check: { attr: 'ingenuity', dc: DC.extreme },
        success: { text: '你从检修井爬进去，剪断了三根线。他们没有开成。', effects: { attr: { ingenuity: 3, will: 1 }, tags: ['罢工的人', '工厂里的熟人'] } },
        fail: { text: '你被保安抓住了，打断了两根手指。工人们把这事记在了心里。', effects: { attr: { health: -3 }, tags: ['罢工的人', '手指不太听话'] } },
      },
    ],
  },

  {
    id: 'cb_youth_015',
    stage: 'youth',
    title: '背叛',
    text: '涟漪死了。她死前把一份加密文件发给了你，只发了你一个人。\n三天后，你发现那份文件被解密过一次，解密者用的是你的账号。',
    require: { age: [19, 25], tags: ['涟漪的同伴'] },
    choices: [
      {
        label: '自己去查是谁用了你的账号',
        check: { attr: 'perception', dc: DC.extreme },
        success: { text: '轨迹指向余柚的终端。你没有立刻回去问她。', effects: { attr: { perception: 3 }, tags: ['怀疑余柚'] } },
        fail: { text: '所有的痕迹都被抹掉了，只剩你一个人被怀疑。', effects: { attr: { mood: -3 }, psyche: { suppression: 3, trust: -2 }, tags: ['被同行怀疑'] } },
      },
      {
        label: '当着所有人的面，把这件事说出来',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你没有遮掩，反而赢得了几个人的信任。', effects: { attr: { will: 3, empathy: 1 }, tags: ['涟漪的同伴'] } },
        fail: { text: '你被当成了那个出卖者。从此没人再找你干活。', effects: { attr: { mood: -4 }, psyche: { suppression: 4, trust: -2 }, tags: ['被同行怀疑'] } },
      },
    ],
  },

  {
    id: 'cb_youth_016',
    stage: 'youth',
    title: '疗养院',
    text: '安宁疗养院在城郊，围墙上写着「安宁 · 尊严 · 新生」。\n里面的病人全都签过自愿捐献书。你母亲的编号，最后一次出现就是在这里。',
    require: { age: [20, 25], tags: ['知道疗养院'] },
    choices: [
      {
        label: '翻墙进去',
        check: { attr: 'vitality', dc: DC.hard },
        success: { text: '你在三号楼的档案室里找到了 C-7734 的卡片：状态「已转出」。去向那一栏被人用笔涂掉了。', effects: { attr: { vitality: 2, perception: 2, will: 1 }, tags: ['看过母亲的卡片'] } },
        fail: { text: '你被抓了，关了十一天。他们删掉了你两周的记忆。', effects: { attr: { health: -2, mood: -3, reverie: -1 }, psyche: { suppression: 3 }, gainTraits: ['cyber_memory_edit'], tags: ['被删过记忆'] } },
      },
      {
        label: '从数据面进去，通过潮汐网',
        check: { attr: 'ingenuity', dc: DC.extreme },
        success: { text: '你从疗养院的预约系统里扒出了转运排班表——每周三凌晨，往云台。', effects: { attr: { ingenuity: 3, perception: 2 }, tags: ['知道转运通道'] } },
        fail: { text: '系统里有一只看门的东西，它顺着你的连接回咬了一口。', effects: { attr: { health: -3 }, tags: ['神经污染'] } },
      },
    ],
  },

  {
    id: 'cb_youth_017',
    stage: 'youth',
    title: '分岔的房子',
    text: '余柚把一份云台区的租赁合同放在桌上，两室一厅，窗是完整的，雨落不到上面。\n「我用所有的钱押了首期。你只要点个头，我们就不是锈带的人了。」',
    require: { age: [21, 25], tags: ['和余柚同居'] },
    choices: [
      {
        label: '点头',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '你们搬上去了。她第一次在雨里没有打伞，因为那里不下雨。', effects: { attr: { empathy: 2, mood: 3, wealth: 2 }, psyche: { suppression: -2, trust: 1 }, money: -20000, tags: ['住在云台', '余柚'] } },
        fail: { text: '你点了头。可你们谁都不习惯没有雨声的夜晚。', effects: { attr: { mood: 1, wealth: 1 }, money: -20000, tags: ['住在云台', '余柚'] } },
      },
      {
        label: '摇头，说你要先把一件事做完',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '她说：那我等你。合同被她退掉了，押金只退回一半。', effects: { attr: { will: 3, empathy: 1 }, money: -10000, tags: ['余柚在等你'] } },
        fail: { text: '她带着合同走了。你在空屋子里坐了一夜。', effects: { attr: { mood: -4 }, psyche: { suppression: 4, trust: -1 }, tags: ['余柚走了'] } },
      },
    ],
  },

  {
    id: 'cb_youth_018',
    stage: 'youth',
    title: '转运夜',
    text: '周三凌晨两点，云台方向的货运通道会空出十九分钟。你有一辆偷来的运输车和一份排班表。\n车上现在装着六个人，全都插着管，全都签过自愿捐献书。',
    require: { age: [20, 25], tags: ['知道转运通道'] },
    choices: [
      {
        label: '把他们送去锈带的诊所',
        check: { attr: 'vitality', dc: DC.extreme },
        major: true,
        success: { text: '你送到了。第二天，全城的路边广告屏上出现了他们睁着眼睛的照片。', effects: { attr: { vitality: 2, will: 3, empathy: 2 }, psyche: { suppression: 2 }, tags: ['转运夜的人', '被通缉'] } },
        fail: { text: '车在通道口被拦下。你跳车跑了，六个人没有。', effects: { attr: { health: -2, mood: -4 }, psyche: { suppression: 4 }, tags: ['转运夜的人', '被通缉'] } },
        critSuccess: { text: '你没走检修通道，走的是排班表上没有登记的旧渠。六个人一个没少。第二天，广告屏上出现的是排班表本身。', effects: { attr: { vitality: 3, will: 3, empathy: 3, perception: 2 }, money: 50000, tags: ['转运夜的人', '街头名声', '被通缉'] } },
        critFail: { text: '拦截桩是提前升起来的。有人卖了这一趟。', effects: { death: '拦截桩把车头压成了两截。你在里面，六个人也在。' } },
      },
      {
        label: '只带走一个人——编号 C-7734 卡片上的那个',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '那不是你母亲。是一个和她同批编号的女孩，二十岁。她醒来第一句话是问你母亲的名字。', effects: { attr: { perception: 2, empathy: 3 }, tags: ['转运夜的人', '认识了那批人'] } },
        fail: { text: '你在名单上翻了太久，通道关上了。', effects: { attr: { mood: -3 } } },
      },
    ],
  },

  {
    id: 'cb_youth_019',
    stage: 'youth',
    title: '清剿',
    text: '慧眼数据在锈带展开了为期三天的清剿，理由是「数据资产保护」。\n巷口的广告屏循环播着人脸，其中一张是你的。',
    require: { age: [20, 25], tags: ['被通缉'] },
    choices: [
      {
        label: '躲进最深的那条排水管，等风头过去',
        check: { attr: 'vitality', dc: DC.normal },
        success: { text: '你在污水里待了三天，靠身上带的营养膏活着。', effects: { attr: { vitality: 2, will: 1, health: -1 }, tags: ['躲过清剿'] } },
        fail: { text: '他们用热成像扫了一遍。你被抓走，关了两周。', effects: { attr: { health: -3, mood: -3 }, money: -1000, tags: ['被抓过'] } },
      },
      {
        label: '去找阿鸾，让她把你藏进锈牙的地盘',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '她把你藏在货柜里，还给了你一把刀。', effects: { attr: { empathy: 1, vitality: 1 }, tags: ['欠阿鸾一次', '躲过清剿'] } },
        fail: { text: '阿鸾现在只做对她有利的事。她要价太高，你付不起。', effects: { attr: { mood: -3 }, tags: ['被抓过'] } },
      },
    ],
  },

  {
    id: 'cb_youth_020',
    stage: 'youth',
    title: '赏金',
    text: '有人给你看了一份新的悬赏：安宁疗养院的院长，活的，八万信用点。\n发布者的署名是一个水波纹——涟漪死前用的那个符号。',
    require: { age: [21, 25], tags: ['转运夜的人'] },
    choices: [
      {
        label: '接下它',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '你花了两个月做前置准备，摸清了他的行程、义体型号、和每一条退路。', effects: { attr: { ingenuity: 3, perception: 2 }, money: 2000, tags: ['赏金猎人', '在追院长'] } },
        fail: { text: '你准备得太慢，他被别人先动手了。你去的时候只有一具尸体。', effects: { attr: { mood: -3 }, tags: ['赏金猎人'] } },
      },
      {
        label: '不接，先弄清楚「水波纹」是谁',
        check: { attr: 'perception', dc: DC.extreme },
        success: { text: '发布悬赏的终端物理地址，在涟漪死后三个月还被人登录过。', effects: { attr: { perception: 3 }, tags: ['涟漪可能没死'] } },
        fail: { text: '地址是一个早就被拆掉的公用终端。线索断了。', effects: { attr: { perception: 1, mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_youth_021',
    stage: 'youth',
    title: '刀下',
    text: '你在小巷里堵住了安宁疗养院的院长。他比你想象的瘦，义体也是便宜的型号。\n他说：孩子，那六个人的家里人，都拿到了钱。你要多少？',
    require: { age: [22, 25], tags: ['在追院长'] },
    choices: [
      {
        label: '动手',
        check: { attr: 'vitality', dc: DC.extreme },
        major: true,
        success: { text: '你解决了这件事。第二天，疗养院的三号楼被封了。', effects: { attr: { vitality: 2, will: 2 }, psyche: { suppression: 2 }, money: 80000, tags: ['手上不干净', '办成了转运的案子'] } },
        fail: { text: '他有保镖，来的是四台改装过的搬运义体。你被打成重伤，他走了。', effects: { attr: { health: -5, mood: -3 }, psyche: { suppression: 3 }, tags: ['在追院长'] } },
        critSuccess: { text: '你没有用刀。你把院长连人带终端一起交给了那六个人的家属，八万是他自己转的账。', effects: { attr: { vitality: 2, will: 3, perception: 3 }, money: 200000, tags: ['手上不干净', '办成了转运的案子', '知道真相的全部'] } },
        critFail: { text: '四台搬运义体把你按在墙上，先拆的是你的腿。', effects: { attr: { health: -6, mood: -3 }, psyche: { suppression: 4, selfWorth: -2 }, gainTraits: ['func_limb_leg_acquired'], tags: ['在追院长'] } },
      },
      {
        label: '收刀，逼他把名单交出来',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '他交出了一份三千四百个编号的名单。你把它发给了全城的路边广告屏。', effects: { attr: { will: 3, empathy: 2, perception: 2 }, tags: ['公布过名单', '被通缉'] } },
        fail: { text: '他给了你一份假名单，然后从你手里溜走了。', effects: { attr: { mood: -4 }, tags: ['在追院长'] } },
      },
    ],
  },

  {
    id: 'cb_youth_022',
    stage: 'youth',
    title: '锈带的雨夜',
    text: '你把那份三千四百人的名单投上了广告屏。整条锈带的雨里都亮着编号。\n有人跪下来哭，有人拿出手机拍，也有人开始砸玻璃。',
    require: { age: [22, 25], tags: ['公布过名单'] },
    choices: [
      {
        label: '站在雨里看完全程',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你站在人群最后面。有人回头看了你一眼，什么也没说。', effects: { attr: { will: 3, mood: 2 }, tags: ['锈带记得你'] } },
        fail: { text: '你看着看着吐了。你才发现名单上第二行是你母亲的名字。', effects: { attr: { mood: -4 }, tags: ['锈带记得你', '名单第二行'] } },
      },
      {
        label: '趁乱去追院长',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '你没追到人，但拿到了他办公室的一台加密终端。', effects: { attr: { perception: 2 }, tags: ['拿到院长终端'] } },
        fail: { text: '人群堵住了路。你什么也没拿到。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_youth_023',
    stage: 'youth',
    title: '离开',
    text: '雾港的边界是一个收费站，票价四千信用点，外加一份「不再返回」的承诺书。\n站外是灰绿色的荒原，据说夏天会开花。',
    require: { age: [22, 25], chance: 0.6 },
    choices: [
      {
        label: '买票，走',
        check: { attr: 'reverie', dc: DC.hard },
        success: { text: '你出去了。荒原上第一件事是抬头——原来天是可以没有霓虹的。', effects: { attr: { reverie: 3, health: 2, mood: 3 }, money: -4000, tags: ['离开过雾港'] } },
        fail: { text: '你在站外待了十七天，带的钱花光，最后还是走回了雨里。', effects: { attr: { mood: -3, health: -1 }, tags: ['离开过雾港'] } },
      },
      {
        label: '留下，这座城市还没算完账',
        check: { attr: 'will', dc: DC.normal },
        success: { effects: { attr: { will: 3 }, tags: ['留在雾港'] } },
        fail: { effects: { attr: { will: 1, mood: -1 }, tags: ['留在雾港'] } },
      },
    ],
  },

  {
    id: 'cb_youth_024',
    stage: 'youth',
    title: '余柚的选择',
    text: '余柚接过了慧眼数据的工牌。她说：我只是想让我们能睡在不下雨的地方。\n她把工牌别在胸前的时候，那只凉手一直在抖。',
    require: { age: [22, 25], tags: ['余柚'] },
    choices: [
      {
        label: '陪她去',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '你们一起进了慧眼。你在里面待了很久，久到你开始分不清谁是卧底。', effects: { attr: { empathy: 2, perception: 2, wealth: 2 }, money: 6000, tags: ['慧眼数据员工', '余柚'] } },
        fail: { text: '你没能通过他们的背景审查。她被单独带走了。', effects: { attr: { mood: -3 } } },
      },
      {
        label: '劝她别去',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '她最后没去。她说：那你要答应我一件事——别死在我前面。', effects: { attr: { will: 3, empathy: 2 }, tags: ['余柚的约定'] } },
        fail: { text: '她去了。三个月后，她的名字出现在一份「离职」名单上。', effects: { attr: { mood: -5, will: 1 }, psyche: { suppression: 5, trust: -2 }, tags: ['余柚失踪'] } },
      },
    ],
  },

  {
    id: 'cb_youth_025',
    stage: 'youth',
    title: '重建',
    text: '锈带在清剿后重新长出来，像雨里的苔。阿鸾死了，锈牙散了，新的帮派叫「回声」。\n他们来找你，说要你当个名头。',
    require: { age: [23, 25], tags: ['锈带记得你'] },
    choices: [
      {
        label: '接下这个名头',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你成了锈带说话算数的人。你做的第一件事是把雨水税征收点砸了。', effects: { attr: { will: 2, empathy: 1 }, money: 3000, tags: ['回声的头'] } },
        fail: { text: '你接下了名头，镇不住人。半年后他们换了别人。', effects: { attr: { mood: -2 }, money: 800 } },
      },
      {
        label: '推荐另一个人，自己站到后面',
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '你选的那个人后来撑了十年。你只在他需要的时候出现。', effects: { attr: { perception: 3, empathy: 1 }, tags: ['幕后的人'] } },
        fail: { text: '你选错了人，他把你卖了。', effects: { attr: { mood: -3 }, tags: ['被通缉'] } },
      },
    ],
  },

  {
    id: 'cb_youth_026',
    stage: 'youth',
    title: '二十五岁',
    text: '二十五岁生日那天，你在桁架区的屋顶上坐了一夜。\n下面是你长大的巷子，上面是云台区，中间是一层永远下不完的雨。',
    require: { age: [25, 25] },
    effects: { attr: { mood: 2, perception: 1 }, tags: ['二十五岁的屋顶'] },
  },

  {
    id: 'cb_youth_027',
    stage: 'youth',
    title: '一份名单的另一半',
    text: '运货的时候，你在沧溟的仓库里看见了那三千四百件义体。它们被整整齐齐地码在货架上，每一件都贴着编号。\n其中一件上面，贴着 C-7734。',
    require: { age: [22, 25], tags: ['名单第二行'] },
    choices: [
      {
        label: '把那一件带走',
        check: { attr: 'vitality', dc: DC.hard },
        success: { text: '你把它抱回了家。它很轻，比你想的轻得多。', effects: { attr: { vitality: 2, mood: -2, empathy: 2 }, tags: ['带走了 C-7734'] } },
        fail: { text: '警报响了。你丢下它跑掉，之后的很多年都在想它。', effects: { attr: { mood: -3 }, tags: ['丢下了 C-7734'] } },
      },
      {
        label: '记下货架号，转身走',
        check: { attr: 'will', dc: DC.hard },
        success: { effects: { attr: { will: 3, perception: 1 }, tags: ['知道货架号'] } },
        fail: { text: '你在货架前站了很久，直到巡逻灯扫过来。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_youth_028',
    stage: 'youth',
    title: '第一次当师父',
    text: '有个十四岁的孩子在巷子里跟着你走了三天。他手上也有一件便宜的二手义体，接口在流脓。\n他问你：怎么才能不被抓住。',
    require: { age: [23, 25] },
    choices: [
      {
        label: '带他去老范留下的诊所，先治接口',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '你替他付了钱。他叫你一声哥，从此跟着你不走。', effects: { attr: { empathy: 3, mood: 2 }, money: -800, tags: ['有个跟着你的人'] } },
        fail: { text: '诊所的门锁着。你只能自己动手，手艺还不到家。', effects: { attr: { empathy: 1, health: -1 } } },
      },
      {
        label: '教他第一课：不要相信任何人，包括你',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '他听进去了，第二天就没再出现。三年后你在云台见到他，穿得很干净。', effects: { attr: { will: 2, perception: 1 }, tags: ['教过一个孩子'] } },
        fail: { text: '他哭了。你还是带他回家了。', effects: { attr: { empathy: 2, mood: 1 }, tags: ['有个跟着你的人'] } },
      },
    ],
  },

  {
    id: 'cb_youth_029',
    stage: 'youth',
    title: '账清了',
    text: '你在慧眼数据的自助终端上，把最后一笔雨水税还清了。屏幕弹出一行字：\n「欢迎成为合规住户。您的住户标记已更新。」',
    require: { age: [23, 25], tags: ['欠雨水税'] },
    choices: [
      {
        label: '拍下这行字',
        check: { attr: 'perception', dc: DC.easy },
        success: { text: '你把照片存了下来，存在只有你知道的地方。', effects: { attr: { perception: 1, mood: 2 }, tags: ['合规住户'] } },
        fail: { effects: { attr: { mood: 1 }, tags: ['合规住户'] } },
      },
      {
        label: '去把门口那一叠征收单全撕下来',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '纸比你想的厚。撕到最后一层，是六岁时母亲垫桌脚的那一张。', effects: { attr: { will: 3, mood: -1 }, tags: ['合规住户', '留着那张旧的'] } },
        fail: { text: '你怎么撕都撕不干净。墙上留下了一片毛边。', effects: { attr: { mood: -1 }, tags: ['合规住户'] } },
      },
    ],
  },

  {
    id: 'cb_youth_030',
    stage: 'youth',
    title: '站住',
    text: '你做了一件在雾港算得上出名的事。有人开始用「他」来指代你，不提名字。\n广告屏上不再有你的脸，但每条巷子里都有人知道你。',
    require: { age: [24, 25], tags: ['锈带记得你'] },
    effects: { attr: { will: 2, perception: 1, mood: 1 }, money: 2000, tags: ['街头名声'] },
  },

  {
    id: 'cb_youth_031',
    stage: 'youth',
    title: '声音层',
    text: '潮汐网的接入环接的是视神经，你的视神经没有用。\n老范的徒弟给你改了接口：画面全转成声音，靠左右耳的响度分辨远近。',
    require: { caps: ['blind'], age: [17, 24] },
    choices: [
      {
        label: '练到能靠响度在网里走路',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '三个月后，你听得出哪面墙是假的。', effects: { attr: { perception: 2, reverie: 1 }, tags: ['潮汐网常客', '声音层'] } },
        fail: { text: '你撞进一个广告程序，耳鸣响了四天。', effects: { attr: { health: -2, mood: -1 }, tags: ['声音层'] } },
      },
      {
        label: '把二十个响度写成二十个自己的词',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '报坐标的时候你不用看，只说词。', effects: { attr: { ingenuity: 2 }, tags: ['声音层', '自己的记号'] } },
        fail: { text: '写到第八个就乱了，两个相邻的响度你分不开。', effects: { attr: { ingenuity: 1, mood: -1 } } },
      },
    ],
  },
];
