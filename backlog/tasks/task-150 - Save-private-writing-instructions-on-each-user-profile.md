---
id: TASK-150
title: Save private writing instructions on each user profile
status: Done
assignee:
  - '@codex'
created_date: '2026-10-15 15:46'
updated_date: '2026-10-15 19:37'
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
- [x] #1 Users can load, save, replace, and clear writing instructions in their profile with accessible feedback and preserved drafts on failure.
- [x] #2 Instructions persist only for the verified account, reject invalid or oversized input, and leave unrelated profile data and consent intact.
- [x] #3 Writing generation uses the requesting account instructions while retaining factual grounding, output limits, provider choice, consent, and cancellation; another account with no instructions keeps the default behavior.
- [x] #4 Focused UI, authenticated server-function, persistence, and generation regression checks pass; relevant feature contracts document the behavior.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Store a bounded writing_instructions preference in existing owner-scoped Auth0 user metadata and expose authenticated no-store read/save functions. 2. Add a profile editor with save/clear, loading/retry, unsaved state, and account-change isolation. 3. Include only the requesting user preference in the existing writing prompt, retaining its facts-only talking-point contract. 4. Verify persistence, two-account isolation, UI failure/retry, generation boundaries, typecheck, formatting, and lint; update affected contracts.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified on October 15, 2026: 95 focused Vitest checks across 10 files pass; the corrected optional fetcher mock also passes all 17 API client checks and full typecheck. Both desktop (1440px) and mobile (390px) Playwright save/clear flows pass with long multiline text, retained view-switch drafts, overflow checks, and WCAG2 A/AA axe checks. Production build, full oxlint, touched-file formatting, and git diff --check pass. Tests exercise two-account persistence and prompt isolation using mocked Auth0 and CLI providers; no live account settings or provider calls were changed. The generated personal guide is 8,929 characters, within the 20,000-character limit.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added an account-scoped writing-instructions editor under Profile > Writing connections with load/retry, save/replace/clear, preserved failed-write drafts, and stale-account response protection. Instructions persist under the verified Auth0 subject and are included only in that user writing requests; default users receive no personal guide. Existing factual context, output limits, consent, provider choices, and cancellation remain. Verified with 95 focused tests, two browser/accessibility flows, typecheck, production build, lint, and formatting; README and account/rankings contracts updated.
<!-- SECTION:FINAL_SUMMARY:END -->
