---
id: TASK-144
title: Use single-week playoff scores for all-time scoring highs
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 20:14'
updated_date: '2026-10-13 20:15'
labels:
  - historical-analytics
dependencies: []
type: bug
ordinal: 151000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Two-week playoff series totals appear alongside single-week matchups in highest combined scores, inflating all-time scoring records.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Combined scoring highs compare actual individual weeks, including each week of multiweek playoff series.
- [x] #2 Individual weekly highs remain weekly, while closest games and blowouts retain series totals.
- [x] #3 Regression tests cover weekly splitting, invalid weekly data, and category switching; explanatory copy describes the scoring basis.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add weekly record mode that expands verified playoff series using unique finite completed weekly scores. 2. Use weekly mode for combined scoring highs and clarify labels. 3. Verify calculation regressions, category switching, and relevant static checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified 28 tests across nine focused competition and record-book test files, including DOM category switching. Typecheck, targeted lint, and git diff --check pass. Updated record-book explanation and category label to document single-week combined scoring.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Combined scoring highs now split multiweek playoff series into actual weekly scores, preserving individual weekly highs and aggregate matchup margin records. Missing, duplicate, or nonfinite weekly scores are omitted. Verified with 28 focused tests, typecheck, lint, and diff checks.
<!-- SECTION:FINAL_SUMMARY:END -->
