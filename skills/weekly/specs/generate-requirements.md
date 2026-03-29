# Generate Requirements

## Purpose

Generate the user's own weekly report based on team aggregate data, applying the user's personal STE (Spec + Template + Example).

## Prerequisites

- Team aggregate report must exist (from the aggregate function)
- Personal STE STRONGLY RECOMMENDED in memory (from learn-style function):
  - `{data-dir}/memory/profile/spec.md` -- writing rules
  - `{data-dir}/memory/profile/template.md` -- report structure
  - `{data-dir}/memory/profile/example.md` -- quality benchmark
- If personal STE is missing:
  - Warn the user: "Strong recommendation: provide 2-5 samples of your past weekly reports so I can learn your writing style and build your personal STE (Spec + Template + Example). This ensures the generated report matches your tone, structure, and vocabulary. Run 'learn my style' anytime."
  - Allow the user to proceed with the default template if they choose to skip
  - The default template produces a generic management report that may not match the user's actual style

## Processing Rules

1. Check if personal STE exists at `{data-dir}/memory/profile/`
2. If personal STE exists:
   - Read `profile/spec.md` for writing rules (tone, vocabulary, metrics style, length)
   - Read `profile/template.md` as the output structure (instead of default template)
   - Read `profile/example.md` as the quality benchmark (instead of default example)
3. If personal STE does not exist:
   - Use the default template at [templates/personal-report.md](../templates/personal-report.md)
   - Use the default example at [examples/personal-report-example.md](../examples/personal-report-example.md)
4. Read the team aggregate report as the primary data source
5. Generate a report that:
   - Follows the personal spec's tone, structure, and vocabulary patterns
   - Uses the personal template's section structure exactly
   - Matches the quality level of the personal example
   - Includes the AI's risk insights as the user's own observations
   - Highlights items the user would likely emphasize (based on openskill.md focus areas)
   - Matches the user's preferred report length (from personal spec)
6. Ask the user if they have additional personal items to include (their own accomplishments, meetings, observations not captured in team reports). Incorporate these if provided.
7. Present the draft to the user for review before finalizing

## Output Format

Use `profile/template.md` if exists, otherwise fall back to [templates/personal-report.md](../templates/personal-report.md).

## Quality Standards

- Match the user's writing style closely (tone, word choice, structure per personal spec)
- Output language must match the user's preference
- Include at least one forward-looking risk or recommendation
- Do not fabricate data -- only use information from the aggregate report
- Total length should match the user's historical report length (from personal spec)

## Verification Checklist (per AGV standard)

After generating the personal report, verify:
- [ ] All sections from personal template present (or default template if no personal STE)
- [ ] Writing style matches personal spec (tone, vocabulary, structure)
- [ ] Report length matches user's historical range
- [ ] Quality comparable to personal example (or default example)
- [ ] All data traces back to the aggregate report (no fabricated content)
- [ ] At least one forward-looking risk or recommendation included
- [ ] Language matches user's preference
- [ ] User's additional personal items (if provided) incorporated
- [ ] Output file written with correct language-appropriate filename
- [ ] Memory history file updated
