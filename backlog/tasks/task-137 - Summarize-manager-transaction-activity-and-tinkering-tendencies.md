---
id: TASK-137
title: Summarize manager transaction activity and tinkering tendencies
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:36'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 144000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
League history reports outcomes of trades and pickups but not managers’ transaction volume or season-to-season tinkering patterns. Add transaction activity summaries that count waiver claims, roster moves and trades where provider data supports them.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Managers can compare transaction counts by season and transaction type.
- [x] #2 Counts use explicit provider coverage and distinguish unsupported transaction categories.
- [x] #3 Playful activity labels are optional, explainable and based on stated thresholds.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Count deduplicated provider transactions per manager and season with explicit category coverage. 2. Add comparison UI with optional explained activity labels. 3. Verify calculation and DOM behavior and document limitations.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified deduplication, unknown versus zero coverage, and opt-in label interaction with Vitest (3 passing assertions/tests); typecheck passed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added provider-covered manager transaction comparisons and optional explained activity labels. Calculation and DOM tests passed; documentation records coverage limits.
<!-- SECTION:FINAL_SUMMARY:END -->
