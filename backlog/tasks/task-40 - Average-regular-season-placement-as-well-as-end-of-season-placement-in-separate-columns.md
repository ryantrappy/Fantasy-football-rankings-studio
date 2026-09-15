---
id: TASK-40
title: >-
  Average regular season placement as well as end of season placement in
  separate columns
status: Done
assignee:
  - '@codex'
created_date: '2026-09-15 02:50'
updated_date: '2026-09-15 03:12'
labels: []
dependencies: []
modified_files:
  - README.md
  - docs/calculations.md
  - src/league-summary.ts
  - src/league-summary.test.ts
  - src/components/SeasonAchievements.tsx
  - src/components/HistoryPage.tsx
  - src/components/public-reports.test.tsx
  - src/router.test.tsx
priority: high
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Show managers' average regular-season placement separately from their average final postseason placement in League History.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 League History calculates regular-season placement only after the configured regular season is complete and complete league scoring data is available.
- [x] #2 The achievements table shows separate average regular-season placement and average final placement columns with independent coverage.
- [x] #3 The year-by-year history table shows separate regular-season and final placements, leaving unavailable values blank rather than substituting one for the other.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Derive a season standings placement from completed head-to-head results through the league’s configured regular-season cutoff, using points scored as the documented tiebreaker.
2. Aggregate regular-season placement independently from provider final placement and expose both in the achievements and year-by-year tables.
3. Add calculation and rendering coverage, update calculation documentation, run project checks, and finalize the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Derived regular-season standings only when the configured cutoff has passed and every selected team has scoring data for every regular-season week. Rankings use head-to-head wins (ties count half), then points scored, with exact ties sharing a placement. Regular-season and final placement totals retain independent coverage.

Validation: focused summary and report tests passed (15 tests); full Vitest suite passed (51 files, 231 tests); TypeScript, oxlint, and production build passed. Changed source and documentation files were formatted with oxfmt; the repository-wide format check remains affected by pre-existing unrelated files.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added separate average regular-season and final placement reporting, plus year-by-year columns and documented completeness/tiebreak rules. Verified with calculation and route coverage, the full 231-test suite, TypeScript, oxlint, and a production build.
<!-- SECTION:FINAL_SUMMARY:END -->
