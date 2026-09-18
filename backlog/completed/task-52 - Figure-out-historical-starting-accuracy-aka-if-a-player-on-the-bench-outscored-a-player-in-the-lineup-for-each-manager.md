---
id: TASK-52
title: >-
  Figure out historical starting accuracy, aka if a player on the bench
  outscored a player in the lineup for each manager
status: Done
assignee:
  - Codex
created_date: '2026-09-15 14:01'
updated_date: '2026-09-15 15:49'
labels: []
dependencies: []
modified_files:
  - src/insights.ts
  - src/server/insights/calculate.ts
  - src/server/insights/calculate.test.ts
  - src/league-summary.ts
  - src/league-summary.test.ts
  - src/components/InsightsPage.tsx
  - src/components/HistoryPage.tsx
  - src/components/LeagueSummary.tsx
  - src/components/public-reports.test.tsx
  - src/router.test.tsx
  - README.md
priority: medium
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Report each manager’s historical sit/start accuracy: the percentage of actual starters retained by the best legal lineup, weighted across completed provider-eligible weeks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each eligible team-week displays sit/start accuracy as retained actual starts divided by legal lineup slots; incomplete historical lineup weeks remain unavailable.
- [x] #2 Season insights summarize each team’s eligible-week best-lineup average and weighted sit/start accuracy.
- [x] #3 League History summarizes each manager’s eligible-week best-lineup average and weighted sit/start accuracy across selected seasons.
- [x] #4 Calculation and UI tests cover aggregation, unavailable coverage, and the displayed percentage; documentation defines the metric.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Aggregate historical best-lineup totals, eligible weeks, retained actual starts, and legal slots in season insights and league summaries.
2. Add weekly sit/start accuracy and season/League History columns using only eligible weeks.
3. Add focused calculation and DOM coverage, document the definition, run checks, finalize, and commit only TASK-52 files.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added weighted sit/start accuracy to the weekly Season insights table, team scoring summary, Manager scorecard, and League History season table. Accuracy is retained actual starters divided by legal lineup slots; best-lineup averages and percentages use only complete provider-eligible weeks. Added calculation, cross-season aggregation, Season route DOM, and historical scorecard coverage. Full test suite (249 tests), typecheck, lint, and production build pass.
<!-- SECTION:FINAL_SUMMARY:END -->
