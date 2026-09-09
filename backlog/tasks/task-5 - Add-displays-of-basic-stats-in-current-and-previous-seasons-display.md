---
id: TASK-5
title: Add displays of basic stats in current and previous seasons display
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 02:54'
updated_date: '2026-09-09 11:45'
labels: []
dependencies: []
priority: medium
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Display how many playoff appearances each team has in the historcal area, championships, and last place finishes. Add average finish as well.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add optional season-result records to insight data: playoff appearance, final finish, championship and last-place outcome, retaining null for unknown/unsettled results.
2. Load Sleeper championship/consolation brackets only once playoffs have started or the season is complete. Use resolved placement matches for finishes; derive consolation direction from final-bracket progression (winner vs loser advances), and leave ambiguous/missing results unknown. ESPN uses final provider ranks only for completed seasons plus championship-bracket participation.
3. Aggregate counts and average finish by existing manager identity, with separate measured-season denominators. Display an achievements table in both season/history summaries and finish/playoff columns in year-by-year history.
4. Verify provider normalization, unfinished/partial seasons, byes, missing brackets, renamed managers and UI values/sorting. Update calculation docs and run full checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Paused during research to handle newly added high-priority TASK-10. No implementation started. Existing InsightsSource has no finish fields. Sleeper exposes winners_bracket and losers_bracket plus season.status; current 2026 brackets are already seeded in week 1, so appearances must not be counted until playoffs begin. Prior linked league 1257070201283817472 (2025) status complete; winners placement p fields provide championship finishes. Losers bracket omits some teams (10 teams, 4 playoff teams, only 4 in losers bracket), so do not infer full placements or last place blindly. Public ESPN fixture 1140768 returned HTTP 401 on read; handle unavailable finish data explicitly.

Implemented result normalization and coverage-aware season/history tables. Sleeper complete-season placements and known bracket progression avoid substituting regular-season rank. ESPN prior seasons use valid unique final ranks. Full suite: 135 tests pass, including bracket directions, byes, unfinished/missing data, aggregation and rendered coverage. Typecheck/lint pass. Repository-wide format check reports existing Backlog-generated markdown and health.ts plus new docs; will format owned docs without directly editing Backlog files.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added playoff appearances, championships, last-place finishes and average final placement to season and history summaries, plus per-season outcomes in manager history. Every metric shows known-season coverage; incomplete/unsupported provider results stay unknown.

Sleeper normalization handles championship placements, playoff byes and identifiable consolation/toilet-bowl progression. ESPN uses completed-season final ranks and championship-bracket entrants. Historical counts follow manager identity and exclude unknown outcomes. Calculation reference and README explain provider limitations and denominators.

Validation: all 135 tests pass, including provider results, missing/unfinished data, aggregation and DOM output; typecheck/lint pass. Live ESPN public fixture is now private (401), so provider result validation uses controlled fixtures.
<!-- SECTION:FINAL_SUMMARY:END -->
