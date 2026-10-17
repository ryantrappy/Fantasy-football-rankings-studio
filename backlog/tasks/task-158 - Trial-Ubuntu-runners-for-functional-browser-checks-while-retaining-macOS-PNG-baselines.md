---
id: TASK-158
title: >-
  Trial Ubuntu runners for functional browser checks while retaining macOS PNG
  baselines
status: Done
assignee:
  - Codex
created_date: '2026-10-16 04:55'
updated_date: '2026-10-17 04:05'
labels: []
dependencies: []
references:
  - docs/pr-testing-speed-plan.md
  - docs/ui-testing.md
  - 'https://github.com/ryantrappy/Fantasy-football-rankings-studio/pull/33'
  - 'https://github.com/ryantrappy/Fantasy-football-rankings-studio/pull/34'
documentation:
  - docs/ubuntu-runner-trial.md
priority: medium
type: spike
ordinal: 165000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Current balanced macOS CI takes roughly five to six minutes. The user requested an isolated Ubuntu runner trial and prohibited merging if it is not faster. This spike compares complete verification strategies on fixed application code, retaining macOS PNG comparisons and every existing assertion.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Compare Ubuntu and macOS functional browser checks on the same application commit, Node version and Chrome runtime, recording total elapsed time, queue delay, job/test durations, retries and runner usage over multiple complete runs.
- [x] #2 All existing functional cases are accounted for exactly once in the proposed required layout; no viewport, assertion, trial count, responsiveness threshold or fixture is weakened to obtain a pass.
- [x] #3 Canonical original and compact PNG comparisons remain on macOS with unchanged baselines and tolerances; any other platform-sensitive cases are identified and retained on a validated runner.
- [x] #4 The trial records a go/no-go recommendation with measured benefit, reliability limits, rollback criteria and any required workflow/documentation updates; current required verification remains intact until the trial is validated.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Branch from current main b7cc6ef and preserve the application and lockfile. 2. Tag the three canonical PNG cases, run all other UI cases across four Ubuntu groups and retain a macOS PNG job. 3. Add an explicit manual macOS control strategy on the same commit and capture actual Chrome versions and per-job/test outcomes. 4. Verify exact inventory equivalence and aggregate-gate behavior locally. 5. Open a trial PR, compare multiple complete hosted Ubuntu/control runs on a fixed commit, and record elapsed/queue/test times, retries and runner usage. 6. Keep the PR unmerged if faster reliable verification is not established; document go/no-go and rollback.

Observed an image runtime mismatch (Linux Chrome 155.0.8059.84 versus macOS 155.0.8059.40). Refresh Chrome on ephemeral macOS jobs before repeated fixed-commit comparisons; include refresh overhead and retain preliminary observations separately.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Created isolated branch ci/ubuntu-browser-runner-trial from main b7cc6ef. Added functional/exports suite selection and tags only on the three canonical PNG cases. Candidate inventory (161 Ubuntu + 3 macOS) and control both exactly equal the original 164 cases; both cold probes retained. Checked all 512 aggregate strategy/result combinations and rejected invalid suite/group combinations. Formatting, TypeScript and lint pass. Trial decision requires a meaningful median improvement on multiple fixed-commit runs; slower/inconclusive results leave the PR unmerged.

Preliminary candidate 38999284481 passed in 3m27s, 164 expected cases, zero skips/unexpected/flaky. Browser metadata exposed the patch mismatch; no decision is based on that unmatched pair.

Completed fixed-commit comparison at 9f88819. Successful Ubuntu workflows: 38999722753 (212s), 38999987582 (234s). Successful macOS controls: 39000145006 (370s), 39000583684 (298s). Median 223s vs 334s = 33.2% faster; all four preserve exactly 164 browser identities, zero skips/unexpected/flaky cases, and both cold probes pass without retries. Same Node 24.15.0 and Chrome 155.0.8059 release family; actual platform patches .84 Linux and .85 macOS, with x64/arm64 hardware disclosed. Queue, per-job/test durations and runner seconds are recorded in docs/ubuntu-runner-trial.md. The failed shared performance-setup download in control 38999728242 is retained and excluded from successful medians. GO recommendation exceeds the 10% margin and original main baseline; final report-commit CI must pass before conditional merge.

GitHub now records PR #34 merged at 2026-10-17T04:03:18Z (merge commit 4a20120); the shared checkout moved to main. The completed comparison report is being published as a documentation-only follow-up and the adopted main workflow will be verified once more.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
GO: four Ubuntu functional groups plus one macOS PNG job are measurably faster with unchanged application code and regression coverage. Two successful runs per strategy on 9f88819 give median 3m43s versus 5m34s (33.2% faster), with every browser case covered exactly once and no browser or cold-probe retries. Median macOS runner usage falls 92.5%. Runtime/hardware differences, the separate setup failure, raw metrics and rollback criteria are documented. PR #34 is merged; final report record is a documentation-only follow-up on main.
<!-- SECTION:FINAL_SUMMARY:END -->
