---
id: TASK-13
title: Suggest things to write about
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 04:45'
updated_date: '2026-09-09 16:45'
labels: []
dependencies: []
priority: medium
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Automatically generate context about a users team and provide that in the power rankings generator screen. Use that context and tanstack AI to talk to the users LLM to determine what to actually suggest talking about. The goal are notable trends in the user's team or trades/pickups that went well or poorly. It can also include general depth talk regarding the total team or positions. The LLM used should be configurable and ideally would auto discover what clis it has access to and use those if approved
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a factual context panel to the ranking editor for the selected team/week: recent scoring/median trends, graded positive/negative moves and observed positional depth, using owner-verified league data capped to the ranking week.
2. Integrate TanStack AI's Codex and Claude Code adapters in host-login mode. Discover known CLI executables from server PATH without executing them; expose provider availability. Require a server administrator allowlist of providers and authorized Auth0 subjects plus explicit per-generation UI consent before CLI use.
3. Allow provider/model selection in the panel. Generate a short, editable suggestion text from bounded verified context, with no automatic mutation of ranking prose. Use a fresh scratch working directory, restricted tool/sandbox settings, sanitized environment, timeouts and per-account concurrency limits.
4. Test ownership, missing consent/enablement, selection, stale context, future-week exclusion and adapter failure/retry with mocks (no live CLI calls without approval). Verify editor DOM flow, build/typecheck/lint and document deployment configuration and CLI account semantics.

Installed harness adapters currently require the larger TanStack sandbox lifecycle and use a different Codex CLI contract than the locally installed executable. Use a small TanStack AI text adapter over explicitly spawned, restricted CLI commands instead; this preserves the planned provider selection/approval model while avoiding incompatible harness defaults. Remove unused harness adapter dependencies.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented factual team/week context, TanStack AI CLI adapter, server provider/user allowlists, model selection and per-generation consent. Context excludes future weeks and pending requests cannot replace a newly selected team's context. Added ownership/consent/failure/retry/concurrency and UI regression coverage. Full suite: 151 tests passed; two additional stale-context/concurrency tests passed in focused suite. Typecheck, lint and production build passed. CLI execution is mocked; deployment must install/login and enable providers/users explicitly.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Adds optional writing suggestions to the rankings editor using verified scoring, move and observed-depth context. Supports discovered Codex/Claude CLI providers through TanStack AI, configurable models, explicit consent, restricted execution and editable suggestions. README documents configuration and server-account semantics. Regression checks and production build pass.
<!-- SECTION:FINAL_SUMMARY:END -->
