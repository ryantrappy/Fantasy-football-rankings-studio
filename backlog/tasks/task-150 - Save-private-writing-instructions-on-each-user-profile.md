---
id: TASK-150
title: Save private writing instructions on each user profile
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-15 15:46'
labels: []
dependencies: []
type: feature
ordinal: 157000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The user has a personal Power Rankings writing guide derived from their old exports. They need to save it with their own account so the site writing assistant can use that voice without making it a default for other users.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Users can load, save, replace, and clear writing instructions in their profile with accessible feedback and preserved drafts on failure.
- [ ] #2 Instructions persist only for the verified account, reject invalid or oversized input, and leave unrelated profile data and consent intact.
- [ ] #3 Writing generation uses the requesting account instructions while retaining factual grounding, output limits, provider choice, consent, and cancellation; another account with no instructions keeps the default behavior.
- [ ] #4 Focused UI, authenticated server-function, persistence, and generation regression checks pass; relevant feature contracts document the behavior.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Store a bounded writing_instructions preference in existing owner-scoped Auth0 user metadata and expose authenticated no-store read/save functions. 2. Add a profile editor with save/clear, loading/retry, unsaved state, and account-change isolation. 3. Include only the requesting user preference in the existing writing prompt, retaining its facts-only talking-point contract. 4. Verify persistence, two-account isolation, UI failure/retry, generation boundaries, typecheck, formatting, and lint; update affected contracts.
<!-- SECTION:PLAN:END -->
