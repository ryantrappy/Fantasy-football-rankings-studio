---
id: TASK-110
title: Suggest possible trades for the user's team in the selected league
status: Done
assignee:
  - '@codex'
created_date: '2026-10-05 16:17'
updated_date: '2026-10-06 16:12'
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
  - docs/trade-suggestions.md
type: feature
ordinal: 117000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The existing Trade analyzer evaluates an exchange after a manager chooses teams and players. Managers also want help discovering plausible offers for their saved managed team in the currently selected league. Suggest exchanges that address their weaknesses and make sense for the other manager, with transparent impact for both sides. This is future discovery work building on the existing analyzer, not another manually entered trade evaluation screen. A requested subagent brainstorm is saved separately as optional design exploration; revalidate its assumptions when implementation starts. Trade suggestions may link from Season Insights into the existing Trade analyzer; final navigation placement remains a product decision.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Suggestions use the currently selected owned league, season, and saved managed team. Missing or stale team selections prompt selection; league/season changes clear prior recommendations and cannot mix league ownership or rosters.
- [x] #2 Users receive a ranked, bounded set of concrete player exchanges with a named league counterpart and a rationale for both managers; the initial scope supports player-only one-for-one offers and a clear no-suitable-trades state.
- [x] #3 Each suggestion shows both teams' before/after best legal lineup expectations and positional coverage under the selected league's scoring and roster rules. Ranking rewards useful lineup improvement and counterpart benefit rather than the raw sum of bench-player projections.
- [x] #4 The evaluation horizon, projection sources, freshness, coverage, and availability assumptions are visible. Current-week estimates are explicitly labeled and are not presented as rest-of-season trade value; a season-long recommendation requires valid remaining-week inputs.
- [x] #5 Candidates respect current ownership, supported player identities, trade eligibility, and known league trade restrictions. Unknown roster limits, deadline rules, unsupported assets, and incomplete data are disclosed rather than assumed valid.
- [x] #6 Users can open a suggestion as a prefilled scenario in the existing Trade analyzer and inspect both sides. Generating or inspecting suggestions does not submit offers, message other managers, or change provider rosters or saved rankings.
- [x] #7 Verification covers league/team isolation, legal lineup and flex assignment, mutually beneficial versus one-sided proposals, duplicate exchanges, unavailable projections, and empty results. Explanations distinguish projected benefit from any claim about the other manager's willingness to accept.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Reuse the current-week trade evaluator for deterministic, bounded one-for-one suggestions with positive best-legal-lineup gains for both managers; exclude ambiguous ownership, unsupported identities and unavailable assets, and disclose unknown provider restrictions.
2. Add discovery inside the existing Trade analyzer, using owned league/season context and the validated saved managed team; clear stale state on scope changes and prefill the existing scenario for inspection.
3. Show both teams’ lineup projections and coverage, source freshness and current-week limits. Verify isolation, flex legality, eligibility, ranking, missing projections, empty results and prefill through automated model and DOM tests; update documentation and run project checks.

4. Validate full twelve-team rosters; use an exact filled-slot dynamic program in the shared lineup optimizer to avoid enumerating bench-player combinations, with an independent exhaustive-assignment test and regression checks for existing lineup/playoff calculations.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented ranked weekly suggestions, validated managed-team context, scope clearing and prefilled inspection. Desktop/mobile browser interactions and accessibility pass. Full-size league validation exposed a roughly six-second search; replaced the lineup combination search with an exact slot-mask dynamic program and added exhaustive-assignment equivalence checks before final verification.

Final verification: npm test passed 532 tests across 102 files (one existing integration file/test skipped); npm run typecheck, lint, format:check and build passed. Full deterministic Chrome suite passed all 49 checks, including mobile/desktop trade inspection, focus, accessibility and scope clearing. git diff --check passed.
AC 1: DOM tests verify requested/remembered owned scope, validated saved selection, exact season saves, failed/unsaved choices, account/league/season clearing and ignored late responses.
AC 2–3: Model and DOM tests verify stable bounded ranking, concrete counterparts, mutually beneficial legal lineup changes and positional counts; independent exhaustive-assignment cases cover optimizer correctness. Full twelve-team/nine-slot validation fell from about 5.9 seconds to 256 ms.
AC 4–5: DOM/source tests verify the explicit weekly horizon, source timestamps, projection coverage, unsupported/ineligible assets, unknown restriction disclosures and known Sleeper disabled/deadline rules. No remaining-season value or acceptance claim is made.
AC 6–7: DOM and browser tests verify editable prefilled scenarios without a managed-team write during inspection; model tests cover one-sided/empty offers, duplicates, missing projections and FLEX/SUPER FLEX legality.
The existing WritingSuggestions consent test failed once while unit and browser suites ran concurrently; its focused rerun and subsequent full unit rerun passed without changing that component or test.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented current-week trade discovery for the validated saved managed team in the selected owned league and season. Up to five one-for-one offers improve both legal lineups, show coverage and projection provenance, disclose eligibility limits, honor known Sleeper restrictions and prefill the existing analyzer for inspection. Scope changes clear stale recommendations and scenarios. Optimized the exact shared lineup search for full league rosters. Verified with 532 passing unit tests, 49 passing Chrome checks, type checking, lint, formatting and production build; updated README and trade-suggestions documentation.
<!-- SECTION:FINAL_SUMMARY:END -->
