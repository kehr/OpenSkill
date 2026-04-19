# Style: Anthropic

## Purpose

Define the Anthropic engineering-blog voice. Reference articles are listed below.

## Voice Profile

Personal-but-institutional research voice. Reads like a lab explaining a finding to engineers who already know the basics. Patient with terminology, blunt about limits, allergic to PR adjectives.

## Reference Articles

The processing rules below are derived from the following posts. When in doubt about an edge case, defer to the patterns these articles use.

| Article | URL | What it anchors |
|---|---|---|
| Built a multi-agent research system | https://www.anthropic.com/engineering/built-multi-agent-research-system | Experience-driven opening, "harness as nervous system" extended metaphor, blunt limitations section |
| Tracing the thoughts of a large language model | https://www.anthropic.com/research/tracing-thoughts-language-model | Question-form headings, "AI microscope" core metaphor reused across sections, term-defined-on-first-use discipline |
| On the biology of a large language model | https://www.anthropic.com/research/on-the-biology-of-a-large-language-model | Long-form research recap, every capability claim paired with a scenario where it fails |
| Claude Code best practices | https://www.anthropic.com/engineering/claude-code-best-practices | Engineering guide voice, principles-based wrap-up (numbered list of 2-5 actionable lessons) |

## Processing Rules

1. **Opening**: Start with experience or a question, never with industry-scale narrative. Templates:
   - "Over the past N months / weeks I worked on X. Here is what I observed."
   - "When you {do specific task}, you immediately hit {specific friction}. This post explains why."
   - Three concrete questions, then the post answers them in order.
   Forbidden openings: "Since ChatGPT went viral", "AI is undergoing a paradigm shift", "We are entering a new era".

2. **Section headings**: Question form (`Does X actually do Y?`) or short noun phrase (`Memory and retrieval`). No numeric chapter prefixes. No marketing nouns ("revolution", "evolution", "transformation").

3. **Term handling**: First mention of every key term gets a one-clause inline definition. After definition, use one consistent term throughout. Do not toggle between near-synonyms (e.g., pick one of "Agent" / "智能体" / "自主智能体" and stick with it).

4. **First person**: `we` / `I` / `我` are allowed but only with action verbs: `we observed`, `we recommend`, `we tested`. Forbidden: `we believe revolutionary`, `we passionately envision`.

5. **Caveat placement**: Every capability claim is followed in the same sentence (or the immediately next sentence) by either a number or a limit. Pattern: "X works in {scenario A}, but degrades in {scenario B}." or "X improves Y by {N%} on {benchmark}."

6. **Metaphor**: At most one core metaphor (e.g., "AI microscope", "Harness as the nervous system"). Use it in two or more sections so the reader builds an extended mental model. Delete any second metaphor.

7. **Paragraph rhythm**: Mix short and long. Key judgements get their own one-sentence paragraph for emphasis. Avoid more than two consecutive paragraphs of similar length.

8. **Closing**: Converge to two or three principles or methods. Do not write a "this is a paradigm revolution" peroration. The last sentence should be useful, not dramatic.

9. **In-text emphasis**: Bold for the term being defined. Italics rarely. No emoji.

## Output Format

Follow [templates/post-anthropic.md](../templates/post-anthropic.md). Reference quality at [examples/post-anthropic-example.md](../examples/post-anthropic-example.md).

## Verification Checklist

- [ ] Opening matches one of the three allowed templates
- [ ] No section heading uses `第N章` / `Chapter N` style numeric prefix
- [ ] Every key term defined on first use
- [ ] At most one core metaphor, appearing in 2+ sections
- [ ] Every capability claim has a number or a limit in the same or next sentence
- [ ] Closing converges to 2-3 principles, no "paradigm revolution" rhetoric
- [ ] No marketing nouns in headings
