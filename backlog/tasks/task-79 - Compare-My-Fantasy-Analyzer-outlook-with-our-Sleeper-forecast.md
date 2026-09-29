---
id: TASK-79
title: Compare My Fantasy Analyzer outlook with our Sleeper forecast
status: Done
assignee: []
created_date: '2026-09-29 16:08'
updated_date: '2026-09-29 16:19'
labels: []
dependencies: []
ordinal: 82000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Inspect the publicly loaded outlook scripts and exact simulation inputs for league 1312529175982129152. Explain the rank/playoff-probability difference, isolate future scoring assumptions from injury effects, and identify statistically defensible improvements without treating competitor output as ground truth.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Identify loaded scoring, variance, injury and playoff algorithms with source references
- [x] #2 Compare cutoff standings and team scoring inputs and quantify the injury sensitivity
- [x] #3 Document evidence, methodological limits and concrete validation requirements
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Inspected the publicly loaded MFA modules and captured the exact worker inputs for the linked 2026 Sleeper outlook. Public-data replay of current production functions reproduces 76.54% for Ryan, compared with 26% in MFA. Same week-three standings and remaining regular schedule; principal identified difference is future roster means (106.26 points versus our 134.67 average), with a paired injury sensitivity of +9.0 percentage points to 33% in the separate 2500-trial stress test. Stress setting restored and debugger removed. Verified missing gp fields cause MFA variance defaults, and different championship calendars. Documentation-only work; validation passed via public-data replay, payload comparison and browser sensitivity verification; no production code changed or application test suite rerun.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Documented evidence, recovered simulation methods, quantified scoring and injury differences, source links, statistical limitations and validation requirements in docs/mfa-outlook-comparison.md. Competitor probabilities are comparison evidence rather than calibration targets.
<!-- SECTION:FINAL_SUMMARY:END -->
