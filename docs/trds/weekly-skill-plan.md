# Weekly Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `weekly` Claude Code skill -- a complete weekly report automation system that fetches Outlook emails, summarizes team reports, aggregates with risk analysis, and generates the user's personal report.

**Architecture:** Claude Code skill (SKILL.md orchestrates AI). Python CLI tool fetches emails from Outlook via JXA. AI does all understanding, analysis, and generation. File system provides persistence via config/ and memory/ directories. STE pattern: each function has dedicated spec + template + example.

**Tech Stack:** Python 3 (email fetcher), Markdown (skill content), JSON (config), JXA/osascript (Outlook bridge)

**Spec reference:** `docs/trds/weekly-skill-design.md`

**Important:** The existing `skills/weekly-report/` directory must be removed first and replaced with the new `skills/weekly/` structure.


## File Structure

```
skills/weekly/                          # NEW skill (replaces skills/weekly-report/)
  SKILL.md                              # Orchestration entry point
  skill.json                            # Build metadata
  config/
    config.json                         # Default config
    rules.md                            # Default analysis rules
  scripts/
    fetch-outlook-emails.py             # Outlook email fetcher CLI
  specs/
    summarize-requirements.md           # How to summarize individual reports
    aggregate-requirements.md           # How to aggregate team report
    generate-requirements.md            # How to generate personal report
    learn-style-requirements.md         # How to learn user's writing style
  templates/
    individual-summary.md               # Per-person summary format
    team-aggregate.md                   # Team aggregate report format
    personal-report.md                  # User's personal report format
  examples/
    individual-summary-example.md       # Example summary output
    team-aggregate-example.md           # Example aggregate output
    personal-report-example.md          # Example personal report
```

Files to delete:
- `skills/weekly-report/` (entire directory)


## Task 1: Remove Old Skill, Create Directory Structure

**Files:**
- Delete: `skills/weekly-report/` (entire directory)
- Create: `skills/weekly/` directory tree

- [ ] **Step 1: Remove the old weekly-report skill**

```bash
rm -rf skills/weekly-report
```

- [ ] **Step 2: Create the new directory structure**

```bash
mkdir -p skills/weekly/config
mkdir -p skills/weekly/scripts
mkdir -p skills/weekly/specs
mkdir -p skills/weekly/templates
mkdir -p skills/weekly/examples
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove weekly-report skill, prepare weekly skill structure"
```


## Task 2: skill.json and Default Config

**Files:**
- Create: `skills/weekly/skill.json`
- Create: `skills/weekly/config/config.json`
- Create: `skills/weekly/config/rules.md`

- [ ] **Step 1: Create skill.json**

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

- [ ] **Step 2: Create default config.json**

```json
{
  "senders": [],
  "keyword": "周报",
  "folder": "inbox",
  "limit": 100,
  "date_range": "current_week",
  "output_dir": "weekly/output",
  "language": "auto"
}
```

- [ ] **Step 3: Create default rules.md**

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

- [ ] **Step 4: Commit**

```bash
git add skills/weekly/skill.json skills/weekly/config/
git commit -m "feat(weekly): add skill metadata and default config"
```


## Task 3: Email Fetcher Script

**Files:**
- Create: `skills/weekly/scripts/fetch-outlook-emails.py`

- [ ] **Step 1: Create the Python CLI tool**

This is a standalone CLI that fetches emails from macOS Outlook via JXA and outputs JSON to stdout. Based on the legacy `outlook_reader.py` but rewritten as a proper CLI with date filtering.

```python
#!/usr/bin/env python3
"""
fetch-outlook-emails.py
-----------------------
CLI tool to fetch emails from macOS Outlook via JXA (osascript).
Outputs JSON array to stdout. Errors to stderr.

Usage:
    python fetch-outlook-emails.py \
        --senders "alice@co.com,bob@co.com" \
        --keyword "周报" \
        --start-date 2026-03-23 \
        --end-date 2026-03-29
"""

import argparse
import json
import subprocess
import sys
from datetime import datetime


def build_jxa_script(folder: str, limit: int, start_date: str | None, end_date: str | None) -> str:
    """Build the JXA script string with safe parameter injection."""
    safe_folder = folder.replace('\\', '\\\\').replace('"', '\\"')

    date_filter_js = ""
    if start_date:
        date_filter_js += f'var startDate = new Date("{start_date}T00:00:00");\n'
    if end_date:
        date_filter_js += f'var endDate = new Date("{end_date}T23:59:59");\n'

    date_check_js = ""
    if start_date and end_date:
        date_check_js = "var recvDate = new Date(recvTime); if (recvDate < startDate || recvDate > endDate) continue;"
    elif start_date:
        date_check_js = "var recvDate = new Date(recvTime); if (recvDate < startDate) continue;"
    elif end_date:
        date_check_js = "var recvDate = new Date(recvTime); if (recvDate > endDate) continue;"

    return f"""
ObjC.import("Foundation");
var outlook = Application("Microsoft Outlook");
var folder;

if ("{safe_folder}" === "inbox") {{
    folder = outlook.inbox;
}} else {{
    var allFolders = outlook.mailFolders();
    folder = null;
    for (var fi = 0; fi < allFolders.length; fi++) {{
        if (allFolders[fi].name() === "{safe_folder}") {{
            folder = allFolders[fi];
            break;
        }}
    }}
    if (!folder) throw new Error("Folder not found: {safe_folder}");
}}

{date_filter_js}

var messages = folder.messages();

var result = [];
var count = 0;
for (var i = 0; i < messages.length && count < {limit}; i++) {{
    var m = messages[i];
    try {{
        var recvTime = m.timeReceived().toString();
        {date_check_js}

        var subject    = m.subject()  || "";
        var senderName = m.sender() ? (m.sender().name()    || "") : "";
        var senderAddr = m.sender() ? (m.sender().address() || "") : "";
        var bodyText   = m.plainTextContent() || "";
        var msgId      = m.id().toString();

        result.push({{
            id:             msgId,
            subject:        subject,
            sender_name:    senderName,
            sender_address: senderAddr,
            received_time:  recvTime,
            body:           bodyText
        }});
        count++;
    }} catch(e) {{}}
}}

JSON.stringify(result);
"""


def run_jxa(script: str) -> str:
    """Execute JXA script via osascript, return stdout."""
    result = subprocess.run(
        ["osascript", "-l", "JavaScript", "-e", script],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        print(f"Error: JXA execution failed: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(1)
    return result.stdout.strip()


def filter_by_senders(emails: list[dict], senders: list[str]) -> list[dict]:
    """Filter emails by sender address list (case-insensitive)."""
    if not senders:
        return emails
    senders_lower = [s.lower().strip() for s in senders]
    return [
        e for e in emails
        if e.get("sender_address", "").lower() in senders_lower
    ]


def filter_by_keyword(emails: list[dict], keyword: str) -> list[dict]:
    """Filter emails by keyword in subject or body (case-insensitive)."""
    if not keyword:
        return emails
    kw = keyword.lower()
    return [
        e for e in emails
        if kw in e.get("subject", "").lower() or kw in e.get("body", "").lower()
    ]


def main():
    parser = argparse.ArgumentParser(
        description="Fetch emails from macOS Outlook and output as JSON"
    )
    parser.add_argument("--senders", type=str, default="",
                        help="Comma-separated sender email addresses")
    parser.add_argument("--keyword", type=str, default="",
                        help="Filter by subject/body keyword")
    parser.add_argument("--start-date", type=str, default=None,
                        help="Start date YYYY-MM-DD (filter by received time)")
    parser.add_argument("--end-date", type=str, default=None,
                        help="End date YYYY-MM-DD (filter by received time)")
    parser.add_argument("--folder", type=str, default="inbox",
                        help="Outlook folder name (default: inbox)")
    parser.add_argument("--limit", type=int, default=100,
                        help="Max emails to return (default: 100)")

    args = parser.parse_args()

    # Validate dates
    for date_str, label in [(args.start_date, "--start-date"), (args.end_date, "--end-date")]:
        if date_str:
            try:
                datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                print(f"Error: {label} must be YYYY-MM-DD format, got: {date_str}", file=sys.stderr)
                sys.exit(1)

    # Fetch from Outlook
    script = build_jxa_script(args.folder, args.limit, args.start_date, args.end_date)
    raw = run_jxa(script)

    try:
        emails = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Error: Failed to parse Outlook response: {e}", file=sys.stderr)
        sys.exit(1)

    # Python-side filtering
    senders = [s.strip() for s in args.senders.split(",") if s.strip()] if args.senders else []
    emails = filter_by_senders(emails, senders)
    emails = filter_by_keyword(emails, args.keyword)

    # Output
    print(json.dumps(emails, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Make executable**

```bash
chmod +x skills/weekly/scripts/fetch-outlook-emails.py
```

- [ ] **Step 3: Verify syntax**

```bash
python3 -c "import ast; ast.parse(open('skills/weekly/scripts/fetch-outlook-emails.py').read()); print('OK')"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add skills/weekly/scripts/
git commit -m "feat(weekly): add Outlook email fetcher CLI tool"
```


## Task 4: Spec Files

**Files:**
- Create: `skills/weekly/specs/summarize-requirements.md`
- Create: `skills/weekly/specs/aggregate-requirements.md`
- Create: `skills/weekly/specs/generate-requirements.md`
- Create: `skills/weekly/specs/learn-style-requirements.md`

- [ ] **Step 1: Create summarize-requirements.md**

```markdown
# Summarize Requirements

## Purpose

Extract and condense individual weekly report emails into structured per-person summaries.

## Input

Raw email JSON from fetch-outlook-emails.py. Each email contains subject, sender_name, sender_address, received_time, and body.

## Processing Rules

1. Group emails by sender (use sender_address as key, sender_name as display)
2. For each sender, extract:
   - Key achievements / completed work
   - Work in progress with status
   - Blockers and risks
   - Plans for next week
3. If a sender has multiple emails matching the date range, use the most recent one
4. AI must examine email subject dates to confirm the email is for the target week:
   - Understand various formats: 20260323, 2026-03-23, 2026.03.23, 03/23-03/29, 3月23日, etc.
   - If ambiguous, include the email but note the ambiguity
5. Strip email signatures, forwarded content, and reply chains -- focus on the report body only

## Output Format

Follow the template at [templates/individual-summary.md](../templates/individual-summary.md).

## Quality Standards

- Each summary should be 100-200 words per person
- Preserve specific numbers, dates, and metrics from the original
- Do not add interpretation or judgment -- summarize what was reported
- Use the same language as the original email content
- If the email body is empty or too short to extract meaningful content, note "No substantive content in this report"
```

- [ ] **Step 2: Create aggregate-requirements.md**

```markdown
# Aggregate Requirements

## Purpose

Merge individual summaries into a unified team report with risk analysis and cross-cutting insights.

## Input

Individual summaries (output from the summarize function).

## Processing Rules

1. Read the active rules.md (user override if exists, otherwise built-in default)
2. Organize content into these sections:
   - Team Overview: 2-3 sentence executive summary
   - Key Progress: notable achievements across the team
   - In Progress: significant items still underway
   - Risks & Blockers: flagged items per rules.md risk detection keywords
   - Cross-Team Dependencies: items involving coordination between people
   - AI Insights: patterns the AI detected beyond the rules
3. Apply priority classification from rules.md
4. Flag items from rules.md focus areas

## AI Insights Section

This section is the AI's own analysis, not just rule-matching. Include:
- Patterns across multiple reports (same issue mentioned by different people)
- Items from last week's plan that nobody mentioned this week (potential silent failures -- requires reading history)
- Resource concentration risks (one person handling too many critical items)
- Inconsistencies between reports (person A says X is done, person B says X is blocked)

## Output Format

Follow the template at [templates/team-aggregate.md](../templates/team-aggregate.md).

## Quality Standards

- Total length: 400-800 words
- Every risk item must have severity (High/Medium/Low) and suggested action
- Cross-reference specific people by name when relevant
- If no risks found, explicitly state "No significant risks identified this week"
```

- [ ] **Step 3: Create generate-requirements.md**

```markdown
# Generate Requirements

## Purpose

Generate the user's own weekly report based on team aggregate data, applying the user's personal writing style.

## Prerequisites

- Team aggregate report must exist (from the aggregate function)
- style-profile.md must exist in memory (from learn-style function)
- If style-profile.md is missing, prompt the user to run learn-style first

## Processing Rules

1. Read memory/style-profile.md for the user's writing style
2. If style-profile.md contains a custom template section, use it instead of the default template
3. Read the team aggregate report as the primary data source
4. Generate a report that:
   - Follows the user's tone, structure, and vocabulary patterns
   - Includes the AI's risk insights as the user's own observations
   - Highlights items the user would likely emphasize (based on rules.md focus areas)
   - Matches the user's preferred report length
5. Present the draft to the user for review before finalizing

## Output Format

Follow the template at [templates/personal-report.md](../templates/personal-report.md), unless style-profile.md specifies a custom template.

## Quality Standards

- Match the user's writing style closely (tone, word choice, structure)
- Output language must match the user's preference (from config or style-profile)
- Include at least one forward-looking risk or recommendation
- Do not fabricate data -- only use information from the aggregate report
- Total length should match the user's historical report length (from style-profile)
```

- [ ] **Step 4: Create learn-style-requirements.md**

```markdown
# Learn Style Requirements

## Purpose

Analyze the user's historical weekly reports to extract their personal writing style, then save a style profile for future report generation.

## Input

User provides one or more of:
- Screenshots of past weekly reports
- Markdown or plain text of past reports
- Pasted content in the chat

Minimum: 2 samples. Recommended: 3-5 samples for reliable style extraction.

## Processing Rules

1. Analyze each sample for:
   - **Tone**: formal/casual, assertive/neutral, first-person/third-person
   - **Structure**: section headings, ordering, nesting depth
   - **Vocabulary**: recurring phrases, preferred terminology, jargon
   - **Metrics style**: how numbers are presented (percentages, fractions, absolute)
   - **Length**: typical word count per section and total
   - **Language**: primary language used
2. Identify patterns that appear across multiple samples (not one-off choices)
3. If the user's style differs significantly from the default template, generate a custom template section in the style profile
4. Present the analysis to the user for confirmation before saving

## Output

Write to `.openskill/weekly/memory/style-profile.md`:

```
# Style Profile

## Tone
[Analysis of writing tone]

## Structure
[Preferred sections and ordering]

## Vocabulary
[Recurring phrases and terminology]

## Metrics Style
[How data is presented]

## Length
[Typical word count]

## Language
[Primary language]

## Custom Template (optional)
[If style differs from default, include a custom report template here]
```

## Quality Standards

- Must be based on actual patterns, not assumptions
- Present analysis to user for confirmation
- If fewer than 2 samples provided, warn that the profile may be unreliable
- Profile should be human-readable and editable
```

- [ ] **Step 5: Commit**

```bash
git add skills/weekly/specs/
git commit -m "feat(weekly): add STE spec files for all functions"
```


## Task 5: Template Files

**Files:**
- Create: `skills/weekly/templates/individual-summary.md`
- Create: `skills/weekly/templates/team-aggregate.md`
- Create: `skills/weekly/templates/personal-report.md`

- [ ] **Step 1: Create individual-summary.md**

```markdown
# Individual Summary: [Sender Name]

> Email: [sender_address]
> Report date: [date from subject or received_time]
> Received: [received_time]

## Key Achievements
- [Achievement with specific metrics/deliverables]

## In Progress
- [Task] - [Status/Completion %]

## Blockers & Risks
- [Blocker description] - [Impact]

## Next Week Plan
- [Planned item]

## Notes
[Any ambiguity, missing content, or AI observations about this report]
```

- [ ] **Step 2: Create team-aggregate.md**

```markdown
# Team Weekly Aggregate - [Date Range]

## Team Overview
[2-3 sentence executive summary: how many reports processed, overall team status]

## Key Progress
- [Person]: [Notable achievement with metrics]

## In Progress
- [Person]: [Significant item] - [Status]

## Risks & Blockers

### High Priority
- [Risk/Blocker] - Owner: [Person] - Impact: [Description] - Suggested Action: [Action]

### Medium Priority
- [Risk/Blocker] - Owner: [Person] - Impact: [Description]

### Low Priority
- [Item] - Owner: [Person]

## Cross-Team Dependencies
- [Dependency description] - Involves: [Person A, Person B]

## AI Insights
- [Pattern detected across reports]
- [Silent failure: item from last week not mentioned]
- [Resource concentration risk]
- [Inconsistency between reports]

## Summary Statistics
- Reports processed: [N]
- High priority risks: [N]
- Cross-team items: [N]
```

- [ ] **Step 3: Create personal-report.md**

```markdown
# Weekly Report - [Date Range]

## Summary
[2-3 sentence executive summary with key metrics from the team]

## Team Progress
- [Key achievement 1] - [Measurable outcome]
- [Key achievement 2] - [Measurable outcome]

## In Progress
- [Task 1] - [Completion %] - [Expected completion date]
- [Task 2] - [Completion %] - [Expected completion date]

## Risks & Issues
- [Risk 1] - Impact: [Level] - Mitigation: [Action]
- [Blocker 1] - Owner: [Name] - Expected resolution: [Date]

## Observations & Recommendations
- [AI-powered insight presented as the user's observation]

## Next Week Focus
- [Priority item 1]
- [Priority item 2]
```

- [ ] **Step 4: Commit**

```bash
git add skills/weekly/templates/
git commit -m "feat(weekly): add STE template files for all output types"
```


## Task 6: Example Files

**Files:**
- Create: `skills/weekly/examples/individual-summary-example.md`
- Create: `skills/weekly/examples/team-aggregate-example.md`
- Create: `skills/weekly/examples/personal-report-example.md`

- [ ] **Step 1: Create individual-summary-example.md**

```markdown
# Individual Summary: Alice Chen

> Email: alice.chen@company.com
> Report date: 2026-03-23 ~ 2026-03-29
> Received: 2026-03-28T17:30:00

## Key Achievements
- Completed user authentication module v2 migration -- 12K users migrated with zero downtime
- Reduced API response time for /users endpoint from 450ms to 120ms (73% improvement)
- Delivered OAuth2 integration test suite (47 test cases, all passing)

## In Progress
- Admin permission matrix UI - 60% complete, frontend components done, pending API integration
- Database sharding plan for user table - design review scheduled for next Tuesday

## Blockers & Risks
- Third-party OAuth provider sandbox environment unstable since Wednesday - blocking E2E testing
- Need DBA review for sharding plan but DBA team fully allocated to incident response this week

## Next Week Plan
- Complete admin permission matrix API integration
- Get DBA review for sharding plan
- Start user session migration (depends on OAuth provider stability)

## Notes
Report well-structured with clear metrics. OAuth blocker mentioned -- may cascade to session migration timeline.
```

- [ ] **Step 2: Create team-aggregate-example.md**

```markdown
# Team Weekly Aggregate - 2026-03-23 ~ 2026-03-29

## Team Overview
Processed 5 weekly reports. Team overall on track with 3 major deliverables completed. 2 high-priority risks identified, both related to external dependencies.

## Key Progress
- Alice Chen: Completed auth v2 migration (12K users, zero downtime) and 73% API latency improvement
- Bob Wang: Shipped payment reconciliation batch job, processing 50K transactions/day in production
- Carol Liu: Delivered mobile push notification SDK v3 to partner teams, 3 integrations confirmed
- Dave Zhang: Completed load testing for Black Friday prep -- system handles 5x current peak
- Eve Li: Published API documentation portal, 120 endpoints documented with examples

## In Progress
- Alice Chen: Admin permission matrix UI (60%) and DB sharding design
- Bob Wang: Payment dispute workflow (40%), blocked on legal review
- Carol Liu: Push notification analytics dashboard (70%), on track for next Wednesday

## Risks & Blockers

### High Priority
- OAuth provider sandbox instability - Owner: Alice Chen - Impact: Blocks E2E testing and session migration timeline - Suggested Action: Escalate to vendor support, prepare fallback test environment
- Payment dispute workflow blocked by legal review - Owner: Bob Wang - Impact: Cannot ship to production without legal sign-off, deadline is April 5 - Suggested Action: Schedule urgent meeting with legal team

### Medium Priority
- DBA team fully allocated to incident response - Owner: Alice Chen - Impact: DB sharding plan review delayed - Suggested Action: Request 2-hour slot next week, share design doc in advance
- Mobile SDK v3 has intermittent timeout on Android 12 - Owner: Carol Liu - Impact: 1 of 3 partner integrations affected

### Low Priority
- API documentation portal missing 8 legacy endpoints - Owner: Eve Li - On track to complete next week

## Cross-Team Dependencies
- Alice <-> DBA team: Sharding plan review (blocked)
- Bob <-> Legal team: Dispute workflow approval (blocked)
- Carol <-> 3 partner teams: SDK v3 integration (in progress)

## AI Insights
- Two blockers involve external teams (DBA, Legal) with no confirmed resolution dates -- risk of cascading delays
- Alice has 3 concurrent high-priority items (auth migration followup, admin UI, sharding) -- potential resource concentration risk
- Dave's load testing result (5x peak) was last week's plan item and is now confirmed done -- good execution
- Nobody mentioned the API gateway upgrade that was in last week's plan -- may need follow-up

## Summary Statistics
- Reports processed: 5
- High priority risks: 2
- Cross-team items: 3
```

- [ ] **Step 3: Create personal-report-example.md**

```markdown
# Weekly Report - 2026-03-23 ~ 2026-03-29

## Summary
5 direct reports submitted weekly updates. 3 major deliverables completed this week (auth migration, payment batch job, push SDK). 2 high-priority blockers require cross-team escalation.

## Team Progress
- Auth v2 migration completed -- 12K users migrated with zero downtime, API latency reduced 73%
- Payment reconciliation batch job live in production -- processing 50K transactions/day
- Mobile push SDK v3 delivered to 3 partner teams, integrations in progress
- Black Friday load testing passed -- system handles 5x current peak traffic
- API documentation portal published with 120 endpoints

## In Progress
- Admin permission matrix UI - 60% - Expected next Friday
- Payment dispute workflow - 40% - Blocked by legal review, deadline April 5
- Push notification analytics dashboard - 70% - On track for next Wednesday

## Risks & Issues
- OAuth sandbox instability blocking Alice's E2E testing -- escalating to vendor, preparing fallback test environment
- Legal review blocking payment dispute workflow -- scheduling urgent meeting, deadline is April 5
- DBA team unavailable for sharding review due to ongoing incident response

## Observations & Recommendations
- Two critical-path items depend on external teams with no confirmed timelines -- recommend daily check-ins until resolved
- Alice is carrying 3 high-priority items simultaneously -- consider redistributing DB sharding design review prep to another team member
- API gateway upgrade was planned last week but not mentioned in any report this week -- need to confirm status

## Next Week Focus
- Resolve OAuth vendor issue and unblock session migration
- Get legal sign-off on payment dispute workflow before April 5 deadline
- Complete admin permission matrix and push analytics dashboard
```

- [ ] **Step 4: Commit**

```bash
git add skills/weekly/examples/
git commit -m "feat(weekly): add STE example files for all output types"
```


## Task 7: SKILL.md -- The Orchestration File

**Files:**
- Create: `skills/weekly/SKILL.md`

This is the most important file -- it tells the AI exactly how to execute the weekly skill.

- [ ] **Step 1: Create SKILL.md**

```markdown
---
name: weekly
description: Use when the user wants to summarize team weekly reports from Outlook, aggregate team progress with risk analysis, generate their own weekly report, learn their writing style from samples, or configure weekly report settings
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Weekly Report Automation

A complete weekly report workflow: fetch team emails from Outlook, summarize, aggregate with risk analysis, and generate your personal report.

## Quick Start

Available commands:
- **summarize** - Fetch and summarize team weekly reports
- **aggregate** - Merge summaries into team overview with risk analysis
- **generate** - Create your personal weekly report (requires style profile)
- **learn-style** - Teach me your writing style from samples
- **configure** - Set up senders, keywords, and preferences

## Initialization

On every invocation:

1. Determine the data directory. Check for `.openskill/weekly/` in the current directory first (project-level), then `~/.openskill/weekly/` (user-level). If neither exists, use project-level and create it.

2. Read `{data-dir}/memory/user.md` if it exists. Greet the user by name. If it does not exist, this is the first run -- ask the user for their name or preferred greeting, then create `{data-dir}/memory/user.md`.

3. Load config:
   - Read the built-in `config/config.json` (relative to this skill's directory)
   - Read `{data-dir}/config/config.json` if it exists, overlay its fields on top of built-in defaults
   - The merged config is used for all operations

4. Load rules:
   - Check `{data-dir}/config/rules.md` -- if it exists, use it
   - Otherwise, use the built-in `config/rules.md`

## Function: summarize

Trigger: user asks to summarize weekly reports, or says "summarize this week"

### Steps

1. Resolve the date range:
   - If config `date_range` is `"current_week"`: calculate Monday-Sunday of the current week
   - If `"last_week"`: calculate Monday-Sunday of the previous week
   - If `"YYYY-MM-DD:YYYY-MM-DD"`: use the explicit range
   - The user can also specify a date range in their message, which overrides config

2. Read `{data-dir}/memory/team-context.md` if it exists, for background on team members.

3. Call the email fetcher:
   ```bash
   python {skill-dir}/scripts/fetch-outlook-emails.py \
     --senders "{senders from config, comma-separated}" \
     --keyword "{keyword from config}" \
     --start-date {start-date} \
     --end-date {end-date} \
     --folder "{folder from config}" \
     --limit {limit from config}
   ```
   Where `{skill-dir}` is the directory containing this SKILL.md.

4. Parse the JSON output. If empty, inform the user no matching emails were found.

5. For each email, examine the subject line to confirm it's a weekly report for the target date range. Use semantic understanding -- dates may be in formats like `20260323`, `2026-03-23`, `2026.03.23`, `03/23-03/29`, `3月23日`, or as a date range.

6. Read `specs/summarize-requirements.md` for processing rules and `templates/individual-summary.md` for output format.

7. Generate one summary per person. Reference `examples/individual-summary-example.md` for the expected quality level.

8. Create the output directory: `{output-dir}/YYYY-WNN/` (e.g., `weekly/output/2026-W13/`). If the directory already exists, AI should ask the user whether to overwrite.

9. Write summaries to `{output-dir}/YYYY-WNN/individual-summaries.md`.

10. Update `{data-dir}/memory/team-context.md` with any new information learned about team members.

11. Present the summaries to the user for review.

## Function: aggregate

Trigger: user asks to aggregate team report, or says "aggregate"

### Steps

1. Read the individual summaries from the most recent summarize output, or from a path the user specifies.

2. Read the active rules.md (user override or built-in default).

3. Read `{data-dir}/memory/history/` for recent weeks to enable cross-week analysis (silent failures, trend detection).

4. Read `specs/aggregate-requirements.md` for processing rules and `templates/team-aggregate.md` for output format.

5. Generate the aggregate report. Reference `examples/team-aggregate-example.md` for expected quality.

6. Write to `{output-dir}/YYYY-WNN/team-aggregate.md`.

7. Present to user for review.

## Function: generate

Trigger: user asks to generate their weekly report, or says "generate my report"

### Steps

1. Check that `{data-dir}/memory/style-profile.md` exists. If not, inform the user they need to run learn-style first and offer to start it.

2. Read the team aggregate report (from the most recent aggregate output).

3. Read `{data-dir}/memory/style-profile.md` for the user's writing style. If it contains a "Custom Template" section, use that instead of the default template.

4. Read `specs/generate-requirements.md` for processing rules and `templates/personal-report.md` for output format.

5. Generate the personal report. Reference `examples/personal-report-example.md` for expected quality.

6. Present the draft to the user for review and editing before finalizing.

7. After user approval, write to `{output-dir}/YYYY-WNN/my-report.md`.

8. Update `{data-dir}/memory/history/YYYY-WNN.md` with a record of what was generated.

## Function: learn-style

Trigger: user wants to teach their writing style, or says "learn my style"

### Steps

1. Ask the user to provide 2-5 samples of their past weekly reports. Accept:
   - Screenshots (read and analyze visually)
   - Markdown files (read file paths)
   - Pasted text in the chat

2. Read `specs/learn-style-requirements.md` for analysis rules.

3. Analyze all samples to extract: tone, structure, vocabulary, metrics style, length, language.

4. Present the analysis to the user for confirmation. Ask if anything needs adjustment.

5. After confirmation, write to `{data-dir}/memory/style-profile.md`.

6. If the user's style differs significantly from `templates/personal-report.md`, include a "Custom Template" section in the style profile.

## Function: configure

Trigger: user wants to set up or modify configuration, or says "configure"

### Steps

1. Show current effective config (built-in defaults merged with user overrides).

2. Guide the user through settings:
   - Sender list (who to fetch reports from)
   - Subject keyword (default: "周报")
   - Date range preference
   - Output directory
   - Language preference

3. For rules.md: ask if the user wants to customize risk detection keywords, priority classification, or focus areas. If yes, copy the built-in rules.md to `{data-dir}/config/rules.md` and let the user edit it.

4. Write updated config to `{data-dir}/config/config.json`.

## Memory Management

After every operation that produces output:
- Update `{data-dir}/memory/history/YYYY-WNN.md` with what was done
- Update `{data-dir}/memory/team-context.md` if new team member info was learned
- Never delete or overwrite memory files -- append or update incrementally

## Error Handling

- If Outlook is not running: inform the user and suggest opening Outlook first
- If no emails match: inform the user, suggest checking config (senders, keyword, date range)
- If a required memory file is missing (e.g., style-profile.md for generate): guide the user to create it
- If output directory is not writable: report the error and suggest an alternative path

## References

- [Summarize spec](specs/summarize-requirements.md)
- [Aggregate spec](specs/aggregate-requirements.md)
- [Generate spec](specs/generate-requirements.md)
- [Learn style spec](specs/learn-style-requirements.md)
- [Individual summary template](templates/individual-summary.md)
- [Team aggregate template](templates/team-aggregate.md)
- [Personal report template](templates/personal-report.md)
- [Default rules](config/rules.md)
```

- [ ] **Step 2: Commit**

```bash
git add skills/weekly/SKILL.md
git commit -m "feat(weekly): add SKILL.md orchestration file"
```


## Task 8: Update Existing Framework References

**Files:**
- Modify: `skills/weekly/skill.json` (already created, verify `render` field includes config/)

- [ ] **Step 1: Verify openskill build works with the new skill**

```bash
npx tsx src/cli/index.ts build --verbose
```

Expected: Should build the `weekly` skill for both platforms. If it fails because `weekly-report` references remain, fix them.

- [ ] **Step 2: Verify openskill lint passes**

```bash
npx tsx src/cli/index.ts lint weekly
```

Expected: 0 errors. Warnings are acceptable (e.g., examples-has-content if example files exist).

- [ ] **Step 3: Run all existing tests**

```bash
npx vitest run
```

Expected: All tests pass. The integration test references `weekly-report` and needs to be updated.

- [ ] **Step 4: Update integration test to reference `weekly` instead of `weekly-report`**

Edit `tests/integration.test.ts`:
- Change `weekly-report` to `weekly` in all paths

- [ ] **Step 5: Run tests again**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "fix: update integration tests for weekly skill rename"
```


## Task 9: Final Verification

- [ ] **Step 1: Verify complete file structure**

```bash
find skills/weekly -type f | sort
```

Expected output:
```
skills/weekly/SKILL.md
skills/weekly/config/config.json
skills/weekly/config/rules.md
skills/weekly/examples/individual-summary-example.md
skills/weekly/examples/personal-report-example.md
skills/weekly/examples/team-aggregate-example.md
skills/weekly/scripts/fetch-outlook-emails.py
skills/weekly/skill.json
skills/weekly/specs/aggregate-requirements.md
skills/weekly/specs/generate-requirements.md
skills/weekly/specs/learn-style-requirements.md
skills/weekly/specs/summarize-requirements.md
skills/weekly/templates/individual-summary.md
skills/weekly/templates/personal-report.md
skills/weekly/templates/team-aggregate.md
```

- [ ] **Step 2: Verify build**

```bash
npx tsx src/cli/index.ts build
```

Expected: Build complete for both platforms.

- [ ] **Step 3: Verify lint**

```bash
npx tsx src/cli/index.ts lint weekly
```

Expected: 0 errors.

- [ ] **Step 4: Verify all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 5: Check spec coverage**

Cross-reference against design doc sections:

| Design Section | Implemented In |
|----------------|---------------|
| 2.1 Components | All files created |
| 2.2 Data Flow | SKILL.md orchestration |
| 2.3 Config Merge | SKILL.md initialization |
| 2.4 Graceful Onboarding | SKILL.md initialization |
| 3. Email Fetcher | scripts/fetch-outlook-emails.py |
| 4.1 Functions | SKILL.md (5 functions) |
| 4.3 Risk Analysis | specs/aggregate-requirements.md + config/rules.md |
| 4.4 Date Handling | specs/summarize-requirements.md + SKILL.md |
| 5. STE Files | specs/ + templates/ + examples/ |
| 6. Memory System | SKILL.md memory management section |
| 7. Config System | config/ + SKILL.md initialization |
| 9. Skill Metadata | skill.json + SKILL.md frontmatter |

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(weekly): complete weekly skill implementation"
```
