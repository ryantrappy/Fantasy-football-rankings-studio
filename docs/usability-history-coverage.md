# History usability iteration coverage

Implemented October 14, 2026 against PDF §2.8 and `mockups/usability-improvements/app.js` History reference. This updates presentation and evidence selection on the existing `gemini_app_redesign` work. No feature reduction, calculation change, API mutation change, deployment or commit is included.

## Delivered behavior

- `HistoryPage` uses the shared `PageHeading` with its real inline League selector, current-season navigation and compact owner sharing disclosure. Season selection, refresh/retry/progress, retained reports, partial-failure notices, public links and ESPN snapshot inputs remain intact.
- Rivalries populate real contributing games immediately. Explicit opponent selection persists within its manager/year scope; changing managers or included years selects the current scope's most-observed rivalry instead of carrying a previous opponent.
- `RecordEvidence` populates the first supported record immediately, provides a keyboard-accessible selector for other records, retains an explicit valid selection, and replaces unavailable or differently scoped evidence. Competition, season history, moments and manager-profile views use their existing computed records and filters. Unsupported views explain the missing evidence rather than inventing a result. Source reports identify season, completed-week cutoff and refresh time.
- Personal and league Wrapped use a navy four-story grid. All additional supported highlights remain visible and the full coverage/method disclosure remains reachable. A neighboring evidence inspector uses the same recap and loaded source. Explicit publication consent, exact preview-only snapshot payload, ten-day expiration notice, saved-link display, owner revocation controls and errors remain available. Refreshed source data clears publication consent and prior links while preserving standalone manager/year selections; late snapshot responses cannot attach to refreshed context.
- History styles are local to `src/components/history/history-explorer.css`; ranking export files and calculations are untouched.

## Preservation map

| Feature IDs                                            | Retained production paths and evidence                                                                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TASK-122                                               | All-time opponent records, minimum samples, labels, full league matrix, points and contributing games; shared/snapshot navigation preserved.                                         |
| TASK-123–124                                           | Full-league inputs for expected wins, completed schedule difficulty/replay and chronological Elo; focused evidence and existing controls retained.                                   |
| TASK-125–127                                           | Hall of Fame/Shame weights and sample coverage, configurable eras/exclusions, regular/playoff/must-win definitions and game evidence.                                                |
| TASK-128–129, 144                                      | Every record-book category including single-week scoring highs versus playoff series totals; search/sort and cohort-aware Pain Index factors/sources.                                |
| TASK-130–131                                           | Pre-Monday threshold, supplied source/timestamps/contributors, replay selector, exact checkpoint table and unavailable state.                                                        |
| TASK-132–134                                           | Draft baseline/format/production coverage and multi-season skill; configurable post-drop windows; actual/optimal legal lineups and result consequences.                              |
| TASK-135–136                                           | Trade partners, transaction links, asset trees, actual starts versus observed roster contribution, playoff coverage and unvalued picks/future value.                                 |
| TASK-137–141                                           | Transaction-type coverage and optional playful labels; verified player impact, ownership/acquisition records, draft overlap/unsupported queues, evidence-based archetypes.           |
| TASK-142                                               | Complete personal/league recap highlights, methods, intentional immutable snapshot publication and revocation.                                                                       |
| TASK-145                                               | Shared manager/year identity; all four focused groups, season results/detailed metrics/achievements, whole-league archive, former managers, keyboard tabs and local table scrolling. |
| Sharing dependencies TASK-1, 1.1, 1.2, 45, 54, 71, 121 | Existing sharing/snapshot services, public access, privacy boundaries and report navigation reused without changes.                                                                  |

Archive import/validation/export and the detailed season CSV remain reachable. Missing managers, missing seasons, provider limitations, byes, incomplete brackets/rosters/transactions and unverified queue/ownership claims keep their existing caveats. The league overview, two-manager comparison and no-manager metrics fallback remain supplied production components in the whole-league archive.

## Fresh validation

- Focused component tests: **58 passed across 18 files** with `npm test -- src/components/HistoryPage.test.tsx src/components/history --maxWorkers=2`.
- Integration follow-up: **11 passed across 3 files** for `src/history/moments/contributions.test.tsx`, `src/history/moments/drops.test.tsx` and `MomentsHistory.test.tsx`. Original coverage/unranked/availability assertions are scoped to their named source tables now that inspectors repeat the same evidence; inspector values and caveats are asserted additionally. No production behavior changed for these repairs.
- Browser tests: **12 passed** in `tests/ui/history-analytics.spec.ts`, including keyboard/focus, retained filters and manager/year, all history/archive categories, exact snapshot consent/scope payloads, revocation UI, downloaded archive JSON and season-metrics CSV contents.
- Evidence and personal/league Wrapped geometry plus screenshots at **1440×900, 2048×942, 1280×720, 390×844 and 320×568**; no page-wide overflow. Axe scans pass for the desktop explorer and all five Wrapped viewport cases. Local tables scroll independently.
- Screenshot artifacts: `/tmp/history-usability-playwright-complete/`. Inspected desktop evidence, desktop Wrapped and narrow-phone Wrapped captures; contrast and source/selection labels are readable.
- Focused lint/format and `git diff --check` pass. The final workspace `tsc --noEmit --pretty false` passes after owner integration.

Browser tests use isolated deterministic source fixtures and production components. Snapshot creation/revocation controls are exercised against isolated fixture storage; this does not claim a live public snapshot or provider/account mutation. Full-suite/build, signed-in localhost inspection, independent review and app-wide completion belong to the lead's integration gates in [the master checklist](usability-implementation-coverage.md).
