# Read Requirements

## Purpose

Transform individual weekly report summaries from "organized by person" into "organized by topic", using a three-layer hierarchy: Dimension -> Topic -> Person.

## Input

1. Individual summary files from `{output-dir}/YYYY-WNN/individuals/*.md`
2. If not available, auto-trigger summarize function first
3. `openskill.md` for fixed dimensions and risk rules
4. User message for runtime dimension filters

## Dimension Classification

### Two-layer dimension model

**Layer 1: Fixed dimensions**

Always present. Sourced from openskill.md Focus Areas + built-in defaults.

Built-in defaults:
- Business delivery (业务交付): project milestones, feature launches, version releases, customer delivery
- Quality infrastructure (质量基建): automation, testing environment, monitoring, tooling
- Technical risks (技术风险): incidents, faults, degradation, stability issues
- Risk items (风险项): all reported risks + AI-inferred risks (per Risk Classification rules below)
- Cross-team dependencies (跨团队依赖): items involving coordination between teams or external parties
- Recruitment (招聘): hiring, interviewing, onboarding

User can add/modify fixed dimensions in openskill.md Focus Areas section.

**Layer 2: Emergent dimensions**

AI-discovered from content. Rules:

1. Scan all content items for recurring topic patterns (project names, technology terms, initiative names)
2. Group by semantic similarity, not string matching:
   - "dongcover接入" and "R2回放降噪" and "流量回放" are the SAME topic
   - "MBT建模" and "DongTDD" and "测试建模" are the SAME topic
3. Threshold to become a dimension: 3+ different people OR 5+ content items mentioning the topic
4. Name the dimension using the most commonly used term across items
5. Do NOT create emergent dimensions that overlap with fixed dimensions
6. Mark emergent dimensions with `(emergent)` tag in the output

### User runtime override

- "read AI related" -> add "AI & 智能化" as extra dimension or filter to it
- "read only risks" -> show only risk-related content
- "read focus 资损" -> expand one dimension in detail, collapse others

## Topic Clustering

Within each dimension, related content items are grouped into topics.

### Clustering rules

1. A topic is a specific work item, project, or initiative that multiple content items relate to
2. Cluster by semantic relatedness:
   - Same project name -> same topic (e.g., "引凤项目" items from different people)
   - Same technical component -> same topic (e.g., "dongcover" items about onboarding, noise reduction, etc.)
   - Same incident/issue -> same topic (e.g., multiple people mentioning the same fault)
3. Single-item topics are allowed (one person's unique work item)
4. Topic name: use the most descriptive term from the clustered items
5. If a topic has a reported risk, append the severity to the topic heading (e.g., `### {Topic Name} [High]`)

### Within a topic: person entries

Each person's contribution is listed as:
```
- {Person name}: {content with preserved metrics}
```

Order within a topic:
1. Reported risks first (items the author flagged as risky)
2. Completed work
3. In-progress work
4. Plans

## Risk Classification

### Two-tier risk model

**Tier 1: Reported risks (highest priority)**

Risks explicitly stated by the report author. Rules:
- Preserve the author's own severity assessment. Map to standard levels:
  - High: 高风险, 风险, "有...风险", "存在...风险"
  - Medium: 中风险, 预警, "有延期可能"
  - Not a risk: 正常
- Never downgrade a reported risk
- Never reinterpret a reported risk

**Tier 2: AI-inferred risks**

Risks identified by AI from contextual signals not flagged by the author. Rules:
- MUST be labeled with `[AI推断]` in output
- Severity determined by multi-dimensional contextual analysis (see openskill.md Risk Severity Judgment table)
- Signals to look for:
  - Metrics declining without explanation
  - Deadlines approaching with low completion percentage
  - Dependencies mentioned without resolution timeline
  - Items from previous week's plan not mentioned this week
  - Resource concentration (one person owning too many critical items)

### Risk TOP5 selection

1. Collect all risks (reported + AI-inferred) across all dimensions
2. Sort by severity: High first, then Medium
3. Within same severity, prioritize: reported risks before AI-inferred
4. Select top 5
5. Format: `{marker} {description} -- {person name} [AI推断 if inferred]`

## Output Format

Follow the template at [templates/smart-read.md](../templates/smart-read.md).

## Quality Standards

- Every content item from source files appears in at least one dimension (no data loss)
- Metrics preserved verbatim (not paraphrased)
- Reported risks preserve author's original severity
- AI-inferred risks always labeled `[AI推断]`
- Emergent dimensions labeled `(emergent)`
- Topic names are descriptive and specific (not generic like "其他工作")

## Verification Checklist (per AGV standard)

After generating the smart read output, verify:
- [ ] All content items from all individuals/*.md files are accounted for (no data loss)
- [ ] Three-layer structure maintained: every item is under Dimension -> Topic -> Person
- [ ] Fixed dimensions from openskill.md are all present (even if empty, note "本周无相关内容")
- [ ] Emergent dimensions meet the 3+ people OR 5+ items threshold
- [ ] Emergent dimensions do not overlap with fixed dimensions
- [ ] Reported risks preserve author's original severity marker
- [ ] AI-inferred risks are labeled `[AI推断]`
- [ ] Risk TOP5 is correctly ranked (High before Medium, reported before inferred)
- [ ] Metrics are verbatim from source (not rounded or paraphrased)
- [ ] Statistics section numbers match actual content
- [ ] Output file written with correct language-appropriate filename
