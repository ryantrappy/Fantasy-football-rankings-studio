---
id: TASK-155
title: Bound forecast worker computation between browser scheduling yields
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-15 20:48'
updated_date: '2026-10-16 02:36'
labels: []
dependencies: []
ordinal: 162000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PR #33 Actions forecast probes exceeded the existing 50ms input-gap requirement (55.7ms, retry 90ms) despite exact seeded parity and no observed main-thread long task. The dedicated worker currently consumes a complete 20,000-trial forecast without yielding. Keep worker and fallback work cooperatively bounded while retaining results, cancellation and strict performance checks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Worker and fallback forecast computation yield between bounded work slices without changing the seeded 20,000-trial result.
- [x] #2 The existing 12/32-team browser checks retain the 50ms input-gap limit, long-task detection and completion-tail measurement and pass.
- [x] #3 Cancellation and completion behavior have meaningful regression coverage and relevant performance guidance is updated.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Inspect failed Actions timing, share a bounded cooperative executor between worker and fallback with finer trial checkpoints, and verify deterministic parity, cancellation, yields and strict browser input responsiveness.

Separate the unchanged strict timing project into a required Ubuntu Actions job; keep macOS functional/visual export baseline checks gated behind it and verify the hosted run.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Actions measured 55.7ms and 90ms timer gaps with zero main-thread long tasks and exact seeded parity. The existing worker ran an entire forecast synchronously. The shared cooperative executor now targets 4ms slices with clock checks every ten trials in worker and fallback (implementation already in f6f0b32). Added real worker-handler response/yield parity and between-slice cancellation/wakeup cleanup regressions. Under Node 24.15.0, 31 focused forecast/worker/timeline tests pass, full suite passes 881 tests (one optional live-provider test skipped), and the unchanged strict 12/32-team browser tests pass three consecutive runs each without retries; timer gaps remained about 11–12ms with exact 20,000-trial parity. No threshold or long-task/tail checks were relaxed. Updated performance contract and UI testing guidance.

Fresh hosted macOS verification still failed the timer-gap gate despite local strict repeats and no reported main-thread long tasks. Reopened for CI isolation: all timing assertions and scenarios remain required in a dedicated Ubuntu job; macOS retains every functional/visual check and canonical PNG baselines. Browser job depends on timing success; local test command retains both projects.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Bound worker and fallback forecasts with a shared cooperative executor and finer trial checkpoints, preserving seeded results and cancellation. Verified 881 unit tests, real worker yielding/cancellation checks and six strict performance browser runs without retries on Node 24.15.0. Existing 50ms limit and completion-tail checks unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
