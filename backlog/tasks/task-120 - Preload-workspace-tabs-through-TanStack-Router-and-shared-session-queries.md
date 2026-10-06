---
id: TASK-120
title: Preload workspace tabs through TanStack Router and shared session queries
status: Done
assignee:
  - '@codex'
created_date: '2026-10-06 15:22'
updated_date: '2026-10-06 15:40'
labels:
  - performance
  - router
  - caching
dependencies: []
priority: medium
type: enhancement
ordinal: 127000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Tab pages currently fetch in component effects, and several APIs force repeated reads. Warm route code and data during the first ready workspace load using TanStack Router loaders and the existing session cache so switching tabs reuses the same league, season, live and report queries.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The first ready workspace load preloads each main navigation tab without blocking the active page; search context and explicit league/season selection are respected.
- [x] #2 Loaders and pages share query keys and concurrent requests, with appropriate freshness for live, current-season and historical data and working explicit refresh.
- [x] #3 Account, provider identity and credential changes cannot reuse stale private data; no private requests run before authentication/setup, and public tabs remain public.
- [x] #4 Router integration and cache tests verify first-load warming, navigation reuse, refresh, errors and isolation; browser checks, build and static checks pass and behavior is documented.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add shared query caching for tab inputs with mutation invalidation and explicit refresh. 2. Add tab route loaders and inject the ready session API into router context; preload main tabs in the background with the selected scope. 3. Keep public report loaders and caches compatible and warm shared report tabs. 4. Test real router/cache request counts, refresh and session isolation; verify browser behavior and build/static checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented authenticated tab loaders plus a mounted-workspace background preloader. Public report tabs use only their public API and preserve SSR previews and history progress. Loaders return no private report data; session QueryClient caches remain authoritative with Router defaultPreloadStaleTime=0. Shared keys coalesce live, report, league, ranking, provider-context and managed-team requests. TTLs: live 15 seconds; leagues/rankings/managed choices 30 seconds; current reports/provider context 5 minutes; historical data retained until invalidated with 1-hour idle GC for provider queries. Explicit refresh bypasses freshness; provider, credential and league mutations invalidate affected reads. Disposal cancels reads, waits for collection subscribers to detach, then clears caches. Owner access updates atomically during concurrent league reads. Verified: full Vitest suite 491 passed, 1 skipped; final API/router checks 48 passed; Chromium UI checks 13 passed covering navigation, desktop/mobile tabs, players/trades/live/overview and accessibility. Production build/typecheck, lint, format and diff checks passed. Existing build dependency directive warnings remain. README documents preload scope and cache policies.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Workspace tabs now warm their route code and shared data in the background after authentication/setup. Later navigation reuses session queries while explicit refresh and mutation invalidation keep reads current. Public tabs stay public and account caches are isolated. Verified with 491 passing tests, 13 browser checks, production build, typecheck, lint and formatting.
<!-- SECTION:FINAL_SUMMARY:END -->
