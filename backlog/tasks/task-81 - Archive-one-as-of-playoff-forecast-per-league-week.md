---
id: TASK-81
title: Archive one as-of playoff forecast per league week
status: Done
assignee:
  - '@codex'
created_date: '2026-09-29 16:57'
updated_date: '2026-09-29 17:03'
labels: []
dependencies: []
type: feature
ordinal: 84000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Store durable current-season playoff forecasts and their frozen inputs so weekly and final outcomes can validate provider-informed simulations without repeated database copies.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A unique league-season-cutoff key prevents duplicate archives from repeated or concurrent report loads.
- [x] #2 Archive contains weekly provider means and lineups, roster and availability context, season rules, completed scores, schedule, and forecast probabilities.
- [x] #3 Only eligible current-season forecasts are archived, and existing weeks are never overwritten.
- [x] #4 Focused tests verify eligibility, idempotency, and stored payload shape.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a compact immutable MongoDB archive model and builder. 2. Save at the server report boundary for current forecasts. 3. Verify duplicate and eligibility behavior with focused tests; run typecheck and lint.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added a separate MongoDB collection with a unique provider-league/season/completed-week index and insert-only upsert. Private and public insight loads archive only usable current-season provider-informed forecasts; source snapshots include roster slots, rostered-player injury statuses and bye weeks. Archive stores compact team scores, schedule, rules, lineups and forecast probabilities, with capture timestamp and model version. Tests: 348/348 passing; production build, typecheck, lint, format check and diff check pass. No database write or deployment was run in this workspace.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented durable once-per-completed-week playoff forecast archives, preserving prospective validation inputs and probabilities without duplicate records. Verified by archive/index tests and full build/check suite.
<!-- SECTION:FINAL_SUMMARY:END -->
