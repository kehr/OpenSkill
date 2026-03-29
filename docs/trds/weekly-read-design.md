# Weekly Skill: read Function Design

> Date: 2026-03-29
> Status: Draft

## 1. Overview

`read` is a new function for the weekly skill that transforms team weekly reports from "organized by person" into "organized by topic". It enables managers to quickly scan all team activity across their focus areas without reading 24 individual reports sequentially.

## 2. Input

### Input source priority

1. Read from `{output-dir}/YYYY-WNN/individuals/*.md` (already-generated summaries)
2. If summaries don't exist, auto-trigger summarize function first, then read

### Topic dimensions: two-layer model

Dimensions come from two sources. Fixed dimensions are always present; emergent dimensions are discovered by AI from the content.

**Layer 1: Fixed dimensions (from openskill.md + built-in)**

Always present. User can edit in openskill.md.

- Business delivery (业务交付)
- Quality infrastructure (质量基建)
- Technical risks (技术风险)
- Risk items (reported + AI-inferred, per openskill.md Risk Detection rules)
- Cross-team dependencies
- Recruitment (招聘)

**Layer 2: Emergent dimensions (AI-discovered)**

AI scans all content items and identifies recurring topics that don't fit into Layer 1. A topic becomes an emergent dimension when it appears in 3+ people's reports (or 5+ content items).

Examples of emergent dimensions that might be discovered:
- "动态化改造" (if Person G, H, I all report on it)
- "DongCover/R2接入" (if Person A, B, C, D all mention it)
- "引凤项目" (if Person E, F both report on it)

**Discovery rules:**
- Scan all content items for topic patterns (project names, technology terms, initiative names)
- Group by semantic similarity (not string matching -- "dongcover接入" and "R2回放" are the same topic)
- Threshold: 3+ people OR 5+ items -> becomes a dimension
- Name the dimension using the most common term from the items
- Do not create emergent dimensions that overlap with fixed dimensions

**Layer 3: User runtime filter**

User can specify in their message:
- Add: "also look at AI" -> adds "AI & 智能化" as an extra dimension
- Filter: "only show risks" -> show only risk-related dimensions
- Focus: "focus on 资损" -> show one dimension in detail

## 3. Processing

### AGV Cycle

**A (Analysis):**
1. Read all individual summary files from `individuals/`
2. Read `openskill.md` for fixed dimensions and risk rules
3. Parse user message for runtime filters
4. Decompose each summary into independent content items
5. **First pass: topic discovery** -- scan all items, identify candidate emergent dimensions (3+ people or 5+ items threshold)

**G (Generate):**
1. Merge fixed dimensions + confirmed emergent dimensions into the final dimension list
2. Classify each content item into one or more dimensions
3. Within each dimension, order by severity/importance (reported risks first, then AI-inferred, then progress, then plans)
4. Generate "其他" section for items that don't fit any dimension
5. Generate "风险 TOP5" section across all dimensions (using two-tier risk model)
6. Generate summary statistics (items per dimension, emergent dimensions discovered)

**Risk severity judgment (AI semantic understanding):**

AI determines risk severity based on contextual analysis, NOT keyword matching. Consider these dimensions:

| Dimension | High | Medium | Low |
|-----------|------|--------|-----|
| Impact scope | Customer-facing, revenue, data loss | Internal workflow, efficiency | Nice-to-have, cosmetic |
| Urgency | This week deadline, already happening | Approaching deadline (2-4 weeks) | No time pressure |
| Mitigation | No plan, or plan uncertain | Plan exists but unverified | Plan in place, progressing |
| Recurrence | Repeated pattern, systemic | First occurrence | One-off, unlikely to repeat |
| Blast radius | Multiple teams, systems, users | Single team or system | Single feature or component |

AI should weigh all dimensions holistically. A single "High" dimension doesn't automatically make the risk High -- but a "customer-facing impact with no mitigation" is unambiguously High.

`openskill.md` provides the user's priorities and focus areas as additional context for judgment, but is not a rigid scoring formula.

**V (Verify):**
1. Every content item from source files appears in at least one dimension (no data loss)
2. Risk TOP5 items are the highest severity based on multi-dimensional judgment
3. Statistics match actual content counts
4. Risk severity is justified (not just keyword-matched)

## 4. Output

### File naming

| zh | en |
|----|----|
| `智能阅读.md` | `smart-read.md` |

### Display

Show content in chat first, then save to file at `{output-dir}/YYYY-WNN/`.

### Output structure: Dimension -> Topic -> Person

Three-layer hierarchy: dimensions group topics, topics group related work across people.

```markdown
# 智能阅读: YYYY-WNN ({date range})

> {N} people, {M} items, {K} dimensions ({J} fixed + {L} emergent)

## [{Fixed Dimension 1}]

### {Topic A}
- {Person 1}: {content with metrics}
- {Person 2}: {content with metrics}
- {Person 3}: {content with metrics}

### {Topic B}
- {Person 4}: {content with metrics}

### {Topic C} [High]
- {Person 5}: {risk description}

## [{Fixed Dimension 2}]

### {Topic D}
- {Person 1}: {content}
- {Person 6}: {content}

### {Topic E} (emergent)
- {Person 7}: {content}
- {Person 8}: {content} [Medium]

## [{Fixed Dimension 3}]
...

## [其他]
{items not fitting any dimension, grouped by topic}

## 风险 TOP5
1. [High] {risk description} -- {person}
2. [High] {risk description} -- {person}
3. [Medium] {risk description} -- {person} [AI推断]
4. [Medium] {risk description} -- {person}
5. [Medium] {risk description} -- {person}

## 统计
- Items: {N} across {K} dimensions
- People: {N}/{total} covered
- Emergent dimensions discovered: {list}
```

## 5. STE Requirements

| Component | File | Purpose |
|-----------|------|---------|
| Spec | `specs/read-requirements.md` | Processing rules, classification logic |
| Template | `templates/smart-read.md` | Output structure skeleton |
| Example | `examples/smart-read-example.md` | Quality reference |

## 6. SKILL.md Integration

New function:

```
## Function: read

1. Check if individuals/ exist for target week. If not, auto-trigger summarize.
2. Read openskill.md for default dimensions + user message for overrides
3. Follow specs/read-requirements.md for processing rules
4. Use templates/smart-read.md format
5. Reference examples/smart-read-example.md for quality
6. Display in chat + write to {output-dir}/YYYY-WNN/ (language-appropriate name)
```

Commands table addition:

```
| **read** | Smart reading: reorganize reports by topic |
```
