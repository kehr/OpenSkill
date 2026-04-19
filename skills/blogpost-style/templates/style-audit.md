# Style Audit: [file-name.md]

**Track**: [anthropic / openai-research]
**File**: `[absolute or repo-relative path]`
**Audited at**: [YYYY-MM-DD HH:MM]

## Summary

- **Errors**: [N] — must fix
- **Warnings**: [N] — should fix
- **Info**: [N] — consider fixing
- **Verdict**: [PASS / NEEDS-REVISION / FAIL]

[One or two sentences stating the overall impression and the single most important change the author should make.]

## Findings

### Errors

[Empty "(none)" if no errors. Otherwise one finding per bullet.]

- **[Rule ID or short name]** — line [N]: [what is wrong]. Fix: [concrete replacement].
- **[Rule ID]** — section "[heading]": [what is wrong]. Fix: [concrete replacement].

### Warnings

- **[Rule ID]** — line [N]: [what is weak]. Suggestion: [how to strengthen].
- **[Rule ID]** — paragraph starting "[first five words...]": [what is weak]. Suggestion: [how to strengthen].

### Info

- **[Rule ID]** — [what could be improved but is not required for the track].

## Track-specific checks

[Copy the Verification Checklist from the relevant style spec and mark each item.]

- [x] [Check that passed]
- [ ] [Check that failed — one-line reason]
- [x] [Check that passed]

## Forbidden Words

[List every forbidden word found in prose (not in code blocks). If none, say "No forbidden words detected."]

| Word | Line | Category | Suggested replacement |
|---|---|---|---|
| [word] | [N] | [category] | [replacement from forbidden-words.md patterns] |

## Recommended Next Step

[One sentence: either "Run `/blogpost-style rewrite {file} --track {track}` to apply fixes automatically" or "Manual revision required for: {list of rules that need author judgment}".]
