---
id: TASK-49
title: Ensure projections for playoffs include players on the bench
status: Done
assignee:
  - '@codex'
created_date: '2026-09-15 13:59'
updated_date: '2026-09-15 15:36'
labels: []
dependencies: []
priority: medium
ordinal: 54000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When running projections, include the top projected player for each week. Do not just take what the current lineup is. That way bye weeks are taken into account
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Build a valid-lineup optimizer for the next current-season scoring week. For Sleeper, use current roster ownership, configured roster slots, provider player projections and the league scoring settings; for ESPN, use roster entries, slot eligibility and statSourceId=1 provider totals. Select the highest-total legal projected lineup from starters and bench, record bench substitutions and retain the historical fallback when a complete valid lineup cannot be formed. Show the optimized-lineup coverage in the playoff tab, add deterministic provider/bye-week fixtures, update README, run targeted tests plus typecheck/lint, and commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented a legal best-projected-lineup calculation for current-week playoff simulations. It evaluates starters plus bench players against provider roster-slot eligibility, reports bench selections, and withholds a team projection unless every active slot has a valid projected player. Sleeper uses its configured roster positions and player catalog; ESPN uses roster slot and default-position data. Focused provider, forecast and component tests pass along with typecheck and lint; full suite/build are running.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Playoff simulations now calculate each team’s highest total legal next-week lineup from current starters and bench players. Sleeper uses configured roster slots, roster ownership and league-scored player projections; ESPN uses current roster slot eligibility and provider totals. A bench player can replace an unprojected starter such as a bye, and incomplete legal lineups retain the visible historical-scoring fallback. The forecast reports optimized-lineup coverage and bench selections. Added deterministic Sleeper/ESPN bench and missing-projection coverage, updated README, and verified 243 tests, production build, typecheck and lint.
<!-- SECTION:FINAL_SUMMARY:END -->
