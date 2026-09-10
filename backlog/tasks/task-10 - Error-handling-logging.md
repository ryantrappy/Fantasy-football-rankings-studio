---
id: TASK-10
title: Error handling/logging
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 04:14'
updated_date: '2026-09-09 11:40'
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
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve existing server RPC/health/Nitro error boundaries and add logging for handled fallback errors currently swallowed by season discovery and client UI catches.
2. Add a shared safe client logger, log errors before stale-request guards, and install browser error/unhandledrejection listeners plus route-error reporting. Keep request/input payloads out of logs and redact token/cookie patterns.
3. Extend server secret redaction for Auth0 Management credentials and make logger fallback unable to throw. Use existing Nitro error capture for runtime failures (inspect installed runtime to avoid duplicate process handlers).
4. Verify caught and uncaught browser logging, secret redaction, degraded fallback logging and request error envelopes; run full tests/build/lint and document recovery limits.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Added logging at client catches (including stale requests and fallbacks), Auth0 session/login/logout and disposal, browser error/unhandledrejection events, and route onCatch. Existing Nitro node runtime installs uncaught handlers and routes captured failures to the existing app error hook; no duplicate process handlers added. Server logger now redacts M2M secret and survives a broken console sink. Full suite: 129 tests pass; production build/typecheck and lint pass.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Expanded error logging across browser catches, page errors, Auth0 failures, uncaught browser events and recoverable season-discovery fallbacks. Logs select diagnostic fields, redact credentials, avoid duplicate propagation of browser Error objects, and cannot interrupt recovery if the console fails.

Existing request envelopes and Nitro runtime capture continue to contain recoverable failures. README documents logging destinations, retained drafts/retry behavior and production supervision limits. Validation: 129 tests pass, including browser event/cleanup and redaction/failing-sink coverage; production build, typecheck and lint pass.
<!-- SECTION:FINAL_SUMMARY:END -->
