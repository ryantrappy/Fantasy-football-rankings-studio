---
id: TASK-117
title: Fetch live data only for the selected league in Players and Trade Analyzer
status: To Do
assignee: []
created_date: '2026-10-05 17:34'
labels:
  - performance
  - players
  - trades
dependencies: []
references:
  - src/components/PlayerProfilesPage.tsx
  - src/components/TradeAnalyzerPage.tsx
  - src/server/operations.server.ts
  - src/api/client.ts
documentation:
  - docs/code-review-2026-10-05.md
priority: medium
type: enhancement
ordinal: 124000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PlayerProfilesPage calls getLiveMatchups for every report context then filters to the selected league. TradeAnalyzerPage also loads every registered league before using one. The server operation fans out to all saved leagues concurrently, including optional per-player projection enrichment, and returns only after all complete. A slow unrelated league delays a selected-league page and switching leagues repeats unrelated provider work. This was verified by tracing both page requests and the operations.getLiveMatchups Promise.all. Keep the existing all-league Live and overview views usable while allowing selected-league consumers to avoid this work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Players and Trade Analyzer request provider data only for their selected owned league; unrelated registered leagues cause no provider reads for those pages.
- [ ] #2 A slow or failing unrelated league does not delay or fail the selected-league result.
- [ ] #3 The all-league Live and weekly overview flows retain their current capability, and selected-league loading preserves account isolation and provider access checks.
- [ ] #4 Request-count and delayed-provider tests verify selected-league scope, league switching and all-league behavior; UI loading and per-league errors remain clear.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
