---
id: TASK-36
title: Move playoff simulation into its own tab
status: Done
assignee:
  - '@codex'
created_date: '2026-09-10 03:22'
updated_date: '2026-09-10 03:23'
labels: []
dependencies: []
priority: medium
type: enhancement
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
User requested a separate tab for playoff simulations rather than embedding them among season statistics.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A clearly labeled Playoff simulation tab presents the existing forecast and controls.
- [x] #2 Season statistics no longer embed the forecast; league and season context and shared access remain available.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add private and shared /playoffs routes using the existing season loader with a dedicated forecast view. Add a navigation tab preserving league/year, remove embedded forecast from statistics, and generate share links to the new view. Build generated routes, verify existing forecast and report checks, update README and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Moved the forecast into a dedicated Playoff simulation navigation tab with private and shared routes. Navigation preserves league/season; simulation share links open the new view. Season insights no longer render the forecast. Production build/typecheck, lint and eight forecast/public-report tests passed. README updated.
<!-- SECTION:FINAL_SUMMARY:END -->
