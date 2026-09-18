---
id: TASK-37
title: Include projections for simulations
status: Done
assignee:
  - '@codex'
created_date: '2026-09-10 03:26'
updated_date: '2026-09-14 09:33'
labels: []
dependencies: []
priority: high
ordinal: 42000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

https://github.com/lum8rjack/sleeper-go/blob/main/undocumented_projections.go

here is a library that uses undocumented apis, use this as a base for your sleeper implementation.

https://stmorse.github.io/journal/espn-fantasy-projections.html

use this article for the espn version
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Simulations can use provider player projections scored with league settings and current roster/lineup context for Sleeper and ESPN.
- [x] #2 Missing projections degrade visibly to the existing historical model; past cutoff simulations never use future projections.
- [x] #3 Deterministic fixtures verify scoring, projection coverage, provider failures and forecast behavior; setup and limitations are documented.

<!-- AC:END -->

## Definition of Done

<!-- DOD:BEGIN -->

- [x] #1 - Tests pass
- [x] #2 Docs updated

<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

Load optional current-week starter projections alongside insights for the active NFL season. Follow the supplied Sleeper endpoint and weight player stat projections by league scoring; read ESPN statSourceId=1 appliedTotal for exact scoring week and current starters. Return coverage and fallback notes, tolerate projection endpoint failures, and blend complete current-week team projections with historical means only for that simulated week. Historical cutoffs/older seasons exclude current projections. Show projection mode, week and coverage; deterministic scoring/forecast fixtures and docs cite source references. Existing minimum history and schedule limitations remain explicit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Added current-week projection snapshots for Sleeper and ESPN. Sleeper projections are scored from player stats with the league scoring settings; ESPN uses current starter `statSourceId=1` applied totals. Complete league-wide coverage is blended 50/50 with historical team means for the immediate next simulated week only. Partial data, provider failures, older seasons and retrospective cutoffs visibly retain the historical model. Added deterministic scorer, coverage, failure and forecast tests; all 186 tests, lint, typecheck and the production build pass. Updated README and calculation documentation.
<!-- SECTION:FINAL_SUMMARY:END -->
