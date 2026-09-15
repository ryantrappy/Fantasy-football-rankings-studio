---
id: TASK-51
title: Figure out top possible scoring weeks ever for the best lineup for each player
status: Done
assignee:
  - Codex
created_date: '2026-09-15 14:00'
updated_date: '2026-09-15 15:44'
labels: []
dependencies: []
modified_files:
  - src/components/InsightsPage.tsx
  - src/router.test.tsx
  - README.md
priority: medium
ordinal: 56000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Best possible line up would be replacing players on the starting line up with players who outscored them on the bench
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The Season insights weekly table shows actual score, best legal lineup score, and missed points for each selected team-week when lineup data are complete.
- [x] #2 Weeks with incomplete provider score, position, or slot data display an unavailable value rather than a fabricated best-lineup total.
- [x] #3 The display is covered by component or DOM-focused tests and documentation explains the unavailable-data boundary.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the existing selected-team weekly scoring table with best legal lineup and missed-points columns from TASK-50’s provider-safe calculation.
2. Render unavailable data explicitly and document the interpretation.
3. Add focused UI coverage, run the relevant checks, finalize the task, and commit only TASK-51 files.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added Best lineup and Missed points columns to the selected-team weekly scoring table. The values come from the provider-safe legal-lineup calculation completed in TASK-50; incomplete historical lineup data stays unavailable. Added a route-level DOM test for available and unavailable weeks, and documented the table semantics. Focused router tests, typecheck, and lint pass.
<!-- SECTION:FINAL_SUMMARY:END -->
