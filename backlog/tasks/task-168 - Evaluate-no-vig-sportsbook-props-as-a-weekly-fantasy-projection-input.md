---
id: TASK-168
title: Evaluate no-vig sportsbook props as a weekly fantasy projection input
status: To Do
assignee: []
created_date: '2026-11-23T04:20:59Z'
updated_date: '2026-11-23T04:25:50Z'
labels:
  - projections
  - simulation
  - research
dependencies: []
references:
  - https://sportsgameodds.com/pricing
  - https://sportsgameodds.com/docs/faq
  - https://sportsgameodds.com/use-cases/dfs-data-api
  - https://the-odds-api.com/liveapi/guides/v4/index.html
  - https://the-odds-api.com/historical-odds-data/
  - https://endzoneapi.com/data
  - >-
    https://support.sleeper.com/en/articles/3998131-what-scoring-options-are-available
  - https://the-odds-api.com/#get-access
  - https://the-odds-api.com/terms-and-conditions.html
  - https://sportsgameodds.com/terms
type: spike
ordinal: 176000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Research a market-implied weekly score for the standalone Season Simulator and compare it with history-only, Sleeper, ESPN, and blended inputs before proposing wider use. Consider passing, rushing and receiving yards, receptions, passing and scoring touchdowns, and alternate lines for 100–199 and 200+ receiving-yard bonuses. The season simulator should draw variation from historical outcomes and use market expectations for covered NFL games. Use existing projections or history for gaps and identify the source used. Coverage is per underlying NFL game, so one cached pregame pull can serve every fantasy roster in a 10-team league. Pricing estimate when scoped (2026-11-23): SportsGameOdds Amateur is $0 with a signup card, 2,500 event objects/month, 9 books, 10 requests/min, 10-minute updates, alternate lines and documented no-vig fairOdds. Four weekly refreshes of 16 NFL games consume up to 64 objects. Historical odds are Pro or higher. The Odds API Starter is $0 with 500 credits/month for live/upcoming props and raw book prices. One region, six returned prop markets, 16 games, and four refreshes use up to 384 credits; eight markets use up to 512. Historical props start May 2023 on paid plans advertised from $30/month, with separate historical quota costs. EndzoneAPI offers a historical alternative with opening and closing props from 2023. Reverify plans, actual market coverage, and terms before integration.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Compare live and historical provider coverage, contractual reuse terms, and projected quota costs for one shared NFL refresh across a full fantasy league, including alternate lines and deeper rosters.
- [ ] #2 Use documented no-vig probabilities or remove each bookmaker's margin using matched over/under prices at the same line before aggregating. For example, -110/-110 normalizes to 50%/50%. Skip raw one-sided prices unless they can be calibrated from other fair data.
- [ ] #3 Convert alternate thresholds into a coherent outcome distribution, treat anytime TD as a probability of at least one and use multi-TD probabilities for expected TD count where available, and calculate league scoring including mutually exclusive receiving bonuses.
- [ ] #4 Backtest matched pre-kickoff snapshots against observed scores and the history, Sleeper, ESPN and combined baselines. Report error, calibration, coverage, and how missing props or unidentified players fall back without widening existing simulations.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
