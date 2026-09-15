---
id: TASK-55
title: Use real schedules and player availability in playoff forecasts
status: Done
assignee:
  - Codex
created_date: '2026-09-15 18:02'
updated_date: '2026-09-15 18:08'
labels: []
dependencies: []
priority: high
ordinal: 58000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Playoff odds currently randomize known remaining opponents and can select unavailable players. Improve forecast inputs using existing league-provider schedules, configured lineup slots, weekly projections and current availability, with explicit gaps and no future-data leakage.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Known regular-season matchups drive simulations, with missing or unsupported formats disclosed.
- [x] #2 Current projected lineups exclude confirmed unavailable players and use legal bench replacements; missing teams do not discard valid projections for other teams.
- [x] #3 Forecast inputs and availability coverage survive shared report snapshots.
- [x] #4 Provider and simulator tests cover schedules, unavailable players and retrospective isolation; docs describe the data limits.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add typed regular-season fixtures from ESPN mMatchup and bounded Sleeper matchup reads, preserving only week/opponent identities. Use scheduled pairs when complete and explicitly label unknown schedule weeks. Add provider injury/availability filtering to next-week legal-lineup optimization, respect configured ESPN slots, preserve per-team projection coverage and retrospective guards. Extend snapshot validation and tests, document, then commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified complete schedule pairing, per-team projection fallback, confirmed absence replacement, configured empty ESPN slots, and snapshot serialization. Focused tests passed, typecheck/lint passed. Remaining unsupported playoff format assumptions remain labeled rather than claimed exact.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Forecasts now use complete published regular-season schedules from ESPN/Sleeper, disclose missing weeks, retain valid projections per team, and exclude confirmed unavailable players from current projected legal lineups. ESPN uses configured slots even when starters are empty, and Sleeper excludes reserve/taxi slots. Injury uncertainty is displayed without arbitrary percentage discounts. New inputs survive shared snapshots. Tests cover pairing, availability, missing projections, provider loading, serialization and retrospective projection isolation; documentation updated.
<!-- SECTION:FINAL_SUMMARY:END -->
