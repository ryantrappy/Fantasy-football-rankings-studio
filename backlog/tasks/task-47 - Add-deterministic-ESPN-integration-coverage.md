---
id: TASK-47
title: Add deterministic ESPN integration coverage
status: To Do
assignee: []
created_date: '2026-09-14 22:12'
labels:
  - testing
  - espn
dependencies: []
documentation:
  - README.md
priority: low
type: enhancement
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The public ESPN league previously used by `npm run check:local` now returns 401. The default disposable-database integration check therefore validates the complete Sleeper path but exercises ESPN only when a developer supplies a league ID and personal cookies.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [ ] #1 A deterministic integration path covers ESPN league validation, teams, matchups, and report loading without requiring a developer's personal credentials.
- [ ] #2 Coverage verifies that public ESPN requests omit cookies and private requests attach only the current account's encrypted credentials.
- [ ] #3 Optional live ESPN verification remains available, while local and CI output clearly distinguishes deterministic coverage from live-provider coverage.

<!-- AC:END -->

## Definition of Done

<!-- DOD:BEGIN -->

- [ ] #1 Tests pass
- [ ] #2 Docs updated

<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Observed while updating `scripts/check-local.mjs`: the old public fixture failed with HTTP 401, so the check now skips ESPN unless `TEST_ESPN_LEAGUE_ID`, `TEST_ESPN_S2`, and `TEST_ESPN_SWID` are all set. Prefer a local HTTP contract fixture or sanitized recorded responses over committed secrets or an unstable third-party league. Keep at least one explicitly optional live-provider path.

<!-- SECTION:NOTES:END -->
