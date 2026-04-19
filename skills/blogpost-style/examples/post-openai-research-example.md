---
title: Self-reported tool budgets reduce overuse without hurting task success
description: We train models to declare a tool-call budget before acting and find that declared budgets cut average tool calls by 38% with no loss in benchmark accuracy.
date: 2026-04-19 09:00
categories:
  - Research
tags:
  - agents
  - tool-use
---

We train language models to predict, before taking any action, how many tool calls a task will require, and we show that this self-reported budget reduces tool overuse without degrading task accuracy on three agentic benchmarks.

## Motivation

Agentic models often invoke tools redundantly. We observe that on `swe-bench-verified`, our baseline agent issues a median of 14 tool calls per task, while the median solved task requires only 6. The remaining calls are either re-reads of files already in context or speculative searches that do not change the final patch.

Existing approaches penalize tool calls in the reward signal, which we find too coarse: it suppresses calls uniformly, including the ones that genuinely advance the task. We argue that the model can predict its own needs more precisely than a fixed penalty allows, if we train it to declare those needs in advance.

We introduce **declared budgets**, where the model emits a structured `<budget>{"max_tool_calls": N}</budget>` token at the start of every task and is then constrained by the harness to that budget.

## Approach

The harness wraps every task with two phases. In the planning phase, the model reads the task and emits a `<budget>` block. In the execution phase, the harness exposes a `tool_calls_remaining` counter and rejects calls beyond the declared limit.

```python
def run_task(task):
    plan = model.generate(task, stop="</budget>")
    budget = parse_budget(plan)
    remaining = budget
    while remaining > 0 and not done(task):
        action = model.generate(task, tools_remaining=remaining)
        observation = execute(action)
        remaining -= 1
    return finalize(task)
```

We train the budget head with a two-term loss: a calibration term that penalizes |declared - actual| on solved tasks, and a coverage term that penalizes declared budgets too low to ever reach a solution.

## Results

On three benchmarks, declared budgets cut average tool calls substantially while leaving task success within the noise floor of the baseline.

| Benchmark | Baseline calls | Declared-budget calls | Baseline accuracy | Declared accuracy |
|---|---|---|---|---|
| swe-bench-verified | 14.2 | 8.8 (-38%) | 41.3% | 41.0% (-0.3 pp) |
| webarena | 22.6 | 14.1 (-38%) | 28.1% | 27.9% (-0.2 pp) |
| terminal-bench | 9.4 | 6.0 (-36%) | 52.0% | 51.6% (-0.4 pp) |

We find the gain is largest on tasks the model is confident about: when declared budget is at most 5, the model hits its declaration 89% of the time. For high-budget tasks (declared >= 20), calibration drops to 61%, suggesting the model under-estimates difficulty for long tasks.

## Conclusion

We have shown that asking a model to commit to a tool budget before acting is a low-cost intervention that reduces redundant tool use by roughly a third across three benchmarks, without sacrificing task accuracy. The mechanism is simple enough to apply to any agent harness that exposes a tool-call counter.

### Limitations

- Today the budget is a single integer per task, which works well when the task decomposes into one main objective but can be too coarse for tasks with multiple loosely-coupled subgoals (e.g., multi-repo refactors).
- We did not evaluate on tasks where tool calls have very heterogeneous cost (some tools take 100 ms, others 30 s). A call-count budget under-prices slow tools.
- Calibration degrades on long-budget tasks; the model under-estimates difficulty. We expect this is fixable with a richer calibration signal but have not yet tested.
- Our experiments use a single model family. We have not measured whether declared-budget training transfers across model scales.

## Acknowledgments

We are grateful to the agent-eval team for benchmark infrastructure, to reviewers from the alignment team for early feedback on the budget-head design, and to the harness team for the `tool_calls_remaining` counter.
