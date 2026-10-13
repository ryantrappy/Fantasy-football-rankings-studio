---
id: TASK-142
title: Generate shareable personal and league Fantasy Wrapped recaps
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:49'
labels:
  - historical-analytics
dependencies: []
type: feature
ordinal: 149000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The product opportunity is to tell the story of a fantasy league, but there is no end-of-season recap designed for sharing. Create personal and league-wide Wrapped summaries with season records, expected performance, luck, rivalries, best and worst results, pickups, lineup decisions and manager archetypes where supported.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A personal recap summarizes one manager’s selected season with record, expected wins/luck, rivalries, best and worst matchup, pickups, lineup choices and supported player/archetype highlights.
- [x] #2 A league recap highlights champion, scoring leader, luck extremes, upsets, closest game, blowout, pickup, trade and rivalry of the year where data exists.
- [x] #3 Recaps disclose data coverage and omit unsupported claims; each can be shared through an intentional public snapshot with privacy controls.
- [x] #4 The layout is readable on mobile and produces a clear share preview.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Build selected-season personal and league story cards from verified existing season evidence with coverage disclosure. 2. Add responsive preview, selector and explicit snapshot sharing/privacy controls. 3. Persist only card payload for Wrapped snapshots and render immutable preview without raw history. 4. Test recap calculations, selectors, snapshot privacy and public payload roundtrip.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
41 targeted tests pass: personal and league story calculations incl lineup/player/archetype/trade, manager selection and intentional card-only snapshot publishing, privacy schema rejection, Sleeper snapshot roundtrip, owner/sharing revocation, share metadata. Typecheck and focused lint pass. Responsive DOM structure tested; real browser mobile verification pending lead integration, so AC4 remains unchecked and task In Progress.

Lead integration verified in real Chrome at 390px: all three analytics tabs and all details opened; Wrapped preview/coverage rendered without page overflow or errors (tests/ui/history-analytics.spec.ts). Added safeguards/tests for missing/NaN/infinite and duplicate team/week scores: no false tie, matchup or player-impact highlights. Explicit covered-week activity test added. 61 targeted tests, typecheck and focused lint pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Delivered selected-season personal and league Wrapped cards, responsive share preview and intentional cards-only public snapshots with existing ownership, sharing revocation and expiry controls. Verified with 61 targeted tests, typecheck, focused lint and lead real-Chrome 390px integration exercise without overflow/errors.
<!-- SECTION:FINAL_SUMMARY:END -->
