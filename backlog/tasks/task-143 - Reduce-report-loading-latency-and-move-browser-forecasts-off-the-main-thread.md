---
id: TASK-143
title: Reduce report loading latency and move browser forecasts off the main thread
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 19:56'
updated_date: '2026-10-13 20:04'
labels:
  - performance
dependencies: []
type: enhancement
ordinal: 150000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Cold history loads serialize seasons and historical weeks, repeat provider reads, and wait to start independent report sections. Hidden history groups also render eagerly. Local synthetic 12-team forecasts take 152–211 ms each and calibration performs 28 forecasts per season, motivating off-thread browser computation while preserving model results.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Historical weeks and selected seasons load with bounded concurrency while preserving ordering, progress, retained results, errors and cancellation.
- [x] #2 Season loading reuses duplicate Sleeper metadata and roster reads and overlaps independent sections without expanding provider traffic beyond a shared bound.
- [x] #3 Browser forecasts and calibration use bounded worker execution with deterministic parity, cancellation and a compatible fallback.
- [x] #4 History report groups mount on first visit and retain their controls after switching tabs.
- [x] #5 Relevant regressions, typecheck, lint and production build pass and performance behavior is documented.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a shared provider request budget and per-load Sleeper request reuse, then overlap independent report reads. 2. Implement concurrent history loading and first-visit report mounting. 3. Route browser forecasts and calibration through a bounded worker with cancellation and fallback. 4. Verify concurrency, failure behavior, forecast parity, UI state, full checks and production worker output.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented rolling max-three historical week reads and concurrent max-three selected seasons, sharing six HTTP slots across provider instances and season auxiliary requests. Added per-report Sleeper request reuse; drafts, player catalog, future fixtures and brackets start early. Failed eager catalog reads still retry when later roster processing needs names. Browser forecasts and calibration use one queued worker with active/queued cancellation, deterministic parity and cooperative fallback. History groups mount on first visit and preserve controls. Read-only integration review found no outstanding correctness issues. The full suite initially exposed a missing ChakraProvider in the archive UI test due to existing workspace UI changes; corrected the fixture only. Final validation: 727 tests passed, one skipped; four desktop/mobile browser checks passed; production build, typecheck, lint, touched-file formatting and diff checks passed. README documents limits, caching and worker behavior. Existing user UI edits were preserved.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reduced cold report latency through bounded concurrent seasons/weeks, report-scoped request reuse and overlapping independent reads. Moved browser simulations and calibration onto one cancellable worker and deferred history report groups until first use. Verified deterministic results, concurrency limits, retries, cancellation, retained data and tab state through 727 passing tests and four browser checks; production build, typecheck, lint and formatting passed.
<!-- SECTION:FINAL_SUMMARY:END -->
