# Plan to shorten PR verification

## Recommendation

Start with four independent macOS browser shards, each with one Playwright worker, running alongside quality and forecast performance. Keep the existing Chrome browser, viewport coverage, assertions and PNG baselines. Target **5–7 minutes** for complete PR verification, compared with roughly **18–19 minutes** on PR #33. This is a planning estimate, not a measured result; runner queues, shard imbalance and retries can increase it.

Use jobs within the existing workflow first. Separate workflow runs do not inherently make tests faster, and introduce more check/dependency management. Separate runners supply the useful parallelism. After measuring this first change, consider moving functional tests to Ubuntu while retaining a small macOS PNG job.

Phase 1 is implemented on PR #33: four macOS shards, independent job starts, per-shard JSON results and an aggregate status check. No test coverage or product behavior changed. Hosted timing verification is pending; subsequent phases remain proposals.

## Baseline: latest PR #33

[PR #33 — more_enhancements](https://github.com/ryantrappy/Fantasy-football-rankings-studio/pull/33) is the latest PR by creation time. Inspected head: `798dd53246c02f3582c2c8bf4562091331cb58af`. GitHub redirects the local repository's older remote name to `Fantasy-football-rankings-studio`.

The newest [head run, 38849159710](https://github.com/ryantrappy/Fantasy-football-rankings-studio/actions/runs/38849159710), was still running when inspected: quality passed in 1m35s, forecast performance passed in 1m10s, and browser checks were active. Do not treat that run as a completed pass or use its elapsed time as its final duration.

Use these completed runs from the same PR for timing evidence:

| Measurement                              | [Green run 38843865618](https://github.com/ryantrappy/Fantasy-football-rankings-studio/actions/runs/38843865618) | [Failed run 38845526574](https://github.com/ryantrappy/Fantasy-football-rankings-studio/actions/runs/38845526574) |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Commit                                   | `2c64a05`                                                                                                        | `73239f5`                                                                                                         |
| Workflow elapsed, creation to completion | 17m54s                                                                                                           | 19m02s                                                                                                            |
| Quality job                              | 2m38s                                                                                                            | 2m41s                                                                                                             |
| Unit test step                           | 1m59s                                                                                                            | 2m00s                                                                                                             |
| Forecast performance job                 | 1m04s                                                                                                            | 47s                                                                                                               |
| Forecast tests                           | 8s                                                                                                               | 8s                                                                                                                |
| Functional browser job                   | 16m36s                                                                                                           | 18m05s                                                                                                            |
| Functional browser test step             | 15m56s                                                                                                           | 17m22s                                                                                                            |
| Browser outcome                          | 161 passed, 1 flaky                                                                                              | 160 passed, 2 failed                                                                                              |

The green run's retry was the 390px functional forecast case, failing a count assertion on its first attempt. The failed run timed out waiting for `Backtest complete.` at both 1280px and 390px, including retries. These are observed failures, not established root causes. Increasing timeouts or retries would conceal neither the underlying issue nor its cost.

The completed runs listed 162 functional cases plus two isolated cold forecast cases. At the inspected head, local Playwright discovery lists **164 functional cases**, plus the two performance cases. Compare coverage against the head's inventory, rather than forcing the older count.

GitHub's classic branch-protection endpoint reports no protection. The active `protect main` ruleset contains deletion and non-fast-forward restrictions, with **no required status checks**. Existing CI jobs run on PRs but are not currently enforced as merge requirements by those inspected rules. A stable aggregate check can be added without assuming an existing merge gate; enabling it as required is a separate repository-setting decision.

### What consumes time

- `.github/workflows/verify-proposed-change.yml` runs quality and performance concurrently, but the macOS browser job has `needs: forecast-performance`. It waits about a minute before provisioning.
- `playwright.config.ts` runs functional browser checks with one CI worker against one Vite fixture server. TASK-64 records that four workers previously competed with PNG rendering and caused startup timeouts. Keep bounded per-runner concurrency.
- Approximate green-run file costs, from consecutive test-start timestamps: analytics explorer 149s, functional forecast 126s, calibration 124s, history analytics 81s, workspace design 66s. These include inter-test overhead and retries; they are prioritization clues, not precise test durations.
- Installation is already inexpensive with npm caching: 5–14s on the green run. Typecheck was 5s, lint 1s, production build 9s. Splitting those into several installing jobs would have little impact on the browser critical path.
- Ubuntu Chrome/dependency installation took 40s for just 8s of performance checks. It is worth reviewing later, but the much longer browser suite takes priority.
- `npm run build` includes `tsc --noEmit`, so quality repeats the standalone typecheck. Avoiding that duplication saves only a few seconds.

## Screen-size policy for this personal project

There is **no current iPhone/Android/tablet/browser matrix** to eliminate. The config uses Chromium with the Chrome channel; tests explicitly set viewport dimensions. Keep that approach: one rendering engine for required layout checks, with no repeats merely because another device has the same viewport.

| Scope                                                                   | Proposed coverage                                                                                          |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Main workspace layouts and navigation                                   | 1280×900 and 390×900, retaining all nine existing workspace view cases                                     |
| Narrow layout stress                                                    | 320px width for affected dense screens, long names and overflow                                            |
| Dense Live board / limited vertical room                                | Retain existing 1280×720, 1440×900 and 2048×942 checks where their assertions differ                       |
| Intermediate widths                                                     | Lightweight checks around the affected CSS breakpoint, rather than complete workflow reruns at every width |
| Core behavior, calculations, account isolation, persistence and exports | Run meaningful assertions in their current suites; a layout check does not replace them                    |
| Other browsers / real devices                                           | Optional manual or explicitly requested compatibility investigation; no proposed required device matrix    |

Width and height both matter. Two tests at 390px can cover different content, interaction, timezone, reduced-motion or accessibility behavior; they are not automatically duplicates. Device scale factor, touch and browser engine also change behavior, so a viewport check must not claim universal device compatibility.

The styles use several real thresholds: 479, 600, 680, 720/721, 760, 767/768, 900, 960, 991, 1000, 1099 and 1800px. For a changed layout, check just below and above its relevant threshold. Do not multiply the full suite by every threshold. The existing targeted wider and shorter screen tests should remain unless an assertion inventory proves equivalence and any required scoped approval is recorded.

## Phase 1: parallel runners without reducing coverage

1. **Remove the workflow-level browser dependency on performance.** Both jobs already have separate hosted runners and fixture servers. Keep the local Playwright project dependency so cold timing probes still run before functional work on a shared local machine. In Actions continue using `--project=ui --no-deps`; the separate forecast job remains required.
2. **Turn the macOS browser job into a four-shard matrix.** Use shard indexes `[1, 2, 3, 4]`, `max-parallel: 4`, `fail-fast: false`, and one worker per job. Each runner installs from the lockfile and starts its own Vite server. Example test command:

   ```sh
   npm run test:ui -- --project=ui --no-deps --workers=1 --shard=1/4
   ```

   Replace `1` with the matrix index. Retain Node from `.nvmrc`, existing CI timeout limits initially, one retry and all current tests. Keep workflow cancellation of obsolete commits.

3. **Start with file-level sharding.** Playwright defaults to splitting files when `fullyParallel` is absent. Measure the longest shard, then rebalance or split a large spec into independent files if needed. Enable test-level sharding only after auditing shared state, hooks and output paths. Some tests explicitly write screenshots to `test-results/`; separate runners avoid cross-shard collisions, while same-runner parallel tests need a stricter audit.
4. **Retain per-shard diagnostics.** Use artifact names containing shard index, run ID and run attempt. Preserve failure traces/screenshots/video and 14-day failure retention. Add lightweight machine-readable timing/results on successful runs so future balancing uses durations. If using blob reports, merge them in a separate reporting job; report-generation failure must not turn failed tests green.
5. **Preserve required checks.** Inventory branch rulesets before editing. Add a stable aggregate verification check that runs after quality, performance and every browser shard, with `if: always()`, and fails unless every required predecessor succeeded. Update required-check contexts together with the workflow migration. Cancellation, failure or unexpected skips must not yield a green aggregate.

Expected elapsed time is approximately the maximum of quality, performance and the slowest browser shard, plus setup/queue/aggregation overhead. A balanced quarter of the observed 956s browser step is about 239s; adding roughly 40s setup gives an optimistic 4m40s. Budgeting **5–7 minutes** allows imbalance and reporting overhead. Two shards would be roughly **9–11 minutes** and are a reasonable fallback if hosted concurrency or cost makes four unattractive.

Four shards use more simultaneous runners and repeat setup; they do not make total compute four times cheaper. Check account concurrency and private-repository usage before tuning upward. Six concurrent test jobs are proposed: four browser shards, one quality job and one performance job, followed by aggregation/reporting.

## Phase 2: improve reliability and runner allocation

After Phase 1 has measured results:

- Investigate functional forecast retries and calibration completion waits using existing traces, worker events and progress. Preserve exact seeded parity, 20,000 trials, the 50ms input-gap limit, long-task assertions and cancellation coverage. Re-run calibration at both current sizes on isolated runners. A long test is not proof that its assertion is unnecessary.
- Pilot Ubuntu for functional browser checks while keeping canonical PNG comparisons on macOS. `chakra.spec.ts` currently mixes three PNG snapshot cases with other interactions; separate by explicit project/tag selection or split the file, ensuring each existing case runs exactly once. Keep export-theme/content/download checks with the appropriate export group. Do not regenerate baselines or loosen pixel tolerances to force an OS migration.
- Retain macOS for any additional font/geometry-sensitive cases that fail for a real platform difference. Compare the old and proposed inventories and results before switching required jobs.
- Consider tracing only on first retry and making video opt-in if measured recording overhead is significant. Current retained-on-failure settings still record successful attempts before discarding them. This trades away first-attempt evidence, so do it only after diagnosing existing flakes and documenting the diagnostic change. Screenshots and useful failure artifacts remain.
- Leave the quality job intact initially. If faster static failure feedback is useful, split only unit tests from static/build checks; do not expect this to improve the overall browser-dominated completion time. Preserve standalone local typecheck/build commands even if CI eventually avoids running TypeScript twice.
- Review performance browser installation only if it becomes a bottleneck. Preserve the same Chrome runtime and cold isolated conditions; do not assume replacing it with an arbitrary system browser or a warm shared server is equivalent.

## Optional later changes

Do not make the core suite nightly-only as the first optimization. Sharding can shorten PR feedback while keeping existing checks on every change. Separate scheduled/manual workflows are useful for genuinely additional broad compatibility checks or expensive exploratory runs, rather than moving existing protections out of PRs by default.

A later documentation-only bypass can save a full run, but requires an explicit safe path allowlist and an always-reporting gate. Changes to workflow/configuration, dependencies, fixtures, source or tests must take the full route. Unknown paths should also run everything. Avoid workflow-level path filtering that leaves a required status pending. Likewise, a focused changed-file run can provide early feedback, but should not substitute for the full suite without a reliable dependency map and an explicitly approved coverage change.

Using `trappserv.er` as a self-hosted runner is possible as a later investigation. It adds runner maintenance and isolation work and may expose the homelab to PR code. Hosted shards are the simpler initial choice; no homelab changes are proposed.

## Verification and rollout criteria

Implementation touches the quality workflow, Playwright selection/reporting configuration and affected tests only if splitting is necessary, plus UI testing documentation and operations contracts. Relevant preserved contracts include TASK-32, TASK-47, TASK-48, TASK-64, TASK-154 and TASK-157. This plan does not authorize removing an assertion, shrinking a protected viewport set or weakening a threshold.

Before switching required checks:

1. Refresh the newest completed PR #33 run and save its exact commit, attempt, job/test durations, retry counts and queue delays. Use a fixed commit when comparing implementations.
2. Discover tests with `--list --reporter=json` for the old suite and every new selection/shard. Compare normalized file/title identities: union equals the original inventory; intersections are empty except explicitly intended dependencies. At inspected head that means 164 functional and two performance cases. Verify no snapshot case silently migrates OS or disappears.
3. Execute all proposed jobs on the same fixed commit. Retain exact assertions, canonical PNGs, cold timing requirements and meaningful accessibility/layout checks. Local discovery alone proves selection, not runtime stability.
4. Collect at least five complete hosted runs. Compare median and slowest total elapsed time, longest-shard duration, queues, retries and aggregate runner usage against baseline. Accept a 5–7 minute target only after measurement, with no new failures or increased retry rate; treat existing flakes as unresolved rather than successful first attempts.
5. Exercise aggregate-check failure behavior for a failed shard and skipped/cancelled required job. Confirm branch rules refer to a stable required context and stale runs cancel normally.
6. Roll back to the original single-worker job if the split introduces failures. Keep one worker per runner; rebalance shards before increasing worker count. Update maintained docs/contracts to describe measured behavior after implementation.

## Supporting documentation

- [Playwright sharding](https://playwright.dev/docs/test-sharding): file/test distribution, matrix examples and report merging.
- [GitHub matrix jobs](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations): independent job variations, concurrency controls and failure policy.
- [Playwright project dependencies](https://playwright.dev/docs/test-projects#dependencies): dependencies run before selected tests; `--no-deps` bypasses them.
- [Playwright CI guidance](https://playwright.dev/docs/ci): conservative worker counts and distributing tests across machines.
- [GitHub Actions limits](https://docs.github.com/en/actions/reference/limits): account-dependent runner concurrency; actual account availability has not been verified.
- Local evidence: [workflow](../.github/workflows/verify-proposed-change.yml), [Playwright configuration](../playwright.config.ts), [UI testing guidance](ui-testing.md), and [operations contracts](features/operations.md).

## Implementation checks

Local validation confirmed all 164 functional test identities appear exactly once across shards (49, 33, 42 and 40 cases), plus both isolated forecast cases. The aggregate script was checked against all 64 combinations of success/failure/cancellation/skipping. Formatting, TypeScript and lint passed. Hosted results will establish runtime success and speed; test discovery alone does not.
