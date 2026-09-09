---
id: TASK-6
title: Store the espn auth data in in the Auth0 user data rather than in env file
status: In Progress
assignee:
  - Codex
created_date: '2026-09-09 02:55'
updated_date: '2026-09-09 03:51'
labels: []
dependencies: []
priority: high
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Scope ESPN cookies to the verified Auth0 user rather than global environment variables. User approved encrypted storage in the existing MongoDB keyed by Auth0 subject (instead of Auth0 metadata) and optional credential entry during first-time application onboarding immediately after signup.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ESPN credentials are encrypted in MongoDB and scoped exclusively to the verified Auth0 subject; saved cookie values never return through client APIs.
- [ ] #2 Users can optionally supply ESPN cookies immediately after signup/sign-in, skip setup, and later replace or remove their credentials.
- [ ] #3 Authenticated ESPN operations use only that user's credentials; public reports and Sleeper requests never load them, and ESPN environment-cookie fallback is removed.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
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
<!-- SECTION:NOTES:END -->
