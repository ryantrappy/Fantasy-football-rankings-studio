---
id: TASK-16
title: Prevent simultaneous editors from silently overwriting rankings
status: To Do
assignee: []
created_date: '2026-09-09 21:45'
labels:
  - editor
dependencies: []
documentation:
  - README.md
priority: high
type: enhancement
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The same writer may open multiple tabs or devices. A stale save should not silently replace a newer edition.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Saving a stale edition reports a conflict and preserves the local draft.
- [ ] #2 The writer can inspect the newer saved edition before choosing a resolution.
- [ ] #3 Two overlapping saves are covered by a regression scenario demonstrating no silent data loss.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
