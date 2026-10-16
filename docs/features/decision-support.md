# Live teams, players, and decision support: preservation contracts

Read only when this area or a shared dependency is affected. Start at the [feature index](../feature-preservation.md). Any reduction requires explicit user approval recorded in the [approval log](approved-changes.md) before implementation.

## Important constraints

- **Optimize legal lineups from starters AND bench.** The user explicitly asks that projections not simply use the current starting lineup, so bye weeks and replacements are considered. Preserve legal slot eligibility, availability/locks, actual versus projected semantics, historical best-lineup scores, missed points, and weighted sit/start accuracy (TASK-49–TASK-52, TASK-80, TASK-91, TASK-134).
- **Keep decision support inspectable.** Lineup, waiver, trade and player workflows must work without generated prose, disclose scoring/projection provenance, respect observed ownership, and remain read-only toward provider transactions. Writing suggestions are optional, configurable, cancellable and editable (TASK-13 and subtasks, TASK-90–TASK-95, TASK-99, TASK-110).

## Related areas and verification

Also read accounts-and-leagues for managed-team identity, playoffs for lineup/projection calculations, season-insights for observed scores, and navigation-and-performance for cache changes. Area names refer to files linked in the index; follow only relevant dependencies.

Useful references/checks (starting points, not a substitute for inspecting affected code):

- [trade-suggestions.md](../trade-suggestions.md)
- [weekly-lineup-review.md](../weekly-lineup-review.md)
- [lineup-advisor.test.ts](../../src/lineup-advisor.test.ts)
- [waivers.test.ts](../../src/waivers.test.ts)
- [player-profiles.test.ts](../../src/player-profiles.test.ts)
- [roster-alerts.test.ts](../../src/roster-alerts.test.ts)

## Feature contracts

Stable IDs trace to the original backlog. Criteria are requirements, not evidence that today’s code or deployment was tested. Load source requests/history only to resolve a specific detail. Later completed corrections refine earlier implementation details.

### TASK-90 — Add a weekly overview of the user's teams across all leagues

- The overview shows each active selected team, its league/week, next or current matchup, and available current standing/playoff context, with links preserving league and season selection.
- Missing/stale inputs and independent league failures are visible without hiding other usable teams; unavailable metrics are not presented as zero.
- Refresh is bounded and reuses the existing cache where appropriate; archived leagues are excluded unless explicitly requested.
- Users with no leagues or no selected team see useful setup actions; mobile, account-isolation, and mixed-provider/season behavior have coverage.

Source: [TASK-90](../../backlog/tasks/task-90%20-%20Add-a-weekly-overview-of-the-users-teams-across-all-leagues.md).

### TASK-91 — Expose a weekly lineup advisor with suggested starter and bench swaps

- For the selected team/week, the advisor compares the submitted lineup with a legal proposed lineup and shows named starter/bench swaps and projected point differences when coverage is sufficient.
- Suggestions respect league slots, FLEX/Superflex eligibility, roster ownership, bye/availability status, and known game/lineup locks; unknown lock state is disclosed instead of claimed safe.
- Incomplete projections, uncertain injuries, and stale roster inputs are explained; users can inspect alternative legal scenarios without changing the provider lineup.
- Focused tests cover overlapping slots, locked players, byes, missing projections, and unchanged provider data; recommendations do not require AI generation.

Source: [TASK-91](../../backlog/tasks/task-91%20-%20Expose-a-weekly-lineup-advisor-with-suggested-starter-and-bench-swaps.md).

### TASK-92 — Recommend league-available waiver pickups and corresponding roster drops

- The user can view available players by position for their league, with verified roster/availability coverage and a freshness timestamp; unsupported provider data is explicitly unavailable.
- A candidate can be paired with a legal roster drop, with projected current/near-term lineup impact using that league's scoring and known bye schedule.
- Bench, reserve/taxi, roster limits, and provider waiver/free-agent restrictions are respected or clearly disclosed when unsupported; owned players are not mislabeled as free agents.
- Recommendation assumptions and projection gaps are visible, provider failure/ownership edge cases are tested, and the tool does not submit transactions.

Source: [TASK-92](../../backlog/tasks/task-92%20-%20Recommend-league-available-waiver-pickups-and-corresponding-roster-drops.md).

### TASK-93 — Evaluate proposed trades using roster and weekly lineup impact for both teams

- Users can select two league teams and a proposed player exchange, seeing both rosters' before/after legal lineup expectations and positional coverage over selected available weeks.
- Roster-size imbalances require explicit drop/open-slot assumptions; duplicate players, non-owned assets, and unsupported draft-pick values are rejected or clearly excluded.
- Optional matchup/playoff scenario changes use the same available input snapshot and disclose uncertainty and projection gaps; no unsupported fair-value certainty is claimed.
- The proposal is read-only and leaves provider rosters, persisted rankings, and existing forecast observations unchanged; tests cover balanced/unbalanced trades and missing data.

Source: [TASK-93](../../backlog/tasks/task-93%20-%20Evaluate-proposed-trades-using-roster-and-weekly-lineup-impact-for-both-teams.md).

### TASK-94 — Add searchable player profiles and comparisons scored for the selected league

- Users can search players and inspect provider/season identity, league-scored observed totals, recent trends, available weekly projections, and current ownership/status with source timestamps.
- Two or more players can be compared over a chosen common date/week range using consistent league scoring and visible sample coverage.
- Missing weeks and unsupported metrics such as targets/snap share are labeled unavailable; neither partial roster history nor name matching is treated as a complete cross-provider player history.
- Profiles are reachable from lineup/matchup and transaction views, remain useful without AI, and have coverage for scoring variants, identity collisions, and partial provider responses.

Source: [TASK-94](../../backlog/tasks/task-94%20-%20Add-searchable-player-profiles-and-comparisons-scored-for-the-selected-league.md).

### TASK-95 — 'Show actionable injury, bye-week, and lineup-risk alerts for managed teams'

- The user sees team-specific in-app alerts for confirmed unavailable starters and upcoming bye/lineup gaps, with severity, affected player/week, timestamp, and a relevant workflow link.
- Uncertain or missing status data is distinguished from a confirmed injury; stale inputs cannot trigger a confidently current alert.
- Repeated refreshes do not create duplicate alerts, resolved conditions stop appearing as active, and dismissal preferences are scoped to the account/team/condition.
- Tests cover condition transitions, lineup/roster changes, partial provider failures, and privacy; the first version sends no external messages.

Source: [TASK-95](../../backlog/tasks/task-95%20-%20Show-actionable-injury-bye-week-and-lineup-risk-alerts-for-managed-teams.md).

### TASK-99 — Combine ESPN and Sleeper player projections for either league provider

- Sleeper and ESPN league rosters can receive current-week projections from both sources without requiring a league on the other provider.
- Players are joined using explicit cross-provider IDs; ambiguous or absent mappings do not produce false matches.
- Raw projections are scored with the target league rules; unsupported scoring and missing source data are disclosed, with a safe native fallback.
- Lineup and trade recommendations use the combined estimate when comparable forecasts exist, while player profiles expose source values and disagreement; ownership and locks remain league-authoritative.
- Tests cover both league directions, custom scoring, identity gaps, provider failures and user-facing provenance; docs explain the combination limits.

Source: [TASK-99](../../backlog/tasks/task-99%20-%20Combine-ESPN-and-Sleeper-player-projections-for-either-league-provider.md).

### TASK-102 — Improve trade analyzer usability and remove drop controls

- Two distinct teams have searchable rosters, clear exchange summaries, and easy selection and reset controls.
- Drop controls are absent; uneven trades request sufficient explicit open roster slots only when needed.
- Initial guidance, lineup impact, locked players, and selection resets behave correctly on desktop and mobile.

Source: [TASK-102](../../backlog/tasks/task-102%20-%20Improve-trade-analyzer-usability-and-remove-drop-controls.md).

### TASK-103 — Improve Players tab browsing and comparison usability

- Players can be found with clearly labeled search and filters, with compact identity, ownership and projection information.
- Selected players stay visible while filtering, can be removed individually or cleared, and have readable comparisons over a common week range.
- Deep-linked players, zero scores, missing data, refresh and league/season changes retain correct behavior; desktop/mobile layouts and accessibility are verified.

Source: [TASK-103](../../backlog/tasks/task-103%20-%20Improve-Players-tab-browsing-and-comparison-usability.md).

### TASK-106 — Default Live matchups to the viewer’s managed teams in the first four leagues

- Initial highlights select the saved managed team on either side or a bye for the first four leagues, using each live league season.
- Missing, stale or unavailable team choices do not highlight arbitrary opponents or leagues beyond the first four.
- Manual choices, including clearing the board, survive refresh; a changed viewer API gets fresh defaults.

Source: [TASK-106](../../backlog/tasks/task-106%20-%20Default-Live-matchups-to-the-viewer%E2%80%99s-managed-teams-in-the-first-four-leagues.md).

### TASK-110 — Suggest possible trades for the user's team in the selected league

- Suggestions use the currently selected owned league, season, and saved managed team. Missing or stale team selections prompt selection; league/season changes clear prior recommendations and cannot mix league ownership or rosters.
- Users receive a ranked, bounded set of concrete player exchanges with a named league counterpart and a rationale for both managers; the initial scope supports player-only one-for-one offers and a clear no-suitable-trades state.
- Each suggestion shows both teams' before/after best legal lineup expectations and positional coverage under the selected league's scoring and roster rules. Ranking rewards useful lineup improvement and counterpart benefit rather than the raw sum of bench-player projections.
- The evaluation horizon, projection sources, freshness, coverage, and availability assumptions are visible. Current-week estimates are explicitly labeled and are not presented as rest-of-season trade value; a season-long recommendation requires valid remaining-week inputs.
- Candidates respect current ownership, supported player identities, trade eligibility, and known league trade restrictions. Unknown roster limits, deadline rules, unsupported assets, and incomplete data are disclosed rather than assumed valid.
- Users can open a suggestion as a prefilled scenario in the existing Trade analyzer and inspect both sides. Generating or inspecting suggestions does not submit offers, message other managers, or change provider rosters or saved rankings.
- Verification covers league/team isolation, legal lineup and flex assignment, mutually beneficial versus one-sided proposals, duplicate exchanges, unavailable projections, and empty results. Explanations distinguish projected benefit from any claim about the other manager's willingness to accept.

Source: [TASK-110](../../backlog/tasks/task-110%20-%20Suggest-possible-trades-for-the-users-team-in-the-selected-league.md).

### TASK-112 — Keep unusable Sleeper live projections unavailable instead of zero

- A native projection with no finite stat applicable to the selected league scoring remains unavailable rather than becoming a zero forecast.
- Legitimate zero and negative projections remain numeric, while missing scoring settings, nonfinite inputs and unusable dictionaries do not claim covered projection data.
- Live, Players, lineup advice and trade analysis consistently disclose missing projection coverage; a valid optional cross-source estimate may still be used with its actual provenance.
- Provider regression tests reproduce the irrelevant-stat case and verify real zero, negative, missing and valid cross-source cases; calculation documentation explains the coverage rule.

Source: [TASK-112](../../backlog/tasks/task-112%20-%20Keep-unusable-Sleeper-live-projections-unavailable-instead-of-zero.md).

### TASK-115 — Make Player Profiles refresh invalidate cached season reports

- An explicit Player Profiles refresh retrieves updated observed scoring even when the selected current or historical report is cached and fresh.
- Ordinary initial reads and league or season changes preserve normal cache reuse rather than forcing every read to reload.
- Refresh preserves the selected league, season and comparisons, and failures or delayed responses cannot replace a newer selected context.
- A regression test uses the real cache contract or an equivalent assertion to verify explicit invalidation, historical cache behavior, preserved selections and error handling.

Source: [TASK-115](../../backlog/tasks/task-115%20-%20Make-Player-Profiles-refresh-invalidate-cached-season-reports.md).

### TASK-117 — Fetch live data only for the selected league in Players and Trade Analyzer

- Players and Trade Analyzer request provider data only for their selected owned league; unrelated registered leagues cause no provider reads for those pages.
- A slow or failing unrelated league does not delay or fail the selected-league result.
- The all-league Live and weekly overview flows retain their current capability, and selected-league loading preserves account isolation and provider access checks.
- Request-count and delayed-provider tests verify selected-league scope, league switching and all-league behavior; UI loading and per-league errors remain clear.

Source: [TASK-117](../../backlog/tasks/task-117%20-%20Fetch-live-data-only-for-the-selected-league-in-Players-and-Trade-Analyzer.md).

### TASK-118 — Retain player names and primary positions for historical profile browsing

- Players with historical observations retain available provider names and primary positions in the selected provider and season without requiring current roster ownership.
- Historical name search and position filtering work with that metadata; current ownership, injury status and projections remain unavailable when unsupported.
- Identity metadata is scoped to players represented in the report, survives snapshots and never merges players across providers or seasons by name; legacy or unknown identities remain explicit.
- Tests cover historical seasons without live data, dropped players, duplicate names across IDs, missing metadata and snapshot round trips; profile coverage documentation is updated.

Source: [TASK-118](../../backlog/tasks/task-118%20-%20Retain-player-names-and-primary-positions-for-historical-profile-browsing.md).

## TASK-146 presentation validation — October 14, 2026

The Manager Explorer presentation keeps the contracts above and their existing production calculations/reads. Weekly overview retains all managed leagues together and adds two-sided matchup evidence plus context-preserving Live navigation. Complete lineup assignments, submitted roster/source evidence and alternative exclusions remain per league. Players retains individual comparison evidence, ranges, sources, disagreement and clear/remove controls. Trade scenarios and ideas use focused views with retained editing state; inspection prefills an editable scenario, with both legal starting-lineup assignments, before/after position coverage and explicit uneven-trade capacity confirmation. Live retains four fixed desktop quarters, eight full starter/bench rosters, profile links, observed points, projections and provided status/remaining-time fractions; each roster scrolls independently, and phone rosters follow the page flow. Definitions use accessible tooltips without replacing source evidence or missing-data notices.

Coverage and genuine data boundaries are recorded in [UI regression guidance](../ui-testing.md). Validation: 128 focused component/calculation/provider tests, 16 Chrome browser checks, scoped lint/formatting and application typecheck. TASK-146 overall completion remains with its app-wide integration; this note establishes the decision support slice only. No feature reductions are approved.

## TASK-146 usability iteration — October 14, 2026

The usability iteration adds real uncalibrated win bars, exclusion-aware lineup gains and bounded proactive waiver previews gated by account/league/season/team/week, freshness and coverage. Full advisors and counted actionable risk evidence remain. Player matrices retain individual provenance/ranges; mutual trade banners retain both full impacts, flags/capacity and editable ideas. Cross-tool controls synchronize route context; Live retains managed markers, four complete games and provider-backed statuses with honest unknowns. See [UI regression guidance](../ui-testing.md).

## TASK-148 — Scheduled NFL kickoffs in Live

Live enriches ESPN and Sleeper roster players from the public ESPN NFL scoreboard for the selected regular-season year/week. Scheduled kickoff dates and times require an explicit offset and provider-confirmed `timeValid`; browser-local conversion uses an explicitly displayed IANA timezone. Player links and injury/bye/remaining-time statuses remain alongside the kickoff evidence. Expandable schedule sources expose the provider and each league's last schedule check; roster kickoff titles retain the same source/freshness evidence.

Explicit provider byes, postponements, cancellations, rescheduled games and unavailable times remain distinct. Absent teams are never inferred to be on bye. Placeholder dates and missing or invalid times never produce kickoff labels. Provider-reported rescheduling and changed confirmed times observed across refreshes are labeled rescheduled. Failed reads retain usable rosters with explicit unavailable schedule evidence.

The existing public scoreboard request supplies both remaining-time and schedule metadata through one shared 45-second cache with coalesced requests, cached failures, expired-entry cleanup and a 36-period bound. Successful schedule observations are retained separately for the most recently refreshed 36 periods, so other-period refreshes and failed reads cannot erase rescheduling evidence within that bound. No account credentials enter this public cache; existing provider and account checks remain in the league readers. Four complete desktop games, eight independently scrollable rosters, full phone page flow, projections, observed points and managed-team selection remain intact.

Verification: focused cache/provider/component tests cover confirmed versus placeholder dates, explicit byes and unknown teams, provider outages, changed kickoff refreshes, and DST/date conversion. Live browser regressions retain the compact board check and exercise kickoff evidence, source freshness, complete dense desktop/phone rosters, independent scrolling and bounded horizontal layout. See [UI regression guidance](../ui-testing.md).

TASK-153 aligns compact Live matchup button names with the complete visible home/away scores, score order, managed stars and bye/missing-score evidence under the upgraded accessibility checker. Highlight/remove actions, the four-matchup limit, selections and density remain unchanged.
