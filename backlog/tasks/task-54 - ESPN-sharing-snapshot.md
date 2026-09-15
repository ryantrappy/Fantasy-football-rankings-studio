---
id: TASK-54
title: ESPN sharing snapshot
status: Done
assignee:
  - Codex
created_date: '2026-09-15 15:56'
updated_date: '2026-09-15 17:58'
labels: []
dependencies: []
ordinal: 57000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
When a user shares an espn league that is private and used their own cookie, create a cache/snapshot of the data used at that point and share with a unique id that references that data. Use that data for that exact link rather than requiring a shared user to have a cookie of their own. Store this data in a new table in the database
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sharing a loaded owner ESPN report saves the displayed season data in a new database collection and returns a unique snapshot link.
- [x] #2 Anonymous snapshot reads use only stored report data and require no ESPN cookies or provider calls.
- [x] #3 Snapshot creation verifies league ownership; saved/public data excludes cookies and account metadata; disabling league sharing blocks snapshot reads.
- [x] #4 The viewer identifies when the snapshot was saved, keeps report views inside the saved seasons, and provides actionable errors for unavailable links or failed saves.
- [x] #5 Tests cover persistence, isolation, public rendering and sharing; documentation describes snapshot behavior.
- [x] #6 Snapshots expire 10 days after creation, are denied immediately after expiration, and are automatically deleted even when the application was offline at the expiration time.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add an allowlisted snapshot schema for displayed SeasonInsights records, owner-authorized create and public read server functions, and a ReportSnapshot MongoDB collection with unique IDs. ShareReport will submit loaded ESPN report records; server verifies ownership/sharing and strips unknown fields. Add a standalone snapshot route backed by an in-memory read-only API using existing InsightsPage/HistoryPage, limited to saved seasons with no live refresh. Preserve league sharing revocation checks. Verify endpoint isolation/no provider calls, exact saved data, DOM sharing/viewer behavior, then run checks and commit TASK-54.

User clarification: persist expiresAt for a fixed 10-day lifetime, add MongoDB TTL deletion plus startup deleteMany for overdue snapshots, and reject expired reads immediately. Verify overdue cleanup and expiration boundary with clock-controlled tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented displayed-data snapshots with nested allowlist validation and owner checks. Snapshot-only API and route reuse report views without live ESPN reads. Every snapshot stores a fixed ten-day expiresAt; MongoDB TTL deletion plus eager startup cleanup use persisted timestamps, and reads reject expired snapshots before the background deletion runs.

Verification: full suite 57 files / 261 tests passed; final sharing controls tested with 34 focused DOM/route tests. Production build including startup plugin, typecheck, lint and diff whitespace checks passed. Expiration/cleanup tests use controlled time and mocked database operations; no live production data was changed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Owner ESPN report sharing now saves the loaded season/history/playoff report into a new reportsnapshots collection and creates a unique /shared/snapshots/<id> link. Anonymous viewers use only the saved data, with saved-season navigation and no ESPN credentials or provider calls. Nested report validation excludes account/cookie metadata, manager IDs are remapped, and the original league sharing switch controls access. Snapshots expire after ten days using persisted expiresAt dates, a MongoDB TTL index, startup deletion of overdue records, and immediate expiry checks on reads. Tests cover independent snapshots, ownership, disabled sharing, metadata filtering, anonymous rendering, clipboard/save failures, expiry and restart cleanup. README documents usage and retention. Full suite (261 tests), final focused tests, typecheck, lint and production build pass.
<!-- SECTION:FINAL_SUMMARY:END -->
