---
id: TASK-62
title: Add example values commented out to docker-compose file for easy configuration
status: Done
assignee:
  - Codex
created_date: '2026-09-16 20:18'
updated_date: '2026-09-16 20:26'
labels: []
dependencies: []
priority: medium
ordinal: 65000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 docker-compose.yml contains commented examples for the app, Mongo persistence, Auth0 browser settings, and optional server-only integrations.
- [x] #2 Examples distinguish build-time VITE settings from runtime server-only values and never include a usable credential.
- [x] #3 Compose configuration remains valid and deployment documentation points users to the examples.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add concise commented configuration examples beside the Docker Compose services, covering required image/runtime values, Mongo volume location, browser build-time Auth0 settings, server-only Auth0 Management API and ESPN encryption settings, and optional writing settings. Keep placeholder values non-secret, explain that VITE values must be supplied while building the image, document the compose/.env relationship in README, validate compose syntax, and commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
docker compose config --no-interpolate accepted the file. Repository-wide format check reports pre-existing formatting issues in HistoryPage.tsx, InsightsPage.tsx, league-summary.test.ts, and router.test.tsx; these are outside the Compose/documentation task and were not changed.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added non-secret commented Docker Compose examples for image pinning, runtime Auth0 Management API credentials, ESPN encryption, writing assistants, and Mongo persistence. Clarified that VITE_AUTH0_* values are baked into the image at build time and cannot be changed via runtime Compose environment values. README now describes the .env/Compose relationship. Validation: docker compose config --no-interpolate and diff checks passed. The repository-wide format check only reports four unrelated existing files, which were left untouched.
<!-- SECTION:FINAL_SUMMARY:END -->
