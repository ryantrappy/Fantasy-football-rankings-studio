---
id: TASK-17
title: Separate private drafts from published ranking editions
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-09 23:23'
labels:
  - publishing
dependencies: []
documentation:
  - README.md
priority: high
type: feature
ordinal: 17000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Writers need a deliberate publication step so readers see a finished edition while edits remain private.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Owners can publish and unpublish a selected weekly edition explicitly.
- [x] #2 A public read-only link shows only the published version, including while its draft is being edited.
- [x] #3 Unpublished editions and draft content are unavailable to anonymous readers; the original PNG format stays unchanged.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Store explicit published snapshots separately from mutable rankings, with opaque public IDs and owner-verified publish/status/unpublish RPCs. Publish only after flushing the editor and require the inspected revision to match; editing drafts never changes the snapshot. Render an anonymous responsive read-only edition route that reads only published snapshots with no-store responses. Add publish controls and explicit unpublish confirmation, tests for ownership/snapshot isolation/revocation and UI flow, docs, full validation and commit. Existing PNG markup/CSS remain unchanged.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added explicit owner-only publish/status/unpublish controls backed by separate immutable-at-publication snapshots and opaque public links. Public read-only pages expose only the chosen saved snapshot; draft changes do not alter it, stale publish requests fail and unpublishing revokes the link. Tests prove snapshot isolation, ownership checks, stale revision rejection and explicit UI publish/revoke behavior. All 172 tests and 14 browser checks pass, including original PNG snapshots; build/typecheck/lint pass. README documents sharing semantics. Found and logged unrelated integration-script count bug as medium TASK-35.
<!-- SECTION:FINAL_SUMMARY:END -->
