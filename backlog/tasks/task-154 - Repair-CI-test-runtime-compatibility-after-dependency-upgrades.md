---
id: TASK-154
title: Repair CI test-runtime compatibility after dependency upgrades
status: Done
assignee:
  - '@codex'
created_date: '2026-10-15 20:47'
updated_date: '2026-10-16 02:32'
labels: []
dependencies: []
ordinal: 161000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
PR #33 cannot start Vitest forks on Actions Node 22.12 because jsdom 30 pulls Undici 8 and requires newer Node APIs. Align test/build tooling with the supported Node 24 line already used by Docker, retain production runtime compatibility, and verify the failure and fix under explicit Node versions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Both quality and browser jobs use a Node version supported by the locked jsdom/Undici dependencies.
- [x] #2 Vitest forks start and the full deterministic unit suite passes under the configured CI Node version.
- [x] #3 Development/test runtime requirements and verification evidence are documented without narrowing supported application runtime behavior.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Reproduce the Undici import failure on Node 22.12, align CI with a shared Node 24 tooling version, and run all unit/static/build checks with that exact runtime.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Reproduced the exact Undici createZstdDecompress.bind import error under Node 22.12.0. Under the configured Node 24.15.0, jsdom/Undici imports succeed and every locked engine constraint is satisfied. Clean npm ci --engine-strict succeeded (zero audit vulnerabilities); 879 unit tests pass, one optional live-provider check skipped; typecheck, lint, repository formatting and production build pass. Runtime configuration change is already committed in f6f0b32; this follow-up records verified completion.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Aligned both Actions jobs and development tooling on shared Node 24.15.0 with engine-strict installation. Exact Node 22.12 failure reproduced; clean install, 879 unit tests and all static/build gates pass under Node 24.15.0. Production runtime support unchanged.
<!-- SECTION:FINAL_SUMMARY:END -->
