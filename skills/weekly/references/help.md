# Weekly Skill Help

## Dynamic Status Report

When help is triggered, display a dynamic status report based on current state.

### Steps

1. **Greet user** by name (from user.md)

2. **Show available commands** with current readiness status:

```
Weekly Skill Commands:
  summarize    -- Fetch and summarize team reports     [Ready]
  aggregate    -- Team overview with risk analysis     [Ready]
  generate     -- Your personal weekly report          [Ready / Needs style profile]
  learn-style  -- Build your writing style profile     [Not started / Done]
  configure    -- Change settings                      [Configured / Using defaults]
  help         -- This guide
```

Readiness checks:
- summarize: always Ready
- aggregate: Ready if summarize output exists for current week, otherwise "Run summarize first"
- generate: Ready if profile/ exists, otherwise "Needs style profile"
- learn-style: "Done" if profile/ exists, "Not started" otherwise
- configure: "Configured" if user config.json exists, "Using defaults" otherwise

3. **Show current config summary**:
   - Senders: {count} configured (or "all")
   - Keyword: {keyword}
   - Language: {language}
   - Output dir: {output_dir}

4. **Show memory status**:
   - Profile: exists / not built
   - Team context: {N} members known / not initialized
   - History: {N} weeks recorded

5. **Suggest next action** based on state:
   - No config -> "Start with `configure` to set your sender list"
   - No profile -> "Run `learn my style` to personalize your reports"
   - All ready -> "Say `summarize this week` to get started"
   - Has current week output -> "Run `aggregate` or `generate my report`"

## First-Time User Flow

For new users (no user.md exists), help should explain:

1. What this skill does (one sentence)
2. Recommended setup order: configure -> learn-style -> summarize -> aggregate -> generate
3. Minimum to get started: just run `summarize` (config and style are optional enhancements)
