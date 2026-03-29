# Weekly read Function Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the `read` function for the weekly skill -- smart reading that reorganizes team reports from per-person to per-topic with three-layer hierarchy (dimension -> topic -> person).

**Architecture:** Content-only implementation (no TypeScript code). Create STE template + example files, update SKILL.md with the new function definition and file index entries. The spec (read-requirements.md) already exists.

**Tech Stack:** Markdown (skill content files)

**Spec reference:** `skills/weekly/specs/read-requirements.md`, `docs/trds/weekly-read-design.md`


## File Structure

```
skills/weekly/
  SKILL.md                                    # Modify: add read function + command table entry
  templates/
    smart-read.md                             # Create: output structure skeleton
  examples/
    smart-read-example.md                     # Create: quality reference with realistic content
```


## Task 1: Create smart-read template

**Files:**
- Create: `skills/weekly/templates/smart-read.md`

- [ ] **Step 1: Create the template file**

```markdown
# 智能阅读: YYYY-WNN ({date range})

> {N} people, {M} items, {K} dimensions ({J} fixed + {L} emergent)

## [{Dimension Name}]

### {Topic Name}
- {Person}: {content with preserved metrics}
- {Person}: {content with preserved metrics}

### {Topic Name} [High]
- {Person}: {risk description}

### {Topic Name} (emergent)
- {Person}: {content}
- {Person}: {content}

## [其他]

### {Topic}
- {Person}: {content}

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

- [ ] **Step 2: Verify file exists**

Run: `ls -la skills/weekly/templates/smart-read.md`
Expected: file exists

- [ ] **Step 3: Commit**

```bash
git add skills/weekly/templates/smart-read.md
git commit -m "feat(weekly): add smart-read template for read function"
```


## Task 2: Create smart-read example

**Files:**
- Create: `skills/weekly/examples/smart-read-example.md`

- [ ] **Step 1: Create the example file**

Write a realistic example using generic team member names (Person A, B, C...) and fictional but realistic quality infrastructure metrics. The example must demonstrate:
- Fixed dimensions with topics and person entries
- At least one emergent dimension marked with `(emergent)`
- Reported risks preserved as-is with severity
- At least one AI-inferred risk labeled `[AI推断]`
- Three-layer structure: dimension -> topic -> person
- Statistics section with accurate counts
- Risk TOP5 section

Use generic names and fictional data. No real business data.

```markdown
# 智能阅读: 2026-W13 (2026-03-24 ~ 2026-03-29)

> 8 people, 42 items, 8 dimensions (6 fixed + 2 emergent)

## [业务交付]

### Project Alpha release
- Person A: Phase 2 testing completed, 95% pass rate, 3 critical bugs fixed
- Person B: API integration with Partner X finished, latency reduced from 200ms to 80ms

### Project Beta migration
- Person C: Database migration 70% complete, estimated finish next Wednesday
- Person D: Legacy API deprecation notice sent to 12 downstream consumers

## [质量基建]

### Automation coverage improvement
- Person A: Test automation coverage increased from 45% to 62%, added 120 new test cases
- Person E: CI pipeline execution time reduced from 25min to 12min through parallelization

### Test environment stability
- Person F: Environment uptime improved to 98.5% (last week 94.2%), resolved 3 infrastructure issues

## [技术风险]

### Production incident review [High]
- Person B: S2 incident on payment gateway, 15min downtime affecting 2K users, root cause: connection pool exhaustion

### Performance degradation [Medium]
- Person C: API response time increased 40% after migration batch 3, investigating index optimization

## [资损防控]

### Risk audit and monitoring
- Person D: Completed 85 risk scenario audits, deployed 12 new monitoring rules
- Person E: Identified 3 new financial risk patterns through automated scanning

## [跨团队依赖]

### Partner X integration blocked
- Person B: Waiting for Partner X sandbox environment upgrade, blocking E2E testing, no ETA provided [High]

### Shared infrastructure upgrade
- Person F: Coordinating with Platform Team on Kubernetes upgrade, testing window scheduled next Tuesday

## [招聘]

### Team hiring
- Person A: Interviewed 3 candidates, 1 offer extended
- Person D: 0 interviews this week, pipeline has 5 pending candidates

## [Performance Testing] (emergent)

### Load testing initiatives
- Person B: Completed Black Friday simulation, system handles 3x current peak
- Person C: Stress testing new migration path, found memory leak at 500 concurrent connections
- Person F: Performance benchmarking tool deployed to staging environment

## [Security Hardening] (emergent)

### Security improvements
- Person E: SAST tool coverage expanded from 3 to 18 applications, found 2 medium vulnerabilities
- Person D: Completed access control audit for 6 core services
- Person A: Security training completed for 15 team members

## [其他]

### Miscellaneous
- Person F: Updated internal documentation for onboarding process

## 风险 TOP5
1. [High] Production incident: payment gateway S2, 15min downtime, 2K users affected -- Person B
2. [High] Partner X sandbox blocked, no ETA, blocking E2E testing -- Person B
3. [Medium] API response time increased 40% after migration batch 3 -- Person C
4. [Medium] Memory leak found at 500 concurrent connections in migration path -- Person C [AI推断]
5. [Medium] Legacy API deprecation affecting 12 downstream consumers -- Person D [AI推断]

## 统计
- Items: 42 across 8 dimensions
- People: 8/8 covered
- Emergent dimensions discovered: Performance Testing, Security Hardening
```

- [ ] **Step 2: Verify file exists**

Run: `ls -la skills/weekly/examples/smart-read-example.md`
Expected: file exists

- [ ] **Step 3: Commit**

```bash
git add skills/weekly/examples/smart-read-example.md
git commit -m "feat(weekly): add smart-read example for read function"
```


## Task 3: Update SKILL.md

**Files:**
- Modify: `skills/weekly/SKILL.md`

- [ ] **Step 1: Add `read` to commands table**

After the `generate` row, add:
```
| **read** | Smart reading: reorganize reports by topic with dimension -> topic -> person hierarchy |
```

- [ ] **Step 2: Add read function definition**

After the `## Function: configure` section (before `## Function: help`), add:

```markdown
## Function: read

1. Check if `{output-dir}/YYYY-WNN/individuals/` exists for target week. If not, auto-trigger summarize first.
2. Read `{data-dir}/config/openskill.md` for fixed dimensions and risk rules
3. Parse user message for runtime dimension filters (add/filter/focus)
4. Follow [specs/read-requirements.md](specs/read-requirements.md) for processing rules
5. Use [templates/smart-read.md](templates/smart-read.md) format
6. Reference [examples/smart-read-example.md](examples/smart-read-example.md) for quality
7. Display in chat + write to `{output-dir}/YYYY-WNN/` (language-appropriate name: `智能阅读.md` or `smart-read.md`)
```

- [ ] **Step 3: Add to File Index table**

Add these rows to the File Index:
```
| Template | [templates/smart-read.md](templates/smart-read.md) | Smart read output format |
| Example | [examples/smart-read-example.md](examples/smart-read-example.md) | Smart read quality reference |
```

- [ ] **Step 4: Add read to action routing options**

Update the action routing AskUserQuestion options:
- zh: add "智能阅读" option
- en: add "Smart read" option

- [ ] **Step 5: Verify lint passes**

Run: `npx tsx src/cli/index.ts lint weekly`
Expected: 11 passed

- [ ] **Step 6: Commit**

```bash
git add skills/weekly/SKILL.md
git commit -m "feat(weekly): add read function to SKILL.md"
```


## Task 4: Rebuild and reinstall

- [ ] **Step 1: Rebuild**

```bash
rm -rf dist/
npx tsx src/cli/index.ts build
```

Expected: Build complete for 2 platforms

- [ ] **Step 2: Reinstall**

```bash
npx tsx src/cli/index.ts install weekly --force
```

Expected: Installed to claude and joycode

- [ ] **Step 3: Verify all tests pass**

```bash
npx vitest run
```

Expected: All tests pass

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(weekly): complete read function implementation"
```


## Task 5: Verification

- [ ] **Step 1: Verify complete file structure**

```bash
find skills/weekly -type f | sort
```

Expected: smart-read.md in templates/ and examples/

- [ ] **Step 2: Check spec coverage**

| Design requirement | Implemented in |
|--------------------|---------------|
| Two-layer dimension model | specs/read-requirements.md |
| Topic clustering rules | specs/read-requirements.md |
| Risk classification (two-tier) | specs/read-requirements.md |
| Output structure (dim -> topic -> person) | templates/smart-read.md |
| Quality reference | examples/smart-read-example.md |
| SKILL.md function definition | SKILL.md |
| File index entries | SKILL.md |
| Action routing | SKILL.md |

- [ ] **Step 3: Verify no sensitive data in any file**

```bash
grep -r "韩威\|侯会斌\|gaoting59\|wangkaixuan" skills/weekly/ --include="*.md" || echo "CLEAN"
```

Expected: CLEAN
