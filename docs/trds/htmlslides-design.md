# htmlslides skill -- HTML-based PPT Generation

Status: Design (v1)
Author: kehr
Date: 2026-05-19

## 1. Background

OpenSkill currently ships two production skills: `worksummary` (manager weekly aggregation) and `blogpost-style` (engineering-blog voice rewrite). Both are text-only. There is no first-party path from a natural-language prompt to a presentable deck of slides.

This skill closes that gap. Given a one-line prompt like `make me a 5-slide intro deck for OpenSkill`, the skill produces a single self-contained HTML file that renders full-screen in any modern browser, with a separate optional path to export the same HTML to a high-fidelity PDF.

## 2. Goals and Non-Goals

### v1 Goals

- Single-prompt to single-file HTML deck (one `.html`, all CSS / JS / fonts inlined).
- Full-screen browser presentation: viewport-locked slides, keyboard / wheel / touch navigation, scroll-snap pagination.
- 5 visual presets covering distinct moods (deep-color business, light editorial, minimal academic, technical, playful).
- PDF export from the same HTML via puppeteer-core driving the user's system Chrome (no Chromium download).
- Strict OpenSkill conformance: STE triad (specs/templates/examples), AGV (Analysis -> Generate -> Verify) on every function step, `openskill lint` clean.

### v1 Non-Goals (deferred to v2)

- `.pptx` reverse / forward export (pptxgenjs or similar). Reference implementation `zarazhangrui/frontend-slides` issue #71 also unsolved.
- Vercel one-click deploy.
- Inline editing mode (contenteditable + JS hover).
- CJK / Japanese typography hardening (reference issue #47 also unsolved).
- Incremental deck patching ("add one more chart slide to the deck I just made").
- External data source integration (Outlook, JIRA, Linear, ...).

These are listed explicitly so future maintainers know the gaps are intentional, not oversights.

## 3. Reference Prior Art

[github.com/zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides) (`plugins/frontend-slides/skills/frontend-slides/`): ~180-line SKILL.md, 12 visual presets in `STYLE_PRESETS.md`, `viewport-base.css` + `html-template.md` + `animation-patterns.md`, `scripts/export-pdf.sh` using Playwright.

We adopt its core formula -- single-file HTML output, LLM-targeted presets, screenshot-and-stitch PDF -- but adapt three things:

1. Repackage as a native OpenSkill skill (STE + AGV + skill.json render allowlist), not a `.claude-plugin/` package.
2. Replace Playwright with `puppeteer-core` driving the system Chrome (no ~170MB Chromium download). See section 6.
3. Trim the preset count from 12 to 5 for v1, focused on quality per preset over coverage.

## 4. Architecture

### 4.1 Flow

```
prompt (NL)
   |
   v
SKILL.md (Claude executes 6 phases)
   |
   +-- Phase 0  Detect mode             new | enhance | reject(pptx)
   +-- Phase 1  Content Discovery       1 AskUserQuestion, 4 questions bundled
   +-- Phase 2  Style Discovery         3 real HTML previews written to .claude-design/slide-previews/
   +-- Phase 3  Generate                single HTML file, all assets inlined
   +-- Phase 4  PDF Export (optional)   scripts/export-pdf.sh -> puppeteer-core -> system Chrome
   +-- Phase 5  Delivery                clean previews, open file, print operation hints
```

No intermediate JSON / IR / schema. The HTML file itself is the single source of truth -- PDF derives from it, never from a parallel data model. This avoids the schema-drift maintenance cost of a multi-channel renderer.

### 4.2 File Layout

```
skills/htmlslides/
  SKILL.md
  skill.json
  specs/
    content-discovery-requirements.md
    style-discovery-requirements.md
    generate-requirements.md
    pdf-export-requirements.md
    style-presets.md
    forbidden-patterns.md
  templates/
    html-template.md
    viewport-base.css
    animation-patterns.md
    preview-template.html.hbs
  examples/
    minimal-deck.html
    pitch-deck.html
  scripts/
    export-pdf.sh
    export-pdf.mjs
  references/
    help.md
```

Layout aligns with `skills/worksummary/`. The only Handlebars template is `templates/preview-template.html.hbs` -- everything else is copy-as-is so HTML / CSS / JS literal braces do not collide with Handlebars syntax.

### 4.3 STE coverage

| Function | Spec | Template | Example |
|---|---|---|---|
| generate (new deck) | generate-requirements.md | html-template.md + viewport-base.css + animation-patterns.md | minimal-deck.html, pitch-deck.html |
| style-preview (Phase 2 sub-output) | style-discovery-requirements.md | preview-template.html.hbs | (preview is ephemeral, no example needed) |
| export-pdf | pdf-export-requirements.md | (script output is a binary, no markdown template) | (binary, not checked into examples) |

Every G phase has at least a Spec + Template + Example triad where an output is presented. Phases that produce only ephemeral artifacts (Phase 2 preview HTML written to a scratch dir, Phase 4 PDF binary) are exempt from the `examples/` requirement.

## 5. HTML model

### 5.1 Slide as section

```html
<section class="slide" data-slide="1">
  <h1>...</h1>
  <p class="subtitle">...</p>
</section>
<section class="slide" data-slide="2"> ... </section>
```

### 5.2 viewport-base.css (locked-in invariants)

- `html { scroll-snap-type: y mandatory; }`
- `.slide { width: 100vw; height: 100dvh; scroll-snap-align: start; overflow: hidden; }` -- viewport units, no fixed pixel size.
- All sizes via `clamp(min, preferred, max)` -- the deck must render legibly at 1920x1080, 1280x720, and 1024x768 without horizontal scroll.
- CSS variables exposed in `:root` for color and font tokens -- preset `:root` blocks override them.

### 5.3 JS scaffold (`SlidePresentation` class, inlined)

- IntersectionObserver toggles `.visible` on the active slide -> CSS `.reveal` animations trigger.
- Keyboard arrows / space / PageUp / PageDown / Home / End.
- Touch swipe (single delta gesture).
- Mouse wheel (debounced).
- Progress bar + nav dots.

### 5.4 Density caps (Generate spec enforces)

| Layout | Limit |
|---|---|
| Title slide | 1 heading + 1 subtitle |
| Content slide (bullets) | 1 heading + 4-6 bullets |
| Feature grid | up to 6 cards |
| Quote slide | 1 quote + 1 attribution |
| Code slide | up to 30 lines code |

Violations are caught in the Verify checklist (line counts grep'd from the output).

## 6. PDF export decision

### 6.1 Constraints

- HTML uses CSS variables, `clamp()`, `dvh` units, scroll-snap, `@font-face` web fonts.
- JS sets `.visible` -> CSS `.reveal { opacity: 1; transform: none }` transitions trigger.
- Animations have a final state. Capturing the initial state would yield a blank PDF.

### 6.2 Candidate library comparison

| Library | Engine | macOS install burden | Bundle | CSS coverage | JS executed | Selected |
|---|---|---|---|---|---|---|
| puppeteer-core + system Chrome | user's Chrome | `npm i puppeteer-core`, 0 binary download | ~3MB | full (= system Chrome) | yes | yes |
| Playwright (reference original) | bundled Chromium | `npx playwright install chromium` (~170MB) | ~5MB + 170MB browser | full | yes | no, too heavy |
| WeasyPrint (Python) | Pango / Cairo | `brew install weasyprint` pulls native deps | ~80MB | CSS 2.1, Selectors 3-4, Flexbox, Grid, Paged Media; no scroll-snap | no | no -- JS not run, reveal never triggers, PDF blank |
| wkhtmltopdf | QtWebKit 2015 | brew + binary | ~100MB | no CSS Grid, unstable CSS variables, no scroll-snap | old V8 | no -- archived 2023-01, last release 2020-06 |
| jsPDF + html2canvas | pure-JS canvas redraw | npm only | ~1MB | does not actually re-layout; clamp / dvh / scroll-snap lost | partial | no -- fidelity unacceptable |
| Browser Cmd+P | user's browser | 0 | 0 | full | yes | mentioned as zero-dep fallback in Delivery hints |

### 6.3 Chosen: `puppeteer-core` + system Chrome

`puppeteer` and `puppeteer-core` are the same repository at the same version. The difference is purely whether `postinstall` downloads Chromium. With `puppeteer-core` we supply our own `executablePath`:

```js
const CHROME_CANDIDATES = {
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
  linux: [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ],
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ],
};
```

If no candidate is found, the script fails fast with two recovery paths printed:

1. `brew install --cask google-chrome` (or platform equivalent), then re-run.
2. Open the HTML in any browser and use Cmd+P (Ctrl+P) -> Save as PDF.

### 6.4 Multi-page assembly

The same screenshot-and-stitch trick from frontend-slides:

1. Boot a Node `http.createServer` on a random free port to serve the HTML's parent dir (this handles relative asset paths including filenames with spaces via `decodeURIComponent`).
2. `puppeteer.launch({ executablePath, headless: 'new' })`, viewport 1920x1080 (or 1280x720 with `--compact`).
3. `page.goto(url, { waitUntil: 'networkidle0' })`, then `document.fonts.ready`, then a 1500ms settle.
4. Count `.slide` elements. Fail fast on 0.
5. For each slide index `i`:
   - Try three navigation strategies (toggle `style.display`/`opacity`/`visibility`, call `window.presentation?.goToSlide(i)`, `scrollIntoView({ behavior: 'instant' })`).
   - Force every `.reveal` on the active slide to `opacity:1; transform:none; visibility:visible` so paused animations are captured at final state.
   - `page.screenshot({ path: 'slide-NNN.png', fullPage: false })`.
6. Open a second page that loads an inline HTML wrapping all PNGs as base64 in `.page` blocks with `@page { size: 1920px 1080px; margin: 0 }`.
7. `pdfPage.pdf({ path: out.pdf, printBackground: true, preferCSSPageSize: true })`.

Multi-page is **not** Playwright's native pagination -- it's "screenshot each slide separately, stitch via a print-CSS HTML wrapper." This works in any browser engine (Chromium / Chrome).

## 7. Style presets (v1: 5 presets)

Stored as one Markdown file `specs/style-presets.md`. Each preset entry:

```
### Preset N: <Name>

Vibe: <short phrase>
Mood tags: <serious | bold | calm | playful | technical | editorial>
Display font: <name, source URL>
Body font: <name, source URL>
Color block (:root):
  --bg: ...
  --fg: ...
  --accent: ...
  --muted: ...
Signature elements:
  - <distinctive decoration 1>
  - <distinctive decoration 2>
```

| # | Name | Vibe | Mood |
|---|---|---|---|
| 1 | Bold Signal | High-contrast deep navy + neon accent | bold, technical |
| 2 | Notebook Tabs | Cream paper, side tab strip, hand-drawn underlines | editorial, playful |
| 3 | Swiss Modern | All-white, helvetica neue, generous grid | calm, serious |
| 4 | Terminal Green | Black bg, monospace, scanline overlay | technical, playful |
| 5 | Pastel Geometry | Pastel gradients, geometric shapes, rounded sans | playful, calm |

Each preset's `:root` block is inlined into the generated HTML's `<style>` -- no per-preset CSS file shipped. This lets one HTML file be fully portable.

## 8. SKILL.md workflow

Six phases, each tagged with AGV phases:

| Phase | A | G | V |
|---|---|---|---|
| 0 Detect mode | inspect prompt | branch | n/a |
| 1 Content Discovery | read content-discovery-requirements.md | AskUserQuestion x1 (Purpose / Length / Readiness / Inline-editing) | 4 answers non-empty |
| 2 Style Discovery | read style-presets.md + style-discovery-requirements.md | AskUserQuestion("Vibe") -> map to 3 presets -> render 3 preview HTML to .claude-design/slide-previews/ -> open them | AskUserQuestion("Pick A / B / C / Mix") with non-empty result |
| 3 Generate | read html-template.md + viewport-base.css + animation-patterns.md + chosen preset + forbidden-patterns.md | produce single HTML, all CSS/JS inlined | Verify checklist in generate-requirements.md (viewport-base.css fully inlined, density caps respected, forbidden patterns 0 hits) |
| 4 PDF Export (optional) | read pdf-export-requirements.md | run scripts/export-pdf.sh | exit 0, output > 50KB, slide count matches `.slide` count in HTML |
| 5 Delivery | check produced files | rm -rf .claude-design/slide-previews/, open HTML, print operation hints | hints displayed include navigation keys, re-generate command, Cmd+P fallback |

`allowed-tools` frontmatter: `Read, Write, Edit, Bash, AskUserQuestion`. Bash needed for Phase 2 (`open` previews) and Phase 5 (cleanup + `open`).

## 9. Lint Compliance Plan

| Rule | How we satisfy |
|---|---|
| description-format | description starts with "Use when", under 1024 chars |
| description-no-workflow | description avoids first/then/next/finally/step/workflow |
| ste-dirs-exist | specs/, templates/, examples/ all created |
| examples-has-content | examples/ contains minimal-deck.html + pitch-deck.html (non-empty) |
| render-files-exist | skill.json render = `["SKILL.md", "specs/*.md", "templates/preview-template.html.hbs"]`, all match |
| skill-md-exists | SKILL.md present |
| skill-json-exists | skill.json present |
| frontmatter-valid | SKILL.md frontmatter has name + description + allowed-tools |
| name-format | name is lowercase letters + digits |
| no-unused-template-vars | no Handlebars vars used in static templates |
| platform-config-exists | platforms = ["claude", "joycode"] both in platforms/ already |

## 10. Risks

- HTML / CSS / JS literal `{{}}` colliding with Handlebars. Mitigated: only `preview-template.html.hbs` is rendered; all `.html` / `.css` / `.md` files are listed under `render: ["SKILL.md", "specs/*.md", "templates/preview-template.html.hbs"]`, so the rest are copied as-is.
- `open` is macOS-only. Phase 2 and Phase 5 use a shell wrapper that picks `open` (darwin) / `xdg-open` (linux) / `start` (win32) at runtime.
- puppeteer-core requires user Chrome. Mitigated by 5-path probe and Cmd+P fallback message.
- LLM may scatter hex colors instead of using `:root` variables. Mitigated: forbidden-patterns.md includes a grep rule `#[0-9a-f]{3,6}` on non-`:root` lines, run during Verify.
- 5 presets may feel sparse vs reference 12. Acceptable for v1; add per user feedback.

## 11. Verification Plan

End-to-end checks before shipping:

1. `npm run lint htmlslides` -> all 11 rules PASS (no warnings).
2. `npm run build` -> dist/skills/claude/htmlslides/ and dist/skills/joycode/htmlslides/ both populated.
3. `npm run dev -- install htmlslides --local` -> `.claude/skills/htmlslides/` populated.
4. Open `skills/htmlslides/examples/minimal-deck.html` in Chrome, verify navigation works at 1920x1080 / 1280x720 / 1024x768.
5. Run `bash skills/htmlslides/scripts/export-pdf.sh skills/htmlslides/examples/minimal-deck.html /tmp/out.pdf` -> PDF > 50KB, page count = slide count, animation final state captured.
6. Failure path: rename system Chrome temporarily -> script fails fast with both recovery hints.

## 12. Implementation Order

1. Skill metadata: skill.json + SKILL.md frontmatter (minimal first, fill body last).
2. Specs (6 files) -- spec-first, code-second per OpenSkill convention.
3. Templates (4 files).
4. Examples (2 HTML decks, also serve as visual reference for the LLM).
5. Scripts (export-pdf.sh + export-pdf.mjs).
6. References (help.md).
7. SKILL.md body filling in 6-phase workflow with cross-references.
8. README.md update.
9. Lint -> build -> install -> end-to-end verify.

This order minimizes rework: writing specs first forces the contract to be explicit, then templates are wired to those specs, then examples validate that the contract is producible at quality.
