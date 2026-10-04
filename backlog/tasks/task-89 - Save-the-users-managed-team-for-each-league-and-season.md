---
id: TASK-89
title: Save the user's managed team for each league and season
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 02:43'
updated_date: '2026-10-04 03:28'
labels:
  - analytics
  - leagues
dependencies: []
references:
  - src/types.ts
  - src/server/models/league.model.ts
  - src/server/interfaces/teams.interface.ts
  - src/server/insights/seasons.server.ts
  - src/components/ManageLeagues.tsx
documentation:
  - README.md
priority: high
type: feature
ordinal: 92000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The workspace links leagues to an Auth0 owner, but it does not identify which fantasy team that owner manages. Personalized lineup, waiver, roster-risk, and multi-league views need this association. Provider team IDs and manager ownership can change across seasons, and the Auth0 subject is not the provider manager identity. Establish a private, explicit team selection before treating a roster as 'my team'; retain league-wide reports for commissioners and users who do not select a team.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An owner can select, change, or clear their managed team for a registered league and season, and the choice survives browser/device changes.
- [x] #2 Only teams from that owned league and selected season can be associated; other accounts cannot read or alter the association.
- [x] #3 Season rollover, unavailable teams, and provider-ID changes trigger validation or reselection rather than silently mapping to another roster.
- [x] #4 The UI supports an unselected/commissioner mode and tests cover two owners, two leagues, and differing season team identities.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add private season-specific managed-team storage and owner-scoped validated read/write operations. 2. Expose a season/team selector in Manage leagues, including commissioner mode and stale selection handling. 3. Verify authorization, season identity, provider changes, and UI persistence; update documentation and commit the completed task.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added account-private managed-team selection per workspace and season, validated against provider teams and manager identity, with commissioner mode and provider-change invalidation. Verified save/clear/season selection and retry in DOM tests; ownership, league isolation, missing teams, manager changes, and concurrent provider changes in server tests. Full suite: 355 tests passed; typecheck and lint passed. README documents setup.
<!-- SECTION:FINAL_SUMMARY:END -->
