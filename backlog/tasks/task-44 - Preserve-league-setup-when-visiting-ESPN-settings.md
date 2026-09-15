---
id: TASK-44
title: Preserve league setup when visiting ESPN settings
status: Done
assignee:
  - '@codex'
created_date: '2026-09-14 22:06'
updated_date: '2026-09-15 03:27'
labels:
  - onboarding
  - navigation
dependencies: []
documentation:
  - README.md
modified_files:
  - README.md
  - src/auth/Authentication.tsx
  - src/components/CreateLeague.tsx
  - src/components/EspnSetup.test.tsx
  - src/components/EspnSetup.tsx
  - src/league-setup-draft.test.ts
  - src/league-setup-draft.ts
  - src/router.test.tsx
  - src/routes/_authenticated.espn.tsx
priority: medium
type: bug
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The first-league form links private ESPN users to ESPN settings with a normal page load. Following that link can discard the selected provider, entered league ID, display name, and season, and saving credentials does not return the user to the import they were completing.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Opening ESPN settings from league creation uses application navigation and preserves the non-secret league form values for the current account.
- [x] #2 Saving or intentionally skipping ESPN credential setup returns the user to league creation with the preserved values and a clear next action.
- [x] #3 Completing or cancelling league creation clears the temporary form state, and no ESPN cookies or account tokens are stored with it.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add validated, account-scoped session storage for only provider, league ID, display name, and season; hydrate and clear it from league creation at the correct lifecycle points.
2. Replace the full-page ESPN link with TanStack Router navigation carrying a narrowly validated return target, and return after save or an explicit continue-without-credentials action.
3. Cover detour restoration, reload/account isolation, direct settings behavior, and draft clearing; update documentation and run project checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Observed while reviewing the private-ESPN guidance added to `CreateLeague`. Cover browser back/forward navigation, direct visits to `/espn`, account isolation, and a reload during the settings detour. Prefer validated route state or account-scoped temporary storage; never persist credential values in this draft.

Implemented an account-scoped sessionStorage draft containing only the league provider, provider league ID, display name, and season. The ESPN detour uses TanStack Router with a validated return target, returns after save or explicit continuation, and clears the draft on creation or cancellation. Direct ESPN settings visits retain their existing behavior.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
League creation now survives the ESPN credentials detour and reloads without persisting secrets. Saving or skipping credentials returns to a clearly restored form, while successful creation and cancellation remove the temporary account-scoped draft. Added unit and router coverage and documented the lifecycle.
<!-- SECTION:FINAL_SUMMARY:END -->
