---
id: TASK-12
title: Load the ESPN encryption key during local development
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 04:17'
updated_date: '2026-09-09 11:52'
labels: []
dependencies: []
priority: medium
type: bug
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Vite configuration loads an explicit list of server environment variables from .env but omits ESPN_CREDENTIALS_KEY. As a result, npm run dev can report that ESPN credential storage is not configured even when the key is present in the documented .env file. Production start loads environment files separately.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A valid ESPN_CREDENTIALS_KEY in .env or .env.local is available to server code in npm run dev without an extra shell export.
- [x] #2 The key stays server-only and never enters the client bundle.
- [x] #3 Existing process environment overrides retain precedence, with a regression check for development configuration.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add ESPN_CREDENTIALS_KEY to the existing server-only development environment allowlist, preserving shell overrides and Vite's default public prefix.
2. Test the Vite configuration with a mocked environment loader and verify a build with a synthetic key contains no key value in public assets.
3. Update local setup documentation; run configuration tests, build/typecheck and lint.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Configuration regression passes: file key is loaded and an existing shell value wins. Production build/typecheck succeeded with a synthetic 64-character key; recursive inspection of every public asset confirmed the key was absent. README updated.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Local Vite development now loads ESPN_CREDENTIALS_KEY alongside other server settings while retaining shell override precedence. Added a configuration regression and setup documentation. Verified a production build with a synthetic key contains no key value in browser assets; build/typecheck pass.
<!-- SECTION:FINAL_SUMMARY:END -->
