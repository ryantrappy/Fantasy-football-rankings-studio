---
id: TASK-90
title: Add a weekly overview of the user's teams across all leagues
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 02:43'
updated_date: '2026-10-04 03:32'
labels:
  - analytics
  - dashboard
dependencies:
  - TASK-89
references:
  - src/components/AppNavigation.tsx
  - src/components/LiveMatchupsPage.tsx
  - src/api/client.ts
  - src/server/operations.server.ts
  - src/components/report-freshness.ts
documentation:
  - README.md
priority: high
type: feature
ordinal: 93000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The current navigation separates the ranking studio, live matchups, season insights, playoff simulation, and league history. A manager following several leagues must repeatedly change context to answer 'what needs my attention this week?' Add a personalized overview that connects existing analytics to the selected team in each league, with deep links to the relevant workflow. Use provider-specific scoring calendars rather than assuming every league has the same active week.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The overview shows each active selected team, its league/week, next or current matchup, and available current standing/playoff context, with links preserving league and season selection.
- [x] #2 Missing/stale inputs and independent league failures are visible without hiding other usable teams; unavailable metrics are not presented as zero.
- [x] #3 Refresh is bounded and reuses the existing cache where appropriate; archived leagues are excluded unless explicitly requested.
- [x] #4 Users with no leagues or no selected team see useful setup actions; mobile, account-isolation, and mixed-provider/season behavior have coverage.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Compose owner-only weekly overview data from active leagues, managed-team validation, existing live scores, and cached insights. 2. Add a responsive overview route/navigation with context-preserving workflow links and explicit missing/failed/stale states. 3. Verify mixed-provider seasons, account isolation, empty states, refresh bounds, and UI behavior; document and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added My weekly overview route and navigation, composing account-owned active leagues with selected teams, provider scoring weeks, matchup scores, records and existing playoff estimates. Missing and partial data are explicit; workflow links retain league/season/week. Refresh is on demand, reads three league contexts concurrently, and reuses insights cache. Verified six focused tests, all 361 unit/DOM tests, phone layout and links in Chrome Playwright, typecheck and lint; production assets built successfully. README updated.
<!-- SECTION:FINAL_SUMMARY:END -->
