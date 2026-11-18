---
id: TASK-164
title: Rescore Sleeper league history with ESPN PPR
status: To Do
assignee: []
created_date: '2026-11-18 05:28'
labels:
  - historical-analytics
  - sleeper
dependencies: []
references:
  - 'https://docs.sleeper.com/#getting-matchups-in-a-league'
  - 'https://support.espn.com/hc/en-us/articles/360003914032-Scoring-Formats'
  - >-
    https://support.espn.com/hc/en-us/articles/115003847231-Defense-and-Special-Teams-D-ST-Scoring
  - 'https://nflreadr.nflverse.com/reference/load_player_stats.html'
  - 'https://nflreadr.nflverse.com/articles/dictionary_team_stats.html'
  - 'https://nflreadr.nflverse.com/reference/load_pbp.html'
  - 'https://nflreadr.nflverse.com/reference/load_ff_playerids.html'
  - src/components/OtherToolsPage.tsx
  - src/server/providers/sleeper.provider.ts
  - src/server/insights/seasons.server.ts
  - src/server/insights/load.server.ts
type: feature
ordinal: 174000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The league moved from ESPN to Sleeper. The commissioner wants to know which weekly team scores in the Sleeper era would have been the lowest and highest if the previous ESPN full-PPR scoring had applied to the same lineups. The unit of comparison is one fantasy team in one NFL week, including each week of a multiweek playoff matchup.

Use the same version of the ESPN rules across all selected seasons. ESPN's published full-PPR rules are the baseline. The old ESPN league's scoring settings or a screenshot can establish the exact legacy preset if they differ from the published defaults. ESPN's scoring table and its D/ST explainer give conflicting guidance on whether yards allowed are part of the default. Confirm that setting and the kicking rules against the old settings or season-appropriate ESPN evidence. If only the published reference is available, label it with its version and disclose any unverified differences before presenting the records.

Sleeper supplies the recorded weekly lineups and original totals. The nflverse weekly player and team datasets supply actual NFL stats, with play-by-play for scoring events that need finer detail. The fantasy player ID crosswalk provides Sleeper and GSIS IDs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Historical Rescoring opens as a standalone page in Other tools, keeps the selected league context, and offers rescoring for Sleeper NFL leagues.
- [ ] #2 Discover linked Sleeper seasons from the selected league and offer all linked seasons, individual seasons, and regular-season or playoff week filters. Rescore completed league weeks with recorded lineups, exclude future or unfinished weeks and placeholder playoff-bye rows, and count each played team-week once.
- [ ] #3 Score the exact starters recorded for that roster and week, including original flex or superflex assignments and any kicker or team D/ST the league started. Exclude bench players. Keep the original Sleeper total and any commissioner override available as comparison, with the override excluded from the recalculated total.
- [ ] #4 Calculate a versioned ESPN full-PPR score from actual NFL stats for the matching season and week. Cover fractional and negative yardage, passing, rushing, receiving, two-point plays, fumbles and return touchdowns, field-goal distance and misses, PATs, and D/ST. Display the applied preset, rules source and legacy verification status.
- [ ] #5 Show the lowest and highest rescored totals for the selected scope and a sortable leaderboard of team-week totals, with all tied extremes and shared ranks for equal totals. Each row identifies the season, week and team, and opens a starter-level breakdown with the scoring categories that add up to the team total.
- [ ] #6 Count confirmed empty slots and verified non-participants such as players on NFL bye as zero. Show coverage and exclude incomplete team-weeks from rankings when weekly lineups, player or team IDs, required stats, or supported scoring categories cannot be verified. Disclose unavailable seasons or weeks and make clear when the records represent only the covered subset.
- [ ] #7 Verify the preset against known ESPN player-week scores for offense, kicking and D/ST wherever historical reference scores are available. Add deterministic checks for field-goal and D/ST scoring thresholds, pick-sixes and other D/ST attribution, exact weekly starters, league renewals, playoff weeks, ties and missing data.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
