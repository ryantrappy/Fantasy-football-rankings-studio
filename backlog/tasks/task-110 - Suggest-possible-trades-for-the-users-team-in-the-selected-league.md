---
id: TASK-110
title: Suggest possible trades for the user's team in the selected league
status: To Do
assignee: []
created_date: '2026-10-05 16:17'
labels:
  - analytics
  - trades
dependencies: []
references:
  - src/trade-analysis.ts
  - src/components/TradeAnalyzerPage.tsx
  - >-
    backlog/tasks/task-89 -
    Save-the-users-managed-team-for-each-league-and-season.md
  - >-
    backlog/tasks/task-93 -
    Evaluate-proposed-trades-using-roster-and-weekly-lineup-impact-for-both-teams.md
documentation:
  - docs/trade-suggestions-brainstorm.md
type: feature
ordinal: 117000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The existing Trade analyzer evaluates an exchange after a manager chooses teams and players. Managers also want help discovering plausible offers for their saved managed team in the currently selected league. Suggest exchanges that address their weaknesses and make sense for the other manager, with transparent impact for both sides. This is future discovery work building on the existing analyzer, not another manually entered trade evaluation screen. A requested subagent brainstorm is saved separately as optional design exploration; revalidate its assumptions when implementation starts. Trade suggestions may link from Season Insights into the existing Trade analyzer; final navigation placement remains a product decision.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Suggestions use the currently selected owned league, season, and saved managed team. Missing or stale team selections prompt selection; league/season changes clear prior recommendations and cannot mix league ownership or rosters.
- [ ] #2 Users receive a ranked, bounded set of concrete player exchanges with a named league counterpart and a rationale for both managers; the initial scope supports player-only one-for-one offers and a clear no-suitable-trades state.
- [ ] #3 Each suggestion shows both teams' before/after best legal lineup expectations and positional coverage under the selected league's scoring and roster rules. Ranking rewards useful lineup improvement and counterpart benefit rather than the raw sum of bench-player projections.
- [ ] #4 The evaluation horizon, projection sources, freshness, coverage, and availability assumptions are visible. Current-week estimates are explicitly labeled and are not presented as rest-of-season trade value; a season-long recommendation requires valid remaining-week inputs.
- [ ] #5 Candidates respect current ownership, supported player identities, trade eligibility, and known league trade restrictions. Unknown roster limits, deadline rules, unsupported assets, and incomplete data are disclosed rather than assumed valid.
- [ ] #6 Users can open a suggestion as a prefilled scenario in the existing Trade analyzer and inspect both sides. Generating or inspecting suggestions does not submit offers, message other managers, or change provider rosters or saved rankings.
- [ ] #7 Verification covers league/team isolation, legal lineup and flex assignment, mutually beneficial versus one-sided proposals, duplicate exchanges, unavailable projections, and empty results. Explanations distinguish projected benefit from any claim about the other manager's willingness to accept.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
