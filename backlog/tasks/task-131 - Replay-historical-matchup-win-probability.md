---
id: TASK-131
title: Replay historical matchup win probability
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:39'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 138000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The existing playoff timeline shows playoff odds by completed week, but old individual matchups cannot be replayed as win-probability graphs through Sunday and Monday. Add historical matchup win-probability timelines where archived scoring and projections support them.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A historical matchup view plots win probability across available game-time snapshots.
- [x] #2 The graph identifies snapshot timing, data coverage and the players or scoring events responsible for major changes when available.
- [x] #3 Matchups without sufficient archived data show an explicit unavailable state.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reuse bounded archive input for chronological matchup replay. 2. Plot accessible observed checkpoints with event table and missing-data state. 3. Verify replay interactions and snapshot roundtrip; document coverage.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Five archive/replay DOM and validation tests pass, including graph accessibility, major event swing, missing manager archive and bounded snapshot roundtrip. Typecheck passes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added accessible probability replay graph and exact event table using validated archive checkpoints; documents gaps and unavailable coverage.
<!-- SECTION:FINAL_SUMMARY:END -->
