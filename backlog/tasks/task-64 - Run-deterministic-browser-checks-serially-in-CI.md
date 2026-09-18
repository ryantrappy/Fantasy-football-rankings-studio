---
id: TASK-64
title: Run deterministic browser checks serially in CI
status: Done
assignee:
  - Codex
created_date: '2026-09-17 18:46'
updated_date: '2026-09-17 18:54'
labels: []
dependencies: []
modified_files:
  - playwright.config.ts
  - README.md
priority: medium
type: bug
ordinal: 67000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
GitHub Actions browser specs intermittently time out before the ranking editor renders because four concurrent Chrome workers compete with PNG-export rendering against one Vite test server.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 CI browser checks use a bounded worker count that avoids startup timeouts.
- [x] #2 Local browser runs retain normal parallel execution.
- [x] #3 Relevant Playwright configuration test behavior is verified and documented.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Set Playwright workers to one only when CI is set, preserving Playwright's local default. Record why the shared Vite server and PNG exports make serial CI more reliable. Run the two previously failing specs and the browser suite configuration validation, then commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
The original failure artifacts timed out while waiting for initial UI controls, before the sorting assertion. A focused serial run of table-sorting completed without creating a new failure artifact. `npm run typecheck` remains blocked by TASK-65, whose mocks are missing the required `getMatchups` member.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Configured Playwright to use one worker only in CI, while local UI runs retain Playwright's default parallelism. Documented that PNG-export rendering shares the Vite test server and can delay page startup under concurrent CI workers.
<!-- SECTION:FINAL_SUMMARY:END -->
