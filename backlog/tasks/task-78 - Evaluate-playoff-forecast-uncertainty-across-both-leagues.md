---
id: TASK-78
title: Evaluate playoff forecast uncertainty across both leagues
status: Done
assignee: []
created_date: '2026-09-29 15:23'
updated_date: '2026-09-29 15:50'
labels: []
dependencies: []
ordinal: 81000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Evaluate early strength shrinkage, joint predictive uncertainty and persistent roster/performance changes using both corrected league calibrations. Prioritize sound probabilistic assumptions, chronological/league validation and dependence-aware evidence; implement only supported shared improvements.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Candidate models use only cutoff data and the same season-specific playoff rules in both leagues
- [x] #2 Evaluation compares Brier, log loss, early reliability and season-level results against current and standings baselines with explicit small-sample limits
- [x] #3 Any adopted forecast represents mean and variance uncertainty coherently and does not invent injury probabilities from score-only data
- [x] #4 Changes, assumptions, validation and replayable exports are documented and tested
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Freeze a short theoretically motivated candidate list; evaluate both corrected exports; inspect chronological and league transfer results; adopt only justified uncertainty changes, update diagnostics/export and verify.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reviewed both corrected 2021-2025 exports; retained cutoff-only season rules. Screened persistent uncertainty, coherent posterior (precision 3/6), stronger independent shrinkage, plug-in adaptive shrinkage, dynamic strength and a standings ensemble. No candidate improved aggregate playoff Brier in both leagues. Adopted a conditional empirical-Bayes normal/inverse-chi-square posterior with prior mean precision and variance degrees 3 for coherent joint uncertainty: one strength and variance per trial, Student-t marginal scores, correct mean-disagreement term. No injury occurrence/duration/loss rates were inferred from team totals. Weekly diagnostics now integrate the variance mixture. Added deterministic replay/review script and schema-4 exports; frozen predecessor and standings reproduce schema-3 inputs exactly. At 20k trials ESPN Brier 0.164076 to 0.160046; Sleeper 0.122845 to 0.123802. Four-week 80% coverage 68.9 to 78.6% / 69.6 to 79.4%; interval scores improve in both, but early 95% intervals can be conservative. Documented all per-season/chronological results, dependence, inspected-sample limits, ESPN standings superiority and rejected candidates in docs/playoff-uncertainty-review.md. Full suite 335 tests; final additional parameter-reuse regression passes in targeted suite (336 total tests). Build/typecheck, lint/format and two desktop/mobile Playwright calibration tests passed. 48 independent SciPy convolution checks showed probability integration error <=0.00082 on tested cases; no universal numerical bound claimed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented coherent joint score uncertainty and updated diagnostics/UI/export assumptions after reviewing both leagues. Added local reproducible comparison and regenerated both calibration artifacts under Downloads/playoff-uncertainty-review. Improvement is supported by multiweek interval coverage and scores; playoff accuracy tradeoffs, unchanged prior assumptions and unestimated future injury risks are explicit. No deployment or commit performed.
<!-- SECTION:FINAL_SUMMARY:END -->
