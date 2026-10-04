---
id: TASK-86
title: >-
  Prevent delayed publication requests from replacing newer publication
  decisions
status: Done
assignee:
  - '@codex'
created_date: '2026-10-03 21:23'
updated_date: '2026-10-04 04:01'
labels:
  - publishing
  - concurrency
dependencies: []
references:
  - src/server/publishing.server.ts
  - src/server/tests/publishing.test.ts
  - src/components/PublishEdition.tsx
documentation:
  - README.md
priority: medium
type: bug
ordinal: 97000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
publishing.publish verifies the requested draft revision before writing, but its publication upsert filters only by rankingId. Two requests can both pass their respective revision checks; if revision 0 pauses before the upsert, revision 1 publishes, and revision 0 resumes, the public snapshot rolls back to revision 0. A scratch controlled-interleaving test reproduced this with the actual publishing function. Similar ordering permits a publish that was already checked to recreate a link after a later unpublish. Existing stale-draft tests check only the initial revision mismatch, not overlapping publication mutations.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An older delayed publish cannot overwrite a newer successful publication of the same edition; the client receives a useful conflict outcome.
- [x] #2 A publish request already in flight cannot silently undo a later successful unpublish.
- [x] #3 Public readers see one complete approved snapshot, and intentional later republishing still works.
- [x] #4 Deterministic concurrency tests cover out-of-order publishes and publish/unpublish interleavings; existing owner and snapshot-isolation checks still pass.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Capture publication decision generation at request entry, then apply approved snapshots with an atomic generation predicate. Retain revoked tombstones with incremented generations so delayed writes cannot recreate links. 2. Keep public/status reads limited to complete non-revoked snapshots; issue a fresh link on intentional republish. 3. Verify publish ordering, revoke races, legacy generations and owner isolation; document and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Captured publication generation before draft reads and added atomic decision predicates. Delayed publishes conflict after another decision, revoked tombstones prevent link recreation, and intentional republish uses a fresh link. Complete snapshots remain isolated from draft changes. Verified deterministic out-of-order publish and revoke races, ownership/deletion tests, actual standalone MongoDB publish/read/revoke/republish in recovery rehearsal, typecheck and lint. README updated.
<!-- SECTION:FINAL_SUMMARY:END -->
