---
id: TASK-124
title: Add a cross-season Elo manager power ranking
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:40'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 131000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Current and historical summaries describe results but do not provide a rating that updates after each matchup and carries from season to season. Add an Elo-style manager rating to compare sustained competitive strength across league history.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Ratings update chronologically from completed head-to-head games and carry across season boundaries.
- [x] #2 The ranking includes an explanation of rating movement and the games contributing to each manager’s rating.
- [x] #3 New managers, incomplete histories, ties, and manager identity changes have documented treatment and coverage.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Replay verified games in year/week/stable-matchup order with initial 1500, K32 and half ties; show ratings and per-game deltas with coverage; verify chronology, conservation and identity handling.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added chronological cross-season Elo with per-game evidence and documented priors/identity treatment. Twelve cumulative calculation/DOM tests and typecheck pass. Tightened schedule completeness and explicit bye handling during review.
<!-- SECTION:FINAL_SUMMARY:END -->
