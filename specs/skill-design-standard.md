# Skill Design Standard

> Design rules for all OpenSkill skills. Works with [AGV Standard](agv-standard.md) and [STE Standard](ste-standard.md).

## SKILL.md Responsibilities

SKILL.md is the orchestration entry point. It defines WHAT to do and WHERE to find the details, not HOW to do it.

**SKILL.md contains:**
- Frontmatter (name, description, allowed-tools)
- Command table (list of available functions)
- Standards reference (link to AGV + STE)
- Interaction rules (AskUserQuestion requirement)
- Task tracking rules (TodoWrite requirement)
- Initialization flow (numbered steps)
- Function definitions (numbered steps referencing specs/templates/examples)
- Execution strategy (parallelism, dependencies)
- Memory management rules (reference to memory spec)
- Error handling table
- File index table

**SKILL.md does NOT contain:**
- Detailed processing rules (belongs in specs/)
- Output format definitions (belongs in templates/)
- Quality benchmarks (belongs in examples/)
- Help text and user guides (belongs in references/)
- Heavy reference documentation (belongs in references/)

## Skill File Structure

```
skill-name/
  SKILL.md              # Orchestration + file index (concise)
  skill.json            # Build metadata
  config/               # Built-in default configuration
  scripts/              # Reusable script tools
  specs/                # S - Execution standards (with Verification Checklists)
  templates/            # T - Output format skeletons
  examples/             # E - Quality benchmark outputs
  references/           # Auxiliary docs (help, heavy references)
```

### Directory Purposes

| Directory | What goes here | What does NOT go here |
|-----------|---------------|----------------------|
| specs/ | Processing rules, quality standards, verification checklists | Output formats, example content |
| templates/ | Structural skeletons with placeholders | Processing logic, quality criteria |
| examples/ | Realistic reference outputs | Rules, templates, processing logic |
| references/ | Help guides, heavy docs (100+ lines), auxiliary info | Processing rules, output formats |
| config/ | Default settings (JSON, Markdown) | Code, scripts |
| scripts/ | Executable tools (Python, shell) | Configuration, documentation |

## Function Design Rules

Each function in SKILL.md should be:

1. **Concise**: numbered steps, each step is one action
2. **Referential**: point to spec/template/example files, don't inline their content
3. **Deterministic**: user interactions use AskUserQuestion with fixed options
4. **Trackable**: execution creates TodoWrite tasks

### Function STE Coverage

| Function type | Spec | Template | Example |
|--------------|:---:|:---:|:---:|
| Produces file output | Required | Required | Required |
| Produces memory output | Required | Optional (format in spec) | Optional |
| Interactive only (configure, help) | Optional | No | No |

## Memory Design

Memory files live in `.openskill/{skill-name}/memory/` at runtime (not shipped with the skill).

- Memory is a living knowledge base, not a log
- Support Add / Update / Merge / Archive operations
- Changes tracked via Changelog sections
- Personal style output as complete STE (profile/spec.md + template.md + example.md)
- Memory structure defined by a dedicated spec (e.g., `specs/memory-requirements.md`)

## Execution Requirements

- Every invocation creates a TodoWrite task list before starting work
- All user-facing choices use AskUserQuestion with predefined options
- Every generation step completes the full AGV cycle (Analysis -> Generate -> Verify)
- Final Verification Summary presented before declaring completion
- Parallel execution uses Agent tool with dependency management
