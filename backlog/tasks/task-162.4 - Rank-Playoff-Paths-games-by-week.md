---
id: TASK-162.4
title: Rank Playoff Paths games by week
status: In Progress
assignee:
  - '@codex'
created_date: '2026-11-25T18:51:49Z'
updated_date: '2026-11-25T18:55:51Z'
labels: []
dependencies: []
documentation:
  - docs/features/playoffs.md
modified_files:
  - src/playoff-paths.ts
  - src/playoff-paths.test.ts
  - src/components/PlayoffPaths.tsx
  - tests/ui/playoff-paths.spec.ts
  - docs/features/playoffs.md
parent_task_id: TASK-162
type: enhancement
ordinal: 175000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Managers need a week-by-week rooting guide so they can see which upcoming matchups matter most to their own playoff chances without scanning across the full remaining schedule.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Playoff Paths groups unfixed game impacts by scoring week, earliest week first.
- [x] #2 Within each week, games are ranked by the selected team's playoff chance swing and show the odds under both possible winners.
- [x] #3 Regression coverage verifies weekly ordering, team-specific rankings, and the effect of picking games. The Playoff Paths feature contract records the grouping.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Group the existing selected-team playoff leverage by scoring week and sort each group by absolute chance swing.
2. Render each nonempty week as its own labeled list in the shared Playoff Paths component, with both winner scenarios and no cross-week truncation.
3. Verify numeric week ordering and team-specific ranking in the helper tests, and verify the weekly sections and pick behavior in the desktop and mobile browser checks. Update the TASK-162 feature contract.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The ranking uses the selected team, defaults to the existing managed-team selection when available, and orders every eligible matchup within its week. Both private and shared paths use the same component.

Verified with 954 Vitest passes and one opt-in live contract skip. Focused Playwright checks passed at desktop and phone widths, covering all fixture weeks, team switching, and picked games leaving the rankings. Lint, formatting, type checking, and the production build passed.
<!-- SECTION:NOTES:END -->
