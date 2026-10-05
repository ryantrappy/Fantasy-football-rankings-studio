---
id: TASK-111
title: >-
  Toggle position strength between remaining projections and completed-week
  actual points
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 17:13'
updated_date: '2026-10-05 17:24'
labels:
  - analytics
  - season-insights
dependencies: []
type: feature
ordinal: 118000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Position strength currently shows only remaining-week projections. Managers also want to compare positional scoring from weeks already completed, using the starters actually fielded in those weeks.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An always-available toggle switches the positional charts and rankings between projected remaining weeks and completed-week actual starter scoring.
- [x] #2 Completed mode excludes future and unfinished weeks, groups actual starters by primary position including flex once, preserves ties and negative/zero points, and discloses missing coverage.
- [x] #3 Actual starter position metadata survives report snapshots, historical reports do not require current rosters, and labels identify actual rather than projected data.
- [x] #4 Focused calculation/provider/UI tests, browser interaction, build and relevant static checks pass; formulas are documented.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve per-starter primary positions from provider reports and snapshot schemas. 2. Add completed-week actual starter aggregation to the existing position-strength model, with shared ranks and explicit missing-data handling. 3. Add a projected/completed toggle and update chart, table and coverage labels together. 4. Verify cutoff, flex, zero/negative points, missing data, provider metadata, snapshots and browser switching; document the completed mode.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Completed mode uses actual fielded starter scores and captured primary positions across the completed horizon; missing coverage remains unranked. Provider-confirmed empty lineups are zero. Historical Sleeper reports fetch the position catalog when starters exist even without current rosters or lineup settings. Both positional views switch together; remaining schedule keeps its basis. Verified 484 unit tests passed (one existing integration test skipped); final focused provider/component rerun 18 passed; two Playwright desktop/mobile tests passed with axe accessibility checks and screenshots; build, typecheck, lint, format and diff checks passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added Projected remaining weeks / Completed weeks only buttons to Season Insights position strength. Completed mode ranks actual starter points through the completed cutoff, excludes bench and unfinished weeks, and preserves zeroes, negatives, ties and unavailable coverage. Captured starter positions survive snapshots, enabling historical reports without current projections. Documented formulas and verified calculations, providers, snapshots, browser switching, mobile layout, accessibility and build/static checks.
<!-- SECTION:FINAL_SUMMARY:END -->
