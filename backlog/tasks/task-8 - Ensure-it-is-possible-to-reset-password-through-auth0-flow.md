---
id: TASK-8
title: Ensure it is possible to reset password through auth0 flow
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 02:55'
updated_date: '2026-09-09 18:39'
labels: []
dependencies: []
priority: low
ordinal: 8000
---

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add a reusable password-reset entry on the signed-out screen and authenticated profile. Open Auth0 Universal Login with prompt=login to avoid SSO skipping the form; explain the hosted Forgot password step and external-provider reset distinction. Cover redirect parameters, pending/error/retry behavior with SDK mocks. Document tenant database/reset-email requirements and manual end-to-end verification; build/test/lint and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added password recovery entry points to signed-out authentication and the authenticated profile. Uses Auth0 SDK Universal Login with prompt=login and preserved return path; explains hosted recovery and external-provider passwords. Pending state, safe failure and retry are covered with SDK mocks. All 156 tests, build/typecheck and lint pass. README documents database connection/reset email requirements and live verification procedure. No tenant settings changed or live reset emails sent; tenant email delivery remains a deployment verification step.
<!-- SECTION:FINAL_SUMMARY:END -->
