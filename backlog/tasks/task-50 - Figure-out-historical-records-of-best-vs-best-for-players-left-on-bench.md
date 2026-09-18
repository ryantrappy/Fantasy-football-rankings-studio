---
id: TASK-50
title: Figure out historical records of best vs best for players left on bench
status: Done
assignee:
  - '@codex'
created_date: '2026-09-15 13:59'
updated_date: '2026-09-15 15:41'
labels: []
dependencies: []
ordinal: 55000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Completed historical weeks expose each team’s actual score and best legal lineup score when provider player, position and slot data are complete.
- [x] #2 The weekly result records how many actual starters were retained by the best lineup; incomplete data remains unavailable rather than inferred.
- [x] #3 Sleeper and ESPN fixtures cover bench substitutions, roster-slot legality and unavailable historical player data.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Extend the weekly insights model with an optional historical lineup result: best legal score, number of actual starters retained, and eligible lineup slots. Reuse the roster-slot optimizer added for playoff projections. For Sleeper, derive positions from the player catalog and configured roster slots; for ESPN, use each historical box score’s roster entries, positions and actual statSourceId=0 totals. Leave results undefined when a complete legal lineup cannot be formed. Add focused provider/load/calculate tests and document the data-availability boundary; commit the calculation-only foundation before adding the two requested history displays.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added provider-safe historical best-lineup results to every completed team-week. The model calculates the highest legal actual-score lineup, records actual starters retained by that result, and leaves weeks unavailable when required player, position or slot data are incomplete. Sleeper uses configured slots and catalog positions; ESPN uses historical box-score entries and statSourceId=0 totals. Added bench substitution, legality and unavailable-data fixtures; README documents the boundary. Focused 16 tests, typecheck and lint pass.
<!-- SECTION:FINAL_SUMMARY:END -->
