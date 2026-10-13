---
id: TASK-122
title: Show all-time manager head-to-head records and rivalries
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:37'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 129000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
League history has multi-season manager summaries, but it does not answer who a manager consistently beats or loses to. Add pairwise records so managers can see total wins/losses/ties, points for and against, win rate and average margin against each opponent, with evidence-based biggest rival, personal punching bag and kryptonite callouts.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A manager can inspect their all-time matchup record against every other manager, with games played, W-L-T, points for/against, win percentage and average margin.
- [x] #2 Rival, punching bag and kryptonite labels use configurable minimum sample coverage and explain the evidence behind each label.
- [x] #3 A league-wide rivalry matrix compares every manager pair and handles ties, manager identity changes and missing historical seasons.
- [x] #4 Insufficient samples and unavailable history are shown explicitly.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Build a reciprocal completed-game dataset with stable identity and explicit coverage; expose configurable pair records and matrix; verify calculation and interactive behavior.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Four targeted calculation and DOM interaction tests pass; TypeScript passes. Missing seasons, unpaired/nonfinite rows, identity changes, ties and configurable thresholds verified.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added stable-identity head-to-head, evidence-backed configurable labels and complete rivalry matrix with coverage. Verified with four targeted Vitest tests and typecheck.
<!-- SECTION:FINAL_SUMMARY:END -->
