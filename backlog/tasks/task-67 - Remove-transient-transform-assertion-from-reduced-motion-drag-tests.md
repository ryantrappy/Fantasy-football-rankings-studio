---
id: TASK-67
title: Remove transient transform assertion from reduced-motion drag tests
status: Done
assignee: []
created_date: '2026-09-18 02:24'
updated_date: '2026-09-18 02:42'
labels: []
dependencies: []
modified_files:
  - tests/ui/reorder.spec.ts
priority: medium
type: bug
ordinal: 70000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The reduced-motion keyboard drag tests require an intermediate sibling transform. With motion disabled, that transform is not a stable or user-visible contract and intermittently remains the identity matrix in GitHub Actions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Reduced-motion keyboard drag tests verify keyboard movement through stable user-visible behavior.
- [x] #2 The tests no longer depend on an intermediate CSS transform.
- [x] #3 The focused reorder suite passes.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
- [x] #3 Run the focused reorder browser suite.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Replace the reduced-motion-only layout-transform checks with the DnD live-region announcement that confirms ArrowDown moved the selected item over the next card. Keep cancellation and final dropped-order assertions, then run the focused reorder browser suite.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Replaced the reduced-motion layout-transform checks with DnD Kit's live-region announcement and waited for the keyboard sensor's next-turn listener setup before sending ArrowDown. The full focused reorder suite passed with five tests.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Made reduced-motion keyboard drag tests assert the accessible drag-over announcement and wait for keyboard-sensor readiness, removing the flaky intermediate CSS-transform expectation.
<!-- SECTION:FINAL_SUMMARY:END -->
