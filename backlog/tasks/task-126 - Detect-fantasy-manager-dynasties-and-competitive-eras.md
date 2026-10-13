---
id: TASK-126
title: Detect fantasy manager dynasties and competitive eras
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:44'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 133000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Championship totals and year-by-year history exist, but the app does not identify sustained championship runs or changes in league dominance. Detect manager eras such as multiple titles within a defined rolling span.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The league history identifies qualifying title runs and other configurable sustained-success eras with the seasons included.
- [x] #2 Era thresholds and supporting accomplishments are visible and consistently applied.
- [x] #3 Incomplete championship coverage does not produce false era claims.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Detect rolling calendar windows only with complete league championship evidence; add configurable title and regular-success thresholds, visible accomplishments and missing-coverage exclusions; test missing seasons/unknown outcomes and interactive thresholds.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added configurable calendar-span title dynasties and sustained regular success with explicit exclusions for unknown champions and missing seasons. Eighteen cumulative focused tests plus typecheck pass.
<!-- SECTION:FINAL_SUMMARY:END -->
