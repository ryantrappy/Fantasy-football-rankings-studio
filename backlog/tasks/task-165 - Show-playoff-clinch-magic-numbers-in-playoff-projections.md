---
id: TASK-165
title: Show playoff clinch magic numbers in playoff projections
status: In Progress
assignee:
  - '@codex'
created_date: '2026-11-23T00:22:36Z'
updated_date: '2026-11-23T00:27:51Z'
labels:
  - analytics
  - playoffs
dependencies: []
references:
  - >-
    backlog/tasks/task-162 -
    Add-a-Path-to-the-Playoffs-simulator-as-its-own-nav-item.md
documentation:
  - docs/features/playoffs.md
type: feature
ordinal: 173000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Managers can see their playoff odds, but odds do not tell them how many more regular-season wins their team needs to guarantee a playoff spot. Show that wins-only threshold next to the existing team playoff outlook. This is separate from the hypothetical results and conditional odds tracked in TASK-162.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 For the chosen league and season, show each team's magic number as the fewest additional wins that guarantee a playoff berth across all feasible remaining regular-season results, regardless of which games the team wins.
- [x] #2 Use the actual remaining schedule and season-specific qualification rules, including playoff spots, divisions where applicable, and provider tiebreakers. A berth that still depends on an unresolved tiebreaker is not guaranteed.
- [x] #3 Show distinct states for Clinched (zero), Needs help (the team can qualify, but winning out does not guarantee it), Eliminated (the team cannot qualify), and Unavailable (missing data or unsupported rules prevent determining the result).
- [x] #4 Keep the magic number visible alongside playoff odds and explain that it updates as results become final.
- [x] #5 Verify the threshold and states with deterministic fixtures, including a case where winning out still needs help and a case where an unresolved tiebreaker prevents a guarantee. Update the playoff feature contract.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Evaluate clinch guarantees from cutoff standings, real fixtures, and provider qualification rules in cooperative forecast work.
2. Show the outcome alongside playoff probabilities and document availability limits.
3. Add deterministic regressions and verify the project checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented the cutoff-based clinch search in the forecast worker and displayed the result next to playoff odds. The search reports Unavailable when inputs are incomplete or the work limit is reached. Verified with 944 passing tests, one skipped test, typecheck, lint, format check, and production build. Awaiting PR review.
<!-- SECTION:NOTES:END -->
