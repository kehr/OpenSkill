# Weekly Skill User Guide

Weekly report automation for managers. Fetches team weekly report emails from Outlook, summarizes and aggregates with risk analysis, and generates your personal report in your writing style.

## Prerequisites

- macOS with Microsoft Outlook installed and running
- Python 3.9+
- Claude Code or JoyCode with the `weekly` skill installed

## Quick Start

```
/weekly configure
```

This walks you through initial setup: your name, sender list, keyword, and preferences.

## Commands

### Summarize Team Reports

```
/weekly summarize this week
/weekly summarize last week
/weekly summarize 2026-03-23 to 2026-03-29
```

Fetches weekly report emails from Outlook, filters by your configured sender list and keyword, then generates a per-person summary. Output is written to `weekly/output/YYYY-WNN/individual-summaries.md`.

### Aggregate Team Report

```
/weekly aggregate
```

Merges individual summaries into a unified team report with:
- Key progress across the team
- Risks and blockers prioritized by severity
- Cross-team dependencies
- AI-powered insights (patterns, silent failures, resource concentration risks)

Output: `weekly/output/YYYY-WNN/team-aggregate.md`

### Generate Your Report

```
/weekly generate my report
```

Creates your personal weekly report based on the team aggregate, written in your style. Requires running `learn-style` first.

Output: `weekly/output/YYYY-WNN/my-report.md`

### Learn Your Writing Style

```
/weekly learn my style
```

Provide 2-5 samples of your past weekly reports (screenshots, markdown files, or pasted text). The AI analyzes your tone, structure, vocabulary, and length preferences, then saves a style profile for future report generation.

### Configure Settings

```
/weekly configure
```

Interactive setup for:
- **Sender list**: email addresses of your direct reports
- **Keyword**: subject filter (default: "周报")
- **Date range**: current_week, last_week, or explicit range
- **Output directory**: where reports are saved (default: `weekly/output/`)
- **Language**: auto, zh, or en

## Configuration

### Built-in Defaults

The skill ships with default settings in `skills/weekly/config/`. You can override any setting by creating files in `.openskill/weekly/config/`.

### config.json

```json
{
  "senders": ["alice@company.com", "bob@company.com"],
  "keyword": "周报",
  "folder": "inbox",
  "limit": 100,
  "date_range": "current_week",
  "output_dir": "weekly/output",
  "language": "auto"
}
```

| Field | Description |
|-------|-------------|
| `senders` | Email addresses to fetch reports from. Empty `[]` means all senders. |
| `keyword` | Subject keyword filter |
| `folder` | Outlook folder to read |
| `limit` | Max emails to fetch per run |
| `date_range` | `"current_week"`, `"last_week"`, or `"YYYY-MM-DD:YYYY-MM-DD"` |
| `output_dir` | Output directory (relative to cwd, or absolute path) |
| `language` | Output language. `"auto"` matches input, or force `"zh"` / `"en"` |

### rules.md

Customize how the AI analyzes risks and priorities. Copy the built-in `skills/weekly/config/rules.md` to `.openskill/weekly/config/rules.md` and edit:

- **Risk Detection**: keywords that trigger risk flags
- **Priority Classification**: how items are categorized (High/Medium/Low)
- **Focus Areas**: topics you want the AI to pay special attention to

## Data Directories

### Runtime Data (.openskill/weekly/)

```
.openskill/weekly/
  config/
    config.json       # Your config overrides
    rules.md          # Your custom analysis rules
  memory/
    user.md           # Your name and preferences
    style-profile.md  # Your learned writing style
    team-context.md   # Team member info (auto-updated)
    history/
      2026-W13.md     # Weekly execution records
```

This directory is created automatically on first run. It can live at project level (`.openskill/weekly/`) or user level (`~/.openskill/weekly/`).

### Output (weekly/output/)

```
weekly/output/
  2026-W13/
    individual-summaries.md   # Per-person summaries
    team-aggregate.md         # Team overview with risk analysis
    my-report.md              # Your personal report
```

Default location is `weekly/output/` in the current working directory. Override with `output_dir` in config.json.

## Workflow

Typical weekly workflow:

1. **Monday/Friday**: `/weekly summarize this week` -- fetch and summarize team reports
2. **Review**: check individual summaries, correct any issues
3. **Aggregate**: `/weekly aggregate` -- generate team overview with risk analysis
4. **Generate**: `/weekly generate my report` -- create your personal report
5. **Review and send**: review the draft, make edits, then use it

### First-Time Setup

1. `/weekly configure` -- set up sender list and preferences
2. `/weekly learn my style` -- provide 2-5 past report samples
3. You're ready to use summarize/aggregate/generate

## Tips

- The AI remembers team context across weeks. It gets better at understanding your team's projects and patterns over time.
- If you notice the AI missing something, mention it -- it will update its team context memory.
- You can always override the date range in your message: `/weekly summarize 2026-03-10 to 2026-03-16`
- The AI examines email subjects to match weekly report dates, understanding various formats (20260323, 2026-03-23, 3月23日, etc.)
