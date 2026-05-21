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
