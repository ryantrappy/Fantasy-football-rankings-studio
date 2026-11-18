---
id: TASK-163
title: Populate Sleeper season scoring projection comparisons
status: Done
assignee: []
created_date: '2026-11-18 05:20'
updated_date: '2026-11-18 05:23'
labels: []
dependencies: []
type: bug
ordinal: 173000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Avg. vs. projection is always blank in Season Insights for Sleeper leagues because historical player forecasts never populate the team-week projection.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Season Insights derives completed Sleeper team-week totals from exact-week, league-scored forecasts for the actual starters and uses them in Avg. vs. projection and Beat projection.
- [x] #2 A missing starter forecast or empty lineup leaves the team-week comparison unavailable; explicit zero and negative projections remain valid and bench players do not count.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Reproduce the gap through the Sleeper report loader, populate complete historical starter totals, and verify scoring, missing coverage, and report documentation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Confirmed the original loader returned null for every Sleeper team projection even with full starter coverage. The amended loader regression fails on the original behavior and covers partial and complete lineups, explicit zero and negative forecasts, an empty lineup, and feed outages.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed Sleeper scoring comparisons now use the sum of forecasts for actual starters when coverage is complete. Verified 122 insights, provider, snapshot, and cache tests, six UI component tests, TypeScript, lint, formatting, and whitespace checks.
<!-- SECTION:FINAL_SUMMARY:END -->
