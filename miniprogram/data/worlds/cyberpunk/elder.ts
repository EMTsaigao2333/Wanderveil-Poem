/**
 * 世界：赛博朋克 · 雾港 —— 老年（61+）
 */

import type { LifeEvent } from '../../../engine/schema';
import { DC } from '../../../engine/schema';

export const events: LifeEvent[] = [
  {
    id: 'cb_eld_001',
    stage: 'elder',
    title: '停机',
    text: '左手在你煮面的时候停了。汤洒了一地，你坐在板凳上等它重启，等了四十分钟。\n它最后动了一下，像一句没说完的话。',
    require: { age: [61, 70], tags: ['义体化'] },
    choices: [
      {
        label: '去换一件新的',
        check: { attr: 'wealth', dc: DC.hard },
        success: { text: '新的比旧的轻。你花了两周才习惯它不疼。', effects: { attr: { vitality: 2, health: 1 }, money: -80000, tags: ['换过义体'] } },
        fail: { text: '医生说你这个年纪不适合再动刀了。你学着自己修，修不好就那样。', effects: { attr: { health: -2 }, tags: ['左手动不了'] } },
      },
      {
        label: '不换了，就这样',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '你学会了用一只手做所有事。锈带的人都说你厉害。', effects: { attr: { will: 3, mood: 1 }, tags: ['一只手也行'] } },
        fail: { text: '你摔了两次，第二次摔断了髋骨。躺了半年。', effects: { attr: { health: -4 }, tags: ['摔过两次'] } },
      },
    ],
  },

  {
    id: 'cb_eld_002',
    stage: 'elder',
    title: '名字',
    text: '巷子里的孩子不认识你，但他们叫你「拆手的」。\n他们说三十年前有个人用一把刀把征收点砸了，那个人就是你。你想了一下，好像确实是。',
    require: { age: [61, 72], tags: ['锈带记得你'] },
    choices: [
      {
        label: '给他们讲讲那天的事',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '你讲了四十分钟，中间忘了两次。孩子们还是听完了。', effects: { attr: { empathy: 3, mood: 3 }, tags: ['讲过故事'] } },
        fail: { text: '你讲到一半，忘了自己为什么砸那个征收点。', effects: { attr: { mood: -2 } } },
      },
      {
        label: '什么都不说，看他们玩',
        check: { attr: 'reverie', dc: DC.easy },
        success: { effects: { attr: { reverie: 2, mood: 2 } } },
        fail: { effects: { attr: { mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_eld_003',
    stage: 'elder',
    title: '上传',
    text: '一家叫「余响」的公司提供记忆上传服务，说可以把你的意识做成一份档案，永久保存在潮汐网里。\n价格是四百万信用点，或者——你一生的记忆。',
    require: { age: [62, 75], chance: 0.55 },
    choices: [
      {
        label: '用一生的记忆换',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '档案做好了。你在里面见到了一些人，他们看上去都很好。', effects: { attr: { reverie: 3, mood: 2 }, tags: ['上传过意识'] } },
        fail: { text: '上传过程中断，档案只存下了三分之一。剩下的部分，你也没有了。', effects: { attr: { reverie: -2, mood: -4 }, tags: ['上传过意识', '丢过一段人生'] } },
      },
      {
        label: '放弃，死人就应该留在土里',
        check: { attr: 'will', dc: DC.hard },
        success: { effects: { attr: { will: 3, mood: 1 }, tags: ['拒绝上传'] } },
        fail: { text: '你签了同意书，做完体检就退掉了。你在诊所门口坐了整整一夜。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_eld_004',
    stage: 'elder',
    title: '最后一个还在的人',
    text: '你这一辈的人只剩两个。今天走了一个，剩下的是你和另一个不怎么说话的。\n你们坐在滩涂边上看潮，谁都不开口。',
    require: { age: [63, 78] },
    choices: [
      {
        label: '开口，问他一件当年的事',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '他记得的是另一个版本，比你的更清楚。你们把那件事拼在了一起。', effects: { attr: { perception: 3, mood: 3 }, psyche: { trust: 2, suppression: -2 }, tags: ['最后的朋友'] } },
        fail: { text: '他摇头说：不记得了。你们又沉默了很久。', effects: { attr: { mood: -1, empathy: 1 } } },
      },
      {
        label: '不说话，就把这一天坐完',
        check: { attr: 'empathy', dc: DC.easy },
        success: { effects: { attr: { empathy: 2, mood: 2 }, tags: ['最后的朋友'] } },
        fail: { effects: { attr: { mood: 1 } } },
      },
    ],
  },

  {
    id: 'cb_eld_005',
    stage: 'elder',
    title: '霓虹葬礼',
    text: '你替自己办了一场葬礼，人还活着，钱是提前花的。\n你请了锈带所有还愿意来的人，点了三十二串灯，放了一首四十年前的歌。',
    require: { age: [65, 80], chance: 0.5 },
    choices: [
      {
        label: '在葬礼上说说这一生',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '你说了不到十分钟，说的都是别人的名字。', effects: { attr: { will: 2, empathy: 3, mood: 4 }, tags: ['办过自己的葬礼'] } },
        fail: { text: '你说了两句就说不下去了。灯还亮着，歌还在放。', effects: { attr: { mood: 1 }, tags: ['办过自己的葬礼'] } },
      },
      {
        label: '躲在后面，看他们热闹',
        check: { attr: 'reverie', dc: DC.normal },
        success: { effects: { attr: { reverie: 2, mood: 2 }, tags: ['办过自己的葬礼'] } },
        fail: { effects: { attr: { mood: -1 }, tags: ['办过自己的葬礼'] } },
      },
    ],
  },

  {
    id: 'cb_eld_006',
    stage: 'elder',
    title: '孙辈',
    text: '孩子带着他的孩子回来了。那孩子七岁，手指是五根完整的、肉做的。\n他问你：爷爷，你手上为什么有这么多线。',
    require: { age: [63, 80], tags: ['有个孩子'] },
    choices: [
      {
        label: '伸给他看，一个一个讲',
        check: { attr: 'empathy', dc: DC.easy },
        success: { text: '你讲到第三根线的时候，他睡着了。你把他抱到床上。', effects: { attr: { empathy: 3, mood: 4 } } },
        fail: { text: '你手抖得厉害，数不清是第几根。', effects: { attr: { mood: 1 }, } },
      },
      {
        label: '把手缩回去，说没什么',
        check: { attr: 'will', dc: DC.hard },
        success: { effects: { attr: { will: 2, mood: -1 } } },
        fail: { text: '他伸手把那只手拉回来看。你没躲开。', effects: { attr: { empathy: 2, mood: 2 } } },
      },
    ],
  },

  {
    id: 'cb_eld_007',
    stage: 'elder',
    title: '潮水',
    text: '雾港的海平面这一年又涨了十一厘米。数据柜下面那一层已经不能住人。\n征收队开始给锈带的老人发迁移通知，去城南。所有人都知道城南是填海的空地。',
    require: { age: [65, 82] },
    choices: [
      {
        label: '带着邻居们去堵征收队',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '来了三十七个老人。征收令压了半年才重新下。', effects: { attr: { will: 3, empathy: 3 }, tags: ['堵过征收队'] } },
        fail: { text: '你们被水炮冲散了。三个老人在雨里摔断了骨头。', effects: { attr: { health: -3, mood: -3 }, psyche: { suppression: 2 }, tags: ['堵过征收队'] } },
      },
      {
        label: '把房子让出来，自己搬去高处',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '你在桁架区租了一间很小的房，窗对着当年的十七号巷。', effects: { attr: { ingenuity: 2, mood: 1 }, money: -40000 } },
        fail: { text: '你搬家那天丢了一个箱子，里面是七本本子中的两本。', effects: { attr: { mood: -3 } } },
      },
    ],
  },

  {
    id: 'cb_eld_008',
    stage: 'elder',
    title: '陌生的善意',
    text: '你在一场大雨里滑倒在巷口。一个年轻人跑过来扶你，送到诊所，没留名字就走了。\n他手腕上的编号形状，你认得。',
    require: { age: [66, 85] },
    choices: [
      {
        label: '去查这个编号',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '编号开头是 C-7734，母亲那批。锈带还有人在生。', effects: { attr: { perception: 3, empathy: 1 }, tags: ['见过那批人的孩子'] } },
        fail: { text: '你查了半年，编号在系统里是空的。', effects: { attr: { mood: -1, perception: 1 } } },
      },
      {
        label: '不查了，就这样记着',
        check: { attr: 'empathy', dc: DC.easy },
        success: { effects: { attr: { empathy: 3, mood: 3 }, tags: ['记住那个扶你的人'] } },
        fail: { effects: { attr: { mood: 1 } } },
      },
    ],
  },

  {
    id: 'cb_eld_009',
    stage: 'elder',
    title: '痛',
    text: '痛不再是事件，而是背景音。你学会了在痛的中间睡觉、吃饭、和人说话。\n医生说，就剩一个办法了，但那个办法会让你只剩下一半的你。',
    require: { age: [68, 88], tags: ['神经污染'] },
    choices: [
      {
        label: '做那个手术',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '痛不见了。你也想不起余柚哼的那首歌了。', effects: { attr: { health: 3, reverie: -3, mood: -1 }, tags: ['切掉了一半'] } },
        fail: { text: '手术只成功了一半。痛轻了，但你的右手再也没抬起过。', effects: { attr: { health: -2 }, tags: ['切掉了一半'] } },
      },
      {
        label: '不做，把痛留着',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你留着它。你说这是你还能感觉到的证明。', effects: { attr: { will: 4, mood: 2 }, psyche: { resilience: 2, selfWorth: 1 }, tags: ['留着痛'] } },
        fail: { text: '你留下了痛，但痛把你从别人身边越推越远。', effects: { attr: { mood: -3 }, tags: ['留着痛'] } },
      },
    ],
  },

  {
    id: 'cb_eld_010',
    stage: 'elder',
    title: '世界变了',
    text: '雾港的年轻人开始用「旧时代」这个词指你，说得没有恶意，就是事实。\n自动义体维修摊出现在每条巷口，一次五信用点，比你当年的手艺快十倍。',
    require: { age: [68, 90] },
    choices: [
      {
        label: '去学怎么用那些新东西',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '你学会了。你还发现它们的校准有偏差，帮了整条街的忙。', effects: { attr: { ingenuity: 3, mood: 3 }, tags: ['跟上了'] } },
        fail: { text: '你被它的自动诊断绕晕了，最后让隔壁的孩子教你。', effects: { attr: { ingenuity: 1, mood: -1 } } },
      },
      {
        label: '守着自己的旧工具',
        check: { attr: 'will', dc: DC.normal },
        success: { effects: { attr: { will: 2, mood: 1 }, tags: ['守着旧工具'] } },
        fail: { effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_eld_011',
    stage: 'elder',
    title: '屋顶',
    text: '你每天上屋顶坐两个小时。楼下的巷子是你长大的地方，远处是云台，中间是雾港的雨。\n坐在这里的时候，你不太分得清记忆和想象。',
    require: { age: [70, 95], tags: ['二十五岁的屋顶'] },
    choices: [
      {
        label: '在屋顶上写点什么',
        check: { attr: 'reverie', dc: DC.normal },
        success: { text: '你在本子上写：我到过最高的地方，是这里。', effects: { attr: { reverie: 3, mood: 3 } } },
        fail: { text: '你握着笔睡着了。醒来时本子被雨打湿了一页。', effects: { attr: { mood: -1 } } },
      },
      {
        label: '什么都不写，只是坐着',
        check: { attr: 'will', dc: DC.easy },
        success: { effects: { attr: { will: 1, mood: 2 } } },
        fail: { effects: { attr: { mood: 1 } } },
      },
    ],
  },

  {
    id: 'cb_eld_012',
    stage: 'elder',
    title: '最后一次接入',
    text: '你把接入环从抽屉里拿出来，擦干净。它已经有七年没有通电了。\n节点 0 的呼叫，从来没有停过。',
    require: { age: [70, 95], tags: ['拿着根密钥'] },
    choices: [
      {
        label: '接上去，最后一次',
        check: { attr: 'will', dc: DC.extreme },
        success: { text: '你看见那串数字已经跳到了另一个数量级。你把密钥的七段之一删掉了。', effects: { attr: { will: 3, reverie: 2 }, tags: ['删过一段密钥'] } },
        fail: { text: '你在接入时睡着了。醒来时接入环烧穿了，手背上多了一块疤。', effects: { attr: { health: -3 }, tags: ['手背的疤'] } },
      },
      {
        label: '把接入环扔进海里',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '它沉下去的时候，海面上还亮着一小块蓝色的光。', effects: { attr: { will: 3, mood: 2 }, tags: ['扔了接入环'] } },
        fail: { text: '你扔出去，又后悔了，站在岸边看了很久。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_eld_013',
    stage: 'elder',
    title: '她',
    text: '你今天早上在诊所门口看见了母亲。她就站在那里，穿着那件旧外套，右手还是凉的。\n你已经知道这是神经的问题，但你还是走了过去。',
    require: { age: [72, 95] },
    choices: [
      {
        label: '走过去，牵那只手',
        check: { attr: 'reverie', dc: DC.hard },
        success: { text: '你说：妈，我一直在找你。她说：我知道。然后雨把画面冲淡了。', effects: { attr: { reverie: 3, empathy: 3, mood: 3 }, psyche: { suppression: -4, selfWorth: 2, trust: 1 }, tags: ['见过她'] } },
        fail: { text: '你走到一半，她就不见了。你在原地站了很久。', effects: { attr: { mood: -2, reverie: 1 }, psyche: { suppression: 2 } } },
      },
      {
        label: '站在原地，看着她',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你站着看，直到雨把她化成水。你说了句什么，很小声。', effects: { attr: { will: 3, mood: 1 }, tags: ['说过那句话'] } },
        fail: { text: '她看了你一眼，转身走进雨里。你没追。', effects: { attr: { mood: -3 } } },
      },
    ],
  },

  {
    id: 'cb_eld_014',
    stage: 'elder',
    title: '交接',
    text: '那个拿着你投在广告屏上的名单来找你的女孩，现在四十岁了。她带着自己的孩子来。\n她说：我把这件事做完了，现在换人。',
    require: { age: [72, 95], tags: ['有人接了班'] },
    choices: [
      {
        label: '把剩下的东西全交给她',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '本子、图纸、那七段密钥中的一段。你交完手是空的，第一次觉得轻松。', effects: { attr: { empathy: 3, mood: 4 }, tags: ['交完了'] } },
        fail: { text: '你交到一半停下了。有些东西你舍不得。', effects: { attr: { mood: -1 } } },
      },
      {
        label: '只交本子，别的留着',
        check: { attr: 'will', dc: DC.hard },
        success: { effects: { attr: { will: 2, mood: 1 } } },
        fail: { text: '她看出来了，没说什么，带着本子走了。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_eld_015',
    stage: 'elder',
    title: '城市在长',
    text: '锈带开始拆了。推土机从十七号巷一路推过来，露出下面四十年前的海床。\n有人说要在这里建一片湿地公园，名字还没定。',
    require: { age: [74, 95], chance: 0.5 },
    choices: [
      {
        label: '建议用你母亲的名字命名',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '公园最后叫了另一个名字。但入口那块石头上刻了一行小字：C-7734。', effects: { attr: { empathy: 3, mood: 4 }, tags: ['那块石头'] } },
        fail: { text: '提案没通过。命名委员会说编号不适合作为公共名称。', effects: { attr: { mood: -2 } } },
      },
      {
        label: '去捡一块海床上的石头，留着',
        check: { attr: 'reverie', dc: DC.easy },
        success: { effects: { attr: { reverie: 2, mood: 3 }, tags: ['那块石头'] } },
        fail: { text: '石头在运输机上被扣下了，说是文物。', effects: { attr: { mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_eld_016',
    stage: 'elder',
    title: '一个小时的安静',
    text: '耳鸣在你七十八岁那年突然停了。整整一个小时，世界没有声音。\n医生说这是末期的征兆。你把这一小时记在了本子上，写着：很好。',
    require: { age: [78, 100] },
    effects: { attr: { reverie: 2, mood: 3, perception: 1 }, tags: ['记下了那一小时'] },
  },

  {
    id: 'cb_eld_017',
    stage: 'elder',
    title: '和解',
    text: '你梦见了那些你没能救下的人。拳场的女孩，阿鸾，老范，小满，母亲。\n他们站在滩涂上，都没有说话，只是看着你。',
    require: { age: [78, 100] },
    choices: [
      {
        label: '走过去，向他们道歉',
        check: { attr: 'empathy', dc: DC.extreme },
        success: { text: '第一个开口的是阿鸾。她说：别挡，要进。然后他们都笑了。', effects: { attr: { empathy: 4, mood: 5 }, psyche: { suppression: -5, selfWorth: 2, trust: 2 }, tags: ['和他们和解了'] } },
        fail: { text: '你走过去，滩涂上什么都没有。你在梦里哭了一场。', effects: { attr: { mood: -2 }, psyche: { suppression: 3 } } },
      },
      {
        label: '站在原地，逐个叫出他们的名字',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你一个一个叫。叫到第六个的时候，你醒了，脸上是干的。', effects: { attr: { will: 3, mood: 2 }, tags: ['叫过他们的名字'] } },
        fail: { text: '你叫到一半忘了最后一个人的名字。你一直没想起来。', effects: { attr: { mood: -3 } } },
      },
    ],
  },

  {
    id: 'cb_eld_018',
    stage: 'elder',
    title: '最后的雨',
    text: '你躺在诊所的床上，窗户开着一条缝。外面在下雨，是那种已经不太酸的雨。\n锈带的孩子从窗下跑过，一边跑一边唱着一首不知道从哪传下来的歌。',
    require: { age: [80, 120] },
    choices: [
      {
        label: '听他们把歌唱完',
        check: { attr: 'reverie', dc: DC.hard },
        success: { text: '你听出来了——那是母亲当年哼到一半忘了词的那个调子。你把它哼完了。', effects: { attr: { reverie: 4, mood: 5 }, psyche: { suppression: -5, selfWorth: 3 }, tags: ['哼完了那个调子'] } },
        fail: { text: '孩子们跑远了。你只记住了一句。', effects: { attr: { mood: 2 }, tags: ['记住了一句'] } },
      },
      {
        label: '把手伸出窗外，接一点雨',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '雨落在手上，是凉的。像另一只手。', effects: { attr: { empathy: 3, mood: 4 }, tags: ['接住了雨'] } },
        fail: { text: '手抬起来又落回去了。你已经没力气伸到窗外。', effects: { attr: { mood: 1 } } },
      },
      {
        label: '把手贴在窗框上，数他们跑过的脚步震',
        require: { caps: ['deaf'] },
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '七个孩子，跑过去又跑回来。你数出其中一个跛着左腿。', effects: { attr: { perception: 2, mood: 2 }, tags: ['数过脚步'] } },
        fail: { text: '雨点把震动全盖住了。你数到第三个就停了。', effects: { attr: { mood: 1 } } },
      },
    ],
  },

  /* —— 活到老年的回报（once: false，可反复触发）：安稳过日子的人才有人端汤、有人报平安 —— */
  {
    id: 'cb_eld_019',
    stage: 'elder',
    title: '六点',
    text: '你六点还是醒。铺子早交给了别人，你只是每天去坐一会儿，看他们怎么接客人。\n有人拿旧型号的件来问，只有你知道它在哪个抽屉里。',
    require: { age: [61, 79], tags: ['小生意', '锈牙帮', '义体化'] },
    once: false,
    weight: 2,
    choices: [
      {
        label: '手把手教他们认件',
        check: { attr: 'ingenuity', dc: DC.easy },
        success: { text: '你把抽屉的顺序讲了一遍，又讲了一遍。第三遍的时候他们记住了。', effects: { attr: { health: 2, vitality: 2, ingenuity: 1, mood: 1 } } },
        fail: { text: '你讲到年轻时的某个冬天，忘了本来要说什么。', effects: { attr: { health: 1, vitality: 1, mood: -1 } } },
      },
      {
        label: '什么都不管，坐在门口',
        check: { attr: 'will', dc: DC.easy },
        success: { text: '你坐了一上午，来往的人都跟你点头。中午有人给你端来一碗汤。', effects: { attr: { health: 2, vitality: 1, mood: 2 } } },
        fail: { text: '你坐到中午就走了。回去的路上腿有点沉。', effects: { attr: { vitality: 1 } } },
      },
    ],
  },

  {
    id: 'cb_eld_020',
    stage: 'elder',
    title: '最里面的椅子',
    text: '锈牙的人在铺子最里面给你留了一张椅子，没人坐，也没人动它。\n每年入冬，他们把新收的人带过来，叫一声叔。',
    require: { age: [61, 79], tags: ['小生意', '锈牙帮', '义体化'] },
    once: false,
    weight: 2,
    choices: [
      {
        label: '给他们讲讲当年那条巷子',
        check: { attr: 'empathy', dc: DC.easy },
        success: { text: '你只讲了三件事，都是别人的事。他们听完，把那把椅子擦了一遍。', effects: { attr: { health: 1, vitality: 2, empathy: 2, mood: 2 } } },
        fail: { text: '你讲到一半，发现名字记混了。他们没纠正你。', effects: { attr: { health: 1, vitality: 1, mood: -1 } } },
      },
      {
        label: '只说一句：这条街别乱来',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '他们点头。那年冬天，这条巷子一件案子都没有。', effects: { attr: { health: 2, vitality: 2, will: 1, mood: 1 } } },
        fail: { text: '你说完就咳嗽起来，后面的话没说完。', effects: { attr: { health: 1, vitality: 1 } } },
      },
    ],
  },

  {
    id: 'cb_eld_021',
    stage: 'elder',
    title: '脚步声',
    text: '来的人不用报名。你听得出谁的鞋底是软胶，谁的义腿里有颗松了的螺丝。\n诊所的门开了又关，你坐在里面，一个都没认错过。',
    require: { caps: ['blind'], age: [65, 82] },
    choices: [
      {
        label: '先开口，叫出来人的名字',
        check: { attr: 'perception', dc: DC.hard },
        success: { text: '你叫对了七个。第八个站在门口没动，是没见过的人。', effects: { attr: { perception: 2, mood: 2 }, tags: ['听脚步认人'] } },
        fail: { text: '你把两个人认混了。他们笑了笑，没纠正你。', effects: { attr: { mood: -1 } } },
      },
      {
        label: '让进门的人先握一下你的手腕',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '你按手腕的粗细给他们编号，谁也没占谁的号。', effects: { attr: { empathy: 2, perception: 1 }, tags: ['听脚步认人'] } },
        fail: { text: '有两个人的手腕一样细。你到晚上才分开他们。', effects: { attr: { empathy: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_eld_022',
    stage: 'elder',
    title: '高处',
    text: '海平面又涨了。征收队的迁移通知写着：迁往城南高地。\n迁移车的门是斜的，你的轮子是横的，进不去。',
    require: { caps: ['wheelchair'], age: [68, 88] },
    choices: [
      {
        label: '把椅子的轮距改窄，自己挤进车门',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '你改了两天。车来的时候，你自己上去的。', effects: { attr: { ingenuity: 2, will: 1 }, money: -10000, tags: ['自己上车'] } },
        fail: { text: '改窄之后椅子不稳，你从坡上滑下来，断了一根肋骨。', effects: { attr: { health: -2 }, money: -10000 } },
      },
      {
        label: '找巷子里的年轻人抬你上去',
        check: { attr: 'empathy', dc: DC.hard },
        success: { text: '四个人抬着你上车，到了城南，把你放在坡道口。', effects: { attr: { empathy: 2, mood: 1 }, tags: ['有人抬过你'] } },
        fail: { text: '来的只有两个人。椅子卡在门口，司机按了三次喇叭。', effects: { attr: { mood: -2 } } },
      },
    ],
  },
];
