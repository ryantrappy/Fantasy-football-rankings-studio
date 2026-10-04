---
id: TASK-97
title: Explain the server-managed Codex OAuth path in writing-assistant settings
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 02:43'
updated_date: '2026-10-04 04:26'
labels:
  - writing
  - setup
dependencies: []
references:
  - src/components/ProfilePage.tsx
  - src/components/WritingSuggestions.tsx
  - src/writing.ts
  - src/server/writing-cli.server.ts
  - README.md#sign-in-to-codex-in-docker-with-your-chatgpt-account
documentation:
  - README.md
priority: medium
type: enhancement
ordinal: 104000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The profile prominently offers OpenAI/Anthropic API-key forms, while Codex ChatGPT OAuth is already supported through the administrator's CLI login and WRITING_AI_* allowlist. The user wants to use their Codex account rather than create a key, and currently needs deployment knowledge to understand that option. The README now documents Docker device-code login; expose a clear connection choice/readiness explanation in the product while keeping container login an operator action.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Writing-assistant settings explain both optional per-user API keys and the existing server-managed Codex account path without implying an API key is required.
- [x] #2 An allowlisted user can see server-provider readiness and a useful distinction between disabled, missing CLI, and login-check failure, with a link to the Docker OAuth setup instructions.
- [x] #3 The UI explains that server-managed use shares the administrator's account/quota and that a saved per-user key takes precedence; it offers the existing remove-key action when appropriate.
- [x] #4 No OAuth tokens, credential files, or other users' identifiers are exposed to browser/shared reports, and tests cover OAuth-ready, disabled, and saved-key states.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Expose safe server-login readiness separately from saved-key readiness. Explain the ChatGPT OAuth option, shared quota and key precedence in profile settings with the Docker README link. Refresh readiness after key changes and cover provider states, credential privacy and UI removal with tests.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the optional ChatGPT account path to profile settings with safe allowlist-scoped server readiness, Docker OAuth instructions, shared quota and saved-key precedence/removal guidance. Readiness refreshes after key changes; browser output contains only status enums and no secrets. Provider/UI regression tests pass (18 targeted tests), typecheck and lint pass.
<!-- SECTION:FINAL_SUMMARY:END -->
