---
id: TASK-26
title: Use season-specific valid week selections
status: To Do
assignee: []
created_date: '2026-09-09 21:45'
labels:
  - data-quality
dependencies: []
documentation:
  - README.md
priority: medium
type: enhancement
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The documented week picker is fixed at 1–18. League and season schedules can differ, so unavailable weeks should not lead writers into confusing empty states.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Week choices reflect the supported schedule for the selected league and season.
- [ ] #2 Unavailable selections receive a clear explanation and a safe way to choose another week.
- [ ] #3 Historical editions remain accessible and preseason behavior is explicitly defined.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
