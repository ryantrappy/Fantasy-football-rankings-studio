---
id: TASK-162
title: Add a Path to the Playoffs simulator as its own nav item
status: To Do
assignee: []
created_date: '2026-11-16T01:00:00Z'
updated_date: '2026-11-16T01:01:00Z'
labels:
  - analytics
dependencies: []
priority: high
type: feature
ordinal: 169000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
New Path to the Playoffs simulator for the fantasy rankings studio. Own top-level nav item (label Playoff paths), not a tab inside Playoff simulator or Season insights. Pick a team (default: saved managed team from TASK-89, with a picker to switch), lock in results for remaining regular-season games, and re-run the playoff forecast with those results fixed to show the updated playoff chance. A leverage list ranks remaining games by how much each outcome moves the selected team playoff chance (if X wins: Y%). A prefill button fills all remaining games from projections (higher projected weekly team points wins); nothing is prefilled on load. The simulator is shareable via a link scoped to this view only. Reuses forecastPlayoffs, playoffProjection weekly team points, and regularSeasonSchedule fixtures. Authenticated by default.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 New Playoff paths nav item routes to the simulator; existing nav items unchanged
- [ ] #2 Simulator defaults to the managed team and offers a team picker
- [ ] #3 Locking in game results re-runs the forecast and updates the playoff chance; clearing restores the base forecast
- [ ] #4 Prefill button fills remaining games from projections; nothing is prefilled on load
- [ ] #5 Shared link shows only the simulator, with no access to other sections
- [ ] #6 Existing forecast, calibration, and exports are unchanged
- [ ] #7 docs/features/playoffs.md area contract updated with the new simulator
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
