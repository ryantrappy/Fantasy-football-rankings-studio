---
id: TASK-91
title: Expose a weekly lineup advisor with suggested starter and bench swaps
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 02:43'
updated_date: '2026-10-04 03:51'
labels:
  - analytics
  - lineups
dependencies:
  - TASK-89
references:
  - src/server/insights/projections.ts
  - src/server/insights/load.server.ts
  - src/live-matchups.ts
  - src/components/LiveMatchupsPage.tsx
  - docs/weekly-lineup-review.md
documentation:
  - README.md
priority: high
type: feature
ordinal: 94000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-80 already optimizes legal weekly lineups inside playoff forecasts, and Live Matchups displays current starters/bench. Managers still lack a direct action-oriented comparison between their submitted lineup and the suggested legal lineup. Expose current-week recommendations with projected improvement, alternatives, and clear reasons for excluded or uncertain players. This extends the existing optimization into a manager workflow rather than recreating the simulation feature.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 For the selected team/week, the advisor compares the submitted lineup with a legal proposed lineup and shows named starter/bench swaps and projected point differences when coverage is sufficient.
- [x] #2 Suggestions respect league slots, FLEX/Superflex eligibility, roster ownership, bye/availability status, and known game/lineup locks; unknown lock state is disclosed instead of claimed safe.
- [x] #3 Incomplete projections, uncertain injuries, and stale roster inputs are explained; users can inspect alternative legal scenarios without changing the provider lineup.
- [x] #4 Focused tests cover overlapping slots, locked players, byes, missing projections, and unchanged provider data; recommendations do not require AI generation.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend existing live roster reads with configured slots, availability, bye and known game-lock metadata. Reuse legal projection optimizer with slot-specific locked-player constraints. 2. Expose submitted-versus-proposed named lineup comparison in overview cards with exclusion scenarios, gap/lock/staleness notices and no provider writes. 3. Test FLEX overlap, locks, byes, incomplete coverage and UI alternatives; document and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added read-only current-week lineup advisor to selected team overview cards. Reuses legal optimizer with assigned slots and fixed locked starters, excludes locked bench/reserve/bye/unavailable players, supports provider multiple-slot eligibility and user exclusion scenarios. Shows named starts/benches, projected comparison, timestamps and coverage/uncertainty/unknown-lock warnings; unsupported ESPN multiweek/configuration remains unavailable. Verified overlapping FLEX/Superflex, lock constraints, byes/reserves, missing projections, unchanged input and DOM scenarios; 21 focused tests, full suite and production build passed; typecheck/lint passed. README updated.
<!-- SECTION:FINAL_SUMMARY:END -->
