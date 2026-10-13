---
id: TASK-132
title: Compare draft picks with draft position and measure manager draft skill
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:41'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 139000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Existing hindsight draft analysis can identify misses, but managers cannot review best and worst picks together or see whether their drafting consistently beats expectations across seasons. Add pick-level value and a multi-year manager draft-skill summary.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each pick is compared with an explicit draft-position or ADP expectation using season production and league scoring.
- [x] #2 Best and worst picks are browseable by manager and season with the comparison baseline and coverage.
- [x] #3 Multi-season drafting skill aggregates comparable picks and shows sample size; missing ADP or draft data is not guessed.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Load completed historical Sleeper draft picks, explicitly report unavailable ESPN/ADP. 2. Compare league-scored production with nearby overall pick cohort on fully observed season weeks. 3. Browse manager best/worst and cross-season skill by compatible format with sample sizes; test and document.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified official Sleeper draft contract; 26 tests pass including historical draft read, production gaps, format exclusion, stable cross-season aggregation and DOM output. Typecheck passes. ESPN/ADP unavailable explicitly.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added actual historical Sleeper picks and explicit nearby-pick production expectation, manager best/worst browsing and compatible multi-season skill with sample coverage.
<!-- SECTION:FINAL_SUMMARY:END -->
