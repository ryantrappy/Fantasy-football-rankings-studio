---
id: TASK-116
title: Keep uncached playoff simulations from blocking interactive rendering
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 17:34'
updated_date: '2026-10-06 17:28'
labels:
  - performance
  - playoffs
dependencies: []
references:
  - src/components/PlayoffForecast.tsx
  - src/playoff-timeline.ts
  - src/components/PlayoffTimeline.tsx
  - src/playoff-forecast.ts
documentation:
  - docs/code-review-2026-10-05.md
priority: medium
type: enhancement
ordinal: 123000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PlayoffForecast invokes cachedPlayoffForecast during render, and a cache miss runs the default 20,000 simulations synchronously. A local Node benchmark with six completed weeks, a week-14 regular-season end and four playoff places measured 180–194 ms for 12 teams and 465–530 ms for 32 teams across three runs each. The timeline yields between cutoffs but each individual simulation still blocks. These are synthetic local timings, not production browser measurements. Caching helps repeat views but cannot help the first calculation. Preserve model semantics while keeping the interface responsive.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Loading an uncached forecast or changing the cutoff shows a pending state and keeps navigation and controls responsive during simulation.
- [x] #2 Seeded results, projection coverage, model version and simulation counts remain equivalent to the existing forecast for identical inputs; existing cutoff caching remains effective.
- [x] #3 Results from canceled, replaced or unmounted report contexts cannot update the active league or season.
- [x] #4 Repeatable browser measurements with representative 12-team and 32-team fixtures demonstrate that simulation no longer creates long blocking main-thread work; regression tests verify result parity, cancellation and loading behavior.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Repair the partially restored implementation and supporting API/provider files; preserve main’s trade suggestions; verify with regression tests, browser checks, type checks, lint, formatting and a production build.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Restored after accidental shelving and manual merge. Reconnected missing supporting code and reconciled it with the newer trade suggestions implementation.

Recovery validation: 582 unit tests passed (1 skipped). All 51 browser cases passed across the full run and corrected trade-preview rerun. Production build, type checks, lint, formatting and diff checks passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restored batched cancellable seeded forecasts, asynchronous timeline loading and cache reuse; Chrome checks confirm result parity and responsive 12/32-team simulations.
<!-- SECTION:FINAL_SUMMARY:END -->
