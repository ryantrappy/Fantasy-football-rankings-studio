---
id: TASK-35
title: Keep the local integration check compatible with new server functions
status: To Do
assignee: []
created_date: '2026-09-09 23:23'
labels:
  - quality
dependencies: []
documentation:
  - README.md
priority: medium
type: bug
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
scripts/check-local.mjs asserts that the compiled app contains exactly 19 server functions. The app now has additional profile, writing, report and publication functions, so this count assertion prevents the integration check from exercising its intended scenarios.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The local integration check validates the specific server functions it needs without failing when unrelated functions are added.
- [ ] #2 The check carries ranking revisions through updates and can exercise current save behavior.
- [ ] #3 A successful run against an isolated test database is documented; production data is never modified.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
