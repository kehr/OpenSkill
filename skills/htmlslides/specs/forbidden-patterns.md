# Forbidden Patterns (Anti-AI-Slop Rules)

## Purpose

Catalog of patterns the htmlslides skill MUST NOT emit, based on patterns observed in low-effort AI-generated HTML decks. Each rule has a reason and a remediation. Used by Phase 3 (Generate) Verify step to grep the output and fail fast if any pattern is found.

## Input

The generated HTML file from Phase 3, before it is opened or delivered to the user.

## Processing Rules

The Verify step runs each check below against the generated HTML and reports any hits. Any hit at "block" severity must be fixed before delivery; "warn" severity can be flagged but does not block.

### Forbidden fonts (block)

These fonts signal generic AI output. Do not use as the first declared font in any `font-family`:

| Font | Reason |
|---|---|
| `Inter` | Default font of every AI starter template; instantly recognizable as low-effort. |
| `Roboto` | Same problem. |
| `Arial` | Reads as a system default fallback, not a typographic choice. |
| `Helvetica` | Same as Arial, with the documented exception for the `Swiss Modern` preset where Helvetica IS the typographic identity. |

Remediation: pick a font from the chosen preset's declared stack in `specs/style-presets.md`.

Grep check:

```
grep -Ei 'font-family:\s*"?(Inter|Roboto|Arial)' <output.html>
```

(Helvetica is allowed only inside the Swiss Modern preset's `:root` block. Verify by checking that any `Helvetica` mention is inside `:root { ... }`.)

### Forbidden colors (block)

| Color | Reason |
|---|---|
| `#6366f1` | Tailwind indigo-500. The single most overused "AI gradient" color. |
| Purple-on-white gradient | `linear-gradient(... #a855f7 ..., #ffffff ...)` and its variants are the textbook AI-startup landing-page look. |

Remediation: use the chosen preset's `--accent` and `--accent-hot` instead.

Grep check:

```
grep -i '#6366f1' <output.html>
grep -Ei '#[a-fA-F0-9]{6}.*linear-gradient.*#[a-fA-F0-9]{6}' <output.html>
```

### Hex colors outside :root (block)

All color values must be declared in the `:root { ... }` block and referenced via `var(--token)` elsewhere. Stray hex values scattered across element styles defeat the theming layer.

Grep check (pseudocode):

```
# Strip the :root { ... } block, then grep for hex
sed '/:root\s*{/,/^}/d' <output.html> | grep -E '#[0-9a-fA-F]{3,8}'
```

Remediation: move the hex to `:root` as a new variable, replace the inline value with `var(--name)`.

### Clamp negation bug (block)

CSS does not parse `calc(-1 * clamp(...))` correctly in all engines. The clamp function returned by `calc()` with a unary `-` prefix has historically caused layout breakage.

Forbidden:

```css
margin-left: calc(-1 * clamp(2rem, 4vw, 6rem));  /* DO NOT */
```

Remediation: define a positive clamp as a variable and use `var()` directly:

```css
:root {
  --side-pad: clamp(2rem, 4vw, 6rem);
  --side-pad-neg: calc(-1 * var(--side-pad));   /* OK, computed once */
}
.thing { margin-left: var(--side-pad-neg); }
```

### Emoji (warn unless explicitly requested)

Decks should not contain emoji unless the user prompt specifically asked for them. AI-generated decks tend to drop emoji into headings and bullets to feel "fun", which reads as low-effort.

Grep check:

```
# Heuristic: look for common emoji codepoint ranges in the HTML body
grep -P '[\x{1F300}-\x{1F9FF}\x{2600}-\x{27BF}]' <output.html>
```

Remediation: remove the emoji. If the user wanted them, leave them.

### Title/subtitle density (block)

A title slide must have exactly 1 `<h1>` and at most 1 subtitle paragraph. AI output frequently stacks 2-3 headlines on the title slide, breaking the visual hierarchy.

Grep check:

```
# For each <section class="slide slide-title">, count <h1> and <p class="subtitle">
```

Remediation: keep only the most important headline; demote the rest to the second slide.

### Bullet count (block)

A content slide's bullet list must have 4-6 items. Fewer than 4 looks padded with empty space; more than 6 cannot be read in one glance.

Remediation: split into two slides if too many; merge with another slide if too few.

### Lorem ipsum (block)

No placeholder text. If the user did not provide content for a section, ask via AskUserQuestion rather than fabricating filler.

Grep check:

```
grep -Ei 'lorem ipsum|dolor sit amet' <output.html>
```

## Output Format

A short text report listing any hits, by severity:

```
[forbidden-patterns] PASS
  - Fonts:        OK
  - Colors:       OK
  - Hex scatter:  OK
  - Clamp neg:    OK
  - Emoji:        OK (none found)
  - Densities:    OK (5 slides checked)
  - Lorem ipsum:  OK
```

Or, on failure:

```
[forbidden-patterns] FAIL
  - Hex scatter:  3 hex values outside :root (lines 142, 187, 203)
  - Bullet count: slide 3 has 9 bullets (max 6)
```

## Quality Standards

- The Verify step runs all 7 checks above.
- Block severity hits prevent delivery (Phase 5 not entered).
- Warn severity hits are reported but do not block.

## Verification Checklist

- [ ] Forbidden fonts check ran, no first-declared `Inter`/`Roboto`/`Arial` found.
- [ ] `Helvetica` only appears inside the Swiss Modern `:root`.
- [ ] `#6366f1` not found anywhere.
- [ ] No hex colors outside the `:root { ... }` block.
- [ ] No `calc(-1 * clamp(`.
- [ ] No emoji (unless user explicitly asked).
- [ ] Title slide has exactly 1 `<h1>` + at most 1 subtitle.
- [ ] Each content slide has 4-6 bullets where applicable.
- [ ] No "lorem ipsum" / "dolor sit amet" text.
