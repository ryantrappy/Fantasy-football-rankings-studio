---
id: TASK-115
title: Make Player Profiles refresh invalidate cached season reports
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 17:34'
updated_date: '2026-10-06 17:28'
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
- [x] #1 An explicit Player Profiles refresh retrieves updated observed scoring even when the selected current or historical report is cached and fresh.
- [x] #2 Ordinary initial reads and league or season changes preserve normal cache reuse rather than forcing every read to reload.
- [x] #3 Refresh preserves the selected league, season and comparisons, and failures or delayed responses cannot replace a newer selected context.
- [x] #4 A regression test uses the real cache contract or an equivalent assertion to verify explicit invalidation, historical cache behavior, preserved selections and error handling.
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
Explicit player refresh invalidates cached current and historical scoring while ordinary context changes reuse the cache; preserved selections and stale-response handling.
<!-- SECTION:FINAL_SUMMARY:END -->
