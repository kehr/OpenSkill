# OpenSkill

OpenSkill 是一个面向 AI 编程助手的 skill 库，把"高频工作流"（写博客、做 PPT、写周报、Skill 调度引导）打包成可被多种 AI 编程工具直接装载的 plugin。当前发行版包含 4 个 skill：

| Skill | 用途 |
|---|---|
| `using-openskill` | 引导 skill。AI 启动会话时自动加载，告诉助手如何发现和调用 OpenSkill 的其它 skill。 |
| `blogpost-style` | 把 Markdown 文章重写为工程博客风格（可选 Anthropic 风 / OpenAI Research 风），剥离营销话术、补充审慎说明。 |
| `htmlslides` | 从一段自然语言生成单文件 HTML 演示稿，全屏锁定 viewport、键盘导航，可选用系统 Chrome 导出 PDF。 |
| `worksummary` | 抓取 Outlook 周报邮件，按团队汇总进展与风险，并按你历史写作风格起草个人周报。 |

## 支持的 AI 编程工具

| 工具 | 状态 | 安装方式 |
|---|---|---|
| Claude Code | 支持 | 自建 marketplace |
| Codex CLI / Codex App | 支持 | 仓库内置 `.codex-plugin/` manifest |
| Gemini CLI | 支持 | extension |
| Cursor / OpenCode / GitHub Copilot CLI / Factory Droid | 暂不支持 | 计划在下一版本逐步加入 |

底层设计：`skills/` 目录是所有 harness 共享的唯一源，仓库根的多份 manifest（`.claude-plugin/`、`.codex-plugin/`、`gemini-extension.json`）让每个工具用自家的原生 plugin 机制发现 OpenSkill，**不做 build-time 拷贝、不做平台模板渲染**。

## 安装

### Claude Code

```bash
/plugin marketplace add kehr/OpenSkill
/plugin install openskill@openskill-dev
```

安装完成后，**新开会话**或执行 `/clear`、`/compact` 时，SessionStart hook 会自动把 `using-openskill` 的内容注入上下文，模型在第一轮回复前就知道 OpenSkill 的存在。

### Codex CLI / Codex App

OpenSkill 在仓库根提供了 `.codex-plugin/plugin.json`。在 Codex 的 plugin marketplace 搜 `openskill`，按官方流程安装即可。如果需要 subagent 派发能力（部分 skill 会用到），在 `~/.codex/config.toml` 加：

```toml
[features]
multi_agent = true
```

### Gemini CLI

```bash
gemini extensions install https://github.com/kehr/OpenSkill
```

`gemini-extension.json` 指定 `GEMINI.md` 作为 context 文件，Gemini 加载扩展时会自动把 `using-openskill` 的内容拼进上下文。

### 验证安装

在任意一个工具里问助手："你有哪些 OpenSkill skill？"

助手应当列出 `using-openskill`、`blogpost-style`、`htmlslides`、`worksummary` 四个。如果只看到三个或一个，说明 `using-openskill` 没有正确加载，可参考 [排查](#排查)。

## 使用示例

OpenSkill 的 skill 都通过**自然语言触发**：你不需要记命令，描述你想做什么就行。每个 skill 的 description 注册了一组中英文触发短语，模型看到匹配的输入会自动调起对应 skill。

| 想做的事 | 直接说 |
|---|---|
| 把文章改成工程博客风格 | "把这篇博客按 Anthropic 风格重写" / "rewrite in engineering blog style" |
| 生成一份演示稿 | "做一个 PPT 介绍 X" / "generate slides for the team kickoff" |
| 汇总团队周报 | "拉一下本周团队周报" / "summarize this week's team work reports" |

进入 skill 后，每个 skill 会**互动式追问**所需信息（主题、风格、范围、模板等），你按提示回答即可。

## 仓库结构

```
skills/                           所有 skill 的唯一源
  using-openskill/                引导 skill（SessionStart hook 也读它）
  blogpost-style/
  htmlslides/
  worksummary/
.claude-plugin/                   Claude Code 插件 manifest + 自建 marketplace
.codex-plugin/                    Codex CLI/App 插件 manifest
gemini-extension.json             Gemini CLI 扩展 manifest
hooks/                            Claude Code SessionStart hook
  hooks.json                      hook 注册
  run-hook.cmd                    POSIX / Windows 兼容入口
  session-start                   注入 using-openskill 内容的 bash 脚本
CLAUDE.md / AGENTS.md / GEMINI.md 各 harness 的入口文档
assets/                           Codex App 商店所需的 logo / icon
scripts/lint-skills.mjs           零依赖 Node 校验脚本（CI 也跑这个）
.github/workflows/lint.yml        GitHub Actions 自动校验
docs/trds/                        设计文档（TRD）+ 实施计划
specs/                            STE / AGV 架构标准文档
```

## 贡献新 skill

1. **创建目录**：在 `skills/<your-skill-name>/` 下建 `SKILL.md`，frontmatter 至少需要 `name` 和 `description`：

   ```markdown
   ---
   name: your-skill-name
   description: 一句话触发描述（20 至 500 字符，单行；可中英文混用，列出常见触发短语效果最好）
   allowed-tools: Read, Write, Edit, Bash
   ---
   ```

2. **可选子目录**（采用 OpenSkill 的 STE 架构）：
   - `specs/` 执行规范（含验收 checklist）
   - `templates/` 输出模板
   - `examples/` 输出 demo / feature 演示
   - `references/` 深入参考（按需 lazy load）
   - `scripts/` 可执行脚本

3. **本地校验**：

   ```bash
   node scripts/lint-skills.mjs your-skill-name
   ```

   会检查 7 条规则（frontmatter 完整性、name 格式、description 长度、STE 目录是否为目录、examples 是否有内容等）。CI 上 GitHub Actions 跑同一脚本。

4. **架构参考**：见 `specs/ste-standard.md` 和 `specs/agv-standard.md`。已有的 4 个 skill 都遵循 STE + AGV 双轮架构，新 skill 建议沿用。

5. **提 PR**：lint 绿、SKILL.md 描述准确、附上至少一份 examples（如果适用）就可以提。

## 排查

**Claude Code 装好后助手没提到 OpenSkill。**

- 检查 plugin 是否正确装上：`/plugin list` 应该看到 `openskill@openskill-dev`。
- 手动触发 SessionStart：`/clear`，看模型第一回复是否提到 OpenSkill。
- 看 hook 输出：`claude-code --debug` 启动，搜索 `SessionStart` 相关日志。

**Gemini CLI 装好后 `using-openskill` 没加载。**

- 验证 extension：`gemini extensions list` 应该看到 `openskill`。
- 验证 GEMINI.md 被拼进上下文：在会话里问 "what's in your context"，应看到 `using-openskill` 的内容。

**lint 报 `description too short` / `description must be a single line`。**

- description 长度需 20-500 字符，且必须单行（不能含 `\n`）。中文字符按一字符算。
- 不要在 description 里写 "Step 1"、"then run"、"after that" 这类工作流措辞：那是 SKILL.md 正文的事。

## 架构设计

详细设计与权衡见：

- `docs/trds/openskill-superpowers-migration.md`：本仓库当前形态的设计文档（为什么砍掉 CLI、为什么 single source）
- `docs/trds/openskill-superpowers-migration-plan.md`：完整的实施计划（20 个 task / 6 个 phase）
- `specs/ste-standard.md`、`specs/agv-standard.md`：skill 内部架构标准

## 协议

MIT。
