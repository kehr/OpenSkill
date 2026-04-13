# Learn Style Requirements

## Purpose

Analyze the user's historical weekly reports to extract their personal writing style, then produce a complete personal STE (Spec + Template + Example) for future report generation.

## Input

User provides one or more of:
- Screenshots of past weekly reports
- Markdown or plain text of past reports
- Pasted content in the chat
- Email sender address to search Outlook for historical reports

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
3. Present the analysis to the user for confirmation before saving

## Output Format

Learn-style produces a **complete personal STE triad**, not just a style description:

```
{data-dir}/memory/profile/
  spec.md           # S: personal report generation rules (writing style, tone, constraints)
  template.md       # T: personal report structure skeleton (extracted from samples)
  example.md        # E: one representative sample chosen as quality benchmark
```

### S - spec.md

The personal report spec. Defines:
- Tone rules (how to write)
- Vocabulary patterns (what words/phrases to use)
- Metrics style (how to present numbers)
- Length constraints (target word count)
- Language preference
- Content rules (what to include/exclude, how to handle risk items)

### T - template.md

The personal report template. A structural skeleton extracted from the user's samples:
- Exact section headings in the user's preferred order
- Placeholder text showing what goes in each section
- Opening/closing patterns (e.g., greeting format, signature)
- Risk marker style (how the author marks risk levels in their reports)

### E - example.md

One of the user's actual samples, chosen as the quality benchmark:
- Select the most representative sample (best demonstrates the user's typical style)
- Keep it verbatim (do not edit)
- This is what the AI compares against during verification

## Quality Standards

- Must be based on actual patterns, not assumptions
- Present analysis to user for confirmation
- If fewer than 2 samples provided, warn that the profile may be unreliable
- All three STE files must be human-readable and editable
- The template must be extracted from actual samples, not invented

## Verification Checklist (per AGV standard)

After generating the personal STE, verify:
- [ ] spec.md: all 6 analysis dimensions present (Tone, Structure, Vocabulary, Metrics Style, Length, Language)
- [ ] spec.md: each dimension references specific patterns from actual samples
- [ ] template.md: section structure matches the user's actual report structure
- [ ] template.md: opening/closing patterns match the user's style
- [ ] template.md: risk marker style matches (if used)
- [ ] example.md: is a verbatim copy of one representative sample
- [ ] All three files written to {data-dir}/memory/profile/
- [ ] User confirmed the analysis before saving
