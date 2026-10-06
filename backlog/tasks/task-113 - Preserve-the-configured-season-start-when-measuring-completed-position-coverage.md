---
id: TASK-113
title: >-
  Preserve the configured season start when measuring completed position
  coverage
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 17:34'
updated_date: '2026-10-06 17:28'
labels:
  - analytics
  - season-insights
  - data-quality
dependencies: []
references:
  - src/season-strength.ts
  - src/insights.ts
  - src/server/insights/load.server.ts
  - src/server/report-snapshot-schema.ts
documentation:
  - docs/code-review-2026-10-05.md
priority: high
type: bug
ordinal: 120000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Completed position rankings infer their starting week from the earliest available score. In a league that started in week 1, omitting all week-1 rows makes a through-week-3 report rank weeks 2 and 3 as complete 2/2 coverage. The code cannot distinguish a missing opening week from a league configured to start later. This is a gap in the new TASK-111 completed mode, confirmed with a local fixture after removing every first-week row. Store or otherwise retain the actual reporting horizon so incomplete results are not presented as full coverage.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Completed positional coverage uses the configured reporting start through the completed cutoff, rather than silently moving the start to the earliest returned score.
- [x] #2 Missing an opening week in a week-1 league leaves affected teams unranked with visible missing coverage, while a league configured to start in week 3 can be fully covered from week 3.
- [x] #3 The reporting horizon survives saved snapshots; legacy reports without reliable start metadata disclose uncertainty instead of asserting full-season coverage.
- [x] #4 Tests cover missing opening weeks, legitimate late starts, missing intermediate weeks, no completed weeks, snapshot round trips and UI coverage labels; formulas are updated.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Repair the partially restored implementation and supporting API/provider files; preserve main’s trade suggestions; verify with regression tests, browser checks, type checks, lint, formatting and a production build.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Restored after accidental shelving and manual merge. Reconnected missing supporting code and reconciled it with the newer trade suggestions implementation.

Recovery validation: 582 unit tests passed (1 skipped). All 51 browser cases passed across the full run and corrected trade-preview rerun. Production build, type checks, lint, formatting and diff checks passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Restored configured reporting starts through provider loading, calculations and snapshots; missing opening weeks and unknown legacy horizons remain unranked with visible coverage.
<!-- SECTION:FINAL_SUMMARY:END -->
