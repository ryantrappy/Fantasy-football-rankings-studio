---
id: TASK-77
title: Apply season-specific playoff qualification and bracket rules
status: Done
assignee: []
created_date: '2026-09-29 15:05'
updated_date: '2026-09-29 15:20'
labels: []
dependencies: []
ordinal: 80000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Forecasts and calibration must use each requested season’s provider playoff format, divisions, seeding tiebreakers, round lengths and reseeding instead of league-wide wins/points assumptions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rules and team divisions are retrieved independently for every historical season and exported for replay
- [x] #2 Forecasts apply division qualification and provider tiebreakers, including head-to-head multi-team restart and unequal-meeting fallback
- [x] #3 Bracket simulations honor supported round lengths and reseeding; unknown formats produce an explicit unavailable reason
- [x] #4 ESPN league 1140768 historical final-cutoff qualifiers match actual entrants with regression coverage
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Normalize provider rules per season; implement standings selection from simulated records and scores; update bracket simulation, export and displayed methodology; verify both real leagues and full test/build checks.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Normalized playoff rules from each requested ESPN/Sleeper season, including historical divisions, ordered tiebreakers, scoring weeks and reseeding. Implemented division-winner qualification, one-seed-at-a-time head-to-head with unequal-meeting fallback, division records, points against, multiweek rounds and reseeding. Unsupported rules are explicit; legacy snapshots are labeled. Schema-3 exports include season rules. Verified live provider metadata and replayed both submitted leagues: all 40 ESPN and 50 Sleeper final-cutoff qualifications agree with actual entrants. ESPN predictive Brier improves from 0.1696 to 0.1641 but still trails standings 0.1520; score-distribution coefficients remain unchanged. Updated exports saved in Downloads with season-rules suffix. All 69 files / 333 tests, build/typecheck, lint, formatting, diff checks and 2 desktop/mobile Playwright export tests pass.
<!-- SECTION:FINAL_SUMMARY:END -->
