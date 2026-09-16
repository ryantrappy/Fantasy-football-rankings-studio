---
id: TASK-63
title: >-
  When creating a new league in the ranking studio suggest a ranking based on
  power not necessarily record
status: Done
assignee:
  - Codex
created_date: '2026-09-16 20:22'
updated_date: '2026-09-16 20:28'
labels: []
dependencies: []
priority: medium
ordinal: 66000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- The rankings should be based on how likely the team is to win each week/the whole year not necessarily their current record
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A new unsaved weekly ranking starts in a power order based on completed score and point-margin data, rather than provider standings alone.
- [x] #2 The score uses only weeks before the selected edition, shrinks small samples toward league average, and leaves saved editions unchanged.
- [x] #3 The studio explains the suggested order and tests cover ranking behavior, data boundaries, and unavailable matchup fallback.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add a pure power-order helper that pools completed matchup scoring through the week before the requested edition, regularizes team scoring and margin toward league averages, and deterministically ranks teams without using current provider standings as the ordering signal. Load those historical matchups alongside teams only while creating a missing edition; preserve saved rankings and fall back to provider team order if matchup history is unavailable. Label the unsaved suggestion in the editor, add unit/hook/UI coverage, document the assumptions and limits, run validation, and commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Power score combines a team's completed average points (70%) and average margin (30%), shrunk with three league-average pseudo-observations. Matchup fetches stop at week-1; failure falls back to provider team order. Existing saved editions skip suggestion generation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
New unsaved weekly rankings now begin with a conservative power suggestion based on completed scoring and point margin before the selected week, rather than standings record. The score uses 70% points and 30% margin with three-game league-average shrinkage, deterministic name tiebreaks, and a provider-order fallback if matchup history cannot load. The editor labels it as an editable signal rather than a player/season forecast; saved rankings are unchanged. Validation: focused ranking utility tests (6 tests), TypeScript, lint and diff checks passed.
<!-- SECTION:FINAL_SUMMARY:END -->
