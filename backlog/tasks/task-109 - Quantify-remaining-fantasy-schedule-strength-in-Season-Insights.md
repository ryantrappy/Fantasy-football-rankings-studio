---
id: TASK-109
title: Quantify remaining fantasy schedule strength in Season Insights
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 16:16'
updated_date: '2026-10-05 16:41'
labels:
  - analytics
  - season-insights
dependencies: []
references:
  - >-
    backlog/tasks/task-55 -
    Use-real-schedules-and-player-availability-in-playoff-forecasts.md
  - >-
    backlog/tasks/task-80 -
    Use-best-legal-projected-lineups-throughout-remaining-season-simulations.md
  - docs/calculations.md
documentation:
  - docs/calculations.md
type: feature
ordinal: 116000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Managers want to know how difficult their remaining fantasy matchups are relative to the other teams in the selected league. Add this to Season Insights alongside the positional-strength views. Interpret schedule strength as the strength of remaining fantasy league opponents, with NFL player matchup difficulty reserved for a separately scoped feature. Existing forecast tasks already provide remaining fixtures and weekly legal-lineup projections; this feature makes schedule difficulty directly visible rather than requiring users to infer it from playoff odds.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Season Insights shows a numeric remaining-schedule difficulty score and easiest-to-hardest league rank for every team, highlighting the saved managed team when one is selected.
- [x] #2 The default horizon covers uncompleted scheduled regular-season matchups from an explicit as-of week, counts repeated opponents and multiweek matchups according to league rules, and does not assume unknown playoff opponents.
- [x] #3 Each team has a week-by-week opponent and strength breakdown. The displayed formula, units, and rank direction explain how opponent strength is compared with the league baseline for the same weeks.
- [x] #4 Projection coverage, source, freshness, and any historical-strength fallback are disclosed; absent schedules or projections are not treated as easy opponents or zero strength, and teams with no remaining games have an explicit end-of-season state.
- [x] #5 Results respect the selected league, season, scoring settings, and report cutoff without future-data leakage in historical reports. Verification includes repeated opponents, differing remaining-game counts, incomplete schedules, and league/season changes.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve a scoring-week regular-season schedule context, including published ESPN multiweek period mappings, without altering forecast compatibility. 2. Calculate average opponent strength minus the same-week league baseline over known remaining fixtures, requiring complete comparable inputs for ranking. 3. Add easiest-to-hardest ranks, managed-team highlighting and opponent breakdown to Season Insights. 4. Verify missing/repeated fixtures, unequal schedules, multiweek periods, historical cutoffs and league switching; document formulas.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added scoring-week regular-season schedule context, including ESPN published multiweek mappings, without enabling unsupported playoff forecast formats. Difficulty averages opponent expected points minus same-week league average; whole weeks use complete projected legal lineups or labeled completed-score averages through the cutoff. Missing or conflicting fixtures and missing estimates leave teams unranked, while explicit byes are excluded. Pure/provider-calendar tests verify repeated opponents, unequal week counts, ties, missing data, partly completed multiweek calendars, completion and no future-score leakage. DOM/browser checks verify managed-team markers, league switching, opponent tables and fallback labels. New fields survive shared snapshots.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added easiest-to-hardest schedule ranks, points-per-week difficulty, coverage and expandable opponent/baseline breakdowns to Season Insights. Verified calculation/calendar cases, report-switch isolation, historical fallback and snapshot preservation. Full suite passed 477 tests with one optional test skipped; final additional IDP regression passed separately (478 verified tests total). Both Chrome browser checks, build, typecheck, lint, changed-file formatting and diff checks passed. Formula and data limitations documented.
<!-- SECTION:FINAL_SUMMARY:END -->
