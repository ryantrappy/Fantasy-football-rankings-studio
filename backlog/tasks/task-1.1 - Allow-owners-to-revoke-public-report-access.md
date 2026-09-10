---
id: TASK-1.1
title: Allow owners to revoke public report access
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-10 03:16'
labels:
  - sharing
dependencies: []
documentation:
  - README.md
parent_task_id: TASK-1
priority: medium
type: enhancement
ordinal: 20000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Shared season and history reports currently use publicly readable registered-league URLs. Owners need control when a link should stop being accessible.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Owners can disable public access to their season and history reports and see the current sharing state.
- [x] #2 Disabled access is enforced for direct URLs and report data requests, including previously issued links.
- [x] #3 The chosen behavior for existing shared links is documented; owner access continues to work.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add an owner-controlled publicReports flag with legacy default enabled. Enforce it in the shared league lookup used by every public report RPC, preserving private reads. Add authenticated sharing status/toggle controls beside report sharing with clear enabled/disabled feedback. Test public denial and owner access plus toggle UI; document existing-link behavior and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added owner-only report-sharing controls and enforced publicReports on the shared lookup used by every anonymous report endpoint. Existing leagues stay enabled unless disabled; re-enabling restores existing links, and owner reads remain available. Real MongoDB tests verify disable/enable and non-owner denial; seven focused server/DOM tests, build/typecheck and lint pass. README describes existing-link and already-copied-data behavior.
<!-- SECTION:FINAL_SUMMARY:END -->
