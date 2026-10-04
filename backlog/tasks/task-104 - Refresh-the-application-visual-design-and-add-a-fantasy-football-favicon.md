---
id: TASK-104
title: Refresh the application visual design and add a fantasy football favicon
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 05:24'
updated_date: '2026-10-04 13:31'
labels: []
dependencies: []
ordinal: 111000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The user praised the new login, trade and Players layouts and requested a full visual pass because the rest of the application feels flat. Carry a cohesive visual hierarchy through navigation, dashboards, analytics, rankings editing and account/setup flows, and replace the generic app icons with a relevant fantasy football mark.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Navigation and all primary application screens use a coherent, lively visual hierarchy with clear controls, cards and meaningful accents.
- [x] #2 Desktop and mobile layouts, contrast, keyboard access and core workflows remain usable, including ranking exports and live matchups.
- [x] #3 A fantasy football favicon and matching browser/app icons are generated, installed and referenced by the document and manifest.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Review every route and current UI fixtures; establish a cohesive design using the approved login/trade treatment. 2. Improve shared theme and navigation, then apply focused page-level hierarchy and form/card fixes across overview, editor, analytics/history, live, account and setup flows. 3. Create a football/rankings icon and wire browser/manifest assets. 4. Verify representative desktop/mobile states, accessibility, exports and interactions; run tests/build/format/lint and document the results.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Applied a shared navy/indigo/warm-accent workspace design, icon navigation with visible active states and mobile active-tab scrolling, keyboard skip link, page headings, elevated report/account cards, readable forms, ranking editor treatments and live-board accents. The weekly overview now emphasizes matchup scores, record and playoff estimates. Forecast explanations expand on demand while early-season uncertainty stays visible. Applied matching branding to sign-in and standalone shared pages.

Created the football/rankings SVG mark and installed matching multi-resolution ICO, 192px/512px app PNGs and a 180px Apple touch icon. Root head and web manifest reference the assets; the production server serves all assets and the sign-in page without browser errors.

Validation: 456 unit tests passed (one existing integration test skipped), all 41 Playwright tests passed, production build/typecheck passed, full-project lint passed, changed-file formatting and git diff whitespace checks passed. Added desktop/mobile coverage of nine workspace views, accessibility, table containment, keyboard navigation, active-tab visibility and forecast disclosure interactions. Final focused forecast tests (5) and workspace browser tests (4) passed after the last polish. Visually reviewed desktop/mobile overview, editor, reports, profile and league setup, plus generated icons.

Ranking exports retain their geometry and appearance. Export baselines had only one-channel-level RGB drift with the new CSS removed as well; snapshot matching now tolerates that color-conversion noise (threshold 0.01, still zero differing pixels allowed above threshold), without changing baseline images. README documents the shared design, mobile behavior, export scope and icon source. Preserved other pre-existing working-tree changes.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed the full application visual refresh and installed matching fantasy football browser/app icons. Verified desktop/mobile layouts, accessibility, navigation, ranking exports and core workflows; 456 unit tests and 41 browser tests pass, with production build/typecheck, lint and formatting checks passing.
<!-- SECTION:FINAL_SUMMARY:END -->
