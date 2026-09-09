---
id: TASK-13.2
title: Cancel a writing-suggestion request
status: To Do
assignee: []
created_date: '2026-09-09 21:45'
labels:
  - writing-ai
dependencies: []
documentation:
  - README.md
parent_task_id: TASK-13
priority: medium
type: enhancement
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A writer may switch tasks or choose the wrong model while generation is running. Cancellation should stop unnecessary work and allow a fresh request.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A running generation exposes a cancel action with clear pending and cancelled feedback.
- [ ] #2 Cancellation stops the associated server work and releases the user's request slot.
- [ ] #3 Cancelled or late responses cannot populate another team's suggestions; cancellation preserves ranking prose.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
