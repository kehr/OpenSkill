---
title: [Method or finding name, no marketing language]
description: [One sentence summarizing the contribution, suitable for an abstract]
date: [YYYY-MM-DD HH:MM]
categories:
  - [Research]
tags:
  - [tag1]
  - [tag2]
---

[Opening sentence: state the method or finding in one line. Should be quotable on its own. Templates: "We train X to do Y when Z." / "We introduce X, a {short noun} for Y." / "Reward models are predominant in X. They quietly do Y. This comes at a cost: Z."]

[Optional second sentence: contextualize the contribution against prior work in one clause.]

## Motivation

[State the problem and why prior approaches fall short. Use `we` plural: "We observe that ...", "We argue that ...". Define every key term with a one-clause appositive on first mention. Pattern: "**scheming**, where an agent pursues a hidden goal while strategically concealing this pursuit, is increasingly relevant as ..."]

[Subordinate clauses carry technical detail. Keep paragraphs dense.]

## Approach

[Describe the method. Tool / function names use backticks: `report_scheming()`, `<scheming_thought>`. Equations may be inline or block. Reference any diagrams by label.]

```[language]
[pseudocode block if applicable, with language hint]
```

[Explain key design choices in 2-4 sentences. State assumptions explicitly.]

## Results

[Lead with the headline number against a named benchmark and baseline. Pattern: "On {benchmark}, {method} reaches N% (baseline: M%)."]

| [Setting] | [Baseline] | [Ours] | [Delta] |
|---|---|---|---|
| [Row] | [N%] | [N%] | [+/- N pp] |

[Prose interpretation in 2-4 sentences. Note where the gain is largest, where it disappears.]

## Conclusion

[One paragraph stating the contribution and its scope. Use `we`: "We have shown that ...". Avoid CTA, price, availability.]

### Limitations

[Concentrate every limitation here. Each item names a concrete scenario where the method fails or is weak.]

- [Limitation: "Today X learns a single Y per Z, which works well when {condition} but can be too coarse for {edge case}."]
- [Limitation: "X assumes {assumption}. When {assumption violated}, X reduces to {fallback}."]
- [Limitation: "We did not evaluate X on {domain}; results may not transfer."]

## Acknowledgments

[We are grateful to {names} for {kind of help}. We thank {names} for {feedback / discussions / infrastructure}. If none: "No acknowledgments to declare."]
