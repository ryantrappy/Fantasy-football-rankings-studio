---
id: TASK-24
title: Use the correct historical record in weekly rankings
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-10 03:26'
labels:
  - data-quality
dependencies: []
documentation:
  - README.md
priority: medium
type: bug
ordinal: 25000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The README states that provider records are season-to-date rather than reconstructed for the selected historical week. An older ranking can therefore display wins and losses from later games.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Historical editions display team records through the selected week for supported providers.
- [x] #2 When historical records cannot be established, the UI identifies that limitation rather than presenting current records as historical.
- [x] #3 Regression fixtures include an older week followed by additional wins, losses and ties; exported records match the selected week.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Reconstruct selected-week regular-season records from completed provider matchups, excluding later/unfinished games. Handle supported median scoring and ESPN period boundaries; surface a clear historical-record error when completeness or unsupported scoring rules prevent reconstruction. Preserve already-saved editions. Add older-week regression fixtures and document coverage.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Historical reconstruction is limited to regular-season head-to-head scoring. Sleeper median-game leagues explicitly return the historical-record limitation; provider identity-only reads used by insight reports remain unchanged. ESPN multi-week periods count only after the entire period completes. Saved editions are preserved.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
New editions reconstruct completed regular-season records through the selected week for Sleeper head-to-head and ESPN H2H_POINTS. ESPN multi-week matchups count only when fully completed. Missing history/unsupported formats show an explicit limitation instead of current standings; saved editions remain unchanged. Regression fixtures verify later wins/losses/ties, unfinished periods and exported records. Full suite had 180 passing tests and one outdated ownership fixture; corrected fixture and focused nine tests, typecheck and lint pass. README documents coverage.
<!-- SECTION:FINAL_SUMMARY:END -->
