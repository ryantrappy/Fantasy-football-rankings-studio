---
id: TASK-139
title: Track manager player loyalty and historical ownership
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:39'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 146000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Historical player profiles do not show how managers’ roster relationships change over time. Add ownership history such as seasons and weeks rostered, repeated drafting or acquisition, and a best-supported favorite-player summary.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A manager-player view shows seasons, weeks rostered and known acquisition paths from league transactions.
- [x] #2 Favorite-player summaries use visible inputs such as draft, trade, pickup and roster duration with sample counts.
- [x] #3 The report does not claim complete NFL career ownership when league records are partial.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Aggregate observed ownership weeks and known acquisition events by stable manager/player IDs. 2. Show sortable sample-based favorites and partial history disclosure. 3. Verify deduplication and transaction paths with DOM evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified unique observed weeks, known draft/trade/pickup counts, manager filtering and favorite evidence in 13 cumulative tests; typecheck passes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added observed ownership histories and transparent favorite ranking with partial-history disclosure. Calculation and DOM checks pass.
<!-- SECTION:FINAL_SUMMARY:END -->
