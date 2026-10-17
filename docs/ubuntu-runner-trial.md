# Ubuntu browser runner trial — TASK-158

The trial branch starts at main `b7cc6ef`, whose balanced macOS verification passed in 5m33s on [run 38914578279](https://github.com/ryantrappy/Fantasy-football-rankings-studio/actions/runs/38914578279). Earlier 8-minute runs are historical context, not the current comparison baseline. Application code and the lockfile remain unchanged.

## Strategies and coverage

- **Control:** four macOS groups run the original 164 functional cases, including all three canonical PNG comparisons.
- **Candidate:** four Ubuntu groups run 161 functional cases; a separate macOS job runs the three tagged PNG comparisons. Both strategies retain the two isolated Ubuntu performance probes and full quality checks.
- Both use Node from `.nvmrc`, locked Playwright, the Chrome stable channel, one worker per runner, the same fixtures/viewports/assertions and one retry. Each browser result artifact records actual Node/Chrome versions, platform and architecture. macOS jobs refresh stable Chrome explicitly because the runner image initially supplied patch .40 while Ubuntu supplied patch .84. Matched-version comparisons must be distinguished from preliminary image-default runs; refresh setup cost is included in workflow totals.
- The exact union of candidate selections must equal the original test inventory, with no overlap or skipped cases. No baseline, tolerance, timeout, trial count or responsiveness threshold may be weakened to make Ubuntu pass.
- Manual dispatch accepts `browser-runner=macos-latest` for the control and `browser-runner=ubuntu-latest` for the candidate. PR runs select the candidate. Strategy-specific concurrency prevents a control from cancelling a candidate; do not start another run of the same strategy/ref until its predecessor finishes.

## Decision criteria

Compare at least two complete runs of each strategy on one fixed trial commit, recording workflow creation-to-completion elapsed time, runner queue delays, per-job/test durations, retries and total runner seconds by operating system. A control and candidate may run together, using independent runners; note shared account-capacity effects in queue measurements. Retain JSON reports and compare identities as well as totals.

Recommend adopting Ubuntu only if the median complete workflow is at least 10% faster than the macOS control, all candidate runs pass with no new retry pattern, coverage matches exactly, and browser/runtime versions are comparable. The 10% margin avoids calling small hosted timing fluctuations an improvement. Failed, slower or inconclusive results are **no-go for merging**. No automatic merge was configured; integration remained conditional on evidence of improvement.

If platform-specific geometry, fonts or accessibility assertions fail, inspect their diagnostics. Keep affected cases on a validated runner or reject the migration; do not loosen assertions. Returning functional jobs to `macos-latest` with the full suite and removing the extra PNG job restores the current strategy. The trial is isolated on its branch, so an unmerged no-go does not change main.

## Validation and results

Local discovery verified that candidate groups contain 40/31/55/35 cases and the macOS PNG selection contains three. Their union equals all 164 original functional identities exactly once; the full macOS control inventory is identical and both cold probes remain selected. Both strategies were then verified through hosted results; their retained JSON inventories exactly match the original identities. An AST comparison also confirms every Chakra test body and title is unchanged, with only selection tags added.

Preliminary candidate run 38999284481 passed in 3m27s with 164 expected cases and zero skips/failures/retries. It used Linux Chrome 155.0.8059.84 and macOS Chrome 155.0.8059.40. This is preliminary strategy evidence, not a matched-version timing pair; further runs align the macOS browser before deciding.

## Completed comparison and recommendation

**GO: adopt the mixed runner strategy.** On fixed commit `9f888192f9a0ec6a1a7fecad089c2b8df8ae0e10`, Ubuntu completed at a median **3m43s**, versus **5m34s** for successful macOS controls: **33.2% less elapsed time**. Both candidate runs beat even the faster successful control. This exceeds the 10% decision margin. The independently observed original image-default control and fresh main run both took 5m33s, so the practical improvement also holds against the existing strategy without browser refresh overhead.

| Strategy / run                                                                                                | Complete workflow | Max job queue | Ubuntu runner seconds | macOS runner seconds | Browser results        |
| ------------------------------------------------------------------------------------------------------------- | ----------------- | ------------- | --------------------- | -------------------- | ---------------------- |
| [Ubuntu 38999722753](https://github.com/ryantrappy/Fantasy-football-rankings-studio/actions/runs/38999722753) | 3m32s             | 6s            | 844                   | 80                   | 164 passed, no retries |
| [Ubuntu 38999987582](https://github.com/ryantrappy/Fantasy-football-rankings-studio/actions/runs/38999987582) | 3m54s             | 6s            | 1012                  | 84                   | 164 passed, no retries |
| [macOS 39000145006](https://github.com/ryantrappy/Fantasy-football-rankings-studio/actions/runs/39000145006)  | 6m10s             | 9s            | 219                   | 1199                 | 164 passed, no retries |
| [macOS 39000583684](https://github.com/ryantrappy/Fantasy-football-rankings-studio/actions/runs/39000583684)  | 4m58s             | 7s            | 208                   | 999                  | 164 passed, no retries |

Queue is each job's actual API `created_at` to `started_at` interval. Runner seconds sum `started_at` to `completed_at` for allocated jobs, grouped by actual runner labels; skipped control PNG jobs consume none. These are resource measurements, not monetary prices. Median macOS usage fell from 1099s to 82s (**92.5%**), while median Ubuntu usage increased from 213.5s to 928s. Combined allocated runner time fell from 1312.5s to 1010s; hardware differs, so this is not a normalized CPU-work comparison.

Browser test-step durations (seconds, groups 1/2/3/4; separate PNG step for Ubuntu) were 154/83/125/140 + 15, 156/143/177/134 + 15, 172/195/275/235, and 200/180/169/157 respectively. Median slowest functional test work was about 165s on Ubuntu versus 238s on macOS. The speed improvement appears in test execution as well as complete workflow feedback.

All four successful samples passed quality and both cold performance probes. Every functional identity appeared exactly once, with zero skips, unexpected results or flaky outcomes. Canonical PNG files, pixel tolerances, all viewport assertions, 20,000-trial parity and the 50ms responsiveness limit remained unchanged. No application or lockfile changes are part of this trial.

### Runtime and reliability limits

Every comparison used Node 24.15.0, the same locked Playwright and Chrome 155.0.8059 stable release family. Actual runtime metadata records Linux x64 Chrome **155.0.8059.84** and macOS arm64 Chrome **155.0.8059.85** after refresh. The packages and hardware are not byte-identical: this establishes the practical runner strategy's observed improvement, not a causal pure-OS benchmark. Two successful samples per strategy are a limited reliability sample, not a long-term guarantee.

[Control 38999728242](https://github.com/ryantrappy/Fantasy-football-rankings-studio/actions/runs/38999728242) completed in 5m38s with a failed Chrome download (`curl` HTTP/2 INTERNAL_ERROR) in the unchanged shared Ubuntu performance setup. Its 164 functional browser cases passed without retries, but performance never started and the aggregate correctly failed. It is retained as an infrastructure failure and excluded from successful-run medians. The replacement controls passed. A preliminary repeat, 38999590370, was deliberately cancelled when the image-version mismatch was discovered; it is excluded from timing and reliability samples.

PR #34 was merged at 2026-10-17 04:03:18 UTC after the repeated comparison established the GO result. The final report/backlog record is a documentation-only follow-up on main; the measured application and runner code are unchanged. If future runtime or platform regressions appear, return functional groups to the complete macOS control as described above; keep strict assertions and canonical PNG baselines intact.
