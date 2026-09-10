---
id: TASK-20
title: Archive leagues without losing their rankings
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-10 03:19'
labels:
  - leagues
dependencies: []
documentation:
  - README.md
priority: medium
type: feature
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Old leagues can clutter the active workspace, but deleting their written history would be undesirable.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Owners can archive and restore a league with clear feedback.
- [x] #2 Archived leagues are hidden from the default active picker but remain discoverable in an archive view.
- [x] #3 Archiving retains existing editions and does not change public visibility implicitly.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add an archived flag with owner-checked archive/restore operations; default lists exclude archived leagues while a dedicated management view can list them. Add a Manage leagues route linked from the studio, with explicit archive and restore controls. Preserve ranking documents, private reads and publicReports state. Verify list filtering/ownership/data retention in MongoDB and UI operations; docs and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added owner-only archive/restore operations and a Manage leagues view with active/archive switching. Active pickers exclude archived records; rankings, history and sharing remain intact. Real MongoDB checks verify list filtering, data retention, public visibility and ownership denial; interactive archive/restore test passes. Production build/typecheck/lint pass; README documents archive semantics.
<!-- SECTION:FINAL_SUMMARY:END -->
