---
id: TASK-16
title: Prevent simultaneous editors from silently overwriting rankings
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-09 23:20'
labels:
  - editor
dependencies: []
documentation:
  - README.md
priority: high
type: enhancement
ordinal: 16000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The same writer may open multiple tabs or devices. A stale save should not silently replace a newer edition.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Saving a stale edition reports a conflict and preserves the local draft.
- [x] #2 The writer can inspect the newer saved edition before choosing a resolution.
- [x] #3 Two overlapping saves are covered by a regression scenario demonstrating no silent data loss.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add server-managed revision numbers and atomic compare-and-swap updates for both ranking update entry points, treating legacy missing revisions as zero. Return revisions through private RPC and preserve them during serialized autosave, excluding metadata from dirty signatures. On HTTP409 preserve the local draft, fetch the latest saved edition for inspection, and require explicit choice to use server content or retry local content against that inspected revision. Add service concurrency and editor conflict tests, docs, validation and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added server-managed revision numbers and atomic compare-and-swap updates by ID and by week, including legacy revision-zero records. Stale saves return 409 and preserve the local draft. Writers can load and inspect remote title/intro/commentary, choose remote content or retry local content against the inspected revision. The full 167-test suite and 11 focused tests including an overlapping-writer service simulation and interactive conflict recovery pass; production build/typecheck and lint pass. README documents client revision semantics.
<!-- SECTION:FINAL_SUMMARY:END -->
