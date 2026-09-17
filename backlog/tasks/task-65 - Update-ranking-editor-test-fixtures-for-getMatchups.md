---
id: TASK-65
title: Update ranking-editor test fixtures for getMatchups
status: To Do
assignee: []
created_date: '2026-09-17 18:52'
labels: []
dependencies: []
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
- [ ] #1 `npm run typecheck` passes with complete LeagueApi fixtures.
- [ ] #2 Ranking-editor test mocks provide deterministic getMatchups behavior.
- [ ] #3 The fixture change does not weaken existing test assertions.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
- [ ] #3 Run the focused ranking-editor tests and typecheck.
<!-- DOD:END -->
