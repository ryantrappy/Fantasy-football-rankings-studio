---
id: TASK-94
title: Add searchable player profiles and comparisons scored for the selected league
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 02:43'
updated_date: '2026-10-04 04:13'
labels:
  - analytics
  - players
dependencies: []
references:
  - src/insights.ts
  - src/server/insights/load.server.ts
  - src/server/insights/projections.ts
  - src/server/live-matchups.server.ts
  - src/components/LiveMatchupsPage.tsx
documentation:
  - README.md
priority: medium
type: feature
ordinal: 101000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Current pages focus on team/manager summaries and matchup rosters. A manager researching a starter, trade target, or free agent needs one place to inspect player scoring history, upcoming projections, ownership, and availability using the league's actual scoring. Provider identities and unsupported usage data must remain explicit; current roster-derived history does not establish complete career or free-agent coverage.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Users can search players and inspect provider/season identity, league-scored observed totals, recent trends, available weekly projections, and current ownership/status with source timestamps.
- [x] #2 Two or more players can be compared over a chosen common date/week range using consistent league scoring and visible sample coverage.
- [x] #3 Missing weeks and unsupported metrics such as targets/snap share are labeled unavailable; neither partial roster history nor name matching is treated as a complete cross-provider player history.
- [x] #4 Profiles are reachable from lineup/matchup and transaction views, remain useful without AI, and have coverage for scoring variants, identity collisions, and partial provider responses.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Build provider/season-scoped player profiles from existing league-scored roster observations, live projections/status/ownership and optional verified waiver pool; retain partial coverage and source timestamps. 2. Add searchable player comparison over a common week range and profile links from matchup/lineup/waiver/trade views. 3. Verify scoring variants, duplicate names/IDs, partial responses and UI comparisons; document coverage limits and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added searchable Players route and common-week-range comparisons using provider/season identities, league-scored roster observations, live projections/status/ownership and optional verified unowned pool. Profiles show source timestamps and partial sample coverage; missing or contradictory weeks and unsupported usage metrics remain unavailable. Added profile links in live matchup rosters, lineup assignments, waiver candidates and trade rosters. Verified scoring variants, name/ID collisions, partial responses and DOM comparison; full 412-test suite, production build, lint/typecheck and three Chrome desktop/mobile layout checks passed. README updated.
<!-- SECTION:FINAL_SUMMARY:END -->
