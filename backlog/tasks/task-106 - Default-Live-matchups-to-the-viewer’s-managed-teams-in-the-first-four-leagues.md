---
id: TASK-106
title: Default Live matchups to the viewer’s managed teams in the first four leagues
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 18:57'
updated_date: '2026-10-04 19:02'
labels: []
dependencies: []
ordinal: 113000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
On initial load, automatically highlight the signed-in viewer’s managed-team matchup for the first four leagues in sidebar order. Keep manual choices on score refresh and respect current four-matchup limit.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Initial highlights select the saved managed team on either side or a bye for the first four leagues, using each live league season.
- [x] #2 Missing, stale or unavailable team choices do not highlight arbitrary opponents or leagues beyond the first four.
- [x] #3 Manual choices, including clearing the board, survive refresh; a changed viewer API gets fresh defaults.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add bounded managed-team reads on initial successful load, protect manual selections and session changes, test defaults/fallback/refresh behavior, and document the default.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
On initial successful Live matchups load, read the viewer-specific managed-team selection for at most the first four leagues in sidebar order, using each live league season. Highlight that team’s current home, away or bye matchup. Skip failed live leagues, missing/reselection choices, unavailable saved choices and missing matchups; do not substitute later leagues or arbitrary opponents.

Initialize only once per account API, preserve manual choices on periodic/manual refresh, and protect choices made while initial managed-team reads are pending. Reset defaults and board state for a new account API; ignore results from canceled loads. Existing four-matchup cap and score refresh behavior remain.

Verification: 12 live component/model tests passed, including defaults with six leagues, fewer than four leagues, both providers/seasons, home/away/byes, missing/stale/failed/unmatched choices, manual changes/clearing across refresh, interaction during initial reads and account changes. Four browser tests passed, including automatic four-card boards at desktop/mobile widths, manual replacement and refresh, plus existing live layouts. Production build/typecheck, full lint, changed-file formatting and whitespace checks pass. README documents default ordering, saved My managed team choices and refresh behavior.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Live matchups now automatically highlights the viewer’s saved managed-team matchups from the first four leagues. Manual choices persist during refresh and account changes receive fresh defaults. Verified with 12 unit/model tests, four desktop/mobile browser tests, production build/typecheck, lint and formatting.
<!-- SECTION:FINAL_SUMMARY:END -->
