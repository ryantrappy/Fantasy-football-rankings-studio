---
id: TASK-166
title: Add a bootstrap season simulator to Other tools
status: In Progress
assignee:
  - '@codex'
created_date: '2026-11-23T02:21:56Z'
updated_date: '2026-11-23T02:31:55Z'
labels:
  - analytics
  - simulation
dependencies: []
references:
  - https://github.com/ffverse/ffsimulator
documentation:
  - docs/features/season-insights.md
type: feature
ordinal: 174000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Add an independent browser-native fantasy season simulator inspired by ffsimulator. Use existing league history and current rosters to explore season outcomes and the effect of an individual roster change, creating a basis for future comparison with the app's other simulators.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Open Season simulator from the authenticated Other tools hub and switcher while retaining the selected league context.
- [x] #2 Resample weekly player outcomes from observed positional-rank pools and score legal starting lineups for reproducible regular-season trials.
- [x] #3 Support randomized schedules and complete verified league schedules, plus best-ball and modeled lineup efficiency modes.
- [x] #4 Show expected wins, finish and win distributions, all-play win rate, and scoring; compare a selected roster change against the same baseline draws.
- [x] #5 Disclose data coverage and methodology, keep simulation work separate and cancellable, and verify the engine and UI with deterministic fixtures.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define a standalone seeded bootstrap engine and adapt authenticated roster, schedule and observed scoring inputs.
2. Add the Other tools tab, run controls, team outcome distributions, and paired single-player removal analysis.
3. Verify fixture behavior, navigation and build, and record method and coverage in the feature contract.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified 954 passing tests with one skipped, typecheck, lint, format check, production build and a 12-team, 1,000-trial synthetic smoke run. The season report uses in-league scoring ranks and current roster eligibility. GitHub review is pending.
<!-- SECTION:NOTES:END -->
