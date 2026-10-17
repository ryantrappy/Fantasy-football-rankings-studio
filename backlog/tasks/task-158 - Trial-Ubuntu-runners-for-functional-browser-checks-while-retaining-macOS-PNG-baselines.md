---
id: TASK-158
title: >-
  Trial Ubuntu runners for functional browser checks while retaining macOS PNG
  baselines
status: In Progress
assignee:
  - Codex
created_date: '2026-10-16 04:55'
updated_date: '2026-10-17 03:40'
labels: []
dependencies: []
references:
  - docs/pr-testing-speed-plan.md
  - docs/ui-testing.md
  - 'https://github.com/ryantrappy/Fantasy-football-rankings-studio/pull/33'
priority: medium
type: spike
ordinal: 165000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PR #33 reduced verification from 18m52s to roughly 6–8 minutes using four macOS browser runners. Hosted macOS capacity and platform overhead may still limit feedback speed. The user requested a future Ubuntu trial; this task records that investigation without migrating runners now.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Compare Ubuntu and macOS functional browser checks on the same application commit, Node version and Chrome runtime, recording total elapsed time, queue delay, job/test durations, retries and runner usage over multiple complete runs.
- [ ] #2 All existing functional cases are accounted for exactly once in the proposed required layout; no viewport, assertion, trial count, responsiveness threshold or fixture is weakened to obtain a pass.
- [ ] #3 Canonical original and compact PNG comparisons remain on macOS with unchanged baselines and tolerances; any other platform-sensitive cases are identified and retained on a validated runner.
- [ ] #4 The trial records a go/no-go recommendation with measured benefit, reliability limits, rollback criteria and any required workflow/documentation updates; current required verification remains intact until the trial is validated.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
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
<!-- SECTION:NOTES:END -->
