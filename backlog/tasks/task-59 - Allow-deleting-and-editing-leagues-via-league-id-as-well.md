---
id: TASK-59
title: Allow deleting and editing leagues via league id as well
status: Done
assignee:
  - Codex
created_date: '2026-09-16 19:45'
updated_date: '2026-09-16 19:47'
labels: []
dependencies: []
ordinal: 62000
---

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rename accepts either the app workspace league ID or the external provider league ID.
- [x] #2 Archive and restore accept either identifier and continue enforcing owner isolation.
- [x] #3 Focused tests cover provider-ID rename/archive behavior and documentation explains the accepted identifiers.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Research league management identifiers and preserve ownership checks. Add a service resolver that accepts either the internal workspace leagueId or providerLeagueId, use it for archive/restore and rename operations, and add focused service/API component coverage. Document the identifier behavior, run tests/typecheck/lint, then commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Management rename, archive and restore now resolve either the app workspace league ID or the external Sleeper/ESPN provider league ID through an owner-scoped $or filter. Added provider-ID rename and archive regression tests, updated the existing service expectation, and documented identifier behavior in README. Validation: focused management/service tests passed (7 tests), TypeScript, oxlint and diff checks passed.
<!-- SECTION:FINAL_SUMMARY:END -->
