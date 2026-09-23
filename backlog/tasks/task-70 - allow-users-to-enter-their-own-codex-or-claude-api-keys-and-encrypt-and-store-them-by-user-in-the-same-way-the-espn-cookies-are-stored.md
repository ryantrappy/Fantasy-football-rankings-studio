---
id: TASK-70
title: >-
  allow users to enter their own codex or claude api keys and encrypt and store
  them by user in the same way the espn cookies are stored
status: Done
assignee:
  - Codex
created_date: '2026-09-20 18:47'
updated_date: '2026-09-20 19:23'
labels: []
dependencies: []
modified_files:
  - .env.example
  - README.md
  - docker-compose.yml
  - docs/backup-recovery.md
  - vite.config.ts
  - src/ai-credentials.ts
  - src/functions/ai-credentials.functions.ts
  - src/api/client.ts
  - src/components/ProfilePage.tsx
  - src/components/ProfilePage.test.tsx
  - src/server/ai-credentials.server.ts
  - src/server/models/ai-credentials.model.ts
  - src/server/operations.server.ts
  - src/server/logging.server.ts
  - src/server/writing-cli.server.ts
  - src/server/writing.server.ts
  - src/server/tests/ai-credentials.test.ts
  - src/server/tests/environment.test.ts
  - src/server/tests/writing-cli.test.ts
  - src/server/tests/writing.test.ts
priority: medium
ordinal: 73000
---

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a dedicated per-user AI credential model/service using AES-256-GCM with fresh nonces and Auth0-subject AAD, protected by a server-only 64-hex `AI_CREDENTIALS_KEY`; expose only configured flags.
2. Add authenticated GET/POST server functions and typed API methods for credential status, save, and removal. Validate provider keys server-side and keep all key material out of responses/logs.
3. Add an accessible Profile settings form for optional OpenAI (Codex) and Anthropic (Claude) keys, including replacement/removal and error handling.
4. Update writing-provider availability and CLI spawning so a configured per-user key enables only its matching installed provider; pass it only as `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to the temporary child process. Preserve the existing administrator-login behavior as fallback.
5. Cover encryption/owner isolation, API authorization, profile interactions, provider selection, and child-process environment; update deployment/backup documentation and run focused plus full verification.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Started investigation: mapping the existing ESPN cookie encryption/storage flow and user settings surfaces before recording an implementation plan.

Implemented per-user AI credential storage and profile controls. Verified with focused tests, full `npm test` (60 files/295 tests), `npm run typecheck`, `npm run lint`, `npm run format:check`, and `npm run build`. The Profile DOM test exercises saving a Codex key and confirms the key is cleared rather than rendered.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented encrypted per-user OpenAI/Codex and Anthropic/Claude API-key support. Added an owner-bound AES-256-GCM credential collection with opaque status-only APIs, Profile save/replace/remove controls, and isolated CLI environment injection (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY`) for only the matching user's temporary writing request. Existing server-managed CLI login remains the fallback. Added runtime configuration, redaction, backup/deployment documentation, and coverage for encryption, ownership isolation, auth, UI behavior, provider selection, and child-process secret isolation.

Verification: focused Vitest suite; full `npm test` (60 files, 295 tests); `npm run typecheck`; `npm run lint`; `npm run format:check`; `npm run build`; and `git diff --check`.
<!-- SECTION:FINAL_SUMMARY:END -->
