Page({
  data: {
    styles: [
      {
        key: 'constructivism',
        name: '构成主义 Constructivism',
        desc: '红黑斜切 · 海报式标语 · 工业几何 —— 苏联先锋派的宣传能量',
        colors: ['#d62828', '#141414', '#2a4a7a', '#f4efe6'],
      },
      {
        key: 'papercraft',
        name: '纸艺拼贴 Papercraft',
        desc: '分层卡纸 · 剪切边缘 · 层间柔和投影 —— 手作绘本感',
        colors: ['#ff6b6b', '#2ec4b6', '#ffb703', '#fff8e7'],
      },
      {
        key: 'dadaism',
        name: '达达主义 Dadaism',
        desc: '剪贴字 · 报纸拼贴 · 反排版 —— 刻意的混乱与反艺术',
        colors: ['#eae6df', '#1a1a1a', '#cc3333', '#d4c55a'],
      },
    ],
  },

  go(e: WechatMiniprogram.TouchEvent) {
    const key = e.currentTarget.dataset.key as string;
    wx.navigateTo({ url: `/styletest/${key}/${key}` });
  },
});
