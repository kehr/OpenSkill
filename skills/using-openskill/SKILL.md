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
