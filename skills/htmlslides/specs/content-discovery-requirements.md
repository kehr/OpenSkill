# Content Discovery Requirements (Phase 1)

## Purpose

Gather the four content parameters needed before any HTML is generated: deck purpose, length, content readiness, and whether to embed an inline editing toggle in the final HTML.

## Input

The original user prompt (free-text natural language). May or may not already specify any of the four parameters.

## Processing Rules

1. Use exactly ONE `AskUserQuestion` call that bundles all four questions together. Do not split into multiple sequential calls.
2. The four questions and their option sets:

| # | Question | Options |
|---|---|---|
| 1 | What's the deck for? | Pitch / Teaching / Conference talk / Internal update |
| 2 | How long? | 5-10 slides / 10-20 slides / 20+ slides |
| 3 | Content readiness? | All ready (I'll paste in) / Rough notes (you flesh out) / Topic only (you research) |
| 4 | Inline editing in final HTML? | Yes (adds contenteditable + JS hover) / No (clean output) |

3. If the user's original prompt already implies any answer (e.g. "make me a 5-slide pitch deck for X"), prefill those options' default selection but still show the question for confirmation.
4. The skill MUST NOT proceed to Phase 2 if any of the four answers is empty or "Other" with no follow-up.
5. Persist the four answers in the working memory of the current run -- they are referenced again in Phase 3 (Generate) for layout density decisions.

## Output Format

In-memory only. No file written.

Structure:

```
{
  "purpose": "pitch" | "teaching" | "conference" | "internal",
  "length_bucket": "5-10" | "10-20" | "20+",
  "readiness": "all_ready" | "rough_notes" | "topic_only",
  "inline_editing": true | false
}
```

## Quality Standards

- All four fields are non-null.
- `length_bucket` is interpreted as a soft cap: 5-10 means produce 5-10 slides, not exactly 5 or exactly 10.
- If `readiness = topic_only` the LLM must perform light research (web search if available, otherwise reasonable general knowledge with caveats) before Phase 3.
- If `readiness = all_ready` the LLM must preserve user-supplied text verbatim where possible.
- If `inline_editing = true` the Phase 3 generated HTML must include the contenteditable scaffold and edit-mode JS toggle described in `templates/html-template.md` section "Inline Editing".

## Verification Checklist

- [ ] AskUserQuestion was called exactly once for this phase.
- [ ] All four answers captured, none empty.
- [ ] If user provided ad-hoc free text in any field, it was normalized to one of the four enum values (or treated as "Other" requiring a follow-up).
- [ ] Decisions are stored in memory and available to Phase 3.
