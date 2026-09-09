---
id: TASK-22
title: Remember the last league and edition selection
status: To Do
assignee: []
created_date: '2026-09-09 21:45'
labels:
  - navigation
dependencies: []
documentation:
  - README.md
priority: low
type: enhancement
ordinal: 23000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Returning writers should resume their recent workspace without repeatedly selecting the same league, season and week.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A returning account resumes its last valid league, season and week when no explicit URL selection is supplied.
- [ ] #2 Explicit URL selections take precedence over remembered values.
- [ ] #3 Unavailable or archived selections fall back safely, and selections do not leak across accounts.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
