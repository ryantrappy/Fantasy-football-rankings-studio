---
id: TASK-116
title: Keep uncached playoff simulations from blocking interactive rendering
status: To Do
assignee: []
created_date: '2026-10-05 17:34'
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
- [ ] #1 Loading an uncached forecast or changing the cutoff shows a pending state and keeps navigation and controls responsive during simulation.
- [ ] #2 Seeded results, projection coverage, model version and simulation counts remain equivalent to the existing forecast for identical inputs; existing cutoff caching remains effective.
- [ ] #3 Results from canceled, replaced or unmounted report contexts cannot update the active league or season.
- [ ] #4 Repeatable browser measurements with representative 12-team and 32-team fixtures demonstrate that simulation no longer creates long blocking main-thread work; regression tests verify result parity, cancellation and loading behavior.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
