---
id: TASK-28
title: Compare two managers over selected seasons
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-14 14:14'
labels:
  - reporting
dependencies: []
documentation:
  - README.md
priority: medium
type: feature
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
League members often want a focused comparison rather than scanning the full history table.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Readers can choose two distinct managers and a season range.
- [x] #2 Comparison displays scoring, league-median performance and known season achievements on consistent coverage windows.
- [x] #3 Missing seasons and ownership-group differences are visible; changing the comparison never modifies ranking editions.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

Add a read-only comparison panel to League History with two mutually exclusive ownership-group selectors and a bounded from/through range over the loaded seasons. Calculate scoring and league-median rates only from completed weeks observed for both managers, and count achievements only in seasons where both selected groups appear while retaining per-metric known-result denominators. List every included season's paired coverage, missing provider result or ownership-group absence. Cover the calculation and interaction behavior, document the denominators and prove the full project checks.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

League History now includes a focused, read-only comparison for two distinct manager ownership groups over a selectable contiguous season range. Side-by-side cards show average scoring, average performance versus the league median, above-median weeks, playoff appearances, championships and average finish. Scoring uses exact shared completed weeks; achievements use seasons where both groups appear and show known-result coverage. A season-by-season list identifies unavailable data and years played under different ownership groups, including season-scoped identities for unknown owners. The comparison has no ranking mutation path. Documentation is updated; all 203 tests, lint, typecheck, production build and diff checks pass.
<!-- SECTION:FINAL_SUMMARY:END -->
