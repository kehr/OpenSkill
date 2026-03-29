# OpenSkill Directives

> This file is the highest-priority configuration for the weekly skill.
> All directives here override built-in behavior. Edit freely.
> Similar to how CLAUDE.md configures Claude Code, this file configures skill execution.

## Risk Detection

### Risk sources (by priority)

**1. Reported risks (highest priority):**
Risks explicitly stated by the report author. These are first-hand judgments from the person closest to the work. MUST be preserved as-is, including the author's own severity assessment (e.g., "高风险", "中风险", "有延期风险", "存在资损风险"). Never downgrade or reinterpret a reported risk.

**2. Inferred risks (AI analysis):**
Risks the AI identifies from contextual signals that the author did not explicitly flag. These must be clearly labeled as AI-inferred (e.g., "[AI推断]"). Signals to watch:
- Resource or funding loss (资损), data corruption, financial impact
- Deadline pressure (delay, reschedule, scope change under time constraint)
- System stability (outage, rollback, degradation, capacity issue)
- Team capacity (understaffed, attrition, key-person dependency)
- External dependency (blocked by another team, vendor, or approval)

### Risk severity judgment

For **reported risks**: use the author's own severity. If the author marked it as "高风险", it's High. Period.

For **AI-inferred risks**: use multi-dimensional contextual analysis.

| Dimension | High | Medium | Low |
|-----------|------|--------|-----|
| Impact scope | Customer-facing, revenue, data loss | Internal workflow, efficiency | Nice-to-have, cosmetic |
| Urgency | This week deadline, already happening | Approaching (2-4 weeks) | No time pressure |
| Mitigation | No plan or plan uncertain | Plan exists but unverified | Plan in place, progressing |
| Recurrence | Repeated pattern, systemic | First occurrence | One-off |
| Blast radius | Multiple teams/systems/users | Single team or system | Single feature |

Weigh all dimensions holistically for AI-inferred risks only. Reported risks retain their original severity.

## Focus Areas

- Cross-team dependencies and coordination issues
- Resource allocation and bottlenecks
- Deliverable timeline accuracy vs plan
- Items that appear in multiple people's reports (convergent risks)
- Unmentioned items from previous week's plan (potential silent failures)

## Output Preferences

(Add your preferences here. Examples:)
- (e.g., "Always highlight AI-related items")
- (e.g., "De-prioritize recruiting data")
- (e.g., "Include specific metric comparisons week-over-week")

## Behavior Overrides

(Add overrides here to change how the skill works. Examples:)
- (e.g., "Skip aggregate step, go directly from summarize to generate")
- (e.g., "Always include my own report items in the team aggregate")
- (e.g., "Limit individual summaries to 80 words per person")
