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

| Display | Calculation / denominator |
| --- | --- |
| Avg. points | Total observed points / observed weeks |
| Best week | Maximum observed points |
| Above median | Count of weeks strictly above the weekly league median / observed weeks |
| Avg. vs. median | Mean of `100 × (score − weekly median) / weekly median`; only positive-median weeks |
| Best week vs. median | Week with the highest relative median percentage, not necessarily the highest points |
| All-play win rate | `100 × (wins + half ties) / comparisons` against every other observed team each week |
| Difference / Avg. vs. projection | Actual minus projection; average only over weeks with projections |
| Beat projection | Strictly positive differences / projected weeks |

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
