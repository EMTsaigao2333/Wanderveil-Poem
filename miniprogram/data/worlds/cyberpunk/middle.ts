/**
 * 世界：赛博朋克 · 雾港 —— 中年（41-60）
 */

import type { LifeEvent } from '../../../engine/schema';
import { DC } from '../../../engine/schema';

export const events: LifeEvent[] = [
  {
    id: 'cb_mid_001',
    stage: 'middle',
    title: '停机预警',
    text: '体检报告的第一行是一句红色的话：您体内三件义体的剩余寿命不足三十六个月。\n换新的要十二万信用点，不换的话，最先停的是左手。',
    require: { age: [41, 50], tags: ['义体化'] },
    choices: [
      {
        label: '凑钱换',
        check: { attr: 'wealth', dc: DC.hard },
        success: { text: '你换了两件，第三件实在买不起。你挑了左手的。', effects: { attr: { vitality: 2 }, money: -120000, tags: ['换过义体'] } },
        fail: { text: '你只换了一件。剩下的靠抑制剂撑着，每天两次。', effects: { attr: { health: -2 }, money: -40000, gainTraits: ['cyber_street_meds'], tags: ['靠抑制剂'] } },
      },
      {
        label: '不换，改用机械辅助外骨骼',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '你自己做了一副外骨骼，土，但管用。', effects: { attr: { ingenuity: 3, vitality: 1 }, money: -20000, tags: ['自制外骨骼'] } },
        fail: { text: '外骨骼压坏了你的髋关节。你换成了不换都不行。', effects: { attr: { health: -3 }, money: -30000 } },
      },
    ],
  },

  {
    id: 'cb_mid_002',
    stage: 'middle',
    title: '过时的型号',
    text: '你身上那件义体停产十四年了。全城只有三个人还会修它，其中两个人已经死了。\n第三个人在云台，报价按小时算。',
    require: { age: [42, 52], tags: ['义体化'] },
    choices: [
      {
        label: '去云台找他',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '他修好了，还多送了你一套配件。「以后没人会修了，你自己学。」', effects: { attr: { perception: 3, health: 2 }, money: -40000, tags: ['会修自己的义体'] } },
        fail: { text: '他看都没看就报了价，你付不起。你转身走了。', effects: { attr: { mood: -2 } } },
      },
      {
        label: '自己拆开它，一点点学',
        check: { attr: 'ingenuity', dc: DC.extreme },
        success: { text: '你花了七个月，把整件义体的结构画成了一套图纸。', effects: { attr: { ingenuity: 4 }, tags: ['会修自己的义体', '有一整套图纸'] } },
        fail: { text: '你把它拆开后有一根神经线接错了。左手从此不再完全听话。', effects: { attr: { health: -3, vitality: -1 }, tags: ['手指不太听话'] } },
      },
    ],
  },

  {
    id: 'cb_mid_003',
    stage: 'middle',
    title: '留给你的人',
    text: '你带过的一个学徒现在管着半边锈带。他来请你出山，说有一票只有你能做。\n你看着他手上的刀——那把刀你认得。',
    require: { age: [42, 55], tags: ['传下去过'] },
    choices: [
      {
        label: '答应他，再出一次手',
        check: { attr: 'vitality', dc: DC.hard },
        success: { text: '你出手一次，办成了。这一次之后你把刀正式传给了他。', effects: { attr: { vitality: 2, will: 2 }, money: 50000, tags: ['最后一次出手'] } },
        fail: { text: '你的身体跟不上脑子。他替你收尾，你欠了他一次。', effects: { attr: { health: -3 }, tags: ['欠过徒弟一次'] } },
      },
      {
        label: '拒绝，只把方法教给他',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '你教了他三天，把阿鸾那句「别挡，要进」也教给了他。', effects: { attr: { empathy: 3, mood: 2 }, tags: ['教出了一个徒弟'] } },
        fail: { text: '他嫌你啰嗦，第二天就自己带人去了。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_mid_004',
    stage: 'middle',
    title: '孩子的信',
    text: '孩子去了荒原那边，一年回来一次。这次他留下一封信：\n「爸，我在外面第一次见到了不用付雨水税的房子。我不打算回来了。你们要不要过来。」',
    require: { age: [44, 58], tags: ['有个孩子'] },
    choices: [
      {
        label: '回信说：你走你的，我们留在这里',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '你写了三页，最后只寄出一句：记得打伞。', effects: { attr: { will: 2, mood: 1 }, tags: ['孩子在外面扎根'] } },
        fail: { text: '你把信写完又烧了。孩子等了一年没收到回音。', effects: { attr: { mood: -3 } } },
      },
      {
        label: '答应他，去看看',
        check: { attr: 'reverie', dc: DC.hard },
        success: { text: '你去了。那里的天空是灰绿色的，花开的时候你哭了一次。', effects: { attr: { reverie: 3, mood: 3, health: 1 }, tags: ['去过荒原'] } },
        fail: { text: '你去了，待了十一天就想回来。雨声不在的地方，你睡不着。', effects: { attr: { mood: 1, health: -1 }, tags: ['去过荒原'] } },
      },
    ],
  },

  {
    id: 'cb_mid_005',
    stage: 'middle',
    title: '旧账',
    text: '当年拿走你项目的那个人回来了，现在在一家小公司做事，得了神经病，走路要靠支架。\n他认出你，站在雨里不动。',
    require: { age: [45, 58], tags: ['赢了申诉'] },
    choices: [
      {
        label: '走过去，扶他一把',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '他哭得像个孩子。你说：都过去了。你说的时候自己也信了。', effects: { attr: { empathy: 3, mood: 2 }, tags: ['和解过'] } },
        fail: { text: '你走过去，最后还是收回了手。', effects: { attr: { mood: -2 } } },
      },
      {
        label: '绕开他，装作没看见',
        check: { attr: 'will', dc: DC.normal },
        success: { effects: { attr: { will: 1, mood: -1 } } },
        fail: { text: '他叫出了你的名字。你不得不回头。', effects: { attr: { mood: -3 } } },
      },
    ],
  },

  {
    id: 'cb_mid_006',
    stage: 'middle',
    title: '冻结',
    text: '医生提出一个方案：把你的神经活动在低功耗状态下冻结十年，等医疗技术进步了再唤醒。\n「十年后你醒来，身体还是现在的身体。但这十年，你没有。」',
    require: { age: [46, 58], tags: ['神经污染'] },
    choices: [
      {
        label: '接受',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '你在一个雨夜躺进了舱里。醒来时，推你做手术的医生的儿子已经接手了诊所。', effects: { attr: { health: 4 } } },
        fail: { text: '冻结到第四年，舱的供电出了故障。你被提前唤醒，中间丢了两年。', effects: { attr: { health: -2, mood: -3, reverie: -1 }, tags: ['丢过两年'] } },
      },
      {
        label: '不接受，剩下的日子自己过',
        check: { attr: 'will', dc: DC.hard },
        success: { effects: { attr: { will: 3, mood: 2 }, tags: ['拒绝冻结'] } },
        fail: { text: '你签了同意书，又在最后一刻把它撕了。医生见多了你这样的。', effects: { attr: { mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_mid_007',
    stage: 'middle',
    title: '回锈带',
    text: '你回到了十七号巷。你长大的那间铁皮屋已经拆了，原地立着一台数据柜，柜面上贴着广告：\n「重活一次，只需十二万。」',
    require: { age: [45, 60] },
    choices: [
      {
        label: '去找那台柜子的运营方',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '运营方是慧眼数据的一个二级供应商。他们的客户名单，你认得其中三个名字。', effects: { attr: { perception: 3 }, tags: ['知道重活一次的生意'] } },
        fail: { text: '柜子是黑的，谁也不知道后面连着谁。', effects: { attr: { mood: -2 } } },
      },
      {
        label: '在那台柜子旁边坐一会',
        check: { attr: 'reverie', dc: DC.normal },
        success: { text: '你坐了三个小时。雨落下来的时候，你想起母亲那只凉手。', effects: { attr: { reverie: 2, mood: 2, empathy: 1 }, tags: ['回过十七号巷'] } },
        fail: { text: '你坐着坐着睡着了，醒来时天已经黑了。', effects: { attr: { mood: -1 }, } },
      },
    ],
  },

  {
    id: 'cb_mid_008',
    stage: 'middle',
    title: '徒弟的请求',
    text: '你带出来的学徒要接你的位置。他知道你手里有一份名单，也知道名单值多少钱。\n他说：师父，你留着它没有用，我有用。',
    require: { age: [47, 58], tags: ['手里有一份要命的档案'] },
    choices: [
      {
        label: '把名单交给他',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '他拿去卖了，赚了很多，分了你一半。你什么都没说。', effects: { attr: { empathy: 1, wealth: 3 }, money: 60000, tags: ['名单交出去了'] } },
        fail: { text: '他拿去换了位置，名单上的名字一个都没再出现过。', effects: { attr: { mood: -4 }, money: 20000, tags: ['名单交出去了'] } },
      },
      {
        label: '拒绝，并且告诉他为什么',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '他听完，走了。三年后他回来道谢。', effects: { attr: { will: 3, empathy: 2 }, tags: ['守住过名单'] } },
        fail: { text: '他不理解，从此跟你断了来往。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_mid_009',
    stage: 'middle',
    title: '最后一次动手',
    text: '四个年轻人堵住了诊所的门口，要收「保护费」。你五十三岁，身上七件义体，其中三件快不行了。\n身后的床上躺着一个刚做完手术的孩子。',
    require: { age: [50, 58], tags: ['接手了诊所'] },
    choices: [
      {
        label: '自己上',
        check: { attr: 'vitality', dc: DC.extreme },
        success: { text: '你打断了两个人，另外两个跑了。你站在门口喘了很久。', effects: { attr: { vitality: 2, will: 3, health: -2 }, tags: ['最后一次动手'] } },
        fail: { text: '他们把你按在地上打了很久。孩子的手术没做完。', effects: { attr: { health: -5, mood: -3 }, psyche: { suppression: 3 }, tags: ['最后一次动手'] } },
      },
      {
        label: '打电话给你带过的那些孩子',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '四十分钟内来了十一个人，最小的十七岁。他们什么都没做，只是站着。', effects: { attr: { empathy: 3, mood: 3 }, tags: ['锈带的老人'] } },
        fail: { text: '电话打出去，只有两个人回话。他们也都老了。', effects: { attr: { mood: -2, will: 1 } } },
      },
    ],
  },

  {
    id: 'cb_mid_010',
    stage: 'middle',
    title: '写下来',
    text: '医生说你写东西会好一点。你买了一本纸质本子，第一页写下：\n「我母亲叫祁青，编号 C-7734，最后一次出现在安宁疗养院。」',
    require: { age: [48, 60], tags: ['写日记的人'] },
    choices: [
      {
        label: '接着写下去，把知道的都写下来',
        check: { attr: 'reverie', dc: DC.normal },
        success: { text: '你写了两年，写满了七本。锈带有人开始传抄。', effects: { attr: { reverie: 3, empathy: 2, mood: 2 }, tags: ['七本本子'] } },
        fail: { text: '写到第三本，你忘了前两本放在哪了。', effects: { attr: { mood: -2, reverie: 1 } } },
      },
      {
        label: '把本子交给孩子',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '他说：我替你写下去。他真的写了下去。', effects: { attr: { empathy: 3, mood: 3 }, tags: ['孩子接了本子'] } },
        fail: { text: '他翻了两页就收起来了。他说：爸，别想这些了。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_mid_011',
    stage: 'middle',
    title: '捐赠',
    text: '记忆行的人找上门，说愿意出八十万收你一生的记忆。\n「你想想，你的这一生，会被别人重活一次。他们会替你记住。」',
    require: { age: [50, 60], chance: 0.5 },
    choices: [
      {
        label: '卖掉',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '你签了。八十万到账那天，你发现自己已经想不起母亲哼的那个调子。', effects: { attr: { wealth: 4, mood: -3 }, psyche: { suppression: 3 }, money: 800000, tags: ['记忆被卖掉'] } },
        fail: { text: '你签了。醒来的时候，你连自己为什么签都不记得了。', effects: { attr: { wealth: 4, mood: -5, reverie: -2 }, psyche: { suppression: 4 }, gainTraits: ['cyber_memory_edit'], money: 800000, tags: ['记忆被卖掉', '丢过一段人生'] } },
      },
      {
        label: '拒绝，把记忆留给孩子',
        check: { attr: 'empathy', dc: DC.hard },
        success: { effects: { attr: { empathy: 3, mood: 3 }, tags: ['记忆留给了孩子'] } },
        fail: { text: '你拒绝了，可你已经开始忘。有些东西不等你决定。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_mid_012',
    stage: 'middle',
    title: '老友的葬礼',
    text: '你这一辈的人开始一个接一个地走。这次是当年跟你一起抢船坞地盘的那个。\n他的葬礼在退潮的滩涂上办，来的人比老范那次少了一半。',
    require: { age: [50, 60], tags: ['打过一场架'] },
    choices: [
      {
        label: '在墓前说几句话',
        check: { attr: 'empathy', dc: DC.normal },
        success: { effects: { attr: { empathy: 2, mood: 1 }, tags: ['送过老友'] } },
        fail: { text: '你张了张嘴，一个字都没说出来。', effects: { attr: { mood: -2 }, tags: ['送过老友'] } },
      },
      {
        label: '留下来，替他把没做完的事做完',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '他生前在给一条巷子修排水。你替他把那笔钱凑齐了。', effects: { attr: { will: 3, empathy: 2 }, money: -30000, tags: ['替他修完了排水'] } },
        fail: { text: '你没凑够钱。那条巷子后来还是淹了两次。', effects: { attr: { mood: -3 } } },
      },
    ],
  },

  {
    id: 'cb_mid_013',
    stage: 'middle',
    title: '一次机会',
    text: '慧眼数据的新任负责人找到你，说想让你做「锈带顾问」，年薪六位数，只要求你签一份保密协议。\n协议的第一条是：不得提及回流计划。',
    require: { age: [50, 60], tags: ['知道真相的全部'] },
    choices: [
      {
        label: '签，然后从内部磨它',
        check: { attr: 'ingenuity', dc: DC.extreme },
        success: { text: '你在里面待了六年，把三条巷子的迁移令压了下来。', effects: { attr: { ingenuity: 3, wealth: 3, empathy: 2 }, money: 300000, tags: ['锈带顾问'] } },
        fail: { text: '你被架空了。六年过去，你什么都没改动。', effects: { attr: { wealth: 2, mood: -3 }, money: 200000, tags: ['锈带顾问'] } },
      },
      {
        label: '不签，把这份协议的内容说出去',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '协议泄露的那天，云台区的股价掉了两个点。你什么也没拿到，但你笑了很久。', effects: { attr: { will: 4, mood: 3 }, tags: ['捅过一刀'] } },
        fail: { text: '没人信你。他们说你是个年纪大了、记忆有问题的老人。', effects: { attr: { mood: -4 } } },
      },
    ],
  },

  {
    id: 'cb_mid_014',
    stage: 'middle',
    title: '余柚',
    text: '余柚比你先走。她走的时候，那只凉手还握在你手心里，接口的指示灯慢慢灭下去。\n医生问你要不要保留她的记忆样本。',
    require: { age: [52, 60], tags: ['和余柚一起'] },
    choices: [
      {
        label: '不保留，让她走干净',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '你把她葬在滩涂上，旁边是拳场那个女孩的位置。', effects: { attr: { will: 3, mood: -2, empathy: 2 }, psyche: { suppression: 3 }, tags: ['送走余柚'] } },
        fail: { text: '你说了不保留，第二天又跑回去想要。已经晚了。', effects: { attr: { mood: -5 }, psyche: { suppression: 5, selfWorth: -2 }, tags: ['送走余柚'] } },
      },
      {
        label: '保留，只留一段',
        check: { attr: 'reverie', dc: DC.hard },
        success: { text: '你留了她哼歌的那一段。你每天晚上听一次，听到耳朵疼。', effects: { attr: { reverie: 3, mood: 1 }, psyche: { suppression: -2, trust: 1 }, tags: ['留着一段余柚'] } },
        fail: { text: '样本在三个月后损坏了。你连那段哼歌都没留住。', effects: { attr: { mood: -4 } } },
      },
    ],
  },

  {
    id: 'cb_mid_015',
    stage: 'middle',
    title: '雨停之后',
    text: '除雨系统又一次升级，这一次锈带整整十一天没有下雨。街上的孩子问：这是什么。\n有老人说：这是以前的天气。',
    require: { age: [50, 60], chance: 0.45 },
    choices: [
      {
        label: '带诊所的孩子出去走走',
        check: { attr: 'empathy', dc: DC.easy },
        success: { effects: { attr: { empathy: 2, mood: 3 }, tags: ['带孩子们见过天'] } },
        fail: { effects: { attr: { mood: 1 }, tags: ['带孩子们见过天'] } },
      },
      {
        label: '一个人上屋顶，把这十一天记下来',
        check: { attr: 'reverie', dc: DC.normal },
        success: { text: '你在本子上画了十一个方框，每个方框里写天气。这成了后来别人引用的资料。', effects: { attr: { reverie: 3, perception: 2 }, tags: ['七本本子'] } },
        fail: { effects: { attr: { reverie: 1, mood: 1 } } },
      },
    ],
  },

  {
    id: 'cb_mid_016',
    stage: 'middle',
    title: '戒',
    text: '医生说再接入一次，你的视神经就会彻底断掉。你已经三个月没有进潮汐网了，手一直在抖。\n今夜有一个地址在反复呼叫你：节点 0。',
    require: { age: [52, 60], tags: ['拿着根密钥'] },
    choices: [
      {
        label: '最后一次接入',
        check: { attr: 'will', dc: DC.extreme },
        major: true,
        success: { text: '你看见排队数字变了：2,147,483,648。有人在你之后，接上了。', effects: { attr: { will: 3, reverie: 2, health: -3 }, tags: ['最后一次接入'] } },
        fail: { text: '你接入的第九秒，右眼黑了。再也没亮起来。', effects: { attr: { health: -4, perception: -2 }, psyche: { suppression: 2 }, gainTraits: ['vision_single_eye'], tags: ['右眼看不见', '最后一次接入'] } },
        critSuccess: { text: '你不但接上了，还从里面拖出一整段被删掉的名单。你没有存进任何设备，抄在了纸上。', effects: { attr: { will: 3, perception: 3, reverie: 2, health: -2 }, tags: ['最后一次接入', '知道真相的全部'] } },
        critFail: { text: '你没能拔出来。界面上的排队数字继续跳动。', effects: { death: '神经污染' } },
      },
      {
        label: '把根密钥交给孩子',
        check: { attr: 'empathy', dc: DC.extreme },
        success: { text: '他接过去的时候手在抖。你说：别学我，别一个人扛。', effects: { attr: { empathy: 3, mood: 2 }, tags: ['密钥交给了孩子'] } },
        fail: { text: '他拒绝了。他说：爸，这东西毁了你半辈子。他把密钥扔进了海里。', effects: { attr: { mood: -3, health: 1 }, tags: ['密钥沉了'] } },
      },
      {
        label: '接上去，把画面全关掉，只留声音',
        require: { caps: ['blind'] },
        check: { attr: 'reverie', dc: DC.hard },
        success: { text: '你听见排队数字在响，一个一个往后挪。你把手从接口上拿开了。', effects: { attr: { reverie: 2, will: 1 }, tags: ['最后一次接入', '听完了那串数字'] } },
        fail: { text: '声音层里全是杂音。你没能自己拔出来，是孩子替你断的电。', effects: { attr: { health: -2 }, tags: ['最后一次接入'] } },
      },
    ],
  },

  {
    id: 'cb_mid_017',
    stage: 'middle',
    title: '六十岁',
    text: '六十岁那天，诊所关了门。你在门口挂了一块牌子：今日休息，去滩涂看潮。\n潮水上来的时候，把十九岁那年你埋在滩涂上的铁牌又冲出来了。',
    require: { age: [60, 60], tags: ['接手了诊所'] },
    effects: { attr: { perception: 1, empathy: 1, mood: 2 }, tags: ['六十岁'] },
  },

  {
    id: 'cb_mid_018',
    stage: 'middle',
    title: '有人来找你',
    text: '一个十七岁的女孩敲开你的门，说她母亲的名字在名单上。\n她拿着一张打印出来的屏幕照片——那是三十年前，你投上广告屏的那一份。',
    require: { age: [54, 60], tags: ['公布过名单'] },
    choices: [
      {
        label: '把她请进来，把你知道的全说了',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '她听了四个小时。走的时候她说：我本来以为没人管过这件事。', effects: { attr: { empathy: 3, mood: 3 }, tags: ['有人来问过'] } },
        fail: { text: '你讲到一半忘了后面的事。她礼貌地听着，最后什么也没说。', effects: { attr: { mood: -2 } } },
      },
      {
        label: '只说一半，剩下的让她自己查',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '你给了她三个地址。半年后她查到了比你更多的东西。', effects: { attr: { perception: 3, mood: 2 }, tags: ['有人接了班'] } },
        fail: { text: '她在第二个地址出了事。你从报纸上知道的。', effects: { attr: { mood: -4 }, psyche: { suppression: 3 } } },
      },
    ],
  },

  {
    id: 'cb_mid_019',
    stage: 'middle',
    title: '街头传奇',
    text: '锈带的孩子开始讲你的故事，越讲越离谱：说你一个人拆过一家公司，说你的心脏是军用的。\n你听着，觉得那说的是另一个人。',
    require: { age: [55, 60], tags: ['街头名声'] },
    choices: [
      {
        label: '纠正他们',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你说：我什么都没做成，只是没走。他们更喜欢这个版本。', effects: { attr: { will: 3, empathy: 1, mood: 2 }, tags: ['说清楚了'] } },
        fail: { text: '他们不听，反而觉得你谦虚。故事变得更离谱了。', effects: { attr: { mood: -1 } } },
      },
      {
        label: '不纠正，让他们有个能讲的东西',
        check: { attr: 'empathy', dc: DC.normal },
        success: { effects: { attr: { empathy: 2, mood: 2 }, tags: ['锈带的老人'] } },
        fail: { effects: { attr: { mood: 1 } } },
      },
    ],
  },

  {
    id: 'cb_mid_020',
    stage: 'middle',
    title: '和解',
    text: '小满的妻子来找你，说小满已经不认得任何人了，但他每天都会念一个名字。\n她问你：那是不是你。',
    require: { age: [55, 60], tags: ['小满还活着'] },
    choices: [
      {
        label: '去看他',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '他坐在窗边，叫你那个名字。你们什么也没说，坐了一下午。', effects: { attr: { empathy: 4, mood: 3 }, tags: ['见过最后一面'] } },
        fail: { text: '你走到门口，没进去。你怕他不认得你。', effects: { attr: { mood: -3 } } },
      },
      {
        label: '把他的那半盒零件送过去',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '他把零件一个个摆开，说：还差三个，我们就能上去了。', effects: { attr: { will: 2, empathy: 2, mood: 1 }, tags: ['见过最后一面'] } },
        fail: { text: '盒子在快递站丢了。有些东西就是这样丢的。', effects: { attr: { mood: -3 } } },
      },
    ],
  },

  {
    id: 'cb_mid_021',
    stage: 'middle',
    title: '留一样东西',
    text: '你决定留一样东西给这座城。可以是一间诊所，一本本子，一份名单，或者一把刀。\n你只能留一样。',
    require: { age: [57, 60] },
    choices: [
      {
        label: '留那本写了三十年的本子',
        check: { attr: 'reverie', dc: DC.hard },
        success: { text: '本子后来被印出来了，封面是你画的那十一个方框。', effects: { attr: { reverie: 3, mood: 3 }, tags: ['七本本子', '留在这座城里的东西'] } },
        fail: { text: '本子被一次水浸毁了。剩下能看懂的只有三十七页。', effects: { attr: { mood: -3 } } },
      },
      {
        label: '留那间诊所',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '你把它交给了一个刚出师的年轻医生，没要钱。', effects: { attr: { empathy: 3, mood: 3 }, tags: ['留在这座城里的东西'] } },
        fail: { text: '年轻医生待了两个月就走了，诊所又空了。', effects: { attr: { mood: -2 } } },
      },
      {
        label: '留那枚根密钥，做成一个只有后来人能解的谜',
        check: { attr: 'ingenuity', dc: DC.extreme },
        success: { text: '你把密钥拆成七段，藏进七个锈带人手里。他们互不认识。', effects: { attr: { ingenuity: 4, mood: 2 }, tags: ['钥匙分成七段'] } },
        fail: { text: '拆开的密钥有一半在传输中丢了。它永远拼不起来了。', effects: { attr: { mood: -2 }, tags: ['密钥作废'] } },
      },
    ],
  },

  {
    id: 'cb_mid_022',
    stage: 'middle',
    title: '六十岁的雨',
    text: '雾港的雨在你六十岁这年变了味，据说是新的除酸配方。\n它落在手上的时候，不像烟头了，像水。',
    require: { age: [58, 60] },
    effects: { attr: { mood: 3, perception: 1 }, tags: ['雨不像以前了'] },
  },

  /* —— 安稳路线的日常（once: false，可反复触发）：撑住行力与身体，是活到老年的唯一办法 —— */
  {
    id: 'cb_mid_023',
    stage: 'middle',
    title: '月钱',
    text: '每月的第三个星期五，锈牙的人来收月钱。他们不进门，就在门口站着，抽完一支烟就走。\n这条巷子二十年没换过收钱的人。',
    require: { age: [42, 60], tags: ['锈牙帮'] },
    once: false,
    weight: 2,
    choices: [
      {
        label: '照旧给，再留他们喝一杯',
        check: { attr: 'empathy', dc: DC.easy },
        success: { text: '钱递过去，杯子也递过去。他们说：这条巷子以后还是这条巷子。', effects: { attr: { health: 2, vitality: 2, empathy: 1, mood: 1 } } },
        fail: { text: '你把钱数了两遍。他们在门口等到烟抽完，没说什么。', effects: { attr: { health: 1, vitality: 1 } } },
      },
      {
        label: '让徒弟去应付，自己躲在后屋',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '徒弟把事办得比你利索。你在后屋听着，忽然觉得可以放手了。', effects: { attr: { health: 1, vitality: 2, mood: 2 } } },
        fail: { text: '徒弟把钱给多了。你补上差额，回来骂了他两句。', effects: { attr: { vitality: 1, mood: -1 }, money: -3000 } },
      },
    ],
  },

  {
    id: 'cb_mid_024',
    stage: 'middle',
    title: '开门',
    text: '你的铺子每天六点开门，落雨也不例外。修义体、配零件、给街坊赊账，赊出去的比收回来的多。\n街上的人说，这家铺子像路灯一样，不亮着反而不对。',
    require: { age: [42, 60], tags: ['小生意'] },
    once: false,
    weight: 2,
    choices: [
      {
        label: '把卷帘门拉起来，干活',
        check: { attr: 'will', dc: DC.easy },
        success: { text: '一整天来了七个人，四件是小活。你收工的时候手是热的。', effects: { attr: { health: 2, vitality: 2, will: 1, mood: 1 } } },
        fail: { text: '你多睡了两个小时。开门的时候，已经有人在门口蹲着等了。', effects: { attr: { health: 1, vitality: 1 } } },
      },
      {
        label: '去把赊账收一遍',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '你收回来六成。剩下的你说算了，他们反而把手上有的都塞给你。', effects: { attr: { health: 1, vitality: 1, empathy: 2 }, money: 8000 } },
        fail: { text: '你跑了一天，收回来的钱不够付车费。你把本子上几个名字划掉了。', effects: { attr: { vitality: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_mid_025',
    stage: 'middle',
    title: '保养',
    text: '每半年一次的全套保养：清洗接口、换密封、把排异压下去。做保养的是老范的徒弟，现在自己带人了。\n账单不便宜 —— 但锈牙的人认你，铺子的流水也够，这条命是花钱续的。',
    require: { age: [42, 60], tags: ['小生意', '锈牙帮', '义体化'] },
    once: false,
    weight: 4,
    choices: [
      {
        label: '该花的照花',
        check: { attr: 'wealth', dc: DC.easy },
        success: { text: '保养做完，后颈那个接口不响了。你还能再干半年。', effects: { attr: { health: 3, vitality: 3 }, money: -20000 } },
        fail: { text: '这次账没算清，你只做了最要紧的两项。', effects: { attr: { health: 2, vitality: 2 }, money: -12000 } },
      },
      {
        label: '让锈牙的人带你去厂里的黑诊所',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '黑诊所的件是拆机件，但装得比正品还稳，只收你一半。', effects: { attr: { health: 3, vitality: 3, empathy: 1 }, money: -8000 } },
        fail: { text: '拆机件型号不对，你的左臂僵了半个月。', effects: { attr: { health: 1, vitality: 2 } } },
      },
    ],
  },

  {
    id: 'cb_mid_026',
    stage: 'middle',
    title: '读唇',
    text: '谈事的人都客气，客气话里的破绽全在嘴上。\n你听不见，所以你一直看对方的嘴——看了三十年。',
    require: { caps: ['deaf'], age: [45, 58] },
    choices: [
      {
        label: '看住对方的嘴，把报价重新念一遍',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '他嘴上说的是六万，纸上写的是四万。你把纸推了回去。', effects: { attr: { perception: 2 }, money: 20000, tags: ['读唇'] } },
        fail: { text: '你记错了一位。合同按他写的那版签了。', effects: { attr: { mood: -2 }, money: -5000 } },
      },
      {
        label: '让对方把条件全写下来，写完再谈',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '写到第三页，他自己改了口。', effects: { attr: { will: 2, perception: 1 } } },
        fail: { text: '他写到一半收起纸，说改天再谈。', effects: { attr: { mood: -1 } } },
      },
    ],
  },
];
