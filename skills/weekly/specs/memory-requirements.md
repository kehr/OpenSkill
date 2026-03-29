# Memory Requirements

## Purpose

Define the structure, update strategy, and quality standards for all persistent memory files. Memory is a living knowledge base that evolves with each interaction.

## Core Principle: Knowledge Lifecycle

Memory is not a log. It is structured knowledge that must stay current and accurate.

```
New information arrives
       |
  Is it new knowledge?  ──yes──>  ADD to appropriate section
       |
  Does it update existing knowledge?  ──yes──>  UPDATE in place, record change reason
       |
  Does it contradict existing knowledge?  ──yes──>  RESOLVE: replace old with new,
       |                                             add changelog entry explaining why
  Is it routine/generic?  ──yes──>  SKIP (do not pollute memory)
```

### Update Operations

| Operation | When | How |
|-----------|------|-----|
| **Add** | New fact not yet in memory | Write to appropriate section |
| **Update** | Existing fact has changed | Replace old value, add changelog entry |
| **Merge** | Multiple sources provide overlapping info | Consolidate into one coherent entry |
| **Archive** | Information confirmed obsolete | Move to changelog, remove from active section |

**Never silently overwrite.** When updating, always record what changed and why in the changelog section.

## Runtime Directory Structure

```
{data-dir}/                              # .openskill/weekly/ or ~/.openskill/weekly/
  config/
    config.json                          # User config (initialized from built-in defaults)
    openskill.md                         # User directives -- highest priority, overrides all behavior
  memory/
    user.md                              # User identity and preferences
    team-context.md                      # Team knowledge base
    profile/                             # Personal report STE
      spec.md
      template.md
      example.md
    history/
      YYYY-WNN.md                        # Weekly execution records
```

### Initialization

On first run (or when `{data-dir}/config/` is empty), copy built-in defaults:
- `config/config.json` from `skills/weekly/config/config.json`
- `config/openskill.md` from `skills/weekly/config/openskill.md`

### openskill.md

The user's master directive file. Functions like CLAUDE.md does for Claude Code:
- Controls risk detection keywords, priority classification, focus areas
- Can override output preferences (what to highlight, what to de-prioritize)
- Can override skill behavior (skip steps, change word limits, etc.)
- All specs MUST check and respect openskill.md directives before processing

This allows users to customize any processing rule without modifying the shipped skill.

## Memory Files

| File | Type | Update Strategy |
|------|------|----------------|
| `memory/user.md` | Living profile | Add + Update + Merge |
| `memory/team-context.md` | Living knowledge base | Add + Update + Merge + Archive |
| `memory/history/YYYY-WNN.md` | Immutable record | Add only (one file per week) |
| `memory/profile/spec.md` | User-editable | Update by learn-style or user |
| `memory/profile/template.md` | User-editable | Update by learn-style or user |
| `memory/profile/example.md` | User-editable | Update by learn-style or user |

## user.md

### Structure

```markdown
# User Profile

## Identity
- Name: {display name}
- Role: {department and position}
- Email: {email address}
- Created: {first-run date}

## Preferences
- Language: {zh|en|auto}
- Report style: {description or reference to profile/}
- Interaction: {interaction preferences, updated as observed}

## Context
- Reports to: {manager name and email}
- Team size: {approximate number}
- Key focus areas: {comma-separated topics the user cares about most}
- Weekly report audience: {who receives the report}

## Observations
{AI's accumulated understanding of the user. Updated dynamically.}
- {observation with date}

## Changelog
{Track significant changes to this profile.}
- {date}: {what changed and why}
```

### Update Strategy

| Section | Trigger | Operation |
|---------|---------|-----------|
| Identity | User provides new info or corrects existing | Update in place |
| Preferences | User changes config, gives feedback, or demonstrates a new preference | Update in place, add changelog |
| Context | AI infers from reports or user mentions new context | Update in place if more accurate than existing |
| Observations | AI notices a pattern or user states a preference | Add new, update existing if superseded, remove if proven wrong |

**Observations section rules:**
- Each observation should be actionable (affects how AI behaves)
- If a new observation contradicts an old one, replace the old one and note the change in changelog
- Periodically consolidate: if 3 observations say the same thing, merge into 1
- Remove observations that are no longer true

**What qualifies as an observation:**
- User corrections: "user prefers X over Y"
- Workflow patterns: "user always runs full pipeline"
- Content preferences: "user wants risks highlighted prominently"
- Communication context: "user reports to Felix weekly"

**What does NOT qualify:**
- Routine execution logs (goes in history/)
- Generic statements ("user likes reports")
- One-time events with no pattern

## team-context.md

### Structure

```markdown
# Team Context

## Members
| Name | Email | Group | Projects | Last Reported | Notes |
|------|-------|-------|----------|---------------|-------|
| {name} | {email} | {group} | {projects} | {YYYY-WNN} | {observations} |

## Group Structure
- {group name}: {members}, focus on {domain}

## Cross-Week Patterns
- {patterns observed across multiple weeks}

## Changelog
- {date}: {what changed, e.g., "Updated Alice's projects: added auth v3"}
```

### Update Strategy

| Trigger | Operation |
|---------|-----------|
| New person appears in reports | Add member row |
| Person's projects change | Update Projects column, add changelog |
| Person moves to different group | Update Group column, add changelog |
| Person not seen for 4+ weeks | Add note "inactive since WNN", do NOT delete |
| Group restructure detected | Update Group Structure, add changelog |
| Cross-week pattern emerges (2+ weeks) | Add to Cross-Week Patterns |

**Key rule:** Members are never deleted. If someone stops reporting, mark them inactive. They may return.

## history/YYYY-WNN.md

### Structure

```markdown
# Week YYYY-WNN ({date range})

## Execution Record
- Date: {execution date}
- Data source: {Outlook|paste|file|directory}
- Emails fetched: {count}
- Unique senders: {count}
- Functions executed: {list}

## Outputs
- {list of files generated}

## Key Risks Identified
- {severity}: {risk description}

## Notes
- {notable observations}
```

### Update Strategy

History files are **immutable records**. Once written, they are not modified. If the same week is run again, append a new execution record section (do not overwrite the previous one).

## profile/ (Personal STE)

### Update Strategy

Profile files are updated by:
1. **learn-style function**: when user provides new samples, regenerate all 3 files
2. **User manual edits**: user can directly edit any of the 3 files
3. **AI suggestion**: if AI detects style drift (generated report doesn't match user's edits), suggest re-running learn-style

When learn-style regenerates, it should:
- Compare new analysis with existing spec.md
- Highlight what changed
- Ask user to confirm before overwriting

## Verification Checklist (per AGV standard)

After any memory update, verify:
- [ ] File structure matches the spec
- [ ] Updates are accurate (new info is correct, not hallucinated)
- [ ] Contradictions resolved (old info replaced, changelog entry added)
- [ ] No information pollution (routine logs, generic statements excluded)
- [ ] Changelog entry present for any significant update
- [ ] team-context.md member info consistent with latest reports processed
- [ ] history file not modified (only appended if re-run)
