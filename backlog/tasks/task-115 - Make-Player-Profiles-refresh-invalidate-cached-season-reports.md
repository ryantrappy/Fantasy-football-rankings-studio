---
id: TASK-115
title: Make Player Profiles refresh invalidate cached season reports
status: To Do
assignee: []
created_date: '2026-10-05 17:34'
labels:
  - players
  - caching
dependencies: []
references:
  - src/components/PlayerProfilesPage.tsx
  - src/api/client.ts
  - src/api/insights-cache.ts
  - src/components/PlayerProfilesPage.test.tsx
documentation:
  - docs/code-review-2026-10-05.md
priority: medium
type: bug
ordinal: 122000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Refresh player data button increments retry, but the reload effect calls getInsights(leagueId, year) without the refresh argument. That API keeps current seasons fresh for five minutes and historical seasons indefinitely within the cache lifetime. The button can therefore show fresh live rosters beside unchanged observed scores. A DOM reproduction confirmed the refresh call arguments remain [leagueId, year], while Season Insights and History pass an explicit refresh request. Related completed TASK-53 promises explicit refresh retrieves updated data.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An explicit Player Profiles refresh retrieves updated observed scoring even when the selected current or historical report is cached and fresh.
- [ ] #2 Ordinary initial reads and league or season changes preserve normal cache reuse rather than forcing every read to reload.
- [ ] #3 Refresh preserves the selected league, season and comparisons, and failures or delayed responses cannot replace a newer selected context.
- [ ] #4 A regression test uses the real cache contract or an equivalent assertion to verify explicit invalidation, historical cache behavior, preserved selections and error handling.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
