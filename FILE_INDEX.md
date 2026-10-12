# 文件索引（FILE_INDEX）

> **规则：AI 找文件先读本索引，再按索引打开具体文件，禁止盲目整读大文件。**
> 新增/修改/删除文件后必须同步更新本表。格式：`路径 — 说明 — 关键内容/导出 — 最近更新`

## 根目录

- `PROJECT_SYNC.md` — 项目同步文件（多 AI 协作总入口：决策/看板/交接日志/工作流规则） — 开工前必读 — 2026-09-23
- `FILE_INDEX.md` — 本索引文件 — 2026-10-08
- `package.json` — 项目依赖与脚本 — 无业务依赖；**scripts 已补 `typecheck`（`tsc --noEmit -p miniprogram/tsconfig.json`）**；`validate` / `simulate` 待 P0-B 建 `tools/` 后再补 — 2026-10-08
- `project.config.json` — **小程序项目配置（DevTools 实际读取的那份）** — appid（测试号 `wxfa24fde2ed5bd6ef`）、`miniprogramRoot: miniprogram/`、**`useCompilerPlugins: ["typescript"]`**、**`es6: true`（2026-10-08 由 `false` 改正）**、**`libVersion: 3.17.2`（原 `trial`，改为固定稳定版，避免跟随官方灰度漂移）** — 2026-10-08
- `project.private.config.json` — 本地私有配置（个人覆盖项） — **不入库（已写入 .gitignore）**；已清理失效的 `styletest/index` 编译条件 — 2026-10-08
- `.gitignore` — **新建** — 忽略 `node_modules/` `miniprogram_npm/` `project.private.config.json` `miniprogram/project.private.config.json` `_audit/` — 2026-10-08
- `tsconfig.json` — TS 编译配置 — strict / noUnusedLocals / 目标 ES2020 — 2026-09-14

## tools/（校验与模拟工具，2026-10-08 新建）

> 为什么存在：历次「tsc 全绿 + N 项断言 + 480 局批量模拟」的脚本一个都没留在仓库里，导致寿命档位失效的缺陷漏到今天。本目录把观察能力固化。**零 npm 依赖**（靠 Node 24 原生 TS 剥离 + ESM resolve hook 直接 import 项目 .ts）。

- `tools/lib/load-ts.mjs` — **可复用 TS 加载器** — `loadProject(relPath)`（动态 import 项目 .ts，必须在 hook 注册后）、`silenceWx()`（非小程序环境回落内存存储）、`PROJECT_ROOT`；import 即注册 resolve hook — 2026-10-08
- `tools/lib/ts-resolve.mjs` — ESM resolve hook — 把无扩展名的相对导入补成 `.ts`（engine 内部写法是 `import './schema'`），**并支持目录导入 `./cyberpunk` → `cyberpunk/index.ts`**（2026-10-10 补，否则 `data/worlds/index.ts` 这类写法在 Node 里加载不了） — 2026-10-10
- `tools/validate-data.mjs` — **数据契约校验（15 项）** — 直接 import 真实数据结构校验（非扫源码）：事件 id 唯一与 `cb_<阶段简称>_NNN` 命名、特质引用完整、标签来源闭合（特质 / **背景包** / 事件三路）、dropTags 有来源、caps 有来源、语义键 10 个合法、psyche 键 4 个合法、「无事件的所有选项都被门槛挡掉」、带 check 的选项必有 success+fail、stage 与 require.age 不矛盾、crit 只在 major、death 不在 success/critSuccess、years 1~5、正文 40~80、标签命名空间不混用；输出各阶段事件数 / DC 分布 / 语义键与 psyche 频次 / 标签产出消费比 / money 量级报数 — 2026-10-08
- `tools/simulate.mjs` — **批量模拟 + 文档目标断言** — `--runs` / `--system classic5|heart6|roulette` / `--strategy random|first|life`；输出寿命分布（最小/p25/中位/p75/最大）、死因分布、检定成功率、属性饱和度（中位/p90/贴顶比例）、life 模式的终局持有标签；对照 `01-heart6-spec.md` §6.1 的 40/55/60/65+ 目标做 ±3 岁断言 → **当前 4/5 档失败（预期行为，证明缺陷）** — 2026-10-08
- `tools/README.md` — 用法 / 参数 / 当前实测值 / **哪些断言在失败、为什么** / 与 `_audit/_scratch/` 历史脚本的对应关系 — 2026-10-08

## docs/design/（第 0 步设计文档，2026-09-23 产出并**全部确认落定**）

- `docs/design/01-heart6-spec.md` — **六维语义规范** — 六维内核定义 + 现实/奇幻/悬疑/恐怖/古风各题材检定用途 + 与语义键对应关系 + `health` 归属重划 + 检定难度档 + 题材标签；**4.1 大成功·大失败结算（顺风 ×1.5 / 逆风 ×0.5，标签特质生死不参与缩放；重点选项 `critSuccess` / `critFail` 可写 death）**；**第 6 节 时间漂移与寿命档位（40 / 55 / 60 / 65+ 四档 + 漂移数值 + 6.3 校准结果：480 局实测四档全部命中）** — 2026-09-24
- `docs/design/02-character-layer.md` — **人物构建层 schema** — 特质三分类（`innate` 先天 / `acquired` 后天 / `state` 状态）；`TraitSlot`（主线 11 槽 + 副线 7 池，含世界专属槽 `world`）`TraitPath` `SixOffset` `TraitTier`（分档独立提示词）`TraitOption` `TraitUnlock` `TraitSafety` `TraitPool` `CharacterCard`；**`PsycheState` 心理状态量**；特质互斥组；合成规则；**完整特质分类树 A~G 七大类**；提示词规范；**第 10 节敏感内容处理（10.1 两级标记 / 10.2 内容偏好面板 / 10.3~10.6）**；**第 11 节稀有度与概率**；**第 12 节因果关系与选项可用性**；第 13 节玩家自定义选项；**第 14 节 `caps` 能力门槛分支规范（14.1 做加法不做减法 + 引擎硬约束「不得把所有选项都过滤掉」/ 14.2 失明·轮椅·失聪三类优先 / 14.3 其余标签 / 14.4 不受内容开关影响 / 14.5 文案要求）**；**第 15 节数据文件规划 + 15.1 落地约定**；16.1 新增待确认 3 条 — 2026-09-24
- `docs/design/03-runstate-save.md` — **RunState 运行时 + 存档格式** — `RunState`（含 **`psyche`** 与 **`relations`**）`HistoryEntry` `Relation` `LifeModel` `RunStatus`；**3.1 死亡叙述三级解析（事件写明 → 世界死因池 → 兜底）+ 本地 AI 接口（只影响展示）**；**4.1 存档位满行为（硬上限 5 位、不自动删除、开局前检查空位）**；与总结图的数据接口；6.1 新增待确认 2 条 — 2026-09-24
- `docs/design/04-life-model.md` — **人生模型与 WorldMeta 扩展** — `LifeModel`（full/episodic）对比表；`WorldMeta` 新增字段；`resolveStageRange` / `stageOfAge`；`LifeEvent.years`；5.1 时间漂移（episodic 默认关，**含指向 01 第 6 节寿命档位的指针**）；5 个世界归属建议 — 2026-09-24
- `docs/design/05-roulette-mode.md` — **全随机模式（转盘）规则** — 定位（=六维系统+人物全随机）；**主线槽 10 个 + 副线池 6 个（命运牌，概率抽取）**；获取路径与 `lifeModel` 的过滤关系；抽取流程（含敏感系数）；稀有度权重与预算（**负面特质概率压制表**）；心理状态量开局初始化；动画节奏；检定/漂移关系；平衡四道闸门 — 2026-09-23
- `docs/design/06-ai-route-schema.md` — **AI 线路生成 schema 预留** — `EventSource` `ReviewStatus`；`LifeEvent`/`Choice`/`Condition` 新字段；权重公式；生成与审查链路；**玩家创作两层形态（轻量自定义选项 / 玩家工坊）与兼容性约定**；**与因果规则的衔接**；P0 范围；风险护栏 — 2026-09-23
- `docs/design/07-onboarding.md` — **开局向导（7 步流程）** — 选世界 → 选属性系统 → **内容偏好（两级标记 + 类别整组 + 单条勾选）** → 人物构建 → 重抽 → 人物卡确认 → 名字与性别；交互细节（转盘动画 / 快速模式 / 显眼提示位）；产出 `RunState` 初值；与 02/03/05 的衔接；第 7 节 6 条待确认项（**2026-09-24 落地时按 P0 建议值执行：名字随机可改 / 性别不自选 / 心理状态量隐藏 / 暂不做点数置换**） — 2026-09-24
- `docs/design/08-ai-text-spec.md` — **剧情文本生成规范（给 AI 的规则）** — 用法（整份文档作为规则发给任何 AI）；事件 JSON 模板与字段表（LifeEvent / Choice / Condition）；文本风格 7 条（第二人称 / 40~80 字 / 写处境不写评价 / 正文无数值）；数值与平衡（attr 量级 / money 分阶段 / psyche / death 用法 / **DC 难度分布表** / **寿命保护**）；大成功·大失败写死分支用法；caps 残疾门槛「加法不做减法」；内容安全；交付前校验清单；两个完整示例；**附录 A 玩家上传文本 → AI 生成分支流程（事件卡中间稿 → 轻量编辑器 → 正式 JSON 入审查）+ 附录 B 死亡叙述本地 AI 接口说明**；**2026-10-08 新增 §4.4 致死档位（hazard 五档表 + 三条硬规则）、§4.5 失败的代价（三档配额 + 唯一合法的「失败有收获」情形）；校验清单补 5 条；§4.3 dc 表加「三方不一致」警示并改为一律取 `DC` 常量** — 2026-10-08
- `docs/design/09-fatality-and-consequence.md` — **新建｜致死档位与失败代价（写作宪法）** — 第 1 节问题实测（普通失败 **0/314** 可致死、全库致死仅 **5 处且全在 `critFail`**、**98% 的选项没有重后果位**、失败 3 步内被冲掉 **90%**、**31 个失败分支净收益为正**）；**第 2 节死亡五档分类（D0 寿终 / D1 衰竭 / D2 抉择致死 / D3 事故致死 / D4 慢性致死）+ 4 条硬性约束（致死项可规避 / 必须给危险信号 / 致死率写在数据上 / 一生一次）**；**第 3 节致命属性白名单（`AttrDef.fatal`，六维只有 `vitality` 一条生死线）+ 非致命属性归零 → 困境（效果表 + 自动解除规则）**；**第 4 节 `Choice.hazard` 五档危险等级表（none/low/mid/high/lethal）+ `Choice.failLethal`（仅 lethal 可用且 ≤0.10）+ `LETHAL_CAP = 0.35` + 三条完整事件写法示例（坠落 / 卷入重工机器 / 高危手术）**；**第 5 节失败三档代价（`Debuff` 伤势类型定义 / 永久标签 / 小概率残疾）+ 写作配额表 + 31 个「失败划算」分支的判定标准**；第 6 节引擎实现清单 8 项 + UI 必表达的三件事；**第 7 节给 AI 的三条硬规则 + 新增字段 JSON**；第 8 节验收标准 5 条（含「失败恢复率从 90% 降到 60% 以下」）；第 9 节 6 条待确认；**第 10 节现有数据回头改清单（B1~B5 分批，为接入 AI 准备分支样本）**；第 11 节确认记录 — 2026-10-08
- `docs/github-upload-rules.md` — **新建｜GitHub 上传规则（给自动化智能体的操作手册）** — 快速执行 5 步；仓库信息（远程 / 分支 / 提交身份用 **GitHub noreply 邮箱**，因用户全局 git 身份是 gitee 的）；**该传 / 绝不传清单**（`typings/` 980KB 微信声明、`_audit/` 内部材料、`project.private.config.json`、任何二进制素材）；**忽略规则两套机制 + 两个必须知道的坑**（① PowerShell `Set-Content -Encoding UTF8` 会写 BOM，导致忽略文件**首个模式静默失效**——必须用 `[System.IO.File]::WriteAllText(..., UTF8Encoding $false)`；② 忽略规则对**已跟踪**文件无效，须先 `git rm -r --cached` **并真正提交**）；提交信息规范（`feat/fix/docs/chore/refactor/content` + 必须附实测对比 + 如实写已知问题）；上传前必跑三项（`typecheck`/`validate` 必须过，`simulate` **当前预期失败**，禁止为通过而放宽断言）；完整上传流程（含暂存区禁止文件自动检出）；**故障排查**（§7.1 `schannel SEC_E_NO_CREDENTIALS` = DSH 沙箱阻断 git TLS，附已试无效的 4 种方案与「推送必须换用户本机」的结论）；绝对不要做的 8 件事；上传后自检 — 2026-10-08
- `docs/design/10-outcome-and-attribute-rebalance.md` — **新建｜结算模型与属性去饱和** — **第 0 节三条结论**（① 实测推翻原诊断：**提高属性上限解决不了饱和、反而更糟**——上限 20→30 后 16-25 岁属性中位 18.9→23.0、饱和度 90%；② **`floor(属性/2)` 必须保留**，运气:角色 = 1.9:1 是刻意设计；③ 去饱和与 DC 重标强耦合，DC 16 会从 65.6% 变 78.9%）；**第 1 节属性去饱和**：实测分布表（p75/p90 从 7 岁起恒等于 20）+ 四种配置对照实验 + **提案 A 收益递减 `gain × sqrt(剩余空间比例)`（负向不折减）** + 溢出转存 2:1 转 `mood` + 保留 `floor(/2)` 的三方案对比 + 成长感是**另一个**问题（16-25 中位 18.9 → 41-60 中位 17.5，负增长）；**第 2 节 `Outcome.cost` / `costUnless`「成功但有代价」** 类型定义、与 09 文档分工表、事件写法、结算规则 5 条（**不参与 crit 缩放**）、改动量（十几行、零破坏性）；**第 3 节显式 `RunState.step`（修 `rngFor` 用 `history.length` 当随机坐标的隐式契约）+ 结构化 `StepResult.outcome`（从根上消除骰子动画竞态）+ 存档逐级迁移**；第 4 节改动清单与顺序；第 5 节验收标准 8 条；第 6 节 7 条待确认；第 7 节确认记录 — 2026-10-08

> 七份文档末节均已改为「确认记录（2026-09-23）」。关键落定：01 `HEART6.map.health` → `{ vitality: 1 }`；02 内容标记拆两级（`sensitive` ×0.3 / `tender` ×0.5）且**两级默认关闭**、特质改写**加减六维但不整体重算**（见 7.1）、病理阈值 8/14/20；03 存档保留 5 局、云存档放二期；04 `episodic` **默认关时间漂移**（选择驱动，见 5.1）、`years` 默认 1 上限 5；05 副线概率 40/30/45/20/35/30、权重 8/4/1.5/2、重抽每局限 1 次且只限副线池、**池空即「无」**；06 审查阈值 normalcy ≥ 0.6 且 interest ≥ 0.6；07 开局向导 7 步流程 + 6 条待确认项。
>
> 仍挂起：04 文档中**三国 / 仙侠 / 日式西幻**的 `lifeModel` 归属；06 文档 3 条 P2 数值；07 文档 6 条开局向导待确认项；**2026-09-24 四份改动（01 §4.1 大成功·大失败 / 01 §6 寿命档位 / 02 §14 能力门槛分支 / 03 §3.1 死亡叙述 / 03 §4.1 存档位上限）待用户确认后才动代码**。
>
> **2026-10-08 新增（待用户确认后才动代码）**：**`09-fatality-and-consequence.md`（致死档位与失败代价）**——死亡五档分类、`hazard` 五档危险等级 + `failLethal`、致命属性白名单、`Debuff` 伤势三档代价；用户已确认方向（普通失败=重伤可致永久减益 / 大失败=死 / 致死率按危险等级分档调低 / 现有失败分支回头改以支撑 AI 接入），**待确认 §9 的 6 项数值**（其中致死率 8%/15%/35% 必须模拟校准后定稿）。
> **`10-outcome-and-attribute-rebalance.md`（结算模型与属性去饱和）**——用户指示把三件事加入文档：① 去饱和、② `Choice.cost`「成功但有代价」、③ 显式 `step` + 结构化 `outcome`。**其中第①项经实测修正了方案**：原以为"提高属性上限"能解决饱和，实测证明**反而更糟**（上限 20→30 后 16-25 岁属性中位 18.9→23.0、饱和度 90%），改为**收益递减 + 溢出转存**，并确认 `floor(属性/2)` 保留。**待确认 §6 的 7 项**。
> 同时回补：`01` §4.1（死亡挂哪一档 + `floor(/2)` 保留理由 + `cost` 不参与 crit 缩放）与 §6.3（**校准结果与实测不符，实测中位 68~70 vs 文档 38/41，差约 28 岁，需重跑**）、`02` §7.2（特质 / 标签 / 伤势三类后天代价的分工 + `cost` 承载位置）、`03` §2 / §3 / §3.1 / §4.2（`RunState` 新增 `debuffs` / `pending` / `step`；推进循环补 steps 3/5/7/8；死因分池；**版本迁移必须逐级 + 拒绝前备份**）、`08` §4.4 / §4.5 / §4.6 / 校验清单。
> **另：架构审查发现的缺陷清单见 `_audit/架构审查报告.md`、`_audit/三视角深度评审.md`、`_audit/修改清单.md`（非正式文档，待你决定是否收编）**。

## miniprogram/engine/（引擎层）

- `engine/schema.ts` — **剧情数据结构总定义** — `Stage` `DEFAULT_STAGE_RANGE`（`STAGE_RANGE` 兼容保留）`STAGE_NAME` `LifeModel` `Genre` `EventSource` `ReviewStatus` `SemanticAttr` `AttrSystemId` `DC` `Effects`（新增 `psyche` / `gainTraits` / `loseTraits` / `gainCaps` / `loseCaps`）`Check` `Condition`（新增 `caps` / `notCaps` / `sources` / `minWeight`）`Outcome` `Choice`（新增 **`major` / `critSuccess` / `critFail`** / `allowCustomRoute`）`LifeEvent`（新增 `years` / `source` / `reviewStatus` / `originRunId` / `absurdity` / `interest` / `playerInput`）`BackgroundPack` `WorldMeta`（新增 `lifeModel` / `genre` / `startAge` / `chapters` / `stages` / `timeDrift` / `recommendedStyles` / `traitPoolId` / `minEventWeight`）`ChapterDef` `WorldPack` + `resolveStageRange()` `stageOfAge()` `shouldTimeDrift()`
  **【已实现 / 仅预留 边界，2026-10-08 核实】** 已实现且有数据在用：`major` `critSuccess` `critFail` `caps` `notCaps`（引擎已判定但**数据零使用**）`minWeight`（同前）；**仅类型预留、引擎零消费**：`Choice.allowCustomRoute`、`LifeEvent.reviewStatus` / `originRunId` / `absurdity` / `interest` / `playerInput`、`WorldMeta.specialTags`（**0 处读取**）/ `recommendedStyles` / `currencyName`（页面硬编码「信用点」）；**日期事件字段 `years` 已实现但事件库 161 条零使用**。
  **2026-10-08 P1 新增（引擎字段扩展，纯加法）**：`HazardLevel`（五档危险等级）+ `LETHAL_CAP = 0.35`；`Debuff` 伤势类型 + `Effects.debuff`；`Choice.hazard` / `Choice.failLethal`；`Condition.money`（金钱门槛）；`Outcome.cost` / `costUnless`（成功但有代价）；`WorldMeta.deathCauses` 由 `Record<string,string>` 改为**分池结构 `DeathCausePool`**（`byCause` → `byAttr` → `age` → `default`）。— 2026-10-08
- `engine/run-state.ts` — **新建** RunState 运行时 + 存档格式（见 03 文档） — `RunState`（**2026-10-08 新增 `debuffs: Debuff[]` 伤势队列**）`HistoryEntry`（**新增 `cost` 代价记录**）`Relation` `RunStatus` `RunSummary` `NewRunInput` `SaveResult`；常量 `RUN_VERSION`(**2**，2026-10-08 由 1 升版) `MAX_RUNS`(**5 个存档位硬上限**)；`createRunState()`（初始化 `debuffs: []`）`pushHistory()` `saveRun()`（**满位返回 `{ok:false,full:true}`，不自动删旧档**）`hasFreeRunSlot()` `loadRun()` `loadCurrentRun()` `setCurrentRun()` `deleteRun()` `listRuns()` `migrateRunState()`（**逐级迁移**：v1 → v2 补 `debuffs: []`，未知版本才返回 null）；存储适配层（非小程序环境回落内存 Map，供批量模拟 / 单测） — 2026-10-08
- `engine/roulette.ts` — **新建** 转盘抽卡（见 05 文档） — `createRng()`（mulberry32 确定性随机）`rollCharacter()` `rerollSideSlot()` `composeSix()`（**出场六维下限 1**）`traitOffsetOf()` `offsetDelta()` `applyOffset()` `clampSix()`；`RollStep` / `RollResult` / `RollOptions`；主线槽必抽 → 副线池按 `poolChance` 先掷 → 预算 `enforceBudget` → 人物卡 — 2026-09-24
- `engine/story-engine.ts` — **新建** 剧情引擎（推进循环见 03 文档第 3 节） — `startRun()`（**开局属性下限 1**；**`StartOptions.roll` 可带入向导已抽好的人物卡**，改写副线后靠它保证人生页与向导所见一致；省略则按 seed 现抽）`nextStep()` `submitChoice()`（**2026-10-08 新增：cost 在 effects 之后结算、`costUnless: 'critSuccess'` 大成功免除、fail 分支后 `failLethal` 二次判定致死**）`autoResolve()` `rollCheck()`（**mod 计入 debuff 的 `checkPenalty`**）`resolveOutcome()`（**重点选项优先走 `critSuccess` / `critFail` 写死分支**）`amplifyEffects()`（**大成功顺风 ×1.5 / 逆风 ×0.5；排除 `cost`**）`applyEffects()` `settlePsyche()` `gainTrait()` `loseTrait()`；**伤势**：`applyDebuff()` `cureDebuff()` `settleDebuffs()`（每年结算 perYear / costPerYear / 到期移除，`permanent` 不自然痊愈）`debuffPenalty()`；**2026-10-08 `checkEnd()` 改为只对 `AttrDef.fatal` 属性归零判死**；`eventPool()` `drawEvent()` `visibleChoices()` `advanceTime()` `advanceChapter()` `isConditionMet()`（**新增 `money` 门槛**）`semanticValue()` `rngFor()`；**死亡叙述**：`deathText()`（走 `byCause`）`poolDeathText()`（`byCause` → `byAttr` → `age` → `default` 分池解析）`resolveDeath()` `setDeathNarrator()` + `DeathContext` / `DeathNarrator` / `DeathKind`（**新增 `'hazard'` 事故**，二期接本地 AI 的接口）；`StartOptions` `StepResult` `CheckOutcome` — 2026-10-08

## miniprogram/data/（数据层）

- `data/attributes.ts` — **属性系统 + 语义键映射 + 时间漂移** — `AttrDef`（**2026-10-08 新增 `fatal?: boolean` 致命属性白名单**）`CLASSIC5`（五维；**`constitution` 体质标 `fatal: true`**）`HEART6`（六维心之禀赋，`health` → `{ vitality: 1 }`；**`vitality` 行力标 `fatal: true`**）`ROULETTE`（**全随机：复用 HEART6 的 `attrs` / `hidden` / `map`**，因此行力同样是唯一生死线）`ATTR_SYSTEMS` `CHECK_RULE` `TIME_DRIFT`（**已定档：20~59 行力 −0.5 / 身体 −0.25，60+ 各 −1；寿命档位 40 / 55 / 60 / 65+，见 01 文档第 6 节**）`MOOD_BASELINE` `MOOD_REGRESSION` `DEATH_THRESHOLD` — 2026-10-08
- `data/worlds/index.ts` — 世界库注册表 — `WORLDS` `WORLD_LIST` — 2026-09-14

## miniprogram/data/traits/（人物构建层 · 特质池）

- `traits/types.ts` — 特质类型基座 — `TraitSlot`（主线 11 槽 + 副线 7 池）`TraitPath` `LifeModel` `SixOffset` `TraitRarity` `TraitTier` `TraitVisual` `TraitSafety`（**`sensitive` / `tender` / `category` 两级标记**）`TraitCategory`（9 类，内容偏好面板分组依据）`TraitUnlock` `TraitOption` `TraitSlotDef` `PsycheState` `TraitPool` `CharacterCard` + `RARITY_WEIGHT` `RARITY_COST` `SENSITIVE_WEIGHT_FACTOR`(0.3) `TENDER_WEIGHT_FACTOR`(0.5) `traitWeight()`（三级分支）`traitCost()` `TRAIT_EXCLUSIVE_GROUP` `exclusiveGroupOf()` — 2026-09-23
- `traits/_psyche-state.ts` — 心理状态量常量 — `PSYCHE_BASELINE` `PSYCHE_RANGE` `PATHOLOGY_THRESHOLD`(8/14/20) `pathologyTierOf()` `PATHOLOGY_CANDIDATES` `PSYCHE_LABEL` `psycheTierLabel()` — 2026-09-23
- `traits/_common.ts` — **通用特质池，235 条** — 主线槽 68（性别/身高/体型/发色/瞳色/视力/容貌/性格/道德）+ A 生理形态 30 + B 生理机能 40 + C 心理人格 25 + D 心理病理 43 + E 天赋才能 15 + F 社会细项 16；导出 `COMMON_SLOTS`（**16 槽：主线 10 含 `origin` + 副线 6**）`COMMON_BASELINE` `COMMON_BUDGET_CAP`(8) `COMMON_RANGE` `COMMON_PSYCHE_BASELINE` `COMMON_TRAITS_PART1`；**内容标记已落地**（`tender` / `category` 全覆盖、12 条轻不适由 sensitive 改正为 tender、8 条旁支细节降权） — 2026-09-24
- `traits/cyberpunk.ts` — 赛博朋克专属池（G 组），24 条 — 义体化程度（0-3 档）/ 神经污染（1-3 档）/ 企业公民身份 / 黑客体质 / 赛博环境；**已补 `category` 8 条**；导出 `CYBERPUNK_SLOTS` `CYBERPUNK_TRAITS` — 2026-09-24
- `traits/index.ts` — 特质池注册表 — `COMMON_POOL` `CYBERPUNK_POOL` `TRAIT_POOLS` `getTraitPool()` `getTraitsBySlot()` `traitById()` `ContentPrefs`（两级逐条放行）`TraitContext` `openingPaths()`（**按 `lifeModel` 放开路径：full 仅 innate / episodic innate+acquired**）`canEnterOpeningPool()`（**默认排除敏感 / 轻不适**）`eligibleTraits()` `slotWeightSum()` `listByCategory()` `groupByCategory()` — 2026-09-24

## miniprogram/data/worlds/_TEMPLATE/（事件库写作模板，新世界照抄）

- `_TEMPLATE/README.md` — 写作须知：目录结构 / 六步流程 / 字段规范 / 属性写法 / 检定写法 / 文风要求 / 禁止事项 / 自检清单 — 2026-09-14
- `_TEMPLATE/world.ts` — 世界元数据模板 — `worldMeta`（**已补 `lifeModel` / `genre` 必填字段**；**`deathCauses` 已同步为分池结构**） — 2026-10-08
- `_TEMPLATE/events.ts` — 7 种事件写法示例（自动/二选一/隐藏选项/连锁/死亡/概率/组合条件） — `events`（TPL_ 前缀，不注册）；`DC` 改从 `engine/schema` 导入 — 2026-09-23

## miniprogram/data/worlds/cyberpunk/（世界：赛博朋克 · 雾港，161 条）

- `cyberpunk/world.ts` — 世界元数据 — `worldMeta`：**`lifeModel: 'full'` / `genre: 'realistic'`（待确认） / `attrSystems` 三套含 `roulette` / `traitPoolId: 'cyberpunk'`**；6 个背景包、12 个专属标签；**`deathCauses` 已改为分池结构（2026-10-08）**：`byCause` 保留原有 4 条死因文案、**`byAttr` 新增 `vitality` / `health` / `constitution` 三条**（修掉「97% 死亡显示同一句兜底文案」）、**新增 `age` 寿终文案**、`default` 保留。货币「信用点」 — 2026-10-08
- `cyberpunk/childhood.ts` — 幼年 0-6 — `events` **24 条**（psyche 12；**专属事件 `cb_child_023` 回声（盲）· `cb_child_024` 台阶（轮椅）**；`cb_child_007` 酸雨 / `cb_child_016` 观景窗 追加残疾专属选项） — 2026-09-24
- `cyberpunk/teen.ts` — 少年 7-15 — `events` **30 条**（psyche 11 / 特质改写 3 / 死因 1 / 关键抉择 1；**专属事件 `cb_teen_029` 口型（聋）· `cb_teen_030` 钩竿（轮椅）**；`cb_teen_002` 废船坞 / `cb_teen_026` 上去看一眼 追加专属选项） — 2026-09-24
- `cyberpunk/youth.ts` — 青年 16-25 — `events` **31 条**（psyche 13 / 特质改写 4 / 死因 1 / 关键抉择 2；**专属事件 `cb_youth_031` 声音层（盲）**；`cb_youth_010` 黑拳 追加专属选项） — 2026-09-24
- `cyberpunk/prime.ts` — 壮年 26-40 — `events` **28 条**（psyche 8 / 特质改写 1 / 死因 2 / 关键抉择 2 / 4 条「小生意」；**专属事件 `cb_prime_028` 货梯（轮椅）**；**`cb_prime_027` 半年一次 = 改造者续命线**） — 2026-09-24
- `cyberpunk/middle.ts` — 中年 41-60 — `events` **26 条**（psyche 8 / 特质改写 3 / 死因 1 / 关键抉择 1；**专属事件 `cb_mid_026` 读唇（聋）**；`cb_mid_016` 最后一次接入 追加专属选项；**`cb_mid_023` 月钱 · `cb_mid_024` 开门 · `cb_mid_025` 保养 = 三条续命日常**） — 2026-09-24
- `cyberpunk/elder.ts` — 老年 61+ — `events` **22 条**（psyche 8；**专属事件 `cb_eld_021` 脚步声（盲）· `cb_eld_022` 高处（轮椅）**；`cb_eld_018` 最后的雨 追加专属选项；**`cb_eld_019/020` 需「改造＋帮派＋小生意」三重标签**） — 2026-09-24
- `cyberpunk/index.ts` — 聚合导出 — `cyberpunkPack` `default` — 2026-09-14

> **能力门槛分支（2026-09-24 交付，见 02 文档第 14 节）**：9 条专属事件（盲 3 / 轮椅 4 / 聋 2，每个阶段 ≥1）+ 7 条现有事件追加专属选项（`cb_child_007` / `cb_child_016` / `cb_teen_002` / `cb_teen_026` / `cb_youth_010` / `cb_mid_016` / `cb_eld_018`）。全部遵守「加法不做减法」：追加选项一律排在无门槛选项之后，专属事件的门槛只写在事件级 `require`，**没有任何事件的选项会被全部门槛挡掉**；未使用 `notCaps`。

## miniprogram/pages/（页面）

- `pages/onboarding/` — **开局向导（2026-09-24 新建，4 文件，当前为小程序首页）** — 六屏：选世界 → 选属性系统 → **内容偏好面板**（9 类分组 + 每类全开/全关 + 单条勾选，偏好存 `content:prefs` 供设置页共用）→ 抽取展示（转盘逐槽定格 0.65s/槽可跳过，仅全随机模式显示）→ 人物卡确认（**转盘模式可改写一次副线**；属性预览用 `startRun(..., {roll})` 建局后的真实值，五维/六维靠同种子现抽复现、预览不传 backgroundId）→ 起名（默认随机可改）。完成后写 storage `onboarding:pending`（**含 `worldId`**）跳人生页。调 `rollCharacter` / `rerollSideSlot` / `startRun` / `hasFreeRunSlot` / `deleteRun` / `listRuns`；**属性面板改用共享 `utils/attr-rows.ts`（原先与 play 页各写一份）**。**2026-10-10 去硬编码**：世界列表由 `WORLD_LIST` 生成、`onPickWorld` 接受注册表里任一世界（原先 `if (id !== META.id) return` 直接否决其余世界）、当前世界的 `WorldPack` 与特质池存模块级 `wizWorld` / `wizPool`（切世界时重建内容偏好面板），`rollCharacter` / `rerollSideSlot` / `startRun` 一律用当前世界（含其 `lifeModel` / `backgrounds` / `traitPoolId`）— 2026-10-10
- `pages/play/` — **人生引擎页（4 文件）** — 单页打通「开局 → 逐年事件与选项 → 检定与结果 → 死亡 / 结局」：attached 读 `onboarding:pending`（读取即删）交接开局配置（`continue` 载存档；`new` 带 `attrSystem` 则 `startRun` 建局，**转盘模式经 `roll` 带入向导抽好的卡**；无 pending 才显示原开始段「选属性系统 → 开始/继续 + 存档位读数与清空」）；人生段（年龄·阶段·金钱 HUD、属性面板、人物卡、事件正文、选项按钮（关键抉择高亮 + 检定档位）、**检定骰子滚动动画**（数字跳动约 0.8s 后揭示真实结果，含大成功/大失败显示）、变化明细、心理状态量）、结局段（死因 + 最终属性 + 人生时间线倒序）。调 `startRun` / `nextStep` / `submitChoice` / `loadCurrentRun` / `listRuns` / `deleteRun`；**2026-10-10 修复 8 项**：① **骰子动画竞态** —— 新增 `stopDiceAnim()`（clearInterval + 递增 `revealToken` 令牌）并在 `onPick`（动画中禁止再点）/ `onContinue` / `advance` / `beginRun` / `detached` 调用，回调不再回读 `run.history`（改为调用方捕获结果与真实骰面传入）；② **setData 只传派生标量** —— `run` / `event` 移出 data 改存模块级 `currentRun` / `currentEvent`（人生段单次载荷 977B vs 整局 9762B，约 1/10）；③ **存档读不出来与「没有存档」分开提示**（`listRuns().length > 0` 且 `loadCurrentRun()` 为 null → 「旧版本存档无法读取」）；④ **属性面板危险线**（<25% 橙 / <10% 红 + 致命属性红点，样式见 `play.wxss`）；⑤ **心理状态量复用 `PSYCHE_LABEL`**（不再输出 `suppression` 等英文键名）；⑥ **货币名 / 世界名从 `WorldMeta` 读**（`currencyName` / `name`，不再硬编码「信用点」「雾港 · 霓虹残响」）；⑦ **世界贯通** —— 按 `pending.worldId`（继续人生时按 `run.worldId`）从 `WORLDS` 取世界，全部引擎调用改用该世界；⑧ 属性面板改用共享 `utils/attr-rows.ts` — 2026-10-10

> 模板示例页 `pages/index/`（Hello World）与 `pages/logs/` 已于 2026-09-24 删除；正式首页视觉与视觉小说主界面排在玩法稳定后。

## miniprogram/ 其他

- `miniprogram/tsconfig.json` — 小程序 TS 编译配置（继承根配置） — `typeRoots: ../typings`、**`skipLibCheck: true`**（微信官方 typings 2.8.x 与较新 tsc 不兼容，属第三方声明问题） — 2026-09-23
- `miniprogram/app.json` — 全局配置 — **页面注册 `pages/onboarding/onboarding`（首页，开局向导）+ `pages/play/play`**（人生引擎页）；窗口样式深色（`#0b0f14` / 白字）、无 tabBar — 2026-09-24
- ~~`miniprogram/project.config.json` / `miniprogram/project.private.config.json`~~ — **已于 2026-10-08 删除**：两份多余副本，与根目录那份矛盾（前者写 `useCompilerPlugins: false`、后者写 `skylineRenderEnable: false`），若误用「打开 miniprogram 目录」会导致 .ts 不被编译、白屏且极难排查；已确认无任何代码引用 — 2026-10-08
- `miniprogram/sitemap.json` — **新建** — 最小 sitemap（`{"action":"allow","page":"*"}`），消除 app.json 未声明 `sitemapLocation` 的构建告警 — 2026-10-08
- `miniprogram/app.ts` — 应用入口 — App.onLaunch 空实现 — 2026-09-14
- `miniprogram/app.wxss` — 全局样式 — 空模板 — 2026-09-14
- `miniprogram/utils/pending-start.ts` — **开局向导 → 人生页交接契约（storage `onboarding:pending`）** — `PENDING_START_KEY` `PendingStart`（**2026-10-10 新增 `worldId?`，世界选择这才真正传得下去**）`readPendingStart()`（读取即删）；**必须独立于页面文件**：app.json 开了按需注入，页面 JS 被其他文件 require 会报 module not defined（2026-09-24 踩坑记录） — 2026-10-10
- `miniprogram/utils/attr-rows.ts` — **新建｜属性面板数据（play 与 onboarding 共用）** — `AttrRow`（`key` / `name` / `value` / `pct` / **`level: normal|warn|low` 危险档位** / **`fatal` 致命标记**）`attrRowsOf(system, values)`；危险线阈值 <25% 橙、<10% 红（09 文档 §3 要求界面必须给出信号）；**页面之间禁止互相 import，共享代码一律放 utils/**（原两页各写一份的重复实现已删除） — 2026-10-10
- `miniprogram/utils/util.ts` — 模板工具函数 — `formatTime`（待清理/替换） — 2026-09-14

## typings/

- `typings/index.d.ts` — 类型声明入口 — 引用 wx 类型 — 2026-09-14
- `typings/types/wx/*.d.ts` — 微信小程序官方 TS 类型声明（api/app/behavior/cloud/component/event/page） — 只读，勿改 — 2026-09-14

## _archive/（已归档，不参与编译，仅备查）

- `_archive/styletest/` — 09-20 三风格样张 demo（原 `miniprogram/styletest/`，4 页 + api.ts） — **已作废，正式风格系统从零做** — 2026-09-23 归档
- `_archive/mock-server/server.js` — 09-20 演示用 mock 服务器（:3000，原根目录 `mock-server/`） — **已作废** — 2026-09-23 归档

## 尚未创建（创建时更新本表）

- `miniprogram/pages/summary/` — 人生总结页（P0-6；首页现为开局向导临时入口，正式首页视觉后补）
- `miniprogram/utils/canvas-gen.ts` — 人生总结图 Canvas 生成器（维度无关雷达图 + 人物卡特质可视化）
- `miniprogram/services/` — API 请求层（对接自建后端）
- `miniprogram/data/worlds/three_kingdoms|us_underclass|xianxia|jrpg_fantasy/` — 其余 4 个世界事件库
- `server/`（或独立仓库） — 自建后端（一期仅 API 契约设计）
