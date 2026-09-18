---
id: TASK-68
title: Keep league-provider selection responsive in the creation form
status: Done
assignee: []
created_date: '2026-09-18 02:28'
updated_date: '2026-09-18 02:42'
labels: []
dependencies: []
modified_files:
  - src/components/CreateLeague.tsx
  - tests/ui/chakra.spec.ts
  - tests/ui/main.tsx
priority: medium
type: bug
ordinal: 71000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The browser test initially selected the wrapping label, but targeting the native radio revealed the actual defect: updating the TanStack Form field from the radio event leaves the controlled input unchecked in Chrome. Keep provider selection in local React state and pass it to league creation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The native ESPN radio remains checked after a pointer or keyboard selection.
- [x] #2 League creation submits the selected provider value.
- [x] #3 The focused Chakra browser test passes.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
- [x] #3 Run the focused league-creation browser test.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Store the selected provider in local component state, use it for radio rendering and draft persistence, and override the submitted form value with that selection. Keep the test targeting the native ESPN radio and run the focused browser test.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The isolated preview omitted TanStack Router, so selecting ESPN conditionally rendered its settings link and crashed the test harness. Added a minimal memory router to the preview app. Provider choice now uses local state, drives draft persistence and radio rendering, and is explicitly included in the submitted league. The focused league-creation browser test passed in 1.6 seconds; typecheck passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restored reliable ESPN provider selection in the creation form and supplied router context to the isolated browser preview. The browser test now selects the provider card, verifies its selected state, and completes league submission.
<!-- SECTION:FINAL_SUMMARY:END -->
