---
id: TASK-148
title: Show scheduled NFL start times in Live matchups
status: To Do
assignee: []
created_date: '2026-10-15 04:12'
updated_date: '2026-10-15 20:05'
labels: []
dependencies:
  - TASK-146
references:
  - docs/features/decision-support.md
  - docs/ui-testing.md
ordinal: 155000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
During the October 14, 2026 usability redesign review, the user chose to keep current real bye/injury/remaining-time statuses for the first pass and explicitly requested a separate future task for start times. The mockup shows kickoff labels that the current normalized Live data does not provide. Scope this follow-up to reliable scheduled NFL start times; the completed redesign remains usable with its existing status evidence.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Upcoming roster players show real scheduled NFL kickoff dates and times in an explicitly labeled user timezone, with source and freshness available.
- [ ] #2 Bye weeks, unavailable schedules, postponements and rescheduled games remain explicit; missing times are never fabricated.
- [ ] #3 Keep the complete four-game desktop board, independent roster scrolling, phone flow, player links, statuses and provider/account isolation; schedule reads remain cached and bounded.
- [ ] #4 Add focused provider/component/browser regressions for timezone conversion, schedule changes, unavailable times and responsive density, and update affected feature contracts.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-151 retired completed design artifacts at user request. References now point to maintained Live preservation and regression guidance; the kickoff-time requirements and To Do status are unchanged.
<!-- SECTION:NOTES:END -->
