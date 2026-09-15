---
id: TASK-39
title: Add loading bars when loading multiple seasons
status: Done
assignee:
  - '@codex'
created_date: '2026-09-14 22:48'
updated_date: '2026-09-15 03:08'
labels: []
dependencies: []
modified_files:
  - README.md
  - src/components/HistoryPage.tsx
  - src/router.test.tsx
priority: high
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Show determinate progress while League history loads or refreshes multiple selected seasons so users can see how much work remains.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A determinate loading bar reports completed and total selected seasons during the initial multi-season load.
- [x] #2 The same progress indicator resets and advances during a refresh without hiding retained season data.
- [x] #3 Progress updates are accessible to assistive technology and disappear when the selected seasons finish.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add an accessible determinate progress component to the League history loading notice, driven by the existing completed-season count.
2. Cover initial loading and refresh progress behavior with focused UI tests.
3. Run the relevant tests and project checks, update documentation, and finalize the backlog task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added a native semantic progress bar driven by the existing completed-season count. The indicator labels initial loads and refreshes separately, while retained reports remain rendered during refresh.

Validation: focused initial/refresh progress route test passed; full Vitest suite passed (51 files, 230 tests); TypeScript, oxlint, and production build passed. The three changed source/documentation files were formatted with oxfmt. The repository-wide format check still reports pre-existing formatting issues in 41 unrelated files, including Backlog-generated task files.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added accessible determinate progress for multi-season League History loads and refreshes, with retained-data behavior documented and covered by route tests. Verified with the full 230-test suite, TypeScript, oxlint, and a production build.
<!-- SECTION:FINAL_SUMMARY:END -->
