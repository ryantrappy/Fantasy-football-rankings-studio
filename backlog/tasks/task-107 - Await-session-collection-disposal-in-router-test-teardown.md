---
id: TASK-107
title: Await session collection disposal in router test teardown
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 19:27'
updated_date: '2026-10-04 19:28'
labels: []
dependencies: []
modified_files:
  - src/router.test.tsx
type: bug
ordinal: 114000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub Actions reports an unhandled SyncCleanupError when delayed TanStack DB cleanup unmounts QueryClient after Vitest removes the jsdom window. Router tests unmount React without awaiting asynchronous session disposal.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Every router test awaits disposal of all created sessions before jsdom teardown.
- [x] #2 Router and API tests pass with no unhandled cleanup errors.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Track real APIs created by router tests; await their idempotent disposal after React cleanup; verify collection status and run the test suite.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Tracked real session APIs without mocking collection behavior; teardown awaits idempotent disposal after React cleanup and asserts cleaned-up league collection status. Temporarily removing the await made the authenticated navigation test fail deterministically at that assertion. Restored the fix. Full unit suite: 462 passed, 1 skipped, no unhandled errors. Router/API subset: 41 passed. Typecheck, lint, formatting, and diff checks passed. No product documentation change is needed for this test-only teardown fix; the code comment explains the ordering requirement.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Router tests now finish real session collection disposal before jsdom teardown, preventing QueryClient focus cleanup from accessing a removed window. Verified with the complete unit suite and a negative regression check.
<!-- SECTION:FINAL_SUMMARY:END -->
