---
id: TASK-156
title: >-
  Ability to filter the Completed-week scoring in season insights by multiple
  positions and show the sum of those
status: Done
assignee:
  - '@codex'
created_date: '2026-10-16 02:46'
updated_date: '2026-10-16 03:36'
labels: []
dependencies: []
ordinal: 163000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
rather than only being able to compare single positions compare multiple in the same type of view and sum those. IE defense and kickers breakdown etc
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add completed-week position selection and sum selected starter positions without changing coverage validation. 2. Connect accessible multi-position controls to the existing chart, table and sort, retaining all-position and projection views. 3. Verify calculation and UI behavior, run project checks, update the feature contract, and finalize the task.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented accessible multi-position checkboxes for completed-week scoring, with all-position reset, selected-position totals/columns/sort/chart/legend, stable position colors and preserved completed selection across projection switches. Full-lineup coverage rules remain unchanged. Validation: npm test passed 156 files / 885 tests (one optional live-provider test skipped); four focused Playwright roster-strength tests passed, including keyboard filtering at 1440px and 390px plus existing accessibility/mobile checks; production build, typecheck, lint, format check and git diff --check passed. The initial sandbox test run could not bind localhost; rerun with localhost access passed. TanStack intent latest catalogue lookup failed due registry DNS; relevant installed prepare-chart-data and build-chart-interactions guidance was read directly. Backlog MCP resolves the parent workspace, so the installed CLI was used in the initialized application directory.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed-week scoring now supports selecting and summing multiple positions, such as K + DEF, in the existing chart and ranking table. All positions restores the full view, projection mode retains its existing behavior, and missing data stays unavailable. README, calculations and TASK-156 feature contract updated. Verified with 885 passing tests, four desktop/mobile browser checks, production build and static checks.
<!-- SECTION:FINAL_SUMMARY:END -->
