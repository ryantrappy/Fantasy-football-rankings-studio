---
id: TASK-37
title: Include projections for simulations
status: In Progress
assignee:
  - '@codex'
created_date: '2026-09-10 03:26'
updated_date: '2026-09-10 03:29'
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
- [ ] #1 Simulations can use provider player projections scored with league settings and current roster/lineup context for Sleeper and ESPN.
- [ ] #2 Missing projections degrade visibly to the existing historical model; past cutoff simulations never use future projections.
- [ ] #3 Deterministic fixtures verify scoring, projection coverage, provider failures and forecast behavior; setup and limitations are documented.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Load optional current-week starter projections alongside insights for the active NFL season. Follow the supplied Sleeper endpoint and weight player stat projections by league scoring; read ESPN statSourceId=1 appliedTotal for exact scoring week and current starters. Return coverage and fallback notes, tolerate projection endpoint failures, and blend complete current-week team projections with historical means only for that simulated week. Historical cutoffs/older seasons exclude current projections. Show projection mode, week and coverage; deterministic scoring/forecast fixtures and docs cite source references. Existing minimum history and schedule limitations remain explicit.
<!-- SECTION:PLAN:END -->
