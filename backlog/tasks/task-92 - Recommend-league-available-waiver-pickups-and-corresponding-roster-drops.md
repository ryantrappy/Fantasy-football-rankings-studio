---
id: TASK-92
title: Recommend league-available waiver pickups and corresponding roster drops
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 02:43'
updated_date: '2026-10-04 03:56'
labels:
  - analytics
  - waivers
dependencies:
  - TASK-89
references:
  - src/server/insights/calculate.ts
  - src/server/insights/projections.ts
  - src/server/insights/load.server.ts
  - src/server/providers/league-provider.ts
  - src/server/providers/sleeper.provider.ts
  - src/server/providers/espn.provider.ts
documentation:
  - README.md
priority: high
type: feature
ordinal: 95000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Season insights grade past pickups, while forecast ownership stays frozen and excludes hypothetical acquisitions. A one-stop analytics workspace should help a manager choose the next pickup: the relevant candidates are players actually available in that league, evaluated against the manager's roster and scoring. Begin with available add/drop comparisons and short-horizon streaming; do not assume a league-wide ownership percentage proves a player is available, or invent auction prices without budget data.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The user can view available players by position for their league, with verified roster/availability coverage and a freshness timestamp; unsupported provider data is explicitly unavailable.
- [x] #2 A candidate can be paired with a legal roster drop, with projected current/near-term lineup impact using that league's scoring and known bye schedule.
- [x] #3 Bench, reserve/taxi, roster limits, and provider waiver/free-agent restrictions are respected or clearly disclosed when unsupported; owned players are not mislabeled as free agents.
- [x] #4 Recommendation assumptions and projection gaps are visible, provider failure/ownership edge cases are tested, and the tool does not submit transactions.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add owner-only, on-demand waiver pool reads with verified complete Sleeper roster ownership, league-scored projections and explicit unsupported ESPN pool status. 2. Compare current-week legal lineup impact for available candidates and same-position active roster drops, disclose waiver/lock restrictions and gaps, and expose position filters in overview cards. 3. Verify ownership/reserve coverage, failures, lock/bye constraints and read-only UI; document supported scope and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added owner-only on-demand Sleeper waiver pool with complete unique roster coverage including reserve/taxi ownership, league-scored projections, freshness and position filtering. Candidate selection suggests an improving same-position active-roster drop when legal lineup coverage permits; users can compare other drops. Known locks/byes/injuries constrain scenarios. ESPN availability is explicitly unsupported, and claim/FAAB/undroppable restrictions are disclosed. No provider transactions occur. Verified ownership edge cases, roster changes, scoring, locks, byes, missing data and DOM load/retry/comparison; 391 tests, typecheck/lint passed. README updated.
<!-- SECTION:FINAL_SUMMARY:END -->
