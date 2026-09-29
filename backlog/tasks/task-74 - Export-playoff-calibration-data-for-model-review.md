---
id: TASK-74
title: Export playoff calibration data for model review
status: Done
assignee:
  - Codex
created_date: '2026-09-28 19:59'
updated_date: '2026-09-28 20:03'
labels: []
dependencies: []
ordinal: 77000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Historical calibration needs a portable artifact that can be attached to a conversation to investigate overconfidence and compare alternative models using the same seasons and cutoffs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A JSON download includes unrounded team-week predictions, outcomes, weekly metrics, run context and coverage notes.
- [x] #2 Successful seasons include minimal historical score, schedule and playoff-setting inputs sufficient to replay alternative models, without credentials or roster details.
- [x] #3 Export is unavailable until a backtest completes with evaluable outcomes; unit and browser checks verify the downloaded file.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add a versioned JSON export builder with explicitly selected replay fields. Retain successful season inputs and run coverage in the panel, download the completed result using a Blob, document attachment/review usage, and verify file contents with unit and browser tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified 10 focused calibration/export/UI unit tests, TypeScript, lint, formatting and diff checks. Desktop and mobile Playwright tests download and parse the JSON, verify all 160 team-week rows and ten weekly metrics regardless of selected cutoff, recompute Brier score from exported predictions, and check nine predictive-only cutoffs. Export projection excludes postseason scores, roster details and manager identities; unavailable seasons remain in coverage notes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added Export calibration JSON after successful backtests. Versioned artifact retains full-precision predictions/outcomes, complete weekly metrics/reliability, coverage and model context, and minimal historical replay inputs. Includes predictive-only metrics excluding known final outcomes. Verified actual downloads on desktop/mobile plus 10 focused tests and TypeScript/lint/format checks; documented how to attach the file for review.
<!-- SECTION:FINAL_SUMMARY:END -->
