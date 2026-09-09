---
id: TASK-24
title: Use the correct historical record in weekly rankings
status: To Do
assignee: []
created_date: '2026-09-09 21:45'
labels:
  - data-quality
dependencies: []
documentation:
  - README.md
priority: medium
type: bug
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The README states that provider records are season-to-date rather than reconstructed for the selected historical week. An older ranking can therefore display wins and losses from later games.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Historical editions display team records through the selected week for supported providers.
- [ ] #2 When historical records cannot be established, the UI identifies that limitation rather than presenting current records as historical.
- [ ] #3 Regression fixtures include an older week followed by additional wins, losses and ties; exported records match the selected week.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
