---
id: TASK-47
title: Add deterministic ESPN integration coverage
status: Done
assignee:
  - '@codex'
created_date: '2026-09-14 22:12'
updated_date: '2026-09-15 03:41'
labels:
  - testing
  - espn
dependencies: []
documentation:
  - README.md
modified_files:
  - README.md
  - package.json
  - scripts/check-local.mjs
  - src/server/insights/load.server.ts
  - src/server/providers/espn.provider.ts
  - src/server/tests/espn-contract.integration.test.ts
priority: low
type: enhancement
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The public ESPN league previously used by `npm run check:local` now returns 401. The default disposable-database integration check therefore validates the complete Sleeper path but exercises ESPN only when a developer supplies a league ID and personal cookies.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A deterministic integration path covers ESPN league validation, teams, matchups, and report loading without requiring a developer's personal credentials.
- [x] #2 Coverage verifies that public ESPN requests omit cookies and private requests attach only the current account's encrypted credentials.
- [x] #3 Optional live ESPN verification remains available, while local and CI output clearly distinguishes deterministic coverage from live-provider coverage.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add an injectable ESPN API base URL and provider injection for report loading so tests can exercise the real HTTP adapter against a local server.
2. Build a sanitized local ESPN contract covering validation, teams, matchups, box scores, transactions, report calculations, public cookie omission, and encrypted per-account private credentials.
3. Keep check:local live ESPN coverage optional, label deterministic versus live output clearly, document both paths, and run all project checks.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Observed while updating `scripts/check-local.mjs`: the old public fixture failed with HTTP 401, so the check now skips ESPN unless `TEST_ESPN_LEAGUE_ID`, `TEST_ESPN_S2`, and `TEST_ESPN_SWID` are all set. Prefer a local HTTP contract fixture or sanitized recorded responses over committed secrets or an unstable third-party league. Keep at least one explicitly optional live-provider path.

Added constructor-level ESPN endpoint injection and optional report-loader provider injection, leaving production defaults unchanged. A local Node HTTP fixture now exercises the real Axios adapter for league metadata validation, normalized teams, matchups, weekly box scores, transactions, and calculated insights. It verifies public requests omit cookies and that synthetic per-account credentials are encrypted at rest, decrypted for the matching subject, and never cross between concurrent requests. Added a focused npm script and explicit deterministic/live-provider output and documentation.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
ESPN now has deterministic end-to-end adapter coverage against a sanitized local HTTP contract, including full report loading and credential isolation, with no external access or personal secrets. Optional check:local live verification remains available and is clearly labeled. Added focused and full-suite scripts/docs; all 242 tests, typecheck, lint, and production build pass.
<!-- SECTION:FINAL_SUMMARY:END -->
