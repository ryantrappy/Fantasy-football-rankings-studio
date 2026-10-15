---
id: TASK-148
title: Show scheduled NFL start times in Live matchups
status: Done
assignee:
  - '@codex'
created_date: '2026-10-15 04:12'
updated_date: '2026-10-15 20:31'
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
- [x] #1 Upcoming roster players show real scheduled NFL kickoff dates and times in an explicitly labeled user timezone, with source and freshness available.
- [x] #2 Bye weeks, unavailable schedules, postponements and rescheduled games remain explicit; missing times are never fabricated.
- [x] #3 Keep the complete four-game desktop board, independent roster scrolling, phone flow, player links, statuses and provider/account isolation; schedule reads remain cached and bounded.
- [x] #4 Add focused provider/component/browser regressions for timezone conversion, schedule changes, unavailable times and responsive density, and update affected feature contracts.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Extend the cached public NFL scoreboard read with validated kickoff and schedule status metadata, preserving remaining-time consumers. 2. Enrich both provider roster mappings and render timezone-labeled kickoff evidence without replacing existing statuses. 3. Verify provider/cache behavior, timezone and schedule changes, and desktop/phone roster density; update the decision-support contract.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-151 retired completed design artifacts at user request. References now point to maintained Live preservation and regression guidance; the kickoff-time requirements and To Do status are unchanged.

Implemented shared bounded scoreboard kickoff metadata, explicit byes/unknowns, postponements/cancellations/rescheduling, browser timezone labeling and accessible source/freshness details for both providers. Verified real ESPN scoreboard schema (date, competition.timeValid and week.teamsOnBye) with a read-only API request. Validation: 39 focused provider/cache/component/domain tests pass; all 11 Live Chrome browser regressions pass including retained compact no-overflow and dense desktop/phone kickoff cases; scoped oxlint clean. Typecheck reports only concurrent TASK-150 writing migration errors while its dependency update is pending, no kickoff-area errors. Task remains In Progress for lead integration and per-task commit.

Lead review retained original compact-density assertions and verified independent roster scrolling remains covered. Updated feature index and maintained UI testing guide. The concurrent dependency migration is TASK-153 (the earlier TASK-150 reference was a note typo).
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added reliable NFL kickoff evidence to ESPN and Sleeper Live rosters using the cached public scoreboard. Times require provider-confirmed validity, remain explicitly unavailable when unknown, convert to the labeled browser timezone, and retain source/freshness evidence plus existing roster statuses and links. Verified with 39 focused tests, 11 Live browser regressions and scoped lint; final global checks and commit remain with lead integration.
<!-- SECTION:FINAL_SUMMARY:END -->
