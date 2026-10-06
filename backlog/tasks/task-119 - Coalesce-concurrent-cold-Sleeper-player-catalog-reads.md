---
id: TASK-119
title: Coalesce concurrent cold Sleeper player catalog reads
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 17:34'
updated_date: '2026-10-06 17:28'
labels:
  - performance
  - caching
  - sleeper
dependencies: []
references:
  - src/server/insights/load.server.ts
  - src/server/live-matchups.server.ts
  - src/server/combined-projections.server.ts
  - src/server/waivers.server.ts
documentation:
  - docs/code-review-2026-10-05.md
priority: low
type: enhancement
ordinal: 126000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
sleeperNames caches only a completed catalog. Two callers arriving before the first request resolves both download and normalize the full NFL player catalog. A deferred mocked HTTP response reproduced two GET calls for two concurrent sleeperNames invocations. Live has a local playerCatalog promise wrapper, but season reports, waiver and enrichment callers access sleeperNames directly, so that wrapper does not coalesce all consumers. This is server-side catalog behavior, separate from completed report-cache and public-route-cache tasks 53 and 45.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Concurrent cold or expired catalog reads share one provider request and equivalent normalized results across catalog consumers.
- [x] #2 A failed shared request does not poison future reads; subsequent requests can retry and existing cache freshness behavior is preserved.
- [x] #3 The shared catalog continues to contain only public player metadata and does not mix league ownership or user credentials into its cache.
- [x] #4 Deferred-response tests verify single provider request, expiry, shared failures and retry behavior; redundant local coalescing code is removed only if made unnecessary by this change.
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
Restored one shared in-flight public Sleeper catalog read with completion-based TTL and failure recovery across all consumers.
<!-- SECTION:FINAL_SUMMARY:END -->
