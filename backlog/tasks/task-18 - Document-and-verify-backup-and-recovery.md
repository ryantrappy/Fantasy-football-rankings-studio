---
id: TASK-18
title: Document and verify backup and recovery
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-09 23:26'
labels:
  - operations
dependencies: []
documentation:
  - README.md
priority: high
type: chore
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
League configuration and written editions are valuable data. Operators need a repeatable way to recover the service after storage loss.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A documented backup and restoration procedure covers league and ranking data and the separate configuration needed to decrypt saved ESPN credentials.
- [x] #2 A restore rehearsal uses an isolated destination and verifies recovered editions and ownership boundaries.
- [x] #3 Documentation specifies retention, access restrictions and how to avoid overwriting the running database.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Write an operator runbook for quiesced MongoDB archive backups, separately protected Auth0/environment/ESPN encryption configuration, retention and restore-to-new-database safeguards. Add a repeatable restore rehearsal that launches its own loopback-only disposable mongod, seeds two owners plus rankings/credentials/publication fixtures, dumps and restores into a separate namespace, then verifies contents, indexes, owner-scoped access and decryptability before cleanup. Use installed mongod/mongodump/mongorestore, never application .env or production MongoDB. Run rehearsal, lint and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a backup/recovery runbook covering complete MongoDB archives, separate ESPN encryption key and Auth0 recovery material, encrypted off-host storage, retention, quiesced writes and restore-to-new-database/cutover safeguards. Added npm run backup:verify, which launches its own disposable loopback mongod and performs real mongodump/mongorestore into another namespace. The rehearsal passes using actual application ownership and decryption services, verifying editions/revisions, unique indexes, publication data, owner isolation and real MongoDB concurrent-save rejection. Typecheck, lint and diff checks pass. No application environment files or production data were accessed; real deployment backup restoration remains an operator procedure.
<!-- SECTION:FINAL_SUMMARY:END -->
