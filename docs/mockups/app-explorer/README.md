# App Explorer mockups

Twelve responsive, interactive design views extending the selected Manager Explorer history direction. Open `index.html` directly or serve this directory. Screen URLs use their names as hashes, for example `#Players` and `#Season%20insights`.

These are review artifacts, not a production implementation. All data is illustrative. No account connection, credential storage, AI request, publication, deletion, or report export occurs. Production components and the history work in progress are untouched. TASK-146 remains an implementation task; these mockups do not satisfy its implementation acceptance criteria.

## Design plan

Audience: fantasy league commissioners writing rankings and managers deciding who to start, acquire, trade, or follow. The primary job is to move from a meaningful selection to its evidence without scrolling through every analysis at once.

| Token     | Value     | Role                                  |
| --------- | --------- | ------------------------------------- |
| Workspace | `#F3F5FB` | Quiet page and evidence background    |
| Surface   | `#FFFFFF` | Primary work area                     |
| Navy      | `#17223B` | App header and primary text           |
| Indigo    | `#3949AB` | Selected controls and primary actions |
| Selection | `#EEF1FF` | Persistent selection highlight        |
| Divider   | `#DCE2EE` | Grouping and table structure          |

Result colors are green `#176B50` and red `#9E3D40`; text also describes results. Typography intentionally continues the selected history mockup's native system sans rather than introducing another identity. Headings are 28/20/16px, body 14px, supporting text 12px. Left-align prose and names; right-align numeric columns with tabular numerals.

```
League / season / week context
Selected team or player + compact summary
Focused view tabs
Working area                    | Evidence / editing detail
Related tools in disclosure     | Definitions and coverage
```

At phone widths, evidence follows the working area and selecting a relevant row scrolls to its detail. Wide tables scroll within their own region. Main navigation scrolls horizontally. Settings use form fields; trades use two roster columns which stack on phones; the weekly overview keeps all managed-league matchups visible together, with alerts and advice under each team. Live matchups uses a four-slot 2×2 desktop board; each quarter can scroll independently, and the quarters stack on phones.

## Review against the brief

Retained the approved history palette, surface hierarchy, and type. Rejected a universal dashboard layout: ranking order, two-sided roster exchanges, live games, and account forms need different working structures. The distinctive element is the selected item and adjacent evidence, rather than ornamental hero numbers. Replaced uppercase archive-style labels with sentence case for this extension. Dense calculations, source information, and coverage sit behind named disclosures while primary decisions stay visible.

## Functionality map

| Screen             | Proposed organization                                                     | Existing functions to retain in implementation                                                                                                                                                                                                                                                                                                                                  |
| ------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rankings studio    | Team order with the selected take beside it; separate preview/export view | League/season/scoring-week selection; title and introduction; drag reorder and keyboard alternatives; team commentary; autosave and status; recovery, storage failures and save-conflict resolution; copy edition; review/restore revisions; writing provider selection and context-sharing consent; original/compact PNG; publish/update/unpublish and public links; shortcuts |
| Players            | Search and position filter with profile/compare views                     | Ownership, player identity, availability, bye, projections; verified unowned pool with refresh and provider coverage; add/remove comparison selections; first/last scoring week; observed averages/totals and coverage; exact weekly scores; invalid-range and missing-player states                                                                                            |
| Trade analyzer     | Two team rosters and a shared lineup-impact detail                        | Team choices; owned-player search; send/remove assets; reset; open roster slots; before/after starters; roster eligibility and replacement effects; trade suggestions and editable scenarios; projection-source limitations                                                                                                                                                     |
| Weekly overview    | All managed-league matchups together with per-team advice                 | All connected leagues; persistent managed-team choices; record, power rank, playoff estimates; roster alerts, dismiss/restore; risk freshness and uncertainty; lineup suggestions and locks; waiver coverage and roster fit; context-aware rankings, insights, playoff and live links                                                                                           |
| Live matchups      | Four-quarter board with cross-league matchup selection                    | League selection; refresh and live freshness; highlight/remove up to four games simultaneously; starter scores and projections; NFL status and remaining time; byes; missing data; uncalibrated win estimates and methodology                                                                                                                                                   |
| Season insights    | Team scoring, weekly trends, trades, pickups                              | Sorting; average/best scores, above-median weeks, projection differences and beat counts, best lineup, accuracy; team-filtered chart and exact weekly table; player/package trade evidence over equal windows; pickup baselines and retained starts; no-call decisions and coverage; refresh; report image; live link and frozen snapshots                                      |
| Playoff simulation | Forecast table, week-by-week chart, reliability                           | Forecast cutoff week; playoff/bye/title probabilities; metric choice; historical calibration; simulation assumptions; projection coverage; early-season and missing-settings states; sharing and exports                                                                                                                                                                        |
| Manage leagues     | League list and selected connection form                                  | Rename; provider ID updates; ESPN setup; creation link; separate confirmed deletion; retry and empty states                                                                                                                                                                                                                                                                     |
| Connect league     | Sleeper/ESPN choice and setup form                                        | Provider ID, league name and season; league URL guidance; private ESPN setup; validation; cancellation; power-based suggested initial rankings                                                                                                                                                                                                                                  |
| Profile            | Profile details, writing connections, ESPN settings                       | Name/nickname; connected Codex account; save/replace/remove OpenAI and Anthropic keys; connection states; ESPN cookie instructions and save/remove flow; manage-leagues navigation                                                                                                                                                                                              |

League history is a primary navigation item and reuses the chosen interactive Manager Explorer concept in league-history.html. The production history implementation remains untouched. Public ranking, shared report, and frozen snapshot routes should inherit the corresponding preview/report layouts with editing actions hidden and snapshot identity retained. Sign-in remains outside the authenticated workspace and was not redesigned here.

## What can be explored

- All twelve views, all view tabs, and desktop/phone layouts.
- Team selection, ranking reordering, editable edition text, preview, and mock dialogs for advanced actions.
- Player search and comparison selection; trade roster search and asset selection.
- Sortable sample tables, alert dismissal/restoration, matchup highlighting, and account/settings paths.
- League/season/week selections carry between screens in memory. No provider data is fetched when they change.
- The review-only state selector shows ready, loading, empty, or error layouts. Retry returns to ready.

Forecasts, charts and summary figures are sample presentations. Some filters, comparisons and trade/lineup/waiver scenarios recompute from bounded local fixtures, not provider data. Form values only support design review. Sensitive inputs are never persisted. Production implementation must reuse existing analytics and mutations, rather than replace them with these sample values.

## Validation

Verified screen navigation, each view tab, page overflow at 1440px and 390px, browser runtime errors, and WCAG A/AA automated accessibility checks. Desktop and phone screenshots are included beside the source. Additional manual interaction checks cover reorder, comparison selection, trade selection/reset, context preservation, state retry, and dialogs. This validates the mockup, not the underlying production application.

## Review corrections

- Live matchups retains four simultaneous sections, a four-game selection limit, cross-league filtering that preserves selected games, independent quarter scrolling, and empty slots when a game is removed.
- Weekly overview shows all sample managed-league matchups at once. Managed-team choices, lineup/waiver advice, alerts and destination links belong to each league.
- Rankings preview uses an isolated copy of the existing `src/export.css`, including the original 1304px canvas, Arial type, green header, green/red rank circles, cream rows, movement colors, manager/record, trending and comments columns. The workspace theme does not restyle the export. Original and compact production downloads remain untouched.
- TASK-147 tracks a future optional Classic/New rankings export theme choice, with Classic as the default. Theme switching is not implemented in this mockup.

Rechecked the four-game limit, remove/add selection, all-matchup overview, per-team advice, original export computed colors and geometry, phone page fit, and desktop board viewport fit. The unchanged classic export retains its existing low-contrast gray metadata and red movement color; automated contrast findings inside the isolated legacy export are not changes to the workspace design.

### Live roster density correction

Live matchups uses a compact review/navigation strip and an edge-to-edge viewport workspace. The standard brand header, large page heading, standalone context bar, oversized score blocks, and footer are removed from this screen. A compact league-filter sidebar sits beside four equal quarters. Each quarter has a small game/estimate header and two independent team columns with starters, bench, positional slots, player-profile links, per-player scores, and team totals.

The sample board now shows 144 player rows across eight rosters (10 starters and 8 bench slots per team). All four games and all sample roster rows fit without internal scrolling at 1440×900 and 2048×942. At 1280×720 the board remains within the viewport and rosters scroll inside their quarters. Phone layouts stack the quarters and show the full rosters in the page flow. Actual roster lengths remain determined by the league; extra rows must scroll rather than disappear.

Verified four-game selection and replacement, player-profile preview actions, desktop/phone overflow, viewport fit, and returning to normal page chrome on other screens.

### Primary navigation correction

The main navigation contains exactly seven items: Rankings studio, Weekly overview, Live matchups, Season insights, Playoff simulator, League history, and Other tools. Players and Trade analyzer are reachable from Other tools and show that tab as active, with a breadcrumb back to the tools page. Profile, Create league, and Manage leagues are grouped in the top-right profile dropdown, alongside Sign out. They are not primary tabs. The dropdown remains available in the compact Live matchups navigation and closes after navigation, outside clicks, or Escape.

League history is restored using the existing selected Manager Explorer mockup, including manager/season controls, focused archive sections, rivalry evidence, and the league archive. Its old standalone header is hidden so the common app navigation is the single primary navigation. The historical concept remains sample data; the production history implementation is not modified.

Verified the seven-item navigation, secondary tool routing and active state, profile menu destinations and keyboard dismissal, history manager interaction, four-game Live board, and desktop/phone page fit.

## Expanded feature-preserving design pass

The detailed [feature coverage map](feature-coverage.md) supersedes the earlier sparse layouts. Analytics, decision support, history and workflow modules now supply focused sample views and interactions for the audit gaps the user requested. Purely explanatory `detail()` content uses accessible tooltips. Data, source evidence, configuration, critical missing-data notices and actionable controls remain available. Forecast calibration is under Advanced rather than stacked into the default forecast.

The misleading personal “Connect Codex account” action is replaced by the existing server-managed readiness/setup/quota/key-precedence explanation. Identity and password recovery are represented for final implementation. These requirements are also recorded in TASK-146; it remains To Do because these are review mockups. No reduction is recorded in the approval log, and future proposals to remove functionality require separate explicit approval.
