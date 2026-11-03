---
id: TASK-161
title: Measure projection performance luck with 100 historical matchup replays
status: Done
assignee:
  - '@codex'
created_date: '2026-11-03 19:38'
updated_date: '2026-11-03 20:15'
labels: []
dependencies: []
ordinal: 168000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Schedule luck alone cannot explain player scoring above or below weekly expectations. The user asks to compare each player with their projection entering the week, estimate scoring variance and replay each recorded matchup 100 times to quantify performance luck.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Retain same-season and same-week player projections for ESPN and Sleeper where available, disclosing retrospective provider provenance and preserving missing data.
- [x] #2 Replay each eligible reciprocal completed matchup exactly 100 times using player projections and variance estimated only from earlier completed weeks, with deterministic results, tie handling and visible unavailable reasons.
- [x] #3 Season Insights exposes team luck, exact matchup replays and player actual/projected/difference/variance evidence with selection-aware CSVs, without replacing schedule luck.
- [x] #4 Snapshot round trips preserve raw projection inputs; calculation, provider and rendered UI tests pass and formulas and preservation contracts are updated.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add historical starter projection inputs and safe provider loading. 2. Compute earlier-week player residual variance with disclosed position fallback, deterministic 100-trial matchup replay and team summaries. 3. Add a focused projection luck view and saved-input compatibility. 4. Verify model edge cases, provider fixtures, rendered navigation, snapshot round trips and static checks; document formulas and limits.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented a separate lazily opened Projection luck view with team summaries, exact matchup/player evidence, CSV filters and retrospective provenance. Variance uses earlier-week player errors or disclosed same-position fallback. Published multiweek regular-season periods and verified playoff games count once. Exact integer half-win counts prevent rounding imbalance. Provider/model/snapshot/component checks passed except the expanded existing InsightsPage test exceeded its unchanged timeout; moved new navigation evidence into dedicated desktop/320px Playwright checks, which both passed. Existing InsightsPage assertions and timeouts remain unchanged.

Production build (including TypeScript) passed after correcting an optional moves field in the new browser-only fixture. Lint and formatting passed. Dedicated model, provider, snapshot and component checks cover leakage, missing/zero/negative inputs, fallback variance, score overrides, ties, complementary credits and multiweek outcomes. Desktop 1440px and mobile 320px browser tests passed with real production components, filtered CSV downloads, retained navigation state, no page errors and local overflow. Full unit regression suite is running with two workers.

Final focused validation on pinned Node 24.15.0: 6 files / 55 tests passed, including additional nonfinite-score and decimal multiweek-tie regressions. Two Playwright desktop/320px phone cases passed. Broad regression attempts under Node 26 and pinned Node 24 hit unchanged test time limits in InsightsPage selected-team inspector, playoff-forecast frequency counts, and RosterRiskAlerts preference restoration; the broad run was stopped after repeated timing failures. No assertions or timeout thresholds were weakened. Production build including TypeScript and static checks are being finalized.

Final production build with pinned Node 24.15.0, TypeScript, lint, formatting and git diff whitespace checks all passed. The Tests pass checklist records the 55 focused tests and two browser cases for this feature; it does not assert a green full regression suite. The three broader timeout failures remain an explicit validation limitation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added Season Insights Projection luck: historical player forecast differences, earlier-week error variance with disclosed same-position fallback, 100 deterministic replays per eligible matchup, exact complementary win credit, team/opponent performance summaries, multiweek/verified playoff grouping, selected-team/week CSVs and saved-input compatibility. Provider projections are disclosed as retrospective and potentially revised. Verified 55 focused tests, two desktop/phone Playwright cases, production build including TypeScript, lint, formatting and whitespace checks. Full regression attempts encountered unchanged timeout limits in three existing tests; no thresholds or assertions were relaxed.
<!-- SECTION:FINAL_SUMMARY:END -->
