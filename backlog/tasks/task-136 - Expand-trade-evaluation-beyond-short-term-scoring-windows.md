---
id: TASK-136
title: Expand trade evaluation beyond short-term scoring windows
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 19:16'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 143000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Current trade grades compare short post-trade player scoring and explicitly do not value picks or long-term dynasty context. Add complementary trade analytics based on starts actually made and championship contribution, keeping the evidence and limitations visible rather than declaring a simplistic winner.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Trade reports distinguish observed points, starts actually made and documented playoff or championship contribution.
- [x] #2 Each view shows its evaluation window, data coverage and limitations; draft picks and future value are not fabricated.
- [x] #3 Close or context-dependent outcomes can remain unranked instead of forcing a winner.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Calculate acquired asset observations and actual starts from following week through completed cutoff or next movement. 2. Join explicitly verified postseason game weeks and championship roster results without assigning speculative winners. 3. Render evaluation windows/coverage with tests and docs; verify all moments checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
58 tests pass across all moments, provider load, legal optimizer and snapshot regressions. Verified observed-vs-starting-vs-playoff contribution, strict windows, missing evidence, championship result and DOM context. Typecheck and owned lint pass. TASK-127 verified playoff metadata supplied by parallel competition work during integration.

Review repair: recipient champion result is explicitly separate from asset championship membership; dropped-before-playoffs regression proves no roster attribution. Duplicate/missing weeks and nonfinite totals/player/optimal scores remain unknown rather than zero/ties. Full playoff metadata fixture supports combined TASK-127 types. 62 focused/regression tests, typecheck, owned lint and owned docs formatting pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added extended acquired-player roster points, actual starts, verified postseason contributions and separate recipient season results. Windows and coverage remain explicit; missing/ambiguous evidence is unknown and outcomes remain context-dependent.
<!-- SECTION:FINAL_SUMMARY:END -->
