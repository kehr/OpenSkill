# htmlslides -- Command Reference and Troubleshooting

## What this skill does

Given a natural-language prompt (e.g. "make me a 5-slide intro deck for my project"), produce a single self-contained HTML file containing a full-screen presentation deck. All CSS, JS, and fonts are inlined -- the file is portable, shareable by email, hostable on any static server, and openable from disk. Optional PDF export from the same HTML uses the user's system Chrome (no Chromium download).

## Commands

### `generate`

Interactive 5-phase workflow:

1. Content discovery (purpose / length / readiness / inline-editing) -- 1 bundled question.
2. Style discovery (mood -> 3 real HTML previews -> pick).
3. Generate single HTML file.
4. PDF export (optional).
5. Delivery (open file, print operation hints).

### `export-pdf`

Skip straight to PDF export for an existing HTML deck.

Shell-level usage:

```bash
bash skills/htmlslides/scripts/export-pdf.sh <input.html> [<output.pdf>] [--compact]
```

Arguments:

| Arg | Meaning |
|---|---|
| `<input.html>` | Path to the deck HTML (required). |
| `<output.pdf>` | Destination PDF (default: same dir as input, `<name>.pdf`). |
| `--compact` | Render at 1280x720 instead of 1920x1080. Smaller file size. |

Exit codes:

| Code | Meaning |
|---|---|
| 0 | Success. |
| 1 | Bad arguments. |
| 2 | No Chrome found in any probe path (see Troubleshooting below). |
| 3 | npm install or node script failed. |
| 4 | Output PDF missing or too small (< 50KB). |

### `help`

Show this reference.

## Built-in visual presets

| Preset | Mood | Vibe |
|---|---|---|
| Bold Signal | bold, technical | Deep navy + neon, confident |
| Notebook Tabs | editorial, playful | Cream paper, side tab strip |
| Swiss Modern | calm, serious | All-white, generous grid |
| Terminal Green | technical, playful | Black bg, mono, scanline overlay |
| Pastel Geometry | playful, calm | Pastel gradients, geometric shapes |

Each preset is a coherent visual language -- not just a color swap. See [specs/style-presets.md](../specs/style-presets.md) for the full preset definitions.

## Browser support

The generated HTML uses modern web platform features:

- CSS Custom Properties (`:root` variables)
- `clamp()` for responsive typography
- `dvh` viewport units (fallback to `vh`)
- `scroll-snap-type: y mandatory`
- IntersectionObserver for reveal animations

Supported: Chrome 105+, Safari 15.4+, Firefox 101+, Edge 105+.
Not supported: IE11 (won't render correctly), pre-2022 mobile browsers may have minor issues with `dvh`.

## Keyboard shortcuts (in the rendered deck)

| Key | Action |
|---|---|
| ArrowDown / ArrowRight / Space / PageDown | Next slide |
| ArrowUp / ArrowLeft / PageUp | Previous slide |
| Home | First slide |
| End | Last slide |

Also supported: mouse wheel (debounced), touch swipe, click on nav dots on the right edge.

## PDF Export Troubleshooting

### "Chrome not found in any probe path" (exit 2)

The script probes these paths in order:

**macOS:**
- `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- `/Applications/Google Chrome Canary.app/...`
- `/Applications/Microsoft Edge.app/...`
- `/Applications/Brave Browser.app/...`
- `/Applications/Chromium.app/...`

**Linux:**
- `/usr/bin/google-chrome`
- `/usr/bin/google-chrome-stable`
- `/usr/bin/chromium`
- `/usr/bin/chromium-browser`
- `/snap/bin/chromium`

**Windows:**
- `C:\Program Files\Google\Chrome\Application\chrome.exe`
- `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
- `%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe`

Recovery options:

1. Install Chrome (or a compatible Chromium-based browser):
   - macOS: `brew install --cask google-chrome`
   - Debian / Ubuntu: `sudo apt install google-chrome-stable`
   - Windows: https://www.google.com/chrome

2. Skip the script entirely. Open the HTML in any browser and use **Cmd+P** (macOS) or **Ctrl+P** (Linux / Windows) -> Save as PDF. The deck's print CSS handles pagination at 1920x1080 per page.

### "npm install puppeteer-core failed" (exit 3)

The script creates a tmp dir and runs `npm install puppeteer-core@^24` there. If it fails, common causes:

- No internet access (puppeteer-core is fetched from npm registry).
- npm registry blocked. Try setting `npm config set registry https://registry.npmjs.org/`.
- Node < 18. Check with `node -v`; upgrade if needed.
- Disk full (the tmp install is ~5MB but uses npm cache).

### PDF is blank / animations not visible

The script forces all `.reveal*` elements on the active slide to their final state before screenshot, but if the deck uses custom animation class names not matching `.reveal`, `.reveal-scale`, `.reveal-left`, `.reveal-blur`, they may stay in their initial (invisible) state.

Fix: ensure the generated HTML uses these standard class names. The skill enforces this in Phase 3 generation. If you wrote the HTML by hand, rename your animation classes to one of the standard names.

### Fonts fall back to Times in the PDF

The script waits for `document.fonts.ready` then an additional 1500ms before screenshotting. If web fonts are very slow or blocked:

- Check if Google Fonts is reachable from the machine running the export (some corporate networks block it).
- Try `--compact` mode (smaller viewport, fewer chars to lay out).
- As a last resort, inline @font-face binary or switch to system fonts in the preset.

### PDF is much smaller than 50KB

The script warns when the output is under 50KB. Common cause: the input HTML had no `.slide` elements, or screenshots all came back empty. Inspect the PDF manually:

```bash
open <output.pdf>  # macOS
xdg-open <output.pdf>  # Linux
```

## Zero-dependency fallback

If you do not have Chrome installed, or you do not want to install puppeteer-core, or the script fails for any reason:

1. Open the HTML in any browser.
2. **Cmd+P** (macOS) or **Ctrl+P** (Linux / Windows).
3. Choose "Save as PDF" as the destination.
4. In the print dialog:
   - Set paper size to `1920 x 1080 px` (custom). If your dialog only allows standard sizes, choose "A4 Landscape" -- the print CSS scales reasonably.
   - Margins: None.
   - Background graphics: enabled.
5. Save.

The result is comparable to the script output for most decks. Animations are captured at their final state because the deck's print CSS (`@media print`) forces `opacity: 1` on all `.reveal*` elements.

## FAQ

**Can I edit the deck after generation?**

If you chose "Yes" for inline editing in Phase 1, the HTML has a hover-revealed `edit` toggle in the corner. Click it to enable contenteditable on all text. Click `done` when finished, then call `window.exportFile()` from the browser devtools console to save a cleaned copy.

If you chose "No", edit the HTML source directly. The structure is documented in [templates/html-template.md](../templates/html-template.md).

**Can I add my own preset?**

Not in v1. v2 may expose a custom-preset CLI option. For now, regenerate the deck with the closest built-in preset and tweak the `:root` variables in the output HTML.

**Why isn't .pptx supported?**

v1 ships HTML + PDF only. The reference open-source skill (`zarazhangrui/frontend-slides`) also defers `.pptx` reverse export (issue #71). v2 may add screenshot-based `.pptx` (one image per slide embedded in PowerPoint), but the editable text round-trip is hard and not in v1 scope.

**Can I host the HTML somewhere?**

Yes. The output is self-contained -- copy it to any static host (S3, GitHub Pages, Vercel, Netlify, your own server). It will work offline as long as Google Fonts CDN is reachable; pin a font binary via base64 `@font-face` if you need fully offline.
