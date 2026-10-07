---
id: TASK-121
title: Repair ESPN snapshot links after empty maps are removed during persistence
status: Done
assignee:
  - '@codex'
created_date: '2026-10-07 20:30'
updated_date: '2026-10-07 20:33'
labels: []
dependencies: []
type: bug
ordinal: 128000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Opening an ESPN snapshot succeeds at creation but shows Snapshot unavailable on read. Mongoose minimizes empty Mixed objects, removing teamPoints for future weeks without projection data; existing stored snapshots fail their read schema.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 New snapshots retain empty projection and playoff-rule maps through Mongoose serialization.
- [x] #2 Previously stored snapshots missing empty required maps load without ESPN access while malformed map values remain rejected.
- [x] #3 The reported local snapshot URL displays its saved report.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reproduce with Mongoose serialization and cover legacy reads. 2. Preserve empty objects at persistence and restore omitted required maps during validation. 3. Resolve the stale local dependency path, verify the reported URL, and run tests, typecheck, lint, and build.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced the reported database record failing on twelve omitted weekly teamPoints maps. Regression tests failed before the fix and passed after preserving empty objects and restoring omitted required maps. Browser verification of the exact localhost link shows the saved playoff table, including after restarting Vite with forced dependency optimization; final reload has no browser errors. Full suite: 584 passed, 1 optional test skipped. Typecheck, lint, changed-file formatting, diff checks, and production build pass (existing bundler warnings remain).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Preserved empty snapshot maps during Mongoose persistence and accepted omitted empty teamPoints/divisionByTeam maps in older snapshots while rejecting malformed map values. Updated round-trip tests to use Mongoose serialization, added regression coverage, and documented compatibility. Confirmed the reported snapshot displays its saved ESPN playoff forecast without rewriting stored data or fetching ESPN. Restarted the local dev server to clear stale dependency resolution. All required checks pass.
<!-- SECTION:FINAL_SUMMARY:END -->
