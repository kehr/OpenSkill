# Rewrite Requirements

## Purpose

Rewrite a Markdown blog post into a target engineering-blog voice while preserving all factual / technical content.

## Input

A path to a Markdown file under `_posts/` or `_drafts/` (Jekyll convention) or any standalone `.md` file. The file has a YAML frontmatter block delimited by `---` lines and a Markdown body.

The user has selected one of two style tracks: `anthropic`, `openai-research`.

## Processing Rules

1. Preserve frontmatter `date`, `categories`, `tags` verbatim. `title` and `description` MAY change if the chosen track's spec requires it.
2. Preserve every code fence (```...```) and inline code span (`...`) verbatim. Forbidden vocabulary inside code is allowed.
3. Preserve every external link target (URL) and every image reference. Anchor text MAY change.
4. Preserve every numerical figure, date, percentage, version number, framework name, and proper noun. Do not invent benchmarks or specifications that the original did not contain.
5. Apply the chosen track's spec sequentially. Each track spec defines opening, headings, paragraph density, caveat handling, and closing.
6. Apply [forbidden-words.md](forbidden-words.md). Each match outside of code blocks must be either replaced with concrete content or deleted; never softened with synonyms from the same forbidden category.
7. Every capability claim must end with either (a) a specific number or measurement or (b) a caveat naming a scenario where the claim does not hold. Claims with neither must be rephrased as observations.
8. Maximum one core metaphor per post. If multiple metaphors exist, keep the most central one and delete the others. The kept metaphor must appear in at least two distinct sections.
9. Section headings must follow the chosen track. No `第N章` / `第N部分` / `Chapter N` / `Part N` numeric prefixes.
10. No emoji anywhere in the body.
11. No `---` horizontal rule separators in the body. The frontmatter delimiter is the only allowed `---`.
12. No AI / Claude / Anthropic / OpenAI / generated-by watermark in the body or in any commit message produced as a side effect.
13. ASCII-only punctuation in body prose. Unicode arrows (`→`, `⟶`, `↦`, `⇒`, `⇨`, `➔`, `➡`, `←`, `⇐`, `⇔`, `⇄`, `↔`) and the horizontal ellipsis `…` are forbidden — replace with `->`, `=>`, `<-`, `<=`, `<->`, `...` per [forbidden-words.md](forbidden-words.md). Inside fenced code blocks and inline code spans they are allowed verbatim.

## Output Format

Write the rewritten content back to the original file path, OR to `<slug>.optimized.md` if the user opted for side-by-side. Use [templates/post-anthropic.md](../templates/post-anthropic.md) or [templates/post-openai-research.md](../templates/post-openai-research.md) according to track.

## Quality Standards

- Body byte count is 70-95% of the original byte count. If outside this range, justify in the diff summary.
- Every retained capability claim has a number OR a caveat (rule 7).
- Forbidden-word match count after rewrite is zero outside code blocks.
- Section heading count change is within +/- 30% of the original.
- Every paragraph in the rewritten body is at most 6 sentences. If longer, split.
- Frontmatter passes YAML parse (no malformed colons, indentation consistent).

## Verification Checklist (per AGV standard)

After rewriting, verify:

- [ ] Frontmatter `date`, `categories`, `tags` unchanged
- [ ] Every code fence preserved verbatim (compare diff: code blocks are untouched)
- [ ] Every URL preserved
- [ ] Every numerical figure preserved (grep both versions for `\d+%`, `\d+x`, dates, version numbers)
- [ ] Forbidden-word scan returns zero matches outside code blocks
- [ ] Each capability claim has a number or caveat
- [ ] Maximum one core metaphor, used in 2+ sections
- [ ] No `第N章` / `Chapter N` style numeric heading prefix
- [ ] No emoji
- [ ] No `---` separators in body (frontmatter only)
- [ ] No AI / Claude / Anthropic / OpenAI watermark
- [ ] No Unicode arrows (`→`, `⇒`, `↔`, etc.) or horizontal ellipsis (`…`) in body prose; ASCII equivalents only
- [ ] Body byte count is 70-95% of original (or justified)
- [ ] No paragraph longer than 6 sentences
- [ ] YAML frontmatter parses
