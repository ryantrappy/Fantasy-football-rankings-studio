---
id: TASK-170
title: Add a live projection source selector for Sleeper, ESPN, and Combined
status: In Progress
assignee:
  - '@codex'
created_date: '2026-11-23T05:10:08Z'
updated_date: '2026-11-23T05:16:22Z'
labels:
  - projections
  - preferences
dependencies: []
references:
  - https://github.com/ryantrappy/Fantasy-football-rankings-studio/pull/47
documentation:
  - docs/features/decision-support.md
type: enhancement
ordinal: 178000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Users want to compare live projections from Sleeper, ESPN and the existing blend. ESPN-only must be strict when a player or league scoring rule has incomplete ESPN coverage. Show available partial points, flag incomplete totals, and avoid filling gaps from Sleeper in that mode.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The authenticated user can select Combined, Sleeper only, or ESPN only in the live decision tools. The setting persists per account in the browser and defaults to Combined.
- [x] #2 Strict modes display the selected provider's available points and provenance. Partial points remain labeled and cannot become complete inputs to matchups, lineup advice, trade estimates or waiver comparisons.
- [x] #3 Switching uses the same loaded snapshot, retains selections, and leaves actual points and existing historical and playoff experiments intact.
- [x] #4 Verify the source choices, unavailable and partial states, session isolation, and historical ESPN comparison on the existing Sleeper data.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve original provider totals beside the combined snapshot, and retain available comparable source scores with their scope.
2. Add an account-scoped source control and derive strict or combined estimates without mutating cached snapshots. Wire player, live, weekly, trade and waiver views with explicit partial and missing-data labels.
3. Verify isolation, source switching and historical quality comparisons, and update the active PR.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Strict Week 11 verification on a single Sleeper snapshot returned 110 ESPN shared-stat subtotals, 22 verified bye zeros, and six unavailable eligible players. The 2021–2025 paired comparison found zero fully ESPN-covered lineups on the 295 evaluable matchups. A separate ESPN-preferred sensitivity test with Sleeper fallbacks picked 166 winners versus 168 Sleeper and 169 Combined. All 973 default-suite tests passed with one opt-in skip, along with static checks and the build. Ready for review.
<!-- SECTION:NOTES:END -->
