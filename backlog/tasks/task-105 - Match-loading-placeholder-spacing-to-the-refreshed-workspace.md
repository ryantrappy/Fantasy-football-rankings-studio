---
id: TASK-105
title: Match loading placeholder spacing to the refreshed workspace
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 14:10'
updated_date: '2026-10-04 14:20'
labels: []
dependencies: []
ordinal: 112000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Loading states still use inline output and older panel spacing after the visual refresh. Align main loading placeholders with workspace card spacing and keep the rankings heading visible during loading.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Main loading placeholders share consistent block layout, card padding, line spacing and responsive spacing with the refreshed UI.
- [x] #2 Rankings retains the same page heading while loading and loaded; loading announcements and history progress remain accessible.
- [x] #3 Desktop and mobile loading states fit their containers and transition correctly into loaded content.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
- [x] #3 Relevant tests and checks pass
- [x] #4 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Review existing loading branches; introduce shared workspace loading treatment without changing fetch behavior; verify delayed desktop/mobile states and loaded transitions.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Replaced older inline loading outputs with a shared LoadingSkeleton and block-level workspace card treatment across rankings, Players, trades, overview, reports, league management and account settings. Uses responsive 16px/24px padding, consistent 12px line gaps and 24px section spacing; account containers reuse their existing padding. Rankings and ESPN settings keep their page headings while loading. History reserves the league selector during catalog loading to prevent header/page shifts, and retains its existing season progress indicator and announcements. Fetch behavior and data semantics are unchanged.

Added controlled delayed-data UI fixtures and browser checks across ten loading views at desktop and phone widths, checking spacing, containment, fixed heading alignment and transitions into loaded content. Visually checked mobile rankings and profile placeholders. Validation: 63 relevant component/router unit tests passed; 14 relevant browser tests passed across loading spacing, loaded workspace, editor layout, Players and trades (including final 6-test loading/workspace rerun). Production build/typecheck, lint, changed-file formatting and whitespace checks pass. README documents loading layout behavior.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aligned main loading placeholders with workspace spacing and retained headings/header space during data loads. Verified ten delayed-data screens on desktop/mobile, loaded transitions, relevant tests and production build.
<!-- SECTION:FINAL_SUMMARY:END -->
