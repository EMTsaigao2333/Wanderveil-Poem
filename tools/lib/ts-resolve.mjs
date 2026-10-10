// 幻行诗篇 · ESM resolve hook（tools/lib/ts-resolve.mjs）
// 让 Node 原生 TS 剥离能解析项目里两种小程序写法：
//   ① 无扩展名的相对导入：`import { x } from './schema'` → './schema.ts'
//   ② 目录导入：`import { cyberpunkPack } from './cyberpunk'` → './cyberpunk/index.ts'
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
    try {
      return await nextResolve(specifier + '.ts', context);
    } catch (e) {
      // 继续尝试目录导入
    }
    try {
      return await nextResolve(specifier + '/index.ts', context);
    } catch (e) {
      // 回落：交给默认解析
    }
  }
  return nextResolve(specifier, context);
}