# Season insights and historical lineup accuracy: preservation contracts

Read only when this area or a shared dependency is affected. Start at the [feature index](../feature-preservation.md). Any reduction requires explicit user approval recorded in the [approval log](approved-changes.md) before implementation.

## Important constraints

- **Optimize legal lineups from starters AND bench.** The user explicitly asks that projections not simply use the current starting lineup, so bye weeks and replacements are considered. Preserve legal slot eligibility, availability/locks, actual versus projected semantics, historical best-lineup scores, missed points, and weighted sit/start accuracy (TASK-49–TASK-52, TASK-80, TASK-91, TASK-134).
- **Explain the numbers and limits.** Luck and other metrics need definitions, denominators, coverage and worked context. Keep regular-season versus final placement separate. Missing values are unavailable, not invented zeros; legitimate zero/negative points remain valid (TASK-4, TASK-5, TASK-40, TASK-112, TASK-113).

## Related areas and verification

Also read playoffs for projection/cutoff changes, league-history for cross-season aggregation, and sharing for report snapshot/export changes. Area names refer to files linked in the index; follow only relevant dependencies.

Useful references/checks (starting points, not a substitute for inspecting affected code):

- [calculations.md](../calculations.md)
- [InsightsPage.test.tsx](../../src/components/InsightsPage.test.tsx)
- [manager-comparison.test.ts](../../src/manager-comparison.test.ts)

## Feature contracts

Stable IDs trace to the original backlog. Criteria are requirements, not evidence that today’s code or deployment was tested. Load source requests/history only to resolve a specific detail. Later completed corrections refine earlier implementation details.

### TASK-4 — Improve documentation of how calculations are done

- Keep expandable calculation explanations in season/history summaries and the full calculation reference. Explain luck with a worked example, denominators, projection/scoring coverage, trade/pickup grading, sample thresholds and historical weighting.

Source: [TASK-4](../../backlog/tasks/task-4%20-%20Improve-documentation-of-how-calculations-are-done.md).

### TASK-5 — Add displays of basic stats in current and previous seasons display

- Show playoff appearances, championships, last-place finishes and average final placement in season/history summaries, with per-season manager outcomes.
- Display known-season coverage; incomplete or unsupported outcomes stay unknown. Aggregate by verified manager identity, with provider-specific bracket/finish rules.

Source: [TASK-5](../../backlog/tasks/task-5%20-%20Add-displays-of-basic-stats-in-current-and-previous-seasons-display.md).

### TASK-28 — Compare two managers over selected seasons

- Readers can choose two distinct managers and a season range.
- Comparison displays scoring, league-median performance and known season achievements on consistent coverage windows.
- Missing seasons and ownership-group differences are visible; changing the comparison never modifies ranking editions.

Source: [TASK-28](../../backlog/tasks/task-28%20-%20Compare-two-managers-over-selected-seasons.md).

### TASK-29 — Download report tables as CSV

- Season and history report tables can be exported with their active filters and visible ordering.
- Exports include clear column names, coverage or missing-value indicators and the relevant league/season context.
- Text values are safely escaped, including spreadsheet-formula-like names, and private account or credential fields are excluded.

Source: [TASK-29](../../backlog/tasks/task-29%20-%20Download-report-tables-as-CSV.md).

### TASK-40 — Average regular season placement as well as end of season placement in separate columns

- League History calculates regular-season placement only after the configured regular season is complete and complete league scoring data is available.
- The achievements table shows separate average regular-season placement and average final placement columns with independent coverage.
- The year-by-year history table shows separate regular-season and final placements, leaving unavailable values blank rather than substituting one for the other.

Source: [TASK-40](../../backlog/tasks/task-40%20-%20Average-regular-season-placement-as-well-as-end-of-season-placement-in-separate-columns.md).

### TASK-50 — Figure out historical records of best vs best for players left on bench

- Completed historical weeks expose each team’s actual score and best legal lineup score when provider player, position and slot data are complete.
- The weekly result records how many actual starters were retained by the best lineup; incomplete data remains unavailable rather than inferred.
- Sleeper and ESPN fixtures cover bench substitutions, roster-slot legality and unavailable historical player data.

Source: [TASK-50](../../backlog/tasks/task-50%20-%20Figure-out-historical-records-of-best-vs-best-for-players-left-on-bench.md).

### TASK-51 — Figure out top possible scoring weeks ever for the best lineup for each player

- The Season insights weekly table shows actual score, best legal lineup score, and missed points for each selected team-week when lineup data are complete.
- Weeks with incomplete provider score, position, or slot data display an unavailable value rather than a fabricated best-lineup total.
- The display is covered by component or DOM-focused tests and documentation explains the unavailable-data boundary.

Source: [TASK-51](../../backlog/completed/task-51%20-%20Figure-out-top-possible-scoring-weeks-ever-for-the-best-lineup-for-each-player.md).

### TASK-52 — Figure out historical starting accuracy, aka if a player on the bench outscored a player in the lineup for each manager

- Each eligible team-week displays sit/start accuracy as retained actual starts divided by legal lineup slots; incomplete historical lineup weeks remain unavailable.
- Season insights summarize each team’s eligible-week best-lineup average and weighted sit/start accuracy.
- League History summarizes each manager’s eligible-week best-lineup average and weighted sit/start accuracy across selected seasons.
- Calculation and UI tests cover aggregation, unavailable coverage, and the displayed percentage; documentation defines the metric.

Source: [TASK-52](../../backlog/completed/task-52%20-%20Figure-out-historical-starting-accuracy-aka-if-a-player-on-the-bench-outscored-a-player-in-the-lineup-for-each-manager.md).

### TASK-108 — Show position group rankings and roster projection charts in Season Insights

- Season Insights shows both a position group ranking heatmap and a stacked roster projection chart for all teams in the selected league and season, using the supplied chart references.
- The heatmap shows league-relative ranks for supported positions, labels rank 1 as strongest, defines tie handling, and exposes the underlying projected-points values and full team names.
- The stacked chart labels position segments and team totals, supports sorting by total or position strength, and uses consistent position identities across both charts; unsupported league positions are handled explicitly.
- Both charts disclose the projection horizon, provider/source, refresh time, scoring basis, and positional aggregation rules, including starters versus bench/reserve, flex eligibility, and availability/bye treatment. Missing projection data is distinguished from zero.
- League or season changes cannot retain another selection's chart data. Historical or completed seasons use valid season-specific projections only when available; otherwise show a clear unavailable state without using current-season forecasts.
- Numeric labels and an accessible table make the results understandable without color or hover; charts remain usable on mobile, and verification covers custom positions, ties, missing data, and league/season isolation.

Source: [TASK-108](../../backlog/tasks/task-108%20-%20Show-position-group-rankings-and-roster-projection-charts-in-Season-Insights.md).

### TASK-109 — Quantify remaining fantasy schedule strength in Season Insights

- Season Insights shows a numeric remaining-schedule difficulty score and easiest-to-hardest league rank for every team, highlighting the saved managed team when one is selected.
- The default horizon covers uncompleted scheduled regular-season matchups from an explicit as-of week, counts repeated opponents and multiweek matchups according to league rules, and does not assume unknown playoff opponents.
- Each team has a week-by-week opponent and strength breakdown. The displayed formula, units, and rank direction explain how opponent strength is compared with the league baseline for the same weeks.
- Projection coverage, source, freshness, and any historical-strength fallback are disclosed; absent schedules or projections are not treated as easy opponents or zero strength, and teams with no remaining games have an explicit end-of-season state.
- Results respect the selected league, season, scoring settings, and report cutoff without future-data leakage in historical reports. Verification includes repeated opponents, differing remaining-game counts, incomplete schedules, and league/season changes.

Source: [TASK-109](../../backlog/tasks/task-109%20-%20Quantify-remaining-fantasy-schedule-strength-in-Season-Insights.md).

### TASK-111 — Toggle position strength between remaining projections and completed-week actual points

- An always-available toggle switches the positional charts and rankings between projected remaining weeks and completed-week actual starter scoring.
- Completed mode excludes future and unfinished weeks, groups actual starters by primary position including flex once, preserves ties and negative/zero points, and discloses missing coverage.
- Actual starter position metadata survives report snapshots, historical reports do not require current rosters, and labels identify actual rather than projected data.
- Focused calculation/provider/UI tests, browser interaction, build and relevant static checks pass; formulas are documented.

Source: [TASK-111](../../backlog/tasks/task-111%20-%20Toggle-position-strength-between-remaining-projections-and-completed-week-actual-points.md).

### TASK-113 — Preserve the configured season start when measuring completed position coverage

- Completed positional coverage uses the configured reporting start through the completed cutoff, rather than silently moving the start to the earliest returned score.
- Missing an opening week in a week-1 league leaves affected teams unranked with visible missing coverage, while a league configured to start in week 3 can be fully covered from week 3.
- The reporting horizon survives saved snapshots; legacy reports without reliable start metadata disclose uncertainty instead of asserting full-season coverage.
- Tests cover missing opening weeks, legitimate late starts, missing intermediate weeks, no completed weeks, snapshot round trips and UI coverage labels; formulas are updated.

Source: [TASK-113](../../backlog/tasks/task-113%20-%20Preserve-the-configured-season-start-when-measuring-completed-position-coverage.md).

### TASK-146 — Focused season analytics

- Season insights uses focused Team scoring, Weekly trends, Roster strength, Remaining schedule, Manager report card, Trades and Pickups views. Team selection persists between related views; chart mode/sort, former-manager inclusion, pickup controls and table state remain available when returning.
- Weekly trends keeps its chart and exact actual/projected/difference/best-legal/missed/start-accuracy table, legal-slot denominators, explicit lineup coverage and active-filter CSV. Remaining schedule keeps the league ranking and a team selector for exact weekly opponents and source basis.
- Definitions use accessible information tooltips. Critical unavailable-data notices, provider notes, scoring/source/horizon/refresh context, transaction verdicts and coverage remain in the evidence views. Sharing, public/snapshot boundaries, provider reads and calculation functions are retained.
- Validation and exact affected IDs: [analytics preservation checklist](../manager-explorer-analytics-coverage.md).

Source: [TASK-146](../../backlog/tasks/task-146%20-%20Apply-the-Manager-Explorer-design-approach-across-the-app.md).

## TASK-146 usability iteration — October 14, 2026

The usability iteration keeps a real selected-team inspector across all seven focused views without changing the active view on selection. Semantic four-tier positional ranks/points return. Following TASK-149 feedback, the stacked chart rounds its bounds from the real positive and negative stack extents in the selected mode, rather than imposing a 2200-point minimum; a 718-point maximum ends at 800. Zero-only data uses a 0–1 fallback, unavailable values remain unavailable, and totals have room outside the bars. Every exact weekly column, coverage denominator, chart/mode, schedule opponent, manager/former-manager control, move/source evidence and CSV remains. Selected-team CSV context is explicit. See [fresh Analytics evidence](../usability-analytics-coverage.md) and [follow-up coverage](../insights-history-followup-coverage.md).
