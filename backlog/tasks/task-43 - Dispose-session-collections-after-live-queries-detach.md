---
id: TASK-43
title: Dispose session collections after live queries detach
status: Done
assignee:
  - '@codex'
created_date: '2026-09-14 17:45'
updated_date: '2026-09-15 03:21'
labels:
  - reliability
  - authentication
dependencies: []
documentation:
  - README.md
modified_files:
  - README.md
  - src/api/client.ts
  - src/api/client.test.ts
  - src/auth/Authentication.tsx
  - src/router.test.tsx
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
- [x] #1 Navigating away, signing out, and replacing the authenticated account do not clean up a collection until all dependent live queries have detached.
- [x] #2 Every league and ranking collection is still disposed after its session ends, and cached records never become visible to the next account.
- [x] #3 Regression coverage repeatedly mounts and tears down authenticated ranking routes without TanStack DB live-query warnings or leaked subscriptions.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reproduce authenticated route teardown with a live league query and assert that TanStack DB emits no manual-cleanup warnings across repeated sessions.
2. Defer per-session API disposal until descendant effect cleanup has detached live-query subscribers, while preserving per-account collection isolation and eventual cleanup.
3. Add direct disposal/isolation coverage, update session-lifecycle documentation, run project checks, and finalize the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Observed while running the router suite after the guided first-league work. TanStack DB reported that a source collection was manually cleaned up while `live-query-1`/`live-query-2` still depended on it. Inspect the parent/child React effect cleanup order in `Authentication`, `InsightsAccess`, and consumers of `useLiveQuery`; do not solve this by suppressing the warning or leaving per-account collections alive indefinitely.

Reproduced three deterministic manual-cleanup warnings before the fix. Session disposal now clears query requests, waits until every source collection reports zero subscribers, then cleans up all league and ranking collections through one idempotent promise. Authentication keys the API to the authenticated subject so sign-out also ends the prior session.

Validation: the repeated mount/sign-out/account-replacement regression test passes without Live Query warnings; direct API coverage confirms league and ranking collections reach cleaned-up with empty records and a new account sees no old data. Full Vitest suite passed (51 files, 233 tests); TypeScript, oxlint, and production build passed. Changed files were formatted with oxfmt; repository-wide formatting remains affected by pre-existing unrelated files.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Made authenticated collection disposal subscriber-aware and idempotent, tied session identity to authenticated state, and added regression coverage for navigation teardown, sign-out, account replacement, collection cleanup, and cache isolation. Verified with the full 233-test suite, TypeScript, oxlint, and a production build.
<!-- SECTION:FINAL_SUMMARY:END -->
