# PDF Export Requirements (Phase 4)

## Purpose

Export an existing HTML deck to a high-fidelity PDF using `puppeteer-core` driving the user's system Chrome (or compatible Chromium-based browser). No Chromium binary is downloaded; the user's existing Chrome is reused.

## Input

- Path to an HTML deck file (`<deck>.html`).
- Optional `--compact` flag for 1280x720 output (default is 1920x1080).
- Optional `--output <path>` for the PDF destination (default is `<deck>.pdf` next to the input).

## Processing Rules

1. **Invocation**:

   ```
   bash scripts/export-pdf.sh <input.html> [output.pdf] [--compact]
   ```

   The bash wrapper:
   - Probes for a system Chrome / Chromium binary in the platform-specific path list.
   - If none found, fails fast and prints both recovery paths.
   - Creates a temporary working directory.
   - Writes a transient `package.json` (`{ "type": "module" }`) into the temp dir.
   - Runs `npm install puppeteer-core` inside the temp dir.
   - Invokes `node scripts/export-pdf.mjs <input> <output> [--compact]` with `NODE_PATH` pointing at the temp dir.

2. **Chrome path probe order**:

   | OS | Candidate paths (in priority order) |
   |---|---|
   | darwin | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, `/Applications/Google Chrome Canary.app/...`, `/Applications/Microsoft Edge.app/...`, `/Applications/Brave Browser.app/...`, `/Applications/Chromium.app/...` |
   | linux | `/usr/bin/google-chrome`, `/usr/bin/google-chrome-stable`, `/usr/bin/chromium`, `/usr/bin/chromium-browser` |
   | win32 | `C:\Program Files\Google\Chrome\Application\chrome.exe`, `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe` |

3. **Multi-page assembly** (the canonical screenshot-and-stitch pattern):
   - Boot a local Node `http.createServer` on a random free port. Serve the HTML's parent directory.
   - Launch puppeteer at viewport 1920x1080 (or 1280x720 if `--compact`).
   - `page.goto(url, { waitUntil: 'networkidle0' })`, then `await document.fonts.ready`, then `setTimeout(1500ms)`.
   - Count `.slide` elements. If 0, abort with error.
   - For each slide index i:
     - Apply three navigation strategies in parallel to handle different HTML conventions:
       a) Toggle `style.display`, `style.opacity`, `style.visibility`, and the `.active` class on each `.slide`.
       b) If `window.presentation?.goToSlide` exists, call it.
       c) `element.scrollIntoView({ behavior: 'instant' })`.
     - Force all `.reveal`, `.reveal-scale`, `.reveal-left`, `.reveal-blur` descendants of the active slide to `opacity:1; transform:none; visibility:visible`.
     - `await new Promise(r => setTimeout(r, 200))` to let any layout settle.
     - `page.screenshot({ path: 'slide-NNN.png', fullPage: false })`.
   - Open a second tab, set its content to a wrapper HTML:

     ```html
     <html><head><style>
       @page { size: 1920px 1080px; margin: 0; }
       body { margin: 0; }
       .page { width: 1920px; height: 1080px; page-break-after: always; }
       .page:last-child { page-break-after: auto; }
     </style></head><body>
       <div class="page"><img src="data:image/png;base64,..."></div>
       <div class="page"><img src="data:image/png;base64,..."></div>
     </body></html>
     ```

   - `await pdfPage.pdf({ path: output, printBackground: true, preferCSSPageSize: true, width: '1920px', height: '1080px' })`.
   - Close puppeteer, stop the local server, remove the temp dir.

4. **Failure mode**:
   - If no Chrome path resolves, print:

     ```
     [export-pdf] Chrome not found.
     Recovery options:
       (1) Install Chrome: brew install --cask google-chrome  (macOS)
                           sudo apt install google-chrome-stable  (Debian/Ubuntu)
                           https://www.google.com/chrome  (Windows)
       (2) Open the HTML in any browser and use Cmd+P (Ctrl+P) -> Save as PDF.
     ```
   - Exit code 2.

5. **Logging**: print one-line status updates to stderr (`[export-pdf] Using Chrome: ...`, `[export-pdf] 5 slides detected`, `[export-pdf] Wrote /tmp/out.pdf (123KB)`). stdout reserved for the final output path.

## Output Format

A PDF file at the target path. One PDF page per HTML slide. Page size matches the screenshot dimensions (1920x1080 or 1280x720).

## Quality Standards

- Exit code 0 on success.
- PDF page count = HTML `.slide` count.
- PDF file size > 50KB (a much smaller file usually means screenshots failed).
- Animation final states are captured (reveal elements visible, not blank).
- Web fonts render correctly (not falling back to Times).

## Verification Checklist

- [ ] Script exit code is 0.
- [ ] Stderr log shows `Using Chrome:` line with a resolved path.
- [ ] Output PDF file exists at the target path.
- [ ] Output PDF file size > 50KB.
- [ ] `pdfinfo` (or equivalent) reports page count = `grep -c '<section class="slide' input.html`. (Use `<section class="slide` -- a bare `class="slide` substring would also count decoration elements like `class="slide-number"`.)
- [ ] Visual spot-check: open in Preview, page 1 has the title, last page has expected end-state content (no blank pages).
- [ ] Failure-mode check: if Chrome is removed from path probe list temporarily, script fails fast with both recovery hints printed.
