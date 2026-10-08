/**
 * 风格样张 · 请求层 + 列表页逻辑工厂
 * 三个风格页共用同一套「分页 / 下拉刷新 / 上拉触底」逻辑，仅样式不同。
 */
const BASE_URL = 'http://127.0.0.1:3000';

export interface StyleItem {
  id: number;
  title: string;
  meta: string[];
  tag: string;
  variant: number;
}

interface ApiBody {
  code: number;
  message: string;
  data: { list: StyleItem[]; page: number; pageSize: number; total: number; hasMore: boolean };
}

function requestPage(style: string, page: number, pageSize: number): Promise<ApiBody['data']> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/api/items`,
      method: 'GET',
      data: { style, page, pageSize },
      success: (res) => {
        const body = res.data as ApiBody;
        if (body && body.code === 0) {
          resolve(body.data);
        } else {
          reject(new Error((body && body.message) || '接口返回异常'));
        }
      },
      fail: (err) => reject(new Error((err && err.errMsg) || '网络请求失败')),
    });
  });
}

export interface ListPageOptions {
  data: {
    list: StyleItem[];
    page: number;
    total: number;
    hasMore: boolean;
    loading: boolean;
    error: string;
  };
  onLoad(): void;
  onPullDownRefresh(): void;
  onReachBottom(): void;
  loadNext(reset: boolean): Promise<void>;
  retry(): void;
}

export function createListPage(style: string, pageSize = 6): ListPageOptions {
  return {
    data: { list: [], page: 0, total: 0, hasMore: true, loading: false, error: '' },

    onLoad() {
      this.loadNext(true);
    },

    loadNext: async function (this: any, reset: boolean) {
      if (this.data.loading) return;
      const nextPage = reset ? 1 : this.data.page + 1;
      this.setData({ loading: true, error: '' });
      try {
        const res = await requestPage(style, nextPage, pageSize);
        this.setData({
          list: reset ? res.list : this.data.list.concat(res.list),
          page: res.page,
          total: res.total,
          hasMore: res.hasMore,
          loading: false,
        });
      } catch (e: any) {
        this.setData({ loading: false, error: e.message || '未知错误' });
      }
    },

    onPullDownRefresh: async function (this: any) {
      await this.loadNext(true);
      wx.stopPullDownRefresh();
    },

    onReachBottom: function (this: any) {
      if (this.data.hasMore && !this.data.loading) {
        this.loadNext(false);
      }
    },

    retry: function (this: any) {
      this.loadNext(this.data.list.length === 0);
    },
  };
}
