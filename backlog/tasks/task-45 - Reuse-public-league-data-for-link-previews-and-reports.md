---
id: TASK-45
title: Reuse public league data for link previews and reports
status: Done
assignee:
  - '@codex'
created_date: '2026-09-14 22:08'
updated_date: '2026-09-15 03:33'
labels:
  - performance
  - sharing
dependencies: []
documentation:
  - README.md
modified_files:
  - README.md
  - src/api/public-insights.ts
  - src/auth/InsightsAccess.tsx
  - src/components/HistoryPage.tsx
  - src/components/InsightsPage.tsx
  - src/components/public-reports.test.tsx
  - src/router-context.ts
  - src/router.test.tsx
  - src/router.tsx
  - src/routes/__root.tsx
  - src/routes/_public.shared.history.tsx
  - src/routes/_public.shared.insights.tsx
  - src/routes/_public.shared.playoffs.tsx
  - src/routes/_public.tsx
  - src/shared-report-meta.ts
priority: low
type: enhancement
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Opening a shared season, playoff, or history URL currently reads the same public league once for route metadata and again when the report component initializes its league picker. Reusing the validated public result would reduce database work and prevent metadata and page state from observing different sharing states during one navigation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An initial shared-report navigation performs no more than one public league lookup for both metadata and visible page context.
- [x] #2 Client navigation between shared report tabs reuses valid cached public league data while still respecting sharing revocation and normal freshness rules.
- [x] #3 Metadata and visible report state agree when a league is unavailable, and generic previews continue to hide provider errors and private fields.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Put the public insights query cache in router context so route loaders and the public report provider share a request-scoped/client-navigation-scoped cache.
2. Return the validated public league with preview metadata and seed visible report context from that loader result, including a generic unavailable state.
3. Add lookup-count, cross-tab cache, unavailable-state, and privacy coverage; update documentation and run project checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Observed after adding route-head loaders for shared link previews. Consider feeding loader data into the public TanStack Query cache or making the report component accept validated initial league data. Keep cache keys public-only and do not reuse authenticated owner collections.

Created one public insights API per router and passed it through typed route context to both shared-report loaders and the public layout. Loaders now return the allowlisted league with sanitized preview data, and report pages seed their pickers from that result instead of repeating the lookup. Successful data is reused for five minutes across tabs; after that window, loaders check sharing again. Failures produce generic metadata and page errors without retrying or exposing upstream details.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shared report metadata and visible report context now use the same router-scoped, public-only query cache. Initial loads and fresh cross-tab navigation perform one league lookup, while stale navigation revalidates sharing. Unavailable leagues remain generic and consistent. Added cache-count, revocation, privacy, and layout coverage and updated documentation.
<!-- SECTION:FINAL_SUMMARY:END -->
