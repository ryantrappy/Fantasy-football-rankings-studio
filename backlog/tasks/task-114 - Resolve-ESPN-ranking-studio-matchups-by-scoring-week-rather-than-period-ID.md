---
id: TASK-114
title: Resolve ESPN ranking-studio matchups by scoring week rather than period ID
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 17:34'
updated_date: '2026-10-06 17:28'
labels:
  - espn
  - rankings
  - data-quality
dependencies: []
references:
  - src/server/providers/espn.provider.ts
  - src/server/insights/schedule.ts
  - src/hooks/useRankingEditor.ts
  - src/server/providers/providers.test.ts
documentation:
  - docs/code-review-2026-10-05.md
priority: high
type: bug
ordinal: 121000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
EspnProvider.getMatchups requests a scoringPeriodId but filters schedule entries by matchupPeriodId === selected week. For a two-week calendar where period 2 covers weeks 3 and 4, selecting week 3 returns no matchup for the valid period-2 fixture; another period with ID 3 can instead select the wrong opponent. The ranking editor consumes this endpoint. Season schedule analysis already distinguishes these calendars. A local provider reproduction returned an empty array for the week-3/period-2 case. This is a separate gap from completed TASK-26 week choices and TASK-109 schedule strength.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A selected ESPN scoring week returns the matchup period containing that week using the published calendar or a validated equivalent mapping.
- [x] #2 The returned opponent and score context explicitly distinguish selected-week points from multiweek aggregate points; unknown or overlapping mappings do not substitute another period.
- [x] #3 Single-week leagues and bye matchups continue to work, including regular-season and playoff period mappings where published.
- [x] #4 Provider and ranking-editor regression tests cover week 3 inside period 2, unknown calendars, single-week behavior and selected-week versus aggregate scores; user-facing score semantics are documented.
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
Resolved ESPN scoring weeks through validated matchup calendars, preserved weekly/aggregate/unavailable score context, and excluded aggregate scores from suggested ranking order.
<!-- SECTION:FINAL_SUMMARY:END -->
