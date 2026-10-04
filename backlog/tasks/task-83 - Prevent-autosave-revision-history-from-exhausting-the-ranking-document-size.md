---
id: TASK-83
title: Prevent autosave revision history from exhausting the ranking document size
status: Done
assignee:
  - '@codex'
created_date: '2026-10-03 21:23'
updated_date: '2026-10-04 03:40'
labels:
  - editor
  - persistence
dependencies: []
references:
  - src/server/services/rankings.service.ts
  - src/server/models/weeklyRanking.model.ts
  - src/server/operations.server.ts
  - src/components/RevisionHistory.tsx
  - 'https://www.mongodb.com/docs/manual/reference/limits/#bson-documents'
documentation:
  - README.md
  - docs/backup-recovery.md
priority: high
type: bug
ordinal: 43500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
RankingsService.updateRanking pushes a complete previous edition into the ranking document on every save, with no bound or separate storage. getByLeagueId and getRankingById also load embedded history even when the RPC strips it from the response. The README acknowledges this limit, but saves eventually become impossible for that edition. A scratch test using the actual service update shape and BSON sizing produced a 17,167,363-byte document after 120 revisions of a valid 14-team edition with 10,000-character commentary per team. This exceeds MongoDB's 16 MiB document limit. The reproduction used mocked persistence and BSON sizing, not a live oversized database write. Preserve the existing promise that restoring a revision does not erase history.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Repeated saves of valid large editions remain possible beyond the reproduced 120-save case without exceeding MongoDB document limits.
- [x] #2 Existing revision history remains readable and restorable through a documented rollout or migration; restoring still creates a new revision.
- [x] #3 Routine ranking list/load requests avoid materializing all historical snapshots, and revision browsing remains usable as history grows.
- [x] #4 Regression coverage verifies repeated saves, restoration, and stale-writer rejection with the revised persistence behavior.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Store immutable ranking snapshots in a separate indexed collection before the revision CAS write, preserving standalone MongoDB support and stale-writer rejection. 2. Lazily migrate embedded legacy history before removing it; exclude history from routine reads and page revision browsing. 3. Test large repeated saves, crash-safe archive ordering, legacy restoration and conflicts; update backup/recovery documentation and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Moved durable immutable snapshots to indexed rankingrevisions, preserving revision CAS and standalone MongoDB. Legacy embedded history migrates idempotently before removal; routine reads exclude it. History pages ten older snapshots, with direct restoration of any revision; deletion cleans revision records. Verified 130 large saves, actual standalone MongoDB dump/restore, old-revision restoration and stale-writer conflicts; 370 tests, typecheck and lint passed. README and recovery rollout/rollback docs updated.
<!-- SECTION:FINAL_SUMMARY:END -->
