---
id: TASK-4
title: Improve documentation of how calculations are done
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 02:52'
updated_date: '2026-09-09 04:14'
labels: []
dependencies: []
priority: medium
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Right now some of the values that are displayed are not as obvious where they come from, ie luck score
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add an accessible expandable calculation guide within the shared LeagueSummary so owner/public season and history reports expose the same explanations.
2. Explain luck with a numeric example, scoring/projection formulas, move windows/baselines, leader thresholds and history weighting. Link README to a detailed calculation reference grounded in calculate.ts, normalize.ts and league-summary.ts.
3. Verify guide rendering/expansion and worked-example arithmetic using existing report/calculation tests and a focused DOM check; run typecheck/lint.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified the shared expandable guide through a DOM interaction in public-reports.test.tsx (closed initially, expands visibly, remains present in history). Report/summary/normalization tests: 23 pass. Typecheck and lint pass. Checked formulas against league-summary.ts, calculate.ts and normalize.ts.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added a shared expandable calculation guide to season/history summaries with a worked schedule-luck example, scoring/projection denominators, trade/pickup grading rules, sample thresholds and historical weighting. Added docs/calculations.md and a README link for a full reference.

Verification: 23 report/calculation tests pass, including guide expansion in the DOM; typecheck and lint pass.
<!-- SECTION:FINAL_SUMMARY:END -->
