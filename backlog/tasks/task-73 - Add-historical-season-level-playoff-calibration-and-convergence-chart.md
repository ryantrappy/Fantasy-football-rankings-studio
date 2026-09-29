---
id: TASK-73
title: Add historical season-level playoff calibration and convergence chart
status: Done
assignee:
  - Codex
created_date: '2026-09-28 19:48'
updated_date: '2026-09-28 19:55'
labels: []
dependencies: []
ordinal: 76000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Early-season playoff probabilities can be overconfident, and the existing held-out matchup panel does not validate eventual qualification. Backtest prior seasons to reveal whether season-level forecasts improve as results arrive.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Previous completed seasons are replayed at weekly cutoffs without future scores or current projections entering predictions.
- [x] #2 Weekly Brier score, log loss, qualification accuracy and equal-chance baseline are displayed with a convergence graph and cutoff-specific reliability bins.
- [x] #3 Missing outcomes and incomplete seasons are disclosed; sample counts and tests prevent unsupported accuracy claims.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Use existing access-scoped season discovery and report APIs to load up to five prior seasons on demand. Require complete outcome cohorts and paired regular-season histories, replay the unchanged 20,000-trial forecast at each cutoff, pool metrics by week, and show a Brier convergence chart plus reliability table. Add leakage, metric and UI tests; document limitations and run project checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validation: 66 test files and all 313 unit tests passed; production build and TypeScript passed; lint and focused formatting passed. Two Playwright checks passed at 1280px and 390px, including cutoff switching, counts, named chart and absence of page overflow. Desktop/mobile screenshots visually inspected. Leakage tests exclude later actual scores and current projections; missing outcomes and malformed cohorts exclude whole seasons. Existing unrelated workspace changes were preserved. Real league calibration results are computed on demand using the existing report APIs, not inferred from synthetic test accuracy.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added an on-demand previous-season playoff backtest using the unchanged 20,000-trial model at each cutoff. Displays Brier convergence against season-specific qualification baselines, log loss, threshold accuracy, sample counts and selectable reliability bins. Discloses exclusions, dependence, final-week rules checks and absence of archived projections. Verified all 313 unit tests, production build, TypeScript/lint and desktop/mobile Playwright checks; calculations documentation updated.
<!-- SECTION:FINAL_SUMMARY:END -->
