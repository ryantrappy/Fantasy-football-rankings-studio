---
id: TASK-56
title: Measure and improve playoff forecast uncertainty and accuracy
status: Done
assignee:
  - Codex
created_date: '2026-09-15 18:02'
updated_date: '2026-09-15 18:17'
labels: []
dependencies:
  - TASK-55
priority: high
ordinal: 59000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The current model has unvalidated fixed blending and no historical probability diagnostics. Improve uncertainty estimates and add time-ordered evaluation so forecast accuracy claims are backed by evidence, distinguishing simulation precision from real forecast accuracy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Forecast distributions account for limited samples and report their assumptions and simulation uncertainty.
- [x] #2 Time-ordered historical evaluation uses only earlier results and reports Brier score, log loss and reliability counts against an equal-chance baseline.
- [x] #3 Projection and injury effects remain explicitly limited to data actually available at the forecast cutoff.
- [x] #4 Tests establish no leakage, numerical behavior and readable accuracy diagnostics; research and limitations are documented.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Replace arbitrary projection blending with provider-centered current-week draws and a historical fallback fitted from prior results. Estimate within-team pooled variance with sample-size shrinkage and predictive uncertainty; compare distribution candidates with rolling-origin probability scores before choosing any more complex method. Add Brier/log-loss/reliability diagnostics from actual completed matchups, ensuring no future scores or today's projections enter earlier cutoffs. Increase Monte Carlo trials with a dynamic error bound, keep assumptions explicit, document data sources and what validation can/cannot establish. Run real public historical benchmark where accessible, tests/build, then commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Real public score-only benchmark (one linked Sleeper league, 2023–2025, 180 rolling-origin games) slightly favors revised variance model in all three seasons; aggregate revised Brier 0.25212 still trails 50/50. Documented evidence and limits; no coefficients tuned to results. Current provider projections cannot be honestly calibrated without archived immutable pregame inputs. Added visible per-league Brier/log-loss/reliability panel, 20,000 draws with dynamic Monte Carlo margin, pooled within-team variance and mean-estimation uncertainty, week-specific provider-centered means, first-round draw support. Loader boundary separately tracked as medium TASK-57.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced fixed 50/50 projection blending with week-specific provider-centered means and historical fallback. Added within-team pooled variance, small-sample predictive uncertainty, 20,000 deterministic trials and a dynamic Monte Carlo margin. Added leakage-safe rolling-origin Brier/log-loss/reliability diagnostics to the playoff UI and a public benchmark script. The 180-game benchmark improved slightly over the old model but did not beat 50/50 overall; docs explicitly limit accuracy claims and identify the need for immutable pregame data. Validation: 58 test files/276 tests passed, focused model/UI tests passed, TypeScript, lint and production build passed. Provider loading at the first-round boundary is handled separately in TASK-57.
<!-- SECTION:FINAL_SUMMARY:END -->
