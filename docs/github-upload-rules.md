# GitHub 上传规则 · Wanderveil Poem

> 给自动化智能体的操作手册。按本文执行即可完成一次上传，**不需要自己判断该传什么**。
> 最后更新：2026-10-08

---

## 0. 快速执行（照抄即可）

```powershell
# ① 在项目根目录
cd "D:\tools\wechat\job\Wanderveil Poem"

# ② 上传前置校验（任一失败就先修，不要带着失败上传）
npm run typecheck
npm run validate

# ③ 查看要提交什么
git status --short

# ④ 暂存 + 提交（提交信息规范见 §4）
git add -A
git commit -F .commitmsg.tmp          # 先按 §4 写好这个文件，提交后删掉

# ⑤ 推送
git push origin main
```

**如果推送报 `schannel` / `SEC_E_NO_CREDENTIALS` / `SSL certificate` 之类的错 →
看 §7；这说明你跑在 DSH 沙箱里，推送必须换到用户本机执行。**

---

## 1. 仓库信息

| 项 | 值 |
|---|---|
| 远程 | `https://github.com/EMTsaigao2333/Wanderveil-Poem.git` |
| 分支 | `main` |
| 提交身份 | `EMTsaigao2333` / `16798056+emt23333@users.noreply.github.com` |
| 项目根 | `D:\tools\wechat\job\Wanderveil Poem` |

约定：**提交身份用 GitHub 用户名 + noreply 邮箱**，不要用全局配置里的 Gitee 邮箱
（用户全局 git 身份是 gitee 的，直接提交会导致 GitHub 关联不到账号）。

如果是新克隆的仓库，先补上：

```powershell
git config user.name  "EMTsaigao2333"
git config user.email "16798056+emt23333@users.noreply.github.com"
git remote set-url origin https://github.com/EMTsaigao2333/Wanderveil-Poem.git
```

---

## 2. 该传什么、不该传什么

### ✅ 必须上传

```
miniprogram/          引擎 / 数据 / 页面 / 工具（全部业务代码）
tools/                数据校验与批量模拟工具链
docs/design/          10 份设计文档
README.md             项目说明
LICENSE               MIT（适用代码）
LICENSE-CONTENT       CC BY-NC-SA 4.0（适用故事内容）
package.json
tsconfig.json
miniprogram/tsconfig.json
project.config.json
app.json 等小程序配置
_archive/             已归档的早期演示代码（用户确认可以上传）
```

### ❌ 绝对不能上传

| 路径 | 原因 |
|---|---|
| `typings/` | 微信官方类型声明，约 **980KB**（`lib.wx.api.d.ts` 单文件 18808 行），由 devDependency `miniprogram-api-typings` 提供 |
| `_audit/` | 内部材料：架构审查报告、外部智能体提示词、探针脚本、批量模拟输出 |
| `project.private.config.json` | 个人覆盖项，项目规则明确「不入库」 |
| `miniprogram/project.private.config.json` | 同上 |
| `node_modules/`、`miniprogram_npm/` | 本项目**刻意零依赖** |
| 任何 `.png` / `.jpg` / `.mp3` / `.ttf` / `.woff` | 项目刻意零素材，主包体积敏感（当前仅 456KB） |

**判断标准**：如果某个文件是「第三方生成的」或「内部工作材料」，就**不该传**。

---

## 3. 忽略规则的两套机制（重要）

### `.gitignore`（会被上传，对所有人生效）

**⚠️ 这个文件正被微信开发者工具锁定，通常无法写入。**
尝试写入会报：`文件"....gitignore"正由另一进程使用`。

如需修改：先让用户**关闭微信开发者工具**，或用 §3.2 的方式绕过。

### `.git/info/exclude`（本地生效，不会被上传）

**当前 `typings/` 与 `_audit/` 的忽略规则放在这里**，因为 `.gitignore` 写不进去。

写入时必须**无 BOM**：

```powershell
$content = @'
_audit/
typings/
'@
[System.IO.File]::WriteAllText("$PWD\.git\info\exclude", $content, (New-Object System.Text.UTF8Encoding $false))
```

### 3.1 两个必须知道的坑

**坑 1：PowerShell 的 `Set-Content -Encoding UTF8` 会写入 BOM（`EF BB BF`）。**

Git 不会剥离 BOM，而是把 `\ufeff` 当成**第一个模式的一部分**，导致
**忽略文件的第一个模式静默失效**。症状是：你在文件里明明写了 `_audit/`，
但 `git add -A` 照样把它加进去。

**永远用 `[System.IO.File]::WriteAllText(..., New-Object System.Text.UTF8Encoding $false)` 写忽略文件。**

自检：

```powershell
$b = [System.IO.File]::ReadAllBytes("$PWD\.git\info\exclude")
"前 3 字节: $($b[0..2] -join ',')"   # 239,187,191 = 有 BOM，必须修
```

**坑 2：忽略规则对「已被跟踪」的文件无效。**

如果 `git ls-files typings` 有输出，说明 `typings/` 已经在仓库里，
此时往忽略文件里加规则**没有任何效果**。必须先从索引移除：

```powershell
git rm -r --cached typings        # 只动索引，本地文件保留
```

然后**必须真正提交**（`git rm --cached` 只是暂存，不提交就等于没做）：

```powershell
git diff --cached --name-status   # 确认看到一批 D 类型的删除
git commit -F .commitmsg.tmp
git ls-tree -r HEAD --name-only | Select-String '^typings/'   # 应为空
```

### 3.2 忽略规则自检命令

```powershell
foreach ($p in 'typings/index.d.ts','_audit/README.md','project.private.config.json','LICENSE') {
  $r = git check-ignore -v $p
  if ($r) { "忽略  $p" } else { "未忽略 $p" }
}
```

> ⚠️ 不要在 `foreach` 里用 `$r` 当循环变量再复用给其他名字——会互相覆盖导致误判。

---

## 4. 提交信息规范

**格式**：`<类型>(<范围>): <一句话中文说明>`

| 类型 | 用途 |
|---|---|
| `feat` | 新功能（引擎字段、页面功能） |
| `fix` | 修 bug |
| `docs` | 文档（README、设计文档） |
| `chore` | 工程化（配置、忽略规则、依赖） |
| `refactor` | 重构（不改行为） |
| `content` | 剧情内容（新增事件、特质） |

**正文要求**：

1. **说清「是什么」和「为什么」**，不只说「改了 X」
2. **数值类改动必须附实测对比**（这个项目的数值经常与文档不符）
3. **如果有已知但未修的问题，如实写出来**，不要隐瞒
4. 中文，列表用 `-`

**示例**：

```
feat(engine): 新增致死档位与失败代价字段

按 09 文档落地 5 个字段，全部为纯加法，不写时行为与改动前逐字节一致：
- AttrDef.fatal：致命属性白名单（六维只有 vitality 一条生死线）
- Choice.hazard / failLethal：事故危险等级与普通失败致死率
- Debuff：伤势（每年持续扣属性，需主动处理）
- Outcome.cost / costUnless：「成功但有代价」
- RunState.debuffs / step：伤势队列与显式随机坐标

回归验证：同种子事件序列与读档一致性均未变化；
寿命中位数 68（未变）。

已知问题（本次未修，需 D1~D4 数值决策）：
属性饱和度仍为 98%，寿命档位仍偏离文档目标 40 岁。
```

**写提交信息的方式**（PowerShell 不支持 heredoc，二选一）：

```powershell
# 方式 1（推荐）：直接用 -m，不产生任何文件
$msg = @'
feat(engine): 新增致死档位与失败代价字段

- ...
'@
git commit -m $msg
```

```powershell
# 方式 2：用临时文件（信息很长时）
# 必须先用 §3.1 的无 BOM 方式写文件
[System.IO.File]::WriteAllText("$PWD\.commitmsg.tmp", $msg, (New-Object System.Text.UTF8Encoding $false))
git add -A                          # ⚠ 只能在加忽略规则之后用；否则见下面的坑
git commit -F .commitmsg.tmp
Remove-Item .commitmsg.tmp -Force
```

> **坑 3（本次实际踩到）**：`.gitmsg.tmp` / `.commitmsg.tmp` 这类临时文件
> **自己会被 `git add -A` 加进提交**，然后你在提交后又删掉它，就会留下
> 一个「提交里有个已删除的临时文件」的脏历史。
>
> **两道防线**：
> 1. `.git/info/exclude` 里加上 `.commitmsg.tmp` / `.gitmsg.tmp` / `*.tmp`（已配好）
> 2. 提交前用 §6 第 5 步的检查，把 `\.tmp$` 也纳入禁止模式

---

## 5. 上传前必跑的三项校验

```powershell
npm run typecheck      # tsc --noEmit，必须全绿
npm run validate       # 数据契约校验 15 项，必须退出码 0
npm run simulate       # 平衡性模拟
```

**`simulate` 的预期行为**：**当前会以退出码 1 失败**，这是**正确的**——
它如实报告「实测寿命中位 68 岁 vs 文档目标 40 岁」这个已知缺陷。

> ⚠️ **绝对不要为了让 `simulate` 通过而放宽断言值或篡改文档目标。**
> 这个项目历史上就是因为「验证脚本没留在仓库里」，导致一个 28 岁的数值偏差
> 一直没被发现。`simulate` 失败是缺陷的证据，不是脚本的问题。

`simulate` 失败**不阻塞上传**（README 里已如实记录该问题），但 `typecheck`
和 `validate` 必须通过。

---

## 6. 完整上传流程

```powershell
cd "D:\tools\wechat\job\Wanderveil Poem"

# 1. 前置校验
npm run typecheck
npm run validate

# 2. 确认忽略规则生效（§3.2）
$bad = @()
foreach ($p in 'typings/index.d.ts','_audit/README.md') {
  git check-ignore -q $p
  if ($LASTEXITCODE -ne 0) { $bad += $p }
}
if ($bad) { "❌ 未忽略：$($bad -join ', ') —— 先修 §3 再继续"; exit 1 }

# 3. 看要提交什么（确认没有 typings / _audit / 私有配置）
git status --short

# 4. 暂存
git add -A

# 5. 再次确认暂存区没有不该传的
$forbidden = git diff --cached --name-only | Select-String '^(typings/|_audit/)|project\.private\.config\.json|\.(png|jpg|jpeg|mp3|ttf|woff2?|tmp)$'
if ($forbidden) { "❌ 暂存区含禁止文件：`n$forbidden"; exit 1 }

# 6. 提交（推荐 -m，见 §4；用临时文件则先确认它已被忽略）
$msg = @'
<按 §4 写提交信息>
'@
git commit -m $msg

# 7. 推送
git push origin main
```

---

## 7. 故障排查

### 7.1 推送报 `schannel: AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS`

**症状**：

```
fatal: unable to access 'https://github.com/...': schannel:
AcquireCredentialsHandle failed: SEC_E_NO_CREDENTIALS (0x8009030e)
```

同时 `Resolve-DnsName github.com` 返回 **127.0.0.1**（说明 DNS 被劫持到本地代理）。

**原因**：你运行在 **DSH 沙箱**里。沙箱把 HTTPS 劫持到本地代理，
而受限令牌拿不到 Windows 加密凭证存储，schannel 后端的 TLS 握手无法建立。
`curl.exe` 也一样（它的 libcurl 同样编译了 Schannel）。

**已尝试且无效的方案**（不要重复尝试）：

- ❌ `git -c http.sslBackend=openssl` → `unable to get local issuer certificate`（代理自签，无 CA bundle）
- ❌ `git -c http.sslVerify=false` → 失败在更早的凭证获取阶段，不在校验阶段
- ❌ 找代理 CA 证书 → `.dsh/`、`LOCALAPPDATA`、`ProgramData` 下都没有
- ❌ 配置代理 / 镜像 → 无可用配置

**结论：沙箱内无法推送。** 本地的 `add` / `commit` / `log` / `status` 全部正常，
**只有最后的 `git push` 必须在用户本机执行**。

**要做的**：把这一条报告给用户，附上 §0 的第 ⑤ 步命令，让他自己跑：

```powershell
cd "D:\tools\wechat\job\Wanderveil Poem"
git push origin main
```

如果用户本机也失败：

- **认证问题**（弹窗/401/403）→ 让 Windows 弹出 Git Credential Manager 登录
  `EMTsaigao2333`，或改用 Personal Access Token 当密码
- **想用 SSH** → `git remote set-url origin git@github.com:EMTsaigao2333/Wanderveil-Poem.git`
  （用户机器上还没有 `.ssh` 目录，需先生成 key 并加到 GitHub）
- **`rejected: non-fast-forward`**（远程已有提交）→ `git pull --rebase origin main`
  解决冲突后再 push

### 7.2 `git add -A` 把 `_audit/` 加进来了

检查 `.git/info/exclude` 是否有 BOM（§3.1 坑 1），修掉后：

```powershell
git rm -r --cached _audit
git commit -F .commitmsg.tmp
```

### 7.3 `.gitignore` 写不进去

被微信开发者工具锁定。两个选择：

1. 让用户关闭微信开发者工具后再写
2. 用 `.git/info/exclude` 替代（§3）

### 7.4 提交后 GitHub 上没有显示贡献

邮箱不对。必须用 `16798056+emt23333@users.noreply.github.com`，
不要用全局配置里的 Gitee 邮箱。

---

## 8. 绝对不要做的事

| ❌ | 原因 |
|---|---|
| `git push --force` / `-f` | 会覆盖远程历史 |
| 在忽略规则生效前就 `git add -A` | `typings/`（980KB）和 `_audit/` 会进仓库 |
| 用 `git rm` 而不加 `--cached` 删 `typings/` | 会**真的删掉本地文件**，导致 `tsc` 失败 |
| 为了让 `simulate` 通过而放宽断言 | 掩盖真实缺陷，这个项目已经因此吃过一次亏 |
| 引入 npm 依赖 / 图片 / 音频 / 字体 | 项目刻意零依赖零素材，主包体积敏感 |
| 用 `Set-Content -Encoding UTF8` 写忽略文件 | 会带 BOM，导致首个模式失效 |
| 修改 `appid` / `miniprogramRoot` / `compileType` | 会破坏开发者工具的项目识别 |
| 提交 `project.private.config.json` | 项目规则明确「不入库」 |

---

## 9. 上传后自检

```powershell
# 远程内容是否干净
git ls-tree -r origin/main --name-only | Select-String '^(typings/|_audit/)'   # 应为空
git ls-tree -r origin/main --name-only | Measure-Object                        # 约为 80 个文件
```

预期：**约 80 个文件**，不含 `typings/` 与 `_audit/`。

---

## 附：当前仓库状态快照（2026-10-08）

| 项 | 值 |
|---|---|
| 跟踪文件数 | 80 |
| 分支 | `main` |
| `typings/` | 已从索引移除，本地保留 |
| `_audit/` | 从未入库，由 `.git/info/exclude` 忽略 |
| 忽略规则位置 | `.git/info/exclude`（**不在** `.gitignore`，因后者被锁） |
| `README.md` / `LICENSE` / `LICENSE-CONTENT` | 已就绪 |
| 待推送提交 | `23fbc4c`、`4169a85`、`b74d26a`、`4c312f7`、`9517873` |

**唯一待办：用户在本机执行 `git push origin main`。**

### 已知的遗留小问题

`.gitignore` 里有一行 `_audit/typings/`，是两次 PowerShell 追加操作粘连产生的
（当时 `Add-Content` 没补换行）。**功能上无害**（`_audit/` 与 `typings/` 都已
由 `.git/info/exclude` 覆盖），但语义不通。
等微信开发者工具关闭、`.gitignore` 可写之后，把它改成：

```gitignore
_audit/
typings/
```

两行。
