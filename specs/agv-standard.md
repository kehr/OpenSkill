# AGV Execution Standard

> Execution discipline for all OpenSkill skills.
> Works with [STE Architecture Standard](ste-standard.md).

## What is AGV

AGV (Analysis, Generate, Verify) defines the three execution phases every skill function step follows. It is a process framework, not a content framework -- content is governed by STE.

```
A (Analysis)    Understand input, plan approach
G (Generate)    Produce output -- MUST have a full STE (Spec + Template + Example)
V (Verify)      Validate output against quality standards
```

AGV is mandatory. No output is presented or saved without completing all three phases.

## Core Principles

1. **AGV defines process phases, STE defines content standards.** They are complementary, not interchangeable.

2. **G (Generate) always requires a full STE.** Every generated output must have:
   - A Spec defining the processing rules
   - A Template defining the output format
   - An Example demonstrating quality

3. **A and V may or may not need their own Spec.** Simple analysis or verification can be done inline. Complex analysis or verification should have a dedicated Spec defining the execution standard.

4. **S (Spec) can serve any phase.** A Spec defines the execution standard for whichever AGV phase needs formal rules:
   - Spec for A: defines what to look for, what edge cases to handle, how to plan
   - Spec for G: defines processing rules, constraints, quality standards (this is the most common)
   - Spec for V: defines verification checklist, acceptance criteria, measurable checks

## Phase Details

### A - Analysis

**Purpose**: understand the input, identify context, plan the approach.

**When does A need its own Spec?**

| Complexity | Spec needed? | Example |
|------------|:---:|---------|
| Simple: read input, check format | No | Read JSON, count emails |
| Medium: apply filtering rules, handle edge cases | Usually in G's Spec | Date format recognition, non-report email filtering |
| Complex: multi-source correlation, historical analysis | Yes, separate Spec | Cross-week trend analysis, team context inference |

**Actions**:
1. Read input data
2. Read memory/context files if relevant
3. Identify edge cases
4. Plan the generation approach

### G - Generate

**Purpose**: produce output. This is the core phase.

**G always requires a full STE:**

```
G phase:
  S (Spec)      -- processing rules, constraints, quality standards
  T (Template)  -- output format skeleton
  E (Example)   -- quality benchmark
```

This is non-negotiable. If G produces content that will be saved or shown to the user, it must have all three STE components.

**Actions**:
1. Follow the Spec's processing rules strictly
2. Use the Template as the output structure
3. Match the Example's quality level
4. Respect language and naming conventions

### V - Verify

**Purpose**: validate the generated output before presenting or saving.

**When does V need its own Spec?**

| Complexity | Spec needed? | Example |
|------------|:---:|---------|
| Simple: check sections present, word count | No, use G's Spec verification checklist | Template section check |
| Medium: cross-reference data, consistency checks | Included in G's Spec | Metrics match source, no fabrication |
| Complex: multi-output correlation, regression checks | Yes, separate Spec | Cross-output consistency, historical comparison |

For most functions, V's rules are defined as a "Verification Checklist" section within G's Spec. A separate V Spec is only needed when verification itself is complex enough to warrant its own formal rules.

**Actions**:
1. Run the Verification Checklist from the Spec
2. Compare output structure against the Template
3. Compare output quality against the Example
4. Check measurable criteria (word count, section count, data accuracy)
5. If any check fails: fix, then re-verify

**If verification fails**: the AI must fix the issue and re-verify. Failed output is never presented or saved.

## AGV in Practice

```
Step: Summarize Person A's weekly report

  A (Analysis) -- no separate Spec needed, rules are in G's Spec
    - Read Person A's email
    - Identify: email is for target week, body has content, Chinese language
    - Plan: extract 4 categories, target ~150 words

  G (Generate) -- governed by full STE:
    - S: specs/summarize-requirements.md (rules 1-7, quality standards)
    - T: templates/individual-summary.md (5 sections)
    - E: examples/individual-summary-example.md (quality benchmark)
    - Output: structured summary with metrics preserved

  V (Verify) -- uses Verification Checklist from G's Spec
    - [x] 5 sections present
    - [x] Word count: 147 (range: 100-200)
    - [x] Metrics preserved verbatim
    - [x] No interpretation added
    - [x] Language matches source
    -> PASS
```

## Step-Level vs Final Verification

**Step-level V**: after each generation step, run that step's Verification Checklist.

**Final V**: after all steps complete, run a cross-cutting verification:
1. All expected output files exist and are non-empty
2. Cross-references between outputs are consistent
3. Memory files updated correctly
4. Present verification summary to user:

```
Verification:
- [x] {file_1}: {N} sections, {N} words, quality OK
- [x] {file_2}: {N} sections, {N} words, quality OK
- [x] Memory updated: {files}
- [x] No inconsistencies found
```

## Task Tracking

Every skill execution MUST use `TodoWrite` to create and maintain a task list:

1. **Before starting**: create tasks for all planned steps
2. **Before each step**: mark the task `in_progress`
3. **After each step**: mark the task `completed` immediately
4. **On failure**: keep the task `in_progress` and add a new task for the fix

This ensures no planned work is silently dropped during multi-step or parallel execution.

## Summary

| Phase | What it does | STE requirement | When needs own Spec |
|-------|-------------|-----------------|-------------------|
| A | Understand input | None | Complex analysis only |
| G | Produce output | Full STE required (S+T+E) | Always (via G's Spec) |
| V | Validate output | Uses G's Spec checklist | Complex verification only |

## Enforcement

- Every skill function step follows A -> G -> V
- G always has a complete STE (Spec + Template + Example)
- V always runs a Verification Checklist (at minimum from G's Spec)
- Failed verification blocks output from being presented or saved
- Final Verification runs after all steps complete
