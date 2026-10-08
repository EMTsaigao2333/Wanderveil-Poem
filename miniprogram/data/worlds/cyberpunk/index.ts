/**
 * 世界：赛博朋克 · 雾港 —— 聚合导出
 * 引擎只认本文件导出的 WorldPack。
 */

import type { WorldPack } from '../../../engine/schema';
import { worldMeta } from './world';
import { events as childhood } from './childhood';
import { events as teen } from './teen';
import { events as youth } from './youth';
import { events as prime } from './prime';
import { events as middle } from './middle';
import { events as elder } from './elder';

export const cyberpunkPack: WorldPack = {
  meta: worldMeta,
  events: [...childhood, ...teen, ...youth, ...prime, ...middle, ...elder],
};

export default cyberpunkPack;
