---
id: TASK-65
title: Update ranking-editor test fixtures for getMatchups
status: Done
assignee: []
created_date: '2026-09-17 18:52'
updated_date: '2026-09-18 02:17'
labels: []
dependencies: []
modified_files:
  - src/hooks/useRankingEditor.test.tsx
priority: medium
type: bug
ordinal: 68000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`npm run typecheck` fails because the `LeagueApi` interface now requires `getMatchups`, but the mocks passed to `useRankingEditor` tests do not implement it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 `npm run typecheck` passes with complete LeagueApi fixtures.
- [x] #2 Ranking-editor test mocks provide deterministic getMatchups behavior.
- [x] #3 The fixture change does not weaken existing test assertions.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
- [x] #3 Run the focused ranking-editor tests and typecheck.
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add a typed `getMatchups` mock returning an empty deterministic matchup list to the shared `makeApi` fixture. Run the focused ranking-editor tests and full typecheck, then commit the fixture update.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added a typed `getMatchups` mock that resolves to an empty array, matching the no-matchup default used by these ranking-editor tests. The focused hook suite and `npm run typecheck` pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Updated the ranking-editor test API fixture with a deterministic `getMatchups` implementation so it satisfies the current LeagueApi contract and restores TypeScript validation.
<!-- SECTION:FINAL_SUMMARY:END -->
