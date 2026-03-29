---
name: weekly
description: Use when the user wants to summarize team weekly reports from Outlook, aggregate team progress with risk analysis, generate their own weekly report, learn their writing style from samples, or configure weekly report settings
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion, Agent
---

# Weekly Report Automation

Fetch team emails from Outlook, summarize, aggregate with risk analysis, and generate your personal report.

## Commands

| Command | Description |
|---------|-------------|
| **summarize** | Fetch and summarize team weekly reports |
| **aggregate** | Merge summaries into team overview with risk analysis |
| **generate** | Create your personal weekly report (requires style profile) |
| **read** | Smart reading: reorganize reports by topic (dimension -> topic -> person) |
| **learn-style** | Teach me your writing style from samples |
| **configure** | Set up senders, keywords, and preferences |
| **help** | Show usage guide, current status, and available commands |

## Standards

This skill follows the OpenSkill architecture standards:
- [AGV Execution Standard](../../specs/agv-standard.md) -- every step follows Analysis -> Generate -> Verify
- [STE Architecture Standard](../../specs/ste-standard.md) -- every output has Spec + Template + Example

Every function step that produces output MUST complete the full AGV cycle. Verification is mandatory, not optional.

## Interaction Rules

All user-facing choices MUST use `AskUserQuestion` with predefined options. Never present choices as free text.

## Task Tracking

On every invocation, MUST use `TodoWrite` to create a task list for the execution plan before starting any work. Mark each task `in_progress` before starting and `completed` immediately after finishing. This prevents task loss during multi-step or parallel execution.

Example for summarize:
```
1. [pending] Fetch emails from Outlook + save raw JSON
2. [pending] Summarize individual reports (parallel)
3. [pending] Verify all summaries (AGV-V)
4. [pending] Update memory
```

## Initialization

On every invocation:

1. **Data directory**: check `.openskill/weekly/` (project-level) first, then `~/.openskill/weekly/` (user-level). Create if missing.

2. **User identity**: read `{data-dir}/memory/user.md`. If missing (first run), use `AskUserQuestion`:
   - Q1: "Welcome to Weekly! What's your name?" (Other for free input)
   - Q2: "输出语言偏好？ / Preferred language?" Options: "中文" | "English"
   - Save to `{data-dir}/memory/user.md` and `{data-dir}/config/config.json`

3. **Config**: read built-in `config/config.json`, overlay `{data-dir}/config/config.json` on top.

4. **Directives**: read `{data-dir}/config/openskill.md` (case-insensitive filename: `openskill.md`, `OPENSKILL.md`, `OpenSkill.md` all valid). Initialized from built-in defaults on first run. This is the user's highest-priority configuration -- like CLAUDE.md for Claude Code. It controls risk detection, priority classification, focus areas, output preferences, and can override any skill behavior. All specs MUST respect openskill.md directives.

5. **Language**: respect `language` config. `"zh"` = Chinese output + filenames, `"en"` = English, `"auto"` = match input.

6. **Action routing**: if user intent unclear, use `AskUserQuestion` in user's language:
   - zh: "你想做什么？" -> 总结本周周报 | 汇总团队报告 | 生成我的周报 | 智能阅读 | 配置设置 | 使用帮助
   - en: "What would you like to do?" -> Summarize | Aggregate | Generate | Smart Read | Configure | Help

## Data Source Routing

When input data is needed and source not implied by user's message, use `AskUserQuestion`:
- "Outlook emails" -- Fetch weekly report emails from Outlook using configured sender list and keyword
- "Paste text" -- Paste report content directly in the chat
- "File path" -- Provide file paths to read as input
- "Project directory" -- Analyze a project directory (git log, docs, changes)

Skip if source is already clear from context (e.g., "summarize this week's emails" implies Outlook).

## Output File Names

| Content | zh | en |
|---------|----|----|
| Raw emails | `raw/emails.json` | `raw/emails.json` |
| Individual summaries | `individuals/{email_prefix}.md` | `individuals/{email_prefix}.md` |
| Smart read | `智能阅读.md` | `smart-read.md` |
| Team aggregate | `团队汇总.md` | `team-aggregate.md` |
| Personal report | `我的周报.md` | `my-report.md` |

## Execution Strategy

Subagent-based parallel execution with dependency management:

```
Phase 1 (parallel):   [Agent: Person 1] [Agent: Person 2] [Agent: Person 3] ...
                                    (wait for all)
Phase 2 (sequential): [Aggregate all summaries + risk analysis]
Phase 3 (sequential): [Generate personal report]
```

- Phase 1 tasks are independent -- launch as background agents
- Phase 2 starts only after all Phase 1 agents complete
- Phase 3 starts only after Phase 2 completes
- If user only requests "summarize", stop after Phase 1
- If user only requests "aggregate", start from Phase 2 (assumes Phase 1 output exists)
- If user requests the full pipeline ("summarize and generate my report"), execute all 3 phases automatically

## Function: summarize

**A (Analysis):**
1. Determine data source (see Data Source Routing)
2. Resolve date range via `AskUserQuestion`: "This week" | "Last week" | "Custom"
3. Read `{data-dir}/memory/team-context.md` for context (if exists)
4. Fetch emails and **save raw data** to `{output-dir}/YYYY-WNN/raw/emails.json`:
   ```bash
   python3 {skill-dir}/scripts/fetch-outlook-emails.py \
     --senders "..." --keyword "..." --folder "..." --start-date ... --end-date ... --limit ...
   ```
5. Group emails by sender, deduplicate (keep most recent per sender)

**G (Generate):** STE = [specs/summarize-requirements.md](specs/summarize-requirements.md) + [templates/individual-summary.md](templates/individual-summary.md) + [examples/individual-summary-example.md](examples/individual-summary-example.md)
6. **Parallel dispatch**: launch one Agent per person (batch 3-5 if >10 people). Each agent follows the STE above.
7. Each agent writes to `{output-dir}/YYYY-WNN/individuals/{email_prefix}.md`

**V (Verify):** run Verification Checklist from specs/summarize-requirements.md
8. Verify all individuals/ files: sections present, word count, metrics preserved, no data loss
9. Update `{data-dir}/memory/team-context.md`
10. Present verification summary + results to user

## Function: aggregate

**A (Analysis):**
1. Read individual summaries from most recent output (or user-specified path)
2. Read [config/openskill.md](config/openskill.md) for risk rules and focus areas
3. Read `{data-dir}/memory/history/` for cross-week analysis

**G (Generate):** STE = [specs/aggregate-requirements.md](specs/aggregate-requirements.md) + [templates/team-aggregate.md](templates/team-aggregate.md) + [examples/team-aggregate-example.md](examples/team-aggregate-example.md)
4. Generate team aggregate following STE
5. Write to `{output-dir}/YYYY-WNN/` (language-appropriate name)

**V (Verify):** run Verification Checklist from specs/aggregate-requirements.md
6. Verify: 7 sections present, risk items have severity + action, statistics match content
7. Present verification summary + results to user

## Function: generate

**A (Analysis):**
1. Check `{data-dir}/memory/profile/` exists. If not, `AskUserQuestion`: "Learn my style now" | "Use default template" | "Cancel"
2. Read team aggregate report
3. Resolve STE:
   - If personal STE exists: S=`profile/spec.md`, T=`profile/template.md`, E=`profile/example.md`
   - If not: S=[specs/generate-requirements.md](specs/generate-requirements.md), T=[templates/personal-report.md](templates/personal-report.md), E=[examples/personal-report-example.md](examples/personal-report-example.md)

**G (Generate):** STE = resolved above
4. Generate personal report following STE
5. Present draft. `AskUserQuestion`: "Approve and save" | "Edit" | "Regenerate"

**V (Verify):** run Verification Checklist from specs/generate-requirements.md
6. Verify: style matches profile, data traces to aggregate, no fabrication
7. Write to `{output-dir}/YYYY-WNN/` (language-appropriate name)
8. Update `{data-dir}/memory/history/YYYY-WNN.md`
9. Present verification summary

## Function: read

**A (Analysis):**
1. Check if `{output-dir}/YYYY-WNN/individuals/` exists. If not, auto-trigger summarize first.
2. Read `{data-dir}/config/openskill.md` for fixed dimensions and risk rules
3. Parse user message for runtime dimension filters (add/filter/focus)
4. Decompose all individual summaries into content items, discover emergent dimensions

**G (Generate):** STE = [specs/read-requirements.md](specs/read-requirements.md) + [templates/smart-read.md](templates/smart-read.md) + [examples/smart-read-example.md](examples/smart-read-example.md)
5. Classify items into dimensions, cluster into topics, generate three-layer output
6. Display in chat + write to `{output-dir}/YYYY-WNN/` (`智能阅读.md` or `smart-read.md`)

**V (Verify):** run Verification Checklist from specs/read-requirements.md
7. Verify: no data loss, risk severity justified, statistics match, emergent dimensions valid
8. Present verification summary

## Function: learn-style

**A (Analysis):**
1. `AskUserQuestion`: "Screenshots" | "File paths" | "Paste text" | "Outlook sender search"
2. Collect and read all user samples

**G (Generate):** STE = [specs/learn-style-requirements.md](specs/learn-style-requirements.md) (output is the profile STE itself)
3. Analyze samples, produce personal STE triad:
   - `{data-dir}/memory/profile/spec.md` -- writing rules
   - `{data-dir}/memory/profile/template.md` -- report structure
   - `{data-dir}/memory/profile/example.md` -- quality benchmark

**V (Verify):** run Verification Checklist from specs/learn-style-requirements.md
4. Verify: 6 dimensions present, patterns from actual samples, template matches user structure
5. Present to user. `AskUserQuestion`: "Yes, save it" | "Adjust" | "Redo"

## Function: configure

1. Show current effective config (built-in merged with user overrides)
2. `AskUserQuestion` (multiSelect): "Sender list" | "Keyword" | "Date range" | "Output directory" | "Language" | "Directives (openskill.md)"
3. For directives: `AskUserQuestion`: "Edit in chat" | "Edit file directly" | "Reset to defaults"
4. Write to `{data-dir}/config/config.json`

### First-run initialization

On first configure (or when `{data-dir}/config/` is empty), initialize with:
```
{data-dir}/
  config/
    config.json         # Copy of built-in defaults (user edits this)
    openskill.md        # User directives -- highest priority config (user edits this)
  memory/
    user.md             # Created during onboarding
    profile/            # Created by learn-style
    team-context.md     # Created by first summarize
    history/            # Created by first pipeline run
```

## Function: help

Trigger: user says "help", "how to use", "what can you do", or intent is unclear on first use.

Follow [references/help.md](references/help.md) for the dynamic status report format and logic.

## Memory Management

All memory operations MUST follow [specs/memory-requirements.md](specs/memory-requirements.md). Key rules:
- `user.md`: AI Notes section is append-only, only add genuinely useful observations
- `team-context.md`: add new members, update projects, never remove members
- `history/YYYY-WNN.md`: one file per week, append-only
- `profile/`: spec + template + example, user-editable

## Error Handling

| Scenario | Action |
|----------|--------|
| Outlook not installed | Inform user, requires Outlook for macOS |
| Outlook not running | Suggest opening Outlook |
| No emails match | Check config (senders, keyword, date range). Also suggest verifying Outlook is synced and connected if results seem unexpectedly sparse. |
| Missing style-profile.md | Guide to learn-style |
| Output dir not writable | Suggest alternative path |
| python3 not available | Inform user, requires Python 3.9+ |

## File Index

| Category | File | Purpose |
|----------|------|---------|
| Config | [config/config.json](config/config.json) | Default settings |
| Config | [config/openskill.md](config/openskill.md) | User directives -- highest priority config (like CLAUDE.md) |
| Script | [scripts/fetch-outlook-emails.py](scripts/fetch-outlook-emails.py) | Outlook email fetcher CLI |
| Spec | [specs/summarize-requirements.md](specs/summarize-requirements.md) | Summarize processing rules |
| Spec | [specs/aggregate-requirements.md](specs/aggregate-requirements.md) | Aggregate processing rules |
| Spec | [specs/generate-requirements.md](specs/generate-requirements.md) | Generate processing rules |
| Spec | [specs/learn-style-requirements.md](specs/learn-style-requirements.md) | Style learning rules |
| Spec | [specs/memory-requirements.md](specs/memory-requirements.md) | Memory structure and update rules |
| Spec | [specs/read-requirements.md](specs/read-requirements.md) | Smart read processing rules |
| Template | [templates/individual-summary.md](templates/individual-summary.md) | Per-person summary format |
| Template | [templates/team-aggregate.md](templates/team-aggregate.md) | Team aggregate format |
| Template | [templates/personal-report.md](templates/personal-report.md) | Personal report format |
| Template | [templates/smart-read.md](templates/smart-read.md) | Smart read output format |
| Example | [examples/individual-summary-example.md](examples/individual-summary-example.md) | Summary quality reference |
| Example | [examples/team-aggregate-example.md](examples/team-aggregate-example.md) | Aggregate quality reference |
| Example | [examples/personal-report-example.md](examples/personal-report-example.md) | Personal report quality reference |
| Example | [examples/smart-read-example.md](examples/smart-read-example.md) | Smart read quality reference |
| Reference | [references/help.md](references/help.md) | Help function display logic |
