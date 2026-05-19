# Style Discovery Requirements (Phase 2)

## Purpose

Map the user's mood preference to three concrete style presets and generate three real single-slide HTML previews so the user can pick visually rather than from a text description.

## Input

- The four answers from Phase 1.
- `specs/style-presets.md` (the 5-preset catalog).

## Processing Rules

1. Ask the user for a mood via `AskUserQuestion`:
   - Question: "What's the vibe?"
   - Options: `Bold & confident` / `Calm & editorial` / `Minimal & professional` / `Technical & playful`
   - `multiSelect: true`, accept up to 2 selections.
2. Use the table below to map the chosen mood(s) to three preset candidates. If the user picked two moods, pick one preset from each plus one "bridge" preset:

| Mood | Primary preset | Bridge preset |
|---|---|---|
| Bold & confident | Bold Signal | Terminal Green |
| Calm & editorial | Notebook Tabs | Pastel Geometry |
| Minimal & professional | Swiss Modern | Bold Signal |
| Technical & playful | Terminal Green | Pastel Geometry |

If only one mood, take its primary + bridge + the next adjacent preset in the catalog (cycle: Bold Signal -> Notebook Tabs -> Swiss Modern -> Terminal Green -> Pastel Geometry -> Bold Signal).

3. For each of the three chosen presets, render a single-slide preview HTML to `.claude-design/slide-previews/style-{a,b,c}.html` using `templates/preview-template.html.hbs` as the structural skeleton. Each preview must:
   - Be a complete standalone HTML file (~80-120 lines, all CSS inlined).
   - Display the deck's working title (from the user prompt) as the slide title.
   - Apply the preset's full `:root` block, fonts, and at least one signature element (e.g. tab strip for Notebook Tabs, scanline overlay for Terminal Green).
   - Render correctly at 1920x1080 fullscreen.

4. After writing the three preview files, invoke `open` (macOS) / `xdg-open` (linux) / `start` (win32) on each in sequence so they show up in the user's browser.

5. Ask the user via `AskUserQuestion`:
   - Question: "Pick a preview, or mix elements?"
   - Options: `Preview A: <preset name>` / `Preview B: <preset name>` / `Preview C: <preset name>` / `Mix elements (describe in next message)`

6. If the user picks `Mix elements`, ask a follow-up free-text question for the mix instruction and store it as `style_mix_notes` in memory.

## Output Format

Three preview HTML files at `.claude-design/slide-previews/style-{a,b,c}.html`, plus in-memory state:

```
{
  "preset_selected": "Bold Signal" | "Notebook Tabs" | "Swiss Modern" | "Terminal Green" | "Pastel Geometry" | "mix",
  "style_mix_notes": "<free text or null>"
}
```

## Quality Standards

- Each preview file is ~50-120 lines, fully standalone.
- Each preview applies its preset's color tokens via `:root` only (no hex hardcoded in element attributes).
- Each preview includes the preset's signature decoration (visible in the rendered output).
- All three previews must successfully open in the user's default browser (no broken paths, no permissions errors).

## Verification Checklist

- [ ] AskUserQuestion called for mood selection.
- [ ] Three preview HTML files exist on disk before the second AskUserQuestion fires.
- [ ] Each preview's first 200 chars contain the preset name as a comment so we can verify the right preset was used.
- [ ] User's final selection is captured (preset name or "mix" + notes).
- [ ] If `mix` was chosen, `style_mix_notes` is non-empty.
