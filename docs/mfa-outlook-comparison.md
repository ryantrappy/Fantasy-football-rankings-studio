# My Fantasy Analyzer outlook comparison

Inspected September 29, 2026, for Sleeper league `1312529175982129152`, manager
`ryantrappy`. The main observed difference is the expectation of future scoring:
our model carries forward relatively strong recent team performance, while My
Fantasy Analyzer (MFA) projects a substantially weaker remaining roster schedule.
Injury assumptions contribute, but the measured injury sensitivity is much smaller
than the roughly 50 percentage point playoff-probability gap.

## Evidence and controls

The [linked outlook](https://myfantasyanalyzer.com/results/outlook?leagues=1312529175982129152&user=ryantrappy)
displayed sixth place, approximately 6.8 expected wins, 26% playoff probability,
and 1% championship probability. I inspected its loaded modules and read the
public simulation payload at the browser worker dispatch. I also replayed our
current production functions against public Sleeper data, without accessing
private account credentials or changing either application's production model.

Both inputs start after week three: a 2–1 record, 427.88 points for, and 351.58
points against. Both simulate the known remaining opponents through week 14,
with four playoff qualifiers in this ten-team league. Median scoring is disabled;
reseeding is enabled. This rules out a different standings cutoff as the immediate
explanation. MFA's active source label is **MFA Baseline / nflverse**, rather than
the live Sleeper player projection feed used by our next-week forecast. Its
[data loader](https://myfantasyanalyzer.com/assets/index-BaHgAqYJ.js) reads the
precomputed `data/inseason-fallback/proj-2026-w*.json` files.

| Ryan scoring input                  | Our current model | MFA worker input, before new simulated injuries |
| ----------------------------------- | ----------------: | ----------------------------------------------: |
| Actual average through week three   |            142.63 |                          Same completed results |
| Expected week four points           |            135.51 |                                          125.11 |
| Average expected points, weeks 5–14 |            134.59 |                                          104.38 |
| Average expected points, weeks 4–14 |            134.67 |                                          106.26 |
| Rank by expected points, weeks 4–14 |           2 of 10 |                                         6 of 10 |

The relative ranking matters as much as the absolute point difference. Our
historical expectation of 134.59 is above the league's 126.55 average; MFA's 106.26
remaining-week average is below its own league forecast average of approximately
111.47. A uniform scoring-scale difference would not explain this ranking reversal.

Our score history is 121.24, 162.10, and 144.54. With three weeks of league-average
prior weight, the historical mean is
`(427.88 + 3 × 126.551333) / 6 = 134.589`. That mean is retained after week four;
the next-week legal best-lineup Sleeper projection supplies the 135.51 center for
week four alone. See [our forecast](../src/playoff-forecast.ts) and
[score model](../src/forecast-statistics.ts).

Public-data replay of our current functions, using 20,000 trials:

| Forecast variant                                        | Ryan playoff probability |
| ------------------------------------------------------- | -----------------------: |
| Current model, including week four Sleeper projection   |                   76.54% |
| Same model, historical scoring for every remaining week |                  73.965% |
| Equal-strength standings benchmark                      |                   53.95% |

The first value reproduces the user's 76.5%. The standings benchmark is a neutral
comparison, not a calibrated replacement forecast or a pure mean-only intervention.
At 10,000 trials, MFA's sampling error around 26% is approximately ±0.9 percentage
points at 95% confidence, conditional on its model. Trial counts cannot explain
this disagreement. Sampling precision is distinct from uncertainty about whether
the model is correct.

## Recovered algorithm

The [projection builder](https://myfantasyanalyzer.com/assets/projector-D3wro5Ne.js)
applies league scoring to weekly player statistics and optimizes a legal lineup
from each current roster. It handles flexible positions, bench replacements,
bye-week availability, and streaming floors. Team means are sums of selected
player projections. Team standard deviations are the square root of the sum of
selected player variances, which omits player score covariance.

The [season orchestrator](https://myfantasyanalyzer.com/assets/inseason-BO6WcJrq.js)
builds these inputs separately for each future week. Injury simulation uses
position base weekly hazards: QB 2.5%, RB 5.2%, WR 4.5%, TE 4.9%. It applies
player risk multipliers and current injury information. Removing a player and
reoptimizing the lineup estimates the weekly point loss, with bench and waiver
replacement assumptions. This is an explicit persistent roster-availability model.

The [simulation worker](https://myfantasyanalyzer.com/assets/simulator.worker-DBBCAXG_.js)
defaults to 10,000 trials. Each trial generates multiweek absences, subtracts their
weekly replacement gaps, and draws independent normal weekly team scores around
the resulting means, with negative totals clipped to zero. Injury durations have
40% one-week, 24% two-week, 26% three-to-six-week, and 10% remaining-season outcomes.
The worker banks completed records, simulates scheduled matchups, orders teams by
record then points for, selects the qualifiers, and simulates the configured
postseason bracket. Qualification and championship percentages are proportions
of all trials. Multiple absent players' precomputed loss gaps are added rather
than jointly reoptimizing their shared replacements inside the worker.

Our model instead samples uncertain team scoring mean and variance once per
season trial, then draws weekly scores conditionally on those parameters. This
creates persistent uncertainty about team strength; it does not identify which
player is injured or model the resulting lineup change. The two joint season
distributions can differ even when their single-week standard deviations look
similar. See the [existing uncertainty review](./playoff-uncertainty-review.md).

## Injury sensitivity measured in their UI

I changed only Ryan's injury-luck setting to **No injuries**, leaving opponents at
their default setting. Their 2,500-trial stress test displayed **33% playoff
probability**, a **+9.0 percentage point** paired change, and approximately 7.0
expected wins, a +0.4 change. I restored the setting afterward.

The main 26% table uses a separate 10,000-trial run. The stress test's paired
baseline is therefore approximately 24%; subtracting the rounded main table from
the stress result would incorrectly describe the paired effect as seven points.
This counterfactual disables Ryan's future stochastic injury events, while
retaining opponents' risks and any discounts already embedded in player
projections. It is not an all-league healthy-roster experiment.

The public [injury metadata](https://myfantasyanalyzer.com/data/player-injury-hazards.json)
describes a logistic model with 3,142 training rows and holdout target seasons
2023–2025. It reports Brier scores of 0.25003 for its baseline and 0.23492 for its
model, a 6.05% improvement. The loader identifies its probability as season-level
risk of missing two or more games. That is empirical evidence for a player risk
component, but does not independently validate its conversion into weekly hazards,
the duration distribution, replacement effects, or final playoff calibration.
The training pipeline and full validation records are not present in the loaded
browser files.

## Data and methodological limitations

- **Future forecast generation remains partly opaque.** The browser receives
  precomputed player forecasts. The weekly files contain availability and role
  metadata, but the complete offline model cannot be reconstructed from the
  frontend. For example, the loaded Stafford forecast declines from 16.80 points
  in week four to 11.02 in week 14. This is a real input difference, not evidence
  that the decline is well estimated.
- **Variance falls back to defaults in this snapshot.** The
  [variance estimator](https://myfantasyanalyzer.com/assets/sim-store-D0li-5UL.js)
  requires `stats.gp >= 1`. None of the downloaded historical entries in weeks
  [one](https://myfantasyanalyzer.com/data/inseason-fallback/stats-2026-w1.json),
  [two](https://myfantasyanalyzer.com/data/inseason-fallback/stats-2026-w2.json), or
  [three](https://myfantasyanalyzer.com/data/inseason-fallback/stats-2026-w3.json)
  has that field; the loader preserves their statistics unchanged. The estimator
  therefore uses the [configured position defaults](https://myfantasyanalyzer.com/assets/config-BjV8E6-D.js).
  Ryan's common 25.495-point team SD matches those defaults exactly. Our marginal
  predictive SD is 27.121 points. MFA's week-three statistics file also contains
  only 61 kicker/defense entries; its metadata publish stamp is September 22.
  This does not establish which recent information its offline forecast generator
  used, but limits what the exposed data can substantiate.
- **Projection-error variance deserves separate estimation.** The estimator
  combines within-player scoring variance with between-player mean dispersion.
  Differences between players' scoring levels are not automatically uncertainty
  around already player-specific forecasts. A more direct target is forecast
  residuals against projections archived before games, including correlation and
  uncertainty in persistent player strength.
- **The championship calendars differ.** MFA's captured rounds are 15–16 and
  17–18 for this four-team bracket; our season-specific normalization yields week
  15 followed by weeks 16–17 from the league's `playoff_round_type: 1`. This affects
  title forecasts, not the qualification gap. Other exact-tie rules also differ,
  although floating simulated scores make them uncommon here.

## Improvements supported by this comparison

1. Archive projections and roster availability as they existed at every weekly
   cutoff. Evaluate future roster means, byes, and replacement depth against the
   existing historical-only benchmark. The present calibration exports lack
   contemporaneous future player forecasts, so they cannot validate this extension.
2. Estimate weekly forecast residuals and persistent strength uncertainty from
   those archives. Retain uncertainty in season paths and check coverage of
   multiweek totals, not only single-week intervals.
3. Add an injury/availability process only with documented event definitions,
   exposure, recovery durations, and replacement behavior. Avoid charging for the
   same injury both in supplied projections and in a separate simulated deduction.
4. Compare qualification Brier score, log loss, reliability, and extreme-probability
   failures by cutoff week on both current validation leagues, using forward
   season holdouts. Cluster uncertainty by league-season; repeated team-week
   snapshots and opponents are dependent. Keep one league out of any tuning and
   add more leagues before claiming generalization.

The competitor forecast identifies a valuable roster-based modeling direction.
It is not a target probability to fit. The inspection supports testing whether
our historical strength estimate persists too long when future availability or
roles change; it does not establish whether 26% or 76.5% is the better forecast.

## Verification

Verified the public worker inputs, current standings and schedule, the injury
stress-test result and reset, and a replay of our current forecast functions.
Inspected the loaded source and public data without executing downloaded bundles
outside the site's browser session. This change adds research documentation only;
no production behavior changed and no new application test suite was required.
