---
id: TASK-26
title: Use season-specific valid week selections
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-14 14:01'
labels:
  - data-quality
dependencies: []
documentation:
  - README.md
priority: medium
type: enhancement
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The documented week picker is fixed at 1–18. League and season schedules can differ, so unavailable weeks should not lead writers into confusing empty states.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Week choices reflect the supported schedule for the selected league and season.
- [x] #2 Unavailable selections receive a clear explanation and a safe way to choose another week.
- [x] #3 Historical editions remain accessible and preseason behavior is explicitly defined.

<!-- AC:END -->

## Definition of Done

<!-- DOD:BEGIN -->

- [x] #1 - Tests pass
- [x] #2 Docs updated

<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

Expose provider-derived valid week lists through the authenticated league-info server function. Use ESPN final scoring-period metadata and Sleeper start/playoff settings with season-era NFL limits. Resolve the selected schedule before opening the editor, merge saved edition weeks, move invalid selections safely, and keep saved historical work accessible when provider metadata disappears. Cover provider normalization, RPC output, selection recovery, preseason messaging and saved-only weeks in tests and documentation.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

The rankings studio now loads season-specific week choices from authenticated provider metadata instead of always offering weeks 1–18. ESPN uses its final scoring period; Sleeper uses its configured start and playoff schedule with 17/18-week NFL-era caps and completed-season scoring bounds. Invalid weeks move to the first safe choice with an explanation. Saved editions outside provider metadata remain labeled and selectable, including when an old provider season is unavailable. Preseason limitations and recovery behavior are visible and documented. All 197 tests, lint and typecheck pass; the production build succeeds.
<!-- SECTION:FINAL_SUMMARY:END -->
