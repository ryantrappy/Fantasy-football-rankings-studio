# Report calculations

Season Insights and League History expose **How are these numbers calculated?**
above the summary cards. The same guide appears in public shared reports.

Live Sleeper projections require at least one finite stat that applies to the
selected league's scoring rules. True zero and negative projections are retained;
missing, unrelated, or invalid stat coverage remains unavailable. Optional ESPN
estimates disclose their actual source and coverage rather than implying that
an unavailable native projection exists.

## Schedule luck

For each eligible regular-season game:

- Actual win credit: win = 1, tie = 0.5, loss = 0.
- Expected win credit: `(other teams outscored + 0.5 × other teams tied) / (team count − 1)`.
- Extra wins: sum of actual credits minus sum of expected credits.
- Luck index: `100 × extra wins / eligible games`, in percentage points (pp).

With scores 120, 110, 100, 90, the 110-point team has expected win credit 2/3.
Winning against the 90-point team gives +1/3 extra wins (+33.3 pp for that game).
Losing against the 120-point team gives −2/3 extra wins (−66.7 pp).
Across two games with 1.5 actual and 1.25 expected wins, extra wins are +0.25
and the index is +12.5 pp. It is not a probability or an injury-luck estimate.

A game qualifies only with reciprocal opponent IDs and a full league score set.
Provider adapters omit opponent IDs for playoffs and byes. No eligible games
means an unavailable value, not zero. History sums credits and games first.

## Scoring

| Display                          | Calculation / denominator                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------ |
| Avg. points                      | Total observed points / observed weeks                                               |
| Best week                        | Maximum observed points                                                              |
| Above median                     | Count of weeks strictly above the weekly league median / observed weeks              |
| Avg. vs. median                  | Mean of `100 × (score − weekly median) / weekly median`; only positive-median weeks  |
| Best week vs. median             | Week with the highest relative median percentage, not necessarily the highest points |
| All-play win rate                | `100 × (wins + half ties) / comparisons` against every other observed team each week |
| Difference / Avg. vs. projection | Actual minus projection; average only over weeks with projections                    |
| Beat projection                  | Strictly positive differences / projected weeks                                      |

The median is the middle sorted score, or the average of the two middle scores.
The team's own score participates in the league median. Scoring includes all
observed completed weeks, including playoffs; partial league sets may contribute
to median/all-play values but never to schedule luck. A zero score is valid.
Missing projections remain unavailable. Sleeper supplies no historical projections;
ESPN sums available starting-lineup projections, excluding bench and IR.

## Trade grades

Use the first four weeks **after** the reported transaction week, capped at the
latest completed week. Every asset and participant uses the same observed weeks.
Each player's weekly value is its observed points minus the median of at least
three other same-position starters. Exclude all traded players from the baseline.
Rostered bench scores can contribute to the traded player's observed value.

Sum the per-player averages to obtain received and sent package values;
net gain = received value minus sent value. A grade requires at least two shared
weeks, 75% coverage of the completed window, at least two participants and known
sender/receiver teams. A leader needs a gap greater than 1 point/week over the
next-highest net gain; otherwise the trade is close. Draft-pick trades have no
winner. Missing scores and positions do not become zero. These are short-window
scoring assessments, not dynasty or causal trade valuations.

## Pickup grades

Use starts for the acquiring team during the first four post-acquisition weeks,
ending before the player's next move. A single add with exactly one same-position
drop uses that dropped player as baseline only when every eligible start has both
scores and there are at least two starts. Otherwise use the same-position starter
median throughout, with at least three other starters per comparable week.

Lift = average player points minus average baseline points on the same compared
starts. At least two compared starts are required for a rating. For example,
player scores 18 and 12 versus baselines 10 and 8 give lift `(30 − 18) / 2 = +6`
points/start. Measured surplus is `6 × 2 = 12` points for this pickup.

Pickup hit rate = positive-lift pickups / rated pickups × 100. Lift averages give
each rated pickup equal weight. Trade averages likewise give each graded trade
equal weight. Counts show rated/total moves; ungraded moves are not losses.
Leader thresholds are 3 graded trades, 5 rated pickups, and 4 positive-median weeks.

## Historical aggregation and coverage

Pool denominators rather than averaging season rates. One season with 1 win in
2 comparisons and another with 9 in 10 gives 10/12 = 83.3%, not 70%.
Managers match by provider account ID, including co-owner groups; new ownership
gets a new record. Unknown identities remain separate by season. Failed seasons
are excluded. Hiding former managers affects displayed rows only, not baselines.
Raw scoring uses each season's league rules; median percentages help comparison
but do not eliminate every difference between seasons.

Source of truth: `src/league-summary.ts`, `src/server/insights/calculate.ts`,
`src/server/insights/normalize.ts`, and the provider mapping in
`src/server/insights/load.server.ts`. Values are rounded for display; normalized
move comparisons are rounded to two decimals before summary aggregation.

## Playoffs and final finishes

Playoff appearances, championships and last-place finishes count confirmed outcomes.
Average regular-season placement ranks complete head-to-head records through the configured
regular-season cutoff by wins (ties count half), then points scored. Exact ties share a placement.
The value stays unknown until every selected team's scoring data is available for every
regular-season week. Average regular-season placement is the sum of those known placements divided
by seasons with a known regular-season placement.

Average final placement = sum of known final placements / seasons with a known placement;
1 is best. Each statistic shows its own coverage denominator. Unknown and unfinished
outcomes are excluded, rather than counted as zero or last place.

Sleeper uses championship-bracket participants after playoffs begin (including
byes) and resolved placement matches once the season status is complete. For a
consolation bracket, winner advancement orders the bottom bracket normally;
loser advancement reverses placement for a toilet bowl. Ambiguous progression,
unresolved games and missing brackets remain unknown. Teams outside a supported
bracket may have no final placement. See [Sleeper brackets](https://docs.sleeper.com/#getting-the-playoff-bracket)
and [consolation/toilet-bowl rules](https://support.sleeper.com/en/articles/2203534-consolation-bracket-vs-toilet-bowl).

ESPN uses unique, valid `rankCalculatedFinal` values after the season ends
(a prior fantasy season or a scoring period beyond the final one) and championship
bracket participation when all playoff entrants are identifiable. Championship
bracket labels come from ESPN's `mMatchupScore` view; `mMatchup` alone omits them.
Each season uses its own team IDs and managers, regardless of current membership. Regular-season
rank or seed is never substituted for a final placement. History weights known
finishes equally per season; league size can differ, so interpret raw average
placements alongside the selected seasons.

## Playoff scenario forecasts

The playoff tab offers 20,000 reproducible Monte Carlo trials using only scores
through the selected cutoff, capped at the end of the regular season. At least
one completed week and paired head-to-head results per team are required. Forecasts through weeks
1–2 carry a prominent small-sample warning because their probabilities can change sharply.
The week-by-week chart repeats that simulation for each completed regular-season cutoff.
Playoff and championship lines use the same cached trials at each cutoff; switching metrics
does not change the model or sample. Current player projections apply only to the latest
eligible cutoff, so earlier chart points remain retrospective estimates based on scores.
A team's expected score is blended with the league average using weight
`n / (n + 3)`. Three prior observations and three prior variance degrees are fixed
regularization assumptions, not coefficients optimized to these league outcomes.
Weekly variance is pooled **within** teams using
`sum(team squared residuals) / sum(n - 1)`, separating weekly noise from differences
in team strength. With only one observation per team, cross-team variation is the
fallback. This pooled variance has a one-point-squared floor.

The historical score model uses a conditional empirical-Bayes normal / inverse-chi-square
posterior. With league mean `m0`, pooled variance `v0`, team mean `m`, and within-team
squared residuals `SSE`, the update is:

- `k = n + 3`, `degrees = n + 3`.
- `posteriorMean = (n * m + 3 * m0) / k`.
- `scale = (3 * v0 + SSE + 3 * n / k * (m - m0)^2) / degrees`.
- Once per team per trial: `variance = degrees * scale / chiSquare(degrees)`;
  `strength = posteriorMean + normal(0, 1) * sqrt(variance / k)`.
- Every future week, including playoff rounds: `score = strength + normal(0, 1) * sqrt(variance)`.

The prior-mean disagreement term belongs to the conjugate update; it is not added
to the pooled within-team noise estimate. Scores are conditionally normal but their
marginal predictive distributions are Student-t, with heavier tails early in a season.
One strength and variance draw persists across all future weeks. The variance of a
future `h`-week average is `degrees * scale / (degrees - 2) * (1 / h + 1 / k)`;
uncertainty about strength does not disappear by independently redrawing it every week.
League hyperparameters are estimated from the same cutoff and their uncertainty is
not integrated. This is not a fully hierarchical Bayesian model. Player correlations
and future changes in latent strength remain unmodeled. See
[posterior predictive sampling](https://mc-stan.org/docs/stan-users-guide/posterior-prediction.html)
and [normal / inverse-chi-square conjugacy](https://web.stanford.edu/class/polisci203/lecturenotes.pdf).

For the latest cutoff in the active season, a covered team's best legal projected
lineup sets its expected score separately for every remaining regular-season and
configured playoff scoring week. Both providers retrieve weekly player projections;
each week is optimized independently from the roster ownership captured at this
cutoff. The shared trial strength deviation is centered on the corresponding week's
projection, preserving the existing persistent strength/variance uncertainty.
The previous arbitrary 50/50 blend has been removed: historical results can reflect
players no longer in the lineup.
This provider-centered choice has not yet been validated against archived pregame
projections. Historical score variability remains a proxy for projection error;
it is not a measured provider residual distribution. Each scoring week in a
multiweek playoff round uses that week's lineup mean. Projections are also loaded
at the regular-season boundary. Once postseason results exist, the retrospective
pre-playoff cutoff excludes newer snapshots. Legacy saved reports containing a
single-week snapshot continue to apply it only to that week.
Sleeper player stat projections use league scoring weights; ESPN uses weekly
`statSourceId=1` applied totals. The optimizer selects a legal highest-projected
lineup from starters and bench, excluding reserve/taxi players and confirmed
unavailable statuses for the next week. Later weeks use their own provider
estimates; a current Out designation is not treated as a season-long absence.
NFL bye weeks come from the season schedule (Sleeper) or published professional-team
bye metadata (ESPN). A known bye contributes zero, including when no projection
row exists; an eligible bench player replaces it when that improves the lineup.
Missing projection data is not assumed to mean zero. Reserve/taxi ownership remains
ineligible under the frozen roster scenario, and no hypothetical waiver additions
or future transactions are invented. Questionable/doubtful players retain provider estimates;
we do not invent a numerical injury probability or apply a second discount.
Assuming optimal starts is a scenario assumption, not a model of manager behavior.
Partial team-week coverage retains valid complete legal lineups and discloses
historical fallback for other teams/weeks. The outlook includes an expandable weekly
coverage table. Older cutoffs and seasons never receive today's projections or injuries.
Weekly means, selected player IDs and season-specific bracket settings are preserved
in shared reports; they are captured data, not live data. See the
[weekly-lineup implementation review](weekly-lineup-review.md) for the current-league
comparison and the limits of historical accuracy checks.

The server also retains one immutable forecast archive per provider league, season
and completed regular-season week, created on the first report load with a usable
current-season projection. A unique database index and insert-only write prevent
repeat loads or concurrent requests from duplicating or revising that observation.
The archive contains the capture time, model version, season-specific playoff rules,
completed scores, future schedule, roster ownership and slots, available injury and
bye context for owned players, all remaining weekly lineup means and selected player
IDs, and the resulting playoff/championship probabilities. It stores no public report
link or provider credentials and has no automatic expiry. Archived observations are
for future prospective validation; capture time must be compared with game kickoff
before treating one as a pregame forecast. Seasons and weeks without a usable
provider-informed forecast are not backfilled from later projections.

Complete published regular-season pairings are used where available. Missing or
malformed weeks use neutral random pairings, with coverage shown in the UI.
Sleeper supplies weekly matchup IDs; ESPN supplies one-week regular-season schedule
entries. Schedule identities contain no future scores. Completed wins and ties (half a win),
points scored/against and head-to-head records are retained. Simulated games update
the same quantities before playoff qualification is evaluated.

Playoff settings are retrieved separately for every requested season. Historical
division assignments are never replaced by current-season membership. Division
winners receive the top seeds; remaining spots go to the best remaining overall
records. ESPN uses the season's configured head-to-head-first or points-first
tiebreaker sequence, followed by division record, points against and a coin flip.
Head-to-head applies only when the tied teams played each other equally often;
each seed is selected separately and the process restarts for the remaining teams.
Sleeper uses points for, then higher points against, then a coin flip.
See [ESPN seeding rules](https://support.espn.com/hc/en-us/articles/360036952471-Playoff-Seeding-How-Regular-Season-Standings-Tiebreakers-Work)
and [Sleeper qualification rules](https://support.sleeper.com/en/articles/2203518-how-do-playoff-teams-get-determined).

The model supports 2, 4, 6 and 8 entrants in a single-elimination bracket.
Six entrants give the top two seeds first-round byes. ESPN's published matchup
periods determine round lengths; Sleeper's season settings specify single-week
rounds, a two-week final, or all two-week rounds. The meanings of Sleeper's numeric
round/reseeding settings were checked against its published web client. Each
round sums all its simulated weekly scores. Reseeding pairs the highest remaining
seed against the lowest when enabled for that season. Current projections apply
only to their own scoring week, including the first week of a multiweek round.
Qualification and round advancement percentages use all trials as the denominator;
byes count as advancement. Title probabilities sum to 100% before rounding. The
maximum approximate 95% Monte Carlo sampling margin per estimate is
`1.96 * sqrt(0.25 / trials)`, about 0.69 percentage points at 20,000 trials;
this is not a simultaneous confidence band or a measure of real-world accuracy.
Unsupported or missing provider tiebreakers, incomplete divisions, edited ESPN
playoffs, median-game formats and unsupported round calendars produce an explicit
unavailable reason rather than substituting default rules. Future commissioner
overrides, injury recovery dates and future roster changes are not modeled.
Older saved reports without season-rule metadata retain a labeled legacy scenario.
Postseason reports label these as retrospective pre-playoff
forecasts and exclude actual postseason scores. Missing settings produce an
unavailable explanation. Forecasts do not change the exported ranking image.

### Forecast validation

The accuracy panel uses rolling-origin evaluation: week 3 is predicted from weeks
1–2, week 4 from weeks 1–3, and so on, ending at the selected cutoff. Only actual
earlier scores fit each distribution. Current projections, injuries and target-week
results never enter that fit. Each paired non-tied game contributes once. Ties
are counted separately and excluded from binary win diagnostics; malformed pairs
and duplicate observations are excluded. The difference of two Student-t scores
is not treated as normal. Win probability integrates the conditional normal CDF
over posterior variances using 4,096 paired deterministic variance draws, symmetrized
for team order (8,192 conditional evaluations). Mean uncertainty is integrated in
each conditional variance. This diagnostic has numerical Monte Carlo approximation
error; it is separate from the 20,000 playoff trials. Legacy normal benchmarks retain
the analytic normal CDF.

Brier score is mean `(p - outcome)^2`; log loss is mean negative log probability
of the winner, clipping probabilities to `[0.000001, 0.999999]` for numerical stability.
Lower is better. The 50/50 reference is 0.25 Brier and ln(2) log loss. Reliability
bins show mean predicted favorite chance, actual favorite win rate, and game count.
These diagnose the historical scoring component, **not** the complete playoff model.
Small within-league samples cannot establish calibration or generalization.

`node --experimental-strip-types scripts/benchmark-forecast.mjs 1312529175982129152`
repeats a public score-only comparison against the old variance model. It reads
completed regular seasons from up to four linked Sleeper league records without
credentials and prints aggregate metrics. The following frozen results describe the earlier normal model on September 15, 2026;
they are not the joint posterior model's validation results:

| Season | Games | Old Brier | Revised Brier | Old log loss | Revised log loss |
| ------ | ----: | --------: | ------------: | -----------: | ---------------: |
| 2023   |    60 |   0.26583 |       0.26343 |      0.72808 |          0.72224 |
| 2024   |    60 |   0.25503 |       0.25381 |      0.70479 |          0.70188 |
| 2025   |    60 |   0.23924 |       0.23911 |      0.67029 |          0.67029 |

The improvement is small, and the revised model still trails the 50/50 baseline
overall (Brier 0.25212). These are three related seasons of one league, not an
independent multi-league test set. No coefficients were tuned to this benchmark.
Historical scores alone are a weak predictor here. A stronger accuracy claim needs
timestamped pregame projection/availability archives, projection-error distributions,
independent leagues and multi-horizon playoff calibration. Live or revised historical
provider projections must not be treated as immutable pregame forecasts.

Method references: [rolling-origin evaluation](https://otexts.com/fpp3/tscv.html),
[proper scores and reliability diagrams](https://scikit-learn.org/stable/modules/calibration.html),
and [Sleeper matchup/player data](https://docs.sleeper.com/).
The [nflverse availability schedule](https://nflreadr.nflverse.com/articles/nflverse_data_schedule.html)
reports its former injury feed unavailable after 2024, so it is not used as live
injury coverage. No paid feed is configured. A potential future source is
[SportsDataIO's updated weekly projections and injuries](https://sportsdata.io/developers/workflow-guide/nfl);
its legacy preseason season-long projections should not be mistaken for current
rest-of-season projections.

### Season-level playoff calibration

The live playoff report includes an on-demand backtest of up to five available
seasons before the selected year. Existing access-scoped league discovery and
report APIs provide each season's own teams, regular-season schedule, playoff
settings and actual bracket entrants. Unsupported formats, incomplete or duplicate
regular-season histories, broken opponent pairs, missing qualification outcomes,
and entrant counts inconsistent with settings exclude the whole season. Failed
loads and exclusions are disclosed. No model-derived seed is used as ground truth.

Each accepted season runs the current 20,000-trial forecast at every completed
regular-season cutoff. Future actual scores never fit an earlier forecast, and
provider projection snapshots are explicitly removed at every cutoff. This tests
the current historical scoring methodology, not an archived version of the model
or provider projections, optimal-lineup assumptions or injury prediction.

For each cutoff, predictions are pooled across team-season outcomes. Brier score
is mean squared probability error; log loss uses probabilities clipped to
[0.000001, 0.999999]. The equal-chance baseline assigns each team its season's
playoff-team count divided by league size. Classification accuracy uses a 50% threshold and is
secondary to probability scoring, particularly for unequal qualification rates.
The convergence chart plots model, standings-benchmark and equal-chance Brier
scores without smoothing or forcing improvement. Final cutoffs are excluded
from the chart, weekly reliability selection and predictive season summaries;
they appear in a separate seeding-rules check. Counts disclose which seasons contribute at each week;
different regular-season lengths can change late-week coverage. The final week
has all regular-season results and primarily checks seeding-rule agreement; it
is not evidence of successful future prediction.

A selectable cutoff's ten reliability bins compare average predicted probability
with the fraction actually qualifying. Bins are left-inclusive/right-exclusive,
except the last includes 100%. Each team-season appears once per cutoff, rather
than repeatedly across all weeks. Outcomes within a season and observations of
the same team across cutoffs are dependent; these are descriptive diagnostics,
not independent-trial confidence bounds or proof of calibrated 99% estimates.
Improvement need not be monotonic. Rules differences can produce final-week
errors and should be investigated rather than overwritten. Saved snapshots
exclude this separately loaded history and point readers to the live report.

After a historical backtest completes with evaluable outcomes, **Export calibration
JSON** downloads a versioned review artifact. Attach that file to a conversation
for analysis. It contains full-precision team-week predictions and qualification
outcomes, weekly scores and reliability bins, run metadata, requested/evaluated
seasons and exclusion notes. Successful seasons include only the team IDs,
regular-season actual scores/opponents, schedule pairings, settings and playoff
outcomes needed to replay alternative models. Manager identities, roster/player
details, transactions and provider projections are omitted. All cutoffs are
exported regardless of the displayed reliability week or table sorting.

Each observation identifies remaining regular-season weeks and whether all
regular-season game results are known. The separate `predictiveWeeklyMetrics`
section excludes those final known-outcome cutoffs so model comparisons do not
claim predictive improvements from trivially settled outcomes. Probabilities use
fractions in [0, 1]; JSON preserves their original precision. The model descriptor
identifies the current score-distribution assumptions and 20,000 trials per cutoff.

The standings benchmark reuses the same 20,000-trial simulator, cutoff wins,
points and remaining schedule, assigning every team an identical league-average
future score mean and identical pooled within-team standard deviation. The
variance is `pooledVariance * (1 + 1 / (n + 3))`, with independent normal draws.
This deliberately simple comparator is retained unchanged across the model revision. With one
week, cross-team variance supplies the documented fallback. Only scores through
the cutoff fit these distributions; current projections and future actual scores
are excluded. It measures the value of estimated team strength beyond banked
results. It does not assume that all teams started the season with equal records.
Compare against this benchmark explicitly: more complete uncertainty alone does not
guarantee better playoff probability scores.

Per-season comparisons average team-week probability errors over predictive
cutoffs, excluding each season's own final regular-season week. Counts distinguish
unique teams from repeated team-week forecasts. Brier skill against standings is
`1 - model Brier / standings Brier`: positive means improvement, negative means
worse, and zero-error or unavailable benchmarks produce an unavailable value.
No confidence interval is claimed from these dependent observations. Compare
future methodology changes chronologically on later seasons or additional leagues
rather than tuning repeatedly against this same league sample.

Calibration JSON schema version 4 retains all version-1 observation information,
adds full-precision `standingsProbability` and `regularSeasonEnd`, and exports
comparative weekly metrics, `seasonMetrics` and `finalWeekRulesChecks`. The
`predictiveWeeklyMetrics` section excludes each season's final cutoff even when
season lengths differ. The export describes the standings benchmark and skill
formula. Version 3 also preserves each season's provider, ordered tiebreakers,
division assignments, division qualification, playoff scoring weeks and reseeding.
Version 4 changes the model descriptor to `historical-score-joint-posterior-v3`,
including the posterior update, persistent parameter draws and empirical-Bayes
limitations. Earlier exports without rule metadata cannot reproduce the corrected
season-specific seeding without retrieving it.

The [two-league uncertainty review](playoff-uncertainty-review.md) compares the joint
posterior against its frozen normal predecessor on the same corrected rules. Run
`node scripts/review-playoff-calibration.mjs <ESPN-schema-3-or-newer.json> <Sleeper-schema-3-or-newer.json> --output-dir <directory>`
to reproduce full-precision playoff metrics, early reliability, chronological groups,
per-season sensitivity, one/four-week score interval coverage and interval scores,
plus new schema-4 exports. It reads local artifacts and makes no provider requests.

## Roster and remaining schedule strength

The Season Insights strength section uses the report's selected league, season,
completed-week cutoff, and refresh timestamp. Switching either league or season
removes the prior report while the new one loads. Managed-team highlighting is
private UI state; it is not included in public report snapshots.

### Positional strength

For each remaining regular-season and configured playoff scoring week, optimize
one complete legal lineup using that week's native league-provider projections
and the captured current roster. Sleeper applies league scoring weights; ESPN
uses that league's applied projected points. These season-report forecasts are
native provider estimates, not the combined current-week trade/player estimates.
Bench players compete for starts, while IR/reserve/taxi slots are excluded. A
FLEX or SUPER_FLEX starter contributes to their primary position exactly once.
DST is displayed as DEF, and supported IDP/custom positions receive their own
columns. Unsupported or incomplete lineups do not receive invented totals.

Sum the selected players' projected points by primary position, then sum each
position across the displayed weeks. This measures projected starting-lineup
contribution, not full bench depth or standalone market value. Depth only helps
when a replacement enters the optimized lineup. Known NFL byes are valid zeroes;
confirmed unavailable players are excluded for the current week only. Future
injury recovery is not inferred from today's absence. Availability and projection
coverage limitations remain the same as the weekly forecast inputs.

A remaining week is displayed when at least one team has a valid optimized
positional breakdown. Weeks with no usable breakdown for any team are excluded
and listed in a coverage notice; totals then cover only the available weeks,
not the full remaining season. A team is ranked only with valid positional
contributions over every displayed week. Each weekly position sum must reconcile
with its optimized team total.
Missing breakdowns, duplicate forecast weeks, and snapshots whose first week
is not the completed cutoff plus one are unavailable. Competition ranks use
points rounded to two decimals: equal values share rank 1, for example, and the
next value has rank 3 when two teams tie. Rank 1 means the strongest contribution.
Absent positions in a complete lineup contribute a genuine zero; incomplete
lineups are unavailable. Negative projected points retain their sign in a
separate negative bar stack and in exact values.

Historical and completed seasons do not substitute current projections. A saved
report preserves its captured positional inputs if present; older snapshots
without those inputs remain unavailable. Refresh an active-season report to
load the new breakdown. All teams share the same available weeks, including
projected playoff weeks regardless of whether that team will qualify.

The **Completed weeks only** toggle instead sums the actual points of the starters
each manager fielded, using completed team-week box scores through the report
cutoff. The displayed horizon runs from the provider's configured reporting start
through that cutoff, allowing leagues that started later. Reports and snapshots
retain that start; it is never inferred from the first observed score. A missing
opening or later week makes the affected team unavailable. Legacy reports with an
unknown start remain unranked until refreshed and show coverage assuming week 1.
Future and unfinished weeks,
bench scores, best-possible lineups, and projections never enter these totals.
FLEX and SUPER_FLEX starters count once under their primary position; DST displays
as DEF. Commissioner adjustments to team totals are not allocated to positions.

Starter positions are captured in the report: ESPN uses each weekly box score's
primary position and Sleeper uses its player catalog. Historical rankings do not
require current roster ownership. Saved reports preserve starter positions;
older reports without that metadata need a refresh. A duplicate player or
team-week, missing starter score or position, or explicitly unavailable lineup
makes that week unavailable. A provider-confirmed empty lineup contributes zero.
The same full-horizon coverage rule, two-decimal competition ranks and signed
bars apply to actual scoring. Switching the toggle updates both views together
and leaves remaining schedule difficulty unchanged.

### Remaining fantasy schedule difficulty

The default horizon is every regular-season scoring week after the completed
cutoff. Published fantasy league opponents determine difficulty; NFL opponents
of individual players and unknown future playoff opponents are not used. ESPN's
published matchup-period mappings expand multiweek matchups into their constituent
scoring weeks. A valid uniform period length can provide the mapping when an
explicit mapping is absent. Unknown or overlapping calendars remain unavailable.
This separate calendar does not enable unsupported formats in the playoff simulator.

For week `w`, use every team's best legal projected lineup when the entire league
has valid weekly projections. Otherwise, use every team's average actual score
from observed completed regular-season weeks through the report cutoff. The
whole week switches basis together, so a projected opponent is not compared
with a partly historical league baseline. Missing historical data for any team
makes that week's baseline unavailable. The opponent table labels this fallback;
it is a simple scoring-average estimate, not an injury-adjusted forecast.

`baseline(w) = mean(expected score of every league team in week w)`

`difference(team, w) = expected score of its opponent - baseline(w)`

`difficulty(team) = mean(difference(team, w) across remaining opponent weeks)`

Units are fantasy points per scoring week. Negative is easier, positive is
harder, and zero is league-average opposition. Repeated opponents count each
time. Every uncompleted scoring week of a multiweek matchup counts once; this
is average weekly difficulty, not a count of matchup wins. Explicit published
byes contribute no opponent and are excluded from the denominator, allowing
teams with different remaining game counts to be compared. An absent fixture
is unknown rather than a bye. Conflicting fixtures, unknown team identities,
and missing opponent/baseline estimates leave the affected team unranked.

Schedule competition ranks use the rounded difficulty score, with rank 1 easiest
and skipped ranks after ties. Completed regular seasons display an explicit
no-remaining-matchups state. The section exposes opponent coverage, unknown
weeks, fallback-week counts, and exact expected points and baselines for every
remaining week. Historical fallback never reads scores after the cutoff, and
future projections are excluded when their snapshot cutoff is inconsistent.
