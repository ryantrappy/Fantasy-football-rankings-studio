---
id: TASK-155
title: Bound forecast worker computation between browser scheduling yields
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-15 20:48'
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
- [ ] #1 Worker and fallback forecast computation yield between bounded work slices without changing the seeded 20,000-trial result.
- [ ] #2 The existing 12/32-team browser checks retain the 50ms input-gap limit, long-task detection and completion-tail measurement and pass.
- [ ] #3 Cancellation and completion behavior have meaningful regression coverage and relevant performance guidance is updated.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Inspect failed Actions timing, share a bounded cooperative executor between worker and fallback with finer trial checkpoints, and verify deterministic parity, cancellation, yields and strict browser input responsiveness.
<!-- SECTION:PLAN:END -->
