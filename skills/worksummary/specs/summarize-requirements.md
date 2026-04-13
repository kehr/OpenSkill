# Summarize Requirements

## Purpose

Extract and condense individual weekly report emails into structured per-person summaries.

## Input

Primary: raw email JSON from fetch-outlook-emails.py. Each email contains subject, sender_name, sender_address, received_time, and body.

Alternative inputs (when data source is not Outlook):
- **Pasted text**: treat as a single report. Infer sender name and date from content if possible.
- **File paths**: read each file as a separate report. Use filename or content to identify the sender.
- **Project directory**: analyze git log and changed files to extract weekly activity. Generate a summary of commits, PRs, and document changes.

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
6. If an email is clearly not a weekly report (e.g., meeting invite, FYI forward, discussion thread that happens to contain the keyword), skip it and note it was excluded
7. If the email body is in a different encoding or contains garbled characters, note the issue and extract what is readable

## Output Format

Follow the template at [templates/individual-summary.md](../templates/individual-summary.md).

## Output Handling

When writing output:
- If the output directory already exists, ask the user (via AskUserQuestion): "Overwrite" | "Create new (timestamped)" | "Cancel"
- Save raw email JSON to `{output-dir}/YYYY-WNN/raw/emails.json` (preserves original data for drill-down)
- Write each person's summary to `{output-dir}/YYYY-WNN/individuals/{email_prefix}.md` where `{email_prefix}` is the part before `@` in the sender's email address (e.g., `alice@company.com` -> `alice.md`)

## Subagent Execution

When dispatching parallel subagents for summarization, each agent should receive:

```
Summarize this weekly report. Follow the spec and template exactly.
Write your output to: {output-dir}/YYYY-WNN/individuals/{email_prefix}.md

== Spec ==
{inline content of this file: summarize-requirements.md}

== Template ==
{inline content of templates/individual-summary.md}

== Quality Reference ==
{inline content of examples/individual-summary-example.md}

== Email ==
From: {sender_name} ({sender_address})
Subject: {subject}
Received: {received_time}

{email_body}
```

## Quality Standards

- Each summary should be 100-200 words per person
- Preserve specific numbers, dates, and metrics from the original
- Do not add interpretation or judgment -- summarize what was reported
- Use the same language as the original email content
- If the email body is empty or too short to extract meaningful content, note "No substantive content in this report"

## Verification Checklist (per AGV standard)

After generating each individual summary, verify:
- [ ] All 5 template sections present (Key Achievements, In Progress, Blockers & Risks, Next Week Plan, Notes)
- [ ] Word count is 100-200 per person
- [ ] Specific numbers/metrics from the source email are preserved verbatim (not paraphrased)
- [ ] No interpretive judgment added (only factual extraction)
- [ ] Language matches the source email language
- [ ] Sender metadata (name, email, date) is accurate
- [ ] Non-weekly-report emails were excluded and noted

After all summaries complete (final verification):
- [ ] raw/emails.json saved with original email data
- [ ] All expected senders have a summary in individuals/ (or exclusion noted)
- [ ] No duplicate senders
- [ ] Memory files updated (team-context.md)
