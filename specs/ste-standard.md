# STE Architecture Standard

> Content architecture for all OpenSkill skills.

## What is STE

STE (Specs, Templates, Examples) is the content architecture that defines WHAT a skill produces and to what quality standard.

```
S (Specs)      -- the rules: what to do, how to process, what constraints apply
T (Templates)  -- the format: what the output structure looks like
E (Examples)   -- the benchmark: what good output looks like in practice
```

Every skill function that produces output MUST have a complete STE triad.

## S - Specs

Processing rules, constraints, edge case handling, quality standards, and verification checklists.

**Location**: `skills/{name}/specs/{function}-requirements.md`

**Required sections**:

| Section | Purpose |
|---------|---------|
| Purpose | One sentence: what this function does |
| Input | What data the function receives, in what format |
| Processing Rules | Numbered rules the AI must follow, in order |
| Output Format | Reference to the corresponding template file |
| Quality Standards | Measurable criteria for acceptable output |
| Verification Checklist | Concrete checks to run after generation (required by AGV) |

**Principles**:
- The spec is the single source of truth for function behavior
- SKILL.md references specs but never duplicates their content
- Processing rules are ordered -- the AI follows them sequentially
- Quality standards must be measurable (word count ranges, section counts, presence checks), not vague ("good quality")

## T - Templates

Structural definitions for output format. Skeleton files with section headings and placeholder content.

**Location**: `skills/{name}/templates/{output-type}.md`

**Contents**:
- Section headings in the correct order
- Placeholder text showing what goes in each section (e.g., `[Achievement with specific metrics]`)
- Metadata fields (author, date, email, etc.)

**Principles**:
- A template is a structural contract -- the AI fills in content, the structure is fixed
- If the user's style requires a different structure, the custom version is stored in memory (e.g., `style-profile.md`), not by modifying the shipped template
- Templates contain no processing logic -- that belongs in specs

## E - Examples

Reference outputs demonstrating the expected quality level.

**Location**: `skills/{name}/examples/{output-type}-example.md`

**Contents**:
- A complete, realistic output following the template structure
- Demonstrates proper metrics usage, tone, and detail level
- Shows how edge cases are handled (ambiguity notes, missing data)

**Principles**:
- Examples are the quality benchmark for the Verify phase of AGV
- Examples are output demonstrations and feature showcases, not good/bad classifications
- Each example must follow its template's structure exactly
- Examples use realistic data, not lorem ipsum

## STE Triad Relationship

```
Spec (S)                    Template (T)                  Example (E)
"What are the rules?"       "What's the format?"          "What does good look like?"
        |                          |                             |
        v                          v                             v
  Processing rules           Output skeleton              Quality reference
  Quality standards          Section headings              Realistic content
  Verification checks        Metadata fields               Edge case handling
```

### STE and AGV

STE is a content architecture. AGV is a process framework. They work together:

- **G (Generate) phase always requires a full STE.** Every generated output must have a Spec, Template, and Example.
- **S (Spec) can also define standards for A (Analysis) or V (Verify)** when those phases are complex enough to need formal rules.
- A simple A or V phase can operate without its own Spec, relying on the G phase's Spec (which includes a Verification Checklist section for V).

```
AGV process:
  A (Analysis)   -- optionally governed by a Spec (for complex analysis)
  G (Generate)   -- ALWAYS governed by full STE (Spec + Template + Example)
  V (Verify)     -- uses G's Spec verification checklist, or own Spec if complex
```

See [AGV Execution Standard](agv-standard.md) for the full process definition.

## STE Coverage Rules

| Function type | Spec required | Template required | Example required |
|---------------|:---:|:---:|:---:|
| Produces file output (summary, report, aggregate) | Yes | Yes | Yes |
| Produces memory output (style-profile, team-context) | Yes | Optional (output format in spec) | Optional |
| Interactive only (configure) | Optional | No | No |

## STE Quality Checklist

When creating or reviewing a skill's STE files:

- [ ] Every output-producing function has a spec, template, and example
- [ ] Spec processing rules are numbered and ordered
- [ ] Spec quality standards are measurable (not vague)
- [ ] Spec includes a Verification Checklist section
- [ ] Template sections match what the spec requires
- [ ] Example follows the template structure exactly
- [ ] Example demonstrates realistic content at the expected quality level
- [ ] Cross-references between files are correct (spec -> template -> example links)
