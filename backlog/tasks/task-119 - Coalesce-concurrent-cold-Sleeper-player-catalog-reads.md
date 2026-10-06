---
id: TASK-119
title: Coalesce concurrent cold Sleeper player catalog reads
status: To Do
assignee: []
created_date: '2026-10-05 17:34'
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
- [ ] #1 Concurrent cold or expired catalog reads share one provider request and equivalent normalized results across catalog consumers.
- [ ] #2 A failed shared request does not poison future reads; subsequent requests can retry and existing cache freshness behavior is preserved.
- [ ] #3 The shared catalog continues to contain only public player metadata and does not mix league ownership or user credentials into its cache.
- [ ] #4 Deferred-response tests verify single provider request, expiry, shared failures and retry behavior; redundant local coalescing code is removed only if made unnecessary by this change.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
