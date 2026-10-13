---
id: TASK-125
title: Create a league Hall of Fame and Hall of Shame record book
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:42'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 132000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
League history shows manager summaries and season outcomes, but lacks a browsable record book that celebrates sustained success and catalogs notable low points. Create evidence-backed Hall of Fame and Hall of Shame views across seasons.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Hall of Fame rankings combine championships, playoff performance, regular-season wins, scoring and longevity with visible metric weights.
- [x] #2 Hall of Shame entries identify records such as worst seasons, longest losing streaks, lowest scores and biggest collapses with season and matchup evidence.
- [x] #3 Coverage and sample size accompany each record; unknown provider results are not treated as failures.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Build coverage-aware Hall of Fame weighted observed metrics and evidence-backed worst seasons, losing streaks, lowest scores and within-season collapses; expose rankings and verify unknown outcomes never count as failures.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added weighted, coverage-aware Hall of Fame plus browsable worst-season, losing-streak, lowest-score and collapse evidence. Fifteen cumulative focused tests and typecheck pass; unknown results excluded.
<!-- SECTION:FINAL_SUMMARY:END -->
