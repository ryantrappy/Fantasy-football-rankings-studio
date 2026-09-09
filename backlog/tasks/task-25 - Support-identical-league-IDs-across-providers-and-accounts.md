---
id: TASK-25
title: Support identical league IDs across providers and accounts
status: To Do
assignee: []
created_date: '2026-09-09 21:45'
labels:
  - leagues
dependencies: []
documentation:
  - README.md
priority: medium
type: enhancement
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The documented ownership model permits only one account per external league ID and does not support cross-provider collisions. Independent writers should be able to register their own workspaces safely.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Sleeper and ESPN leagues with the same numeric ID can coexist.
- [ ] #2 Two accounts can independently register the same external league without gaining access to one another's drafts or credentials.
- [ ] #3 Existing league records and share links have a documented migration path with ownership-isolation regression coverage.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
