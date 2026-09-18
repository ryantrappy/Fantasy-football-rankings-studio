---
id: TASK-57
title: Load next-week projections at the first playoff-round boundary
status: Done
assignee:
  - Codex
created_date: '2026-09-15 18:15'
updated_date: '2026-09-15 18:18'
labels: []
dependencies:
  - TASK-56
priority: medium
type: bug
ordinal: 60000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Discovered while auditing forecast accuracy: both provider loaders stop requesting projections at the end of the fantasy regular season, so the first playoff round cannot use current roster/injury-aware provider estimates even at the latest pre-playoff cutoff.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ESPN and Sleeper request active next-week projections at the first playoff-round boundary.
- [x] #2 Historical seasons, older cutoffs and later postseason snapshots do not leak into the pre-playoff forecast.
- [x] #3 Regression tests cover the boundary and changes are documented.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Permit active next-week projection requests through the first fantasy playoff week in each provider adapter. Add provider-boundary regression tests plus historical/later-week exclusion tests. Keep the simulator's week-specific projection path from TASK-56. Document and commit separately.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Medium bug found during TASK-56, recorded per user instruction.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Both provider loaders now retrieve active next-week projections through the first playoff round. ESPN requires available schedule settings; both adapters stop after this boundary and reject historical-season snapshots. Added six provider regression cases (current boundary, later round, historical season) and documented first-round-only behavior. Validation: 22 provider/simulator tests passed; typecheck, lint and diff checks passed. TASK-56 includes first-round simulation use and retrospective cutoff protection.
<!-- SECTION:FINAL_SUMMARY:END -->
