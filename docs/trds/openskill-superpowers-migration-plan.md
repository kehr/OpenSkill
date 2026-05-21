# OpenSkill Multi-Harness Plugin Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate OpenSkill from a TypeScript CLI + per-platform build fan-out into a single-source multi-harness plugin distribution following the obra/superpowers structural pattern, supporting Claude Code, Codex CLI/App, and Gemini CLI.

**Architecture:** The repository becomes the plugin package itself. `skills/` is the single source of truth — no copies, no build-time rendering. Each harness sees the repository through its own native manifest (`.claude-plugin/`, `.codex-plugin/`, `gemini-extension.json`) plus an entry document (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`). A bootstrap skill (`using-openskill`) with an aggressive `description` engages models on every conversation start. A Claude-only `SessionStart` hook provides redundant prompt injection.

**Tech Stack:** Markdown skills, JSON plugin manifests, bash hook scripts (POSIX/Windows polyglot via `run-hook.cmd`), one zero-dependency Node script for lint, GitHub Actions for CI.

**Reference spec:** `docs/trds/openskill-superpowers-migration.md` — read it first.


## File Structure

Files this plan creates, modifies, and deletes. Each task touches a focused subset.

### Creates

| Path | Purpose |
|---|---|
| `.claude-plugin/plugin.json` | Claude Code plugin metadata + hook registration |
| `.claude-plugin/marketplace.json` | Self-hosted marketplace descriptor |
| `.codex-plugin/plugin.json` | Codex CLI/App plugin metadata + `interface` block |
| `assets/app-icon.png` | Codex App icon placeholder (1024x1024 solid color) |
| `assets/openskill-small.svg` | Codex composer icon placeholder |
| `gemini-extension.json` | Gemini CLI extension manifest |
| `hooks/hooks.json` | Claude Code SessionStart hook configuration |
| `hooks/run-hook.cmd` | POSIX/Windows polyglot hook launcher (copied verbatim from superpowers) |
| `hooks/session-start` | Bash script that injects `using-openskill` content as session context |
| `skills/using-openskill/SKILL.md` | Bootstrap skill, aggressive description |
| `skills/using-openskill/references/codex-tools.md` | Codex tool-name mapping table |
| `skills/using-openskill/references/gemini-tools.md` | Gemini CLI tool-name mapping table |
| `CLAUDE.md` | Claude Code entry document, `@` references the bootstrap skill |
| `AGENTS.md` | Generic agent entry document, inline Codex tool mapping |
| `GEMINI.md` | Gemini CLI entry document, `@` references the bootstrap skill |
| `RELEASE-NOTES.md` | `1.0.0` release notes listing breaking changes |
| `scripts/lint-skills.mjs` | Zero-dependency Node lint script (7 rules) |
| `.github/workflows/lint.yml` | GitHub Actions CI invoking the lint script |

### Modifies

| Path | Change |
|---|---|
| `package.json` | Shrink to metadata-only (drop `bin`, `scripts`, `dependencies`, `devDependencies`); version `0.1.0` to `1.0.0` in the final task |
| `README.md` | Full rewrite: per-harness install instructions, skill list, link to TRD |
| `.gitignore` | Add `worksummary/` |

### Deletes

| Path | Reason |
|---|---|
| `src/` (whole tree) | TypeScript CLI + build pipeline retired |
| `dist/` (whole tree) | Per-platform build fan-out retired |
| `platforms/` (whole tree) | Platform abstraction retired (JoyCode gone, Claude no longer needs config) |
| `scaffolds/` (whole tree) | `openskill create` scaffolding retired |
| `agents/` (whole tree) | Was always empty |
| `tests/` (whole tree) | Vitest tests for deleted CLI |
| `tsconfig.json` | No TypeScript source remains |
| `package-lock.json` | No dependencies remain |
| `node_modules/` | No dependencies remain |
| `skills/blogpost-style/skill.json` | Frontmatter is sole source of metadata |
| `skills/htmlslides/skill.json` | Same |
| `skills/worksummary/skill.json` | Same |

### Untouched (explicit allowlist)

`skills/blogpost-style/`, `skills/htmlslides/`, `skills/worksummary/` — body contents and subdirectories. `specs/ste-standard.md`, `specs/agv-standard.md`. All existing `docs/trds/*.md` files. `LICENSE`.

### Phase mapping

| Phase | Tasks | What lands |
|---|---|---|
| P1 | 1-3 | Clearing + .gitignore + placeholder README |
| P2 | 4-7 | Three plugin manifests + assets |
| P3 | 8-12 | `using-openskill` skill + 3 entry documents |
| P4 | 13-14 | Hooks for Claude Code |
| P5 | 15-17 | Delete skill.json + lint script + GitHub Action |
| P6 | 18-20 | README + RELEASE-NOTES + version bump |

Each phase ends with a commit. Tasks within a phase may bundle into one commit if they are tightly related; the commit step is at the end of each phase.


## Phase P1: Clearing

Goal: Strip the CLI, build pipeline, and JoyCode artifacts. After P1 the repo has `skills/` plus `docs/` plus `specs/` plus a placeholder README plus a minimal `package.json`.

### Task 1: Delete the TypeScript codebase and build outputs

**Files:**
- Delete: `src/` (recursive)
- Delete: `dist/` (recursive)
- Delete: `platforms/` (recursive)
- Delete: `scaffolds/` (recursive)
- Delete: `agents/` (recursive — should already be empty)
- Delete: `tests/` (recursive)
- Delete: `tsconfig.json`
- Delete: `package-lock.json`
- Delete: `node_modules/` (recursive)

- [ ] **Step 1: Verify the deletion targets exist before removal**

Run:
```bash
ls -d src/ dist/ platforms/ scaffolds/ agents/ tests/ tsconfig.json package-lock.json 2>&1
```

Expected: each path either listed (present) or `No such file or directory`. Record which ones exist; this is the baseline.

- [ ] **Step 2: Remove the directories and files**

Run:
```bash
rm -rf src/ dist/ platforms/ scaffolds/ agents/ tests/ node_modules/
rm -f tsconfig.json package-lock.json
```

- [ ] **Step 3: Verify nothing important was caught in the wake**

Run:
```bash
ls skills/ docs/ specs/ hooks/ 2>&1
ls -a | grep -E "^(skills|docs|specs|README|LICENSE|package\.json|\.git|\.gitignore|worksummary)$"
```

Expected: `skills/`, `docs/`, `specs/` all still present. `hooks/` does not exist yet (P4 creates it). `README.md`, `LICENSE`, `package.json`, `.git`, `.gitignore` all present. No stray top-level files.

- [ ] **Step 4: Confirm nothing else references the deleted code**

Run:
```bash
grep -rE "openskill (build|install|uninstall|lint|dev|create)" --include="*.md" --include="*.json" --include="*.mjs" --include="*.yml" 2>/dev/null | grep -v "docs/trds/openskill-superpowers-migration"
```

Expected: zero hits (the TRD itself is allowed to mention these commands). If any other file mentions the old commands, note it for Task 18 (README rewrite) to clean up.

### Task 2: Shrink package.json to metadata-only

**Files:**
- Modify: `package.json` (full rewrite)

- [ ] **Step 1: Read the current `package.json`**

Run:
```bash
cat package.json
```

Confirm fields present: `name`, `version`, `description`, `type`, `bin`, `files`, `scripts`, `keywords`, `license`, `publishConfig`, `dependencies`, `devConfig`, `engines`.

- [ ] **Step 2: Replace `package.json` with the minimal version**

Write the following to `package.json`:

```json
{
  "name": "@kehr/openskill",
  "version": "0.1.0",
  "description": "Agentic skills library for Claude Code, Codex CLI/App, and Gemini CLI",
  "license": "MIT",
  "homepage": "https://github.com/kehr/OpenSkill",
  "repository": {
    "type": "git",
    "url": "https://github.com/kehr/OpenSkill"
  },
  "keywords": [
    "ai",
    "skill",
    "claude",
    "codex",
    "gemini",
    "plugin"
  ]
}
```

Note: the version stays `0.1.0` here; Task 20 (P6) bumps it to `1.0.0` in the same commit as the release notes.

- [ ] **Step 3: Validate the JSON parses**

Run:
```bash
python3 -c "import json; json.load(open('package.json'))" && echo "ok"
```

Expected: `ok`.

### Task 3: Add worksummary to .gitignore and replace README with a placeholder

**Files:**
- Modify: `.gitignore`
- Modify: `README.md` (full replacement)

- [ ] **Step 1: Add `worksummary/` to `.gitignore`**

Append to `.gitignore` (do not duplicate if already present):

```
# Runtime state generated by skills/worksummary
worksummary/
```

Run to verify:
```bash
grep -n "^worksummary/" .gitignore
```

Expected: one line `worksummary/`.

- [ ] **Step 2: Write a placeholder README pointing at the migration TRD**

Write the following to `README.md`:

```markdown
# OpenSkill

> **Migration in progress.** OpenSkill is being converted from a TypeScript CLI distribution into a multi-harness plugin layout (Claude Code, Codex CLI/App, Gemini CLI). The old `openskill` CLI has been removed. See `docs/trds/openskill-superpowers-migration.md` for the design and migration plan.

Final installation instructions and skill documentation will appear here once the migration completes (tracked in `docs/trds/openskill-superpowers-migration-plan.md`).
```

- [ ] **Step 3: Commit Phase P1**

Run:
```bash
git status
git add -A
git status
git commit -m "chore(migration): P1 clear CLI, build pipeline, JoyCode artifacts"
```

Expected `git status` before commit: deleted `src/`, `dist/`, `platforms/`, `scaffolds/`, `tests/`, `tsconfig.json`, `package-lock.json`; modified `package.json`, `README.md`, `.gitignore`. (`node_modules/` and `agents/` likely already untracked.)

Expected after commit: clean working tree, one new commit on `main`.


## Phase P2: Plugin manifests

Goal: Each harness can discover OpenSkill as an installable plugin. No hooks, no entry documents — those are P3 and P4.

### Task 4: Create Claude Code plugin manifest

**Files:**
- Create: `.claude-plugin/plugin.json`

- [ ] **Step 1: Create the directory and write `plugin.json`**

Create directory `.claude-plugin/` if it does not exist, then write:

```json
{
  "name": "openskill",
  "description": "Agentic skills library for Claude Code: blog post styling, HTML deck generation, work summary automation",
  "version": "1.0.0",
  "author": {
    "name": "kehr",
    "email": "zhwangkaixuan@gmail.com"
  },
  "homepage": "https://github.com/kehr/OpenSkill",
  "repository": "https://github.com/kehr/OpenSkill",
  "license": "MIT",
  "keywords": [
    "skills",
    "blogpost",
    "presentation",
    "weekly",
    "automation"
  ]
}
```

Note: `version` here is `1.0.0` because plugin marketplaces consume this field independently of `package.json`. The `package.json` bump to `1.0.0` happens in Task 20.

- [ ] **Step 2: Validate the JSON parses**

Run:
```bash
python3 -c "import json; json.load(open('.claude-plugin/plugin.json'))" && echo "ok"
```

Expected: `ok`.

### Task 5: Create Claude Code self-hosted marketplace manifest

**Files:**
- Create: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Write the marketplace descriptor**

Write to `.claude-plugin/marketplace.json`:

```json
{
  "name": "openskill-dev",
  "description": "Development marketplace for the OpenSkill skills library",
  "owner": {
    "name": "kehr",
    "email": "zhwangkaixuan@gmail.com"
  },
  "plugins": [
    {
      "name": "openskill",
      "description": "Agentic skills library for Claude Code: blog post styling, HTML deck generation, work summary automation",
      "version": "1.0.0",
      "source": "./",
      "author": {
        "name": "kehr",
        "email": "zhwangkaixuan@gmail.com"
      }
    }
  ]
}
```

- [ ] **Step 2: Validate the JSON parses**

Run:
```bash
python3 -c "import json; json.load(open('.claude-plugin/marketplace.json'))" && echo "ok"
```

Expected: `ok`.

### Task 6: Create Codex CLI/App plugin manifest and asset placeholders

**Files:**
- Create: `.codex-plugin/plugin.json`
- Create: `assets/app-icon.png`
- Create: `assets/openskill-small.svg`

- [ ] **Step 1: Write `.codex-plugin/plugin.json`**

Write to `.codex-plugin/plugin.json`:

```json
{
  "name": "openskill",
  "version": "1.0.0",
  "description": "Agentic skills library: blog post styling, HTML deck generation, work summary automation",
  "author": {
    "name": "kehr",
    "email": "zhwangkaixuan@gmail.com",
    "url": "https://github.com/kehr"
  },
  "homepage": "https://github.com/kehr/OpenSkill",
  "repository": "https://github.com/kehr/OpenSkill",
  "license": "MIT",
  "keywords": [
    "skills",
    "blogpost",
    "presentation",
    "weekly",
    "automation"
  ],
  "skills": "./skills/",
  "interface": {
    "displayName": "OpenSkill",
    "shortDescription": "Blog post styling, HTML deck generation, work summary automation",
    "longDescription": "OpenSkill bundles three production skills (blogpost-style, htmlslides, worksummary) plus a bootstrap skill (using-openskill) that engages the skill system at conversation start.",
    "developerName": "kehr",
    "category": "Productivity",
    "capabilities": [
      "Interactive",
      "Read",
      "Write"
    ],
    "defaultPrompt": [
      "Help me write a blog post in engineering-blog voice.",
      "Generate an HTML presentation deck from this outline."
    ],
    "websiteURL": "https://github.com/kehr/OpenSkill",
    "brandColor": "#3B82F6",
    "composerIcon": "./assets/openskill-small.svg",
    "logo": "./assets/app-icon.png",
    "screenshots": []
  }
}
```

- [ ] **Step 2: Create the SVG icon placeholder**

Write to `assets/openskill-small.svg`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="6" fill="#3B82F6"/>
  <text x="16" y="22" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="#FFFFFF">OS</text>
</svg>
```

- [ ] **Step 3: Create the PNG icon placeholder**

Run (uses Python's built-in `struct` to produce a 1024x1024 solid blue PNG — no external library required):

```bash
python3 <<'PY'
import struct, zlib, pathlib
W = H = 1024
# Solid #3B82F6 (R=59, G=130, B=246), opaque
pixel = bytes([59, 130, 246, 255])
raw = b''.join(b'\x00' + pixel * W for _ in range(H))  # filter byte 0 per scanline
def chunk(typ, data):
    return struct.pack(">I", len(data)) + typ + data + struct.pack(">I", zlib.crc32(typ + data))
sig = b'\x89PNG\r\n\x1a\n'
ihdr = struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0)  # 8-bit, RGBA, no interlace
png = sig + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
pathlib.Path("assets/app-icon.png").write_bytes(png)
print(f"wrote {len(png)} bytes")
PY
```

Expected: `wrote <number> bytes` (typically under 5000 bytes for a solid color PNG).

- [ ] **Step 4: Validate the manifest and inspect the PNG**

Run:
```bash
python3 -c "import json; json.load(open('.codex-plugin/plugin.json'))" && echo "ok"
file assets/app-icon.png
```

Expected: `ok` then `assets/app-icon.png: PNG image data, 1024 x 1024, 8-bit/color RGBA, non-interlaced`.

### Task 7: Create Gemini CLI extension manifest and commit Phase P2

**Files:**
- Create: `gemini-extension.json`

- [ ] **Step 1: Write `gemini-extension.json`**

Write to `gemini-extension.json`:

```json
{
  "name": "openskill",
  "description": "Agentic skills library for Gemini CLI: blog post styling, HTML deck generation, work summary automation",
  "version": "1.0.0",
  "contextFileName": "GEMINI.md"
}
```

- [ ] **Step 2: Validate**

Run:
```bash
python3 -c "import json; json.load(open('gemini-extension.json'))" && echo "ok"
```

Expected: `ok`.

- [ ] **Step 3: Commit Phase P2**

Run:
```bash
git status
git add .claude-plugin/ .codex-plugin/ assets/ gemini-extension.json
git status
git commit -m "feat(migration): P2 add Claude/Codex/Gemini plugin manifests"
```

Expected after commit: `git log --oneline -2` shows P1 then P2 commits on `main`.


## Phase P3: Entry documents + using-openskill skill

Goal: Each harness loads a short entry document that points at the `using-openskill` bootstrap skill. The skill itself ships with a tool-mapping reference file for each non-Claude harness.

### Task 8: Create the `using-openskill` skill body

**Files:**
- Create: `skills/using-openskill/SKILL.md`

- [ ] **Step 1: Write `skills/using-openskill/SKILL.md`**

Write to `skills/using-openskill/SKILL.md`:

```markdown
---
name: using-openskill
description: Use when starting any conversation - establishes how to find and use OpenSkill skills, requiring Skill tool invocation before ANY response including clarifying questions
---

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance an OpenSkill skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
</EXTREMELY-IMPORTANT>

## What OpenSkill Provides

OpenSkill is a focused skills library for AI coding assistants. The currently shipped skills are:

| Skill | When to use |
|---|---|
| `blogpost-style` | Optimize a Markdown blog post for engineering-blog voice (Anthropic or OpenAI Research). Triggers on phrases like "优化文章风格", "rewrite in engineering blog style". |
| `htmlslides` | Generate a single-file HTML presentation deck from a natural-language prompt. Triggers on phrases like "做一个 PPT", "generate slides", "deck slides". |
| `worksummary` | Summarize team work reports from Outlook, aggregate progress with risk analysis, generate a work summary. |

## Instruction Priority

OpenSkill skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User explicit instructions** (CLAUDE.md, AGENTS.md, GEMINI.md, direct requests) -- highest priority
2. **OpenSkill skills** -- override default behavior where they conflict
3. **Default system prompt** -- lowest priority

## How to Access Skills

**In Claude Code:** use the `Skill` tool. When you invoke a skill, its content is loaded -- follow it directly. Never use the `Read` tool on skill files.

**In Codex CLI/App:** skills load natively. See `references/codex-tools.md` for tool-name mapping.

**In Gemini CLI:** skills activate via `activate_skill`. See `references/gemini-tools.md` for tool-name mapping.

## The Rule

Invoke a relevant skill BEFORE any response or action. Even a 1 percent chance a skill might apply is enough -- invoke and check. If the skill turns out not to fit, you can drop it; the cost of invoking is low, the cost of skipping a relevant skill is high.

## Red Flags

These thoughts mean STOP -- you are rationalizing skipping a skill:

| Thought | Reality |
|---|---|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "The skill is overkill" | Simple things become complex. Use it. |

## Platform Adaptation

Skills use Claude Code tool names. Non-Claude platforms: load the appropriate reference file:

- Codex CLI/App -- `references/codex-tools.md`
- Gemini CLI -- `references/gemini-tools.md` (auto-loaded via GEMINI.md @-reference)
```

- [ ] **Step 2: Verify the frontmatter parses and the file is non-empty**

Run:
```bash
head -5 skills/using-openskill/SKILL.md
wc -l skills/using-openskill/SKILL.md
```

Expected: first line `---`, lines 2 and 3 are the `name` and `description`, line 4 is `---`. Total line count above 40.

### Task 9: Create the Codex tool mapping reference

**Files:**
- Create: `skills/using-openskill/references/codex-tools.md`

- [ ] **Step 1: Write the Codex tool mapping**

Write to `skills/using-openskill/references/codex-tools.md`:

```markdown
# Codex Tool Mapping

OpenSkill skills use Claude Code tool names. When you encounter these in a skill, use the Codex equivalent:

| Skill references | Codex equivalent |
|---|---|
| `Task` tool (dispatch subagent) | `spawn_agent` (see Subagent dispatch below) |
| Multiple `Task` calls (parallel) | Multiple `spawn_agent` calls |
| Task returns result | `wait_agent` |
| Task completes automatically | `close_agent` to free slot |
| `TodoWrite` (task tracking) | `update_plan` |
| `Skill` tool (invoke a skill) | Skills load natively -- just follow the instructions |
| `Read`, `Write`, `Edit` (files) | Use your native file tools |
| `Bash` (run commands) | Use your native shell tools |

## Subagent dispatch requires multi-agent support

Add to your Codex config (`~/.codex/config.toml`):

```toml
[features]
multi_agent = true
```

This enables `spawn_agent`, `wait_agent`, and `close_agent` for any skill that dispatches subagents.

## Environment detection

Skills that create worktrees or finish branches should detect their environment with read-only git commands before proceeding:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` -- already in a linked worktree (skip creation)
- `BRANCH` empty -- detached HEAD (cannot branch/push/PR from sandbox)
```

- [ ] **Step 2: Verify file exists**

Run:
```bash
wc -l skills/using-openskill/references/codex-tools.md
```

Expected: line count above 20.

### Task 10: Create the Gemini CLI tool mapping reference

**Files:**
- Create: `skills/using-openskill/references/gemini-tools.md`

- [ ] **Step 1: Write the Gemini tool mapping**

Write to `skills/using-openskill/references/gemini-tools.md`:

```markdown
# Gemini CLI Tool Mapping

OpenSkill skills use Claude Code tool names. When you encounter these in a skill, use the Gemini CLI equivalent:

| Skill references | Gemini CLI equivalent |
|---|---|
| `Read` (file reading) | `read_file` |
| `Write` (file creation) | `write_file` |
| `Edit` (file editing) | `replace` |
| `Bash` (run commands) | `run_shell_command` |
| `Grep` (search file content) | `grep_search` |
| `Glob` (search files by name) | `glob` |
| `TodoWrite` (task tracking) | `write_todos` |
| `Skill` tool (invoke a skill) | `activate_skill` |
| `WebSearch` | `google_web_search` |
| `WebFetch` | `web_fetch` |
| `Task` tool (dispatch subagent) | `@agent-name` (see Subagent support below) |

## Subagent support

Gemini CLI supports subagents natively via the `@` syntax. Use the built-in `@generalist` agent to dispatch any task -- it has access to all tools and follows the prompt you provide.

When a skill says to dispatch a subagent, use `@generalist` with the full prompt the skill specifies. The prompt template itself carries the agent role and expected output format.

## Parallel dispatch

Gemini CLI supports parallel subagent dispatch. When a skill asks you to dispatch multiple independent subagent tasks in parallel, request all `@generalist` invocations together in the same prompt.

## Additional Gemini CLI tools

These tools are available in Gemini CLI but have no Claude Code equivalent:

| Tool | Purpose |
|---|---|
| `list_directory` | List files and subdirectories |
| `save_memory` | Persist facts to GEMINI.md across sessions |
| `ask_user` | Request structured input from the user |
| `tracker_create_task` | Rich task management |
```

- [ ] **Step 2: Verify file exists**

Run:
```bash
wc -l skills/using-openskill/references/gemini-tools.md
```

Expected: line count above 20.

### Task 11: Create CLAUDE.md and GEMINI.md entry documents

**Files:**
- Create: `CLAUDE.md`
- Create: `GEMINI.md`

- [ ] **Step 1: Write `CLAUDE.md`**

Write to `CLAUDE.md`:

```markdown
# OpenSkill -- Claude Code Entry

This repository ships agentic skills for Claude Code. The bootstrap skill below should engage on every conversation start.

@./skills/using-openskill/SKILL.md

## Contributing

See `docs/trds/openskill-superpowers-migration.md` for the repository architecture. New skills go under `skills/<name>/` with a `SKILL.md` frontmatter (`name` + `description` + optional `allowed-tools`); no `skill.json` is required.
```

- [ ] **Step 2: Write `GEMINI.md`**

Write to `GEMINI.md`:

```markdown
# OpenSkill -- Gemini CLI Entry

This repository ships agentic skills for Gemini CLI. The bootstrap skill below should engage on every conversation start; the tool-mapping reference covers Gemini-specific tool names.

@./skills/using-openskill/SKILL.md
@./skills/using-openskill/references/gemini-tools.md

## Contributing

See `docs/trds/openskill-superpowers-migration.md` for the repository architecture.
```

- [ ] **Step 3: Verify both files exist**

Run:
```bash
head -3 CLAUDE.md GEMINI.md
```

Expected: each starts with `# OpenSkill -- ...`.

### Task 12: Create AGENTS.md and commit Phase P3

**Files:**
- Create: `AGENTS.md`

Reason `AGENTS.md` is separate from `CLAUDE.md` and `GEMINI.md`: Codex CLI/App and other generic agent runners load `AGENTS.md` and may not support `@` references the same way Claude/Gemini do. `AGENTS.md` carries the bootstrap content plus the Codex tool mapping inline as a fallback.

- [ ] **Step 1: Compose `AGENTS.md` with inline tool mapping**

Write to `AGENTS.md` (the content combines a short header with the bootstrap skill content and an inline copy of `codex-tools.md` -- the engineer reading this task: copy verbatim, do not paraphrase):

```markdown
# OpenSkill -- Generic Agent Entry

This repository ships agentic skills. Skills are located under `skills/`. The bootstrap content below should engage on every conversation start.

If your platform supports `@` references, you may also use: `@./skills/using-openskill/SKILL.md`. If not, the bootstrap content and Codex tool mapping are inlined below.

## Bootstrap Skill: using-openskill

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance an OpenSkill skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.
</EXTREMELY-IMPORTANT>

### Shipped skills

| Skill | When to use |
|---|---|
| `blogpost-style` | Optimize a Markdown blog post for engineering-blog voice. |
| `htmlslides` | Generate a single-file HTML presentation deck. |
| `worksummary` | Summarize team work reports, aggregate progress, generate work summary. |

### Instruction Priority

1. User explicit instructions (CLAUDE.md, AGENTS.md, GEMINI.md, direct requests)
2. OpenSkill skills
3. Default system prompt

## Codex Tool Mapping

OpenSkill skills use Claude Code tool names. Codex equivalents:

| Skill references | Codex equivalent |
|---|---|
| `Task` tool (dispatch subagent) | `spawn_agent` (requires `multi_agent = true` in `~/.codex/config.toml`) |
| Multiple `Task` calls (parallel) | Multiple `spawn_agent` calls |
| Task returns result | `wait_agent` |
| Task completes automatically | `close_agent` to free slot |
| `TodoWrite` (task tracking) | `update_plan` |
| `Skill` tool (invoke a skill) | Skills load natively |
| `Read`, `Write`, `Edit` (files) | Use your native file tools |
| `Bash` (run commands) | Use your native shell tools |

## Contributing

See `docs/trds/openskill-superpowers-migration.md` for the repository architecture.
```

- [ ] **Step 2: Verify all three entry documents exist and have skill references**

Run:
```bash
grep -l "using-openskill" CLAUDE.md AGENTS.md GEMINI.md
```

Expected: all three filenames listed.

- [ ] **Step 3: Commit Phase P3**

Run:
```bash
git status
git add skills/using-openskill/ CLAUDE.md AGENTS.md GEMINI.md
git status
git commit -m "feat(migration): P3 add using-openskill bootstrap skill and entry docs"
```


## Phase P4: Claude Code hooks

Goal: Claude Code's `SessionStart` event injects the `using-openskill` skill content as additional context for the model. This is redundant with the skill's aggressive `description` (which engages the skill on its own) but provides belt-and-suspenders reliability on Claude.

### Task 13: Create the hooks scripts

**Files:**
- Create: `hooks/hooks.json`
- Create: `hooks/run-hook.cmd`
- Create: `hooks/session-start`

- [ ] **Step 1: Write `hooks/hooks.json`**

Write to `hooks/hooks.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|clear|compact",
        "hooks": [
          {
            "type": "command",
            "command": "\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start",
            "async": false
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Write `hooks/run-hook.cmd` (POSIX/Windows polyglot, copied from superpowers)**

Write to `hooks/run-hook.cmd` (the leading `: << 'CMDBLOCK'` makes the file a no-op for bash while `cmd.exe` interprets the batch section verbatim):

```
: << 'CMDBLOCK'
@echo off
REM Cross-platform polyglot wrapper for hook scripts.
REM On Windows: cmd.exe runs the batch portion, which finds and calls bash.
REM On Unix: the shell interprets this as a script (: is a no-op in bash).
REM
REM Hook scripts use extensionless filenames (e.g. "session-start" not
REM "session-start.sh") so Claude Code's Windows auto-detection -- which
REM prepends "bash" to any command containing .sh -- doesn't interfere.
REM
REM Usage: run-hook.cmd <script-name> [args...]

if "%~1"=="" (
    echo run-hook.cmd: missing script name >&2
    exit /b 1
)

set "HOOK_DIR=%~dp0"

REM Try Git for Windows bash in standard locations
if exist "C:\Program Files\Git\bin\bash.exe" (
    "C:\Program Files\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)
if exist "C:\Program Files (x86)\Git\bin\bash.exe" (
    "C:\Program Files (x86)\Git\bin\bash.exe" "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)

REM Try bash on PATH (e.g. user-installed Git Bash, MSYS2, Cygwin)
where bash >nul 2>nul
if %ERRORLEVEL% equ 0 (
    bash "%HOOK_DIR%%~1" %2 %3 %4 %5 %6 %7 %8 %9
    exit /b %ERRORLEVEL%
)

REM No bash found - exit silently rather than error
REM (plugin still works, just without SessionStart context injection)
exit /b 0
CMDBLOCK

# Unix: run the named script directly
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$1"
shift
exec bash "${SCRIPT_DIR}/${SCRIPT_NAME}" "$@"
```

- [ ] **Step 3: Write `hooks/session-start`**

Write to `hooks/session-start` (this is the OpenSkill version -- the wording is adapted from superpowers but references `using-openskill`):

```bash
#!/usr/bin/env bash
# SessionStart hook for OpenSkill plugin
# Reads skills/using-openskill/SKILL.md and emits it as additional context.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

using_openskill_content=$(cat "${PLUGIN_ROOT}/skills/using-openskill/SKILL.md" 2>&1 || echo "Error reading using-openskill skill")

escape_for_json() {
    local s="$1"
    s="${s//\\/\\\\}"
    s="${s//\"/\\\"}"
    s="${s//$'\n'/\\n}"
    s="${s//$'\r'/\\r}"
    s="${s//$'\t'/\\t}"
    printf '%s' "$s"
}

using_openskill_escaped=$(escape_for_json "$using_openskill_content")

session_context="<EXTREMELY_IMPORTANT>\nYou have OpenSkill.\n\n**Below is the full content of the 'using-openskill' skill -- your introduction to using OpenSkill. For all other skills, use the 'Skill' tool:**\n\n${using_openskill_escaped}\n</EXTREMELY_IMPORTANT>"

# Claude Code expects hookSpecificOutput.additionalContext
# Other harnesses that may invoke this script (Cursor, Copilot CLI) expect different keys -- support all three.
if [ -n "${CURSOR_PLUGIN_ROOT:-}" ]; then
  printf '{\n  "additional_context": "%s"\n}\n' "$session_context"
elif [ -n "${CLAUDE_PLUGIN_ROOT:-}" ] && [ -z "${COPILOT_CLI:-}" ]; then
  printf '{\n  "hookSpecificOutput": {\n    "hookEventName": "SessionStart",\n    "additionalContext": "%s"\n  }\n}\n' "$session_context"
else
  printf '{\n  "additionalContext": "%s"\n}\n' "$session_context"
fi

exit 0
```

- [ ] **Step 4: Make hook scripts executable**

Run:
```bash
chmod +x hooks/run-hook.cmd hooks/session-start
ls -l hooks/
```

Expected: both files show `-rwxr-xr-x` (or at minimum executable for owner).

- [ ] **Step 5: Smoke-test the hook locally**

Run:
```bash
CLAUDE_PLUGIN_ROOT="$(pwd)" ./hooks/run-hook.cmd session-start | head -3
```

Expected: the output begins with `{`, contains `"hookSpecificOutput"` (because `CLAUDE_PLUGIN_ROOT` is set and `COPILOT_CLI` is not), and includes escaped `using-openskill` content. If the JSON looks malformed, re-check that `session-start` was written with literal `\n` escape sequences inside the `printf` template.

- [ ] **Step 6: Validate emitted JSON parses**

Run:
```bash
CLAUDE_PLUGIN_ROOT="$(pwd)" ./hooks/run-hook.cmd session-start | python3 -c "import json,sys; data=json.load(sys.stdin); print('ok' if 'hookSpecificOutput' in data else 'missing key')"
```

Expected: `ok`.

### Task 14: Register the hook in plugin.json and commit Phase P4

**Files:**
- Modify: `.claude-plugin/plugin.json`

- [ ] **Step 1: Add the `hooks` field to `.claude-plugin/plugin.json`**

Edit `.claude-plugin/plugin.json` to add a `hooks` field pointing at the hook configuration. The final file content should be:

```json
{
  "name": "openskill",
  "description": "Agentic skills library for Claude Code: blog post styling, HTML deck generation, work summary automation",
  "version": "1.0.0",
  "author": {
    "name": "kehr",
    "email": "zhwangkaixuan@gmail.com"
  },
  "homepage": "https://github.com/kehr/OpenSkill",
  "repository": "https://github.com/kehr/OpenSkill",
  "license": "MIT",
  "keywords": [
    "skills",
    "blogpost",
    "presentation",
    "weekly",
    "automation"
  ],
  "hooks": "./hooks/hooks.json"
}
```

The only change from Task 4 is the appended `"hooks": "./hooks/hooks.json"` field.

- [ ] **Step 2: Validate**

Run:
```bash
python3 -c "import json; d=json.load(open('.claude-plugin/plugin.json')); assert d['hooks']=='./hooks/hooks.json'; print('ok')"
```

Expected: `ok`.

- [ ] **Step 3: Commit Phase P4**

Run:
```bash
git status
git add hooks/ .claude-plugin/plugin.json
git status
git commit -m "feat(migration): P4 add Claude Code SessionStart hook"
```


## Phase P5: Delete skill.json + lint rewrite

Goal: Remove the now-redundant `skill.json` files and replace the deleted TypeScript lint engine with a zero-dependency Node script, wired into GitHub Actions.

### Task 15: Delete the three skill.json files

**Files:**
- Delete: `skills/blogpost-style/skill.json`
- Delete: `skills/htmlslides/skill.json`
- Delete: `skills/worksummary/skill.json`

- [ ] **Step 1: Pre-flight search for any remaining references**

Run:
```bash
grep -rE "skill\\.json" --include="*.md" --include="*.mjs" --include="*.json" --include="*.yml" 2>/dev/null | grep -v "docs/trds/openskill-superpowers-migration"
```

Expected: zero hits. If anything other than the migration TRD/plan mentions `skill.json`, fix or remove that reference first.

- [ ] **Step 2: Delete the three skill.json files**

Run:
```bash
rm skills/blogpost-style/skill.json skills/htmlslides/skill.json skills/worksummary/skill.json
ls skills/blogpost-style/ skills/htmlslides/ skills/worksummary/
```

Expected: no `skill.json` in any of the three listings.

- [ ] **Step 3: Verify each skill's `SKILL.md` still has frontmatter with name + description**

Run:
```bash
for f in skills/blogpost-style/SKILL.md skills/htmlslides/SKILL.md skills/worksummary/SKILL.md; do
  echo "=== $f ==="
  awk '/^---$/{c++; if(c==2)exit} {print}' "$f"
done
```

Expected: each block shows `---` then `name: <kebab>` then `description: ...` then `---`. If any frontmatter is missing fields, fix before continuing.

### Task 16: Write the lint script

**Files:**
- Create: `scripts/lint-skills.mjs`

- [ ] **Step 1: Create the `scripts/` directory if it does not exist**

Run:
```bash
mkdir -p scripts
```

- [ ] **Step 2: Write `scripts/lint-skills.mjs`**

Write the following to `scripts/lint-skills.mjs`. This implements seven lint rules carried over from the deleted TypeScript engine: `skill-md-exists`, `frontmatter-valid`, `name-format`, `description-format`, `description-no-workflow`, `ste-dirs-exist`, `examples-has-content`.

```javascript
#!/usr/bin/env node
// OpenSkill skill linter (zero-dependency, pure Node).
// Replaces the deleted src/lint/ TypeScript engine.
//
// Rules:
//   skill-md-exists           every skill must have SKILL.md
//   frontmatter-valid         SKILL.md must begin with a YAML frontmatter block
//   name-format               frontmatter `name` matches /^[a-z0-9][a-z0-9-]*$/ and equals the directory name
//   description-format        frontmatter `description` exists, is non-empty, is a single line, between 20 and 500 chars
//   description-no-workflow   description must not contain workflow-step phrases (Step 1, then run, etc.)
//   ste-dirs-exist            if specs/ or examples/ or templates/ exists, it must be a directory
//   examples-has-content      if examples/ exists, it must contain at least one file
//
// Usage:
//   node scripts/lint-skills.mjs                 # lint all skills
//   node scripts/lint-skills.mjs blogpost-style  # lint one
//
// Exit code 0 on pass, 1 on any error-severity rule failure.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SKILLS_DIR = 'skills';
const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const WORKFLOW_PATTERNS = [
  /\bStep \d+\b/i,
  /\bthen run\b/i,
  /\bafter that\b/i,
  /\bfirst,? then\b/i,
];

function loadFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  const block = match[1];
  const out = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[m[1]] = v;
    }
  }
  return out;
}

function lintSkill(name) {
  const dir = join(SKILLS_DIR, name);
  const errors = [];
  const warnings = [];

  // rule: skill-md-exists
  const skillMd = join(dir, 'SKILL.md');
  if (!existsSync(skillMd)) {
    errors.push(`${name}: SKILL.md missing`);
    return { errors, warnings };
  }

  const content = readFileSync(skillMd, 'utf-8');

  // rule: frontmatter-valid
  const fm = loadFrontmatter(content);
  if (!fm) {
    errors.push(`${name}: SKILL.md has no YAML frontmatter`);
    return { errors, warnings };
  }

  // rule: name-format
  if (!fm.name) {
    errors.push(`${name}: frontmatter missing 'name'`);
  } else if (!NAME_PATTERN.test(fm.name)) {
    errors.push(`${name}: name '${fm.name}' does not match /^[a-z0-9][a-z0-9-]*$/`);
  } else if (fm.name !== name) {
    errors.push(`${name}: frontmatter name '${fm.name}' does not match directory name '${name}'`);
  }

  // rule: description-format
  if (!fm.description) {
    errors.push(`${name}: frontmatter missing 'description'`);
  } else {
    const d = fm.description;
    if (d.length < 20) errors.push(`${name}: description too short (${d.length} chars, need >= 20)`);
    if (d.length > 500) errors.push(`${name}: description too long (${d.length} chars, max 500)`);
    if (d.includes('\n')) errors.push(`${name}: description must be a single line`);
  }

  // rule: description-no-workflow
  if (fm.description) {
    for (const p of WORKFLOW_PATTERNS) {
      if (p.test(fm.description)) {
        errors.push(`${name}: description contains workflow phrase matching ${p}`);
        break;
      }
    }
  }

  // rule: ste-dirs-exist (only check the ones that are present)
  for (const sub of ['specs', 'templates', 'examples', 'references', 'scripts']) {
    const p = join(dir, sub);
    if (existsSync(p) && !statSync(p).isDirectory()) {
      errors.push(`${name}: ${sub} exists but is not a directory`);
    }
  }

  // rule: examples-has-content
  const ex = join(dir, 'examples');
  if (existsSync(ex) && statSync(ex).isDirectory()) {
    const entries = readdirSync(ex).filter((f) => !f.startsWith('.'));
    if (entries.length === 0) {
      warnings.push(`${name}: examples/ exists but is empty`);
    }
  }

  return { errors, warnings };
}

function main() {
  const target = process.argv[2];
  let names;
  if (target) {
    names = [target];
  } else {
    names = readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  }

  let totalErrors = 0;
  let totalWarnings = 0;
  for (const name of names) {
    const { errors, warnings } = lintSkill(name);
    if (errors.length === 0 && warnings.length === 0) {
      console.log(`ok   ${name}`);
    } else {
      console.log(`FAIL ${name}`);
      for (const e of errors) console.log(`  error: ${e}`);
      for (const w of warnings) console.log(`  warn:  ${w}`);
      totalErrors += errors.length;
      totalWarnings += warnings.length;
    }
  }

  console.log('');
  console.log(`${names.length} skill(s), ${totalErrors} error(s), ${totalWarnings} warning(s)`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

main();
```

- [ ] **Step 3: Run the lint script over the current `skills/` tree**

Run:
```bash
node scripts/lint-skills.mjs
echo "exit=$?"
```

Expected: each of `blogpost-style`, `htmlslides`, `using-openskill`, `worksummary` reports `ok`. Summary line shows `4 skill(s), 0 error(s), 0 warning(s)`. Exit code `0`.

If a skill fails, fix the underlying frontmatter or directory issue rather than weakening the rule.

- [ ] **Step 4: Verify the script detects breakage**

Run a controlled test that deliberately corrupts then restores `description`:

```bash
cp skills/blogpost-style/SKILL.md /tmp/blogpost-style.SKILL.md.bak
sed -i.bak '/^description:/d' skills/blogpost-style/SKILL.md
node scripts/lint-skills.mjs blogpost-style
echo "expected-fail-exit=$?"
cp /tmp/blogpost-style.SKILL.md.bak skills/blogpost-style/SKILL.md
rm skills/blogpost-style/SKILL.md.bak /tmp/blogpost-style.SKILL.md.bak
node scripts/lint-skills.mjs blogpost-style
echo "restored-exit=$?"
```

Expected: `expected-fail-exit=1`, `restored-exit=0`. The intermediate output names the `description` rule failure.

### Task 17: Add the GitHub Actions workflow and commit Phase P5

**Files:**
- Create: `.github/workflows/lint.yml`

- [ ] **Step 1: Create the workflow directory**

Run:
```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Write `.github/workflows/lint.yml`**

Write to `.github/workflows/lint.yml`:

```yaml
name: lint

on:
  pull_request:
  push:
    branches:
      - main

jobs:
  lint-skills:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Lint skills
        run: node scripts/lint-skills.mjs
```

- [ ] **Step 3: Smoke-test the workflow file with a YAML parser**

Run:
```bash
python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/lint.yml')); print('ok')" 2>/dev/null || python3 -c "
import sys
content = open('.github/workflows/lint.yml').read()
assert 'lint-skills:' in content
assert 'node scripts/lint-skills.mjs' in content
print('ok (structural check, pyyaml not installed)')
"
```

Expected: `ok`.

- [ ] **Step 4: Commit Phase P5**

Run:
```bash
git status
git add scripts/lint-skills.mjs .github/workflows/lint.yml
git add -u skills/  # picks up the three skill.json deletions
git status
git commit -m "feat(migration): P5 delete skill.json, add lint script and GitHub Action"
```

Expected: deletions of three `skill.json` files plus new `scripts/lint-skills.mjs` and `.github/workflows/lint.yml`.


## Phase P6: README + RELEASE-NOTES + version bump

Goal: User-facing documentation that explains how to install on each of the three harnesses. Version stamp the new architecture as 1.0.0.

### Task 18: Rewrite the README

**Files:**
- Modify: `README.md` (full replacement)

- [ ] **Step 1: Write the new `README.md`**

Write to `README.md`:

```markdown
# OpenSkill

OpenSkill is an agentic skills library for AI coding assistants. It currently ships four skills:

| Skill | What it does |
|---|---|
| `using-openskill` | Bootstrap. Loaded automatically on conversation start. Tells the assistant how OpenSkill works. |
| `blogpost-style` | Optimize a Markdown blog post for engineering-blog voice (Anthropic or OpenAI Research style). |
| `htmlslides` | Generate a single-file HTML presentation deck from a natural-language prompt, with optional PDF export. |
| `worksummary` | Summarize team work reports from Outlook, aggregate progress with risk analysis, draft a work summary. |

## Supported harnesses

| Harness | Status |
|---|---|
| Claude Code | Supported. Self-hosted marketplace. |
| Codex CLI / Codex App | Supported via `.codex-plugin/` manifest. |
| Gemini CLI | Supported via extension. |
| Cursor, OpenCode, GitHub Copilot CLI, Factory Droid | Not in this release. |

## Installation

### Claude Code

```bash
/plugin marketplace add kehr/OpenSkill
/plugin install openskill@openskill-dev
```

### Codex CLI / Codex App

OpenSkill ships a Codex plugin manifest at `.codex-plugin/plugin.json`. Install via your Codex plugin marketplace's standard flow (search `openskill` in the plugin marketplace, then install).

### Gemini CLI

```bash
gemini extensions install https://github.com/kehr/OpenSkill
```

Verify by asking your assistant: "What OpenSkill skills do you have?"

## Repository layout

```
skills/                       Single source of truth for all skills
.claude-plugin/               Claude Code plugin manifest and marketplace
.codex-plugin/                Codex CLI/App plugin manifest
gemini-extension.json         Gemini CLI extension manifest
hooks/                        Claude Code SessionStart hook (loads using-openskill into session context)
CLAUDE.md / AGENTS.md / GEMINI.md   Per-harness entry documents
scripts/lint-skills.mjs       Zero-dependency lint script (also run in CI)
docs/trds/                    Design documents
specs/                        STE / AGV architecture standards
```

## Contributing a new skill

1. Create `skills/<your-skill-name>/SKILL.md` with frontmatter:

   ```markdown
   ---
   name: your-skill-name
   description: One-line trigger description (20-500 chars, single line)
   ---
   ```

2. Optionally add `specs/`, `templates/`, `examples/`, `references/`, `scripts/` subdirectories under your skill.

3. Run `node scripts/lint-skills.mjs your-skill-name` before opening a PR.

4. See `specs/ste-standard.md` and `specs/agv-standard.md` for the architecture conventions used by existing skills.

## Architecture

See `docs/trds/openskill-superpowers-migration.md` for the design rationale and the structural decisions behind the current layout.

## License

MIT.
```

- [ ] **Step 2: Sanity check the README**

Run:
```bash
head -3 README.md
grep -c "openskill" README.md
```

Expected: title line `# OpenSkill`, then a description line. Grep returns a count above 5.

### Task 19: Write RELEASE-NOTES

**Files:**
- Create: `RELEASE-NOTES.md`

- [ ] **Step 1: Write `RELEASE-NOTES.md`**

Write to `RELEASE-NOTES.md`:

```markdown
# Release Notes

## 1.0.0

First stable release. OpenSkill is now a multi-harness plugin distribution rather than a TypeScript CLI framework.

### Breaking changes

- The `openskill` CLI is removed entirely. Skills are now installed via each harness's native plugin or extension mechanism (Claude Code marketplace, Codex plugin marketplace, Gemini CLI extension).
- The `skill.json` metadata file is removed from every skill. Metadata is sourced from `SKILL.md` frontmatter (`name`, `description`, optional `allowed-tools`).
- The per-platform build fan-out (`dist/skills/<platform>/`) is removed. `skills/` is now the single source of truth across all harnesses.
- JoyCode support is retired and will not return.

### New

- Three plugin manifests at the repository root: `.claude-plugin/plugin.json` (with marketplace), `.codex-plugin/plugin.json` (with interface metadata), `gemini-extension.json`.
- Three entry documents: `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`.
- `using-openskill` bootstrap skill (loaded on conversation start via aggressive description matching).
- Claude Code SessionStart hook (redundant prompt injection alongside the bootstrap skill).
- Zero-dependency lint script at `scripts/lint-skills.mjs`, wired into a GitHub Actions workflow.

### Migrated from 0.1.0

- `skills/blogpost-style/`, `skills/htmlslides/`, `skills/worksummary/` -- body content unchanged.
- `specs/ste-standard.md`, `specs/agv-standard.md` -- unchanged.
- All existing TRDs under `docs/trds/` -- unchanged.

See `docs/trds/openskill-superpowers-migration.md` for the design rationale and `docs/trds/openskill-superpowers-migration-plan.md` for the implementation plan.
```

### Task 20: Bump package.json version and commit Phase P6

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Bump the version field**

Edit `package.json`. The only change is the `version` field:

Before:
```json
  "version": "0.1.0",
```

After:
```json
  "version": "1.0.0",
```

- [ ] **Step 2: Verify**

Run:
```bash
python3 -c "import json; d=json.load(open('package.json')); assert d['version']=='1.0.0'; print('ok')"
```

Expected: `ok`.

- [ ] **Step 3: Final sanity sweep before commit**

Run:
```bash
echo "=== git ls-files | head -40 ==="
git ls-files | head -40
echo ""
echo "=== top-level tree (no node_modules, no .git) ==="
ls -a | grep -vE "^(\.|\.\.|node_modules|\.git)$"
echo ""
echo "=== skill count + lint ==="
node scripts/lint-skills.mjs
```

Expected:
- `git ls-files` shows `.claude-plugin/`, `.codex-plugin/`, `.github/workflows/lint.yml`, `assets/`, `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `gemini-extension.json`, `hooks/`, `README.md`, `RELEASE-NOTES.md`, `scripts/lint-skills.mjs`, `skills/*/SKILL.md` plus subdirs, `specs/`, `docs/`, `package.json`, `LICENSE`, `.gitignore`.
- No `src/`, `dist/`, `platforms/`, `scaffolds/`, `tests/`, `tsconfig.json`, `package-lock.json`, `skill.json`.
- `node scripts/lint-skills.mjs` reports `4 skill(s), 0 error(s), 0 warning(s)`.

- [ ] **Step 4: Commit Phase P6**

Run:
```bash
git status
git add README.md RELEASE-NOTES.md package.json
git status
git commit -m "feat(migration): P6 rewrite README, add RELEASE-NOTES, bump to 1.0.0"
```

- [ ] **Step 5: Verify the six commits landed**

Run:
```bash
git log --oneline -8
```

Expected (most recent first):
```
<hash> feat(migration): P6 rewrite README, add RELEASE-NOTES, bump to 1.0.0
<hash> feat(migration): P5 delete skill.json, add lint script and GitHub Action
<hash> feat(migration): P4 add Claude Code SessionStart hook
<hash> feat(migration): P3 add using-openskill bootstrap skill and entry docs
<hash> feat(migration): P2 add Claude/Codex/Gemini plugin manifests
<hash> chore(migration): P1 clear CLI, build pipeline, JoyCode artifacts
<hash> docs(migration): TRD for OpenSkill multi-harness plugin layout migration
<hash> ... (pre-migration history)
```


## Post-implementation manual verification

These checks are not committable -- they require live harnesses. Run them after the six commits land, before announcing the migration complete.

- [ ] **MV1: Claude Code install**

  In a Claude Code session:
  ```
  /plugin marketplace add <local-path-or-github-url>
  /plugin install openskill@openskill-dev
  ```
  Then start a new conversation and ask "List the OpenSkill skills you have." The model should mention `using-openskill`, `blogpost-style`, `htmlslides`, `worksummary`.

- [ ] **MV2: Claude Code hook fires**

  In a Claude Code session with OpenSkill installed, run `/clear` then start a new turn. The model's first response should demonstrate awareness of OpenSkill (e.g. proactively mention available skills or the bootstrap rule). If the hook does not fire, check `claude-code --debug` logs for `SessionStart` execution.

- [ ] **MV3: Gemini CLI install**

  ```
  gemini extensions install https://github.com/kehr/OpenSkill
  ```
  Then in a Gemini CLI session: "What OpenSkill skills do you have?" Same expected skill list.

- [ ] **MV4: Codex CLI install (deferred if no Codex environment)**

  In a Codex CLI session, search and install the OpenSkill plugin via the standard plugin marketplace flow. Verify the four skills are discoverable.

If MV1-MV3 pass and MV4 either passes or is documented as deferred, the migration is complete. Open a tracking issue for MV4 if it cannot be verified locally.


## Risks and fallbacks (carried forward from TRD)

| Risk | Phase | Fallback |
|---|---|---|
| Codex schema cannot be validated locally without a Codex install | P2 / MV4 | Degrade to structural JSON self-check at P2; defer live verification to MV4 with an explicit tracking issue if no Codex environment is available. |
| `@./...` references not supported in Codex AGENTS.md | P3 | `AGENTS.md` carries the Codex tool mapping inline (Task 12) so Codex never depends on `@`. |
| Lint script misses a rule the deleted TypeScript engine caught | P5 | Compare the seven implemented rules against the TRD table; the four dropped rules (`skill-json-exists`, `platform-config-exists`, `render-files-exist`, `no-unused-template-vars`) are intentionally dropped because their subject has been deleted. |
| `run-hook.cmd` polyglot behavior on Windows | P4 | The script is copied verbatim from superpowers, which has shipped this implementation publicly. Tested in P4 Step 5 on Unix; Windows behavior depends on Git for Windows being installed (graceful no-op otherwise). |


## Self-review checklist

Completed before saving this plan:

1. Spec coverage: every TRD section -> task table.
   - Background -> N/A (rationale, no implementation)
   - Goals & Non-Goals -> covered implicitly by the Files table (creates / modifies / deletes match the goals)
   - Design Decisions -> 7 decisions all reflected (Decision 1 CLI delete = Task 1; Decision 2 three harnesses = Tasks 4-7; Decision 3 JoyCode retired = Task 1's deletion of `platforms/joycode.json` and `dist/skills/joycode/`; Decision 4 self-hosted marketplace = Task 5; Decision 5 Claude-only hooks = Tasks 13-14; Decision 6 aggressive description = Task 8; Decision 7 1.0.0 = Task 20)
   - Target Repository Layout -> Files table top of this plan
   - Hooks & using-openskill -> Tasks 8-14
   - Skill Metadata -> Tasks 15-17
   - Migration Phases -> Phase headings P1-P6
   - Out of Scope -> not implemented (correct -- it is exclusion, not work)
   - References -> not implemented (correct -- it is bibliography)
2. Placeholder scan: searched for "TBD", "TODO", "fill in", "similar to". None present. All code/JSON/markdown blocks are complete and ready to copy verbatim.
3. Type consistency: file paths are exact and consistent across tasks (e.g. `skills/using-openskill/SKILL.md` matches between Task 8, Task 13's hook script, Task 16's lint expectations).
4. CLAUDE.md format rules: no Unicode arrows / ellipsis in prose; no `---` separator lines outside YAML frontmatter and a single allowed cosmetic divider between phases.


## Execution Handoff

Plan complete. Two execution options:

1. **Subagent-Driven (recommended)** -- one fresh subagent per task, with two-stage review between tasks. Best for catching mistakes early and isolating context.
2. **Inline Execution** -- execute the tasks in this session with batch checkpoints. Faster but less isolated.

Which approach?
