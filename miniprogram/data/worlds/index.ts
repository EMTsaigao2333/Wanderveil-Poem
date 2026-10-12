/**
 * 世界库注册表
 * 新增世界时：在 worlds/ 下建文件夹 → 写好 index.ts 导出 WorldPack → 在此登记。
 */

import type { WorldPack } from '../../engine/schema';
// ⚠ 必须写全 './cyberpunk/index'，不能写 './cyberpunk'：
// DevTools 的 TS 编译不做「目录 → index」解析，运行时按 data/worlds/cyberpunk.js 找模块会直接报
// 「module is not defined」（2026-10-10 P2 启用本注册表时爆出的编译事故，见 PROJECT_SYNC 2026-10-12）。
// 新增世界时同样写 './<worldId>/index'。
import { cyberpunkPack } from './cyberpunk/index';

export const WORLDS: Record<string, WorldPack> = {
  cyberpunk: cyberpunkPack,
};

/** 世界列表（首页展示用） */
export const WORLD_LIST: WorldPack[] = Object.values(WORLDS);
