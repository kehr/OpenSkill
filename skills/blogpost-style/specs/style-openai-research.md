# Style: OpenAI Research

## Purpose

Define the OpenAI alignment / research blog voice. Reference articles are listed below.

## Voice Profile

Compressed academic-paper voice. Reads like an arXiv abstract + extended notes. Heavy `we` plural, dense subordinate clauses, dedicated Limitations section, Acknowledgments at the end.

## Reference Articles

The processing rules below are derived from the following posts. When in doubt about an edge case, defer to the patterns these articles use.

| Article | URL | What it anchors |
|---|---|---|
| Self-incrimination | https://alignment.openai.com/blog/self-incrimination | One-sentence method opening, declarative findings as section headings, dense `we` plural |
| ARGO | https://alignment.openai.com/blog/argo | Method-paper structure (Motivation -> Approach -> Results -> Conclusion), backticked tool / function names, parallel sentence construction |
| Model spec evals | https://alignment.openai.com/blog/model-spec-evals | Evaluation-paper conventions, table-heavy Results section, concentrated Limitations subsection |

## Processing Rules

1. **Opening**: One sentence stating the method or finding. Templates:
   - "We train X to do Y when Z."
   - "Reward models are predominant in X. They quietly do Y. This comes at a cost: Z."
   - "We introduce X, a {short noun} for Y."
   The opening should be quotable on its own.

2. **Section structure**: Use the four-section academic skeleton: `Motivation` -> `Approach` -> `Results` -> `Conclusion`. Inside `Conclusion`, include a `Limitations` subsection. Headings MAY also be declarative findings (`Self-incrimination outperforms blackbox monitoring`) when one section has a clear takeaway.

3. **First person**: `we` plural is mandatory and dense. Patterns: `We find that ...`, `We show that ...`, `We view X as ...`, `We argue that ...`. Avoid `I` and `you`.

4. **Term handling**: First mention of every term gets a definitional appositive. Pattern: "scheming, where an agent pursues a hidden goal while strategically concealing this pursuit". Tool / function names use backticks: `report_scheming()`, `<scheming_thought>`.

5. **Caveat handling**: Limitations are concentrated in the dedicated `Limitations` subsection of `Conclusion`. Each limitation cites a concrete scenario where the method fails or is weak. Pattern: "Today X learns a single Y per Z, which works well when {condition} but can be too coarse for {edge case}."

6. **Sentence construction**: Subordinate clauses carry technical detail. Parallel structures emphasize comparisons: "interpretable and steerable by construction, but only minimally calibrated". Rhetorical questions are allowed to advance the argument: "What do our reward models learn and what behaviors do they teach our models?"

7. **Closing**: Two parts. First, a `Conclusion` paragraph stating the contribution and its scope. Second, an `Acknowledgments` block: "We are grateful to {names} for {kind of help}." No CTA, no price, no availability section.

8. **Diagrams and equations**: If included, label them and reference them in prose. Inline math allowed. Pseudocode in fenced blocks with language hint.

## Output Format

Follow [templates/post-openai-research.md](../templates/post-openai-research.md). Reference quality at [examples/post-openai-research-example.md](../examples/post-openai-research-example.md).

## Verification Checklist

- [ ] Opening sentence states method or finding in one line
- [ ] Sections include Motivation, Approach, Results, Conclusion
- [ ] Conclusion contains a Limitations subsection
- [ ] First-person `we` density: at least one `we` per section
- [ ] Every key term has a definitional appositive on first mention
- [ ] Tool / function names wrapped in backticks
- [ ] Each limitation cites a concrete failure scenario
- [ ] Acknowledgments block at the end (or explicit "no acknowledgments to declare")
- [ ] No CTA / price / availability content
