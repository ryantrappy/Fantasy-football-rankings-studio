---
id: TASK-44
title: Preserve league setup when visiting ESPN settings
status: To Do
assignee: []
created_date: '2026-09-14 22:06'
labels:
  - onboarding
  - navigation
dependencies: []
documentation:
  - README.md
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

- [ ] #1 Opening ESPN settings from league creation uses application navigation and preserves the non-secret league form values for the current account.
- [ ] #2 Saving or intentionally skipping ESPN credential setup returns the user to league creation with the preserved values and a clear next action.
- [ ] #3 Completing or cancelling league creation clears the temporary form state, and no ESPN cookies or account tokens are stored with it.

<!-- AC:END -->

## Definition of Done

<!-- DOD:BEGIN -->

- [ ] #1 Tests pass
- [ ] #2 Docs updated

<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Observed while reviewing the private-ESPN guidance added to `CreateLeague`. Cover browser back/forward navigation, direct visits to `/espn`, account isolation, and a reload during the settings detour. Prefer validated route state or account-scoped temporary storage; never persist credential values in this draft.

<!-- SECTION:NOTES:END -->
