---
id: TASK-69
title: Add a toggle to the playoff simulation screen that changes to histogram mode
status: Done
assignee:
  - '@Codex'
created_date: '2026-09-18 12:53'
updated_date: '2026-09-18 14:13'
labels: []
dependencies: []
modified_files:
  - src/playoff-timeline.ts
  - src/playoff-timeline.test.ts
  - src/components/PlayoffTimeline.tsx
  - src/components/PlayoffForecast.tsx
  - src/components/PlayoffForecast.test.tsx
  - src/index.css
  - tests/ui/fixture.ts
  - tests/ui/main.tsx
  - tests/ui/playoff-timeline.spec.ts
  - README.md
  - docs/calculations.md
ordinal: 72000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- in histogram mode it should run the simulation for each week that has passed and create a line the represents each team's projections for playoffs at that week so it is possible to figure out how the user's season is going
- when in histogram mode add a toggle between championship percentage and playoff percentage
- make sure the results are cached between toggles so the toggle happens quickly
- Add animations to the points as they are put on the graph so the come up from the x axis
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Use the existing deterministic `forecastPlayoffs` model to compute a forecast at each completed regular-season cutoff. Cache the per-week results by report data so switching between the current probability table and a week-by-week chart, or between playoff and title chances, does not rerun simulations. Build an accessible responsive SVG line chart with one series per team, animated points rising from the zero axis, a legend and exact-value table. Document the interpretation and verify historical cutoffs, toggles, and animation behavior with focused tests plus project checks.

The chart schedules one weekly simulation per browser task so progress can render between cutoffs. A WeakMap keyed by immutable report data and playoff settings stores each forecast, including the selected table cutoff; chart and metric switches reuse these objects.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The existing model uses only scores through each cutoff, and only the latest eligible cutoff can consume the current projection snapshot. Invalid weekly forecasts are displayed as unavailable and do not get connected across gaps. Verified the chart visually on desktop and via a Chrome browser check at 390px, including metric switching, exact values, point animation, and reduced-motion behavior. Full Vitest suite: 59 files and 287 tests passed. Typecheck, lint, and format checks passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a week-by-week playoff trend view with a line and animated points for every team. The view switches between playoff and championship chances and includes an exact-value table. Each completed regular-season week uses the existing 20,000-trial model at its own cutoff; cached results keep view and metric switches quick. Documented the historical interpretation and validated the desktop chart, mobile browser behavior, reduced motion, full unit suite, typecheck, lint, and formatting.
<!-- SECTION:FINAL_SUMMARY:END -->
