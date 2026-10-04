---
id: TASK-85
title: Invalidate provider-dependent cached data when a league ID changes
status: Done
assignee:
  - '@codex'
created_date: '2026-10-03 21:23'
updated_date: '2026-10-04 03:57'
labels:
  - leagues
  - cache
dependencies: []
references:
  - src/api/client.ts
  - src/api/insights-cache.ts
  - src/api/client.test.ts
documentation:
  - README.md
priority: medium
type: bug
ordinal: 96000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
createApi.management.updateProviderId only refetches the league collection. The season-discovery and insights query keys retain the same workspace leagueId, so a previously loaded report or season list is reused after the workspace points to a different provider league. Historical insights have infinite staleTime. A scratch test loaded 2025 insights and seasons, changed the provider ID, changed the mocked upstream response, and confirmed both reads still returned the old provider's data without calling their server functions again. Pending requests can also repopulate an old-provider entry after the association changes.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 After a provider ID update, the next season and insights reads use the new association, including historical reports with infinite staleTime.
- [x] #2 Requests started before the association change cannot repopulate the workspace cache with old-provider results.
- [x] #3 Invalidation is scoped to the affected workspace and preserves unrelated leagues' cached reports and saved editions.
- [x] #4 Client regression coverage primes caches, changes provider ID, and verifies fresh current/historical data and delayed-request behavior.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Version provider-dependent query keys per workspace after successful provider-ID updates. Cancel and remove old-generation season/insights requests only for that workspace. 2. Verify primed current/historical caches, delayed old requests and unrelated cache/ranking preservation. 3. Document and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Provider-ID updates now increment a workspace-specific generation for season/insights query keys, cancel and remove old-generation requests, and retain unrelated reports and ranking collections. Verified primed current/historical caches, scoped preservation, and delayed old-provider completion in seven client tests; typecheck/lint passed. README updated.
<!-- SECTION:FINAL_SUMMARY:END -->
