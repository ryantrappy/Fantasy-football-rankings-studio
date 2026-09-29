---
id: TASK-76
title: Fix ESPN historical playoff qualification loading
status: Done
assignee: []
created_date: '2026-09-29 14:44'
updated_date: '2026-09-29 14:46'
labels: []
dependencies: []
ordinal: 79000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
ESPN mMatchup omits playoffTierType, causing historical calibration seasons to be excluded. Load authoritative bracket labels without depending on manager continuity.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ESPN historical loading retrieves championship bracket labels
- [x] #2 Regression coverage verifies prior-season qualifiers independently of manager identity
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Request mMatchupScore in metadata; verify with provider contract and live 2023 league payload; run relevant tests and typecheck.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added mMatchupScore to ESPN metadata requests so historical championship bracket labels are available. Verified ESPN 1140768 in 2023: mMatchup had no tier labels; mMatchupScore identifies qualifiers 1, 5, 7, 8. Regression test preserves all historical team IDs and former manager data. All 67 test files / 321 tests, typecheck, lint, and touched-file formatting pass. Updated calculation documentation.
<!-- SECTION:FINAL_SUMMARY:END -->
