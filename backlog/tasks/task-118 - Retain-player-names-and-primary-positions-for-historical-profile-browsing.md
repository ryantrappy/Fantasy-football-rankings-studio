---
id: TASK-118
title: Retain player names and primary positions for historical profile browsing
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 17:34'
updated_date: '2026-10-06 17:28'
labels:
  - players
  - analytics
  - history
dependencies: []
references:
  - src/player-profiles.ts
  - src/insights.ts
  - src/server/insights/calculate.ts
  - src/server/report-snapshot-schema.ts
  - src/components/PlayerProfilesPage.tsx
documentation:
  - docs/code-review-2026-10-05.md
priority: medium
type: enhancement
ordinal: 125000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Historical observations create PlayerProfile records with names such as Player p0 and no position. Readable identity is filled only from live rosters or the optional current waiver pool. calculateInsights receives provider playerNames and playerPositions but does not retain a profile identity catalog in the report; historical-season views have no matching live roster. A local reproduction supplied Known Player/RB metadata and actual starter position to calculation, yet historical playerProfiles still returned Player p0 with no position. Scoring survives, but name search and position filtering cannot identify many historical or dropped players. TASK-94 implemented the profile view with this coverage limitation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Players with historical observations retain available provider names and primary positions in the selected provider and season without requiring current roster ownership.
- [x] #2 Historical name search and position filtering work with that metadata; current ownership, injury status and projections remain unavailable when unsupported.
- [x] #3 Identity metadata is scoped to players represented in the report, survives snapshots and never merges players across providers or seasons by name; legacy or unknown identities remain explicit.
- [x] #4 Tests cover historical seasons without live data, dropped players, duplicate names across IDs, missing metadata and snapshot round trips; profile coverage documentation is updated.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Repair the partially restored implementation and supporting API/provider files; preserve main’s trade suggestions; verify with regression tests, browser checks, type checks, lint, formatting and a production build.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Restored after accidental shelving and manual merge. Reconnected missing supporting code and reconciled it with the newer trade suggestions implementation.

Recovery validation: 582 unit tests passed (1 skipped). All 51 browser cases passed across the full run and corrected trade-preview rerun. Production build, type checks, lint, formatting and diff checks passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Retained represented player names and positions in reports and snapshots for historical search/filtering without introducing current-season claims.
<!-- SECTION:FINAL_SUMMARY:END -->
