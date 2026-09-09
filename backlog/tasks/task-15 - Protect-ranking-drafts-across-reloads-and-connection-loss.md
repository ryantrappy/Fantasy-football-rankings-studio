---
id: TASK-15
title: Protect ranking drafts across reloads and connection loss
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-09 23:18'
labels:
  - editor
dependencies: []
documentation:
  - README.md
priority: high
type: enhancement
ordinal: 15000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Writers can spend significant time composing weekly commentary. A browser reload, interrupted connection or expired session should not force them to recreate unsaved work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 An unsaved edition can be recovered after a reload with its title, introduction, order and commentary intact.
- [x] #2 Recovery is isolated by account, league, season and week; another signed-in account cannot see the draft.
- [x] #3 The writer can choose whether to restore or discard a recovered draft without silently replacing saved content.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Persist draft snapshots synchronously when the editor updates, in browser local storage keyed by verified session subject plus league/year/week. Offer explicit restore/discard after server data loads, suspend autosave while recovery is pending, and remove snapshots only when that exact content is saved. Surface storage failures without interrupting editing. Add reload, account isolation, discard and save-failure tests, docs and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Synchronous browser draft snapshots now preserve unsaved ranking content by account/league/year/week. Reload offers explicit restore/discard and blocks mutation/saving until decided; matching snapshots clear only after a successful save. Storage failures are surfaced without losing in-memory edits. Nine editor-hook tests pass, including full draft restoration, account isolation and discard, plus build/typecheck and lint. README documents recovery and local-storage limitations.
<!-- SECTION:FINAL_SUMMARY:END -->
