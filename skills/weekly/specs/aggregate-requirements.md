# Aggregate Requirements

## Purpose

Merge individual summaries into a unified team report with risk analysis and cross-cutting insights.

## Input

Individual summaries (output from the summarize function).

## Processing Rules

1. Read the active openskill.md (user override if exists, otherwise built-in default)
2. Organize content into these sections:
   - Team Overview: 2-3 sentence executive summary
   - Key Progress: notable achievements across the team
   - In Progress: significant items still underway
   - Risks & Blockers: flagged items per openskill.md risk detection keywords
   - Cross-Team Dependencies: items involving coordination between people
   - AI Insights: patterns the AI detected beyond the rules
3. Apply priority classification from openskill.md
4. Flag items from openskill.md focus areas

## AI Insights Section

This section is the AI's own analysis, not just rule-matching. Include:
- Patterns across multiple reports (same issue mentioned by different people)
- Items from last week's plan that nobody mentioned this week (potential silent failures -- requires reading history)
- Resource concentration risks (one person handling too many critical items)
- Inconsistencies between reports (person A says X is done, person B says X is blocked)
- If no history is available (first-time run), skip cross-week analysis and note that trend detection will improve after future runs

## Output Format

Follow the template at [templates/team-aggregate.md](../templates/team-aggregate.md).

## Quality Standards

- Total length: 400-800 words
- Every risk item must have severity (High/Medium/Low) and suggested action
- Cross-reference specific people by name when relevant
- If no risks found, explicitly state "No significant risks identified this week"

## Verification Checklist (per AGV standard)

After generating the aggregate report, verify:
- [ ] All 7 template sections present (Team Overview, Key Progress, In Progress, Risks & Blockers, Cross-Team Dependencies, AI Insights, Summary Statistics)
- [ ] Word count is 400-800
- [ ] Every risk item has severity (High/Medium/Low) and suggested action
- [ ] Risk items correctly categorized per openskill.md priority classification
- [ ] Focus areas from openskill.md are addressed
- [ ] People are referenced by name (not generic "someone")
- [ ] AI Insights section contains original analysis (not just rule-matching)
- [ ] Summary Statistics numbers match actual content (report count, risk count, cross-team count)
- [ ] No data from individual summaries was lost or fabricated
- [ ] Output file written with correct language-appropriate filename
