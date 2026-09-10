---
id: TASK-23
title: Copy selected content from a previous edition
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-10 03:22'
labels:
  - editor
dependencies: []
documentation:
  - README.md
priority: medium
type: feature
ordinal: 24000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Weekly writing often builds on the prior edition. Explicit copying can save retyping while giving the writer control over which material carries forward.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The writer can select a source edition and choose whether to copy introduction, team commentary and ordering.
- [x] #2 The destination remains unchanged until the writer confirms, and existing destination content is identified before replacement.
- [x] #3 Missing or renamed teams are explained; unmatched teams are not silently dropped and the source remains unchanged.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add a pure selective-copy helper keyed by stable team ID and a compact editor panel to choose a previous edition and introduction/commentary/order options. Review the selected source and destination replacement warnings before explicit confirmation. Preserve destination identities/records and append unmatched destination teams; report missing/renamed team handling. Verify immutability and interactive confirmation; docs and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added selective copying from previous editions with an explicit review/confirm step, replacement warnings and stable team-ID matching. Unmatched destination teams are retained; source editions remain unchanged. Focused component/helper tests, typecheck and lint pass; README updated.
<!-- SECTION:FINAL_SUMMARY:END -->
