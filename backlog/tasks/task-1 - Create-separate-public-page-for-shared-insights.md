---
id: TASK-1
title: Create separate public page for shared insights
status: Done
assignee:
  - Codex
created_date: '2026-09-09 02:49'
updated_date: '2026-09-09 03:48'
labels: []
dependencies: []
modified_files:
  - README.md
  - src/auth/Authentication.tsx
  - src/components/AppNavigation.tsx
  - src/components/ShareReport.tsx
  - src/components/InsightsPage.tsx
  - src/components/HistoryPage.tsx
  - src/components/report-search.ts
  - src/components/public-reports.test.tsx
  - src/routes/_public.tsx
  - src/routes/_public.shared.insights.tsx
  - src/routes/_public.shared.history.tsx
  - src/routes/_authenticated.insights.tsx
  - src/routes/_authenticated.history.tsx
  - src/routeTree.gen.ts
  - src/router.test.tsx
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
- Use the same components as internal but don't display the power rankings builder tab.
- Auth should be done in a way where it is not checked every rerender so the tabs are static 
- If an espn league is shared don't use the env variable ever for the public versions
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Use the same components as internal but don't display the power rankings builder tab.
- [x] #2 Auth should be done in a way where it is not checked every rerender so the tabs are static
- [x] #3 If an espn league is shared don't use the env variable ever for the public versions
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
- [x] #3 No regressions
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve existing report implementations and extract reusable season/history page components with typed search/navigation inputs.
2. Keep /insights and /history inside the authenticated layout; add /shared/insights and /shared/history under a public layout that never initializes Auth0 or selects owner endpoints. Make navigation mode explicit and share links always target public routes.
3. Retain existing server public-access isolation, verify denied ESPN requests and cache separation, and add regression tests for stable public navigation/access and share URLs.
4. Update README, run tests, lint and production build, then record acceptance evidence.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Selected first high-priority task by Backlog ordering. Workspace already contains untracked partial public-report implementation. Found optional Authentication currently switches public pages to owner APIs and reveals Rankings studio after session hydration; fixing this is required by all three acceptance criteria.

Implemented /shared/insights and /shared/history with a public-only layout and explicit navigation mode; internal routes reuse the extracted report components under the existing authenticated layout. Copy share link always produces shared URLs. Removed optional session switching from Authentication. README documents the new URL/access behavior.

Verification: full Vitest suite passed (18 files, 90 tests), including real-router shared navigation for a signed-in ESPN owner, anonymous/history links, internal owner requests, DOM rerender isolation, public metadata validation, and ESPN credential omission/concurrency/denial tests. Production build passed and lint passed. Test suite required sandbox escalation only for the local JWT test server. Final typecheck caught a test matcher typing mismatch; replaced it with the equivalent supported matcher and rechecking.

Final typecheck and git diff --check passed. No live Auth0/ESPN integration run; provider isolation and authentication behavior are covered by automated tests. Existing unrelated workspace changes preserved.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Shared reports now live at /shared/insights and /shared/history and reuse the internal season/history components. Their layout does not initialize Auth0, their navigation always excludes Rankings studio, and their API remains public even for a signed-in league owner. Internal /insights and /history retain authenticated owner access. Share links always point to the public routes and preserve report selections.

Updated README and route/DOM regression tests. Verified existing public ESPN requests omit environment credentials, including concurrent owner reads and denied requests. Validation: 90 tests across 18 files passed; production build, lint, final typecheck and diff whitespace checks passed. Live provider integration was not exercised.
<!-- SECTION:FINAL_SUMMARY:END -->
