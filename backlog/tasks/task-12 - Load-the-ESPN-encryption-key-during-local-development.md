---
id: TASK-12
title: Load the ESPN encryption key during local development
status: To Do
assignee: []
created_date: '2026-09-09 04:17'
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
- [ ] #1 A valid ESPN_CREDENTIALS_KEY in .env or .env.local is available to server code in npm run dev without an extra shell export.
- [ ] #2 The key stays server-only and never enters the client bundle.
- [ ] #3 Existing process environment overrides retain precedence, with a regression check for development configuration.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
