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
