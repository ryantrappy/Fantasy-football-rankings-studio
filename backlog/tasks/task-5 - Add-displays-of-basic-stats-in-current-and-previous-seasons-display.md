---
id: TASK-5
title: Add displays of basic stats in current and previous seasons display
status: To Do
assignee:
  - '@codex'
created_date: '2026-09-09 02:54'
updated_date: '2026-09-09 04:15'
labels: []
dependencies: []
priority: medium
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Display how many playoff appearances each team has in the historcal area, championships, and last place finishes. Add average finish as well.
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Paused during research to handle newly added high-priority TASK-10. No implementation started. Existing InsightsSource has no finish fields. Sleeper exposes winners_bracket and losers_bracket plus season.status; current 2026 brackets are already seeded in week 1, so appearances must not be counted until playoffs begin. Prior linked league 1257070201283817472 (2025) status complete; winners placement p fields provide championship finishes. Losers bracket omits some teams (10 teams, 4 playoff teams, only 4 in losers bracket), so do not infer full placements or last place blindly. Public ESPN fixture 1140768 returned HTTP 401 on read; handle unavailable finish data explicitly.
<!-- SECTION:NOTES:END -->
