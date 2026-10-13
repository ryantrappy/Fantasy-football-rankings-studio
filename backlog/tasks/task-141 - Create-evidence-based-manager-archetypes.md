---
id: TASK-141
title: Create evidence-based manager archetypes
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:41'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 148000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The league can compare manager outcomes and activity, but it does not turn repeatable patterns into shareable manager profiles. Add playful archetypes such as Tinkerer, Waiver Hawk, Regular Season Merchant, Playoff Assassin or Eternal Runner-Up based on measurable league history.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each archetype maps to explicit metrics, season coverage and minimum sample requirements.
- [x] #2 A manager can receive multiple profiles or no profile when evidence is insufficient.
- [x] #3 Labels remain playful and include the underlying evidence so users can assess the characterization.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Define playful profiles with explicit thresholds, minimum samples and season evidence. 2. Support multiple and absent profiles. 3. Verify threshold boundaries and UI explanations.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
21 cumulative tests pass, covering multiple profiles, no profile on small samples, and UI season evidence. Typecheck passes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added independent playful profiles with explicit metrics, thresholds, season coverage and insufficient-sample handling. Calculation/DOM tests pass.
<!-- SECTION:FINAL_SUMMARY:END -->
