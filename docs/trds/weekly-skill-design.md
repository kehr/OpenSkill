# Weekly Skill Design Document

> Date: 2026-03-29
> Status: Draft

## 1. Overview

`weekly` is a Claude Code skill that automates the weekly report workflow for managers. It reads team members' weekly report emails from macOS Outlook, summarizes and aggregates them with risk analysis, and generates the user's own weekly report in their personal writing style.

**Runtime model:** Claude Code skill. AI loads SKILL.md and follows orchestration instructions. Python script handles data fetching. AI handles understanding, analysis, and generation. File system handles persistence.

**Core principle:** Python does dumb data fetching. AI does all understanding and generation. Files do persistence.

## 2. Architecture

### 2.1 Components

| Layer | Component | Location | Role |
|-------|-----------|----------|------|
| Skill definition | SKILL.md | `skills/weekly/` | Orchestration -- guides AI through all workflows |
| Data fetching | fetch-outlook-emails.py | `skills/weekly/scripts/` | CLI tool: fetch Outlook emails -> JSON stdout |
| Specs | per-function requirements | `skills/weekly/specs/` | STE-S: execution standards for each function |
| Templates | per-function output templates | `skills/weekly/templates/` | STE-T: output format for each function |
| Examples | reference outputs | `skills/weekly/examples/` | STE-E: demonstrations |
| Default config | config.json, rules.md | `skills/weekly/config/` | Built-in defaults (shipped with skill) |
| User config | config.json, rules.md | `.openskill/weekly/config/` | User overrides (merged on top of defaults) |
| Memory | user, style, context, history | `.openskill/weekly/memory/` | Persistent state across sessions |
| Output | generated reports | `weekly/output/` (cwd) | Generated deliverables (dir configurable) |

### 2.2 Data Flow

```
User: "/weekly summarize this week"
  |
  v
AI loads SKILL.md
  -> reads memory/user.md -> greets user by name
  -> reads built-in config/config.json
  -> overlays .openskill/weekly/config/config.json (if exists)
  |
  v
AI calls: python scripts/fetch-outlook-emails.py \
    --senders "alice@co.com,bob@co.com" \
    --keyword "周报" \
    --start-date 2026-03-23 \
    --end-date 2026-03-29
  |
  v
JSON output: [{subject, sender, body, received_time}, ...]
  |
  v
AI filters by title date (semantic understanding of various date formats)
  |
  v
AI reads specs/summarize-requirements.md + templates/individual-summary.md
  -> Generates per-person summary
  |
  v
AI reads specs/aggregate-requirements.md + templates/team-aggregate.md
  -> reads rules.md for risk analysis preferences
  -> Generates aggregated team report with risk analysis
  |
  v
AI reads memory/style-profile.md
  + specs/generate-requirements.md + templates/personal-report.md
  -> If style-profile.md contains a custom template, use it instead of default
  -> Generates user's own weekly report
  |
  v
Output written to {output-dir}/2026-W13/
Memory updated in .openskill/weekly/memory/history/
```

### 2.3 Config Merge Logic

Two layers, higher priority wins:

| Priority | Location | Description |
|----------|----------|-------------|
| Lowest | `skills/weekly/config/` | Built-in defaults shipped with skill |
| Highest | `.openskill/weekly/config/` | User overrides |

For config.json: AI reads built-in first, then overlays user version. User config only needs fields they want to override.

For rules.md: if user version exists, use it entirely; otherwise use built-in default.

`.openskill/weekly/` follows the skill's install scope: user-level (`~/.openskill/weekly/`) or project-level (`.openskill/weekly/`).

### 2.4 Graceful Onboarding

If the user triggers any function before `configure`:
- AI detects missing `memory/user.md` or empty config
- AI initiates onboarding inline: prompts for name, asks for sender list
- Then continues with the requested function

No hard gate -- the skill degrades gracefully and guides the user through setup on first use.

## 3. Email Fetcher: fetch-outlook-emails.py

Standalone Python CLI tool in `skills/weekly/scripts/`. Fetches emails from macOS Outlook via JXA, outputs JSON to stdout.

### 3.1 CLI Interface

```bash
python scripts/fetch-outlook-emails.py \
  --senders "alice@co.com,bob@co.com" \
  --keyword "周报" \
  --start-date 2026-03-23 \
  --end-date 2026-03-29 \
  --folder inbox \
  --limit 100
```

### 3.2 Arguments

| Argument | Required | Default | Description |
|----------|----------|---------|-------------|
| `--senders` | No | (all) | Comma-separated email addresses |
| `--keyword` | No | (none) | Subject keyword filter |
| `--start-date` | No | (none) | Start date YYYY-MM-DD (filter by received_time) |
| `--end-date` | No | (none) | End date YYYY-MM-DD |
| `--folder` | No | `inbox` | Outlook folder name |
| `--limit` | No | `100` | Max emails to return |

### 3.3 Output Format

JSON array to stdout:

```json
[
  {
    "id": "msg-001",
    "subject": "周报 2026.03.23-03.29",
    "sender_name": "Alice",
    "sender_address": "alice@co.com",
    "received_time": "2026-03-28T17:30:00",
    "body": "This week I completed..."
  }
]
```

Errors go to stderr with exit code 1.

### 3.4 Key Differences from Legacy outlook_reader.py

| Aspect | Legacy | New |
|--------|--------|-----|
| Interface | Python library API | CLI with argparse |
| Date filtering | Not supported | `--start-date`, `--end-date` via JXA-side filtering |
| Multi-sender | Single sender string | Comma-separated list |
| Output | Python objects | JSON to stdout |
| Error handling | Basic | Proper exit codes, stderr messages |
| Folder names | f-string injection (unsafe) | Quote-escaped |

### 3.5 What It Does NOT Do

Title date parsing, relevance filtering, content analysis, summarization. Those are AI's job. The tool is a dumb pipe: Outlook -> JSON.

## 4. Skill Functions

### 4.1 Function Overview

| Function | Trigger | Input | Output | STE Coverage |
|----------|---------|-------|--------|-------------|
| **summarize** | "summarize this week" | Outlook emails | Per-person summaries | spec + template + example |
| **aggregate** | "aggregate team report" | Summaries | Team aggregate with risk analysis | spec + template + example |
| **generate** | "generate my report" | Aggregate + style profile | User's own weekly report | spec + template + example |
| **learn-style** | "learn my report style" | User samples (screenshots/text/md) | Updated style-profile.md | spec (no template -- output is the style profile itself) |
| **configure** | "configure weekly" | User input (interactive) | Updated config.json / rules.md | N/A (interactive guided flow) |

### 4.2 Workflow Dependency

```
configure (one-time setup, required before first run)
    |
learn-style (one-time, required before first generate)
    |
summarize -> aggregate -> generate (weekly cycle)
```

- `summarize` can run independently
- `aggregate` requires summaries (can chain from summarize or use existing)
- `generate` requires aggregate + style-profile.md (will prompt if missing)

### 4.3 Risk Analysis in Aggregate

AI reads rules.md for user-defined preferences when producing the aggregate report:

- **Risk detection**: keywords and patterns to flag (deadline slip, resource shortage, dependency blocked, etc.)
- **Priority classification**: how to categorize items by urgency
- **Focus areas**: topics the user cares about most

AI also adds its own analysis beyond the rules: identifying cross-report patterns, spotting inconsistencies, flagging items that multiple people mention.

### 4.4 Date Handling

Python tool filters emails by `received_time` range. AI then examines email subjects to determine if they're the correct week's report:

- AI understands various date formats: `20260323`, `2026-03-23`, `2026.03.23`, `03/23-03/29`, `3月23日`, etc.
- AI can handle both single-date and range formats in subjects
- If ambiguous, AI includes the email and notes the ambiguity in the summary

## 5. STE Files

### 5.1 Specs

**specs/summarize-requirements.md**: How to produce individual summaries from raw email content. Covers extraction rules, what to include/exclude, format constraints.

**specs/aggregate-requirements.md**: How to merge individual summaries into a team overview. Covers risk analysis, cross-cutting concerns, priority classification.

**specs/generate-requirements.md**: How to generate the user's personal report. Must use style-profile.md. Must include AI's own risk insights and key highlights.

**specs/learn-style-requirements.md**: How to analyze user samples and produce a style profile. What aspects to extract (tone, structure, vocabulary, length, language).

### 5.2 Templates

**templates/individual-summary.md**: Per-person summary format.

**templates/team-aggregate.md**: Team aggregate report format with sections for key progress, risks, cross-team dependencies, action items.

**templates/personal-report.md**: User's own report format. This is the default; learn-style may generate a custom version stored in memory.

### 5.3 Examples

**examples/individual-summary-example.md**: Example of a single person's summarized report.

**examples/team-aggregate-example.md**: Example of a full team aggregate with risk analysis.

**examples/personal-report-example.md**: Example of a generated personal report.

## 6. Memory System

All memory lives in `.openskill/weekly/memory/`.

### 6.1 Files

**user.md**: Created during first-run onboarding. Contains:
- User's name or preferred greeting
- General preferences noted during interactions

**style-profile.md**: Created by `learn-style`. Contains:
- Writing tone (formal/casual, level of detail)
- Preferred section structure and headings
- Vocabulary patterns and recurring phrases
- Report length preference
- Language preference
- Custom template (if user's style differs significantly from default)

**team-context.md**: Auto-built and incrementally updated as AI processes reports. Contains:
- Team member names, email addresses
- Their projects and responsibilities
- Observed patterns (who reports on what)

**history/YYYY-WNN.md**: One file per week. Contains:
- Date range
- Sender list processed
- Brief summary of each person's key items
- Generated reports reference
- Any user corrections or feedback

### 6.2 Memory Usage

SKILL.md instructs AI:
1. On start: read `memory/user.md` to greet user by name
2. Before summarizing: read `memory/team-context.md` for context about team members
3. Before generating: read `memory/style-profile.md` for user's writing style; if it contains a custom template, use it instead of the default
4. Before any function: optionally read recent history for continuity
5. After summarizing: update `memory/team-context.md` if new information was learned
6. After any generation: update `memory/history/YYYY-WNN.md`

## 7. Config System

### 7.1 config.json

Built-in default (`skills/weekly/config/config.json`):

```json
{
  "senders": [],
  "keyword": "周报",
  "folder": "inbox",
  "limit": 100,
  "date_range": "current_week",
  "output_dir": "weekly/output",
  "language": "zh"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `senders` | string[] | `[]` | Email addresses to fetch reports from. Empty means all. |
| `keyword` | string | `"周报"` | Subject keyword filter |
| `folder` | string | `"inbox"` | Outlook folder to read |
| `limit` | number | `100` | Max emails to fetch |
| `date_range` | string | `"current_week"` | `"current_week"`, `"last_week"`, or `"YYYY-MM-DD:YYYY-MM-DD"` |
| `output_dir` | string | `"weekly/output"` | Output directory (relative to cwd, or absolute path) |
| `language` | string | `"zh"` | Output language. `"zh"` (Chinese, default), `"en"` (English), or `"auto"` (match input) |

### 7.2 rules.md

Built-in default (`skills/weekly/config/rules.md`):

```markdown
# Analysis Rules

## Risk Detection
Flag items mentioning: deadline slip, resource shortage, dependency blocked,
scope change, quality issue, team attrition, rollback, outage, escalation,
delay, understaffed, single point of failure, technical debt overdue

## Priority Classification
- High: blocker, deadline this week, customer-facing impact, production incident
- Medium: in progress with risk, cross-team dependency, approaching deadline
- Low: on track, internal improvement, tech debt, nice-to-have

## Focus Areas
- Cross-team dependencies and coordination issues
- Resource allocation and bottlenecks
- Deliverable timeline accuracy vs plan
- Items that appear in multiple people's reports (convergent risks)
- Unmentioned items from previous week's plan (potential silent failures)
```

## 8. Complete File Map

### 8.1 Skill Source (shipped, built, installed)

```
skills/weekly/
  SKILL.md
  skill.json
  config/
    config.json                         # Default config
    rules.md                            # Default analysis rules
  scripts/
    fetch-outlook-emails.py             # Outlook email fetcher CLI
  specs/
    summarize-requirements.md
    aggregate-requirements.md
    generate-requirements.md
    learn-style-requirements.md
  templates/
    individual-summary.md
    team-aggregate.md
    personal-report.md
  examples/
    individual-summary-example.md
    team-aggregate-example.md
    personal-report-example.md
```

### 8.2 Runtime Data (created by AI during execution)

```
.openskill/weekly/                      # User-level or project-level
  config/
    config.json                         # User config overrides (optional)
    rules.md                            # User custom rules (optional)
  memory/
    user.md                             # User identity and preferences
    style-profile.md                    # Learned writing style
    team-context.md                     # Team member context
    history/
      2026-W13.md                       # Weekly execution record

{cwd}/weekly/output/                    # Default output dir (configurable)
  2026-W13/
    individual-summaries.md
    team-aggregate.md
    my-report.md
```

### 8.3 Directory Auto-Creation

AI checks and creates directories before writing:
- `.openskill/weekly/config/`
- `.openskill/weekly/memory/`
- `.openskill/weekly/memory/history/`
- `{output_dir}/YYYY-WNN/`

## 9. Skill Metadata

### 9.1 skill.json

```json
{
  "name": "weekly",
  "version": "1.0.0",
  "description": "Weekly report automation for managers",
  "type": "skill",
  "platforms": ["claude", "joycode"],
  "render": ["SKILL.md", "specs/*.md"],
  "agents": []
}
```

### 9.2 SKILL.md Frontmatter

```yaml
---
name: weekly
description: Use when the user wants to summarize team weekly reports from Outlook, aggregate team progress with risk analysis, generate their own weekly report, learn their writing style from samples, or configure weekly report settings
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---
```
