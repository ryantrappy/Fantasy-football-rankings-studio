# TASK-146 usability iteration coverage

Started October 14, 2026 before edits to the user's `gemini_app_redesign` working tree. Source of design: `trapp-ui-usability-implementation-spec.pdf` and `mockups/usability-improvements/`. The pre-existing working-tree patch is preserved at `/tmp/fantasy-usability-user-baseline.patch` for comparison. Earlier Manager Explorer reports describe the earlier iteration, not verification of this one.

No feature reduction is authorized. TASK-147 and original/compact ranking export appearance remain excluded. Existing production components, calculations, provider integrations and mutation flows are the baseline.

The user's direct screenshot-comparison follow-up is recorded in [the style comparison report](usability-style-comparison.md), including all 12 design/current views, density corrections, final independent approval, regression results and unchanged export pixels.

## Ownership and acceptance checklist

- [x] Lead — PDF 2.1–2.2: compact sticky navy topbar, seven destinations, accessible profile menu including Live, real inline command bars, contextual tool switcher; ranking toolbar/progress/take previews/sticky selected-team editing/steppers and isolated Original/Compact previews. TASK-3, 13–13.3, 15–17, 19, 23, 24, 27, 30, 33, 39, 63, 83, 86, 88, 104, 105, 114, 120, 146. Retain all draft, conflict, recovery, publication, consent and account-isolation behavior.
- [x] Lead — account and shared dependency safeguards: TASK-1, 1.1, 1.2, 6–8, 20–22, 25–26, 31, 44–45, 54, 59–61, 70, 71, 72 caveat, 84–85, 87, 89, 97–98, 101. Identity, verification, recovery, keys/cookies, Codex readiness, managed teams, onboarding, archive/delete, sharing/revocation and immutable snapshots remain reachable.
- [x] Analytics — PDF 2.5–2.6: persistent team inspector across seven views, semantic four-tier ranks/points and meaningful stacked-chart axis; table/histogram forecast modes and persistent team path; every Advanced diagnostic and download retained. TASK-4, 5, 28–29, 40, 50–52, 108–109, 111, 113; 34, 36–37, 41–42, 49, 55–57, 69, 73–81, 116. Preserve exact weekly tables, CSV, legal lineups, round odds, coverage and cancellation.
- [x] Decision support — PDF 2.3–2.4, 2.7: all-league overview, real uncalibrated estimate bars and advisor impact previews; dense four-game Live board with managed markers/full statuses; comparison matrix and mutual trade exchange banner. TASK-90–95, 99, 102–103, 106, 110, 112, 115, 117–118. Preserve lineup locks/exclusions/alternatives, waiver freshness/ownership/drop impact, player provenance/ranges, trade capacity/prefill and full rosters.
- [x] History — PDF 2.8: useful default real evidence per focused view, high-contrast personal/league Wrapped story grid, complete category/archive/evidence/recap/sharing workflows and stable manager/season identity. TASK-122–142, 144–145 and sharing dependencies.
- [x] Independent reviewer — inspect completed contributions and user-baseline changes, issue specific actionable findings; owners repair, reviewer rechecks until no unresolved findings.

## Integration gates

- [x] Review all contributions and changed interactions; maintain meaningful tests.
- [x] Keyboard/focus/tooltips, loading/empty/error/partial states and context retention.
- [x] Real CSV/JSON/downloads, sharing/revocation, cancellation, draft safety and account/provider boundaries.
- [x] Screenshots and geometry at 1440×900, 2048×942, 1280×720, 390×844 and 320×568; local table scrolling is allowed, page-wide overflow is not. Full player information remains available.
- [x] Original 1304px and compact 720px downloaded PNG parity: zero changed pixels against the pre-iteration code in the same environment; existing saved-baseline checks pass with their unchanged rasterization tolerance. See exact boundary below.
- [x] Full component/calculation suite, Chrome browser suite, typecheck, lint, format and production build.
- [x] Signed-in localhost usability inspection where available; document limits without claiming live mutations were exercised.

## Design conventions

Use the specified #F3F5FB workspace, #FFFFFF surfaces, #17223B ink/topbar, #526078 muted text, #3949AB accent and #EEF1FF selection. Body 14px, secondary 12px; use the existing system sans. Compact left-aligned title/context/actions in a single command bar; focused work with an adjacent sticky evidence inspector on desktop and full page flow on phones. Preserve actionable notices and full values; tooltips are for definitions. Never style export descendants or invent provider evidence to reproduce mock values.

## Validation and remaining work

All production implementation and integration work for this pass is complete. The current working tree and the user’s partial implementation were retained; no reset, deployment, merge or commit was performed. Three implementation agents and the independent review agent ran as GPT-6.1 Sol with high reasoning. The lead reviewed every contribution and representative desktop/phone production-component screenshots. The independent reviewer approved both the complete diff and the final decision/histogram delta with no unresolved findings; its fresh narrow check passed 43 tests.

- Full component/server/provider/calculation suite: **786 passed, 1 existing opt-in live-provider check skipped**, across 151 passing files plus one skipped file. Command: `npm test -- --maxWorkers=4`. Log: `/tmp/fantasy-usability-components-verified.log`.
- Full Chrome browser suite: **117 passed**. Command: `npx playwright test --workers=2 --output=test-results-usability-verified`. Log: `/tmp/fantasy-usability-browser-final.log`. Covers all five specified viewports, keyboard/focus, tooltips, loading/empty/error/partial states, exact CSV/JSON content, both ranking exports, draft/order safety, sharing/revocation/snapshots, cancellation and bounded forecast responsiveness. Existing meaningful assertions and image baselines were retained. Tests were updated for the unified heading, repeated source/inspector text, actual readiness completion and finalized singular labels; Trade’s loading shift was repaired in production CSS.
- Final type checking, lint, formatting, production build and `git diff --check` pass. Build log: `/tmp/fantasy-usability-build-verified.log`. Existing dependency module-directive bundler warnings remain; there are no build/type errors.
- Area evidence: [Analytics](usability-analytics-coverage.md), [Decision support](usability-decision-coverage.md), [History](usability-history-coverage.md). Original data/calculation/mutation flows remain the baseline. The only forecast calculation addition counts outcomes already generated by the same trials; exact seeded result parity is tested.
- Signed-in localhost inspection used the existing real ESPN/Sleeper account and real league data. Reviewed rankings, all-league overview, dense Live and season strength/context/sharing controls at the browser’s normal 1633×828 CSS viewport. This found and drove the compact risk/action ordering and selector sizing fixes. Explicit geometry at 1440×900, 2048×942, 1280×720, 390×844 and 320×568 was verified in the production-component Chrome suite. Screenshot examples: `/tmp/fantasy-usability-live/live-desktop.jpg` and `/tmp/fantasy-usability-live/season-desktop.jpg`.
- A signed-in production Position group rankings CSV downloaded successfully and its 15 CSV rows, context headers and data were verified locally. CSV/JSON/replay bytes, original/compact PNGs, revocation and mutation paths were additionally verified in isolated deterministic production-component/server tests. No live account credential, public-sharing, publication, roster transaction or draft mutation was needed for usability inspection.

## Exact export parity boundary

`src/export.css`, `RankingPreview` and checked-in PNG baselines are unchanged. Original downloads remain 1304×651 and the long-commentary compact case remains 720×1063. Downloading Original after choosing Compact preview also matches.

An isolated temporary checkout reproduced the user’s exact starting working tree from the captured patch. Both Original downloads (1440px and 390px) and Compact have **zero changed RGBA pixels between that pre-iteration code and this implementation in the same Chrome environment**. The temporary checkout was removed after comparison; primary work was never reset.

Raw comparison to the older checked-in PNGs finds 1,860 Original and 2,608 Compact antialiased pixels differing by at most one channel level. The identical variation exists before this iteration. Existing snapshot assertions pass with their unchanged documented tolerance; no baseline was updated or assertion relaxed. Exact counts and dimensions are in `/tmp/fantasy-usability-export-parity.json`. This records the environment-dependent saved-baseline limit rather than claiming raw equality to older browser rasterization.

## User scope decision and genuine limitations

On October 14, 2026 the user clarified: “Use real statuses but create a task to eventually add start times not part of this first pass.” Live retains actual bye/injury/remaining-time/unknown statuses. Scheduled NFL start times are tracked separately in **TASK-148 — Show scheduled NFL start times in Live matchups**, To Do; no future provider work was implemented here. This is a scope clarification for a new enhancement, not removal of existing functionality, so the feature-reduction approval log remains unchanged.

Current-provider missing projections, ownership/roster freshness, incomplete historical coverage, unsupported bracket cases and uncalibrated estimates remain explicit. Older saved forecasts without frequency counters show distributions as unavailable. Auth0 tenant email delivery/operator CLI quota and optional disposable Mongo/live-provider harnesses were not exercised; deterministic identity/credential/server/provider checks passed. TASK-147 remains separate and unchanged.
