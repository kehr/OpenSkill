# OpenSkill Migration to Multi-Harness Plugin Layout

Date: 2026-05-21
Status: Approved (pending implementation)
Author: kehr

## Background

OpenSkill today is a TypeScript CLI framework (`openskill build/install/uninstall/lint/dev`) plus a build-time fan-out pipeline that compiles `skills/` into `dist/skills/<platform>/skills/<name>/`, with one copy per target platform. The current targets are Claude Code and JoyCode.

Two structural problems surfaced during recent work:

1. The `dist/skills/<platform>/...` fan-out creates physical duplicates of every skill. When someone edits a file in one platform's `dist/` copy by hand (as happened with `htmlslides` recently), the other platform's copy silently diverges from source. The repository carries N copies of identical content.
2. The Handlebars template engine (`{{configDir}}`, `{{skillsDir}}`, `{{platformName}}`, `{{homeBase}}`, `{{namespace}}`) was designed to render platform-specific values into skill files at build time. A grep across `skills/` and `agents/` shows zero usages of these variables — every Handlebars hit (21 total) is either Python f-string brace escaping in `worksummary` scripts or `htmlslides` business templates (preset preview rendering). The build-time templating layer ships but is never exercised.

Research into [obra/superpowers](https://github.com/obra/superpowers) — a 14-skill agentic methodology distribution supporting Claude Code, Codex CLI/App, Cursor, Gemini CLI, OpenCode, Factory Droid, and GitHub Copilot CLI — surfaces a different model that fits OpenSkill better:

- Skills exist as a single tree (`skills/`), never copied or rendered.
- Each harness has its own native plugin manifest at the repository root (`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, `gemini-extension.json`, etc.), pointing at the shared `skills/` directory.
- Distribution rides each harness's native marketplace or extension installer; no custom CLI.
- Cross-harness tool name compatibility is solved with reference documents (`references/<harness>-tools.md`) loaded via the harness's native context-file mechanism (`@./...` references in `GEMINI.md`, etc.), not by build-time substitution.

OpenSkill has no published npm package, no JoyCode users to preserve (JoyCode is being retired in this migration), and only three business skills (`blogpost-style`, `htmlslides`, `worksummary`). The cost of a clean break is low, and the structural benefit is substantial: deleting the CLI and the fan-out removes ~30 TypeScript files (`src/`), an entire compiled `dist/skills/` tree, a `platforms/` config layer, a `scaffolds/` directory, and an `agents/` directory that was always empty.

This document describes the target state, the design decisions reached during brainstorming, and the six-phase migration path.

## Goals & Non-Goals

Goals:

- Delete the `openskill` CLI entirely (`src/cli/`, `src/build/`, `src/lint/`, `src/platforms/`, `dist/`).
- Hold `skills/` as the single source of truth — no per-platform copies, no build-time rendering.
- Ship the repository as a multi-harness plugin: one manifest per target harness at the repo root, each pointing at the shared `skills/`.
- Support three harnesses in phase one: Claude Code, Codex CLI/App, Gemini CLI.
- Add a `using-openskill` bootstrap skill with an aggressive `description` (superpowers-style) so models reliably engage the skill system at conversation start.
- Add a Claude Code `SessionStart` hook as a redundant prompt-injection path for the Claude harness specifically.
- Preserve the STE (Specs, Templates, Examples) architecture inside each skill — STE is OpenSkill's own contribution and is orthogonal to platform adaptation.
- Replace the TypeScript lint system with a zero-dependency Node script wired into GitHub Actions.

Non-Goals:

- Cursor, OpenCode, GitHub Copilot CLI, Factory Droid adaptation — deferred to a later phase.
- Submission to the Anthropic claude-plugins-official marketplace — start with a self-hosted marketplace at the repository root; official-marketplace submission is a later decision.
- The OpenAI codex-plugins external sync script (`sync-to-codex-plugin.sh` in superpowers) — Codex CLI/App installs from the repo via its own marketplace; the external sync is a later decision.
- JoyCode support — retired in this migration, will not return.
- Any changes to skill business content — `blogpost-style`, `htmlslides`, `worksummary` skill bodies are moved as-is, not modified.
- The STE standard documents in `specs/` — `specs/ste-standard.md` and `specs/agv-standard.md` are kept verbatim.
- The existing TRDs in `docs/trds/` for individual skills — not touched.

## Design Decisions

Five core decisions were locked during brainstorming.

| # | Decision | Reason |
|---|---|---|
| 1 | Delete the `openskill` CLI entirely | The CLI's two main jobs (build fan-out, install copy) are both unnecessary once skills become a single tree consumed by native harness installers. No npm users to preserve. |
| 2 | Phase-one harnesses: Claude Code, Codex CLI/App, Gemini CLI | Three covers the practical user base. Cursor/OpenCode/Copilot/Droid each cost a manifest plus a verification pass and can be added incrementally. |
| 3 | JoyCode permanently retired | Not selected for phase one. No external dependency forces it to return. Removing it eliminates `platforms/joycode.json`, the entire `dist/skills/joycode/` tree, and the `platforms` field on every `skill.json`. |
| 4 | Claude Code distribution: self-hosted marketplace only | Repository root provides `.claude-plugin/marketplace.json` plus `.claude-plugin/plugin.json`. Users install via `/plugin marketplace add kehr/openskill` then `/plugin install openskill@openskill-dev`. Fully controlled, no external review gate. Official-marketplace submission is a later decision. |
| 5 | Hooks: phase-one Claude Code only | `hooks/hooks.json` plus `hooks/run-hook.cmd` plus `hooks/session-start` target Claude Code's SessionStart event. Codex and Gemini hook protocols are deferred to a later phase; the `using-openskill` skill's aggressive `description` carries the load on those harnesses in phase one. |

A sixth decision — `using-openskill` `description` tone — was set to **aggressive** (superpowers-style): "Use when starting any conversation — requires Skill tool invocation before ANY response". The skill is loaded at session start by description-matching alone, independent of any hook, which keeps Codex and Gemini behavior consistent with Claude.

A seventh decision — `package.json` version — was set to **1.0.0**, framing the migration as the first stable release. The current `0.1.0` was the development baseline; `1.0.0` cleanly marks the new architecture without copying superpowers's `5.x` numbering.

## Target Repository Layout

```
OpenSkill/
  skills/                            # single source of truth (preserved)
    blogpost-style/
    htmlslides/
    worksummary/
    using-openskill/                 # NEW — bootstrap skill
      SKILL.md
      references/
        codex-tools.md
        gemini-tools.md
  hooks/                             # NEW (Claude Code only in phase one)
    hooks.json
    run-hook.cmd
    session-start
  .claude-plugin/                    # NEW
    plugin.json
    marketplace.json
  .codex-plugin/                     # NEW
    plugin.json
  assets/                            # NEW (Codex requires logo + screenshots)
    app-icon.png
    openskill-small.svg
  gemini-extension.json              # NEW
  CLAUDE.md                          # NEW (Claude Code context)
  AGENTS.md                          # NEW (generic agent context, near-duplicate of CLAUDE.md)
  GEMINI.md                          # NEW (Gemini CLI context, uses @./skills/... references)
  README.md                          # REWRITTEN (per-harness install instructions)
  RELEASE-NOTES.md                   # NEW
  LICENSE                            # preserved
  package.json                       # SHRUNK to metadata-only (no bin, no scripts, no deps)
  docs/
    trds/                            # preserved
    superpowers/                     # optional: plan/spec storage (superpowers-style)
  specs/                             # preserved (STE/AGV standards)
  .gitignore                         # add `worksummary/` (runtime data)
```

Deletions:

- `src/` — entire TypeScript source tree (CLI, build, lint, platforms)
- `dist/` — entire compiled output tree
- `platforms/` — `claude.json`, `joycode.json`
- `scaffolds/` — `openskill create` scaffolding
- `agents/` — empty directory
- `tests/` — vitest tests for the deleted CLI
- `tsconfig.json` — no TypeScript code remains
- `package-lock.json`, `node_modules/` — no dependencies remain

The `worksummary/` directory at the repo root is runtime state generated by `skills/worksummary/` scripts. It is not tracked by git today; the migration adds an explicit `.gitignore` entry to prevent future accidents.

## Hooks & using-openskill Skill

Phase one delivers two redundant mechanisms that drive models toward the skill system at conversation start. They overlap intentionally — the hook is Claude-specific; the skill works across all three harnesses.

### SessionStart hook (Claude Code only)

```
hooks/
  hooks.json
  run-hook.cmd
  session-start
```

`hooks.json` registers a `SessionStart` matcher for `startup|clear|compact` that runs `${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd session-start` synchronously. `run-hook.cmd` is a thin POSIX/Windows-compatible launcher (the superpowers implementation is reused verbatim). `session-start` emits a system reminder that instructs the model to consult OpenSkill skills before responding.

The hook is registered in `.claude-plugin/plugin.json`; Codex CLI/App and Gemini CLI ignore the `hooks/` directory.

### using-openskill skill (all three harnesses)

```
skills/using-openskill/
  SKILL.md
  references/
    codex-tools.md
    gemini-tools.md
```

`SKILL.md` frontmatter (aggressive description so the skill is matched on virtually every conversation start):

```markdown
---
name: using-openskill
description: Use when starting any conversation - establishes how to find and use OpenSkill skills, requiring Skill tool invocation before ANY response including clarifying questions
---
```

The body explains: how the skill system works, the three business skills currently shipped (`blogpost-style`, `htmlslides`, `worksummary`), and how to invoke them. The body uses Claude Code tool names verbatim (`Skill`, `TodoWrite`, `Task`, `Read`, `Write`, `Edit`, `Bash`) — this is the convention across all skills.

### Cross-harness tool name compatibility

Skills are written once in Claude Code tool vocabulary. Codex and Gemini use different tool names. The translation happens at the harness's context-loading layer, not in the skill source:

| Harness | Mechanism |
|---|---|
| Claude Code | `CLAUDE.md` uses `@./skills/using-openskill/SKILL.md` reference; native `@`-reference inlines the file at load time. |
| Gemini CLI | `GEMINI.md` uses `@./skills/using-openskill/SKILL.md` plus `@./skills/using-openskill/references/gemini-tools.md`; Gemini's extension loader inlines both. |
| Codex CLI/App | `AGENTS.md` contains the tool mapping inline (cannot assume `@` reference support). `using-openskill/references/codex-tools.md` is the authoritative source; its content is copied verbatim into `AGENTS.md` as a fallback. |

The `references/<harness>-tools.md` files contain tables of the form `Claude name -> harness equivalent` (e.g. `TodoWrite -> todowrite`, `Skill -> skill`).

### Entry-document matrix

| File | Loaded by | Content |
|---|---|---|
| `CLAUDE.md` | Claude Code | Short intro plus `@./skills/using-openskill/SKILL.md` |
| `AGENTS.md` | Generic agent fallback (Codex, others) | Same intro plus `@` reference plus inline copy of `references/codex-tools.md` |
| `GEMINI.md` | Gemini CLI extension | Short intro plus `@./skills/using-openskill/SKILL.md` plus `@./skills/using-openskill/references/gemini-tools.md` |

## Skill Metadata: SKILL.md Frontmatter Only

The current `skills/<name>/skill.json` files duplicate information already present in `SKILL.md` frontmatter (`name`, `description`) and add fields that exist solely to drive the build pipeline being deleted (`platforms`, `render`, `type`, `agents`). After the migration, every `skill.json` field is either redundant or meaningless.

Decision: delete every `skills/*/skill.json` file. Metadata comes from `SKILL.md` frontmatter exclusively:

```markdown
---
name: <skill-name>
description: <one-line trigger description>
allowed-tools: <optional, Claude Code only>
---
```

Verification confirms that all three current skills (`blogpost-style`, `htmlslides`, `worksummary`) already carry complete `name` plus `description` plus `allowed-tools` in their frontmatter. Deleting `skill.json` loses no information.

### STE directories preserved

Each skill keeps its STE architecture:

```
skills/<skill-name>/
  SKILL.md                      # required
  specs/         (optional)     # STE specs — what to produce, to what quality
  templates/     (optional)     # output templates (htmlslides preset previews live here)
  examples/      (optional)     # output demos
  references/    (optional)     # depth references (lazy-loaded on demand)
  scripts/       (optional)     # executable helpers
```

The STE convention is preserved because it is OpenSkill's own contribution and operates entirely inside a skill (independent of any harness or distribution mechanism). `htmlslides/templates/preview-template.html.hbs` is a business-runtime Handlebars template — it renders at skill execution time, not at build time, and survives the migration unchanged.

### Lint: TypeScript engine replaced by Node script

`src/lint/rules/` ships eleven rules. The migration keeps seven, drops four:

| Rule | Disposition | Reason |
|---|---|---|
| `skill-md-exists` | Keep | Still required |
| `frontmatter-valid` | Keep | Still required |
| `name-format` | Keep | Still required |
| `description-format` | Keep | Still required |
| `description-no-workflow` | Keep | Still useful |
| `ste-dirs-exist` | Keep | STE preserved |
| `examples-has-content` | Keep | STE preserved |
| `skill-json-exists` | Drop | `skill.json` deleted |
| `platform-config-exists` | Drop | `platforms/` deleted |
| `render-files-exist` | Drop | Build templating deleted |
| `no-unused-template-vars` | Drop | Build templating deleted |

The seven kept rules are re-implemented in a single zero-dependency Node script: `scripts/lint-skills.mjs`. A GitHub Actions workflow (`.github/workflows/lint.yml`) invokes the script on every PR. Developers can run it locally with `node scripts/lint-skills.mjs`.

## Migration Phases

The migration ships in six PRs, each independently reviewable and revertable. Phase ordering is strict — each phase assumes the prior phase has landed.

### P1: Clearing (destructive baseline)

Scope:

- Delete `src/`, `dist/`, `platforms/`, `scaffolds/`, `agents/`, `tests/`, `tsconfig.json`, `package-lock.json`, `node_modules/`.
- Shrink `package.json` to metadata-only: keep `name`, `version` (still 0.1.0 at this stage, bumped in P6), `license`, `repository`, `homepage`; drop `bin`, `scripts`, `dependencies`, `devDependencies`.
- Add `worksummary/` to `.gitignore`.
- Add a placeholder `README.md` noting the migration is in flight, pointing at this TRD.

Acceptance gates:

- `git ls-files | wc -l` drops substantially (visible reduction in tracked files).
- `skills/` and `docs/` are untouched (`git diff --stat HEAD~1 -- skills/ docs/` shows zero changes).
- `grep -rE "openskill (build|install|uninstall|lint|dev|create)" --include="*.md" --include="*.mjs" --include="*.json"` returns zero hits (no stale references to deleted CLI commands).

### P2: Plugin manifests

Scope:

- Add `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.
- Add `.codex-plugin/plugin.json` plus placeholder `assets/app-icon.png` and `assets/openskill-small.svg`.
- Add `gemini-extension.json`.
- No hooks, no entry documents — keep this PR focused on the manifest layer.

Acceptance gates:

- Claude Code: `/plugin marketplace add <local-path>` plus `/plugin install openskill@openskill-dev` succeeds; the three business skills appear in `/plugin` listing.
- Gemini CLI: `gemini extensions install <local-path>` succeeds; `gemini extensions list` shows OpenSkill.
- Codex CLI/App: if a Codex environment is unavailable locally, the gate degrades to `python3 -c "import json; json.load(open('.codex-plugin/plugin.json'))"` passing schema self-check; live install verification is deferred to post-P6 manual validation.

### P3: Entry documents + using-openskill skill

Scope:

- Add `CLAUDE.md`, `AGENTS.md`, `GEMINI.md`. Each is short and uses `@` references where supported; `AGENTS.md` contains the Codex tool mapping inline as a fallback.
- Add `skills/using-openskill/SKILL.md` with the aggressive description.
- Add `skills/using-openskill/references/codex-tools.md` and `references/gemini-tools.md`.

Acceptance gates:

- Claude Code: starting a new conversation, the model lists `using-openskill`, `blogpost-style`, `htmlslides`, `worksummary` when asked to enumerate available skills.
- Gemini CLI: starting a new conversation, the `using-openskill` content is present in the model's context (verify by asking "what skills do you have").
- Manual review of `references/codex-tools.md` and `references/gemini-tools.md` confirms tool-name mappings are accurate against current Codex and Gemini documentation.

### P4: Hooks (Claude Code)

Scope:

- Add `hooks/hooks.json`, `hooks/run-hook.cmd`, `hooks/session-start`.
- Register the hook in `.claude-plugin/plugin.json` under the `hooks` field.

Acceptance gates:

- Claude Code: starting a new conversation, `/clear`, and `/compact` each trigger the SessionStart hook (verifiable via Claude Code's `--debug` output or hook logs).
- Visual check: after the hook fires, the model's first response demonstrates awareness of the OpenSkill skill system (e.g. mentions consulting skills before acting). Subjective gate, but expected to be obvious in practice.

### P5: Delete skill.json + lint rewrite

Scope:

- Delete `skills/blogpost-style/skill.json`, `skills/htmlslides/skill.json`, `skills/worksummary/skill.json`.
- Add `scripts/lint-skills.mjs` (zero dependencies, pure Node, implements the seven retained rules).
- Add `.github/workflows/lint.yml` running the lint script on every PR.

Acceptance gates:

- `node scripts/lint-skills.mjs` exits 0 with no errors on the current `skills/` tree.
- Deliberately corrupting one frontmatter field (e.g. removing `description` from `skills/htmlslides/SKILL.md`) causes the script to exit non-zero with a specific error message; revert the corruption before commit.
- GitHub Actions workflow runs green on the PR introducing it.
- `grep -rE "skill\\.json" --include="*.md" --include="*.mjs" --include="*.json"` returns zero hits outside this TRD (no surviving references after deletion).

### P6: README + RELEASE-NOTES + version bump

Scope:

- Rewrite `README.md`: install commands for Claude Code, Codex CLI/App, Gemini CLI; skill list; contributor pointer; link to this TRD.
- Add `RELEASE-NOTES.md` with `1.0.0` entry listing breaking changes (CLI deleted, skill.json deleted, JoyCode retired).
- Bump `package.json` version `0.1.0` to `1.0.0`.

Acceptance gates:

- Each of the three install command blocks in `README.md` is copy-pasted and run successfully against a clean environment for that harness.
- `RELEASE-NOTES.md` breaking-change list matches the actual code removals (cross-check by diffing the post-P6 tree against pre-P1 `git ls-files`).

### Risks and fallbacks

| Risk | Phase | Fallback |
|---|---|---|
| Codex `.codex-plugin/plugin.json` schema cannot be validated without a Codex install | P2 | Degrade P2 gate to JSON structural self-check; defer live install verification to post-P6 manual pass. |
| `@./...` references not supported in Codex AGENTS.md loading | P3 | `AGENTS.md` carries the Codex tool mapping inline (redundant with `references/codex-tools.md`); Codex always has full information regardless of `@` support. |
| Removing `skill.json` breaks a stale reference somewhere | P5 | Pre-flight `grep -rE "skill\\.json"` across `--include="*.md" --include="*.mjs" --include="*.json"` before deletion; resolve hits first. |
| `run-hook.cmd` behavior differs on Windows | P4 | Reuse superpowers's `run-hook.cmd` verbatim — the cross-platform launcher has been validated upstream. |

## Out of Scope

Explicitly deferred or refused:

- Cursor, OpenCode, GitHub Copilot CLI, Factory Droid harness adaptation.
- Anthropic claude-plugins-official marketplace submission.
- OpenAI codex-plugins external sync script (`sync-to-codex-plugin.sh`-style automation).
- JoyCode support (permanently retired).
- Any change to `blogpost-style`, `htmlslides`, `worksummary` skill business content.
- Modifications to `specs/ste-standard.md` and `specs/agv-standard.md`.
- Modifications to existing `docs/trds/*.md` files for individual skills.
- A new `openskill` CLI under any name.
- Auto-publishing the repository to npm.

## References

- obra/superpowers: https://github.com/obra/superpowers — research target, structural inspiration.
- OpenSkill current `src/` tree at commit `92def18`: the design being replaced.
- `specs/ste-standard.md`, `specs/agv-standard.md`: skill-internal architecture, preserved.
- `docs/trds/openskill-design.md`, `docs/trds/openskill-plan.md`: original OpenSkill design (kept as historical record).
