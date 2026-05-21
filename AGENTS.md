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
