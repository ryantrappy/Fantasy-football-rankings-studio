---
id: TASK-162.3
title: Shareable Path to the Playoffs link scoped to this view only
status: To Do
assignee: []
created_date: '2026-11-16T01:01:00Z'
labels:
  - analytics
dependencies: []
parent_task_id: TASK-162
priority: high
type: feature
ordinal: 172000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sharing for the Path to the Playoffs simulator (TASK-162). A share action creates a link that opens only the simulator view: the shared page renders the simulator and nothing else, with no navigation to other sections and no access to other league data beyond what the simulator needs. Follow the existing sharing patterns (ShareReport and the _public.shared routes). A shared link opens with no picks prefilled; the viewer can make their own picks and use the prefill button. The simulator stays authenticated-only by default; only this view is shareable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A shared link renders only the simulator view
- [ ] #2 Shared viewers cannot navigate to other sections or reach other league data from the link
- [ ] #3 Shared link opens with no picks prefilled
- [ ] #4 Browser check opens a shared link and verifies the simulator renders alone
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
