/**
 * 开局向导 → 人生页的交接配置（storage 中转）。
 *
 * 注意：这个契约必须放在独立模块里，不能定义在任何页面文件中——
 * app.json 开了按需注入（lazyCodeLoading: requiredComponents），
 * 页面 JS 只有真正进入该页面时才注入，被其他文件 require 页面文件会报
 * 「module 'pages/xxx/xxx.js' is not defined」。
 */

import type { AttrSystemId } from '../engine/schema';
import type { RollResult } from '../engine/roulette';
import type { ContentPrefs } from '../data/traits/index';

export const PENDING_START_KEY = 'onboarding:pending';

export interface PendingStart {
  mode: 'continue' | 'new';
  attrSystem?: AttrSystemId;
  seed?: number;
  prefs?: ContentPrefs;
  name?: string;
  backgroundId?: string;
  /** 全随机模式：向导已抽好（可能已改写副线）的人物卡，开局原样带入 */
  roll?: RollResult;
}

/** 读取并清掉向导留下的交接配置 */
export function readPendingStart(): PendingStart | null {
  if (typeof wx === 'undefined' || typeof wx.getStorageSync !== 'function') return null;
  const v = wx.getStorageSync(PENDING_START_KEY) as PendingStart | '' | null | undefined;
  if (!v || typeof v !== 'object') return null;
  wx.removeStorageSync(PENDING_START_KEY);
  return v;
}
