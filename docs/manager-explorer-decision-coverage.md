# Decision support redesign coverage

TASK-146 extends the Manager Explorer surfaces, compact context, selected states and nearby evidence. No feature reductions are approved. Production hooks, provider reads, caches, scoring and scenario calculations remain the source of all displayed values.

## Checklist and validation plan

- [x] TASK-90: all managed leagues together; per-league matchup, standings, freshness, partial failure, setup and destination links. Validate overview component and desktop/phone browser checks.
- [x] TASK-91: full legal lineup, submitted/proposed totals, named swaps, locks, exclusions and alternative scenarios. Validate advisor component and lineup calculation tests.
- [x] TASK-92: position/candidate/drop choices, ownership freshness/coverage and real lineup impact with unsupported restrictions visible. Validate waiver component and calculation tests.
- [x] TASK-93: both teams' before/after expectations, position coverage, status flags, profile links and capacity assumptions. Validate trade component/calculation tests and browser interaction.
- [x] TASK-94: searchable profiles, consistent week ranges, per-player observed totals/averages/coverage/weekly evidence, identity and timestamps. Validate profile component/calculation and browser tests.
- [x] TASK-95: team-specific risks, uncertainty, freshness, dismiss/restore and account scope. Validate alert component/calculation tests.
- [x] TASK-99: retained combined/native projection sources, disagreement and scoring/identity limitations. Validate source evidence in profiles and existing projection tests.
- [x] TASK-102: searchable distinct trade teams, clear/reset exchange, open-slot confirmation only for uneven exchanges, no drop controls. Validate trade component and browser workflows.
- [x] TASK-103: clear player selections, filters and unowned-pool controls with retained individual evidence. Validate player component and browser workflows.
- [x] TASK-110: mutual trade rationale, coverage, sources, editable prefilled scenario and scope clearing. Validate suggestion component and browser workflows.
- [x] TASK-112, TASK-115, TASK-117, TASK-118: missing projections remain unavailable, explicit refresh/cache invalidation, selected-league roster reads and historical identity evidence. Validate existing player/live tests.
- [x] TASK-3, TASK-27, TASK-53, TASK-104, TASK-105, TASK-119, TASK-120, TASK-143, TASK-145: responsive accessible controls, retained failure/freshness/loading semantics, unchanged session/provider caching and calculations. Verify focused suites and typecheck.
- [x] TASK-106 and Live protected behavior: up to four simultaneous cross-league games; both full starter and bench rosters, player links, actual/projected/status values, freshness and uncalibrated estimates. Verify 1440×900, 2048×942, 1280×720 and phone; desktop independent scrolling and mobile full page flow.

## Design conventions

Native system sans; workspace #f3f5fb, white work areas, ink #17223b, muted #526078, indigo #3949ab, selected tint #eef1ff and divider #dce2ee. Names align left and numeric values right. Focused controls retain their state; data and caveats remain beside the decision. Explanatory definitions use accessible tooltips while source evidence and actionable controls remain visible or in named disclosures. All local styling uses the decision-explorer prefix.

## Evidence

Validated October 14, 2026:

- 128 focused component, calculation and provider tests across 19 files pass. This includes player refresh and scope isolation, lineup locks/eligibility/missing projections, waiver ownership, alerts, capacity assumptions, mutual suggestions and editable prefill. Added assertions cover full lineup evidence, both trade assignments, and state retention when switching focused trade views.
- 16 focused Chrome browser checks cover weekly overview, Players, Trade analyzer and Live; desktop/phone workflows, source disclosures, legal lineup exclusions, verified waiver scenarios, editable prefill, accessibility, context links, no page-wide overflow and all managed leagues together.
- Live checks include 1440×900, 2048×942 and 1280×720, eight complete rosters in four simultaneous games, league filters retaining selections, refresh retaining manual selection, independently scrolling long rosters, 18-player fixture rows fitting at 1440×900, and phone rosters in full page flow.
- Scoped lint, formatting and application typecheck pass. Browser screenshots are in `test-results-decision/`; mockup screenshots remain design references, not production data evidence.

## Retained boundaries

No provider/calculation/cache/authentication behavior was replaced. These screens remain read-only toward provider rosters. Current-week trade and waiver comparisons do not claim future-week, fair-value or transaction-eligibility certainty. Missing projections, locks, injury/bye information and ownership coverage remain explicit. Live displays provided NFL remaining-time fractions, not a fabricated NFL clock. Power rank is unavailable in the existing weekly overview payload, so no sample rank is added. Player identities remain provider/season scoped, with historical-only coverage and missing usage metrics disclosed. No new removal or reduction approval is used.
