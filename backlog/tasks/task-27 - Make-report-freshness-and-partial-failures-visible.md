---
id: TASK-27
title: Make report freshness and partial failures visible
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-14 14:08'
labels:
  - reporting
dependencies: []
documentation:
  - README.md
priority: medium
type: enhancement
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A report can contain cached data or missing provider results. Readers need to distinguish a complete recent report from a partially available one.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Reports show when their displayed data was last successfully refreshed.
- [x] #2 A refresh failure preserves usable data and labels affected sections without describing them as current.
- [x] #3 Retry feedback distinguishes loading, success and continued partial availability in an accessible way.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

Retain the last successful single-season and per-season history records while manual refreshes run. Show full last-successful timestamps, distinguish initial load, active refresh, successful retry and stale fallback with semantic live feedback, and label unavailable seasons without counting them. Promote tolerated provider gaps into structured section-level availability issues and surface them near the report header. Cover refresh failure/recovery, partial successful responses and provider normalization; update reporting documentation and run the full project checks.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Season Insights, Playoff Simulation and League History now show full last-successful refresh timestamps. Manual refreshes leave usable data visible; failures identify every stale season or report scope, preserve earlier timestamps and exclude seasons with no usable result. Loading, successful refresh and continued partial states use accessible status or alert semantics. Tolerated provider gaps are structured and labeled by affected section, including playoff projections, final finishes and lineup-dependent transaction analysis. README reporting behavior is updated. All 201 tests, lint, typecheck, production build and diff checks pass.
<!-- SECTION:FINAL_SUMMARY:END -->
