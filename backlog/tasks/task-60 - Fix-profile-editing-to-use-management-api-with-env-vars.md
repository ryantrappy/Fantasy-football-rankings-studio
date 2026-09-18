---
id: TASK-60
title: Fix profile editing to use management api with env vars
status: Done
assignee:
  - Codex
created_date: '2026-09-16 20:02'
updated_date: '2026-09-16 20:26'
labels: []
dependencies: []
priority: high
ordinal: 63000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Profile editing is not configured. Contact the site administrator.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Profile reads and updates work when server-only Auth0 M2M credentials are configured, using AUTH0_MANAGEMENT_DOMAIN or a validated AUTH0_ISSUER_BASE_URL fallback.
- [x] #2 The client cannot select another account or modify fields beyond name and nickname; management secrets remain server-only.
- [x] #3 Configuration examples and tests cover deployment setup and missing/invalid values.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Keep the existing Auth0 Management API M2M flow and narrow scopes. Make configuration derive the canonical Management API hostname from AUTH0_MANAGEMENT_DOMAIN when present or the already-required AUTH0_ISSUER_BASE_URL when it is a valid HTTPS Auth0 hostname. Preserve generic public errors and never expose credentials. Add profile-service coverage for fallback and invalid issuer inputs, update deployment documentation, then run checks and commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The Docker Compose env_file already passes server-only variables into the app container. The remaining configuration gap was requiring AUTH0_MANAGEMENT_DOMAIN despite the standard issuer URL already being configured. Fallback is limited to canonical HTTPS *.auth0.com hosts; explicit management domains retain priority.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Profile Management API configuration now derives its hostname from a validated standard AUTH0_ISSUER_BASE_URL when AUTH0_MANAGEMENT_DOMAIN is omitted. The existing M2M client ID/secret requirement, narrow read:users/update:users scope, owner-derived target ID, strict editable-field validation, and generic errors remain unchanged. Added profile-service coverage for issuer fallback and invalid issuer rejection, and documented the deployment behavior. Validation: focused profile/RPC/UI tests (12 tests), TypeScript, lint, and diff checks passed.
<!-- SECTION:FINAL_SUMMARY:END -->
