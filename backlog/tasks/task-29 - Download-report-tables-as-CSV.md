---
id: TASK-29
title: Download report tables as CSV
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-14 14:20'
labels:
  - exports
dependencies: []
documentation:
  - README.md
priority: medium
type: feature
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
League members may want to analyze report results elsewhere or retain a copy of the exact values they are viewing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Season and history report tables can be exported with their active filters and visible ordering.
- [x] #2 Exports include clear column names, coverage or missing-value indicators and the relevant league/season context.
- [x] #3 Text values are safely escaped, including spreadsheet-formula-like names, and private account or credential fields are excluded.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

Provide report-level public league/season context to the shared DataTable component. Export the table's current TanStack row model after active sorting and visible limits, using only declared column accessors and optional coverage-aware export values. Serialize explicit unavailable markers, RFC-style CSV quoting, UTF-8 content and spreadsheet-formula neutralization, with contextual filenames. Add export controls to loaded season, playoff and history report tables through the shared scope. Verify sorting/filter/limit fidelity, formula escaping, private-field exclusion and routed report availability; document behavior and run all project gates.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Every table in loaded Season Insights, Playoff Simulation and League History reports now offers a contextual CSV download. Files follow the table's active filters, current TanStack sorting and visible row limit, and include public league/season/coverage metadata, clear headers and explicit `Unavailable (not zero)` cells. Achievement exports retain known-season denominators. Serialization uses only declared table columns, excludes hidden account/credential properties, safely quotes CSV text and neutralizes formula-like strings. Documentation is updated; all 205 tests, lint, typecheck, production build and diff checks pass.
<!-- SECTION:FINAL_SUMMARY:END -->
