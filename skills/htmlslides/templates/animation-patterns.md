# Animation Patterns

A pattern library Phase 3 picks from when adding reveal / background / interaction animations. Animations should be subtle, fast (<= 700ms), and skip-friendly -- the `@media (prefers-reduced-motion: reduce)` block disables them all.

## Mood-to-animation map

| Mood | Reveal class to prefer | Background flair | Interaction |
|---|---|---|---|
| Dramatic / Bold | `reveal-blur` + stagger | gradient mesh, low-opacity dot grid | hover glow on accent elements |
| Technical | `reveal-left` + stagger | scanlines, monospace cursor blink | typewriter caret on titles |
| Playful | `reveal-scale` + stagger | floating geometric shapes | 3D tilt on cards |
| Professional | `reveal` only (no flair) | nothing | none |
| Calm | `reveal` + slow stagger (120ms gaps) | subtle gradient wash | none |
| Editorial | `reveal-left` | paper texture | hover underline on links |

The base `.reveal` / `.reveal-scale` / `.reveal-left` / `.reveal-blur` classes are defined in `viewport-base.css`. The decorations below are optional add-ons.

## CSS snippet: gradient mesh background

```css
.gradient-mesh {
  position: absolute;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 20% 30%, var(--accent) 0%, transparent 40%),
    radial-gradient(circle at 80% 70%, var(--accent-hot) 0%, transparent 40%);
  opacity: 0.18;
  filter: blur(60px);
}
```

Use on title slides for Dramatic/Bold mood. Z-index pushes it behind content.

## CSS snippet: dot grid background

```css
.dot-grid {
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: radial-gradient(var(--muted) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.18;
}
```

## CSS snippet: scanline overlay (Terminal Green signature)

```css
.scanline::after {
  content: "";
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 3px,
    rgba(74, 222, 128, 0.04) 3px,
    rgba(74, 222, 128, 0.04) 4px
  );
  pointer-events: none;
  z-index: 1;
}
```

## CSS snippet: cursor blink

```css
.cursor {
  display: inline-block;
  width: 0.6ch;
  background: var(--accent);
  animation: blink 1.1s step-end infinite;
}

@keyframes blink {
  50% { background: transparent; }
}
```

## CSS snippet: hover glow on accent elements

```css
.accent-glow {
  transition: box-shadow 200ms ease-out, transform 200ms ease-out;
}
.accent-glow:hover {
  box-shadow: 0 0 0 3px var(--accent), 0 8px 28px rgba(255, 106, 191, 0.35);
  transform: translateY(-2px);
}
```

## CSS snippet: 3D tilt on cards (Playful mood)

```css
.tilt {
  transform-style: preserve-3d;
  transition: transform 300ms ease-out;
}
.tilt:hover {
  transform: perspective(800px) rotateX(4deg) rotateY(-4deg) translateY(-2px);
}
```

## CSS snippet: floating geometric shapes

```css
.floater {
  position: absolute;
  border-radius: 50%;
  opacity: 0.6;
  animation: float 8s ease-in-out infinite;
  pointer-events: none;
}
.floater:nth-child(2) { animation-delay: -3s; }
.floater:nth-child(3) { animation-delay: -6s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-16px); }
}
```

## Accessibility (always include)

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  .reveal, .reveal-scale, .reveal-left, .reveal-blur {
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
  }
  .cursor { animation: none !important; background: transparent !important; }
  .floater { animation: none !important; }
}
```

This block MUST be included in every generated HTML. Users with reduced-motion preferences should see static content immediately, no reveal delay.

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Reveal animations never fire | `.visible` class never added | Check IntersectionObserver threshold (0.55 typical), confirm `class="reveal"` on element |
| Animations look choppy | Browser repaints | Add `will-change: transform, opacity` to animated elements (but remove after animation ends) |
| Fonts swap mid-animation | Font loading after IO fires | Add `<link rel="preload" as="font">` for critical fonts, or wait for `document.fonts.ready` before adding `.visible` |
| Background blur causes lag | Large `blur()` on background | Reduce blur radius, or use `filter: blur()` only on smaller layers |
| Floater shapes jump on resize | Animation tied to viewport units | Use absolute pixel offsets in animation, or `transform: translate3d()` to avoid layout |
