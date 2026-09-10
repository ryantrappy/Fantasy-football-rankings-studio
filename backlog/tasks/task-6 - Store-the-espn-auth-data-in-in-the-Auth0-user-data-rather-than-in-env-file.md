---
id: TASK-6
title: Store the espn auth data in in the Auth0 user data rather than in env file
status: Done
assignee:
  - Codex
created_date: '2026-09-09 02:55'
updated_date: '2026-09-09 04:00'
labels: []
dependencies: []
modified_files:
  - .env.example
  - README.md
  - scripts/check-local.mjs
  - src/espn-credentials.ts
  - src/api/client.ts
  - src/api/client.test.ts
  - src/auth/Authentication.tsx
  - src/components/EspnSetup.tsx
  - src/components/EspnSetup.test.tsx
  - src/components/CreateLeague.tsx
  - src/routes/_authenticated.espn.tsx
  - src/routeTree.gen.ts
  - src/router.test.tsx
  - src/functions/rankings.functions.ts
  - src/server/espn-credentials.server.ts
  - src/server/models/espn-credentials.model.ts
  - src/server/providers/espn.provider.ts
  - src/server/services/leagues.service.ts
  - src/server/operations.server.ts
  - src/server/logging.server.ts
  - src/server/insights/load.server.ts
  - src/server/insights/seasons.server.ts
  - src/server/insights/public-espn.test.ts
  - src/server/tests/espn-credentials.test.ts
  - src/server/tests/espn-owner-access.test.ts
priority: high
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Scope ESPN cookies to the verified Auth0 user rather than global environment variables. User approved encrypted storage in the existing MongoDB keyed by Auth0 subject (instead of Auth0 metadata) and optional credential entry during first-time application onboarding immediately after signup.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 ESPN credentials are encrypted in MongoDB and scoped exclusively to the verified Auth0 subject; saved cookie values never return through client APIs.
- [x] #2 Users can optionally supply ESPN cookies immediately after signup/sign-in, skip setup, and later replace or remove their credentials.
- [x] #3 Authenticated ESPN operations use only that user's credentials; public reports and Sleeper requests never load them, and ESPN environment-cookie fallback is removed.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Store optional ESPN cookies encrypted with AES-256-GCM in MongoDB under the verified Auth0 subject; bind ciphertext to that subject and expose only setup/status flags. Add server-only encryption-key configuration example; never edit existing .env files.
2. Add authenticated status/save/remove/skip operations with strict cookie validation, sanitized errors, and request-local credential resolution. Public reports never resolve stored credentials, and no provider reads global ESPN cookies.
3. Add optional first-login ESPN setup and a reusable credential settings screen for later replacement/removal. Reuse the app's authentication boundary and Chakra UI components; preserve requested destination after onboarding.
4. Pass owner credentials through league creation, metadata, team/matchup reads, discovery and insights without shared mutable provider instances. Sleeper needs no credential lookup.
5. Test encryption/tamper/subject binding, authorization and write-only responses, per-user concurrent requests, public isolation and UI onboarding. Update setup/migration docs and run tests, build, lint and typecheck.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
TASK-6 is the next high-priority item (ordinal 6000), no dependencies listed. Current ESPN provider reads global ESPN_S2/SWID; LeaguesService also keeps a shared provider instance. User subject already comes from verified server JWTs, and MongoDB is already available. Auth0 docs state metadata is not a secure data store and should not store sensitive information: https://auth0.com/docs/manage-users/user-accounts/metadata/metadata-fields-data . No implementation or environment changes made pending review of the storage change and signup collection point.

User explicitly approved the revised storage and post-signup onboarding approach. Proceeding without Auth0 tenant configuration changes or .env writes.

Implemented encrypted MongoDB credential records, verified-subject RPCs, optional first-login setup, /espn settings, and owner-specific ESPN provider instances across creation, metadata, teams/matchups and insights/history. Global cookie fallback removed; public/Sleeper flows bypass credential resolution. Existing .env files untouched; .env.example and README now document the server encryption key and manual per-user migration.

Initial regression run passed 111 tests across 21 files, with typecheck and lint passing. Adding final integration assertions for setup destination preservation and cached report invalidation after credential replacement/removal. Workspace HEAD changed during implementation (user/external commit e747e81); preserved it and continued on the current workspace.

Final verification: 113 tests passed across 21 files; production build (including TypeScript), lint and git diff --check passed. DOM and real-router tests exercise onboarding, skip/return destination, save/remove/retry, stable setup status and account changes. Backend tests exercise authenticated subject selection, encrypted-only persistence, tamper/owner/key rejection, sanitized failures, concurrent owner cookies, every ESPN service path and public isolation. Client test confirms credential changes invalidate report caches.

Deployment setup remains external: configure ESPN_CREDENTIALS_KEY (64 hex characters) and have each user save their own cookies. Existing environment files were not read or modified. Live MongoDB/Auth0/ESPN validation was not run; tests mock credential persistence/provider calls, while crypto is real and existing auth tests verify JWTs with a local issuer.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Replaced deployment-wide ESPN cookies with credentials encrypted in MongoDB and keyed to the verified Auth0 subject, as approved. AES-256-GCM uses random nonces and subject-bound authenticated data; client responses expose only setup/status flags. All authenticated ESPN paths use request-local owner credentials, while public reports and Sleeper never resolve them. No global ESPN cookie fallback remains.

First-login setup lets users enter cookies or skip, preserving their requested destination. /espn provides write-only replacement/removal. Updated report-cache invalidation, configuration example, migration docs and live-check function count.

Validation: 113 tests across 21 files passed; production build/typecheck, lint and diff checks passed. Deployment requires ESPN_CREDENTIALS_KEY and per-user cookie entry; existing .env files were untouched. No live MongoDB/Auth0/ESPN integration run.
<!-- SECTION:FINAL_SUMMARY:END -->
