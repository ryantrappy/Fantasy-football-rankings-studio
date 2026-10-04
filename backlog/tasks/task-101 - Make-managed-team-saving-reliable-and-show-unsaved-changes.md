---
id: TASK-101
title: Make managed-team saving reliable and show unsaved changes
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 04:39'
updated_date: '2026-10-04 04:45'
labels: []
dependencies: []
priority: high
type: bug
ordinal: 108000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A user reports their managed-team selection is not saving. Check provider validation, persistence, reload behavior and save feedback so a confirmed selection survives reopening the league.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A validated managed-team choice persists and reloads for the same owned league and season.
- [x] #2 Successful persistence does not report failure merely because a redundant provider read fails after the database write.
- [x] #3 Unsaved selections and save progress are clearly visible; failures preserve the choice for retry and server validation errors are useful.
- [x] #4 Regression tests cover save/reload, provider outages and UI save feedback.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Remove the redundant provider read after the confirmed MongoDB write. Add explicit unsaved/save feedback and preserve failed drafts with useful errors. Verify actual MongoDB save/reload across seasons plus UI and provider-outage regressions.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Team saves now confirm the actual persisted selection and avoid a redundant post-write provider request. The picker remembers the viewed season by account/league, shows unsaved changes and preserves failed drafts. Verified with 10 regression tests, real isolated MongoDB save/reload and backup test, and typecheck. Repository lint currently reports unrelated concurrent changes in TradeAnalyzerPage and DataTable.
<!-- SECTION:FINAL_SUMMARY:END -->
