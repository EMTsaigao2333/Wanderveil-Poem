# tools/ · 数据校验与批量模拟

> 建立背景：项目历次都声称「tsc 全绿 + N 项断言 + 480 局批量模拟」通过了，但它们**一个都没留在仓库里**，
> 结果是一个严重的数值缺陷（寿命档位失效）漏到了今天。本目录把「观察能力」固化进仓库。
>
> 依赖：**零 npm 依赖**。靠 Node 24 原生 TS 类型剥离 + `tools/lib/ts-resolve.mjs` 这个 ESM resolve hook，
> 让 Node 能直接 `import` 项目里的 `.ts`（`miniprogram/engine/` 是纯 TypeScript，可在 Node 里直接跑）。

## 目录

```
tools/
├─ lib/
│  ├─ load-ts.mjs     可复用的 TS 加载器（import 即注册 resolve hook）
│  └─ ts-resolve.mjs  ESM resolve hook：把无扩展名的相对导入补成 .ts
├─ validate-data.mjs  数据契约校验（15 项）
├─ simulate.mjs       批量模拟 + 对照文档目标的断言
└─ README.md          本文件
```

## 运行方式

```bash
node tools/validate-data.mjs                 # 数据契约校验（等价 npm run validate）
node tools/simulate.mjs --runs 480           # 批量模拟（等价 npm run simulate）
node tools/simulate.mjs --runs 96 --strategy life   # 按「活法」策略分五档
node tools/simulate.mjs --runs 100 --system classic5 --strategy first
```

`simulate.mjs` 参数：

| 参数 | 取值 | 说明 |
|---|---|---|
| `--runs` | 默认 480 | 局数。`--strategy life` 时是**每档**局数（共 5 档） |
| `--system` | `heart6`（默认）/ `classic5` / `roulette` | 属性系统 |
| `--strategy` | `random`（默认）/ `first` / `life` | 随机选 / 永远选第一项 / 按「活法」经营 |

**退出码约定**：0 = 全部通过；1 = 有断言不通过。两个脚本的断言都**不允许为了让脚本通过而放宽**。

## 1. `validate-data.mjs` — 数据契约校验

直接 `import` 真实数据结构（`WorldPack` / `TraitPool`）做校验，不是扫源码文本。
15 项检查：事件 id 唯一与命名、特质引用完整、标签/能力引用闭合、语义键与心理状态量键合法、
「不得所有选项都被门槛挡掉」硬规则、带 check 的选项必须有 success+fail、stage 与 require.age 不矛盾、
crit 只在 major 上、death 不在 success 分支、years 1~5、正文 40~80 字、特质/事件标签命名空间不混用。
另输出统计：各阶段事件数、DC 分布、语义键与心理状态量使用频次、标签产出/消费比。

**当前实测：✔ 全部 15 项通过（退出码 0）**。数据层是干净的。

统计快照（2026-10-08）：事件 161 条 · 特质去重后 259 条 · DC 分布 DC10 32 / DC13 109 / DC16 125 / DC19 48 ·
标签产出 476 种、被 require 消费 49 种（427 种产出后从未被消费）。

> 两点说明：
> 1. `money` 量级只**报数不判失败**：文档写「壮年起 ±500」，事件库实际最大 ±800,000（138 处里 135 处超标）。
>    这是已记录在案的数值尺度问题（`_audit/修改清单.md` 决策 D3），等拍板后再决定按新尺度缩放还是改文档。
> 2. 早期文本探针（`_audit/_scratch/crosscheck.js`）只看单行 `require: {…}`，会漏掉多行写法；
>    本脚本用真实数据结构遍历，因此补上了「标签来源」的第三路：**开局背景包**（如「欠雨水税」只从 `world.ts` 的 `backgrounds[].tags` 来）。

## 2. `simulate.mjs` — 批量模拟

按 `_audit/_scratch/probe4.mjs` 的「活法」打法固化：跑完整局，输出
寿命分布（最小 / p25 / 中位 / p75 / 最大）、死因分布、检定成功率、属性饱和度（中位 / p90 / 贴顶比例），
并把**实测值 vs 文档目标值并排**打印。

断言依据 `docs/design/01-heart6-spec.md` §6.1 的四条寿命档位：**40 / 55 / 60 / 65+**（容差 ±3 岁）。

### ⚠ 当前断言是**失败的**，这是正确且预期的行为

2026-10-08 实测（`--strategy life`，每档 96 局）：

| 档位 | 文档目标 | 实测中位 | 偏差 | 结论 |
|---|---|---|---|---|
| 普通（不刻意经营） | 40 ±3 | **69** | +29 | ✘ |
| 只立住帮派 | 55 ±3 | **69** | +14 | ✘ |
| 只立住小生意 | 55 ±3 | **69** | +14 | ✘ |
| 帮派＋小生意 | 60 ±3 | **69** | +9 | ✘ |
| 帮派＋小生意＋义体化 | 65 往后 | **70** | +5 | ✔ |

- 原因：寿命衰减曲线（`TIME_DRIFT`）把五档策略的中位数全部压在 68~70，「活法」只体现在 **p25 左尾的早死概率**（普通档 p25=39，经营档 p25=68），而不是「能活多久」。
- 同批模拟还复现了另外两个已记录缺陷：**97%+ 的死亡显示同一句兜底文案**、**heart6 属性饱和度中位 97%（贴顶比例 56%）**。
- 随机/第一项打法同样中位 **69**（对照普通档），检定成功率 76.1%。
- **修复方向**：等数值决策 **D1 属性值域 / D2 难度基线 / D3 金钱尺度 / D4 寿命档位**（`_audit/修改清单.md`）拍板后再校准；校准必须在 D1/D2 之后做，否则会白做。
- 校准相关文档：`docs/design/01-heart6-spec.md` §6.3、`docs/design/10-outcome-and-attribute-rebalance.md`、`docs/design/09-fatality-and-consequence.md`。

## 3. 与 `_audit/_scratch/` 的关系

`_audit/` 是 2026-10-08 审查时的一次性探针脚本与报告（**非正式文档、不入库**，见 `.gitignore`）。
本目录是那批脚本里**值得长期保留的部分**的固化版：

| 历史脚本 | 归宿 |
|---|---|
| `register.mjs` + `ts-resolve.mjs` | → `tools/lib/`（可复用加载器） |
| `crosscheck.js` / `gating.js` / `recheck.js` / `moneycheck.js` / `tagnamespace.js` | → `tools/validate-data.mjs` |
| `probe4.mjs`（活法分档） | → `tools/simulate.mjs` |
| 其余探针（curvecheck / trpgcheck / failcheck / probe / dcsolve / desatcheck …） | 保留在 `_audit/_scratch/` 作为历史证据，未删除 |

## 4. 项目规则

- 改 `miniprogram/data/` 之后**必须**跑 `node tools/validate-data.mjs` 通过（见 PROJECT_SYNC.md 第 6 节）。
- **不要为了让断言通过而放宽断言值或篡改文档目标值**。实测与文档不符时如实报告，交人决策。