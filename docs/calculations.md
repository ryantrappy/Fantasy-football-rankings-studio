# Report calculations

Season Insights and League History expose **How are these numbers calculated?**
above the summary cards. The same guide appears in public shared reports.

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
bracket participation when all playoff entrants are identifiable. Regular-season
rank or seed is never substituted for a final placement. History weights known
finishes equally per season; league size can differ, so interpret raw average
placements alongside the selected seasons.

## Playoff scenario forecasts

The playoff tab offers 20,000 reproducible Monte Carlo trials using only scores
through the selected cutoff, capped at the end of the regular season. At least
one completed week and paired head-to-head results per team are required. Forecasts through weeks
1–2 carry a prominent small-sample warning because their probabilities can change sharply.
A team's expected score is blended with the league average using weight
`n / (n + 3)`. Three prior observations are a fixed regularization assumption, not
a fitted claim of optimality. Weekly variance is pooled **within** teams using
`sum(team squared residuals) / sum(n - 1)`, separating weekly noise from differences
in team strength. When no team has two observations, cross-team variation is the
fallback. Each team's variance is `(squared residuals + 3 * pooled variance) / (n - 1 + 3)`
with a one-point-squared floor, multiplied by `1 + 1 / (n + 3)` to allow for mean
estimation uncertainty. Independent normal score draws simulate future weeks.
Persistent strength uncertainty, score skew/tails and player correlations are not modeled.

For the latest cutoff in the active season, a covered team's next-week projection
sets that week's expected score directly. The previous arbitrary 50/50 blend has
been removed: historical results can reflect players no longer in the lineup.
This provider-centered choice has not yet been validated against archived pregame
projections. Historical score variability remains a proxy for projection error;
it is not a measured provider residual distribution. Later weeks use history only.
Sleeper player stat projections use league scoring weights; ESPN uses weekly
`statSourceId=1` applied totals. The optimizer selects a legal highest-projected
lineup from starters and bench, excluding reserve/taxi players and confirmed
unavailable statuses. Questionable/doubtful players retain provider estimates;
we do not invent a numerical injury probability or apply a second discount.
Assuming optimal starts is a scenario assumption, not a model of manager behavior.
Partial team coverage retains valid teams and discloses historical fallback for
others. Older cutoffs and seasons never receive today's projections or injuries.
The captured provider snapshot is preserved in shared reports; it is not live data.

Complete published regular-season pairings are used where available. Missing or
malformed weeks use neutral random pairings, with coverage shown in the UI.
Sleeper supplies weekly matchup IDs; ESPN supplies one-week regular-season schedule
entries. Schedule identities contain no future scores. Completed wins and ties (half a win) are retained;
seeding uses wins, points scored, then a random resolution of exact ties.

The model supports 2, 4, 6 and 8 entrants in a fixed single-elimination bracket.
Six entrants give the top two seeds first-round byes. All rounds last one week.
Qualification and round advancement percentages use all trials as the denominator;
byes count as advancement. Title probabilities sum to 100% before rounding. The
maximum approximate 95% Monte Carlo sampling margin per estimate is
`1.96 * sqrt(0.25 / trials)`, about 0.69 percentage points at 20,000 trials;
this is not a simultaneous confidence band or a measure of real-world accuracy.
The model does not replicate divisions, median games, reseeding, custom tiebreaks,
multiweek rounds, injury recovery dates or future roster changes.
Postseason reports label these as retrospective pre-playoff
forecasts and exclude actual postseason scores. Missing settings produce an
unavailable explanation. Forecasts do not change the exported ranking image.

### Forecast validation

The accuracy panel uses rolling-origin evaluation: week 3 is predicted from weeks
1–2, week 4 from weeks 1–3, and so on, ending at the selected cutoff. Only actual
earlier scores fit each distribution. Current projections, injuries and target-week
results never enter that fit. Each paired non-tied game contributes once. Ties
are counted separately and excluded from binary win diagnostics; malformed pairs
and duplicate observations are excluded. Win probability is the normal CDF of
`(mean A - mean B) / sqrt(variance A + variance B)`.

Brier score is mean `(p - outcome)^2`; log loss is mean negative log probability
of the winner, clipping probabilities to `[0.000001, 0.999999]` for numerical stability.
Lower is better. The 50/50 reference is 0.25 Brier and ln(2) log loss. Reliability
bins show mean predicted favorite chance, actual favorite win rate, and game count.
These diagnose the historical scoring component, **not** the complete playoff model.
Small within-league samples cannot establish calibration or generalization.

`node --experimental-strip-types scripts/benchmark-forecast.mjs 1312529175982129152`
repeats a public score-only comparison against the old variance model. It reads
completed regular seasons from up to four linked Sleeper league records without
credentials and prints aggregate metrics. On September 15, 2026:

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
