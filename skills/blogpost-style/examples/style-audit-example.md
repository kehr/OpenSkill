# Style Audit: 2026-04-19-Agentic-roadmap.md

**Track**: anthropic
**File**: `_posts/2026-04-19-Agentic-roadmap.md`
**Audited at**: 2026-04-19 14:00

## Summary

- **Errors**: 3 — must fix
- **Warnings**: 5 — should fix
- **Info**: 2 — consider fixing
- **Verdict**: NEEDS-REVISION

The post has solid structural bones but several capability claims appear without numbers or limits, and three section headings still use marketing nouns. Fix the unbacked claims first; the headings are a quick mechanical pass.

## Findings

### Errors

- **caveat-required** — line 47: "Agents will fundamentally transform how we build software" is a capability claim with no number and no limit. Fix: replace with a concrete delta or scope ("On `swe-bench-verified` our agent solves 41% of tasks, up from 28% on the prior release") or remove the sentence.
- **forbidden-words/marketing-noun** — line 12 (heading): "范式革命" appears in the H2. Fix: replace with a question-form heading such as "Agent 架构的边界在哪里？" or a short noun phrase such as "Agent 架构现状".
- **single-metaphor** — lines 22 and 89: two unrelated core metaphors ("AI 显微镜" and "数字大脑") appear in the same post. Fix: keep one (recommend "AI 显微镜" since it appears in three sections), remove the other.

### Warnings

- **opening-template** — line 1: opening starts with "随着 AI 浪潮的兴起", which matches a forbidden industry-narrative opening. Suggestion: rewrite as an experience opening ("Over the past N months I worked on X") or three-question opening.
- **first-person/we** — line 56: "we believe revolutionary changes are coming" pairs `we` with a non-action verb plus a forbidden word. Suggestion: rewrite to action verb pattern ("We tested X on N tasks and observed Y").
- **paragraph-rhythm** — lines 30-44: four consecutive paragraphs of 5-6 sentences each. Suggestion: break one into a one-sentence emphasis paragraph for rhythm.
- **closing-converges** — last paragraph: closes with "this is the dawn of a new era". Suggestion: replace with 2-3 actionable principles extracted from the body.
- **heading-noun** — line 71: "革命性的工具调用" includes "革命性的". Suggestion: drop the modifier; let the section content carry the claim.

### Info

- **table-recommended** — section "对比三种方案" enumerates three options across four dimensions in prose. Consider converting to a markdown table.
- **bold-on-definition** — first mention of "harness" on line 18 is not bolded. Consider bolding on first use per Anthropic style.

## Track-specific checks

- [ ] Opening matches one of the three allowed templates
- [ ] No section heading uses `第N章` / `Chapter N` style numeric prefix
- [x] Every key term defined on first use
- [ ] At most one core metaphor, appearing in 2+ sections
- [ ] Every capability claim has a number or a limit in the same or next sentence
- [ ] Closing converges to 2-3 principles, no "paradigm revolution" rhetoric
- [ ] No marketing nouns in headings

## Forbidden Words

| Word | Line | Category | Suggested replacement |
|---|---|---|---|
| 范式革命 | 12 | Industry grand-narrative | Delete the heading; replace with question form |
| 数字大脑 | 89 | Marketing metaphor | "语言模型" or "推理引擎" |
| 革命性的 | 71 | Hyperbolic adjective | Delete the modifier |
| revolutionary | 56 | English marketing filler | Replace with concrete delta |
| 颠覆 | 103 | Hyperbolic verb | "把 X 从 A 提升到 B" with numbers |

## Recommended Next Step

Run `/blogpost-style rewrite _posts/2026-04-19-Agentic-roadmap.md --track anthropic` to apply the forbidden-word replacements and heading rewrites automatically; manual revision is required for the three caveat-required claims because each needs a number sourced from the author's own measurements.
