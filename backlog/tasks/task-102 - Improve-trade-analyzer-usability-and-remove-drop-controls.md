---
id: TASK-102
title: Improve trade analyzer usability and remove drop controls
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 04:42'
updated_date: '2026-10-04 04:49'
labels: []
dependencies: []
ordinal: 109000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The trade tab mixes send/drop actions in an unstructured roster list, displays validation before a proposal exists, and makes lineup impact hard to scan. The user requested a clearer trading flow without drop controls.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Two distinct teams have searchable rosters, clear exchange summaries, and easy selection and reset controls.
- [x] #2 Drop controls are absent; uneven trades request sufficient explicit open roster slots only when needed.
- [x] #3 Initial guidance, lineup impact, locked players, and selection resets behave correctly on desktop and mobile.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace the trade form with styled team cards and visible exchange/impact summaries. 2. Remove drop UI and reveal roster-space assumptions only for uneven exchanges, resetting stale state. 3. Verify component/evaluator behavior, browser layout and accessibility, typecheck/lint/build; update trade documentation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified 7 focused component/evaluator tests and 2 Playwright tests at 1280px and 390px; browser checks cover search, persistent selected summaries, uneven exchanges, reset, no overflow and zero axe violations. Reviewed screenshots. Production build/typecheck, changed-file lint/format and git diff --check pass. Project-wide lint reports an unrelated DataTable.tsx aria-description error. README trade guidance updated; existing drop support remains internal to the evaluator, while the tab always evaluates with empty drop lists.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Reworked the trade analyzer into responsive searchable team cards with selected-player removal, sending/receiving summaries and prominent weekly lineup impact. Removed drop controls and the inert week selector; reveal explicit roster-space confirmation above the cards only for uneven trades. Prevent same-team selection and reset stale assumptions on proposal/team changes. Collapsed source/limits detail and suppressed premature validation. Verified 7 unit/DOM tests, 2 desktop/mobile browser tests with axe, production build/typecheck and changed-file lint/format. Unrelated project-wide DataTable lint issue remains.
<!-- SECTION:FINAL_SUMMARY:END -->
