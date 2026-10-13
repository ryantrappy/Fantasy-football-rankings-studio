---
id: TASK-140
title: Show fantasy soulmate drafting overlap and draft steals
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:40'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 147000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The app does not surface managers who repeatedly target the same players or cases where one manager selected another’s queued player immediately before their pick. Add draft overlap and draft-steal insights only where draft order and queue data are available.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Managers can compare shared draft targets and player overlap with seasons and counts shown.
- [x] #2 Draft-steal claims require explicit queue or equivalent provider evidence; ordinary next-pick timing is not treated as proof of queue intent.
- [x] #3 Missing queue data and incomparable draft formats are labeled unsupported.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Compare stable player IDs across managers within compatible draft formats and observed seasons. 2. Show overlap counts and explicitly unsupported queue steals. 3. Verify format exclusion and same-name identity separation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
17 cumulative tests pass, including same-player cross-season overlap, incompatible format exclusion, missing coverage and DOM queue evidence disclosure. Typecheck passes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added format-aware draft overlap with observed season/count inputs and explicit unsupported queue steals. Verified calculations and DOM disclosures.
<!-- SECTION:FINAL_SUMMARY:END -->
