---
id: TASK-108
title: Show position group rankings and roster projection charts in Season Insights
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
  - docs/references/season-insights/position-group-rankings.png
  - docs/references/season-insights/roster-projections.png
  - >-
    backlog/tasks/task-80 -
    Use-best-legal-projected-lineups-throughout-remaining-season-simulations.md
  - >-
    backlog/tasks/task-99 -
    Combine-ESPN-and-Sleeper-player-projections-for-either-league-provider.md
documentation:
  - docs/calculations.md
type: feature
ordinal: 115000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Managers need to compare positional strengths and weaknesses across every team in the selected league. The user supplied two visual references: a team-by-position rank heatmap (1 is strongest) and horizontal stacked rest-of-season projected-points bars with position segments and team totals. Keep both views together in Season Insights. The screenshots are visual inspiration; their Sleeper attribution and completed-season behavior require validation against our supported providers and available projection history. League scoring, roster settings, and projection coverage must make the comparison interpretable rather than rewarding bench depth without explanation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Season Insights shows both a position group ranking heatmap and a stacked roster projection chart for all teams in the selected league and season, using the supplied chart references.
- [x] #2 The heatmap shows league-relative ranks for supported positions, labels rank 1 as strongest, defines tie handling, and exposes the underlying projected-points values and full team names.
- [x] #3 The stacked chart labels position segments and team totals, supports sorting by total or position strength, and uses consistent position identities across both charts; unsupported league positions are handled explicitly.
- [x] #4 Both charts disclose the projection horizon, provider/source, refresh time, scoring basis, and positional aggregation rules, including starters versus bench/reserve, flex eligibility, and availability/bye treatment. Missing projection data is distinguished from zero.
- [x] #5 League or season changes cannot retain another selection's chart data. Historical or completed seasons use valid season-specific projections only when available; otherwise show a clear unavailable state without using current-season forecasts.
- [x] #6 Numeric labels and an accessible table make the results understandable without color or hover; charts remain usable on mobile, and verification covers custom positions, ties, missing data, and league/season isolation.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve positional totals for each provider-optimized weekly legal lineup and shared snapshots. 2. Derive comparable remaining-week position totals and ranks with explicit coverage and missing-data policy. 3. Add TanStack stacked bars, labeled heatmap, sorting and exact-value tables to Season Insights. 4. Verify provider aggregation, custom slots, ties, historical isolation, mobile layout and snapshots; document formulas.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Preserved primary-position contributions from Sleeper/ESPN optimized weekly lineups and shared snapshots. Added TanStack stacked bars plus a sortable color heatmap with exact values, full names, managed-team markers and horizon coverage. Full-horizon incomplete teams remain unavailable; native provider forecasts are identified explicitly. Provider tests verify bench replacements, byes, availability, FLEX/SUPER_FLEX, IDP and DEF aliasing; pure tests verify ties, missing/inconsistent/stale snapshots and differing team identities. InsightsPage DOM test verifies league-switch clearing. Browser desktop/mobile screenshots reviewed; sorting and exact values verified; WCAG A/AA axe scan has zero violations.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added roster projection bars and position rankings to Season Insights using best legal weekly lineups. Full suite passed 477 tests with one optional test skipped; final additional IDP regression passed separately (478 verified tests total). Two Chrome browser tests passed; production build, typecheck, lint, changed-file formatting and diff checks passed. README/calculation reference updated. Active reports need a refresh for new positional inputs; old/historical snapshots show unavailable data rather than current forecasts.
<!-- SECTION:FINAL_SUMMARY:END -->
