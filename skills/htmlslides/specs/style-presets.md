# Style Presets

## Purpose

Catalog of 5 visual presets that the htmlslides skill can apply to a generated deck. Each preset defines a coherent visual language -- color palette, typography stack, and at least one signature decoration element that gives the preset its identity. Presets are NOT just "different colors": each carries a distinct decoration grammar.

## Input

Used by Phase 2 (Style Discovery) to render previews and by Phase 3 (Generate) to inline the chosen preset's `:root` block, font stack, and signature CSS into the final HTML.

## Quality Standards (cross-preset)

- All color values live in the `:root { ... }` block. No hex appears anywhere else in the HTML.
- Each preset names a `display` font and a `body` font (often the same family or a complementary pair).
- Each preset declares at least one CSS class for its signature decoration.
- Each preset must render legibly at 1024x768 (the smallest supported viewport).
- No preset uses `Inter`, `Roboto`, `Arial`, or `Helvetica` as a first font choice -- those are the AI-default fonts forbidden by `forbidden-patterns.md`.

## Preset 1: Bold Signal

Vibe: High-contrast deep navy with neon accent. Reads as confident, technical, modern.
Mood tags: bold, technical.
Display font: `Space Grotesk` (Google Fonts).
Body font: `Inter Tight` (Google Fonts).

```css
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
```

Signature elements:
- `.title-bar`: a 6px solid `--accent-hot` bar to the left of section titles.
- `.eyebrow`: tiny uppercase letter-spaced label above titles (`--muted`).
- Slide number ticker in the bottom-right (`--muted`, monospace).

## Preset 2: Notebook Tabs

Vibe: Cream paper, side tab strip, hand-drawn underlines. Reads as editorial, warm, considered.
Mood tags: editorial, playful.
Display font: `Fraunces` (Google Fonts).
Body font: `Source Serif 4` (Google Fonts).

```css
:root {
  --bg: #f7f1e3;
  --bg-elev: #fbf6e8;
  --fg: #2c2517;
  --muted: #6b5d44;
  --accent: #b94a3c;
  --accent-hot: #2f6b50;
  --border: #d9cdb0;
  --font-display: "Fraunces", "Times New Roman", serif;
  --font-body: "Source Serif 4", Georgia, serif;
}
```

Signature elements:
- `.tab-strip`: a vertical strip of 3-5 colored tabs on the right edge with vertical text indicating section name.
- `.binder-holes`: 3 small circles on the left edge mimicking notebook holes.
- Hand-drawn-style underline (CSS `box-shadow` with offset) under titles.

## Preset 3: Swiss Modern

Vibe: All-white, generous grid, helvetica-style sans, almost no decoration. Reads as minimal, serious, professional.
Mood tags: calm, serious.
Display font: `Neue Haas Grotesk` -> fallback to `Helvetica Now Display`, `Inter Display` (system stack only).
Body font: `Neue Haas Grotesk` -> fallback `Helvetica`, `system-ui`.

```css
:root {
  --bg: #ffffff;
  --bg-elev: #fafafa;
  --fg: #111111;
  --muted: #6b6b6b;
  --accent: #d22b2b;
  --accent-hot: #1b1b1b;
  --border: #e5e5e5;
  --font-display: "Helvetica Now Display", "Neue Haas Grotesk", system-ui, sans-serif;
  --font-body: "Helvetica Now Text", "Neue Haas Grotesk", system-ui, sans-serif;
}
```

Note: This preset is deliberately allowed to use Helvetica/Neue Haas Grotesk (they are the Swiss Modern style essence; the "no Helvetica as first font" rule in `forbidden-patterns.md` has a documented exception for this preset only).

Signature elements:
- `.swiss-grid`: explicit 12-column grid lines visible at 5% opacity for the first slide only (then fade out).
- Large slide numbers in the top-right (display font, 3-4 digits worth of width).
- Single horizontal hairline (1px `--border`) below each title.

## Preset 4: Terminal Green

Vibe: Black background, monospace, scanline overlay. Reads as technical, playful, retro.
Mood tags: technical, playful.
Display font: `JetBrains Mono` (Google Fonts).
Body font: `JetBrains Mono` (Google Fonts).

```css
:root {
  --bg: #0a0e0a;
  --bg-elev: #111711;
  --fg: #4ade80;
  --muted: #2a8a4a;
  --accent: #d2ff5e;
  --accent-hot: #ff7e7e;
  --border: #1c2a1c;
  --font-display: "JetBrains Mono", "SF Mono", Menlo, monospace;
  --font-body: "JetBrains Mono", "SF Mono", Menlo, monospace;
}
```

Signature elements:
- `.scanline`: a pseudo-element overlay with horizontal lines at low opacity (CSS gradient `repeating-linear-gradient`).
- `.cursor`: a blinking `_` (CSS animation `blink 1.1s infinite step-end`) at the end of titles.
- Prompt prefix `$ ` before slide titles.

## Preset 5: Pastel Geometry

Vibe: Pastel gradients, geometric shapes (circles/triangles) as background, rounded sans-serif. Reads as playful, modern, friendly.
Mood tags: playful, calm.
Display font: `DM Sans` (Google Fonts).
Body font: `DM Sans` (Google Fonts).

```css
:root {
  --bg: #fef3f9;
  --bg-elev: #fff;
  --fg: #2b2748;
  --muted: #8983b3;
  --accent: #ff7eb6;
  --accent-hot: #6bd2e8;
  --border: #f3d9e8;
  --font-display: "DM Sans", system-ui, sans-serif;
  --font-body: "DM Sans", system-ui, sans-serif;
}
```

Signature elements:
- `.geo-bg`: SVG geometric shapes (large pastel circles, rounded triangles) positioned absolutely as background decoration with `pointer-events: none`.
- All cards / containers have `border-radius: 24px`.
- Subtle gradient (`linear-gradient(135deg, --accent, --accent-hot)` at 12% opacity) on the body background.

## Preset Selection Map (cross-reference)

| Mood | Primary preset | Bridge preset |
|---|---|---|
| Bold & confident | Bold Signal (1) | Terminal Green (4) |
| Calm & editorial | Notebook Tabs (2) | Pastel Geometry (5) |
| Minimal & professional | Swiss Modern (3) | Bold Signal (1) |
| Technical & playful | Terminal Green (4) | Pastel Geometry (5) |

## Verification Checklist

- [ ] All 5 presets defined.
- [ ] Each preset has Vibe + Mood tags + Display font + Body font + `:root` block + Signature elements (>= 1).
- [ ] No two presets have identical color palettes.
- [ ] No two presets have identical font stacks (Swiss Modern's Helvetica-first is the only exception to the forbidden-fonts rule).
- [ ] The Selection Map table covers all 4 moods.
