---
id: TASK-113
title: >-
  Preserve the configured season start when measuring completed position
  coverage
status: To Do
assignee: []
created_date: '2026-10-05 17:34'
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
- [ ] #1 Completed positional coverage uses the configured reporting start through the completed cutoff, rather than silently moving the start to the earliest returned score.
- [ ] #2 Missing an opening week in a week-1 league leaves affected teams unranked with visible missing coverage, while a league configured to start in week 3 can be fully covered from week 3.
- [ ] #3 The reporting horizon survives saved snapshots; legacy reports without reliable start metadata disclose uncertainty instead of asserting full-season coverage.
- [ ] #4 Tests cover missing opening weeks, legitimate late starts, missing intermediate weeks, no completed weeks, snapshot round trips and UI coverage labels; formulas are updated.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
