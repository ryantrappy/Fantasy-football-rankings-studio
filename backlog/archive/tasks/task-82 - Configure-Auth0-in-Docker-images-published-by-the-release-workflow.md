---
id: TASK-82
title: Configure Auth0 in Docker images published by the release workflow
status: To Do
assignee: []
created_date: '2026-10-03 21:23'
labels:
  - deployment
  - auth
dependencies: []
references:
  - .github/workflows/publish-docker-image.yml
  - Dockerfile
  - .dockerignore
  - src/auth/Authentication.tsx
documentation:
  - README.md
priority: high
type: bug
ordinal: 85000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The release workflow builds and pushes Dockerfile without supplying any VITE_AUTH0_* build arguments. Dockerfile declares those arguments with no defaults, and .dockerignore excludes local .env files. BrowserAuthentication reads the three values from import.meta.env and shows 'Sign-in is not configured' when any is missing. Thus the clean release build can publish an image whose private workspace cannot be opened; supplying these values only at container runtime cannot repair the compiled browser configuration. This is a static workflow/Dockerfile/application review, not a live image or Auth0 tenant test.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 A clean release-workflow image contains the intended public Auth0 domain, SPA client ID, and API audience, and its browser offers sign-in.
- [ ] #2 An attempted release with missing required public authentication configuration fails before pushing an unusable image.
- [ ] #3 A repeatable image or compiled-bundle check covers configured and missing public settings without requiring tenant credentials; server secrets remain outside the browser bundle.
- [ ] #4 Deployment documentation explains where release builds obtain public settings and when an image must be rebuilt.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
