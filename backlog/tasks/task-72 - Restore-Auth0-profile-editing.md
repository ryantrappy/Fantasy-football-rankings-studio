---
id: TASK-72
title: Restore Auth0 profile editing
status: Done
assignee:
  - Codex
created_date: '2026-09-20 19:05'
updated_date: '2026-09-20 19:18'
labels: []
dependencies: []
references:
  - >-
    backlog/tasks/task-60 -
    Fix-profile-editing-to-use-management-api-with-env-vars.md
modified_files:
  - src/server/profile.server.ts
  - src/server/tests/profile.test.ts
  - README.md
  - docs/backup-recovery.md
priority: high
type: bug
ordinal: 75000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Signed-in users currently receive a generic Auth0 profile-request failure when opening or saving their profile, so the profile feature cannot reliably read or update the current account in the deployed tenant. The failure must be diagnosed against the live tenant while preserving server-only credentials and owner isolation.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The current signed-in user's profile can be loaded and saved through the deployed Auth0 tenant.
- [ ] #2 The Auth0 application has only the Management API access needed to read and update users.
- [ ] #3 Automated coverage reproduces the identified failure mode and prevents regression without exposing credentials or upstream response bodies.
- [ ] #4 Relevant configuration and verification guidance reflects the working deployment requirements.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Verify the live Auth0 M2M client and its Management API grant against tenant configuration and recent failure logs. 2. Correct the deployed server-only Management API client credentials/grant without changing the SPA client. 3. Add configuration validation and focused tests for the observed resource-server-ID-as-client-ID failure, preserving generic handling for unknown upstream errors. 4. Update deployment guidance and run focused plus repository checks. 5. Re-test the live profile flow and record objective evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Auth0 MCP logs at 2026-09-20T18:58Z show feccft Unauthorized for client_id 613b7c1a5ee51d004637b4c4, audience https://dev-voqmvc1s.us.auth0.com/api/v2/, scope read:users update:users. The tenant identifies 613b... as the Management API resource-server ID; the valid non-interactive M2M application is NSvzCFQzIb5txs9gXcgx61k38r2U0rdt (secret redacted). A local redacted token check reproduced HTTP 401 with client ID length 24 and no secret output.

Added fail-fast validation and regression coverage for a 24-character hexadecimal resource-server ID, documented the distinction between M2M client ID and API ID, and removed stale trappserv.er references from project docs. Focused profile/function tests (10) and typecheck pass.
<!-- SECTION:NOTES:END -->
