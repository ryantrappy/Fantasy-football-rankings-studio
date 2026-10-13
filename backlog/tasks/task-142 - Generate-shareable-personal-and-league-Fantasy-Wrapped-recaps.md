---
id: TASK-142
title: Generate shareable personal and league Fantasy Wrapped recaps
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-13 18:22'
updated_date: '2026-10-13 18:46'
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
- [ ] #4 The layout is readable on mobile and produces a clear share preview.
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
<!-- SECTION:NOTES:END -->
