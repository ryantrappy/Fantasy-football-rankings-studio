---
id: TASK-169
title: Compare Sleeper and ESPN projections under custom scoring
status: In Progress
assignee:
  - '@codex'
created_date: '2026-11-23T04:41:45Z'
updated_date: '2026-11-23T04:57:31Z'
labels:
  - projections
  - scoring
dependencies: []
references:
  - >-
    https://support.sleeper.com/en/articles/3998131-what-scoring-options-are-available
  - src/server/combined-projections.server.ts
  - https://github.com/ryantrappy/Fantasy-football-rankings-studio/pull/47
documentation:
  - docs/features/decision-support.md
type: enhancement
ordinal: 177000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The DynastyProcess crosswalk resolves player identities for cross-provider projections, but four scoring categories in a representative Sleeper league currently block every blend. The weekly feeds can compare core NFL stats even when receiving-yard milestones and fumble recovery scoring have incomplete coverage. Keep the comparison on the same scoring basis and preserve the league's provider-only adjustments.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 For validated player/week/position matches, score both feeds using the same supported weights and keep the Sleeper-only portion of the native projection when known receiving-yard or fumble-recovery categories are configured.
- [x] #2 Label shared-stat points, the partial blend and the unblended scoring categories in user-visible notes. Never infer threshold-bonus probability from projected average yardage.
- [x] #3 Keep full blends and native fallback for missing, invalid or unsupported data, including when no finite native total exists for a partial blend.
- [x] #4 Verify direct and partial blends, unsupported fallback, and real-roster coverage independently of player-ID matching.
- [x] #5 A verified NFL bye produces a zero-point Sleeper projection with schedule-based provenance, even if the Sleeper stat row is missing or contains only ADP. Non-bye and unverified missing rows remain unavailable.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Verify the raw weekly stat fields and isolate the four known native-only Sleeper scoring categories from the shared scoring weights.
2. Blend comparable stat points and retain the native remainder only with two valid rows and a finite native total. Label the scope and existing fallback in player and lineup displays.
3. Check direct and partial blends in fixtures, measure real roster coverage, and update PR #47.

Normalize verified Sleeper bye weeks to zero before cross-provider blending and validate the Week 11 roster counts.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Week 11 read-only league verification found a shared-stat blend for all 109 players with usable Sleeper projections out of 138 eligible rostered players, up from zero. The remaining 29 had no usable total. The full supported-scoring provider contract passed separately. Verified 965 default-suite tests, one opt-in skip, static checks, and production build. Ready for review in PR #47.

The verified fifth criterion is the confirmed NFL bye zero. The real Week 11 check showed 22 confirmed bye zeros, 109 blends, and seven unavailable projections. All 968 tests in the default suite passed, one opt-in test was skipped, and static and build checks passed.
<!-- SECTION:NOTES:END -->
