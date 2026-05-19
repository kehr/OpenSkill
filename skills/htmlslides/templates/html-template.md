# HTML Template Reference

This file is the structural reference Phase 3 reads when producing the final deck HTML. It is NOT a Handlebars template -- the LLM uses it as a pattern, not a renderer input.

## Overview

The output is a single self-contained HTML file with:

1. Doctype + html element with detected `lang` attribute
2. Head with meta tags, title, preconnect, inlined `<style>`
3. Body containing one `<section class="slide">` per slide
4. Script tag with the `SlidePresentation` class

All CSS, JS, fonts (via Google Fonts CDN), and small images (base64) are inlined. The final file is portable -- a user can email it, host it on any static server, or open it from disk.

## Top-level HTML skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Deck Title</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter+Tight:wght@400;500;600&display=swap" rel="stylesheet">

  <style>
    /* ===== Preset: Bold Signal ===== */
    :root {
      --bg: #0b1220;
      --bg-elev: #131c30;
      --fg: #f3f6ff;
      --muted: #93a4c3;
      --accent: #6ee7ff;
      --accent-hot: #ff6abf;
      --border: #1f2a44;
      --font-display: "Space Grotesk", system-ui, sans-serif;
      --font-body: "Inter Tight", system-ui, sans-serif;
    }

    /* ===== viewport-base.css inlined verbatim here ===== */
    /* (paste the contents of templates/viewport-base.css) */

    /* ===== Preset signature elements ===== */
    .title-bar { /* ... */ }
    .eyebrow { /* ... */ }
  </style>
</head>
<body>
  <div class="progress"><div class="progress-fill" id="progress-fill"></div></div>
  <nav class="nav-dots" id="nav-dots" aria-label="Slide navigation"></nav>
  <div class="blackout" id="blackout" data-mode="off" aria-hidden="true"></div>
  <div class="help-overlay" id="help-overlay" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" aria-hidden="true">
    <div class="help-card">
      <h2>Keyboard Shortcuts</h2>
      <table>
        <tr><th>Next slide</th><td>&rarr; &darr; Space PageDown</td></tr>
        <tr><th>Previous slide</th><td>&larr; &uarr; Shift+Space PageUp</td></tr>
        <tr><th>First / Last</th><td>Home / End</td></tr>
        <tr><th>Jump to slide N</th><td>1 - 9 (0 = slide 10)</td></tr>
        <tr><th>Fullscreen</th><td>F</td></tr>
        <tr><th>Blackout / Whiteout</th><td>B / W (press again to restore)</td></tr>
        <tr><th>Show this help</th><td>?</td></tr>
        <tr><th>Close overlay / Exit</th><td>Esc</td></tr>
      </table>
      <p class="help-dismiss">Press <kbd>?</kbd> or <kbd>Esc</kbd> to close</p>
    </div>
  </div>

  <section class="slide slide-title" data-slide="1">
    <p class="eyebrow reveal" data-stagger="1">Introduction</p>
    <h1 class="reveal" data-stagger="2">Deck Title</h1>
    <p class="subtitle reveal" data-stagger="3">A short subtitle</p>
  </section>

  <section class="slide slide-bullets" data-slide="2">
    <h2 class="reveal">Section heading</h2>
    <ul>
      <li class="reveal" data-stagger="1">First point</li>
      <li class="reveal" data-stagger="2">Second point</li>
      <li class="reveal" data-stagger="3">Third point</li>
      <li class="reveal" data-stagger="4">Fourth point</li>
    </ul>
  </section>

  <!-- ...more slides... -->

  <script>
    /* ===== SlidePresentation class inlined verbatim here ===== */
    /* (see "SlidePresentation JS class" section below) */
  </script>
</body>
</html>
```

## SlidePresentation JS class

Paste this verbatim into the final HTML's `<script>` block. It powers IntersectionObserver-driven reveal, keyboard / wheel / touch navigation, progress bar, and nav dots.

```javascript
class SlidePresentation {
  constructor() {
    this.slides = Array.from(document.querySelectorAll('.slide'));
    this.activeIndex = 0;
    this.progressFill = document.getElementById('progress-fill');
    this.navContainer = document.getElementById('nav-dots');
    this.wheelLocked = false;
    this.blackout = document.getElementById('blackout');
    this.helpOverlay = document.getElementById('help-overlay');

    this.setupNavDots();
    this.setupIntersectionObserver();
    this.setupKeyboard();
    this.setupTouch();
    this.setupWheel();
    this.setupHelpDismissOnClick();
    this.updateProgress();

    // Mark the first slide visible immediately so its reveal triggers on load
    if (this.slides[0]) this.slides[0].classList.add('visible');
  }

  setupNavDots() {
    if (!this.navContainer) return;
    this.navContainer.innerHTML = '';   // Critical: clear before rebuild to avoid duplicates on saved-file reload.
    this.slides.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      if (i === 0) btn.classList.add('active');
      btn.addEventListener('click', () => this.goToSlide(i));
      this.navContainer.appendChild(btn);
    });
  }

  setupIntersectionObserver() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          const idx = this.slides.indexOf(entry.target);
          if (idx >= 0) {
            this.activeIndex = idx;
            this.updateActiveDot();
            this.updateProgress();
          }
        }
      });
    }, { threshold: 0.55 });
    this.slides.forEach((s) => io.observe(s));
  }

  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Skip when typing in editable elements (inline edit mode, input, textarea).
      const tag = (e.target && e.target.tagName) || '';
      if (e.target && e.target.isContentEditable) return;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // ? -- toggle help overlay (works even with Shift+/ producing ?)
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault(); this.toggleHelp(); return;
      }
      // Esc -- close help first, then exit blackout, then exit fullscreen.
      if (e.key === 'Escape') {
        if (this.helpOverlay && this.helpOverlay.classList.contains('show')) {
          e.preventDefault(); this.toggleHelp(false); return;
        }
        if (this.blackout && this.blackout.dataset.mode !== 'off') {
          e.preventDefault(); this.setBlackout('off'); return;
        }
        if (document.fullscreenElement) {
          e.preventDefault(); document.exitFullscreen().catch(() => {}); return;
        }
        return;
      }
      // While help overlay is open, swallow other keys.
      if (this.helpOverlay && this.helpOverlay.classList.contains('show')) return;

      // F -- toggle fullscreen
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); this.toggleFullscreen(); return; }

      // B / W -- blackout / whiteout (press the same key again to restore)
      if (e.key === 'b' || e.key === 'B') { e.preventDefault(); this.toggleBlackout('black'); return; }
      if (e.key === 'w' || e.key === 'W') { e.preventDefault(); this.toggleBlackout('white'); return; }

      // 1-9 jump to slide N. 0 jumps to slide 10.
      if (/^[0-9]$/.test(e.key)) {
        const target = e.key === '0' ? 9 : parseInt(e.key, 10) - 1;
        if (target >= 0 && target < this.slides.length) {
          e.preventDefault(); this.goToSlide(target);
        }
        return;
      }

      // Shift+Space -- previous (Keynote convention)
      if (e.key === ' ' && e.shiftKey) { e.preventDefault(); this.goToSlide(this.activeIndex - 1); return; }

      const nextKeys = ['ArrowDown', 'ArrowRight', 'PageDown', ' '];
      const prevKeys = ['ArrowUp', 'ArrowLeft', 'PageUp'];
      if (nextKeys.includes(e.key)) { e.preventDefault(); this.goToSlide(this.activeIndex + 1); }
      else if (prevKeys.includes(e.key)) { e.preventDefault(); this.goToSlide(this.activeIndex - 1); }
      else if (e.key === 'Home') { e.preventDefault(); this.goToSlide(0); }
      else if (e.key === 'End') { e.preventDefault(); this.goToSlide(this.slides.length - 1); }
    });
  }

  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  toggleBlackout(mode) {
    if (!this.blackout) return;
    const current = this.blackout.dataset.mode;
    this.setBlackout(current === mode ? 'off' : mode);
  }

  setBlackout(mode) {
    if (!this.blackout) return;
    this.blackout.dataset.mode = mode;
    this.blackout.setAttribute('aria-hidden', mode === 'off' ? 'true' : 'false');
  }

  toggleHelp(force) {
    if (!this.helpOverlay) return;
    const next = (typeof force === 'boolean') ? force : !this.helpOverlay.classList.contains('show');
    this.helpOverlay.classList.toggle('show', next);
    this.helpOverlay.setAttribute('aria-hidden', next ? 'false' : 'true');
  }

  setupHelpDismissOnClick() {
    if (!this.helpOverlay) return;
    // Click the dim backdrop (not the card) to close.
    this.helpOverlay.addEventListener('click', (e) => {
      if (e.target === this.helpOverlay) this.toggleHelp(false);
    });
  }

  setupTouch() {
    let startY = 0;
    document.addEventListener('touchstart', (e) => { startY = e.touches[0].clientY; }, { passive: true });
    document.addEventListener('touchend', (e) => {
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dy) < 40) return;
      this.goToSlide(this.activeIndex + (dy < 0 ? 1 : -1));
    }, { passive: true });
  }

  setupWheel() {
    document.addEventListener('wheel', (e) => {
      if (this.wheelLocked) return;
      if (Math.abs(e.deltaY) < 30) return;
      this.wheelLocked = true;
      this.goToSlide(this.activeIndex + (e.deltaY > 0 ? 1 : -1));
      setTimeout(() => { this.wheelLocked = false; }, 700);
    }, { passive: true });
  }

  goToSlide(index) {
    const clamped = Math.max(0, Math.min(this.slides.length - 1, index));
    this.slides[clamped].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  updateActiveDot() {
    if (!this.navContainer) return;
    Array.from(this.navContainer.children).forEach((btn, i) => {
      btn.classList.toggle('active', i === this.activeIndex);
    });
  }

  updateProgress() {
    if (!this.progressFill) return;
    const pct = (this.activeIndex / Math.max(1, this.slides.length - 1)) * 100;
    this.progressFill.style.width = pct + '%';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.presentation = new SlidePresentation();
});
```

## Inline Editing (only if Phase 1 chose Yes)

Add the following to the HTML body and script. This pattern uses JS hover with a 400ms timeout deliberately -- a CSS `~` sibling rule breaks here because the edit toggle uses `pointer-events: none` to let clicks pass through to underlying text.

```html
<button class="edit-toggle" id="edit-toggle" aria-label="Toggle editing">edit</button>
```

```javascript
// Append AFTER the SlidePresentation class
(function setupInlineEditing() {
  const toggle = document.getElementById('edit-toggle');
  if (!toggle) return;

  let editing = false;
  let hoverTimer = null;

  toggle.addEventListener('click', () => {
    editing = !editing;
    document.body.classList.toggle('edit-active', editing);
    document.querySelectorAll('h1, h2, h3, p, li, blockquote').forEach((el) => {
      if (editing) el.setAttribute('contenteditable', 'true');
      else el.removeAttribute('contenteditable');
    });
    toggle.textContent = editing ? 'done' : 'edit';
  });

  // 400ms hover before showing the toggle (avoids accidental triggers)
  document.addEventListener('mouseover', () => {
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => toggle.classList.add('show'), 400);
  });
  document.addEventListener('mouseout', () => {
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => toggle.classList.remove('show'), 800);
  });

  // Export current HTML (strips edit-mode contamination)
  window.exportFile = function () {
    document.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));
    document.body.classList.remove('edit-active');
    toggle.classList.remove('show', 'active');
    const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'deck-edited.html';
    a.click(); URL.revokeObjectURL(url);
  };
})();
```

## Hard Rules

These rules MUST be obeyed when generating HTML. Each one comes from a known failure mode in AI-generated decks.

1. **NavDots container MUST be cleared before rebuild.** Without `innerHTML = ''` you get duplicated dots when a saved file is reopened and the constructor runs again.

2. **Inline editing MUST use JS hover with 400ms timeout, NOT a CSS `~` sibling rule.** The CSS-only approach breaks when `pointer-events: none` is on the toggle, because the hover chain is severed.

3. **`exportFile()` MUST strip `contenteditable`, `body.edit-active`, and any toggle `.active` / `.show` classes** before reading `document.documentElement.outerHTML`. Otherwise the exported file is contaminated with edit-mode UI state.

4. **`viewport-base.css` MUST be inlined verbatim**, including the sentinel `/* viewport-base.css */` comment at the top. Verify step greps for this comment.

5. **No external CSS / JS references** -- only Google Fonts via `<link>` is allowed. Everything else must be inlined.

6. **All hex colors MUST live inside `:root { ... }`**. The rest of the CSS uses `var(--token)`.

7. **Slide `data-slide` attribute** indexes from 1 (human-readable), not 0.

8. **The `SlidePresentation` constructor must be called from `DOMContentLoaded`**, not at script load -- otherwise the IntersectionObserver fires before the slides are styled.

9. **Blackout / help-overlay DOM elements MUST be present** as siblings of `.slide` sections, BEFORE the script runs. If they are missing the `setupKeyboard` handler short-circuits its B/W/?/Esc branches via the `if (!this.blackout) return;` guards, so the deck still navigates -- but the listed shortcuts silently do nothing. Always include both `<div id="blackout">` and `<div id="help-overlay">` in the body.

10. **Keyboard handler MUST early-exit on `INPUT` / `TEXTAREA` / `SELECT` / contenteditable elements.** Without this guard, typing the letter `b` or `f` while editing a slide triggers blackout / fullscreen, breaking the inline-editing flow.

11. **`Esc` priority chain is: help overlay -> blackout -> fullscreen.** The handler must check each in order and return after handling one. Otherwise pressing Esc with both blackout and help open closes the wrong layer first.

## File order in the final HTML

The order matters for reliable rendering:

1. Doctype
2. html / head
3. meta charset (MUST be first child of head)
4. meta viewport
5. title
6. font preconnects + font link
7. style (preset :root -> viewport-base.css -> signature elements -> animation extras)
8. body
9. progress bar + nav dots scaffolding
10. all `.slide` sections in display order
11. script (SlidePresentation class)
12. (optional) inline editing script
