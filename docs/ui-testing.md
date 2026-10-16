# UI regression testing

The maintained tests in `tests/ui/` render production components with deterministic, test-only league/provider fixtures. They remain useful after a redesign: keep workflow, accessibility, responsive, calculation and export assertions when changing presentation. These fixtures are not replacement production analytics.

## Run the checks

Run from the application directory with dependencies installed and Google Chrome available:

```sh
npm test
npm run test:ui
npm run typecheck
npm run lint
npm run format:check
npm run build
```

CI runs the same required suites without production credentials. The optional live ESPN contract test is separate; a skipped live-provider check does not imply a successful live integration. See the [quality workflow](../.github/workflows/verify-proposed-change.yml) and [operations contracts](features/operations.md).

## Preserve useful coverage

| Area                           | Regression evidence to retain                                                                                                                                                                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rankings                       | Editing, save/recovery/conflicts, reorder/undo, publication, writing readiness/consent/model/evidence/cancellation, and persisted writing instructions.                                                                                                     |
| Original and Compact downloads | Canonical PNGs in `tests/ui/baselines/`; exact geometry, colors, typography and complete long commentary. Workspace restyling must not restyle exports.                                                                                                     |
| Navigation and accounts        | Context and explicit empty selections, keyboard/focus/menu access including Live, unsaved profile fields, provider credentials and league workflows.                                                                                                        |
| Season insights                | Exact weekly evidence, partial/unavailable values, adaptive positive/negative stacked axes, both scoring modes, schedules, manager reports and contextual CSV.                                                                                              |
| Playoffs                       | Seeded forecast parity, bounded/cancellable work, all configured rounds/bye/title odds, weekly exact values, Advanced diagnostics and CSV/replay JSON.                                                                                                      |
| Decision support               | All managed leagues, complete lineup/waiver scenarios, source freshness and provenance, two-sided trades/capacity and the complete four-game Live board with timezone-correct kickoff dates, source/freshness, rescheduling and explicit unavailable times. |
| History                        | Every focused category/archive workflow, stable manager/year identity, all-season defaults and explicit subsets/empty selections, bounded progress, heatmap W-L-T/sample/evidence, CSV and immutable sharing/snapshots.                                     |
| Accessibility and layout       | Visible focus, labels, tooltips, contrast, keyboard interaction and local scrolling without clipping data or page-wide overflow.                                                                                                                            |

The [feature index](feature-preservation.md) links the durable area contracts and stable task IDs. Responsive coverage includes 1440×900, 2048×942, 1280×720 and 390/320px phone layouts where relevant. Component/router/server tests complement browser coverage for account isolation, privacy, caching, stale/error states, cancellation and draft safety. Browser fixture sharing/revocation does not claim a live public mutation.

For asynchronous component tests, wait for actionable readiness before invoking an exposed controller. A mock having been called, or a disclosure disappearing, does not establish that consent has persisted and generation can start. Cancellation checks should assert the request signal aborts, no result is applied, and the generation slot becomes available again.

Ranking PNGs can vary slightly across browser/platform rasterizers. Earlier validation observed a maximum one-channel antialias difference against older saved baselines, while same-environment before/after exports were identical. Keep the existing snapshot tolerance and canonical baselines unchanged; use raw RGBA comparisons from the same environment to verify exact style parity. Do not update a baseline or loosen a threshold to hide a design regression.

Cold forecast timing checks run first in the single-worker `forecast-performance` project, before the dependent functional `ui` project. In Actions they run in a separate Ubuntu job alongside four independent macOS shards, each running functional/visual checks with one worker and `--no-deps`. Each shard has its own Vite server; no timing project is repeated. This retains macOS PNG rasterization baselines while isolating performance from the hosted macOS timer stalls observed with no main-thread long tasks. Local `npm run test:ui` still runs both projects in dependency order. Local functional checks retain normal parallelism; CI retains one worker per runner. Timing probes keep the 50 ms limit, long-task checks, 20,000-trial count and exact synchronous/asynchronous seeded parity. Isolating their wall-clock measurements avoids competition from this suite's PNG exports and calibration, though unrelated machine load can still affect them. Observer records and the final task gap are included so a blocking completion tail cannot escape detection. TASK-155 shares a cooperative executor between the dedicated worker and main-thread fallback: each slice targets 4 ms with a clock check every ten trials. Worker execution yields too, limiting uninterrupted CPU pressure on constrained hosts. Native worker-handler tests verify a response is not posted after the first slice, exact seeded results survive subsequent slices, and cancellation clears a pending wakeup.

The workflow uses four duration-balanced whole-file groups selected by `BROWSER_SHARD=1` through `4`, with `fail-fast: false`; quality, performance and browser jobs start independently. The first three groups explicitly match specs in `playwright.config.ts`; group four runs every remaining spec, including new or renamed files. Invalid group values fail configuration loading. Without this variable, local `npm run test:ui` still selects the complete suite. Do not combine this selection with Playwright's numeric `--shard` option, which would shard an already filtered subset. Rebalance using retained per-spec JSON durations when the slowest group grows; verify that the union of all four test inventories equals the unfiltered inventory with no overlap. `All required checks` succeeds only if quality, performance and the complete browser matrix succeed. Branch settings must explicitly require this context if merge enforcement is desired. Browser shards retain JSON timings/outcomes for 14 days on successful and failed runs, with shard/run/attempt-specific artifact names. The initial hosted split passed all 164 functional cases and both performance cases without browser retries in 7m21s, compared with 18m52s before the split. TASK-159 subsequently balanced the groups by duration: run 38853261038 passed in 5m03s without browser retries, compared with the preceding automatic run at 8m02s. See the [speed plan](pr-testing-speed-plan.md) for run links, measurements and limits of this single-run comparison.

## Results and artifact lifecycle

`test-results/` and `playwright-report/` are ignored, generated diagnostics. Playwright refreshes its output directory on the next run. Keep useful current failures until diagnosed; CI retains failure artifacts for 14 days. For an isolated investigation, put `--output` under `/tmp/` rather than creating another repository-level result folder. Screenshots written explicitly by a test may still use the standard `test-results/` directory.

Completed design prototypes, the design PDF, one-off review/checklist reports and old `test-results-*` directories were retired under TASK-151. Their committed versions remain in Git history; historical task notes retain their original paths and results. Production requirements, reusable regression tests/fixtures, export baselines and domain documentation remain in the repository.

Workspace design checks (TASK-157) use an independent test for each of nine views at desktop and phone widths. Each retains the existing 30-second timeout, hierarchy/navigation/workflow/overflow/accessibility/page-error assertions and full-page screenshot. This avoids putting eighteen navigation and audit sequences into two shared timing budgets; no assertion, screen or viewport was removed.
