# App code review — October 5, 2026

Reviewed provider normalization, Season Insights, positional/schedule calculations,
Players, Trade Analyzer, live-data loading, playoff computation, report caching,
snapshot serialization, and related tests and CI checks using the Karpathy guidelines.
This is a focused code review, not an exhaustive security or production-performance audit.

Application implementation was left unchanged. Each finding below has a separate,
unassigned **To Do** task with four testable acceptance criteria. Existing completed
work was checked to avoid duplicate tasks; the trade-suggestion feature remains
tracked separately in TASK-110. The order below is a suggested delivery order,
with scoring correctness ahead of performance and usability work.

| Order | Backlog item                                                                                                                                                                                                   | Priority | Why it matters                                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------- |
| 1     | [TASK-112 — Keep unusable Sleeper live projections unavailable instead of zero](<../backlog/tasks/task-112 - Keep-unusable-Sleeper-live-projections-unavailable-instead-of-zero.md>)                           | High     | Unusable native stat data becomes a numeric zero and can affect lineup and trade advice.     |
| 2     | [TASK-113 — Preserve the configured season start when measuring completed position coverage](<../backlog/tasks/task-113 - Preserve-the-configured-season-start-when-measuring-completed-position-coverage.md>) | High     | Missing opening weeks are silently omitted from purportedly complete position rankings.      |
| 3     | [TASK-114 — Resolve ESPN ranking-studio matchups by scoring week rather than period ID](<../backlog/tasks/task-114 - Resolve-ESPN-ranking-studio-matchups-by-scoring-week-rather-than-period-ID.md>)           | High     | Multiweek calendars return missing or incorrect opponents for a selected scoring week.       |
| 4     | [TASK-115 — Make Player Profiles refresh invalidate cached season reports](<../backlog/tasks/task-115 - Make-Player-Profiles-refresh-invalidate-cached-season-reports.md>)                                     | Medium   | An explicit refresh can reuse stale observed scores, especially historical reports.          |
| 5     | [TASK-116 — Keep uncached playoff simulations from blocking interactive rendering](<../backlog/tasks/task-116 - Keep-uncached-playoff-simulations-from-blocking-interactive-rendering.md>)                     | Medium   | A first calculation blocks the render thread for hundreds of milliseconds in local fixtures. |
| 6     | [TASK-117 — Fetch live data only for the selected league in Players and Trade Analyzer](<../backlog/tasks/task-117 - Fetch-live-data-only-for-the-selected-league-in-Players-and-Trade-Analyzer.md>)           | Medium   | Selected-league pages wait for provider reads and enrichment for unrelated leagues.          |
| 7     | [TASK-118 — Retain player names and primary positions for historical profile browsing](<../backlog/tasks/task-118 - Retain-player-names-and-primary-positions-for-historical-profile-browsing.md>)             | Medium   | Historical players lose readable names and position filters without live roster metadata.    |
| 8     | [TASK-119 — Coalesce concurrent cold Sleeper player catalog reads](<../backlog/tasks/task-119 - Coalesce-concurrent-cold-Sleeper-player-catalog-reads.md>)                                                     | Low      | Concurrent cold readers download and normalize the same full catalog more than once.         |

## Evidence and scope

### TASK-112: unusable live projections become zero

At [live-matchups.server.ts](../src/server/live-matchups.server.ts#L111), any
nonempty native Sleeper stat dictionary is reduced to points. Missing scoring
weights contribute zero. A mocked provider with `scoring_settings={rush_yd: 0.1}`
and projection `stats={unrelated_stat: 1}` produced `projectedPoints=0`. The
[season projection scorer](../src/server/insights/projections.ts#L182) instead
checks for applicable finite scoring inputs. This is a confirmed normalization
gap; it does not imply that every zero forecast is invalid or that this malformed
input has occurred in production.

### TASK-113: missing leading weeks look complete

At [season-strength.ts](../src/season-strength.ts#L51), completed mode takes the
minimum observed scoring week as the season start. Removing every week-1 score
from a through-week-3 fixture yielded `weeks=[2,3]`, two covered weeks and a
non-null total. That is indistinguishable from a legitimate later league start.
The report needs a trustworthy start boundary or an explicit partial-horizon
label. This finding concerns the newly added completed-week mode in TASK-111;
its current tests detect intermediate gaps but cannot distinguish these starts.

### TASK-114: scoring week and matchup period are mixed

At [espn.provider.ts](../src/server/providers/espn.provider.ts#L194), the request
uses a scoring week while the schedule filter compares the matchup-period ID
with that week. A mocked calendar `{1:[1,2], 2:[3,4]}` and valid period-2 fixture
returned `[]` when requesting week 3. In a larger schedule it could match another
period's ID instead. Score fields currently use period totals, which also needs
an explicit selected-week versus aggregate convention. The
[season schedule mapper](../src/server/insights/schedule.ts) already treats these
calendars separately; this task concerns the ranking-studio provider endpoint.

### TASK-115: refresh does not bypass the report cache

The [Players reload effect](../src/components/PlayerProfilesPage.tsx#L91) calls
`api.getInsights(leagueId, year)` on both initial load and explicit refresh. A DOM
probe clicked **Refresh player data** and confirmed the second request remained
`["10",2026]`, without the refresh argument. The
[API cache contract](../src/api/client.ts#L303) invalidates only when that argument
is true, and [historical reports](../src/api/insights-cache.ts) have infinite
freshness within their cache lifetime. Existing tests verify retained selection
but do not establish that the button fetches changed scores.

### TASK-116: simulation executes synchronously during rendering

[PlayoffForecast](../src/components/PlayoffForecast.tsx#L15) calls
[cachedPlayoffForecast](../src/playoff-timeline.ts#L26) in render. On a miss, the
simulation runs synchronously. The timeline schedules work between cutoffs, but
[each cutoff](../src/components/PlayoffTimeline.tsx#L63) still computes on the
same thread. A local Node benchmark used synthetic paired scores through week 6,
a week-14 regular-season end, four playoff places, and the default 20,000
simulations. It called the uncached function three times for each fixture:

| Teams | Run 1  | Run 2  | Run 3  |
| ----- | ------ | ------ | ------ |
| 12    | 194 ms | 183 ms | 180 ms |
| 32    | 530 ms | 518 ms | 465 ms |

These timings include forecast validation and are synthetic local Node results,
not measured browser latency. Main-thread blocking is inferred from the verified
synchronous call path. The future task requires browser measurement, result parity,
and a pending state; it does not prescribe a worker framework or change the model.

### TASK-117: unrelated leagues delay selected-league pages

[Players](../src/components/PlayerProfilesPage.tsx#L91) fetches the all-league
live endpoint and then selects one result. [Trade Analyzer](../src/components/TradeAnalyzerPage.tsx#L418)
also loads the entire live collection. The
[server operation](../src/server/operations.server.ts#L133) runs every saved league
through a single `Promise.all`, including optional cross-provider player
projection work. The selected result therefore waits for unrelated league reads.
This finding is based on code-path inspection, not a measured production request
count. A selected-league request should preserve ownership checks and the existing
all-league Live/overview capability.

### TASK-118: historical profile identity is discarded

[playerProfiles](../src/player-profiles.ts#L29) creates generic player names and
only assigns readable names and positions from a live roster or waiver pool.
A source fixture supplied `playerNames={p0:"Known Player"}`,
`playerPositions={p0:"RB"}`, and actual starter position metadata to
`calculateInsights`. Feeding the resulting historical report to `playerProfiles`
without live data returned `name="Player p0"` and no position, while observed
scores remained available. This is a usability limitation rather than evidence
of incorrect scoring. Preserve available report identities without fabricating
current ownership or joining players by name.

### TASK-119: catalog caching does not coalesce all cold reads

[sleeperNames](../src/server/insights/load.server.ts#L40) stores the completed
catalog but no pending request. Two concurrent calls against a deferred mocked
HTTP response produced two GETs before either resolved. Live has a local
`playerCatalog` promise wrapper; direct season-report, waiver and enrichment
callers do not share that wrapper. The scope is central catalog request
coalescing with failure recovery, not replacing the report cache.

## Verification

- Baseline `npm test`: **484 passed, 1 skipped** across 100 passing test files;
  the existing opt-in integration test remained skipped.
- Seven disposable fixture/provider/DOM probes passed, covering leading-week
  coverage, ESPN period selection, historical identity, native live scoring,
  concurrent catalog reads, refresh arguments, and an initial timing check.
- A separate timing probe passed and recorded three uncached runs for each
  league size shown above.
- Probes used mocked provider responses or synthetic local scores. No account
  credentials, live provider calls, database changes, or application code edits
  were needed. Temporary probe files were removed after execution.
- Each new task retains source references, reproduction context, acceptance
  criteria and this document. Future implementations should add permanent
  regression tests for their own fixes.
