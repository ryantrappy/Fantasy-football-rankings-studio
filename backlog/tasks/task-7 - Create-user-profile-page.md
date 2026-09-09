---
id: TASK-7
title: Create user profile page
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 02:55'
updated_date: '2026-09-09 04:11'
labels: []
dependencies: []
priority: high
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Create page where user can view/edit the auth0 data
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add a private /profile route and session navigation link using the existing authenticated boundary and Chakra form patterns.
2. Read a safe Auth0 profile projection and update only name/nickname through a server-only Management API client. Derive the target exclusively from the verified JWT subject; reject additional input fields. Cache short-lived M2M tokens and sanitize provider failures.
3. Provide loading, retry, save feedback, and draft preservation. Show identity/email verification read-only; document server configuration and social connection synchronization requirements.
4. Verify owner isolation, invalid input, provider failures, token reuse and UI save/retry behavior; run project checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented and verified profile GET/PATCH with server-derived subject, strict field validation, sanitized failures, safe response projection and in-memory M2M token reuse. Eight service/DOM tests plus two RPC authorization tests pass. Full suite at this checkpoint: 121 tests pass (before adding the two RPC tests); production build and typecheck pass. No live tenant writes performed; runtime needs the documented optional Management API settings.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added /profile and a session navigation link to view Auth0 identity/email verification and edit name/nickname. Updates use the verified JWT subject and a server-only Management API client; arbitrary identity/privilege fields are rejected. Accessible loading, retry and save feedback preserve drafts on errors.

Validation: service, DOM and RPC authorization tests cover read/save, token reuse, identity isolation, invalid input, missing configuration, upstream failures and session changes; production build/typecheck and full existing suite pass. README and .env.example document M2M permissions and social profile synchronization. Live editing requires the documented tenant credentials; no tenant configuration or secrets were modified.
<!-- SECTION:FINAL_SUMMARY:END -->
