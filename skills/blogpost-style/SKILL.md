---
name: blogpost-style
description: Use when the author wants to optimize a Markdown blog post for engineering-blog voice, choosing between Anthropic and OpenAI Research styles. Strips marketing fluff, restructures headings, adds caveats. Preserves all factual content. Triggers on phrases like "优化文章风格", "改写为博客风格", "按 Anthropic 风格重写", "按 OpenAI Research 风格重写", or invocation of /blogpost-style.
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# Blogpost Style

Rewrite a Markdown blog post into one of two engineering-blog voices: Anthropic (research + experience recap, sourced from anthropic.com/research and anthropic.com/engineering) or OpenAI Research (academic alignment-paper voice, sourced from alignment.openai.com). Preserves all technical content; only restructures voice, tone, and headings.

## Commands

| Command | Description |
|---------|-------------|
| **rewrite** | Rewrite a target post into one of two styles (interactive style selection) |
| **analyze** | Inspect a post and report style issues without rewriting |
| **help** | Show usage and current track summary |

## Standards

This skill follows the OpenSkill architecture standards:
- [AGV Execution Standard](../../specs/agv-standard.md) -- every step follows Analysis -> Generate -> Verify
- [STE Architecture Standard](../../specs/ste-standard.md) -- every output has Spec + Template + Example

Every function step that produces output MUST complete the full AGV cycle. Verification is mandatory.

## Interaction Rules

All user-facing choices MUST use `AskUserQuestion` with predefined options. Never present choices as free text.

## Task Tracking

On every invocation, use `TodoWrite` to create the task list before starting work. Mark each task `in_progress` when starting and `completed` immediately after finishing.

Example for rewrite:
```
1. [pending] Locate target post + confirm style track
2. [pending] Analyze post (style audit)
3. [pending] Generate rewritten post (AGV-G)
4. [pending] Verify against checklist (AGV-V)
5. [pending] Present diff summary
```

## Initialization

On every invocation:

1. Identify the target file. If the user did not name one, use `AskUserQuestion`:
   - "Which post should I optimize?" with options derived from `_posts/*.md` and `_drafts/*.md` (or "Other" for free path).
2. Confirm style track (skip if user already named it). `AskUserQuestion`:
   - "Which style track?" -> "Anthropic" | "OpenAI Research"
3. Read [specs/forbidden-words.md](specs/forbidden-words.md) once for the shared forbidden vocabulary.

## Function: rewrite

**A (Analysis):**
1. Read the target post.
2. Read the chosen style spec:
   - Anthropic -> [specs/style-anthropic.md](specs/style-anthropic.md)
   - OpenAI Research -> [specs/style-openai-research.md](specs/style-openai-research.md)
3. Read [specs/forbidden-words.md](specs/forbidden-words.md) and audit the post for matches.
4. Identify: title, frontmatter, section headings, claims missing caveats, mixed metaphors.

**G (Generate):** STE = [specs/rewrite-requirements.md](specs/rewrite-requirements.md) + style-specific spec + style-specific template + style-specific example
5. Apply the chosen track's checklist. Preserve frontmatter `date`, `categories`, `tags` unless explicitly asked to change.
6. Write the rewritten post back to the same path (or `<slug>.optimized.md` if user wants a side-by-side; `AskUserQuestion`).

**V (Verify):** run Verification Checklist from [specs/rewrite-requirements.md](specs/rewrite-requirements.md)
7. Confirm: forbidden words removed, every capability claim has a caveat or a number, headings match track, frontmatter preserved, no AI/Claude/Anthropic/OpenAI watermark in body.
8. Present a short diff summary: title before/after, structural changes, removed forbidden words (top 5-10), added caveats (top 5), byte/line delta.

## Function: analyze

**A (Analysis):**
1. Read the target post.
2. Read [specs/forbidden-words.md](specs/forbidden-words.md) and both style specs.

**G (Generate):** STE = [specs/analyze-requirements.md](specs/analyze-requirements.md) + [templates/style-audit.md](templates/style-audit.md) + [examples/style-audit-example.md](examples/style-audit-example.md)
3. Produce a style audit report (does NOT rewrite). Group findings by severity.

**V (Verify):** run Verification Checklist from [specs/analyze-requirements.md](specs/analyze-requirements.md)
4. Confirm: each finding cites a line number, severity assigned, no false positives on quoted code blocks.

## Function: help

Display:
- The two tracks with one-line summaries and reference-article URLs
- The two production functions (rewrite, analyze)
- The forbidden vocabulary categories (without dumping the full list)
- A pointer to specs/ for full rules

## Memory Management

This skill does not maintain persistent memory. All state is derived from the post being edited and the spec files shipped with the skill.

## Error Handling

| Scenario | Action |
|----------|--------|
| Target file not found | List candidates from `_posts/*.md` and `_drafts/*.md` via `AskUserQuestion` |
| Frontmatter malformed | Stop, report the malformed line, ask user whether to repair |
| Post contains code fences with forbidden vocabulary | Skip those ranges, only audit prose outside code fences |
| Post is empty | Refuse to rewrite, return analyze-style report instead |
| User picks wrong track midway | Discard work, restart at Initialization step 2 |

## File Index

| Category | File | Purpose |
|----------|------|---------|
| Spec | [specs/rewrite-requirements.md](specs/rewrite-requirements.md) | Common rewrite rules + Verification Checklist |
| Spec | [specs/analyze-requirements.md](specs/analyze-requirements.md) | Style audit rules + Verification Checklist |
| Spec | [specs/style-anthropic.md](specs/style-anthropic.md) | Anthropic-style track checklist + reference articles |
| Spec | [specs/style-openai-research.md](specs/style-openai-research.md) | OpenAI Research-style track checklist + reference articles |
| Spec | [specs/forbidden-words.md](specs/forbidden-words.md) | Shared forbidden vocabulary across both tracks |
| Template | [templates/post-anthropic.md](templates/post-anthropic.md) | Anthropic-style post structural skeleton |
| Template | [templates/post-openai-research.md](templates/post-openai-research.md) | OpenAI Research-style post skeleton |
| Template | [templates/style-audit.md](templates/style-audit.md) | Style audit report skeleton |
| Example | [examples/post-anthropic-example.md](examples/post-anthropic-example.md) | Anthropic-style quality reference |
| Example | [examples/post-openai-research-example.md](examples/post-openai-research-example.md) | OpenAI Research-style quality reference |
| Example | [examples/style-audit-example.md](examples/style-audit-example.md) | Style audit quality reference |
