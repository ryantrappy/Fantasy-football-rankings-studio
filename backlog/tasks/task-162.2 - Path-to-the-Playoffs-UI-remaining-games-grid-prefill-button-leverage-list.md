---
id: TASK-162.2
title: 'Path to the Playoffs UI: remaining-games grid, prefill button, leverage list'
status: To Do
assignee: []
created_date: '2026-11-16T01:01:00Z'
labels:
  - analytics
dependencies: []
parent_task_id: TASK-162
priority: high
type: feature
ordinal: 171000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Interface for the Path to the Playoffs simulator (TASK-162), backed by TASK-162.1. Remaining regular-season games shown grouped by week; each game lets the user pick a winner or leave it unset. A Prefill from projections button fills every remaining game with the higher projected weekly team points winner; nothing is prefilled on load and the button is the only prefill path. A clear button resets all picks. The selected team playoff chance (qualification, plus seed/bye where the forecast provides them) updates as picks change, debounced and non-blocking per TASK-116. A leverage list ranks remaining games by playoff-chance swing with the if-X-wins chance for each outcome. Team picker defaults to the managed team (TASK-89). Missing projections leave the game unset and are disclosed. Mobile usable; reduced-motion respected.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Every remaining fixture is pickable by week, with unset as the default state
- [ ] #2 Prefill from projections fills all remaining games from projected points; nothing is prefilled before the button is clicked
- [ ] #3 Clear resets all picks and restores the base forecast chance
- [ ] #4 Playoff chance updates as picks change without blocking interaction
- [ ] #5 Leverage list ranks games by swing and shows the if-X-wins chance per outcome
- [ ] #6 Team picker defaults to the managed team
- [ ] #7 Browser checks cover desktop and mobile layouts
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
