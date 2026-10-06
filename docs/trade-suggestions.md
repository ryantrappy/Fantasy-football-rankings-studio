# Trade suggestions

The Trade analyzer discovers player-only one-for-one exchanges for the saved
managed team in the selected owned league and season. The route accepts
`leagueId` and `year`; without them it uses the remembered Ranking studio
selection when owned, then the first connected league. It never applies the
current roster to a different season. Only seasons present in the account's live
snapshot can be evaluated. Refresh reloads rosters and revalidates the saved team.

Missing, removed or manager-changed team selections require an explicit saved
choice. The team picker is fixed to the selected snapshot season. Unsaved choices
and failed saves cannot generate recommendations. Account, league, season,
snapshot and saved-team changes clear inspected scenarios. Delayed reads from a
previous scope cannot replace the new scope's recommendations.

## Evaluation and ranking

Both teams use the existing trade evaluator and best legal lineup optimizer,
including provider-specific eligible slots and FLEX/SUPER FLEX assignment. Points
are the snapshot's league-scored current-week projections, with available
ESPN/Sleeper combined estimates and native fallbacks. Other game locks are cleared
only for the hypothetical before/after comparison; traded assets themselves must
have known unlocked games, no bye and no flagged injury. Missing status is not
assumed healthy. Questionable/doubtful players are excluded from discovery.

For each counterpart, the algorithm screens incoming players against the team's
baseline lineup. A player that cannot improve the lineup even without giving
anything up cannot improve it after removing an outgoing asset. This upper bound
reduces unnecessary full exchange evaluations without excluding mutually
beneficial pairs. The final comparison exchanges both assets and requires
complete projections and legal starting lineups for both sides. Incomplete
counterpart teams are skipped with a coverage notice. Ambiguous ownership stops
discovery. Repeated matchup appearances are deduplicated by team identity.

The shared optimizer processes each player once and retains the best assignment
for each set of filled starting slots. It enforces unique players and all slot
eligibility constraints, including overlapping flex slots and negative-point
positions. This exact search avoids enumerating all bench-player combinations
when discovering offers across full league rosters.

Each surviving offer must improve both teams at the displayed two-decimal
precision. Offers are sorted by the smaller of the two lineup gains, then their
combined gain, with stable identity ordering for ties. The first five are shown.
This rewards usable lineup improvement and counterpart benefit, rather than the
sum of bench projections. It is not a market fairness score or acceptance estimate.
A no-suitable-trades result is valid, even when manual analysis could show a large
gain for one manager at the other's expense.

## Eligibility and limitations

Supported assets have an unambiguous active-roster owner, a provider player ID and
a supported NFL position. ESPN IDs are numeric; Sleeper also permits NFL defense
team IDs. Reserve/taxi players, picks, unsupported identities and missing
projections are not candidates. The roster snapshot may include former players;
these are excluded unless still marked owned. Positional coverage shows active
roster counts before and after; these are not depth-quality or injury-insurance
valuations.

Sleeper's reported `disable_trades`, `trade_deadline` and `trade_review_days`
settings are included when available. A valid deadline week is expired after
that week, or within it when the available NFL schedule reports all games
complete. Unknown or empty schedule data does not establish that the deadline
has passed. Sleeper documents the end-of-final-game cutoff in its
[trade deadline guidance](https://support.sleeper.com/en/articles/2435411-when-is-my-trade-deadline).
Unknown/sentinel deadline values are not interpreted as an enforced deadline.
Known disabled trading or an expired deadline stops recommendations. Review
periods are shown because provider processing may prevent immediate weekly use.

ESPN transaction restrictions, unreported deadlines, positional roster caps and
other provider eligibility/approval rules are not verified by this snapshot.
The screen discloses these gaps instead of claiming transaction validity. Before
acting, confirm provider rules and refresh stale ownership/projections.

The horizon is **the displayed week only**, not remaining-season trade value.
Future weeks, keeper rights, draft picks, acceptance probability, matchup/playoff
changes and replacement waiver pickups are not simulated. Healthy status at the
snapshot does not guarantee future availability. Source timestamps, projection
coverage, native fallback assumptions and both exchanged players' projection
inputs are available on the screen.

**Inspect trade** prefills the existing editable scenario and focuses its heading.
Discovery and inspection send no offers or messages and change no provider roster,
saved ranking or forecast observation. Saving the managed-team preference is a
separate action.

## Verification

Model tests cover symmetric benefits, one-sided offers, ranking/bounding,
duplicate appearances and ownership, missing/stale managed teams, supported
identities, unavailable assets/projections, provider eligible slots, FLEX/SUPER
FLEX, empty results, preserved snapshots and known trading restrictions. DOM
tests cover saved versus unsaved choices, failed saves, prefilled inspection,
requested/remembered owned scope, account/league/season changes, late responses
and refresh revalidation. Chrome checks exercise desktop and phone layouts,
inspection focus, source disclosure, team changes, season clearing,
accessibility and horizontal overflow.
