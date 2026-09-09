---
id: TASK-11
title: Keep Sleeper co-owner groups separate in manager history
status: To Do
assignee: []
created_date: '2026-09-09 04:15'
labels: []
dependencies: []
priority: medium
type: bug
ordinal: 11000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Sleeper manager history currently keys teams only by the primary owner, so changes to co-owners are merged into the same history even though the report promises changed co-owner groups receive separate records. This can attribute results and upcoming finish totals to the wrong management group.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Sleeper team identity includes the primary owner and all co-owners, independent of their ordering.
- [ ] #2 Changing a co-owner produces a separate historical manager record while renamed teams with unchanged owners stay together.
- [ ] #3 Tests cover reordered co-owners, changed groups, and a roster with no owner.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
