---
id: TASK-98
title: Default current-season week selections to the current NFL week
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 03:17'
updated_date: '2026-10-04 03:36'
labels:
  - ux
  - nfl
dependencies: []
references:
  - src/routes/_authenticated.index.tsx
  - src/studio-selection.ts
  - src/server/live-matchups.server.ts
  - src/server/providers/sleeper.provider.ts
  - src/server/providers/espn.provider.ts
priority: medium
type: enhancement
ordinal: 105000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The rankings studio currently initializes week selection to week 1 and resets it to week 1 when switching leagues or seasons. As a weekly fantasy analytics hub, the app should open the current NFL scoring week for the active season unless the user explicitly chooses a different week. Reuse authoritative NFL/provider season and week information and respect the selected league's available weeks. Define selection precedence so a stale remembered week does not indefinitely suppress the current-week default, while intentional URL/manual selections and historical-season browsing remain predictable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 For the current NFL season, initial selection and league/current-season switches default to the current scoring week when no explicit week selection applies, including when the current week is greater than 1.
- [x] #2 Explicit URL and manual week selections take precedence and remain stable during data refreshes; returning in a later NFL week with stale stored selection follows a documented policy that allows the default to advance.
- [x] #3 Defaults use authoritative season/week state and resolve to a week supported by the selected league. Preseason, offseason, season rollover, unavailable provider state, and historical seasons have documented deterministic fallbacks and never select an unsupported postseason week.
- [x] #4 Regression coverage verifies current-week defaults, league and season switches, explicit selections, stale remembered state, historical seasons, valid-week boundaries, and provider-state failure.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Resolve authoritative NFL season state and provider scoring week into league-supported default-week metadata with documented fallbacks. 2. Apply defaults in the studio only when no explicit week is selected; preserve historical remembered weeks and omit forced week 1 on league/season switches. 3. Test state failures, boundaries, stale storage, and route selection; document and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added authoritative NFL state with 30-second request reuse and provider scoring-week defaults bounded to supported league weeks. Studio defaults advance current-season remembered weeks while explicit URL/manual weeks win; league/season switches no longer force week 1. Historical, preseason, postseason/offseason and unavailable-state fallbacks are documented. Verified 43 focused state/selection/router tests, provider tests, typecheck and lint; full suite passed.
<!-- SECTION:FINAL_SUMMARY:END -->
