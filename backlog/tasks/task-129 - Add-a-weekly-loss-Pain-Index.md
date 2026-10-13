---
id: TASK-129
title: Add a weekly loss Pain Index
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:52'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 136000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
A close loss or a high-scoring loss can feel worse than an ordinary defeat, but the app has no way to surface the most painful historical weeks. Add an explainable weekly Pain Index using factors such as margin, scoring rank, opponent score and documented late-week swing data when available.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The index ranks a manager’s most painful losses and shows the factors and source data behind each score.
- [x] #2 Unavailable components are excluded or labeled; scores remain comparable only where the same components are available.
- [x] #3 The feature avoids claiming emotional certainty and presents the index as playful league context.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Rank weekly losses using explainable normalized closeness, full-week scoring percentile/opponent percentile and documented pre-Monday expectation when archived; isolate component-coverage cohorts, expose manager controls and per-loss evidence; verify missing components/ties/series and UI.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added explainable weekly loss Pain Index, manager selection and separate component-coverage cohorts, using documented archived expectations only where available. Thirty-three focused calculation/DOM tests, TypeScript and scoped lint pass. Also completed record-book individual scores for bye/unpaired weeks and shared report links.
<!-- SECTION:FINAL_SUMMARY:END -->
