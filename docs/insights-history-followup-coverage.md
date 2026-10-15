# Insights and History follow-up coverage

October 15, 2026. User feedback and the attached History header screenshot are the requirements for this follow-up. Preserve all existing working-tree changes and production calculations, identities, sources, state and mutation workflows.

## Ownership and acceptance checklist

- [x] Analytics owner: adaptive actual/projected stacked chart extents and useful ticks; zero, negative, tiny, large and unavailable data remain honest. TASK-108, 111, 113; chart values, coverage, sorting and CSV remain intact.
- [x] History defaults owner: all available years on fresh History navigation; explicit selections and immutable snapshots retain their scope. TASK-22, 27, 39, 53, 120, 143, 145; bounded loading, cancellation, retained results and partial failures remain.
- [x] History heatmap owner: real league-wide manager head-to-head heatmap with W-L-T, ties, sample sizes, self/no-meeting semantics, keyboard access and pair evidence. TASK-11, 29, 122, 144, 145; existing opponent records, matrix, CSV, former-manager behavior and stable ownership identity remain.
- [x] Lead: fix header action/input alignment and spacing at desktop/phone sizes without changing controls or context. TASK-3, 104, 105, 146.
- [x] Lead: replace the broken external Codex setup link with inspectable local guidance. TASK-13.1, 70, 97; preserve readiness, setup, shared account/quota, personal-key precedence and saved/revocable consent.
- [x] Independent review, focused regressions, responsive screenshots, static/build checks and integration.

No feature removal, deployment, merge or unrelated cleanup is authorized. TASK-147 and future NFL kickoff work in TASK-148 remain separate. Ranking PNG exports remain unchanged.

## Validation and limitations

Three implementation owners worked in non-overlapping files; the lead integrated and inspected every slice. An independent reviewer approved the final delta after finding and rechecking one repaired edge case: automatic first-league resolution now retains explicit year subsets and empty selections. Component and actual router regressions cover that case, background preload progress and the three-read limit. Shared defaults and immutable snapshot inputs retain their previous scope.

Full component/server/calculation suite: 831 passed, one pre-existing opt-in integration test skipped. All 141 distinct browser checks pass across the full run and the final 26-check History/navigation rerun. The first full run passed 140 checks and exposed an incorrect CSV test expectation for comma spacing; the corrected test asserts the existing exact contextual CSV line and passes with all 21 History browser checks. Typecheck, lint, format check, production build and whitespace checks pass. Build retains existing dependency bundler warnings.

Responsive screenshot checks cover 1440×900, 2048×942, 1280×720, 390×844 and 320×568 for the analytics/heatmap views, plus header/Codex guide keyboard and sizing checks at 1440/1280/390/320px. Local horizontal heatmap scrolling, full names, pair keyboard navigation, focus, low samples, neutral self/no-game cells, partial data and exact CSV contents are verified. Screenshots are in `test-results-followup-final/` and `test-results-followup-reviewed/`; live-account captures are in `/tmp/fantasy-insights-history-validation/`.

Live validation confirmed 718.44 actual starter points with ticks 0, 200, 400, 600, 800. History selected all 12 catalogue years; nine loaded, while 2015–2017 remain selected with provider-unavailable notices and excluded denominators. The real nine-manager heatmap CSV downloaded successfully with league, all selected seasons, 9-of-12 coverage and reciprocal 7–12–0 / 12–7–0 records over the same 19 meetings. The browser automation download event did not fire, so the downloaded file was verified directly in Downloads.

Original desktop and phone ranking PNGs (1304×651) and the Compact long-commentary PNG (720×1063) are pixel-identical to the prior border-refinement captures. Export source, preview geometry and saved image baselines are unchanged. No live publication, provider consent, credential changes, generation or draft mutation was performed. Existing sharing/revocation, cancellation and draft safety regressions remain passing.
