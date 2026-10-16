---
id: TASK-158
title: >-
  Trial Ubuntu runners for functional browser checks while retaining macOS PNG
  baselines
status: To Do
assignee: []
created_date: '2026-10-16 04:55'
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
