---
id: TASK-80
title: Use best legal projected lineups throughout remaining season simulations
status: Done
assignee: []
created_date: '2026-09-29 16:25'
updated_date: '2026-09-29 16:47'
labels: []
dependencies: []
ordinal: 83000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build each remaining regular-season and playoff week from the current roster and that week’s provider player projections, respecting legal slots and weekly availability. Apply the corresponding team mean in matchup simulations, retain uncertainty, expose missing projection coverage, and preserve retrospective calibration integrity. Compare current validation-league outputs before and after without claiming unsupported historical accuracy gains.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sleeper and ESPN load and optimize remaining weekly projections using current roster ownership
- [x] #2 Regular-season and configured playoff matchup simulations use the corresponding week’s complete legal lineup; missing data falls back explicitly
- [x] #3 Current snapshots never leak into retrospective cutoffs or historical calibration, and coverage/assumptions are visible
- [x] #4 Meaningful provider, lineup, simulation and regression checks pass, with current-league before/after evidence and documented accuracy limitations
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented per-week legal-lineup projection collections for Sleeper and ESPN using fixed captured ownership, season-specific scoring calendars, known NFL byes, current-week injury-status exclusion only, selected lineup IDs and explicit missing-data fallback. Simulations apply every covered regular/postseason scoring week while retaining joint score uncertainty. Shared-report schema preserves weekly projections and bracket rules. Added coverage table and retrospective exclusion checks. Current Sleeper replay has 140/140 team-week coverage; same refreshed current-week inputs change Ryan playoff odds from 77.21% to 61.925%, title odds from 16.495% to 12.15%. Both historical calibration exports replay identically (ESPN Brier 0.16004601346875; Sleeper 0.12380229683076924). Live ESPN comparison was unavailable through public unauthenticated requests; adapter fixtures passed. Full 343-test suite passed, then added coverage regression and snapshot tests passed (344 distinct tests). Build, typecheck, lint, full formatting and diff checks passed. Browser preview verified expanded coverage and older-cutoff removal; no deployment or commit performed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Remaining-week provider means now come from independently optimized legal lineups and feed matchup/round simulations. Coverage and frozen-roster assumptions are visible, historical calibration remains free of current information, and saved reports retain weekly inputs. Comparison JSON saved under Downloads/weekly-lineup-review; behavior and accuracy limitations documented in docs/weekly-lineup-review.md and docs/calculations.md.
<!-- SECTION:FINAL_SUMMARY:END -->
