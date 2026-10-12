/**
 * 用微信开发者工具「自带」的 TypeScript 编译器跑真实类型检查
 *
 * 【为什么需要这个脚本】
 * 微信开发者工具内置的是 TypeScript 4.1.2，而仓库外用 npx 装的新版 tsc（5.x）
 * 能通过不代表 4.1.2 能通过 —— 2026-10-12 的教训：onboarding.ts 里一句
 * `{ mode: 'continue' } satisfies PendingStart`（satisfies 是 TS 4.9 语法）
 * 在两个编译器下都「全绿」，但在 DevTools 4.1.2 下直接 TS1005 语法错误、整包编译不过。
 * 因此验证规则是：**两个编译器都要跑**（npm run typecheck + npm run typecheck:devtools）。
 *
 * 用法：node tools/typecheck-devtools.mjs [tsconfig 路径，默认 miniprogram/tsconfig.json]
 * 退出码：0 = 通过；1 = 有错误；2 = 找不到 DevTools 的 TS
 *
 * ⚠ TS_LIB 路径里的用户数据哈希段（3a1dc043...）每台机器不同，
 *   找不到时会列出候选目录，按提示改 TS_CANDIDATES 或手动传入。
 */

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { createRequire } from 'node:module';

// 常见安装位置（WeappForeignPkgs 下的 mptslib 是 DevTools 内置的多版本 TS）
const TS_CANDIDATES = [
  path.join(os.homedir(), 'AppData', 'Local', '微信开发者工具', 'User Data', '3a1dc0430f139651f1a427416da02d6a', 'WeappForeignPkgs', 'mptslib', 'ts_4.1.2_5.2.3', 'lib'),
];

function findTsLib() {
  for (const dir of TS_CANDIDATES) {
    if (fs.existsSync(path.join(dir, 'typescript.js'))) return dir;
  }
  return null;
}

const TS_LIB = findTsLib();
if (!TS_LIB) {
  console.error('找不到微信开发者工具自带的 TypeScript。');
  console.error('请在 DevTools 安装目录 / 用户数据目录下搜索 mptslib，然后修改本文件顶部的 TS_CANDIDATES。');
  process.exit(2);
}
const require = createRequire(import.meta.url);
const ts = require(path.join(TS_LIB, 'typescript.js'));

const configPath = path.resolve(process.argv[2] || 'miniprogram/tsconfig.json');
const cfgDir = path.dirname(configPath);
const raw = ts.readConfigFile(configPath, ts.sys.readFile);
if (raw.error) {
  console.error('读 tsconfig 失败:', ts.flattenDiagnosticMessageText(raw.error.messageText, '\n'));
  process.exit(2);
}
const parsed = ts.parseJsonConfigFileContent(raw.config, ts.sys, cfgDir);
console.log('TypeScript 版本:', ts.version, '（微信开发者工具内置）');
console.log('配置文件:', configPath);
console.log('待检查文件数:', parsed.fileNames.length);
console.log('---');

const program = ts.createProgram(parsed.fileNames, parsed.options);
const diags = ts.getPreEmitDiagnostics(program);

if (diags.length === 0) {
  console.log('✅ 类型检查通过，0 个错误');
  process.exit(0);
}

// 只显示非 lib 文件的错误（skipLibCheck 已开，但保险起见）
const own = diags.filter((d) => {
  if (!d.file) return true;
  const f = d.file.fileName.replace(/\\/g, '/');
  return !/\/typings\//.test(f) && !/node_modules/.test(f);
});

console.log(`共 ${diags.length} 个诊断，其中项目自身文件 ${own.length} 个：\n`);
for (const d of own) {
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  if (d.file && d.start !== undefined) {
    const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
    const rel = path.relative(process.cwd(), d.file.fileName).replace(/\\/g, '/');
    console.log(`${rel}:${line + 1}:${character + 1}  TS${d.code}  ${msg}`);
  } else {
    console.log(`TS${d.code}  ${msg}`);
  }
}
process.exit(1);