---
id: TASK-71
title: remove quotes from params
status: Done
assignee:
  - Codex
created_date: '2026-09-20 18:48'
updated_date: '2026-09-20 18:55'
labels: []
dependencies: []
modified_files:
  - README.md
  - src/router.tsx
  - src/components/report-search.ts
  - src/components/HistoryPage.tsx
  - src/components/ShareReport.tsx
  - src/components/public-reports.test.tsx
  - src/router.test.tsx
priority: medium
ordinal: 74000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
http://localhost:3001/history?leagueId="1312529175982129152"

this is an example of a shared league id, remove the quotes and jsut have it be leagueId=1312529175982129152
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace the generic JSON-oriented share-query serializer with `URLSearchParams` so copied report links emit an unquoted numeric `leagueId`. → verify copied URLs contain `leagueId=123`.
2. Normalize legacy matching double-quoted numeric IDs at route/report input boundaries, retaining the existing 1–30 digit validation. → verify existing quoted links still load the intended league.
3. Cover copied-link serialization and legacy-link loading with report and router regression tests. → verify the entire suite, typecheck, lint, and formatting checks pass.

4. Configure the router’s in-app search serializer so tab `Link` navigation writes numeric league IDs without JSON quotes, while preserving arrays/objects in existing search parameters. → verify report tab hrefs and click navigation use `leagueId=123`.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Investigation showed `defaultStringifySearch` was the source of newly copied quoted IDs. Replaced it only for report sharing with standard URL query serialization; legacy quoted IDs remain accepted and normalize to the numeric ID.

Follow-up: copied links were fixed, but report-tab `Link` navigation still uses the router’s default serializer. Reopening to make that serializer emit canonical numeric league IDs.

Configured the router-level search serializer for all in-app `Link` navigation. It now rewrites only numeric `leagueId` JSON strings to plain query values, retaining the default serializer for all other search fields. Added an assertion that selecting League history produces `/shared/history?leagueId=123`.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Fixed shared report links to serialize numeric `leagueId` values without JSON quotes, including history and insights links. Existing links containing a matching quoted numeric ID are normalized at parsing/report boundaries for backward compatibility. Documented the canonical URL format in README and added regression coverage for copied links and quoted legacy history links.

Verification: `npm test` (59 files, 289 tests), `npm run typecheck`, `npm run lint`, `npm run format:check`, and `git diff --check` all pass.

Follow-up completed: tab navigation now also emits unquoted numeric `leagueId` values. The router’s serializer removes JSON quotes only from valid numeric league IDs, preserving default query serialization elsewhere.

Re-verified: `npm test` (59 files, 289 tests), `npm run typecheck`, `npm run lint`, `npm run format:check`, and `git diff --check` all pass.
<!-- SECTION:FINAL_SUMMARY:END -->
