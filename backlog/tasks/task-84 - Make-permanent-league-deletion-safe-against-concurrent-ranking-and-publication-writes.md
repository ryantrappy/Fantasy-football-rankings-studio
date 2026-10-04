---
id: TASK-84
title: >-
  Make permanent league deletion safe against concurrent ranking and publication
  writes
status: Done
assignee:
  - '@codex'
created_date: '2026-10-03 21:23'
updated_date: '2026-10-04 03:46'
labels:
  - leagues
  - publishing
  - persistence
dependencies: []
references:
  - src/server/services/leagues.service.ts
  - src/server/services/rankings.service.ts
  - src/server/publishing.server.ts
  - src/server/report-snapshots.server.ts
  - src/server/tests/league-rename.test.ts
documentation:
  - README.md
priority: high
type: bug
ordinal: 87000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
LeaguesService.deleteLeague snapshots ranking IDs, deletes publications only for those IDs, deletes rankings and report snapshots in parallel, and finally deletes the league. A create/publish request that already passed ownership checks can interleave after the ID snapshot and leave an orphan publication. publishing.read checks only the publication record and will still serve it even if its ranking and workspace no longer exist. Scratch mocked-interleaving checks reproduced a successful deletion leaving a late publication, and separately confirmed that public reads accept orphan publication records. Failures between the independent deletes can also leave a partially removed workspace. No live records were deleted during review.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Once permanent deletion succeeds, the workspace's rankings, revision data, report snapshots, and published links are unavailable, including when authorized writes were already in flight.
- [x] #2 A public edition whose source workspace has been deleted returns an unavailable response even if an orphan publication remains.
- [x] #3 Failure partway through deletion can be retried safely with a documented, consistent outcome; unrelated owner workspaces and upstream provider leagues remain intact.
- [x] #4 Deterministic tests cover create/publish interleavings, interrupted cleanup, retry, and cross-owner isolation.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Mark an owned workspace deleted before cleanup so private/public reads and new writes reject it. Retain failed cleanup records for retry. 2. Add post-write ownership checks with compensating cleanup for already-authorized ranking, publication and snapshot writes; validate public edition source existence. 3. Expose pending deletion retries, verify deterministic interleavings and isolation, document and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Deletion marks owner workspaces unavailable before cleanup and retains ranking cleanup IDs until successful completion. Failed deletions are shown in Manage leagues and can be retried. In-flight ranking create/update, publication and snapshot writes recheck workspace access and compensate late writes; public editions require an existing ranking and undeleted workspace. Verified deterministic create/publish races, interrupted cleanup and retry, orphan reads, late snapshots and owner isolation; full-suite run isolated one updated predicate assertion which now passes, 19 affected tests pass, standalone backup rehearsal, lint and typecheck pass. README updated.
<!-- SECTION:FINAL_SUMMARY:END -->
