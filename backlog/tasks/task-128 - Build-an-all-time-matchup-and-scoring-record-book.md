---
id: TASK-128
title: Build an all-time matchup and scoring record book
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:49'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 135000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Historical pages focus on manager and season summaries rather than searchable game-level records. Add league records for closest games, largest blowouts, highest combined scores, highest individual team scores, and the worst beats where a top-scoring team still lost to an even higher scorer.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Users can browse and sort the closest games, blowouts and high-scoring games across league history.
- [x] #2 Worst-beat entries show each team’s scoring rank for that week and the margin.
- [x] #3 Record entries link to the season or matchup when available and show missing-history coverage.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Build sortable/searchable verified game records for margins, combined/individual scoring and top-quartile worst beats; attach full-week scoring ranks, season links and explicit sample coverage; verify ties/ranks and interactive sorting/filtering.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added searchable, numerically sortable matchup/scoring records, full-week scoring ranks, worst-beat filtering and season links. Included verified playoff series once in rivalry/Elo inputs with explicit multiweek record labels. Twenty-seven focused tests plus typecheck pass.
<!-- SECTION:FINAL_SUMMARY:END -->
