---
name: htmlslides
description: Use when the user wants to generate a presentation deck from a natural-language prompt as a single self-contained HTML file (full-screen viewport-locked slides with keyboard navigation), with optional PDF export via the user's system Chrome. Triggers on phrases like "做一个 PPT", "生成幻灯片", "做个 pitch deck", "deck slides", "我要做演示", "presentation deck", "html slides", or invocation of /htmlslides.
allowed-tools: Read, Write, Edit, Bash, AskUserQuestion
---

# htmlslides

Generate a single-file HTML presentation deck from a natural-language prompt. The output is one `.html` file with all CSS, JS, and fonts inlined -- full-screen viewport-locked slides, keyboard / wheel / touch navigation, scroll-snap pagination. Optional PDF export via `puppeteer-core` driving the user's system Chrome (no Chromium download).

## Commands

| Command | Description |
|---------|-------------|
| **generate** | Generate a new HTML deck from a prompt (interactive content + style discovery) |
| **export-pdf** | Export an existing HTML deck to PDF via system Chrome |
| **help** | Show usage and current preset summary |

## Standards

This skill follows the OpenSkill architecture standards:
- [AGV Execution Standard](../../specs/agv-standard.md) -- every step follows Analysis -> Generate -> Verify
- [STE Architecture Standard](../../specs/ste-standard.md) -- every output has Spec + Template + Example

Every function step that produces output MUST complete the full AGV cycle. Verification is mandatory.

## Interaction Rules

All user-facing choices MUST use `AskUserQuestion` with predefined options. Never present choices as free text.

## Task Tracking

On every invocation, use `TodoWrite` to create the task list before starting work. Mark each task `in_progress` when starting and `completed` immediately after finishing.

Example for `generate`:

```
1. [pending] Phase 0: Detect mode (new / enhance / pptx-reject)
2. [pending] Phase 1: Content Discovery (purpose, length, readiness, inline-editing)
3. [pending] Phase 2: Style Discovery (mood -> 3 preset previews -> selection)
4. [pending] Phase 3: Generate single HTML file
5. [pending] Phase 4: PDF Export (optional, ask user)
6. [pending] Phase 5: Delivery (cleanup, open file, print hints)
```

## Initialization

On every invocation:

1. Read [specs/style-presets.md](specs/style-presets.md) once. The 5 presets and their `:root` blocks are referenced repeatedly across phases.
2. Read [specs/forbidden-patterns.md](specs/forbidden-patterns.md) once. The anti-AI-slop rules apply in Phase 3 (Generate) and Phase 3-V (Verify).
3. Locate the original user prompt (the text that triggered this skill). Keep it in working memory for Phase 1 prefill.

## Function: generate

### Phase 0: Detect mode

**A (Analysis):** inspect the user prompt for signals.

- If the prompt mentions an existing `.pptx` file, respond: "PPTX reverse-import is not yet supported in v1. For now, this skill generates new HTML decks from prompts. Want to describe what the deck should cover?" and ask for permission to proceed as a new generation.
- If the prompt mentions an existing `.html` file to enhance (e.g. "make this prettier", "add 3 more slides to deck.html"), set mode to `enhance` (out of v1 scope -- politely defer; v1 always generates fresh).
- Otherwise set mode to `new` and continue to Phase 1.

**G (Generate):** the mode label and any rejection message.

**V (Verify):** mode is one of `new`, `enhance-deferred`, `pptx-rejected`. If not `new`, halt.

### Phase 1: Content Discovery

**A (Analysis):** Read [specs/content-discovery-requirements.md](specs/content-discovery-requirements.md). Re-read the user prompt to prefill any answers it implies.

**G (Generate):** Issue exactly one `AskUserQuestion` call bundling all four questions:

1. What's the deck for? (Pitch / Teaching / Conference talk / Internal update)
2. How long? (5-10 slides / 10-20 slides / 20+ slides)
3. Content readiness? (All ready / Rough notes / Topic only)
4. Inline editing in final HTML? (Yes / No)

Store the four answers as the content state for later phases.

**V (Verify):** run the checklist in [specs/content-discovery-requirements.md](specs/content-discovery-requirements.md). All four answers must be non-null. If any answer is "Other" with no follow-up, ask the follow-up before continuing.

### Phase 2: Style Discovery

**A (Analysis):** Read [specs/style-discovery-requirements.md](specs/style-discovery-requirements.md). Use the Phase 1 content state to pick a working deck title (extract from prompt, or generate a reasonable one).

**G (Generate):**

1. `AskUserQuestion` for vibe (multiSelect=true, up to 2): Bold & confident / Calm & editorial / Minimal & professional / Technical & playful.
2. Map mood(s) to 3 preset candidates per the table in [specs/style-discovery-requirements.md](specs/style-discovery-requirements.md).
3. For each chosen preset, render a single-slide preview HTML to `.claude-design/slide-previews/style-{a,b,c}.html` using [templates/preview-template.html.hbs](templates/preview-template.html.hbs) as the skeleton. Substitute the preset name, the `:root` block, signature CSS, and the deck title.
4. Open all three preview files in the user's browser. Use platform-appropriate command via Bash:
   - macOS: `open file1.html file2.html file3.html`
   - Linux: `xdg-open file1.html` (one at a time, or via `&`)
   - Windows: `start file1.html`
5. `AskUserQuestion`: "Pick a preview, or mix elements?" with options Preview A / Preview B / Preview C / Mix elements.
6. If user picked Mix, ask follow-up free-text question and store as `style_mix_notes`.

**V (Verify):** All three preview HTML files exist on disk before the second AskUserQuestion fires. Each contains a `<!-- Preview: <preset name> -->` HTML comment in its first 200 chars. User selection captured.

### Phase 3: Generate

**A (Analysis):** Read [templates/html-template.md](templates/html-template.md), [templates/viewport-base.css](templates/viewport-base.css), [templates/animation-patterns.md](templates/animation-patterns.md), the chosen preset's `:root` + signature elements from [specs/style-presets.md](specs/style-presets.md), and [specs/forbidden-patterns.md](specs/forbidden-patterns.md).

If `readiness = topic_only`, do light research first (use available web tools, or fall back to reasonable general knowledge with caveats).

**G (Generate):** STE = [specs/generate-requirements.md](specs/generate-requirements.md) + [templates/html-template.md](templates/html-template.md) + [examples/minimal-deck.html](examples/minimal-deck.html) and [examples/pitch-deck.html](examples/pitch-deck.html).

1. Determine output filename: `<slug>.html` where slug = lowercase-hyphenated ASCII deck title (<= 60 chars).
2. Build the HTML in the order specified in [specs/generate-requirements.md](specs/generate-requirements.md) Processing Rule 2.
3. Inline `viewport-base.css` verbatim into the `<style>` block (sentinel comment `/* viewport-base.css */` must be present).
4. Inline the chosen preset's `:root` block.
5. Inline signature element CSS for the preset (from the preset's Signature elements list).
6. Pick reveal classes per mood from [templates/animation-patterns.md](templates/animation-patterns.md).
7. Generate one `<section class="slide">` per slide, choosing a layout class per slide:
   - `slide-title`, `slide-bullets`, `slide-two-column`, `slide-feature-grid`, `slide-quote`, `slide-code`, `slide-image`.
8. Respect density caps strictly (Phase 3 Processing Rule 3 of [specs/generate-requirements.md](specs/generate-requirements.md)).
9. Inline the `SlidePresentation` JS class from [templates/html-template.md](templates/html-template.md) into the final `<script>`.
10. If `inline_editing = true`, also append the edit-mode toggle JS.
11. Write the HTML to disk. DO NOT auto-open here -- Phase 5 handles that.

**V (Verify):** run the full Verification Checklist from [specs/generate-requirements.md](specs/generate-requirements.md) AND the checks in [specs/forbidden-patterns.md](specs/forbidden-patterns.md). Use Bash + grep:

- `grep -c '<section class="slide' <output.html>` should match the expected slide count for the length_bucket. (Note: use `<section class="slide` -- a plain `class="slide` substring also matches `class="slide-number"` decoration elements.)
- `grep '/* viewport-base.css */' <output.html>` should match once.
- `grep -Ei 'font-family:\s*"?(Inter|Roboto|Arial)' <output.html>` should return 0 matches.
- `grep -i '#6366f1' <output.html>` should return 0 matches.
- `grep -F 'calc(-1 * clamp(' <output.html>` should return 0 matches.
- `sed '/:root\s*{/,/^}/d' <output.html> | grep -E '#[0-9a-fA-F]{3,8}' | wc -l` should be 0 (no hex outside :root).
- If `inline_editing = true`: `grep -c 'contenteditable' <output.html>` > 0. Else: == 0.

If any check fails, fix the HTML and re-verify. Failed output is never delivered.

### Phase 4: PDF Export (optional)

Ask the user: "Also export to PDF?" via AskUserQuestion (Yes / No / Yes with --compact 720p).

If Yes:

**A (Analysis):** Read [specs/pdf-export-requirements.md](specs/pdf-export-requirements.md).

**G (Generate):**

```bash
bash skills/htmlslides/scripts/export-pdf.sh <output.html> <output.pdf> [--compact]
```

**V (Verify):**

- Script exit code is 0.
- Stderr log shows `Using Chrome:` line.
- Output PDF exists, size > 50KB.
- Visual spot-check via `open <output.pdf>` (macOS).

If the script exits 2 (no Chrome found), report the two recovery paths to the user verbatim. The deck HTML is still usable; PDF export can be retried later.

### Phase 5: Delivery

**A (Analysis):** Confirm the HTML and (optional) PDF exist on disk.

**G (Generate):**

1. Remove `.claude-design/slide-previews/` (cleanup of Phase 2 ephemeral previews):
   ```bash
   rm -rf .claude-design/slide-previews/
   ```
2. Open the final HTML in the user's browser:
   - macOS: `open <output.html>`
   - Linux: `xdg-open <output.html>`
   - Windows: `start <output.html>`
3. Print operation hints to the user (plain text, no embellishment):

```
Deck delivered: <output.html>
  Navigation:  Arrow / Space / Page keys, or click the nav dots on the right
  Re-generate: invoke /htmlslides again with a new prompt
  Export PDF:  bash skills/htmlslides/scripts/export-pdf.sh <output.html>
  Zero-dep PDF fallback:  Cmd+P (macOS) / Ctrl+P (Linux/Windows) -> Save as PDF
```

**V (Verify):**

- `.claude-design/slide-previews/` no longer exists (or never existed).
- The final HTML opened successfully (no command error).
- The operation hints message was shown to the user.

## Function: export-pdf

Use when the user already has an HTML deck and just wants the PDF.

**A (Analysis):** Locate the input HTML. If the user did not name one, ask via `AskUserQuestion` with candidates from the current working directory's `*.html`. Read [specs/pdf-export-requirements.md](specs/pdf-export-requirements.md).

**G (Generate):** run `bash skills/htmlslides/scripts/export-pdf.sh <input.html> [<output.pdf>] [--compact]`.

**V (Verify):** same checklist as Phase 4 above.

## Function: help

Display:

- A 1-line description of what the skill does.
- The 3 functions: `generate`, `export-pdf`, `help`.
- The 5 visual presets with mood tags (Bold Signal / Notebook Tabs / Swiss Modern / Terminal Green / Pastel Geometry).
- Pointer to [references/help.md](references/help.md) for detailed command reference and troubleshooting.

## Memory Management

This skill does not maintain persistent memory across invocations. All state lives in the working memory of a single run.

## Error Handling

| Scenario | Action |
|----------|--------|
| User prompt is empty / nonsense | Ask for the deck topic before any phase. |
| User wants `.pptx` reverse import | Decline (out of v1 scope), offer to generate fresh instead. |
| User has no Chrome at all | Phase 4 fails fast with both recovery paths. HTML is still delivered. |
| Phase 3 Verify finds forbidden patterns | Fix the HTML in-place, re-verify. Do not deliver contaminated output. |
| Browser-open command fails in Phase 5 | Print the file path and tell the user to open it manually. |
| User's `.claude-design/slide-previews/` cannot be removed (permissions) | Report and continue; do not abort delivery. |

## File Index

| Category | File | Purpose |
|----------|------|---------|
| Spec | [specs/content-discovery-requirements.md](specs/content-discovery-requirements.md) | Phase 1 four-question contract |
| Spec | [specs/style-discovery-requirements.md](specs/style-discovery-requirements.md) | Phase 2 mood -> preset mapping, preview rendering |
| Spec | [specs/generate-requirements.md](specs/generate-requirements.md) | Phase 3 HTML output rules + Verify checklist |
| Spec | [specs/pdf-export-requirements.md](specs/pdf-export-requirements.md) | Phase 4 PDF export script contract |
| Spec | [specs/style-presets.md](specs/style-presets.md) | 5 visual presets (color + font + signature) |
| Spec | [specs/forbidden-patterns.md](specs/forbidden-patterns.md) | Anti-AI-slop grep rules |
| Template | [templates/html-template.md](templates/html-template.md) | HTML skeleton + SlidePresentation JS class |
| Template | [templates/viewport-base.css](templates/viewport-base.css) | Locked-in CSS invariants (inlined verbatim) |
| Template | [templates/animation-patterns.md](templates/animation-patterns.md) | Mood -> animation map + CSS snippets |
| Template | [templates/preview-template.html.hbs](templates/preview-template.html.hbs) | Phase 2 single-slide preview Handlebars template |
| Example | [examples/minimal-deck.html](examples/minimal-deck.html) | 5-slide Notebook Tabs deck (quality reference) |
| Example | [examples/pitch-deck.html](examples/pitch-deck.html) | 10-slide Bold Signal deck (quality reference) |
| Script | [scripts/export-pdf.sh](scripts/export-pdf.sh) | Bash entry: probe Chrome, invoke mjs in tmp dir |
| Script | [scripts/export-pdf.mjs](scripts/export-pdf.mjs) | Node ESM worker: puppeteer-core, screenshot + @page stitch |
| Reference | [references/help.md](references/help.md) | Detailed command reference and troubleshooting |
