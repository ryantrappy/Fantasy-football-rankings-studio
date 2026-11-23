---
id: TASK-167
title: Add DynastyProcess player IDs as a cross-provider projection input
status: In Progress
assignee:
  - '@codex'
created_date: '2026-11-23T04:12:57Z'
updated_date: '2026-11-23T04:26:41Z'
labels:
  - projections
  - data
dependencies: []
references:
  - https://github.com/dynastyprocess/data
  - https://nflreadr.nflverse.com/reference/load_ff_playerids.html
  - src/server/combined-projections.server.ts
documentation:
  - docs/features/decision-support.md
type: enhancement
ordinal: 175000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Use DynastyProcess's player-ID crosswalk as an additional identity source so ESPN and Sleeper projections can be matched across leagues when the current Sleeper catalogue lacks a unique link. The initial Sleeper coverage probe found 95 of 138 eligible offensive players without a unique link. Track coverage independently of scoring compatibility so future simulations can distinguish identity gaps from unsupported fantasy scoring.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Load the DynastyProcess release as an optional, versioned input and record its source and freshness; confirm upstream terms and attribution.
- [x] #2 Use validated one-to-one Sleeper and ESPN IDs to fill catalogue gaps; surface conflicts and duplicate IDs without silently overriding verified matches or matching by name alone.
- [x] #3 Retain native projections when external resolution is unavailable or scoring remains incompatible, and preserve source provenance.
- [x] #4 Measure additional unique links on a representative roster fixture and test missing, ambiguous, conflicting, and stale external data.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Fetch and cache a versioned DynastyProcess player-ID snapshot with explicit freshness and attribution.
2. Resolve valid one-to-one IDs after existing catalogue matches, report ambiguous links and independent mapping provenance, and keep existing scoring and native fallbacks.
3. Verify fixture and representative live-roster coverage, update the feature contract, and leave the implementation ready for review.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
A fresh DynastyProcess release added 95 unique IDs to 43 existing catalog IDs in a read-only 2026 Week 11 roster sample, for 138 of 138 eligible offensive players. Custom scoring still prevented a blend, and 109 native estimates were available. The loader records the exact CSV revision and checks both directions for collisions. Focused and full automated checks, type checking, lint, formatting, and production build passed. Ready for GitHub review.
<!-- SECTION:NOTES:END -->
