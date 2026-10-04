---
id: TASK-100
title: Redesign the public sign-in page with clear spacing and visible actions
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 04:38'
updated_date: '2026-10-04 05:05'
labels: []
dependencies: []
references:
  - src/auth/Authentication.tsx
  - src/auth/PasswordReset.tsx
  - src/index.css
priority: medium
type: enhancement
ordinal: 107000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The current unauthenticated screen is a placeholder panel. Present the fantasy analytics workspace with a finished responsive layout, clear sign-in and recovery actions, consistent spacing, and comfortable button targets.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The signed-out page presents the NFL analytics capabilities with a cohesive responsive visual layout and clear primary sign-in action.
- [x] #2 Section spacing, typography and mobile touch targets are consistent; action buttons have visible boundaries or filled backgrounds instead of appearing as plain text.
- [x] #3 Existing Auth0 redirects, password recovery and session loading/error states remain functional and accessible.
- [x] #4 Desktop and phone browser checks verify layout, accessible controls and no horizontal overflow.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Build a responsive signed-out landing layout with clear feature copy and a labeled illustrative workspace preview. Preserve Auth0 redirects/recovery and style loading/unconfigured states. Diagnose text-only buttons in the Chakra reset, fix the cascade, and verify spacing, contrast, focus, touch targets and phone overflow in browser tests.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Visually reviewed desktop and phone screenshots. Seven browser checks passed, including axe contrast/accessibility, visible button boundaries, touch heights, live workspace regressions and managed-team save/full-reload on mobile. Changed-file lint and typecheck pass; production build passes. Repository-wide lint remains blocked by the separately edited DataTable aria-description attribute.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced the placeholder signed-out screen with a responsive analytics landing page, illustrative workspace preview and clear sign-in/recovery actions. Preserved redirects, loading/error handling and private hydration boundaries. Added visible boundaries to plain/ghost actions and table sorting, 44px minimum action heights and a responsive managed-team form. Verified full unit suite, seven browser checks, production build and changed-file lint/typecheck.
<!-- SECTION:FINAL_SUMMARY:END -->
