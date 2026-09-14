---
id: TASK-30
title: Offer an optional mobile-friendly ranking image
status: Done
assignee: []
created_date: '2026-09-09 21:45'
labels:
  - exports
dependencies: []
documentation:
  - README.md
priority: low
type: feature
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

The fixed wide ranking image is useful for its established format but difficult to read in phone chats. A separate compact export would provide a more readable option.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [x] #1 Writers can explicitly choose a compact export while the existing download remains the default.
- [x] #2 Compact exports preserve all team order and commentary, including long names and descriptions.
- [x] #3 The original desktop/mobile download snapshots remain unchanged; compact output is visually checked for clipping.

<!-- AC:END -->

## Definition of Done

<!-- DOD:BEGIN -->

- [x] #1 - Tests pass
- [x] #2 Docs updated

<!-- DOD:END -->
