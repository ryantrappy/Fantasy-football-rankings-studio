---
id: TASK-75
title: Compare playoff forecasts with standings and separate predictive diagnostics
status: Done
assignee:
  - Codex
created_date: '2026-09-28 21:02'
updated_date: '2026-09-28 21:09'
labels: []
dependencies: []
ordinal: 78000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
League calibration shows the current model outperforms simple alternatives, but the equal-chance benchmark ignores banked wins and final-week perfect results inflate convergence. Improve evaluation without replacing the forecasting model with an unproven alternative.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A deterministic standings benchmark preserves cutoff records, points and remaining schedule while assigning equal future scoring strength.
- [x] #2 Predictive convergence and per-season comparisons exclude final known-outcome cutoffs; final seeding agreement remains separately visible.
- [x] #3 JSON exports include standings probabilities, comparative metrics and a versioned description; tests prove leakage safety, baseline behavior and readable desktop/mobile displays.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add an equal-strength distribution mode to the existing simulator while preserving default behavior. Run both models at each historical cutoff, compute comparative scores and per-season summaries, separate resolved cutoffs from the main chart, extend the JSON schema, and test with synthetic fixtures plus the supplied league export. Keep all statistical coefficients unchanged.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added equal-strength standings comparison with identical cutoff-only distributions, retained results/points/schedule, no current projections and no unrelated matchup-validation claims. Predictive chart/reliability and per-season comparisons exclude each season final cutoff; resolved outcomes are separate rules checks. Schema v2 exports standings probabilities and comparative/season/rules metrics. Native replay of supplied 2021–2025 league data reproduced all 700 original probabilities exactly and found positive Brier skill in four of five seasons (2023: -2.95%). Saved refreshed v2 export beside original download. Validation: 67 files/320 unit tests passed; production build, TypeScript, lint, formatting and diff checks passed. Desktop/mobile Playwright exercised comparisons and parsed JSON downloads; desktop screenshot visually reviewed. Final small change suppressed inapplicable matchup validation for benchmark only; focused forecast tests and TypeScript/lint passed afterward.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Improved playoff evaluation with a standings-based benchmark, predictive-only convergence, per-season Brier skill comparisons and a separate final-week rules check. Extended JSON exports to schema v2 and regenerated the supplied league artifact. All 700 original forecasts matched exactly; all 320 unit tests, build, TypeScript/lint and desktop/mobile browser checks passed. Historical forecast coefficients remain supported by the comparison rather than replaced with unproven alternatives.
<!-- SECTION:FINAL_SUMMARY:END -->
