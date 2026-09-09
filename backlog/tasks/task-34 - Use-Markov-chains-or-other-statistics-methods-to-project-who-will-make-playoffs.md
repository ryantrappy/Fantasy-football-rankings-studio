---
id: TASK-34
title: >-
  Use Markov chains or other statistics methods to project who will make
  playoffs
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 23:11'
updated_date: '2026-09-09 23:16'
labels: []
dependencies: []
priority: high
ordinal: 39000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- Playoff chance
- Then each level of playoffs win percentage
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add a deterministic Monte Carlo forecast to season insights using completed weekly team scores and a clearly labelled standard playoff scenario. Normalize regular-season end/playoff team counts from provider settings; expose an as-of-week selector so historical forecasts exclude future scores. Simulate remaining head-to-head games with known scheduled matchups when available, otherwise explicitly labelled balanced random matchups, rank by simulated wins then points, and simulate a seeded 2/4/6/8-team single-elimination bracket with first-round byes. Show unconditional qualification/round advancement/title odds, sample size and limitations (no injuries/roster forecasting, no division or custom tiebreak replication). Display unavailable state for missing history/settings. Add invariants, symmetry, cutoff, determinism, byes and UI tests, documentation, build/lint and commit.

Current report inputs do not contain reliable future fixtures or full playoff rules for both providers. Forecasts therefore explicitly use neutral random remaining opponents and a fixed standard bracket, with a visible scenario disclaimer rather than claiming provider-exact odds. ESPN defaults are available only when single-week regular matchup periods are explicit. Postseason views are labelled retrospective pre-playoff forecasts.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Adds cutoff-controlled Monte Carlo playoff scenarios to private and shared season insights, with qualification, round advancement and title probabilities. Uses reproducible score distributions and standard 2/4/6/8-team brackets with six-team byes. Clearly labels neutral future schedules, unsupported rules and retrospective forecasts; missing settings/history yield explanations. Seven numerical invariants/cutoff tests and two interactive DOM tests pass; full suite 165 tests, typecheck, lint and production build pass. README and calculation guide document assumptions.
<!-- SECTION:FINAL_SUMMARY:END -->
