# Weekly legal-lineup forecast update

Implemented September 29, 2026. The active forecast now optimizes each remaining
regular-season and configured playoff scoring week using that week's provider
player projections and captured roster ownership. This changes expected scores;
the existing joint posterior scoring uncertainty is retained.

## Behavior

- Sleeper weekly player statistics are converted with the league scoring weights.
  ESPN weekly projected applied totals are selected by season, scoring week,
  projection source and weekly split. Legal position slots, including FLEX and
  Superflex, are filled without using a player twice.
- Each week can choose a different lineup from the same captured starters and
  bench. Known NFL byes contribute zero even when the provider omits that player
  from the week's projection response. Bench replacements are optimized; an
  unfilled productive position can remain a legal zero-point bye start when no
  replacement is owned. No hypothetical waiver pickups are added.
- Current confirmed injury statuses exclude players for the next week only.
  Later weeks use their own player forecasts. The model does not predict recovery
  dates, new injuries, transactions or reserve/taxi activation.
- A complete legal lineup is required before publishing a team-week mean.
  Missing projections, ranking-only rows and failed provider requests are not
  assumed to be zero. Only uncovered team-weeks fall back to historical scoring.
  The expandable coverage table shows these cases.
- Every week of a multiweek playoff round uses its corresponding mean. Saved
  reports retain weekly means, lineup player IDs and bracket rules. Legacy reports
  containing one projection week preserve their original behavior.
- Today's full projection collection is excluded from older cutoffs, historical
  calibration and the equal-strength standings benchmark.

For a covered team `i` and week `w`, the simulated mean is
`weeklyLineupMean[i,w] + sampledHistoricalMean[i] - posteriorHistoricalMean[i]`.
Its variance and shared season-strength deviation follow the existing score
model. Historical scoring variability remains a proxy for projection error;
this change does not claim those residuals have been calibrated.

## Current Sleeper comparison

League `1312529175982129152`, through week three, four qualifiers. Public player
projections covered all 100 starting slots in each of weeks 4–17: **140 of 140
team-weeks**. NFL bye metadata from Sleeper agrees with ESPN's professional-team
metadata for the inspected roster teams. Current-week data had refreshed since the
earlier inspection, so the comparison below gives both methods the same refreshed
week-four projections, completed results and remaining opponents. Both use 20,000
trials and the same score-uncertainty methodology.

| Ryan outcome                                 | Next-week projection, then historical means | Separate weekly lineups |
| -------------------------------------------- | ------------------------------------------: | ----------------------: |
| Playoff probability                          |                                      77.21% |                 61.925% |
| Reach championship final                     |                                     39.555% |                  27.89% |
| Win championship                             |                                     16.495% |                  12.15% |
| Average remaining regular-season expectation |                  Approximately 134.7 points |           130.97 points |
| Rank by remaining regular-season expectation |                                         2nd |                     4th |

The previous inspected snapshot gave 76.54% playoff probability. Its small
difference from the refreshed 77.21% is a data-refresh and simulation difference,
not the new weekly-lineup effect. Other teams' expectations also change:
`connorbenson05` rises to approximately 126.8 points per week, `klatrapp` to 133.5,
and `mikeigh` falls to 140.5. Qualification depends on this relative strength and
the remaining schedule, not only Ryan's average.

These are scenario changes, not evidence of better accuracy. The remaining gap
from My Fantasy Analyzer still includes different player forecasts and its
explicit injury process. This update does not fit our probabilities to theirs.

The review artifact is
`/Users/ryantrapp/Downloads/weekly-lineup-review/weekly-lineup-comparison-1312529175982129152-2026.json`.
It contains replay scores/schedule/settings, weekly means and selected players,
before/after probabilities and coverage. Its inputs are a snapshot from this
inspection, rather than a continuously updated feed.

ESPN uses the same collection/optimization/simulation path, with ownership held
to the current roster snapshot. Its private validation league rejected public
unauthenticated reads, so no live ESPN before/after number is claimed here. Provider
fixtures verify future weeks, bye replacements, frozen ownership and isolated
request failures. Actual provider projection coverage is disclosed in each report.

## Accuracy and leakage checks

Replaying both existing 2021–2025 calibration exports produces exactly the same
observations as before this change:

| Validation league             | Predictive team-week observations |         Brier score |
| ----------------------------- | --------------------------------: | ------------------: |
| ESPN `1140768`                |                               480 |    0.16004601346875 |
| Sleeper `1312529175982129152` |                               650 | 0.12380229683076924 |

That is expected: those artifacts contain historical team totals, without archived
future player projections and roster ownership as of each cutoff. They verify the
historical path is unchanged and that current information has not leaked into the
backtest. They cannot measure the accuracy of the new weekly-lineup path.

To evaluate improvement, preserve weekly cutoff snapshots before games and score
the eventual matchup and qualification outcomes. Compare this model with the
historical/next-week benchmark on the same cutoffs, use proper probability scores,
and evaluate both leagues with forward season holdouts. Do not reconstruct old
future lineups using eventual player scores, final-season rosters or projections
revised after the cutoff. Repeated weekly observations need uncertainty clustered
by league-season.

## Verification

Tests cover overlapping legal slots, no duplicate starters, known byes versus
missing data, future projections despite a current Out label, frozen ESPN ownership,
all configured scoring weeks, provider failure isolation, later-week qualification
effects, multiweek championship effects, retrospective exclusion and shared-report
preservation. The complete application suite passed 343 tests before the additional
coverage-panel regression; that regression and the snapshot tests then passed nine
tests, for 344 distinct passing tests. Production build/typecheck and lint passed.
The preview verifies expanded weekly coverage and exclusion at an older cutoff.
