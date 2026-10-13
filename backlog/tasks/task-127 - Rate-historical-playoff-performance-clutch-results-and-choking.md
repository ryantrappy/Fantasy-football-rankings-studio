---
id: TASK-127
title: 'Rate historical playoff performance, clutch results and choking'
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:46'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 134000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The app forecasts playoff qualification and championships, but it does not summarize what managers historically do once playoffs begin or in high-pressure games. Add postseason performance, must-win clutch results, and a carefully contextualized choker rating for strong regular-season teams that repeatedly underperform in playoffs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Managers can compare regular-season and playoff performance across completed seasons with sample sizes.
- [x] #2 Must-win and playoff performance definitions are explicit and include the games counted.
- [x] #3 Choker or clutch labels require sufficient evidence and are presented as descriptive statistics, not predictions.
- [x] #4 Missing brackets, byes and unsupported provider outcomes remain unknown.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add explicit provider-verified championship-path playoff series with complete round scores; compare regular/postseason samples, elimination must-win evidence and thresholded descriptive labels; preserve unknown/byes/consolation and test provider mappings and UI.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added explicit provider-verified completed playoff series, regular/playoff comparison, elimination must-win evidence and sample-qualified descriptive labels. Unknown brackets/byes/ESPN elimination status preserved. Forty-four relevant tests and typecheck pass, including provider mapping and DOM checks.
<!-- SECTION:FINAL_SUMMARY:END -->
