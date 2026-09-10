---
id: TASK-32
title: Run repeatable checks for every proposed change
status: To Do
assignee: []
created_date: '2026-09-09 21:45'
labels:
  - quality
dependencies: []
documentation:
  - README.md
priority: medium
type: chore
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The project has unit, browser, build and export-regression checks. Running a reliable set automatically reduces the chance of regressions reaching the main branch.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Proposed changes trigger installation from the lockfile, tests, typecheck, lint and a production build without production credentials.
- [ ] #2 Browser coverage includes ranking interactions, accessibility contrast and unchanged original export snapshots.
- [ ] #3 Failures retain useful diagnostics; live provider checks are separated from deterministic required checks and the workflow is documented.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
