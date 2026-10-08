/**
 * 世界库注册表
 * 新增世界时：在 worlds/ 下建文件夹 → 写好 index.ts 导出 WorldPack → 在此登记。
 */

import type { WorldPack } from '../../engine/schema';
import { cyberpunkPack } from './cyberpunk';

export const WORLDS: Record<string, WorldPack> = {
  cyberpunk: cyberpunkPack,
};

/** 世界列表（首页展示用） */
export const WORLD_LIST: WorldPack[] = Object.values(WORLDS);
