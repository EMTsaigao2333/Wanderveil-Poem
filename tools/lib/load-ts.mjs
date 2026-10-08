/**
 * 幻行诗篇 · TS 加载器（tools/lib/load-ts.mjs）
 *
 * 作用：让 tools/ 下的脚本能直接 import 项目里的 .ts 源码，
 * 而无需安装任何 npm 依赖（node_modules 为零）。
 *
 * 原理：Node 24 默认开启「原生 TS 类型剥离」，加上本目录的 ts-resolve.mjs
 * （ESM resolve hook，把 engine 里无扩展名的相对导入补成 .ts）。
 *
 * 用法：
 *   import { loadProject } from './lib/load-ts.mjs';       // import 即完成 hook 注册
 *   const { startRun } = await loadProject('miniprogram/engine/story-engine.ts');
 *
 * ⚠ 注意：hook 必须在本模块「求值之后」才能生效，所以项目 .ts 一律用
 *   动态 import（loadProject）加载，不要写成顶层静态 import。
 *   历史脚本用的是 `node --import ./register.mjs xxx.mjs`，本加载器把
 *   那一步内化，从而 `node tools/xxx.mjs` 就能直接跑。
 */

import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const HOOK_PATH = path.join(import.meta.dirname, 'ts-resolve.mjs');
register(pathToFileURL(HOOK_PATH).href);

/** 项目根目录（tools/lib/ → 上两级） */
export const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..');

/**
 * 加载项目内的一个模块（相对项目根目录的路径，含 .ts 扩展名）。
 * @param {string} relPath 例：'miniprogram/engine/story-engine.ts'
 */
export function loadProject(relPath) {
  return import(pathToFileURL(path.join(PROJECT_ROOT, relPath)).href);
}

/**
 * 非小程序环境：显式声明全局 wx 不存在，让引擎的存储适配层
 * 回落到内存实现（批量模拟 / 校验都在 Node 里跑，不碰真机存档）。
 */
export function silenceWx() {
  globalThis.wx = undefined;
}