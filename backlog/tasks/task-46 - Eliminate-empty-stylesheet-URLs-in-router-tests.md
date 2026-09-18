---
id: TASK-46
title: Eliminate empty stylesheet URLs in router tests
status: Done
assignee:
  - '@codex'
created_date: '2026-09-14 22:10'
updated_date: '2026-09-15 03:36'
labels:
  - testing
dependencies: []
documentation:
  - README.md
modified_files:
  - README.md
  - src/router.test.tsx
priority: low
type: bug
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Router tests intermittently print React's warning that an empty string was passed to an `href`. The warning appears when the root document head is rendered under Vitest, where the imported stylesheet URL may resolve to an empty test value. Expected warnings make real invalid-link regressions easier to miss.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rendering authenticated and public routes under Vitest does not create a link or anchor with an empty `href` and produces no corresponding React warning.
- [x] #2 The test environment supplies a realistic non-empty stylesheet asset URL or omits only the unavailable test asset without changing production head output.
- [x] #3 Router coverage fails on unexpected React DOM warnings while preserving explicit assertions for intentionally logged application errors.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Render full-document router tests into the jsdom document and provide a realistic mocked URL for the stylesheet asset import.
2. Capture console.error in router coverage, allow structured client_error diagnostics, and fail after each test on every other unexpected console error.
3. Assert the stylesheet URL, run the router and full project checks, and document the test contract.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Observed repeatedly in `src/router.test.tsx` while opening league-creation and shared-report routes. Confirm the exact element before changing code; the leading suspect is `src/routes/__root.tsx` receiving an empty `index.css?url` transform in Vitest. Do not hide arbitrary `console.error` output.

Confirmed that Vitest resolves the CSS ?url import to an empty string and that mounting the full document shell into Testing Library’s default div also produced invalid HTML nesting. Router coverage now mocks the stylesheet to /assets/index.test.css, mounts into jsdom’s document, rejects empty href attributes, and fails after each test on console.error entries other than structured client_error diagnostics.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Router tests now render a valid document with a realistic non-empty stylesheet URL. Empty hrefs and unexpected React/console errors fail coverage, while structured application error diagnostics remain visible and testable. Production head behavior is unchanged, and the test contract is documented.
<!-- SECTION:FINAL_SUMMARY:END -->
