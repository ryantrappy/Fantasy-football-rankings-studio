---
id: TASK-157
title: Give each workspace screen its own browser regression case
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-16 03:05'
updated_date: '2026-10-16 03:06'
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
- [ ] #3 Focused browser checks pass without retries and the hosted functional suite is verified.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Replace the viewport test containing a nine-view loop with eighteen individually named cases, retain all checks, run exact-runtime focused browser/static validation, and verify Actions.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Focused exact-runtime verification: all 20 studio-design cases pass on Node 24.15.0 with one worker and zero retries (18 screen/viewport cases plus keyboard navigation and icon availability). Every original assertion and screenshot path remains; default 30-second per-case timeout unchanged. Typecheck/lint/format pass. Awaiting full hosted suite verification.
<!-- SECTION:NOTES:END -->
