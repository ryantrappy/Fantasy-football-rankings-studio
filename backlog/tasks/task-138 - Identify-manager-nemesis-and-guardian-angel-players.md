---
id: TASK-138
title: Identify manager nemesis and guardian-angel players
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:38'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 145000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The analytics site tracks manager and team results, but it does not connect individual NFL player performances against a manager’s opponent history to matchup outcomes. Identify opposing players who most often hurt a manager and rostered players who most often help win matchups.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nemesis and guardian-angel summaries show player, matchup count, scoring and the method used to attribute a win or loss.
- [x] #2 The view filters to verified appearances and roster ownership in the league history.
- [x] #3 Small samples, partial roster data and provider player-identity changes are handled transparently.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Attribute player help/harm only to reciprocal completed matchups and verified owned starters. 2. Expose counts, scoring, samples and attribution method in UI. 3. Test missing ownership, duplicate appearances and provider identity boundaries.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified player attribution, duplicate starters, missing ownership and changed IDs plus DOM disclosures; 9 tests pass and typecheck passes. Activities constrained to explicit covered weeks.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added verified nemesis/guardian player summaries with counterfactual attribution, samples and identity disclosure; calculation and DOM tests passed.
<!-- SECTION:FINAL_SUMMARY:END -->
