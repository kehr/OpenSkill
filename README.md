# OpenSkill

A skill development framework and distribution tool for AI coding assistants. Provides a complete toolchain from skill creation, development, validation, and building to multi-platform installation.

## Core Philosophy

Build-time rendering, install-time copying. Skill source code uses template variables, `openskill build` compiles them locally into final artifacts for each platform, and installation simply copies the artifacts to the target platform directory with zero runtime rendering.

## Target Platforms

| Platform | Config Directory | Description |
|------|----------|------|
| Claude Code | `~/.claude/` | Anthropic official CLI |
| JoyCode | `~/.joycode/` | Same structure as Claude Code, different path |

To add a new platform, simply add a configuration file under `platforms/` and run `openskill build`.

## Installation

```bash
npm install -g @kehr/openskill
```

## Commands

| Command | Purpose |
|------|------|
| `openskill build` | Build artifacts for all platforms (supports incremental builds) |
| `openskill install <name>` | Install a skill to the target platform (supports version checking) |
| `openskill install --all` | Install all skills |
| `openskill uninstall <name>` | Uninstall a skill (automatically cleans up unreferenced agents) |
| `openskill list` | List available/installed skills |
| `openskill create <name>` | Scaffold a new skill (with STE directory structure) |
| `openskill lint [name]` | Validate skill format compliance (11 rules) |
| `openskill dev` | Watch mode, automatically builds on file changes |

### Common Options

| Flag | Description |
|------|------|
| `--platform <name>` | Specify target platform (auto-detected by default) |
| `--local` | Install to project-level directory instead of user-level |
| `--force` | Force execution, skip version checking |
| `--link` | Use symbolic links instead of copying (for development/debugging) |
| `--verbose` | Output detailed logs |

## Architecture: AGV + STE

All skills are built on two core pillars:

- **STE** (Specs, Templates, Examples) -- defines WHAT to produce and to what quality
- **AGV** (Analysis, Generate, Verify) -- defines HOW to produce it, with mandatory verification

See [STE Standard](specs/ste-standard.md) and [AGV Standard](specs/agv-standard.md) for details.

## Skill Structure

Each skill follows the STE architecture:

```
skill-name/
  SKILL.md              # Main skill file (YAML frontmatter + Markdown)
  skill.json            # Build metadata
  specs/                # Execution specifications, quality standards
  templates/            # Output template formats
  examples/             # Output examples and feature demonstrations
```

The `render` field in `skill.json` declares which files require Handlebars template rendering. Undeclared files are copied as-is, avoiding conflicts with `{{}}` syntax in code examples.

## Built-in Skills

| Skill | Description |
|-------|------|
| weekly-report | Generate high-density, data-driven, problem-oriented manager weekly reports |

## Development

```bash
# Install dependencies
npm install

# Run CLI in development mode
npm run dev -- <command>

# Build CLI + skills
npm run build

# Run tests (34 tests)
npm test

# Validate skills
npm run lint
```

## Project Structure

```
src/
  cli/            # CLI entry point + 7 subcommands
  build/          # Build engine (Handlebars allowlist rendering)
  lint/           # Lint engine + 11 validation rules
  platforms/      # Platform config loader (globally shared module)
  types.ts        # Shared type definitions
skills/           # Skill source code
agents/           # Agent source code
platforms/        # Platform configs (claude.json, joycode.json)
scaffolds/        # Scaffold templates for the create command
tests/            # vitest test suite
dist/
  cli/            # TypeScript compiled output
  skills/         # Multi-platform skill/agent build artifacts
```

## Tech Stack

| Area | Choice |
|------|------|
| Language | TypeScript + ESM (Node.js >= 18) |
| CLI | Commander.js |
| Templating | Handlebars (allowlist rendering mode) |
| Testing | vitest |
| Terminal | picocolors + ora |

## Documentation

- [Design Document](docs/trds/openskill-design.md)
- [Implementation Plan](docs/trds/openskill-plan.md)

## Skill Guides

- [Weekly](docs/guides/weekly/) -- Weekly report automation for managers
