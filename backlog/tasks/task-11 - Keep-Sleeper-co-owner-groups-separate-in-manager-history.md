---
id: TASK-11
title: Keep Sleeper co-owner groups separate in manager history
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 04:15'
updated_date: '2026-09-09 11:52'
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
- [x] #1 Sleeper team identity includes the primary owner and all co-owners, independent of their ordering.
- [x] #2 Changing a co-owner produces a separate historical manager record while renamed teams with unchanged owners stay together.
- [x] #3 Tests cover reordered co-owners, changed groups, and a roster with no owner.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Normalize Sleeper owner identity from the primary owner plus co_owners using sorted deduplicated IDs; retain the existing single-owner key shape.
2. Display all available manager names while keeping the primary user's team-name metadata.
3. Add provider and summary regression tests for reordered groups, changed co-owners, renamed teams and missing owners. Update README and verify affected tests/typecheck/lint.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Provider tests verify sorted/deduplicated co-owners, unchanged single-owner identity, changed groups and missing owners. Summary regression verifies renamed teams aggregate and changed groups separate. 14 affected tests pass; typecheck and lint pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Sleeper team identities now include all primary/co-owner IDs in sorted, deduplicated order. Manager labels include available co-owner names; existing single-owner keys and primary-owner team metadata remain intact. Added provider/history regression tests and README explanation. Validation: 14 affected tests, typecheck and lint pass.
<!-- SECTION:FINAL_SUMMARY:END -->
