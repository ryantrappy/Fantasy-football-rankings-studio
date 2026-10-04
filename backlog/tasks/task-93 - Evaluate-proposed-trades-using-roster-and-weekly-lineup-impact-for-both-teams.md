---
id: TASK-93
title: Evaluate proposed trades using roster and weekly lineup impact for both teams
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 02:43'
updated_date: '2026-10-04 04:07'
labels:
  - analytics
  - trades
dependencies:
  - TASK-89
references:
  - src/insights.ts
  - src/server/insights/calculate.ts
  - src/server/insights/projections.ts
  - src/playoff-forecast.ts
  - src/server/insights/archive.server.ts
documentation:
  - README.md
priority: medium
type: feature
ordinal: 100000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The existing trade summaries measure outcomes after transactions. Managers also need prospective comparisons that account for team needs and replacement starters, especially when a two-for-one offer changes roster size. Add explicit before/after roster scenarios grounded in the selected league's current ownership and projections. A blanket player-value score or a historical trade grade alone does not answer whether an offer improves either team's useful lineup.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Users can select two league teams and a proposed player exchange, seeing both rosters' before/after legal lineup expectations and positional coverage over selected available weeks.
- [x] #2 Roster-size imbalances require explicit drop/open-slot assumptions; duplicate players, non-owned assets, and unsupported draft-pick values are rejected or clearly excluded.
- [x] #3 Optional matchup/playoff scenario changes use the same available input snapshot and disclose uncertainty and projection gaps; no unsupported fair-value certainty is claimed.
- [x] #4 The proposal is read-only and leaves provider rosters, persisted rankings, and existing forecast observations unchanged; tests cover balanced/unbalanced trades and missing data.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add current provider ownership markers to live rosters and a pure two-team trade scenario evaluator using the existing legal-lineup advisor. Require explicit drop/open-slot assumptions for imbalances and reject invalid/locked/reserve assets. 2. Add a read-only trade analysis route with available-week context, positional coverage and before/after expectations for both teams. 3. Verify balanced/unbalanced proposals, identity/ownership gaps and unchanged snapshots; document current-week scope and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added owner-only Trade analyzer route using one live provider-scored snapshot and explicit available current-week selection. Two team exchanges show before/after legal lineup expectations and active positional counts. Imbalances require explicit drops/open slots; duplicate/non-owned/reserve/known-locked assets are rejected. Unsupported picks, future projection weeks, provider roster caps and playoff changes are disclosed; no data is written. Five focused pure/DOM tests verify balanced/unbalanced proposals, gaps and unchanged inputs; production build, lint/typecheck passed. README updated.
<!-- SECTION:FINAL_SUMMARY:END -->
