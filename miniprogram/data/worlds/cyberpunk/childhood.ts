/**
 * 世界：赛博朋克 · 雾港 —— 幼年（0-6）
 */

import type { LifeEvent } from '../../../engine/schema';
import { DC } from '../../../engine/schema';

export const events: LifeEvent[] = [
  {
    id: 'cb_child_001',
    stage: 'childhood',
    title: '第一次呼吸',
    text: '你出生在桁架区一间挂着「助产 · 义体 · 分期」灯箱的屋子里。\n接生婆用消过毒但没换过的钳子剪断脐带，抬头对母亲说：孩子心肺没问题，可以不用换。',
    require: { age: [0, 1] },
    effects: { attr: { vitality: 1 }, tags: ['原生心肺'] },
  },

  {
    id: 'cb_child_002',
    stage: 'childhood',
    title: '雨声',
    text: '你最早的记忆不是画面，是声音——酸雨打在铁皮棚顶，一整夜像有人在数钱。\n多年后你在任何地方听见这种节奏，都会先想起雾港。',
    require: { age: [1, 3] },
    effects: { attr: { perception: 1 }, tags: ['雨声刻进记忆'] },
  },

  {
    id: 'cb_child_003',
    stage: 'childhood',
    title: '母亲的手',
    text: '母亲抱你的时候，右边那只手总是凉的。那是沧溟重工的二手货，关节缝里会漏出一点淡蓝色的液压油。\n她总是用左边的手摸你的脸。',
    require: { age: [3, 5] },
    choices: [
      {
        label: '抓住那只凉手，翻过来看',
        check: { attr: 'perception', dc: DC.easy },
        success: { text: '你在她的掌纹里看见了编号 C-7734。', effects: { attr: { perception: 2 }, tags: ['记得那个编号'] } },
        fail: { text: '她把手抽回去了，很快。', effects: { attr: { mood: -1, perception: 1 } } },
      },
      {
        label: '抱住她的脖子，不管哪只手',
        check: { attr: 'empathy', dc: DC.easy },
        success: { text: '她愣了很久，才把左手放上来。', effects: { attr: { empathy: 2, mood: 2 } } },
        fail: { effects: { attr: { empathy: 1, mood: 1 } } },
      },
    ],
  },

  {
    id: 'cb_child_004',
    stage: 'childhood',
    title: '义体玩具',
    text: '邻居家的孩子有一只会自己走路的机械狗。你只有半截从废船坞捡来的义体手臂，指节还能动。\n你把它当成一只很安静的朋友，每天喂它雨水。',
    require: { age: [4, 6] },
    choices: [
      {
        label: '把它拆开，看看里面是什么',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '你在关节里找到一枚还能用的微型陀螺仪。', effects: { attr: { ingenuity: 2 }, tags: ['会拆义体'] } },
        fail: { text: '装不回去了。你把它抱在怀里坐了一下午。', effects: { attr: { mood: -2, ingenuity: 1 } } },
      },
      {
        label: '一直留着它，不拆',
        check: { attr: 'will', dc: DC.easy },
        success: { effects: { attr: { will: 1, mood: 1 }, tags: ['舍不得丢东西'] } },
        fail: { text: '三年后它被人当废铁卖掉了。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_child_005',
    stage: 'childhood',
    title: '飞艇上的脸',
    text: '寰宇生物的宣传飞艇每晚七点从锈带上方经过，把一张巨大的、笑着的脸投在云层上。\n「您的第二个心脏，正在生产中。」\n母亲每次都抬头看，看得很认真。',
    require: { age: [4, 6] },
    choices: [
      {
        label: '问母亲：我们能不能也换一个',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '她说：能。等你长大。', effects: { attr: { empathy: 1 }, tags: ['被许过愿'] } },
        fail: { text: '她没回答，只是把你按回屋里。', effects: { attr: { perception: 1, mood: -1 } } },
      },
      {
        label: '朝那张脸吐口水',
        check: { attr: 'will', dc: DC.easy },
        success: { text: '口水落进雨水里，你觉得自己赢了。', effects: { attr: { will: 2 }, tags: ['从小不服气'] } },
        fail: { text: '被母亲照着后脑勺拍了一下。', effects: { attr: { will: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_child_006',
    stage: 'childhood',
    title: '锈带托儿所',
    text: '托儿所是一间改过的集装箱，收十二个孩子，两个看护，一个坏了的空气循环机。\n今天有个孩子被企业保安带走，说是「编号登记有误」。他的小板凳空了，谁也没敢去坐。',
    require: { age: [5, 6] },
    choices: [
      {
        label: '去坐那张空板凳',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你坐下来，一整个下午没有人敢看你。', effects: { attr: { will: 3 }, psyche: { resilience: 1 }, tags: ['不肯装作没看见'] } },
        fail: { text: '看护把你拽起来，压低声音骂你傻。', effects: { attr: { will: 1, mood: -2 }, psyche: { suppression: 1, selfWorth: -1 } } },
      },
      {
        label: '把小板凳藏到集装箱后面',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '没人发现。你觉得他还在。', effects: { attr: { ingenuity: 2, mood: 1 } } },
        fail: { text: '被发现了，看护拿它打你手心。', effects: { attr: { health: -1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_child_007',
    stage: 'childhood',
    title: '酸雨',
    text: '雨突然大了，你在巷子里跑不快。第一滴酸雨落在手背上，像被烟头烫了一下。\n前面五十米有个屋檐，后面十米是母亲刚买回来的塑料布。',
    require: { age: [5, 6], chance: 0.5 },
    choices: [
      {
        label: '冲进屋檐，塑料布不要了',
        check: { attr: 'vitality', dc: DC.normal },
        success: { text: '你冲进去了，只湿了后背。', effects: { attr: { vitality: 2 } } },
        fail: { text: '手背烧出了一个月牙形的疤。', effects: { attr: { health: -2 }, tags: ['手背的疤'] } },
      },
      {
        label: '回头抢那块塑料布，母亲会更需要它',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你把塑料布抱回来了，像抱一件盔甲。', effects: { attr: { will: 2, health: -1 }, tags: ['先想别人'] } },
        fail: { text: '塑料布被雨烧穿了，你也烧伤了脚踝。', effects: { attr: { health: -3 }, tags: ['脚踝旧伤'] } },
      },
      {
        label: '不跑，把塑料布全盖在腿上，用椅背挡雨',
        require: { caps: ['wheelchair'] },
        check: { attr: 'health', dc: DC.normal },
        success: { text: '雨烧穿了布，没烧到人。轮辐坏了两根。', effects: { attr: { health: 1 }, money: -200, tags: ['自己盖的塑料布'] } },
        fail: { text: '布太薄。手背烧出一个月牙形的疤，椅面也熔了一块。', effects: { attr: { health: -2, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_child_008',
    stage: 'childhood',
    title: '神经贴片',
    text: '你睡不着，母亲从抽屉里摸出一片神经贴片，贴在你耳后。\n嗡的一声，你听见一个女人在唱摇篮曲——很温柔，但歌词是某种蛋白粉的配料表。',
    require: { age: [4, 6] },
    choices: [
      {
        label: '跟着唱配料表',
        check: { attr: 'reverie', dc: DC.easy },
        success: { text: '你把它唱成了自己的歌。', effects: { attr: { reverie: 2, mood: 1 }, tags: ['心里有自己的歌'] } },
        fail: { text: '你唱错了一个词，广告立刻循环重播了七遍。', effects: { attr: { mood: -1, reverie: 1 } } },
      },
      {
        label: '撕下来，塞进母亲的口袋',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '第二天早上，母亲在黑眼圈里对你笑。', effects: { attr: { empathy: 2, mood: 1 } } },
        fail: { text: '贴片粘住了她的指缝，你们花了半个早上分开它。', effects: { attr: { empathy: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_child_009',
    stage: 'childhood',
    title: '会叫的义体猫',
    text: '一只流浪的义体猫钻进你家，背上有一块被烧穿的太阳能板，叫起来像收音机调台。\n它在你脚边躺了三天，第四天开始，你发现它会在特定的人经过时叫。',
    require: { age: [5, 6] },
    choices: [
      {
        label: '观察它到底在对谁叫',
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '只对挂着慧眼数据工牌的人叫。', effects: { attr: { perception: 3 }, tags: ['认得征收员'] } },
        fail: { text: '你看了两天，什么也没看出来。', effects: { attr: { perception: 1 } } },
      },
      {
        label: '把它抱进屋，藏起来',
        check: { attr: 'empathy', dc: DC.easy },
        success: { effects: { attr: { empathy: 2, mood: 2 }, tags: ['养过一只猫'] } },
        fail: { text: '它咬了你一口，跳窗跑了。', effects: { attr: { health: -1, mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_child_010',
    stage: 'childhood',
    title: '雨夜的歌',
    text: '停电的夜里，整条巷子都黑着。有人在很远的地方弹一把断了两根弦的琴。\n母亲跟着哼，哼到一半忘了词，就笑着哼下去。',
    require: { age: [4, 6] },
    effects: { attr: { mood: 3, reverie: 1 }, tags: ['记得那个调子'] },
  },

  {
    id: 'cb_child_011',
    stage: 'childhood',
    title: '债单',
    text: '门缝下塞进来一张纸，比上个月厚。上面写着：欠雨水税 ¥4,120，逾期 19 个月。\n「逾期第 24 个月，将启动住户清退程序。」母亲把它折起来，垫在了桌脚下。',
    require: { age: [5, 6] },
    choices: [
      {
        label: '把那张纸抽出来，读给她听',
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '你念到「清退」两个字时，她停下了手里的活。', effects: { attr: { perception: 2 }, tags: ['知道家里的数'] } },
        fail: { text: '你认不全那些字，念得磕磕巴巴。', effects: { attr: { perception: 1 }, tags: ['识字晚'] } },
      },
      {
        label: '再拿一张纸垫上去，让桌子更稳',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '她看了你一眼，什么都没说，去洗碗了。', effects: { attr: { empathy: 2, mood: 1 } } },
        fail: { text: '你垫歪了，桌上的碗摔了一只。', effects: { attr: { mood: -2 } } },
      },
    ],
  },

  {
    id: 'cb_child_012',
    stage: 'childhood',
    title: '粥棚',
    text: '白噪音教团在桥墩下设了粥棚，一勺粥，一句「调音」。\n排在你前面的老人在接过碗时哭了，他说他听见了死去的妻子在频道里叫他。',
    require: { age: [5, 6] },
    choices: [
      {
        label: '认真听那位调音师说话',
        check: { attr: 'reverie', dc: DC.normal },
        success: { text: '你真的听见了——一种很低的、像心跳的嗡鸣。', effects: { attr: { reverie: 3 }, tags: ['与白噪音共振'] } },
        fail: { text: '你什么也没听见，只觉得很饿。', effects: { attr: { reverie: 1, mood: -1 } } },
      },
      {
        label: '只要粥，不抬头',
        check: { attr: 'will', dc: DC.easy },
        success: { effects: { attr: { will: 2, health: 1 } } },
        fail: { text: '调音师按住你的头顶，念了很久。', effects: { attr: { reverie: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_child_013',
    stage: 'childhood',
    title: '捡到的义眼',
    text: '排水沟里躺着一只义眼，玻璃外壳裂了一道缝，但镜头还会偶尔转一下。\n装它的人也许还活着，也许不。它记得的东西，现在只有它自己知道。',
    require: { age: [5, 6], chance: 0.6 },
    choices: [
      {
        label: '试着把它接到家里的旧接口上',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '屏幕上闪过一个地址，和半张脸。', effects: { attr: { ingenuity: 3 }, tags: ['看过一只义眼里的东西'] } },
        fail: { text: '接口烧了，家里跳闸，母亲赔了三天工钱。', effects: { attr: { ingenuity: 1, mood: -2 }, money: -50 } },
      },
      {
        label: '把它埋进船坞的沙子里',
        check: { attr: 'empathy', dc: DC.normal },
        success: { effects: { attr: { empathy: 2, mood: 1 }, tags: ['会给东西办葬礼'] } },
        fail: { text: '你埋完又挖出来了，舍不得。', effects: { attr: { empathy: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_child_014',
    stage: 'childhood',
    title: '被抢',
    text: '三个比你高的孩子堵在巷口，要你交出母亲给的十信用点。\n他们其中一个人的右手是新装的，还没学会怎么握拳。',
    require: { age: [5, 6], chance: 0.5 },
    choices: [
      {
        label: '把点数给他们',
        check: { attr: 'perception', dc: DC.easy },
        success: { text: '你记住了他们每个人鞋子的样子。', effects: { attr: { perception: 2, mood: -1 }, tags: ['记住仇人的鞋'] } },
        fail: { effects: { attr: { mood: -2, will: 1 }, psyche: { suppression: 2, selfWorth: -1 } } },
      },
      {
        label: '朝那只新手臂撞过去',
        check: { attr: 'vitality', dc: DC.hard },
        success: { text: '他疼得叫出声——接口还没长好。你跑了。', effects: { attr: { vitality: 3 }, tags: ['打过一场架'] } },
        fail: { text: '你被按在雨水里，脸蹭破了。', effects: { attr: { health: -2, will: 1 }, psyche: { suppression: 2 } } },
      },
    ],
  },

  {
    id: 'cb_child_015',
    stage: 'childhood',
    title: '第一次发烧',
    text: '你烧到三十九度八。母亲抱着你，在雨中走了两公里去锈带的诊所。\n诊所的老范翻了翻你的眼皮，说：普通感冒，也可能不是。要不要做个扫描？要钱。',
    require: { age: [3, 6] },
    choices: [
      {
        label: '让母亲做扫描',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '扫描结果正常。母亲在走廊上坐了很久才进来。', effects: { attr: { will: 2, mood: 1 }, money: -200 } },
        fail: { text: '报告要等三天，你们拿不出押金。', effects: { attr: { mood: -2 }, money: -50 } },
      },
      {
        label: '说不用，回家睡一觉就好',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '你替家里省下了那笔钱。她抱着你哭了一路。', effects: { attr: { empathy: 3 }, money: 0, tags: ['早熟'] } },
        fail: { text: '烧了五天才退，之后你一直比别人容易累。', effects: { attr: { health: -3 }, tags: ['底子薄'] } },
      },
    ],
  },

  {
    id: 'cb_child_016',
    stage: 'childhood',
    title: '观景窗',
    text: '桁架区最高的那层有一面观景窗，投一枚信用点就能看三十秒云台区。\n玻璃里，孩子们在真正的草地上跑。你数了一下，一共十一个，没有人穿打补丁的衣服。',
    require: { age: [5, 6] },
    choices: [
      {
        label: '把三天的早饭钱都投进去',
        check: { attr: 'will', dc: DC.normal },
        success: { text: '你看满了一分半钟，把每个孩子的样子都记住了。', effects: { attr: { will: 2, mood: 1 }, money: -30, tags: ['见过云台'] } },
        fail: { text: '第二枚点数卡住了，玻璃黑了下去。', effects: { attr: { mood: -2 }, money: -30 } },
      },
      {
        label: '转身走开，回去帮母亲糊纸盒',
        check: { attr: 'empathy', dc: DC.easy },
        success: { effects: { attr: { empathy: 2, vitality: 1 }, money: 20 } },
        fail: { text: '你在窗边站了很久，回家时天已经黑了。', effects: { attr: { mood: -1 } } },
      },
      {
        label: '不投币，请旁边的人讲，自己在脑子里把草地拼出来',
        require: { caps: ['blind'] },
        check: { attr: 'reverie', dc: DC.normal },
        success: { text: '你拼出来的草地比他们看见的还大。', effects: { attr: { reverie: 2 }, tags: ['自己拼过云台'] } },
        fail: { text: '你拼到一半就乱了，草地的边和天空的边叠在一起。', effects: { attr: { reverie: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_child_017',
    stage: 'childhood',
    title: '床底的罐子',
    text: '你从床底拖出一个铁罐，里面装着十二枚记忆胶囊，每枚上面贴着一个手写的名字。\n母亲冲进来把罐子抢走了，说是别人的东西，不许碰。她的声音在抖。',
    require: { age: [5, 6], chance: 0.6 },
    choices: [
      {
        label: '趁她不在，偷偷看一枚',
        check: { attr: 'ingenuity', dc: DC.hard },
        success: { text: '你看见一个陌生男人在教一个孩子骑车。那不是你。', effects: { attr: { ingenuity: 2, perception: 1, mood: -2 }, psyche: { suppression: 2, trust: -1 }, tags: ['看过别人的记忆'] } },
        fail: { text: '胶囊卡在播放器里，烧了。母亲没有打你，只是不说话。', effects: { attr: { mood: -3 }, psyche: { suppression: 2, trust: -1 } } },
      },
      {
        label: '什么都不问，把罐子推回床底',
        check: { attr: 'will', dc: DC.normal },
        success: { effects: { attr: { will: 2 }, tags: ['明白有些事不该问'] } },
        fail: { text: '你整晚没睡，一直在想那十二个名字。', effects: { attr: { mood: -1, perception: 1 } } },
      },
    ],
  },

  {
    id: 'cb_child_018',
    stage: 'childhood',
    title: '父亲的金属臂',
    text: '家里墙上挂着一只金属臂，是父亲的。母亲说他在沧溟的深海矿场，等你七岁他就回来。\n你每年量一次自己的手臂，看什么时候能把它装满。',
    require: { age: [5, 6] },
    choices: [
      {
        label: '搬凳子把它取下来',
        check: { attr: 'vitality', dc: DC.hard },
        success: { text: '它比你想的重得多。你知道了那不是一个能回来的重量。', effects: { attr: { vitality: 2, will: 1 }, psyche: { suppression: 2, selfWorth: -1 }, tags: ['知道父亲回不来'] } },
        fail: { text: '它砸下来，压伤了你的脚趾，也砸碎了桌角。', effects: { attr: { health: -2, mood: -2 } } },
      },
      {
        label: '在下面画一条线，记下每年的身高',
        check: { attr: 'reverie', dc: DC.easy },
        success: { text: '墙上很快有了四条线，一年一条。', effects: { attr: { reverie: 2, mood: 1 }, tags: ['墙上刻着年轮'] } },
        fail: { effects: { attr: { reverie: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_child_019',
    stage: 'childhood',
    title: '调音师',
    text: '一个穿灰袍的人在门口站了很久，说你的名字在教团的册子上。\n「你的耳鸣不是病，是频道。孩子，你听得见世界在调音。」',
    require: { age: [5, 6], chance: 0.45 },
    choices: [
      {
        label: '跟着他念那句调音的口诀',
        check: { attr: 'reverie', dc: DC.hard },
        success: { text: '耳鸣停了七秒钟。那是你一生中最安静的七秒。', effects: { attr: { reverie: 3 }, tags: ['白噪音信徒', '记得七秒的安静'] } },
        fail: { text: '你念错了，耳鸣响了一整个月。', effects: { attr: { reverie: 1, health: -1 }, tags: ['耳鸣加重'] } },
      },
      {
        label: '关上门，告诉母亲不要让他进来',
        check: { attr: 'will', dc: DC.normal },
        success: { effects: { attr: { will: 2 }, tags: ['拒绝过教团'] } },
        fail: { text: '母亲却把他请进来了。他们聊到天亮。', effects: { attr: { mood: -2 }, tags: ['教团记名'] } },
      },
    ],
  },

  {
    id: 'cb_child_020',
    stage: 'childhood',
    title: '搬家',
    text: '征收队来了四个人，带着一台扫描器。他们说这条巷子要清空，做一个新的排水工程。\n所有能带走的东西，只有一个拉杆箱那么大。母亲让你自己选。',
    require: { age: [5, 6] },
    choices: [
      {
        label: '带上那只义体玩具手臂',
        check: { attr: 'empathy', dc: DC.normal },
        success: { text: '母亲看了一眼，没说重。她把它塞进了箱底。', effects: { attr: { empathy: 2, mood: 1 }, tags: ['带走了旧朋友'] } },
        fail: { text: '箱子关不上，它最后被留在了地上。', effects: { attr: { mood: -3 }, psyche: { suppression: 2, selfWorth: -1 } } },
      },
      {
        label: '带上父亲的金属臂，别的都留下',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你抱着它走了六公里，手臂磨出了血。', effects: { attr: { will: 3, health: -1 }, tags: ['抱过那只手臂'] } },
        fail: { text: '你抬不动，只能看着它被铲进瓦砾里。', effects: { attr: { mood: -3, will: 1 } } },
      },
    ],
  },

  {
    id: 'cb_child_021',
    stage: 'childhood',
    title: '雨靴',
    text: '商店橱窗里有一双防酸的雨靴，一百二十信用点。你的鞋底已经补过四次。\n雨靴旁边贴着告示：凭住户卡可分期，月付二十八，共六期。',
    require: { age: [5, 6], chance: 0.5 },
    choices: [
      {
        label: '让母亲分期买下来',
        check: { attr: 'ingenuity', dc: DC.normal },
        success: { text: '你算了一遍利息，说服母亲买了不分期的那双旧的。', effects: { attr: { ingenuity: 2, wealth: 1 }, money: -80, tags: ['会算账'] } },
        fail: { text: '分期合同签了，利息比靴子本身还贵。', effects: { attr: { wealth: -1, mood: -1 }, tags: ['第一笔贷款'] } },
      },
      {
        label: '说不要，旧鞋还能穿',
        check: { attr: 'will', dc: DC.easy },
        success: { effects: { attr: { will: 2, health: -1 }, money: 0 } },
        fail: { text: '母亲还是买了。你知道那笔钱是从哪省出来的。', effects: { attr: { mood: -2, health: 1 }, money: -120 } },
      },
    ],
  },

  {
    id: 'cb_child_022',
    stage: 'childhood',
    title: '她出门了',
    text: '六岁那年冬天，母亲接了一份桁架区夜班的活，说三天回来。\n她走的时候亲了你额头，左边的手。三天后，回来的是同一条巷子里的人，和一个信封。',
    require: { age: [6, 6] },
    choices: [
      {
        label: '拆开信封',
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '里面是三个月工钱，和一张写着「别找我」的便条。', effects: { attr: { perception: 2, will: 1 }, psyche: { suppression: 2, trust: -1 }, money: 300, tags: ['她走了'] } },
        fail: { text: '信封里只有钱。你不知道那是不是全部。', effects: { attr: { mood: -3 }, psyche: { suppression: 3, trust: -2, selfWorth: -1 }, money: 300, tags: ['她走了'] } },
      },
      {
        label: '不拆，把信封压在枕头下面',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你压在枕头下整整一年，直到字迹被汗浸花了。', effects: { attr: { will: 3, mood: -1 }, psyche: { suppression: 2, trust: -1 }, money: 300, tags: ['她走了', '不肯看信'] } },
        fail: { text: '第二天你就拆了，然后重新封好，假装没有。', effects: { attr: { mood: -2 }, psyche: { suppression: 2, trust: -1 }, money: 300, tags: ['她走了'] } },
      },
    ],
  },

  {
    id: 'cb_child_023',
    stage: 'childhood',
    title: '回声',
    text: '巷子两头都是铁皮，母亲不许你一个人出门。\n你学会了用一根铁钉敲栏杆：声音散出去的，前面是空的；声音折回来的，前面有东西。',
    require: { caps: ['blind'], age: [3, 6] },
    choices: [
      {
        label: '把整条巷子的回声敲一遍，记下来',
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '你记住了三十七处回声。从巷口到门口，不用人牵。', effects: { attr: { perception: 2, reverie: 1 }, tags: ['习惯了回声'] } },
        fail: { text: '你敲到一半，钉子被巡街的人收走了。', effects: { attr: { perception: 1, mood: -1 } } },
      },
      {
        label: '顺着墙一寸一寸摸过去',
        check: { attr: 'will', dc: DC.easy },
        success: { text: '你摸到墙上有一道裂缝，母亲把备用钥匙塞在里面。', effects: { attr: { will: 1, perception: 1 }, tags: ['摸得出墙缝'] } },
        fail: { text: '你摸了一整面墙，手上全是铁锈。', effects: { attr: { will: 1, mood: -1 } } },
      },
    ],
  },

  {
    id: 'cb_child_024',
    stage: 'childhood',
    title: '台阶',
    text: '锈带的巷子全是台阶，没有一条能让你自己上去。\n母亲用一辆废推车的轮子给你拼了一张椅子，从那以后，出门都要有人抬。',
    require: { caps: ['wheelchair'], age: [4, 6] },
    choices: [
      {
        label: '数出哪几处是斜的，自己能过',
        check: { attr: 'perception', dc: DC.normal },
        success: { text: '你找出九处能自己过的坡，剩下的记在心里。', effects: { attr: { perception: 2 }, tags: ['坡道认路'] } },
        fail: { text: '你数错了一处，连人带椅滑下两级。', effects: { attr: { health: -1, perception: 1 } } },
      },
      {
        label: '跟母亲说，你不用人抬',
        check: { attr: 'will', dc: DC.hard },
        success: { text: '你用手压着轮圈，自己上了三级。手心磨破了，后面的路是你的。', effects: { attr: { will: 2, vitality: 1 }, tags: ['自己上路'] } },
        fail: { text: '你撑到第二级手就滑了。母亲没说话，把你抱了上去。', effects: { attr: { will: 1, mood: -1 } } },
      },
    ],
  },
];
