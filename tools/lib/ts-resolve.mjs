// 幻行诗篇 · ESM resolve hook
// 把无扩展名的相对导入补成 .ts，让 Node 原生 TS 剥离（Node 24 默认开启）能直接跑项目引擎。
// 例：engine 里 `import { x } from './schema'` → 解析为 './schema.ts'。
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
    try {
      return await nextResolve(specifier + '.ts', context);
    } catch (e) {
      // 回落：交给默认解析（例如目录 / index.ts 的情况）
    }
  }
  return nextResolve(specifier, context);
}