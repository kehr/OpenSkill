# Analyze Requirements

## Purpose

Inspect a Markdown blog post and produce a style audit report without rewriting. Useful as a pre-flight check before invoking `rewrite`, or as a code-review companion.

## Input

A path to a Markdown blog post (same as rewrite). The user MAY also pre-select a target track to bias the audit; if not, the audit reports against both tracks.

## Processing Rules

1. Parse the frontmatter and body separately. Skip code fences and inline code spans during prose audit.
2. Scan for [forbidden-words.md](forbidden-words.md) matches. For each match, record the line number, the matched phrase, and the forbidden category.
3. Inspect each section heading. Flag `第N章` / `Chapter N` numeric prefixes and over-long titles (more than 12 Chinese characters or 80 ASCII characters).
4. Inspect each paragraph for the unsupported-claim pattern: a sentence containing a strong adjective (deepth/comprehensive/revolutionary/etc) without a numeric or scenario qualifier in the same sentence.
5. Detect metaphor density: count distinct metaphors. If more than one, list each with a line number.
6. If a target track is given, score the post against that track's checklist (each item in the spec is a yes/no check).
7. Severity assignment: `error` for forbidden words and AI watermarks; `warn` for unsupported claims and excessive metaphors; `info` for stylistic suggestions.
8. Do NOT modify the file.

## Output Format

Follow [templates/style-audit.md](../templates/style-audit.md). Reference quality at [examples/style-audit-example.md](../examples/style-audit-example.md).

## Quality Standards

- Every finding cites a line number from the source file.
- Each finding has exactly one severity (error / warn / info).
- The report includes a summary count line at the top: `error: N, warn: N, info: N`.
- The report ends with a "Recommended next step" block: which track best fits, and the top 3 actions before invoking `rewrite`.

## Verification Checklist (per AGV standard)

- [ ] Every finding has a line number
- [ ] Severity is one of error / warn / info
- [ ] Summary count line present and accurate
- [ ] No false positives in code blocks
- [ ] Recommended next step block present with at most 3 actions
- [ ] No findings for content inside fenced code blocks
