---
id: TASK-154
title: Repair CI test-runtime compatibility after dependency upgrades
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-15 20:47'
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
- [ ] #1 Both quality and browser jobs use a Node version supported by the locked jsdom/Undici dependencies.
- [ ] #2 Vitest forks start and the full deterministic unit suite passes under the configured CI Node version.
- [ ] #3 Development/test runtime requirements and verification evidence are documented without narrowing supported application runtime behavior.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Reproduce the Undici import failure on Node 22.12, align CI with a shared Node 24 tooling version, and run all unit/static/build checks with that exact runtime.
<!-- SECTION:PLAN:END -->
