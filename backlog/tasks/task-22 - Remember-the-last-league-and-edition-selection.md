---
id: TASK-22
title: Remember the last league and edition selection
status: Done
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

- [x] #1 A returning account resumes its last valid league, season and week when no explicit URL selection is supplied.
- [x] #2 Explicit URL selections take precedence over remembered values.
- [x] #3 Unavailable or archived selections fall back safely, and selections do not leak across accounts.

<!-- AC:END -->

## Definition of Done

<!-- DOD:BEGIN -->

- [x] #1 - Tests pass
- [x] #2 Docs updated

<!-- DOD:END -->
