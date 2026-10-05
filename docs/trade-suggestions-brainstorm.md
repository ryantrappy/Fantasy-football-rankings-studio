# Trade suggestions brainstorm

Exploration recorded on 2026-10-05 for TASK-110, using the subagent requested by
the user. These are design options, not an approved implementation plan. Recheck
the code and provider capabilities when the task starts.

## Product idea

Recommend a short list of concrete exchanges for the user's saved managed team
in the currently selected league and season. Each offer should address that
team's needs and explain why the counterpart might consider it. Start with
player-only one-for-one offers that improve both teams' usable lineups.

The two positional-strength charts planned in TASK-108 can help identify needs.
TASK-109's remaining fantasy schedule measure can eventually help explain timing
and playoff implications. Neither needs to block the initial discovery feature.

## Existing foundations and limits

- TASK-89 provides private managed-team selection per league and season, with
  validation when provider team identity changes.
- TASK-93 and [the trade evaluator](../src/trade-analysis.ts) compare both teams'
  best legal lineups before and after an exchange, using the existing lineup
  advisor. Positional coverage currently measures roster counts, not depth quality.
- TASK-99 supplies comparable ESPN/Sleeper current-week projections scored with
  league settings, native fallbacks, and source disagreement. Disagreement is
  not a calibrated confidence interval.
- TASK-80 and [remaining-week projection utilities](../src/server/insights/projections.ts)
  support weekly lineup optimization, byes, and frozen current ownership for
  season simulations. These inputs are not exposed in the trade snapshot yet.
- [The trade page](../src/components/TradeAnalyzerPage.tsx) selects its own league
  and defaults to the first two teams. Suggested trades need the selected league,
  season, and managed-team context instead.
- The current evaluator is a current-week hypothetical comparison. Clearing
  game locks for that comparison does not establish transaction eligibility.
  The live league snapshot lacks trade deadlines, review delays, roster caps,
  and provider trade eligibility rules.

## Suggested first version

1. Resolve the selected owned league, season, and validated managed team. Offer
   team selection when missing, and clear recommendations on selection changes.
2. Capture one roster/projection snapshot for the league. Enumerate supported
   active-roster one-for-one exchanges with every other team.
3. Measure needs and surplus through each player's marginal contribution to a
   legal lineup. A large positional roster count alone does not establish surplus.
4. Compare both sides under identical scoring, lineup slots, horizon, and data.
   Put exchanges with positive useful-lineup gains for both teams in the main list.
   Incomplete projections or legal lineups make a proposal unrankable, not cheap.
5. Show about three to five distinct offers, both teams' gains, changed starting
   slots, and a roster-grounded explanation. An empty result is a valid outcome.
6. Open an offer as an editable scenario in the existing analyzer. Discovery and
   inspection remain read-only; no offers or manager messages are sent.

A current-week screen can reuse the existing evaluator, but trades affect the
remaining season. Clearly label any weekly screen and avoid representing it as
season-long trade value. Wiring remaining-week projections is the stronger
eventual product.

## Candidate generation and ranking options

Precompute baseline legal lineups and each player's removal cost. Evaluate
one-for-one pairs without reloading provider data per candidate. Complementary
positional needs can order results, but should not exclude useful FLEX or
SUPER_FLEX exchanges.

Deduplicate exchanges and discard dominated offers: an alternative provides at
least as much improvement to both teams with no worse coverage or roster
consequences. Expose user gain, counterpart gain, projection completeness, source
sensitivity, and positional improvement rather than inventing an opaque fairness
score. Any minimum gain threshold needs validation.

Where comparable source projections are available, inspect whether both teams'
benefits survive evaluation with each source separately. Flag source-sensitive
offers. Cache by account, league, season, team, roster snapshot, projection
snapshot, horizon, and user constraints; refresh when ownership changes.

## Counterpart incentives and pitfalls

Two-sided lineup improvement gives a reason to consider an offer, not a promise
of equal market value or acceptance. Managers may value ceiling, injury insurance,
keeper rights, or recovery potential differently. Say "Why they might consider
it" with a roster-based explanation; do not show an unsupported acceptance
probability.

A temporarily injured star must not become a cheap trade target merely because
this week's projection is zero. Until longer-term outlook or defensible valuation
data is available, exclude such cases from the main ranking or separate them for
manual review. Surplus requires useful replacement depth, including upcoming byes.

## Possible later stages

- User constraints such as untouchable players and target positions.
- Remaining-season weekly before/after optimization, with cumulative and average
  gains over the same covered weeks, bye deficits, and explicit projection
  coverage. Current injury status must not imply permanent future absence.
- Bounded two-for-two and two-for-one searches with explicit roster-space/drop
  requirements. Waiver replacements are separate assumptions; the verified
  waiver pool currently supports Sleeper, not ESPN free-agent availability.
- Schedule and playoff impact using paired simulations with the same snapshot
  and random draws, keeping hypothetical trades isolated from saved observations.
- Separately scoped dynasty/keeper values, picks, contracts, market values, and
  manager preference learning.

Use deterministic roster evaluation for the first version. An optional future
language model can explain measured results, but should not invent ownership,
projection values, eligibility, or trade partners.

## Verification to carry into implementation

Cover league switching, stale managed-team identity, ownership changes, FLEX and
SUPER_FLEX, missing forecasts, bye/availability gaps, one-sided offers, duplicate
offers, no qualifying results, and unchanged source inputs. Review proposal
quality with real league snapshots in addition to checking arithmetic.
