---
id: TASK-162.1
title: 'Conditional playoff simulation: fixed game outcomes and per-game leverage'
status: To Do
assignee: []
created_date: '2026-11-16T01:00:00Z'
labels:
  - analytics
dependencies: []
parent_task_id: TASK-162
priority: high
type: feature
ordinal: 170000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Engine for the Path to the Playoffs simulator (TASK-162). Extend the playoff forecast so selected remaining regular-season fixtures can be fixed to a winner and the rest simulated as today (real schedule from regularSeasonSchedule, projected team points from playoffProjection weekly rows, historical score distributions as fallback). For each remaining fixture, compute the selected team playoff chance under each outcome so the UI can rank games by swing. Keep simulation counts, model version, cutoff honesty, and worker/cancellation behavior consistent with forecastPlayoffs and forecastPlayoffsAsync (see TASK-116). Results must be reproducible for the same inputs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Fixing all remaining fixtures to one outcome yields the deterministic qualification result for the selected team
- [ ] #2 Fixing a single fixture changes only that game result; all other fixtures are still simulated
- [ ] #3 Per-game leverage returns the selected team playoff chance for each possible winner of each remaining fixture
- [ ] #4 Fixed-outcome runs reuse the same model version, simulation count, and projection handling as the base forecast
- [ ] #5 Unit tests cover fixed outcomes, leverage ordering, and worker parity
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
