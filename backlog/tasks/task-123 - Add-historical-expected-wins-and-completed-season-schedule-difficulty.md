---
id: TASK-123
title: Add historical expected wins and completed-season schedule difficulty
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:38'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 130000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
League history already shows all-play rate and a luck index, and Season Insights covers remaining schedule strength. Add season-level historical context: expected wins derived from weekly scoring percentile, opponent scoring difficulty, and an alternate-schedule comparison that shows how each manager would have finished with another manager’s schedule.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each manager season shows expected wins alongside actual wins, with the method and usable-week coverage.
- [x] #2 Completed-season schedule difficulty is based on opponent points scored, not opponent record.
- [x] #3 Users can compare a team’s result under another team’s schedule using the same season and scoring rules.
- [x] #4 Byes, ties, partial schedules and missing scores are handled transparently.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Calculate weekly percentile expected wins on verified regular games, opponent scoring difficulty, and same-season donor-schedule replay with explicit exclusions; test and expose interactive comparison.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Eight targeted calculation and DOM tests pass and typecheck passes. Counterfactual record exposes self-matchup and missing-week exclusions rather than guessing final placements.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added historical percentile expected wins, opponent scoring difficulty and same-season interactive schedule replay with per-week evidence; eight tests and typecheck pass.
<!-- SECTION:FINAL_SUMMARY:END -->
