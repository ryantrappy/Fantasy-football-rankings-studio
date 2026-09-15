---
id: TASK-46
title: Eliminate empty stylesheet URLs in router tests
status: To Do
assignee: []
created_date: '2026-09-14 22:10'
labels:
  - testing
dependencies: []
documentation:
  - README.md
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

- [ ] #1 Rendering authenticated and public routes under Vitest does not create a link or anchor with an empty `href` and produces no corresponding React warning.
- [ ] #2 The test environment supplies a realistic non-empty stylesheet asset URL or omits only the unavailable test asset without changing production head output.
- [ ] #3 Router coverage fails on unexpected React DOM warnings while preserving explicit assertions for intentionally logged application errors.

<!-- AC:END -->

## Definition of Done

<!-- DOD:BEGIN -->

- [ ] #1 Tests pass
- [ ] #2 Docs updated

<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Observed repeatedly in `src/router.test.tsx` while opening league-creation and shared-report routes. Confirm the exact element before changing code; the leading suspect is `src/routes/__root.tsx` receiving an empty `index.css?url` transform in Vitest. Do not hide arbitrary `console.error` output.

<!-- SECTION:NOTES:END -->
