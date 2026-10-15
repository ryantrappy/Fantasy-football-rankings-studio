# League history and Manager Explorer: preservation contracts

Read only when this area or a shared dependency is affected. Start at the [feature index](../feature-preservation.md). Any reduction requires explicit user approval recorded in the [approval log](approved-changes.md) before implementation.

## Important constraints

- **Keep historical storytelling evidence-based.** Preserve the full competition, moments, personalities and recap capabilities, their minimum samples, source evidence, supported sharing and explicit unavailable states. Do not infer missing archives, queue intent, ownership or future trade value (TASK-122–TASK-145).

## Related areas and verification

Also read season-insights for source metrics/manager identity, sharing for public/snapshot/recap changes, and navigation-and-performance for retained view state. Area names refer to files linked in the index; follow only relevant dependencies.

Useful references/checks (starting points, not a substitute for inspecting affected code):

- [history-competition.md](../history-competition.md)
- [history-moments.md](../history-moments.md)
- [history-personalities.md](../history-personalities.md)
- [HistoryPage.test.tsx](../../src/components/HistoryPage.test.tsx)

## Feature contracts

Stable IDs trace to the original backlog. Criteria are requirements, not evidence that today’s code or deployment was tested. Load source requests/history only to resolve a specific detail. Later completed corrections refine earlier implementation details.

### TASK-122 — Show all-time manager head-to-head records and rivalries

- A manager can inspect their all-time matchup record against every other manager, with games played, W-L-T, points for/against, win percentage and average margin.
- Rival, punching bag and kryptonite labels use configurable minimum sample coverage and explain the evidence behind each label.
- A league-wide rivalry matrix compares every manager pair and handles ties, manager identity changes and missing historical seasons.
- Insufficient samples and unavailable history are shown explicitly.

Source: [TASK-122](../../backlog/tasks/task-122%20-%20Show-all-time-manager-head-to-head-records-and-rivalries.md).

### TASK-123 — Add historical expected wins and completed-season schedule difficulty

- Each manager season shows expected wins alongside actual wins, with the method and usable-week coverage.
- Completed-season schedule difficulty is based on opponent points scored, not opponent record.
- Users can compare a team’s result under another team’s schedule using the same season and scoring rules.
- Byes, ties, partial schedules and missing scores are handled transparently.

Source: [TASK-123](../../backlog/tasks/task-123%20-%20Add-historical-expected-wins-and-completed-season-schedule-difficulty.md).

### TASK-124 — Add a cross-season Elo manager power ranking

- Ratings update chronologically from completed head-to-head games and carry across season boundaries.
- The ranking includes an explanation of rating movement and the games contributing to each manager’s rating.
- New managers, incomplete histories, ties, and manager identity changes have documented treatment and coverage.

Source: [TASK-124](../../backlog/tasks/task-124%20-%20Add-a-cross-season-Elo-manager-power-ranking.md).

### TASK-125 — Create a league Hall of Fame and Hall of Shame record book

- Hall of Fame rankings combine championships, playoff performance, regular-season wins, scoring and longevity with visible metric weights.
- Hall of Shame entries identify records such as worst seasons, longest losing streaks, lowest scores and biggest collapses with season and matchup evidence.
- Coverage and sample size accompany each record; unknown provider results are not treated as failures.

Source: [TASK-125](../../backlog/tasks/task-125%20-%20Create-a-league-Hall-of-Fame-and-Hall-of-Shame-record-book.md).

### TASK-126 — Detect fantasy manager dynasties and competitive eras

- The league history identifies qualifying title runs and other configurable sustained-success eras with the seasons included.
- Era thresholds and supporting accomplishments are visible and consistently applied.
- Incomplete championship coverage does not produce false era claims.

Source: [TASK-126](../../backlog/tasks/task-126%20-%20Detect-fantasy-manager-dynasties-and-competitive-eras.md).

### TASK-127 — 'Rate historical playoff performance, clutch results and choking'

- Managers can compare regular-season and playoff performance across completed seasons with sample sizes.
- Must-win and playoff performance definitions are explicit and include the games counted.
- Choker or clutch labels require sufficient evidence and are presented as descriptive statistics, not predictions.
- Missing brackets, byes and unsupported provider outcomes remain unknown.

Source: [TASK-127](../../backlog/tasks/task-127%20-%20Rate-historical-playoff-performance-clutch-results-and-choking.md).

### TASK-128 — Build an all-time matchup and scoring record book

- Users can browse and sort the closest games, blowouts and high-scoring games across league history.
- Worst-beat entries show each team’s scoring rank for that week and the margin.
- Record entries link to the season or matchup when available and show missing-history coverage.

Source: [TASK-128](../../backlog/tasks/task-128%20-%20Build-an-all-time-matchup-and-scoring-record-book.md).

### TASK-129 — Add a weekly loss Pain Index

- The index ranks a manager’s most painful losses and shows the factors and source data behind each score.
- Unavailable components are excluded or labeled; scores remain comparable only where the same components are available.
- The feature avoids claiming emotional certainty and presents the index as playful league context.

Source: [TASK-129](../../backlog/tasks/task-129%20-%20Add-a-weekly-loss-Pain-Index.md).

### TASK-130 — Track Monday night fantasy comebacks and miracles

- Qualifying comeback games show the pre-Monday probability, final outcome, players contributing and data source.
- Thresholds are configurable or clearly stated, and incomplete live/probability data is not inferred.
- Users can browse league-wide and manager-specific comeback records by season.

Source: [TASK-130](../../backlog/tasks/task-130%20-%20Track-Monday-night-fantasy-comebacks-and-miracles.md).

### TASK-131 — Replay historical matchup win probability

- A historical matchup view plots win probability across available game-time snapshots.
- The graph identifies snapshot timing, data coverage and the players or scoring events responsible for major changes when available.
- Matchups without sufficient archived data show an explicit unavailable state.

Source: [TASK-131](../../backlog/tasks/task-131%20-%20Replay-historical-matchup-win-probability.md).

### TASK-132 — Compare draft picks with draft position and measure manager draft skill

- Each pick is compared with an explicit draft-position or ADP expectation using season production and league scoring.
- Best and worst picks are browseable by manager and season with the comparison baseline and coverage.
- Multi-season drafting skill aggregates comparable picks and shows sample size; missing ADP or draft data is not guessed.

Source: [TASK-132](../../backlog/tasks/task-132%20-%20Compare-draft-picks-with-draft-position-and-measure-manager-draft-skill.md).

### TASK-133 — Track players managers dropped before breakout weeks

- Dropped-player entries identify the manager, transaction date, subsequent scoring window and relevant league availability.
- The report compares subsequent output with the stated baseline and avoids crediting points outside the configured window.
- Incomplete transaction or player history is labeled and excluded from unsupported conclusions.

Source: [TASK-133](../../backlog/tasks/task-133%20-%20Track-players-managers-dropped-before-breakout-weeks.md).

### TASK-134 — Add perfect-lineup records and retrospective start-sit regret

- For each completed matchup, the report compares actual and optimal legal lineup points and indicates whether optimal management would change the result.
- The largest regret of each week identifies the manager, decision, points difference and matchup consequence.
- Position eligibility, lineup slots, scoring rules, incomplete rosters and sample coverage are respected.

Source: [TASK-134](../../backlog/tasks/task-134%20-%20Add-perfect-lineup-records-and-retrospective-start-sit-regret.md).

### TASK-135 — 'Show league trade networks, trade partners and trade trees'

- A league trade network shows trade counts between manager pairs and links to the underlying transactions.
- Trade trees follow assets through later trades where provider transaction data can establish continuity.
- Unresolvable assets, draft picks and future value are explicitly marked rather than assigned speculative values.

Source: [TASK-135](../../backlog/tasks/task-135%20-%20Show-league-trade-networks-trade-partners-and-trade-trees.md).

### TASK-136 — Expand trade evaluation beyond short-term scoring windows

- Trade reports distinguish observed points, starts actually made and documented playoff or championship contribution.
- Each view shows its evaluation window, data coverage and limitations; draft picks and future value are not fabricated.
- Close or context-dependent outcomes can remain unranked instead of forcing a winner.

Source: [TASK-136](../../backlog/tasks/task-136%20-%20Expand-trade-evaluation-beyond-short-term-scoring-windows.md).

### TASK-137 — Summarize manager transaction activity and tinkering tendencies

- Managers can compare transaction counts by season and transaction type.
- Counts use explicit provider coverage and distinguish unsupported transaction categories.
- Playful activity labels are optional, explainable and based on stated thresholds.

Source: [TASK-137](../../backlog/tasks/task-137%20-%20Summarize-manager-transaction-activity-and-tinkering-tendencies.md).

### TASK-138 — Identify manager nemesis and guardian-angel players

- Nemesis and guardian-angel summaries show player, matchup count, scoring and the method used to attribute a win or loss.
- The view filters to verified appearances and roster ownership in the league history.
- Small samples, partial roster data and provider player-identity changes are handled transparently.

Source: [TASK-138](../../backlog/tasks/task-138%20-%20Identify-manager-nemesis-and-guardian-angel-players.md).

### TASK-139 — Track manager player loyalty and historical ownership

- A manager-player view shows seasons, weeks rostered and known acquisition paths from league transactions.
- Favorite-player summaries use visible inputs such as draft, trade, pickup and roster duration with sample counts.
- The report does not claim complete NFL career ownership when league records are partial.

Source: [TASK-139](../../backlog/tasks/task-139%20-%20Track-manager-player-loyalty-and-historical-ownership.md).

### TASK-140 — Show fantasy soulmate drafting overlap and draft steals

- Managers can compare shared draft targets and player overlap with seasons and counts shown.
- Draft-steal claims require explicit queue or equivalent provider evidence; ordinary next-pick timing is not treated as proof of queue intent.
- Missing queue data and incomparable draft formats are labeled unsupported.

Source: [TASK-140](../../backlog/tasks/task-140%20-%20Show-fantasy-soulmate-drafting-overlap-and-draft-steals.md).

### TASK-141 — Create evidence-based manager archetypes

- Each archetype maps to explicit metrics, season coverage and minimum sample requirements.
- A manager can receive multiple profiles or no profile when evidence is insufficient.
- Labels remain playful and include the underlying evidence so users can assess the characterization.

Source: [TASK-141](../../backlog/tasks/task-141%20-%20Create-evidence-based-manager-archetypes.md).

### TASK-142 — Generate shareable personal and league Fantasy Wrapped recaps

- A personal recap summarizes one manager’s selected season with record, expected wins/luck, rivalries, best and worst matchup, pickups, lineup choices and supported player/archetype highlights.
- A league recap highlights champion, scoring leader, luck extremes, upsets, closest game, blowout, pickup, trade and rivalry of the year where data exists.
- Recaps disclose data coverage and omit unsupported claims; each can be shared through an intentional public snapshot with privacy controls.
- The layout is readable on mobile and produces a clear share preview.

Source: [TASK-142](../../backlog/tasks/task-142%20-%20Generate-shareable-personal-and-league-Fantasy-Wrapped-recaps.md).

### TASK-144 — Use single-week playoff scores for all-time scoring highs

- Combined scoring highs compare actual individual weeks, including each week of multiweek playoff series.
- Individual weekly highs remain weekly, while closest games and blowouts retain series totals.
- Regression tests cover weekly splitting, invalid weekly data, and category switching; explanatory copy describes the scoring basis.

Source: [TASK-144](../../backlog/tasks/task-144%20-%20Use-single-week-playoff-scores-for-all-time-scoring-highs.md).

### TASK-145 — Redesign league history as a manager explorer

- A shared manager picker and verified record summary carry context across competition, season history, stories, and profiles.
- Competition, story, and profile categories show one focused view at a time; all existing analytics and league record views remain reachable.
- Rivalry rows and matrix cells open real game evidence beside the selected record, with shared and snapshot navigation preserved.
- Desktop and phone layouts remain keyboard accessible without page-wide overflow; affected tests and type checks pass.

Source: [TASK-145](../../backlog/tasks/task-145%20-%20Redesign-league-history-as-a-manager-explorer.md).

## TASK-146 History presentation and verification

The History slice retains all categories above and adds focused season results, detailed metrics, selected-manager achievements with independent placement/result coverage, and a shortcut to the existing manager comparison. Schedule replay, moments and Wrapped share the selected season while aggregate analytics retain all selected-season inputs. Changing included years preserves the selected manager when available. A manager-focused Wrapped can explicitly select personal or league scope; publication consent and pending snapshot results cannot carry into a different league/manager/season context.

Pure definitions use accessible information tooltips; required caveats, data coverage, game evidence, configurable controls and validated archive import/export remain available. Public/snapshot navigation, publication privacy, immutable archives, provider calculations and revocation remain unchanged. See the [History coverage checklist](../manager-explorer-history-coverage.md) for the exact IDs and validation boundary. History verification includes 158 focused component/calculation/cache/sharing/snapshot tests, five browser tests at 320/390/1440px, axe/keyboard checks, visual screenshots, lint, formatting and typecheck. This records History-slice evidence and does not declare the app-wide TASK-146 complete.

When no manager is selectable, the league archive exposes the existing Detailed season metrics table and CSV. This fallback uses the same supplied node and disappears when the focused manager path is available, preserving reachability without duplicate live tables.

## TASK-146 usability iteration — October 14, 2026

The usability iteration adds automatically useful real record evidence across focused history views, scoped selection fallback and loaded-source provenance without replacing original analytics/tables. Four high-contrast Wrapped stories retain all additional highlights, coverage and intentional immutable snapshot/consent/revocation controls. Every category, archive, manager/year identity and sharing workflow remains reachable. See [fresh History evidence](../usability-history-coverage.md).

## TASK-149 follow-up — October 15, 2026

Fresh private History navigation defaults to every available season, including the current year. Explicit year selections and empty selections remain authoritative; shared defaults and immutable snapshots retain their existing scope. Both all-season and all-prior-season selection actions remain reachable. Background preloading lets the progressive page render immediately, with the existing three-read concurrency limit, cancellation, cached reports and partial-failure notices intact.

Competition → Rivalries adds a separate all-manager matchup heatmap alongside the original opponent records and league matrix. It uses the same verified games and stable ownership identities, including former managers; matching display names stay separate. Row-oriented W-L-T, tie-adjusted win percentage, sample sizes, low-sample labels, neutral self/no-game cells, keyboard pair navigation, actual game evidence and contextual CSV are preserved. Header actions align with the league input and wrap with accessible touch targets. See [follow-up coverage](../insights-history-followup-coverage.md) and [competition definitions](../history-competition.md).
