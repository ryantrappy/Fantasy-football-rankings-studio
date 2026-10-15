---
id: TASK-145
title: Redesign league history as a manager explorer
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 21:32'
updated_date: '2026-10-13 21:51'
labels: []
dependencies: []
ordinal: 152000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The competition history and surrounding archive sections stack many tables and independent controls into one dense screen. The user chose the Manager Explorer mockup, centered on a persistent manager context and focused views with nearby game evidence.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A shared manager picker and verified record summary carry context across competition, season history, stories, and profiles.
- [x] #2 Competition, story, and profile categories show one focused view at a time; all existing analytics and league record views remain reachable.
- [x] #3 Rivalry rows and matrix cells open real game evidence beside the selected record, with shared and snapshot navigation preserved.
- [x] #4 Desktop and phone layouts remain keyboard accessible without page-wide overflow; affected tests and type checks pass.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reuse existing analytics under a manager-centered shell and compact season context. 2. Split dense category collections into focused views and add rivalry evidence. 3. Move league-wide summary/comparison/records into the archive library. 4. Verify manager identity, navigation, empty states, snapshot links, and responsive UI; update documentation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the chosen Manager Explorer with shared manager identity, verified matchup summary, focused and lazily mounted category views, persistent controls, real rivalry evidence, compact season controls, and a separate league archive library. Full league inputs remain available to calculations; snapshot season links stay local. Documentation updated in docs/history-competition.md. Validation: 77 affected component/calculation tests across 26 files, 4 browser tests including complete-page season selection and 320px/390px layouts, axe accessibility scan, lint, typecheck, production build, and diff checks pass. TASK-146 is the user-requested app-wide follow-up and remains To Do.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced dense stacked history analytics with the chosen manager-centered explorer, focused category navigation, and nearby game evidence. Verified manager context and retained controls, public/snapshot links, full-page season controls, and phone layouts through 77 affected tests and 4 browser tests; lint, typecheck and production build pass. Documented navigation and coverage behavior.
<!-- SECTION:FINAL_SUMMARY:END -->
