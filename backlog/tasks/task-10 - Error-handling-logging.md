---
id: TASK-10
title: Error handling/logging
status: In Progress
assignee:
  - '@codex'
created_date: '2026-09-09 04:14'
updated_date: '2026-09-09 04:15'
labels: []
dependencies: []
priority: high
ordinal: 10000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Log all errors that are caught to the console. If uncaught also try to log it. Prevent server crashes if possible
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve existing server RPC/health/Nitro error boundaries and add logging for handled fallback errors currently swallowed by season discovery and client UI catches.
2. Add a shared safe client logger, log errors before stale-request guards, and install browser error/unhandledrejection listeners plus route-error reporting. Keep request/input payloads out of logs and redact token/cookie patterns.
3. Extend server secret redaction for Auth0 Management credentials and make logger fallback unable to throw. Use existing Nitro error capture for runtime failures (inspect installed runtime to avoid duplicate process handlers).
4. Verify caught and uncaught browser logging, secret redaction, degraded fallback logging and request error envelopes; run full tests/build/lint and document recovery limits.
<!-- SECTION:PLAN:END -->
