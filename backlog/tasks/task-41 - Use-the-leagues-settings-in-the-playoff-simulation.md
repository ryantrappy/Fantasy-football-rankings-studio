---
id: TASK-41
title: Use the league's settings in the playoff simulation
status: Done
assignee:
  - '@codex'
created_date: '2026-09-15 02:56'
updated_date: '2026-09-15 12:12'
labels: []
dependencies: []
modified_files:
  - README.md
  - src/server/insights/load.test.ts
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
pull the settings for the league and use that in the playoff simulations
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Provider-derived regular-season and playoff-team settings reach report data.
- [x] #2 Playoff simulation uses the configured team count and regular-season cutoff.
- [x] #3 Forecast behavior remains safe when provider settings are unavailable.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Verify the provider loaders expose configured regular-season end and playoff-team count in report data for both provider paths.
2. Add an integration-level regression assertion that the playoff forecast consumes those settings for bracket sizing and simulation cutoff.
3. Document the provider-settings behavior, run checks, finalize the task, and commit the task files.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The provider loaders already expose PlayoffSettings from Sleeper playoff_week_start/playoff_teams and ESPN scheduleSettings matchupPeriodCount/playoffTeamCount. Added regression coverage that loads the ESPN settings through the report pipeline, passes them into forecastPlayoffs, and verifies the configured four-team bracket. Documented that simulations use provider cutoff and team count and do not infer either from visible teams.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Playoff simulations now have regression coverage proving provider league settings reach the report and control bracket sizing and simulation cutoff. Added provider-settings documentation; existing safe fallback remains when settings are unavailable. All 242 tests, formatting, typecheck, lint, and production build pass.
<!-- SECTION:FINAL_SUMMARY:END -->
