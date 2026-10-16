---
id: TASK-159
title: Balance browser CI groups using observed spec durations
status: Done
assignee:
  - Codex
created_date: '2026-10-16 04:55'
updated_date: '2026-10-16 05:03'
labels: []
dependencies: []
references:
  - docs/pr-testing-speed-plan.md
type: chore
ordinal: 166000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The four browser shards currently have uneven runtime: the slowest takes about seven minutes while others take two to three minutes. Redistribute the existing spec files so the same coverage completes sooner without increasing per-runner contention.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every existing functional browser case runs exactly once across four isolated macOS groups; both cold performance cases and all existing screen sizes, assertions and PNG baselines remain intact.
- [x] #2 Future unassigned browser spec files remain included automatically and invalid group selections fail rather than silently omitting tests.
- [x] #3 Hosted PR verification passes and its total and per-group timings are compared with the prior sharded runs.
- [x] #4 Maintained testing documentation and the operations contract explain group assignment, evidence and rebalancing.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Use recorded per-spec durations to distribute whole spec files across four groups. 2. Configure mutually exclusive selection with automatic inclusion of new specs in group four, retaining one worker and local defaults. 3. Verify test identity equality, fallback behavior and static checks. 4. Commit/push, monitor hosted PR verification and record measured results.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented duration-balanced whole-file selection using median spec durations from three hosted runs. Estimated test loads: 221.0, 227.4, 227.1 and 222.7 seconds. Local discovery confirms all 164 functional identities exactly once (40/31/55/38 cases), two cold performance cases retained, future unassigned probe spec appears only in group four, and five malformed group values fail configuration. Formatting, lint and TypeScript pass. Hosted timing verification pending.

Hosted run 38853261038 at 48eee63 passed all seven jobs in 5m03s. Browser groups completed in 4m07s, 4m48s, 3m19s and 3m04s. Retained JSON reports exactly match all 164 pre-change functional identities, with zero skipped, unexpected or flaky cases. Both cold performance cases and quality passed. This is 37% faster than the previous automatic 8m02s run and 31% faster than the initial sharded 7m21s run; timing remains host-dependent.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Distributed whole browser spec files by observed median duration, preserving one worker per runner, all 164 functional cases, both cold performance cases and macOS PNG baselines. New specs fall into group four and invalid selections fail. Local coverage/fallback validation and static checks passed; hosted run 38853261038 passed without browser retries in 5m03s, versus 8m02s before balancing. TASK-158 records the separately requested future Ubuntu trial.
<!-- SECTION:FINAL_SUMMARY:END -->
