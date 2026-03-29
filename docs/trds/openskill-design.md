# OpenSkill Design Document

> Date: 2026-03-28
> Status: Draft

## 1. Overview

OpenSkill is an AI coding assistant Skill development framework and distribution tool. It provides a complete toolchain covering skill creation, development, validation, building, and multi-platform installation.

**Core Philosophy**: Render at build time, copy at install time. Skill source code uses template variables. `openskill build` compiles them locally into final artifacts for each platform. At install time, artifacts are copied directly to the target platform directory with zero runtime rendering.

### 1.1 Target Platforms

| Platform | Config Directory | Description |
|------|----------|------|
| Claude Code | `~/.claude/` | Anthropic official CLI |
| JoyCode | `~/.joycode/` | Same structure as Claude Code, different path |

The skill/agent file formats are identical across both platforms; the only difference is the deployment path. Additional platforms can be supported in the future by adding new platform configuration files.

### 1.2 npm Package Info

- **Package name**: `openskill`
- **CLI command**: `openskill`
- **Language**: TypeScript
- **Build target**: ESM, Node.js >= 18


## 2. Architecture

### 2.1 Data Flow

```
Development phase:
  skills/ (source code + template variables)
  agents/ (source code + template variables)
       │
       │  openskill build
       │  (reads platforms/*.json, renders template variables)
       ▼
  dist/claude/   ← Claude Code artifacts
  dist/joycode/  ← JoyCode artifacts

Publishing phase:
  dist/ + src/cli (compiled)
       │
       │  npm publish
       ▼
  npm registry

Usage phase:
  npm install -g @kehr/openskill
       │
       │  openskill install weekly-report
       │  (copies dist/{platform}/ → target directory)
       ▼
  ~/.claude/skills/openskill/weekly-report/
  ~/.claude/agents/openskill/
```

### 2.2 Core Modules

| Module | Responsibility |
|------|------|
| `src/cli/` | CLI entry point + subcommand dispatch |
| `src/build/` | Build engine: template rendering + multi-platform output |
| `src/lint/` | Lint rule engine: rule definitions, validation execution |
| `src/platforms/` | Platform config loading (globally shared, used by build/install/list etc.) |
| `src/cli/commands/` | Individual subcommand implementations |
| `src/cli/utils/` | Path resolution, file copying, manifest management |


## 3. Project Directory Structure

```
openskill/
├── legacy/                     # Existing Python code (kept as-is)
│   ├── outlook_reader.py
│   ├── run.py
│   └── ARCHITECTURE.md
│
├── src/                        # CLI + core tools (TypeScript)
│   ├── cli/
│   │   ├── index.ts            # CLI entry point (bin)
│   │   ├── commands/
│   │   │   ├── install.ts      # openskill install <name>
│   │   │   ├── uninstall.ts    # openskill uninstall <name>
│   │   │   ├── list.ts         # openskill list
│   │   │   ├── create.ts       # openskill create <name>
│   │   │   ├── lint.ts         # openskill lint [name]
│   │   │   ├── build.ts        # openskill build
│   │   │   └── dev.ts          # openskill dev (watch + auto build/install)
│   │   └── utils/
│   │       ├── paths.ts        # Platform path resolution
│   │       ├── copy.ts         # File copying
│   │       └── manifest.ts     # Skill manifest management
│   ├── build/
│   │   ├── builder.ts          # Build engine
│   │   └── template.ts         # Template rendering (Handlebars + allowlist)
│   ├── lint/
│   │   ├── index.ts            # Lint engine entry point
│   │   └── rules/              # Each rule in its own file
│   │       ├── skill-md-exists.ts
│   │       ├── frontmatter-valid.ts
│   │       └── ...
│   ├── platforms/
│   │   └── index.ts            # Platform config loading (globally shared)
│   └── types.ts                # Shared type definitions
│
├── skills/                     # Skill source code (with template variables)
│   └── weekly-report/          # Example skill (first built-in skill)
│       ├── SKILL.md
│       ├── skill.json
│       ├── specs/
│       │   └── requirements.md
│       ├── templates/
│       │   └── output.md
│       └── examples/
│           ├── example-1.md
│           └── example-2.md
│
├── agents/                     # Agent source code (with template variables)
│
├── scaffolds/                  # Scaffold templates for create command
│   ├── skill/
│   │   ├── SKILL.md.hbs
│   │   ├── skill.json.hbs
│   │   ├── specs/
│   │   │   └── requirements.md.hbs
│   │   ├── templates/
│   │   │   └── output.md.hbs
│   │   └── examples/
│   │       └── .gitkeep
│   └── agent/
│       └── agent.md.hbs
│
├── platforms/                  # Platform configurations
│   ├── claude.json
│   └── joycode.json
│
├── dist/                       # Unified build output (gitignored, included in npm publish)
│   ├── cli/                    # TypeScript compiled output
│   └── skills/                 # Skill/agent multi-platform build artifacts
│       ├── claude/
│       │   ├── skills/openskill/
│       │   └── agents/openskill/
│       └── joycode/
│           ├── skills/openskill/
│           └── agents/openskill/
│
├── package.json
├── tsconfig.json
└── docs/trds/
```


## 4. Skill Internal Structure

Each skill follows the **Claude Code official recommended structure + STE extension architecture**:

```
skill-name/
├── SKILL.md              # Required - Main skill file (YAML frontmatter + Markdown)
├── skill.json            # Required - Build metadata
│
│  ── Official recommended directories ──
├── scripts/              # Optional - Reusable script tools
├── references/           # Optional - Heavy reference docs (100+ lines)
│
│  ── STE extension directories ──
├── specs/                # S - Standards & execution requirements
│   ├── requirements.md   #     Execution specs, quality standards, constraints
│   └── checklist.md      #     Checklist
├── templates/            # T - Output template format files
│   └── output.md         #     Output skeleton, format templates
└── examples/             # E - Output examples and feature demonstrations
    ├── example-1.md      #     Template output example
    └── example-2.md      #     Additional example
```

### 4.1 SKILL.md Specification

Follows Claude Code official frontmatter requirements:

```yaml
---
name: skill-name-with-hyphens    # Required, letters/digits/hyphens only, <=64 chars
description: Use when [trigger]  # Required, <=1024 chars, must start with "Use when"
allowed-tools: Tool1, Tool2      # Optional, restrict available tools
model: claude-sonnet-4-20250514  # Optional, specify model
---
```

**description specification** (CSO - Claude Search Optimization):
- Must start with "Use when", describing trigger conditions rather than a feature summary
- Use third person
- Include keyword coverage (error messages, symptoms, tool names)
- Must not contain process or workflow descriptions

**SKILL.md Body recommended structure**:
```markdown
# Skill Name

## Overview
Core principles, 1-2 sentences.

## When to Use
List of trigger scenarios. When not to use.

## Core Pattern
Core pattern / before-after comparison.

## Quick Reference
Quick reference table or key points list.

## Common Mistakes
Common mistakes and fixes.
```

### 4.2 skill.json Specification

```json
{
  "name": "weekly-report",
  "version": "1.0.0",
  "description": "Generate manager weekly reports",
  "type": "skill",
  "platforms": ["claude", "joycode"],
  "render": ["SKILL.md", "specs/*.md"],
  "agents": []
}
```

Field descriptions:

| Field | Required | Description |
|------|------|------|
| `name` | Yes | Skill identifier, letters/digits/hyphens only, <=64 chars |
| `version` | Yes | Skill's own version number (independent of package.json version; package.json version represents the toolchain version) |
| `description` | Yes | Brief description of the skill |
| `type` | Yes | `"skill"` or `"agent"` |
| `platforms` | Yes | Target platform list; each must have a corresponding `platforms/{name}.json` |
| `render` | No | Glob list of files to render with Handlebars. Unlisted files are copied directly without going through the template engine |
| `agents` | No | List of associated agent names. Listed agents are installed alongside during install; during uninstall, reference counts are checked before deciding whether to remove |

### 4.3 STE Directory Responsibilities

| Directory | Responsibility | Content Guidelines |
|------|------|----------|
| `specs/` | Standards & execution requirements | Output format specs, quality standards, trigger conditions, precondition checks, constraints |
| `templates/` | Output template formats | Markdown output skeletons, JSON schemas, format templates |
| `examples/` | Examples | Output examples for templates, feature demonstration cases. Files placed directly in examples/ with descriptive filenames |

SKILL.md references STE files via relative paths:
```markdown
See [execution requirements](specs/requirements.md) for details.
Use [output template](templates/output.md) for formatting.
Refer to [examples](examples/) for reference.
```


## 5. Platform Configuration

### 5.1 Configuration File Format

`platforms/claude.json`:
```json
{
  "name": "claude",
  "configDir": ".claude",
  "skillsDir": "skills",
  "agentsDir": "agents",
  "homeBase": "~"
}
```

`platforms/joycode.json`:
```json
{
  "name": "joycode",
  "configDir": ".joycode",
  "skillsDir": "skills",
  "agentsDir": "agents",
  "homeBase": "~"
}
```

The `homeBase` field is used to construct user-level installation paths (`{homeBase}/{configDir}/skills/openskill/`). The install command resolves the target directory through this field rather than hardcoding `~`.

### 5.2 Adding a New Platform

Adding a new platform only requires:
1. Creating a new `{platform}.json` under `platforms/`
2. Running `openskill build` to automatically generate artifacts for that platform


## 6. Build System

### 6.1 Build Process

Steps executed by `openskill build`:

1. Scan `skills/` and `agents/` directories to discover all source files
2. Read each skill's `skill.json` and verify that platform config files referenced in the `platforms` field exist (agents have no metadata file and are built for all platforms by default)
3. Load `platforms/*.json` to obtain all target platform configurations
4. For each platform:
   a. Read skill/agent source files
   b. Match files against the glob list in the `render` field of `skill.json`; matched files are rendered with Handlebars (injecting platform config values)
   c. Files not matching the `render` list are copied directly (e.g., example files under examples/)
   d. Output `skill.json` to the build artifacts as well (the install command depends on fields like `agents`)
   e. Output to `dist/{platform}/skills/openskill/` and `dist/{platform}/agents/openskill/`
5. Validation: if rendered files still contain unreplaced template variables, output a warning

### 6.2 Template Variables

Files declared in the `render` field of `skill.json` can use the following variables:

| Variable | Source | Example Value (claude) |
|------|------|-----------------|
| `{{configDir}}` | Platform config | `.claude` |
| `{{skillsDir}}` | Platform config | `skills` |
| `{{agentsDir}}` | Platform config | `agents` |
| `{{platformName}}` | Platform config | `claude` |
| `{{homeBase}}` | Platform config | `~` |
| `{{namespace}}` | Fixed value | `openskill` |

### 6.3 Build Artifact Structure

```
dist/
├── claude/
│   ├── skills/openskill/
│   │   └── weekly-report/
│   │       ├── SKILL.md          # Rendered, {{configDir}} → .claude
│   │       ├── skill.json        # Metadata (used by install command)
│   │       ├── specs/
│   │       ├── templates/
│   │       └── examples/         # Copied directly, not rendered
│   └── agents/openskill/
└── joycode/
    ├── skills/openskill/
    │   └── weekly-report/
    │       ├── SKILL.md          # Rendered, {{configDir}} → .joycode
    │       ├── skill.json
    │       ├── specs/
    │       ├── templates/
    │       └── examples/
    └── agents/openskill/
```


## 7. CLI Command Design

### 7.1 Command Overview

| Command | Purpose | Example |
|------|------|------|
| `openskill install <name>` | Install a skill to the target platform | `openskill install weekly-report` |
| `openskill install --all` | Install all skills | |
| `openskill uninstall <name>` | Uninstall an installed skill | `openskill uninstall weekly-report` |
| `openskill list` | List all available/installed skills | `openskill list` |
| `openskill create <name>` | Scaffold a new skill (with STE structure) | `openskill create code-review` |
| `openskill lint [name]` | Validate skill format compliance | `openskill lint` (all) |
| `openskill build` | Build artifacts for all platforms (supports incremental builds) | `openskill build` |
| `openskill dev` | Watch mode with auto build + install | `openskill dev` |

### 7.2 Common Flags

| Flag | Description | Default |
|------|------|--------|
| `--platform <name>` | Specify target platform | Auto-detect installed platforms |
| `--local` | Install to project-level directory (`./{configDir}/`) | User-level (`~/{configDir}/`) |
| `--force` | Force execution (skip version checks, overwrite existing files) | false |
| `--verbose` | Output detailed logs (build process, file operations, template rendering details) | false |
| `--link` | Use symbolic links instead of copying during install, suitable for local development and debugging | false |

### 7.3 install Command

```bash
openskill install <name> [--platform claude|joycode] [--local]
openskill install --all [--platform claude|joycode] [--local]
```

`--all`: Installs all available skills under `dist/{platform}/skills/openskill/`, applying the same conflict checking logic to each one.

Execution logic:
1. Validate skill name format (letters/digits/hyphens only, no path separators or `..`)
2. Determine target platform (specified / auto-detected / all installed platforms)
3. Read pre-built artifacts from `dist/{platform}/` (if `dist/` does not exist, prompt the user to run `openskill build` first)
4. Conflict checking:
   - Compare installed version in manifest against the version to be installed
   - Same version: skip and display `already installed`
   - Newer version: overwrite and display `upgraded from v1.0.0 to v1.1.0`
   - Downgrade: reject and prompt to use `--force` to force overwrite
5. Copy to target path:
   - User-level: `~/{configDir}/skills/openskill/{name}/`
   - Project-level: `./{configDir}/skills/openskill/{name}/`
   - Automatically create the target directory if it does not exist
6. Sync associated agents (read the `agents` list from `skill.json` and install the listed agents)
7. Update the installation manifest `~/{configDir}/skills/openskill/.manifest.json`

**Platform auto-detection**: Dynamically reads the `configDir` field from `platforms/*.json` and checks whether the `~/{configDir}/` directory exists. All detected platforms are installed to. If no platforms are detected, report an error and prompt the user to specify one with `--platform`.

**Error handling**:
- No write permission on target directory: report error and prompt to check permissions
- Specified skill not found in `dist/{platform}/`: report error and list available skills

### 7.4 uninstall Command

```bash
openskill uninstall <name> [--platform claude|joycode] [--local]
```

Execution logic:
1. Verify the skill is installed (check manifest)
2. Delete the `~/{configDir}/skills/openskill/{name}/` directory
3. Clean up associated agents: check whether other installed skills in the manifest still reference the agent; delete only if there are no remaining references
4. Update the installation manifest

### 7.5 list Command

```bash
openskill list [--installed] [--platform claude|joycode]
```

Output format:
```
Available skills:
  weekly-report    v1.0.0  Generate manager weekly reports
  code-review      v1.0.0  Code review assistant

Installed (claude):
  ✓ weekly-report  v1.0.0  ~/.claude/skills/openskill/weekly-report/
```

### 7.6 create Command

```bash
openskill create <name> [--type skill|agent]
```

Execution logic:
1. Read scaffold templates from `scaffolds/{type}/`
2. Render Handlebars templates (injecting variables such as name)
3. Output to `skills/{name}/` or `agents/{name}/`
4. Generate the complete STE directory structure

Generated result:
```
skills/{name}/
├── SKILL.md           # Name pre-filled, description to be completed
├── skill.json         # Name/version pre-filled
├── specs/
│   └── requirements.md
├── templates/
│   └── output.md
└── examples/
    └── .gitkeep
```

### 7.7 lint Command

```bash
openskill lint [name]     # Specific skill or all
```

Validation rules:

| Rule | Level | Description |
|------|------|------|
| `skill-md-exists` | error | SKILL.md must exist |
| `frontmatter-valid` | error | name + description are required |
| `name-format` | error | Letters/digits/hyphens only, <=64 chars |
| `description-format` | warn | Should start with "Use when", <=1024 chars |
| `description-no-workflow` | warn | description should not contain process summaries |
| `skill-json-exists` | error | skill.json must exist |
| `ste-dirs-exist` | warn | specs/, templates/, examples/ directories should exist |
| `examples-has-content` | warn | examples/ directory should exist and have content |
| `no-unused-template-vars` | warn | Template variables should have corresponding definitions in platform config |
| `platform-config-exists` | error | Platforms listed in skill.json must have corresponding config files |
| `render-files-exist` | warn | File globs listed in skill.json render field should match at least one file |

Output format:
```
Linting weekly-report...
  ✓ skill-md-exists
  ✓ frontmatter-valid
  ✓ name-format
  ⚠ description-format: description should start with "Use when"
  ✓ skill-json-exists
  ✓ ste-dirs-exist
  ⚠ examples-has-content: examples/ has no content

1 skill checked, 0 errors, 2 warnings
```

### 7.8 build Command

```bash
openskill build [--platform claude|joycode]
```

Execution logic is described in Section 6. Build completion output:
```
Building for 2 platforms...
  claude:  5 skills, 2 agents → dist/claude/
  joycode: 5 skills, 2 agents → dist/joycode/
Build complete.
```


### 7.9 dev Command

```bash
openskill dev [--platform claude|joycode]
```

Execution logic:
1. Perform a full `build` + `install --all` once
2. Watch `skills/` and `agents/` directories for file changes
3. When changes are detected, perform incremental build + install only for the changed skill/agent
4. Output changes and build status to the terminal in real time

Recommended to use with `--link`: after the initial install creates symbolic links, subsequent build artifacts are automatically reflected in the installation directory without repeated installs.

Press `Ctrl+C` to exit watch mode.


## 8. Installation Manifest

Each platform maintains an installation manifest file that records installed skills and agents:

`~/.claude/skills/openskill/.manifest.json`:
```json
{
  "version": "1.0.0",
  "platform": "claude",
  "installedAt": "2026-03-28T10:00:00Z",
  "skills": {
    "weekly-report": {
      "version": "1.0.0",
      "installedAt": "2026-03-28T10:00:00Z",
      "agents": ["weekly-report-agent"]
    }
  },
  "agents": {
    "weekly-report-agent": {
      "version": "1.0.0",
      "installedAt": "2026-03-28T10:00:00Z",
      "referencedBy": ["weekly-report"]
    }
  }
}
```

The manifest in `--local` mode is located at `./{configDir}/skills/openskill/.manifest.json` and is managed independently from the user-level manifest.

**Fault tolerance**:
- Writes use a "temp file + atomic rename" pattern to avoid JSON corruption from interrupted writes
- On read, if manifest parsing fails, the manifest is rebuilt from the actual filesystem state and a warning is output


## 9. Technology Choices

| Area | Choice | Rationale |
|------|------|------|
| Language | TypeScript | Type safety, native to the npm ecosystem |
| Module format | ESM | Modern standard, natively supported by Node.js >= 18. Note: use `"module": "node16"` or `"nodenext"` in `tsconfig.json`; relative imports require `.js` suffix |
| Template engine | Handlebars | Only renders files declared in the `render` field of `skill.json`, not all files, to avoid conflicts with `{{}}` in code examples |
| CLI framework | Commander.js | Lightweight, clean API, zero configuration |
| File operations | Node.js native `fs/promises` | Node.js 18+ natively supports `fs.cp()` (recursive copy) and `fs.rm()` (recursive delete), eliminating the need for fs-extra |
| YAML parsing | gray-matter | De facto standard for frontmatter parsing |
| Terminal output | picocolors + ora | picocolors has zero dependencies and is lighter weight, replacing chalk |
| Testing framework | vitest | Native ESM support, good TypeScript compatibility, Jest-compatible API |


## 10. Key package.json Fields

```json
{
  "name": "@kehr/openskill",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "openskill": "./dist/cli/cli/index.js"
  },
  "files": [
    "dist/",
    "scaffolds/",
    "platforms/"
  ],
  "scripts": {
    "dev": "tsx src/cli/index.ts",
    "build:cli": "tsc",
    "build:skills": "tsx src/cli/index.ts build",
    "build": "npm run build:cli && npm run build:skills",
    "test": "vitest",
    "lint": "tsx src/cli/index.ts lint",
    "prepublishOnly": "npm run build"
  }
}
```

Notes:
- `dist/cli/`: Compiled CLI code from TypeScript
- `dist/skills/`: Built skill/agent artifacts for each platform
- The `files` field ensures npm publish only includes the necessary files


## 11. Extensibility

### 11.1 Adding a New Platform

1. Create a new configuration file under `platforms/` (e.g., `cursor.json`)
2. Run `openskill build`
3. Artifacts for the new platform are automatically generated

### 11.2 Adding New Skill Types

Currently supports two types: skill and agent. To add more:
1. Add a new type template under `scaffolds/`
2. Extend type definitions in `src/types.ts`
3. Update the `create` command to support the new type

### 11.3 Custom Lint Rules

Lint rules are implemented as functions. Support for user-defined custom rule files can be added in the future.

### 11.4 Local Development Experience

- `openskill dev`: Watches `skills/` and `agents/` directories for changes, automatically runs build + install
- `openskill install --link`: Creates symbolic links pointing to artifact directories in `dist/{platform}/`; combined with `openskill dev` auto-build, changes take effect immediately

### 11.5 Incremental Builds

`openskill build` supports incremental builds, using file hashes or modification timestamps to determine whether a rebuild is needed, skipping unchanged skills.


## 12. Agent Internal Structure

Each agent consists of a single Markdown file following the Claude Code agent specification:

```
agent-name/
└── agent-name.md          # Agent definition file (YAML frontmatter + Markdown)
```

### 12.1 Agent Markdown Specification

```yaml
---
name: agent-name-with-hyphens    # Required, same naming rules as skill
description: Brief description   # Required
model: claude-sonnet-4-20250514  # Optional
---
```

Agents do not require an STE directory structure or a metadata file. During build, agent `.md` files are rendered through Handlebars by default (injecting platform config variables) and artifacts are generated for all platforms.

### 12.2 Agent vs. Skill Comparison

| Aspect | Skill | Agent |
|------|-------|-------|
| Main file | `SKILL.md` | `{name}.md` |
| Metadata | `skill.json` (required) | None |
| STE directories | specs/, templates/, examples/ | None |
| Install location | `{configDir}/skills/openskill/{name}/` | `{configDir}/agents/openskill/{name}.md` |
| Lifecycle | Independently installed/uninstalled | Installed via skill's `agents` field association; uninstalled based on reference counting |


## 13. Error Handling

### 13.1 Exit Code Conventions

| Exit Code | Meaning |
|--------|------|
| 0 | Success |
| 1 | User error (invalid arguments, skill not found, version conflict, etc.) |
| 2 | Internal error (filesystem exception, template rendering failure, etc.) |

### 13.2 Error Scenarios by Command

| Command | Error Scenario | Behavior |
|------|----------|------|
| build | Undefined template variable | Handlebars strict mode; report error specifying file and variable name |
| build | `platforms/` directory is empty | Error: `No platform config found` |
| build | Platform config JSON format error | Error specifying filename and parse error location |
| install | `dist/` does not exist | Error: `Build artifacts not found. Run "openskill build" first` |
| install | No write permission on target directory | Error prompting to check permissions |
| install | Downgrade installation | Reject and prompt to use `--force` |
| create | Scaffold template missing | Error: `Scaffold template not found. Try reinstalling: npm install -g @kehr/openskill` |
| lint | skill.json references non-existent platform | error level: `platform-config-exists` |

### 13.3 Verbose Mode

When `--verbose` is used, the following is output:
- Render/copy operations for each file during the build process
- Actual substitution values for template variables
- Detailed file operations during install/uninstall


## 14. Version Management

### 14.1 Version Strategy

| Version | Location | Description |
|--------|------|------|
| Toolchain version | `version` in `package.json` | Version of the openskill CLI itself, managed via npm |
| Skill version | `version` in `skill.json` | Independent version for each skill, recorded in the manifest |

The two versions are managed independently and are not linked.

### 14.2 Upgrade Flow

To upgrade an installed skill:

1. Update the npm package: `npm update -g openskill`
2. Reinstall: `openskill install <name>` or `openskill install --all`
3. The install command automatically detects version differences and overwrites the old version with the new one

A dedicated `openskill upgrade` command is not provided at this time, as the install command already has built-in version comparison and upgrade capabilities.


## 15. npm Publishing

### 15.1 Package Contents

The npm package includes the following:

| Directory | Description |
|------|------|
| `dist/cli/` | Compiled CLI code from TypeScript |
| `dist/` | Built skill/agent artifacts for each platform |
| `scaffolds/` | Scaffold templates for the create command |
| `platforms/` | Platform configuration files |

**Not published**: `skills/`, `agents/` source code, `legacy/`, test files. Users only need the pre-built artifacts, not the source code. This is by design.

### 15.2 Pre-publish Checklist

1. `openskill lint` passes completely (0 errors)
2. `openskill build` succeeds
3. `npm run build:cli` succeeds (TypeScript compilation)
4. Version number has been updated (`package.json`)
