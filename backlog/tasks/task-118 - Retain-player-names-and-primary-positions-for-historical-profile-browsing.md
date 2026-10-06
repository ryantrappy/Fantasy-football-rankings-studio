---
id: TASK-118
title: Retain player names and primary positions for historical profile browsing
status: To Do
assignee: []
created_date: '2026-10-05 17:34'
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
- [ ] #1 Players with historical observations retain available provider names and primary positions in the selected provider and season without requiring current roster ownership.
- [ ] #2 Historical name search and position filtering work with that metadata; current ownership, injury status and projections remain unavailable when unsupported.
- [ ] #3 Identity metadata is scoped to players represented in the report, survives snapshots and never merges players across providers or seasons by name; legacy or unknown identities remain explicit.
- [ ] #4 Tests cover historical seasons without live data, dropped players, duplicate names across IDs, missing metadata and snapshot round trips; profile coverage documentation is updated.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
