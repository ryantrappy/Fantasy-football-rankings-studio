---
id: TASK-157
title: Give each workspace screen its own browser regression case
status: Done
assignee:
  - '@codex'
created_date: '2026-10-16 03:05'
updated_date: '2026-10-16 03:26'
labels: []
dependencies: []
ordinal: 164000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The macOS Actions suite passes 144 cases, but the desktop nine-screen design loop exhausts a single 30-second test timeout and the phone loop retries. Independent screen/viewport checks need independent cases so diagnostics and timing budgets match the behavior being checked, preserving all existing assertions and screenshots.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All nine existing workspace views are checked independently at both 1280px and 390px.
- [x] #2 Every existing hierarchy, navigation, specific workflow, overflow, accessibility, page-error and screenshot check remains, with unchanged timeouts and assertions.
- [x] #3 Focused browser checks pass without retries and the hosted functional suite is verified.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Replace the viewport test containing a nine-view loop with eighteen individually named cases, retain all checks, run exact-runtime focused browser/static validation, and verify Actions.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Focused exact-runtime verification: all 20 studio-design cases pass on Node 24.15.0 with one worker and zero retries (18 screen/viewport cases plus keyboard navigation and icon availability). Every original assertion and screenshot path remains; default 30-second per-case timeout unchanged. Typecheck/lint/format pass. Awaiting full hosted suite verification.

Hosted verification succeeded in Actions run 38843865618 on commit 2c64a05: unit/type/lint/build, strict forecast responsiveness/parity and the complete macOS functional/visual job all passed. The independent screen cases retain all checks and the original 30-second per-case limit. Combined browser coverage is now 164 named cases (162 functional/visual plus two unchanged strict timing cases), reflecting sixteen additional independently named screen cases rather than new or reduced assertions.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Split nine-view workspace loops into eighteen independent screen/viewport cases, retaining every assertion, screenshot and default timeout. All 20 focused studio-design checks passed locally without retries. Full hosted Actions verification passed: unit/static/build, strict timing/parity and complete macOS functional/visual suite.
<!-- SECTION:FINAL_SUMMARY:END -->
