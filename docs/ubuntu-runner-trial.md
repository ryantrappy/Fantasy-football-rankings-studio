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

Recommend adopting Ubuntu only if the median complete workflow is at least 10% faster than the macOS control, all candidate runs pass with no new retry pattern, coverage matches exactly, and browser/runtime versions are comparable. The 10% margin avoids calling small hosted timing fluctuations an improvement. Failed, slower or inconclusive results are **no-go for merging**. No automatic merge is configured; the trial PR stays unmerged until its evidence supports a decision.

If platform-specific geometry, fonts or accessibility assertions fail, inspect their diagnostics. Keep affected cases on a validated runner or reject the migration; do not loosen assertions. Returning functional jobs to `macos-latest` with the full suite and removing the extra PNG job restores the current strategy. The trial is isolated on its branch, so an unmerged no-go does not change main.

## Validation and results

Local discovery verified that candidate groups contain 40/31/55/35 cases and the macOS PNG selection contains three. Their union equals all 164 original functional identities exactly once; the full macOS control inventory is identical and both cold probes remain selected. Hosted results and the go/no-go recommendation will be recorded after the comparison completes.

Preliminary candidate run 38999284481 passed in 3m27s with 164 expected cases and zero skips/failures/retries. It used Linux Chrome 155.0.8059.84 and macOS Chrome 155.0.8059.40. This is preliminary strategy evidence, not a matched-version timing pair; further runs align the macOS browser before deciding.
