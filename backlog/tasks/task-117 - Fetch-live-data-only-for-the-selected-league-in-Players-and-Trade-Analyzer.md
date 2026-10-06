---
id: TASK-117
title: Fetch live data only for the selected league in Players and Trade Analyzer
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 17:34'
updated_date: '2026-10-06 17:28'
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
- [x] #1 Players and Trade Analyzer request provider data only for their selected owned league; unrelated registered leagues cause no provider reads for those pages.
- [x] #2 A slow or failing unrelated league does not delay or fail the selected-league result.
- [x] #3 The all-league Live and weekly overview flows retain their current capability, and selected-league loading preserves account isolation and provider access checks.
- [x] #4 Request-count and delayed-provider tests verify selected-league scope, league switching and all-league behavior; UI loading and per-league errors remain clear.
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
Reconnected the owned selected-league live endpoint, cache, pages and tab preloads while preserving newer trade suggestions and all-league overview reads.
<!-- SECTION:FINAL_SUMMARY:END -->
