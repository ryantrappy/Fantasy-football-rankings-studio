---
id: TASK-112
title: Keep unusable Sleeper live projections unavailable instead of zero
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 17:34'
updated_date: '2026-10-06 17:28'
labels:
  - analytics
  - live
  - data-quality
dependencies: []
references:
  - src/server/live-matchups.server.ts
  - src/server/insights/projections.ts
  - src/server/combined-projections.server.ts
documentation:
  - docs/code-review-2026-10-05.md
priority: high
type: bug
ordinal: 119000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Live Sleeper normalization accepts any nonempty stat dictionary and sums absent scoring weights as zero. With league scoring rush_yd=0.1, a projection row containing only unrelated_stat=1 becomes a finite zero-point forecast. This differs from the season forecast coverage check and can feed Live, Players, lineup advice and trade analysis as though the player has a genuine zero forecast. A local mocked-provider reproduction confirmed projectedPoints=0 for that input. Related completed tasks 55 and 99 do not cover this normalization case.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A native projection with no finite stat applicable to the selected league scoring remains unavailable rather than becoming a zero forecast.
- [x] #2 Legitimate zero and negative projections remain numeric, while missing scoring settings, nonfinite inputs and unusable dictionaries do not claim covered projection data.
- [x] #3 Live, Players, lineup advice and trade analysis consistently disclose missing projection coverage; a valid optional cross-source estimate may still be used with its actual provenance.
- [x] #4 Provider regression tests reproduce the irrelevant-stat case and verify real zero, negative, missing and valid cross-source cases; calculation documentation explains the coverage rule.
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
Restored finite applicable-stat projection scoring; zero/negative values remain valid and missing coverage stays unavailable, including optional-source provenance.
<!-- SECTION:FINAL_SUMMARY:END -->
