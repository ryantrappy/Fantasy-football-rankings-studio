---
id: TASK-15
title: Protect ranking drafts across reloads and connection loss
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
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Writers can spend significant time composing weekly commentary. A browser reload, interrupted connection or expired session should not force them to recreate unsaved work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 An unsaved edition can be recovered after a reload with its title, introduction, order and commentary intact.
- [ ] #2 Recovery is isolated by account, league, season and week; another signed-in account cannot see the draft.
- [ ] #3 The writer can choose whether to restore or discard a recovered draft without silently replacing saved content.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
