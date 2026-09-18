---
id: TASK-42
title: >-
  Allow simulations for playoffs starting in week 1 but add disclaimer about
  inaccuracy
status: Done
assignee:
  - '@codex'
created_date: '2026-09-15 03:02'
updated_date: '2026-09-15 03:14'
labels: []
dependencies: []
modified_files:
  - README.md
  - docs/calculations.md
  - src/playoff-forecast.ts
  - src/playoff-forecast.test.ts
  - src/components/PlayoffForecast.tsx
  - src/components/PlayoffForecast.test.tsx
priority: medium
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Allow playoff simulations after only one or two completed weeks, using the model's strong league-average shrinkage and any complete current provider projection while clearly warning that early-season estimates are especially uncertain.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A forecast can run with one or two complete paired scoring weeks per team instead of requiring three.
- [x] #2 Early-season forecasts continue to use complete current-week provider projections when available and retain conservative league-average shrinkage.
- [x] #3 Forecasts through week 1 or 2 display a prominent disclaimer that the small-sample estimate is especially uncertain.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Relax the completed-history floor to one complete paired week while retaining the existing small-sample shrinkage and projection blending.
2. Add an early-season uncertainty note for forecasts through weeks 1–2.
3. Update model and component tests plus documentation, run project checks, and finalize the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Relaxed the model floor from three completed weeks to one while retaining the existing sample/(sample+3) league-average shrinkage. Complete current next-week projections still blend into the earliest forecast. The UI displays a bold small-sample note for week 1–2 cutoffs.

Validation: focused model and component suites passed (11 tests); full Vitest suite passed (51 files, 232 tests); TypeScript, oxlint, and production build passed. Changed files were formatted with oxfmt; the repository-wide format check remains affected by pre-existing unrelated files.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Enabled playoff forecasts from week 1 with conservative small-sample weighting, current projection support, and a prominent week 1–2 uncertainty disclaimer. Verified with focused tests, the full 232-test suite, TypeScript, oxlint, and a production build.
<!-- SECTION:FINAL_SUMMARY:END -->
