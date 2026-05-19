# Generate Requirements (Phase 3)

## Purpose

Produce the final single-file HTML deck given the Phase 1 content parameters and the Phase 2 chosen preset. The output is one `.html` file with all CSS, JS, fonts, and (where applicable) image data inlined -- portable, shareable, and immediately viewable in any modern browser.

## Input

- Phase 1 memory state (purpose, length_bucket, readiness, inline_editing).
- Phase 2 memory state (preset_selected, style_mix_notes).
- Original user prompt (for content extraction).
- `templates/html-template.md` (HTML skeleton reference).
- `templates/viewport-base.css` (locked-in invariants).
- `templates/animation-patterns.md` (feeling -> animation map).
- `specs/style-presets.md` (preset definitions, for the chosen preset's `:root` + signature elements).
- `specs/forbidden-patterns.md` (anti-AI-slop rules).

## Processing Rules

1. **Determine output filename**: `<slug>.html` where slug is derived from the deck title (lowercase, hyphens, ASCII only, <= 60 chars). If the user provided no title, fall back to `deck.html`.

2. **Build the HTML in the order**:
   1. `<!DOCTYPE html>` + `<html lang="...">` (detect language from prompt -- zh / en / etc.).
   2. `<head>`:
      - `<meta charset="UTF-8">`
      - `<meta name="viewport" content="width=device-width, initial-scale=1">`
      - `<title>` from deck title
      - `<link rel="preconnect">` to font CDN if web fonts used
      - `<style>` containing:
        - The full contents of `templates/viewport-base.css` inlined verbatim
        - The chosen preset's `:root { ... }` block
        - Any preset-specific signature element CSS (e.g. `.tab-strip`, `.scanline`)
        - Animation snippets from `templates/animation-patterns.md` selected per the deck's mood
   3. `<body>`:
      - Progress bar + nav dots scaffolding (`<div class="progress">`, `<nav class="nav-dots" id="nav-dots">`).
      - Presenter overlay DOM: `<div class="blackout" id="blackout" data-mode="off" aria-hidden="true">` AND `<div class="help-overlay" id="help-overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" aria-hidden="true">` with the help-card table listing all shortcuts. These two elements MUST be present even if the deck author thinks they will not be used -- the `SlidePresentation` keyboard handler short-circuits silently when they are missing, which masks broken shortcuts.
      - One `<section class="slide" data-slide="N">` per slide.
      - Each slide uses one of these layout classes: `slide-title` / `slide-bullets` / `slide-two-column` / `slide-feature-grid` / `slide-quote` / `slide-code` / `slide-image`.
   4. `<script>` containing the `SlidePresentation` class from `templates/html-template.md`. The class MUST include the canonical keyboard handler (F fullscreen, 0-9 slide jump, B/W blackout/whiteout, ? help overlay, Esc priority chain, Shift+Space previous) AND its 5 supporting methods (`toggleFullscreen`, `toggleBlackout`, `setBlackout`, `toggleHelp`, `setupHelpDismissOnClick`). If `inline_editing = true`, also include the edit-mode toggle JS.

3. **Density caps** (must not exceed):

   | Layout class | Hard cap |
   |---|---|
   | `slide-title` | 1 `<h1>` + 1 `<p class="subtitle">` |
   | `slide-bullets` | 1 `<h2>` + 4-6 `<li>` |
   | `slide-feature-grid` | up to 6 `<div class="feature-card">` |
   | `slide-quote` | 1 `<blockquote>` + 1 `<cite>` |
   | `slide-code` | <= 30 lines inside `<pre><code>` |
   | `slide-image` | 1 `<img>` + optional 1 caption |

4. **Length conformance**: total `.slide` count must fall within the `length_bucket`:
   - `5-10` -> 5 <= N <= 10
   - `10-20` -> 10 <= N <= 20
   - `20+` -> 20 <= N <= 40 (hard upper cap)

5. **Asset inlining**:
   - Small images (<= 200KB) get base64-inlined into `<img src="data:...">`.
   - Larger images go into a sibling `assets/` folder, referenced relatively.
   - Web fonts: `<link href="https://fonts.googleapis.com/...">` is acceptable; do not embed font binaries.

6. **Forbidden patterns** (from `specs/forbidden-patterns.md`):
   - No `Inter`, `Roboto`, `Arial`, `Helvetica` as first font choice.
   - No `#6366f1` (indigo) or purple-on-white gradient.
   - No bare `calc(-1 * clamp(...))` -- the clamp negation bug.
   - All hex colors must appear ONLY inside the `:root { ... }` block.
   - No emoji unless the user prompt explicitly asks for them.

7. **Inline editing** (only if Phase 1 said yes):
   - Add `contenteditable="true"` to text-bearing elements.
   - Include a JS hover handler with a 400ms timeout (NOT a CSS `~` sibling rule -- the latter breaks with `pointer-events:none`).
   - Include the `exportFile()` JS that strips `contenteditable`, `body.edit-active`, and any toggle classes before reading `document.documentElement.outerHTML`.

8. After writing the HTML file, do NOT auto-open it -- that happens in Phase 5 (Delivery).

## Output Format

A single `.html` file at the path determined in rule 1. Self-contained. No companion CSS / JS files.

## Quality Standards

- File size: typically 30KB - 300KB (a sign something is wrong if much smaller or much larger).
- Number of `<section class="slide">` matches `length_bucket`.
- Contains the full `viewport-base.css` (look for sentinel comment `/* viewport-base.css */`).
- Contains the chosen preset's `:root` block (look for preset name in a comment near the `<style>` top).
- No `<link rel="stylesheet" href="*.css">` referencing external files (only Google Fonts allowed).
- Opens correctly in Chrome / Safari / Firefox without console errors.
- Renders at 1920x1080, 1280x720, 1024x768 without horizontal scroll.

## Verification Checklist

Run these checks after writing the HTML and BEFORE moving to Phase 4 / 5:

- [ ] File exists at the determined path.
- [ ] File size is between 20KB and 500KB.
- [ ] `<section class="slide"` count matches `length_bucket` (verify by counting).
- [ ] `<style>` contains the sentinel comment `/* viewport-base.css */`.
- [ ] `<style>` contains the chosen preset name in a comment.
- [ ] `grep -E '#[0-9a-fA-F]{3,8}'` outside the `:root { ... }` block returns 0 matches.
- [ ] No forbidden font names appear in `font-family` declarations.
- [ ] No `#6366f1` appears anywhere.
- [ ] No `calc(-1 * clamp(` appears (use a CSS variable for the negative width instead).
- [ ] Each layout class respects the density cap from rule 3.
- [ ] If `inline_editing = true`, search for `contenteditable=` -- must be > 0. Otherwise must be 0.
- [ ] Single-file: no external CSS / JS references except Google Fonts.
- [ ] Presenter overlays present: `grep -c 'id="blackout"' <output.html>` == 1 AND `grep -c 'id="help-overlay"' <output.html>` == 1.
- [ ] Canonical keyboard methods present: `grep -c 'toggleFullscreen\|toggleBlackout\|toggleHelp' <output.html>` >= 3.
- [ ] Help overlay's table lists all 8 shortcut categories (Next / Previous / First-Last / Jump / Fullscreen / Blackout-Whiteout / Show help / Close-Exit). Verify by reading the inlined HTML.
- [ ] Print CSS hides overlays: `grep -A1 '@media print' <output.html>` mentions `.blackout` and `.help-overlay` with `display: none`.
