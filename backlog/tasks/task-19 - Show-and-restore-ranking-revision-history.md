---
id: TASK-19
title: Show and restore ranking revision history
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-10 03:14'
labels:
  - editor
dependencies: []
documentation:
  - README.md
priority: medium
type: feature
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Writers should be able to recover an earlier saved edition after an accidental edit and understand how it changed.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Owners can list saved revisions of an edition with timestamps.
- [x] #2 A revision preview shows title, introduction, order and commentary before restoration.
- [x] #3 Restoring an older revision creates a new current revision without erasing history or exposing another owner's data.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Capture the previous edition snapshot and saved timestamp atomically with each revision-checked update in the ranking document. Add owner-only history and restore operations; restoration uses the existing compare-and-swap update and produces a new revision. Add an editor history panel with preview and explicit restore, disabled while edits are pending. Verify real MongoDB restoration/ownership and interactive preview behavior, document limits and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added atomic pre-save revision snapshots with timestamps, owner-only list/restore RPCs and an editor preview/restore panel. Restoring produces a new revision without altering publications. Real MongoDB rehearsal verifies revision order, restored commentary and cross-owner denial; interactive DOM preview test passes. Build output, corrected test typecheck, lint and diff checks pass. README documents rollout and document-size limits.
<!-- SECTION:FINAL_SUMMARY:END -->
