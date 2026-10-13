---
id: TASK-134
title: Add perfect-lineup records and retrospective start-sit regret
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:46'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 141000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Completed work measures historical starting accuracy and best possible weekly lineup potential, but managers do not have a clear perfect-lineup win-loss record or a weekly start/sit regret highlight. Build a retrospective view that connects lineup decisions to outcomes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 For each completed matchup, the report compares actual and optimal legal lineup points and indicates whether optimal management would change the result.
- [x] #2 The largest regret of each week identifies the manager, decision, points difference and matchup consequence.
- [x] #3 Position eligibility, lineup slots, scoring rules, incomplete rosters and sample coverage are respected.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve optimal player selections and explicit complete roster coverage in provider reports/snapshots. 2. Calculate actual vs unilateral and both-optimal outcomes, largest weekly legal selection regret. 3. Exclude incomplete/overridden scores, exercise lineup decisions UI and tests; document.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
44 tests pass including legal optimizer selections, position ineligibility, unilateral versus both-optimal outcomes, incomplete roster/override exclusion, decision DOM and provider regressions. Typecheck and owned-file lint pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added verified roster completeness and optimizer selections, actual/both-optimal records and weekly legal start-sit regret with consequences and explicit unavailable coverage.
<!-- SECTION:FINAL_SUMMARY:END -->
