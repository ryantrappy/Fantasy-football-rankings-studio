---
id: TASK-27
title: Make report freshness and partial failures visible
status: To Do
assignee: []
created_date: '2026-09-09 21:45'
labels:
  - reporting
dependencies: []
documentation:
  - README.md
priority: medium
type: enhancement
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A report can contain cached data or missing provider results. Readers need to distinguish a complete recent report from a partially available one.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Reports show when their displayed data was last successfully refreshed.
- [ ] #2 A refresh failure preserves usable data and labels affected sections without describing them as current.
- [ ] #3 Retry feedback distinguishes loading, success and continued partial availability in an accessible way.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
