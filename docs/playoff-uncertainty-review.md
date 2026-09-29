# Playoff uncertainty review — September 29, 2026

The joint posterior corrects how uncertainty accumulates across future weeks.
It improves four-week score interval calibration in both supplied leagues, with
a modest playoff Brier improvement for ESPN and a small regression for Sleeper.
The evidence supports a more coherent uncertainty model; it does not establish
universal playoff accuracy improvement or calibrated 99% probabilities.

## Data and evaluation

The inputs are the corrected season-rule exports for ESPN **1140768** and Sleeper
**1312529175982129152**, each covering 2021–2025. ESPN has eight teams, four playoff
places and 12 predictive cutoffs per season; Sleeper has ten teams, four places and
13 predictive cutoffs. The 480 / 650 team-week playoff predictions are dependent:
qualification outcomes repeat across cutoffs and teams compete for fixed places.
There are only two league lineages and five seasons in each.

Every model uses the season's own divisions, tiebreakers, round lengths, reseeding
and remaining schedule. Each cutoff fits only earlier scores; current provider
projections are excluded. Qualification outcomes enter evaluation only. Final
regular-season cutoffs are rules checks and are excluded from predictive metrics.
The frozen normal predecessor and standings benchmark reproduce the supplied
schema-3 probabilities exactly. All 40 ESPN and 50 Sleeper final qualification
outcomes still agree with the corrected rules.

All these years were inspected during model review. The 2024–2025 grouping is a
chronological sensitivity check, **not an untouched holdout**. No p-value or
independent-observation confidence interval is inferred from the repeated forecasts.
Leave-one-season-out summaries describe sensitivity; they are not nested model
selection or estimates of future generalization. Prospective forecasts under this
fixed specification and additional independent leagues are the next useful tests.

## Adopted change

The previous model added mean-estimation uncertainty to each independent weekly
score draw. Its uncertainty about several weeks' average shrank as though those
mean errors were unrelated. It also treated the fitted score variance as known.

The revised model draws one team variance and one team strength per trial, then
uses them throughout the regular season and playoff rounds. Weekly draws are
conditionally normal; marginal scores follow Student-t distributions. Both the
prior mean precision and variance degrees stay at three. These are inherited
fixed assumptions rather than coefficients selected to maximize league backtests.
League means and pooled within-team variances are still cutoff-only empirical-Bayes
estimates; uncertainty in those league hyperparameters is not integrated.
The [calculation notes](calculations.md) give the complete conjugate update.
This follows [posterior predictive sampling](https://mc-stan.org/docs/stan-users-guide/posterior-prediction.html)
and [normal / inverse-chi-square conjugacy](https://web.stanford.edu/class/polisci203/lecturenotes.pdf).

The weekly game diagnostic also integrates the posterior variance mixture. It
no longer assumes that the difference between two Student-t scores is normal.
Its deterministic variance integration differed by at most 0.00082 in probability
from independent SciPy convolution quadrature across 48 checks (degrees 4, 5,
8 and 16, three variance ratios and four mean gaps). This is numerical verification
on those cases, not a universal error bound.
Current provider projections center only their own week; historical variability
and strength uncertainty remain an unvalidated proxy for projection errors.

## Playoff results

20,000 deterministic trials at every cutoff; lower Brier and log loss are better.

| League  | Previous Brier | Joint Brier | Standings Brier | Previous log loss | Joint log loss | Standings log loss |
| ------- | -------------: | ----------: | --------------: | ----------------: | -------------: | -----------------: |
| ESPN    |        0.16408 |     0.16005 |         0.15202 |           0.49164 |        0.47229 |            0.44620 |
| Sleeper |        0.12284 |     0.12380 |         0.13636 |           0.37822 |        0.38022 |            0.41360 |

ESPN Brier improves 2.46% relative to the predecessor; Sleeper worsens 0.78%.
The standings comparator still beats the joint model in ESPN overall. It remains
weaker than the joint model in Sleeper. This difference should remain visible in
the existing per-season calibration panels.

| League / period   | Previous Brier | Joint Brier | Previous log loss | Joint log loss |
| ----------------- | -------------: | ----------: | ----------------: | -------------: |
| ESPN weeks 1–3    |        0.23169 |     0.22282 |           0.67406 |        0.63790 |
| Sleeper weeks 1–3 |        0.17813 |     0.17906 |           0.53346 |        0.53214 |
| ESPN 2021–2023    |        0.17293 |     0.16907 |           0.52989 |        0.50503 |
| Sleeper 2021–2023 |        0.12126 |     0.12217 |           0.37778 |        0.37738 |
| ESPN 2024–2025    |        0.15080 |     0.14650 |           0.43426 |        0.42318 |
| Sleeper 2024–2025 |        0.12523 |     0.12625 |           0.37888 |        0.38448 |

| Season | ESPN previous / joint Brier | Sleeper previous / joint Brier |
| ------ | --------------------------: | -----------------------------: |
| 2021   |           0.12358 / 0.12188 |              0.16266 / 0.15980 |
| 2022   |           0.17990 / 0.17626 |              0.07355 / 0.07902 |
| 2023   |           0.21530 / 0.20908 |              0.12757 / 0.12768 |
| 2024   |           0.16606 / 0.15710 |              0.08083 / 0.08390 |
| 2025   |           0.13554 / 0.13591 |              0.16962 / 0.16860 |

The change improves four of five ESPN seasons and two of five Sleeper seasons.
Dropping any one ESPN season leaves an average Brier improvement of 0.00280–0.00513.
Sleeper's leave-one-season-out change ranges from a 0.00017 improvement to a
0.00191 regression. These small changes do not justify outcome-fitted league-specific
shrinkage or selecting different models for these two leagues.

Early ESPN forecasts at 90%+ decrease from ten to four team-week predictions;
the respective observed qualification fractions are 60% and 75%. Sleeper decreases
from five to three, both with 100% observed qualification. The populations in the
bins change, several observations repeat the same team, and counts are tiny.
Neither bin supports claims about the calibration of 99% probabilities. The JSON
review preserves all ten early reliability bins and their counts.

## Score interval checks

For each cutoff and team, evaluate the **next four weeks' average score** when four
regular-season weeks remain. Intervals use the analytic joint predictive distribution,
not simulated quantiles. The mean forecast is identical in the two models. There
are 360 ESPN and 500 Sleeper four-week forecasts, with overlapping targets and
repeated teams; the counts are not independent sample sizes.

| League  | Nominal interval | Previous coverage | Joint coverage | Previous interval score | Joint interval score |
| ------- | ---------------: | ----------------: | -------------: | ----------------------: | -------------------: |
| ESPN    |              80% |             68.9% |          78.6% |                   53.96 |                52.96 |
| Sleeper |              80% |             69.6% |          79.4% |                   55.78 |                54.77 |
| ESPN    |              95% |             85.8% |          93.3% |                   82.41 |                73.28 |
| Sleeper |              95% |             86.8% |          95.0% |                   81.73 |                79.04 |

Interval score is `width + 2 / alpha * distance outside the interval`, where
`alpha = 1 - nominalCoverage`; lower is better. It penalizes intervals widened
without useful reduction in misses. Both nominal levels improve on this metric
in both leagues across all four-week cutoffs. The four-week 80% mean interval
width increases from 29.46 to 36.96 points in ESPN and 32.17 to 39.72 in Sleeper.

The improvement is not uniform. Across one-week targets, 80% coverage becomes
80.6% in ESPN and 82.3% in Sleeper, but the interval scores slightly worsen.
Early 95% intervals are conservative: one-week coverage is 99.2% / 98.7%, and
four-week coverage is 95.8% / 98.0%. The early Sleeper four-week 95% interval
score worsens from 73.68 to 81.18 despite improved coverage. These tradeoffs are
reported rather than hidden by tuning priors on these outcomes.

## Other candidates considered

A short, theoretically motivated screening comparison used 5,000 trials per
cutoff. These are exploratory results with additional Monte Carlo error and
multiple candidate comparisons; none improved aggregate Brier in both leagues.

| Candidate                                         | ESPN Brier | Sleeper Brier |
| ------------------------------------------------- | ---------: | ------------: |
| Persistent mean uncertainty, old fixed variance   |    0.16065 |       0.12355 |
| Joint posterior, prior mean precision 3           |    0.16017 |       0.12380 |
| Joint posterior, prior mean precision 6           |    0.15736 |       0.12540 |
| Independent normal, prior mean precision 6        |    0.15996 |       0.12383 |
| Plug-in between-team variance shrinkage           |    0.15768 |       0.12773 |
| Cutoff-fitted changing latent strength            |    0.16412 |       0.12456 |
| 50/50 predecessor / standings probability average |    0.15523 |       0.12652 |

Stronger shrinkage and probability averaging improve ESPN at a cost to Sleeper.
The changing-strength experiment fitted process variation from prefix scores,
not playoff outcomes, but did not show a useful shared gain and did not integrate
process-parameter uncertainty. It is not part of production. The posterior with
precision 3 is adopted for its joint uncertainty correction and interval evidence,
with its playoff scoring tradeoff disclosed, not because it won a search over Brier.

## Injuries and interpretation

Historical team totals mix injuries, bye weeks, lineup choices, trades and ordinary
performance variation. They provide no injury event labels, occurrence probabilities,
recovery durations or player-level point impacts. Fitting an arbitrary shock rate
would attach false precision to a cause these exports cannot identify.

Heavier predictive tails and persistent uncertainty allow more sustained scoring
surprises than the predecessor. They are not a causal model of future injuries:
latent strength stays constant within each trial. Current confirmed absences are
already excluded from provider lineup projections. Questionable/doubtful estimates
remain with the provider. No second injury discount is added.

An injury-aware extension needs timestamped pregame rosters, player projections,
availability changes, replacement choices, and recovery/point-loss outcomes. It
must be tested on unseen seasons/leagues and avoid using retrospectively revised
projections as if they were available before the games. Statistical soundness here
means exposing these assumptions rather than declaring the injury risk solved.

## Reproduction

Run the following from the app repository with the two corrected exports:

```sh
node scripts/review-playoff-calibration.mjs \
  /Users/ryantrapp/Downloads/playoff-calibration-1140768-2026-season-rules.json \
  /Users/ryantrapp/Downloads/playoff-calibration-1312529175982129152-2026-season-rules.json \
  --output-dir /Users/ryantrapp/Downloads/playoff-uncertainty-review
```

The script uses the production simulator, a frozen predecessor fit, cutoff-only
inputs and each season's settings. It writes a detailed comparison and new schema-4
calibration exports, including precise model assumptions. It makes no network
requests. Production tests verify posterior moments and covariance, predictive
win probabilities, cutoff leakage, probability conservation and season rules.
