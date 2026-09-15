---
id: TASK-43
title: Dispose session collections after live queries detach
status: To Do
assignee: []
created_date: '2026-09-14 17:45'
labels:
  - reliability
  - authentication
dependencies: []
documentation:
  - README.md
priority: medium
type: bug
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Authenticated route teardown can clean up a TanStack DB source collection while a child live query still depends on it. This currently produces a `[Live Query Error] ... manually cleaned up` warning during route-test cleanup and can also occur when a browser session changes or signs out.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [ ] #1 Navigating away, signing out, and replacing the authenticated account do not clean up a collection until all dependent live queries have detached.
- [ ] #2 Every league and ranking collection is still disposed after its session ends, and cached records never become visible to the next account.
- [ ] #3 Regression coverage repeatedly mounts and tears down authenticated ranking routes without TanStack DB live-query warnings or leaked subscriptions.

<!-- AC:END -->

## Definition of Done

<!-- DOD:BEGIN -->

- [ ] #1 Tests pass
- [ ] #2 Docs updated

<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Observed while running the router suite after the guided first-league work. TanStack DB reported that a source collection was manually cleaned up while `live-query-1`/`live-query-2` still depended on it. Inspect the parent/child React effect cleanup order in `Authentication`, `InsightsAccess`, and consumers of `useLiveQuery`; do not solve this by suppressing the warning or leaving per-account collections alive indefinitely.

<!-- SECTION:NOTES:END -->
