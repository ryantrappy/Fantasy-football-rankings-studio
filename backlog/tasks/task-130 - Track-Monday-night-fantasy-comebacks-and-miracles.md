---
id: TASK-130
title: Track Monday night fantasy comebacks and miracles
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:37'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 137000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Completed matchup results do not reveal dramatic comeback stories. Identify Monday-night wins after a low pre-game win probability, such as entering Monday below a configurable threshold, using trustworthy in-game scoring or archived projection data.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Qualifying comeback games show the pre-Monday probability, final outcome, players contributing and data source.
- [x] #2 Thresholds are configurable or clearly stated, and incomplete live/probability data is not inferred.
- [x] #3 Users can browse league-wide and manager-specific comeback records by season.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add validated archive contract and real JSON import, preserve it in snapshots. 2. Calculate verified Monday comeback wins and browse by manager/season. 3. Verify archive validation, calculation and UI with tests; document.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified 35 tests across archive import/UI, calculation, provider loading and report snapshots; typecheck passes. User-supplied provenance explicit; export provides deliberate persistence, no retrospective probability inference.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added configurable Monday comeback browsing from validated real archive input, export and snapshot roundtrip contract; preserves raw transaction coverage. Tests and typecheck pass.
<!-- SECTION:FINAL_SUMMARY:END -->
