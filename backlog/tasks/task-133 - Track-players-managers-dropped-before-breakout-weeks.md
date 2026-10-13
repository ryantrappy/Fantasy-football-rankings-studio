---
id: TASK-133
title: Track players managers dropped before breakout weeks
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:43'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 140000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Waiver summaries describe pickup lift, but the app does not highlight players dropped by a manager shortly before strong performances. Add a waiver graveyard that links a dropped player to subsequent scoring in a defined window.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Dropped-player entries identify the manager, transaction date, subsequent scoring window and relevant league availability.
- [x] #2 The report compares subsequent output with the stated baseline and avoids crediting points outside the configured window.
- [x] #3 Incomplete transaction or player history is labeled and excluded from unsupported conclusions.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Link observed drops to next configurable completed-week window and prior observed baseline. 2. Explain transaction availability and missing scoring coverage without inferred breakouts. 3. Test exact window, incomplete data, availability and manager-filtered DOM; document.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Ten moments tests pass: exact next-week bounds, prior baseline, unavailable/future score exclusion, observed pickup availability and DOM window interaction. Typecheck passes. Added responsive overflow wrappers to moments tables.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added manager-filtered observed drop graveyard with configurable scoring window, explicit prior baseline, coverage and availability evidence.
<!-- SECTION:FINAL_SUMMARY:END -->
