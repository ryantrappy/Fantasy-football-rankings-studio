---
id: TASK-1.1
title: Allow owners to revoke public report access
status: To Do
assignee: []
created_date: '2026-09-09 21:45'
labels:
  - sharing
dependencies: []
documentation:
  - README.md
parent_task_id: TASK-1
priority: medium
type: enhancement
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Shared season and history reports currently use publicly readable registered-league URLs. Owners need control when a link should stop being accessible.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Owners can disable public access to their season and history reports and see the current sharing state.
- [ ] #2 Disabled access is enforced for direct URLs and report data requests, including previously issued links.
- [ ] #3 The chosen behavior for existing shared links is documented; owner access continues to work.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
