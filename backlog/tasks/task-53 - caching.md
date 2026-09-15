---
id: TASK-53
title: caching
status: Done
assignee:
  - Codex
created_date: '2026-09-15 15:55'
updated_date: '2026-09-15 15:59'
labels: []
dependencies: []
priority: medium
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- Add a caching layer so the historical results are not retrieved every single time swapping between pages.
- This can either be in memory on the page or possibly in the DB (you decide but don't overdo the complexity)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Past-season reports are reused when switching pages without repeated server reads.
- [x] #2 Explicit refresh retrieves updated results, and private caches remain scoped to the authenticated session.
- [x] #3 Caching behavior is tested and documented.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Reuse existing QueryClient caching. Keep past-season insights fresh for the session with a one-hour idle retention; current-season reports retain five-minute freshness. Explicit refresh still reloads. Do not clear a router-owned public client when a page layout unmounts. Verify repeat reads, refresh, and account isolation; document and commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Existing in-memory clients now retain historical insights across page reads; router-owned public clients survive layout unmount. Focused cache, account isolation, credentials and public report tests passed (14), plus typecheck and lint.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Historical reports reuse the existing session cache with one-hour idle retention, avoiding repeated provider reads on page navigation. Active seasons retain five-minute freshness and manual refresh remains available. Public layouts no longer dispose router-owned caches. Tests verify concurrent reads, historical reuse beyond five minutes, current-season refresh, manual refresh, and account isolation; README documents lifecycle.
<!-- SECTION:FINAL_SUMMARY:END -->
