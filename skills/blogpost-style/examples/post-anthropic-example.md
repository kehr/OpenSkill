---
title: What I learned debugging long-running agents
description: Three failure modes that show up only after an agent runs for hours, and the harness changes that caught them.
date: 2026-04-19 14:30
categories:
  - Engineering
tags:
  - agents
  - reliability
---

Over the past three months I worked on a coding agent that runs unattended for 8-to-24 hour sessions. Most of the bugs that mattered did not show up in the first hour. They only emerged once context grew, tools accumulated stale state, or the model started planning over its own earlier outputs.

This post explains three failure modes I would not have predicted from short-session testing, and the small harness changes that surfaced them.

## What does "long-running" actually break?

A **long-running agent** is one whose lifetime exceeds the model's effective attention window — the point at which earlier turns are summarized, evicted, or referenced indirectly through tool state rather than read directly.

Three things break first: context drift, tool-result staleness, and plan recursion. Each one has a clean reproduction at around the 4-hour mark in our harness; none reproduce reliably under 1 hour.

The interesting part is not that they break. It is that they break silently.

## Context drift

By hour four, roughly 60% of the model's earlier file reads have been compressed into one-line summaries. The model still references them by filename, but it is reasoning over the summary, not the file. We caught this by logging the SHA-256 of every file content the model claimed to be reasoning about, and diffing it against the actual file on disk.

In one session, the model edited a config file based on a six-hour-old summary that no longer matched reality. The edit was syntactically valid, semantically wrong, and the model expressed no uncertainty about it.

The fix: re-read on every reference older than 30 minutes. Cheap, and it eliminated this failure mode in 47 of 50 follow-up runs.

## Tool-result staleness

Long sessions accumulate tool outputs that look authoritative but are not. A `git status` from hour two is not the same as `git status` now. Models will happily quote the older one if it is closer in the context window.

We added a freshness tag to every tool result: `{"observed_at": "...", "tool": "...", "result": "..."}`. Then we instructed the model to re-invoke any tool whose result is older than the current task boundary. Staleness errors dropped from 12 per session to under 2.

## Comparing the three failure modes

| Failure | Median time to first occurrence | Detection cost | Fix complexity |
|---|---|---|---|
| Context drift | 3.8 hours | Hash-and-diff every reference | Re-read on staleness |
| Tool-result staleness | 2.1 hours | Freshness tags on tool outputs | Re-invoke on age |
| Plan recursion | 5.4 hours | Plan-tree depth limit | Refuse > depth N |

Plan recursion was the rarest but the hardest to recover from. The model would adopt one of its own earlier plans as a sub-goal and start expanding it again, sometimes three or four levels deep. The fix is a hard depth cap, not a smarter prompt — the model cannot reliably notice the recursion from inside.

## Where this approach breaks

Hash-and-diff assumes the underlying files are stable. For agents that watch streaming inputs (logs, message queues, real-time data), the same pattern produces false positives: every tick is a "new" version. We do not have a good answer for that case yet.

Freshness tags also assume the model will respect them. Smaller models ignore them about 30% of the time in our tests. The countermeasure is to enforce freshness in the harness, not in the prompt.

## Wrap-up

1. Treat every model reference to an earlier file as a hash claim, and verify it.
2. Tag tool outputs with observation time and force re-invocation past a task boundary.
3. Cap plan recursion depth in the harness — the model will not notice the loop from inside.
