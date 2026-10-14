# Playoff forecasts, trends, and model evaluation: preservation contracts

Read only when this area or a shared dependency is affected. Start at the [feature index](../feature-preservation.md). Any reduction requires explicit user approval recorded in the [approval log](approved-changes.md) before implementation.

## Important constraints

- **Optimize legal lineups from starters AND bench.** The user explicitly asks that projections not simply use the current starting lineup, so bye weeks and replacements are considered. Preserve legal slot eligibility, availability/locks, actual versus projected semantics, historical best-lineup scores, missed points, and weighted sit/start accuracy (TASK-49–TASK-52, TASK-80, TASK-91, TASK-134).
- **Preserve forecast depth and honesty.** Keep playoff/round/title odds, the dedicated tab, weekly trend view, playoff/championship toggles, quick cached switching, point animation with reduced-motion support, calibration and replay exports. Use only data available at the selected cutoff; keep early-season uncertainty and unsupported-format explanations (TASK-34, TASK-36–TASK-42, TASK-55–TASK-57, TASK-69, TASK-73–TASK-81).

## Related areas and verification

Also read season-insights for score/lineup inputs, decision-support for live projection/ownership inputs, sharing for snapshots, and navigation-and-performance for worker/cache changes. Area names refer to files linked in the index; follow only relevant dependencies.

Useful references/checks (starting points, not a substitute for inspecting affected code):

- [calculations.md](../calculations.md)
- [playoff-uncertainty-review.md](../playoff-uncertainty-review.md)
- [playoff-forecast.test.ts](../../src/playoff-forecast.test.ts)
- [playoff-calibration.test.ts](../../src/playoff-calibration.test.ts)
- [playoff-calibration-export.test.ts](../../src/playoff-calibration-export.test.ts)

## Feature contracts

Stable IDs trace to the original backlog. Criteria are requirements, not evidence that today’s code or deployment was tested. Load source requests/history only to resolve a specific detail. Later completed corrections refine earlier implementation details.

### TASK-34 — Use Markov chains or other statistics methods to project who will make playoffs

- Keep cutoff-controlled reproducible Monte Carlo playoff qualification, round-advancement and championship probabilities in private/shared reports.
- Keep configured bracket/byes support, explicit unsupported rules/history/settings states and retrospective disclosures. Later TASK-36/TASK-55/TASK-77 refine tab placement, schedules and season-specific rules.

Source: [TASK-34](../../backlog/tasks/task-34%20-%20Use-Markov-chains-or-other-statistics-methods-to-project-who-will-make-playoffs.md).

### TASK-36 — Move playoff simulation into its own tab

- A clearly labeled Playoff simulation tab presents the existing forecast and controls.
- Season statistics no longer embed the forecast; league and season context and shared access remain available.

Source: [TASK-36](../../backlog/tasks/task-36%20-%20Move-playoff-simulation-into-its-own-tab.md).

### TASK-37 — Include projections for simulations

- Simulations can use provider player projections scored with league settings and current roster/lineup context for Sleeper and ESPN.
- Missing projections degrade visibly to the existing historical model; past cutoff simulations never use future projections.
- Deterministic fixtures verify scoring, projection coverage, provider failures and forecast behavior; setup and limitations are documented.

Source: [TASK-37](../../backlog/tasks/task-37%20-%20Include-projections-for-simulations.md).

### TASK-41 — Use the league's settings in the playoff simulation

- Provider-derived regular-season and playoff-team settings reach report data.
- Playoff simulation uses the configured team count and regular-season cutoff.
- Forecast behavior remains safe when provider settings are unavailable.

Source: [TASK-41](../../backlog/tasks/task-41%20-%20Use-the-leagues-settings-in-the-playoff-simulation.md).

### TASK-42 — Allow simulations for playoffs starting in week 1 but add disclaimer about inaccuracy

- A forecast can run with one or two complete paired scoring weeks per team instead of requiring three.
- Early-season forecasts continue to use complete current-week provider projections when available and retain conservative league-average shrinkage.
- Forecasts through week 1 or 2 display a prominent disclaimer that the small-sample estimate is especially uncertain.

Source: [TASK-42](../../backlog/tasks/task-42%20-%20Allow-simulations-for-playoffs-starting-in-week-1-but-add-disclaimer-about-inaccuracy.md).

### TASK-49 — Ensure projections for playoffs include players on the bench

- Calculate the highest-total legal projected lineup from current starters AND bench, respecting provider slots and eligibility; do not simply use the submitted lineup.
- Use league scoring for Sleeper and provider applied totals/eligibility for ESPN. Allow eligible bench replacements for unprojected or bye starters.
- Withhold incomplete legal team projections, disclose historical-scoring fallback, and show optimized-lineup coverage and bench selections. TASK-80 extends this to remaining weeks.

Source: [TASK-49](../../backlog/tasks/task-49%20-%20Ensure-projections-for-playoffs-include-players-on-the-bench.md).

### TASK-55 — Use real schedules and player availability in playoff forecasts

- Known regular-season matchups drive simulations, with missing or unsupported formats disclosed.
- Current projected lineups exclude confirmed unavailable players and use legal bench replacements; missing teams do not discard valid projections for other teams.
- Forecast inputs and availability coverage survive shared report snapshots.
- Provider and simulator tests cover schedules, unavailable players and retrospective isolation; docs describe the data limits.

Source: [TASK-55](../../backlog/tasks/task-55%20-%20Use-real-schedules-and-player-availability-in-playoff-forecasts.md).

### TASK-56 — Measure and improve playoff forecast uncertainty and accuracy

- Forecast distributions account for limited samples and report their assumptions and simulation uncertainty.
- Time-ordered historical evaluation uses only earlier results and reports Brier score, log loss and reliability counts against an equal-chance baseline.
- Projection and injury effects remain explicitly limited to data actually available at the forecast cutoff.
- Tests establish no leakage, numerical behavior and readable accuracy diagnostics; research and limitations are documented.

Source: [TASK-56](../../backlog/tasks/task-56%20-%20Measure-and-improve-playoff-forecast-uncertainty-and-accuracy.md).

### TASK-57 — Load next-week projections at the first playoff-round boundary

- ESPN and Sleeper request active next-week projections at the first playoff-round boundary.
- Historical seasons, older cutoffs and later postseason snapshots do not leak into the pre-playoff forecast.
- Regression tests cover the boundary and changes are documented.

Source: [TASK-57](../../backlog/tasks/task-57%20-%20Load-next-week-projections-at-the-first-playoff-round-boundary.md).

### TASK-69 — Add a toggle to the playoff simulation screen that changes to histogram mode

- Keep the weekly playoff trend view (originally requested as histogram mode), with one team line and exact-value table.
- Toggle between playoff and championship probability; run each completed regular-season week at its own cutoff without future-data leakage.
- Cache results between view/metric toggles for quick switching. Animate points from the x axis, respecting reduced motion and mobile usability.

Source: [TASK-69](../../backlog/tasks/task-69%20-%20Add-a-toggle-to-the-playoff-simulation-screen-that-changes-to-histogram-mode.md).

### TASK-73 — Add historical season-level playoff calibration and convergence chart

- Previous completed seasons are replayed at weekly cutoffs without future scores or current projections entering predictions.
- Weekly Brier score, log loss, qualification accuracy and equal-chance baseline are displayed with a convergence graph and cutoff-specific reliability bins.
- Missing outcomes and incomplete seasons are disclosed; sample counts and tests prevent unsupported accuracy claims.

Source: [TASK-73](../../backlog/tasks/task-73%20-%20Add-historical-season-level-playoff-calibration-and-convergence-chart.md).

### TASK-74 — Export playoff calibration data for model review

- A JSON download includes unrounded team-week predictions, outcomes, weekly metrics, run context and coverage notes.
- Successful seasons include minimal historical score, schedule and playoff-setting inputs sufficient to replay alternative models, without credentials or roster details.
- Export is unavailable until a backtest completes with evaluable outcomes; unit and browser checks verify the downloaded file.

Source: [TASK-74](../../backlog/tasks/task-74%20-%20Export-playoff-calibration-data-for-model-review.md).

### TASK-75 — Compare playoff forecasts with standings and separate predictive diagnostics

- A deterministic standings benchmark preserves cutoff records, points and remaining schedule while assigning equal future scoring strength.
- Predictive convergence and per-season comparisons exclude final known-outcome cutoffs; final seeding agreement remains separately visible.
- JSON exports include standings probabilities, comparative metrics and a versioned description; tests prove leakage safety, baseline behavior and readable desktop/mobile displays.

Source: [TASK-75](../../backlog/tasks/task-75%20-%20Compare-playoff-forecasts-with-standings-and-separate-predictive-diagnostics.md).

### TASK-76 — Fix ESPN historical playoff qualification loading

- ESPN historical loading retrieves championship bracket labels
- Regression coverage verifies prior-season qualifiers independently of manager identity

Source: [TASK-76](../../backlog/tasks/task-76%20-%20Fix-ESPN-historical-playoff-qualification-loading.md).

### TASK-77 — Apply season-specific playoff qualification and bracket rules

- Rules and team divisions are retrieved independently for every historical season and exported for replay
- Forecasts apply division qualification and provider tiebreakers, including head-to-head multi-team restart and unequal-meeting fallback
- Bracket simulations honor supported round lengths and reseeding; unknown formats produce an explicit unavailable reason
- ESPN league 1140768 historical final-cutoff qualifiers match actual entrants with regression coverage

Source: [TASK-77](../../backlog/tasks/task-77%20-%20Apply-season-specific-playoff-qualification-and-bracket-rules.md).

### TASK-78 — Evaluate playoff forecast uncertainty across both leagues

- Candidate models use only cutoff data and the same season-specific playoff rules in both leagues
- Evaluation compares Brier, log loss, early reliability and season-level results against current and standings baselines with explicit small-sample limits
- Any adopted forecast represents mean and variance uncertainty coherently and does not invent injury probabilities from score-only data
- Changes, assumptions, validation and replayable exports are documented and tested

Source: [TASK-78](../../backlog/tasks/task-78%20-%20Evaluate-playoff-forecast-uncertainty-across-both-leagues.md).

### TASK-79 — Compare My Fantasy Analyzer outlook with our Sleeper forecast

- Identify loaded scoring, variance, injury and playoff algorithms with source references
- Compare cutoff standings and team scoring inputs and quantify the injury sensitivity
- Document evidence, methodological limits and concrete validation requirements

Source: [TASK-79](../../backlog/tasks/task-79%20-%20Compare-My-Fantasy-Analyzer-outlook-with-our-Sleeper-forecast.md).

### TASK-80 — Use best legal projected lineups throughout remaining season simulations

- Sleeper and ESPN load and optimize remaining weekly projections using current roster ownership
- Regular-season and configured playoff matchup simulations use the corresponding week’s complete legal lineup; missing data falls back explicitly
- Current snapshots never leak into retrospective cutoffs or historical calibration, and coverage/assumptions are visible
- Meaningful provider, lineup, simulation and regression checks pass, with current-league before/after evidence and documented accuracy limitations

Source: [TASK-80](../../backlog/tasks/task-80%20-%20Use-best-legal-projected-lineups-throughout-remaining-season-simulations.md).

### TASK-81 — Archive one as-of playoff forecast per league week

- A unique league-season-cutoff key prevents duplicate archives from repeated or concurrent report loads.
- Archive contains weekly provider means and lineups, roster and availability context, season rules, completed scores, schedule, and forecast probabilities.
- Only eligible current-season forecasts are archived, and existing weeks are never overwritten.
- Focused tests verify eligibility, idempotency, and stored payload shape.

Source: [TASK-81](../../backlog/tasks/task-81%20-%20Archive-one-as-of-playoff-forecast-per-league-week.md).

### TASK-116 — Keep uncached playoff simulations from blocking interactive rendering

- Loading an uncached forecast or changing the cutoff shows a pending state and keeps navigation and controls responsive during simulation.
- Seeded results, projection coverage, model version and simulation counts remain equivalent to the existing forecast for identical inputs; existing cutoff caching remains effective.
- Results from canceled, replaced or unmounted report contexts cannot update the active league or season.
- Repeatable browser measurements with representative 12-team and 32-team fixtures demonstrate that simulation no longer creates long blocking main-thread work; regression tests verify result parity, cancellation and loading behavior.

Source: [TASK-116](../../backlog/tasks/task-116%20-%20Keep-uncached-playoff-simulations-from-blocking-interactive-rendering.md).
