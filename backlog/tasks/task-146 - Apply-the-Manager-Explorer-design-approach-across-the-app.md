---
id: TASK-146
title: Apply the Manager Explorer design approach across the app
status: In Progress
assignee:
  - '@codex'
created_date: '2026-10-13 21:35'
updated_date: '2026-10-14 16:00'
labels: []
dependencies:
  - TASK-145
references:
  - docs/mockups/app-explorer/feature-coverage.md
  - docs/manager-explorer-coverage.md
ordinal: 153000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After choosing the Manager Explorer history mockup, the user requested the same design feel throughout the rest of the app. Other screens should use the completed history redesign as the visual and interaction reference so dense analytics remain approachable and navigation, controls, and supporting details feel consistent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Review the remaining app screens against the completed history explorer and identify inconsistent navigation, redundant controls, and dense stacked content.
- [x] #2 Use consistent typography, surfaces, spacing, compact summary areas, and clear active states based on the history explorer.
- [x] #3 Keep league, season, manager, and player context in predictable places; related views preserve their relevant selections.
- [x] #4 Organize dense analytics into focused views with progressive disclosure and nearby evidence while retaining existing features, calculations, exports, and sharing behavior.
- [x] #5 Verify keyboard navigation, accessible controls, empty/loading/error states, and phone layouts without page-wide overflow on every changed screen.
- [x] #6 Document the reusable design conventions and validate affected screens with appropriate component and browser tests.
- [x] #7 Preserve all feature contracts and unlisted behavior during implementation; any proposed feature removal requires separate explicit user approval recorded before implementation.
- [x] #8 Retain positional strength charts and projected/completed scoring, schedule difficulty and weekly opponents, manager report cards/former managers, exact lineup accuracy tables, and CSV exports.
- [x] #9 Retain complete lineup, waiver, player comparison, trade capacity, trade idea rationale and prefilled scenario workflows; forecast round odds and full weekly values remain available, with calibration and replay downloads in an Advanced area.
- [x] #10 Correct Profile and writing assistant controls to reflect server-managed Codex readiness, setup, shared quota and key precedence; retain identity/verification/password recovery, model selection, cancellation and revocable context-sharing consent.
- [x] #11 Retain every league history category, archive workflow, evidence presentation and sharing control; replace purely explanatory disclosure panels with accessible tooltips where appropriate without hiding required caveats, controls or data.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inventory protected feature IDs and mockup coverage, then coordinate non-overlapping Analytics, Decision support, History, and lead ownership. 2. Implement the shared Manager Explorer shell, seven destinations, profile menu, rankings and account workflow presentation using existing production components and services. 3. Integrate focused analytics, decision and history views without changing calculations, persistence, exports or privacy. 4. Review contributions and production-component screenshots; validate focused interactions, responsive layouts, downloads, draft safety, sharing, cancellation, full component/browser suites, lint, format, types and production build. 5. Update preservation evidence and only complete TASK-146 after required implementation and checks pass. TASK-147 remains untouched.

6. Follow-up requested by the user: inspect the signed-in localhost app with real leagues for usability and wasted space, run an independent subagent code review, repair introduced defects and validate affected workflows/responsive geometry before final completion.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User confirmed the feature-preservation audit gaps must be restored in the design and final implementation. Mockups remain a separate review artifact using sample data, not completed production behavior. No feature removal is approved; ask individually before any proposed reduction. Keep the seven-item navigation, all-managed-league weekly overview, dense four-game Live board, and original rankings export. The separate TASK-147 theme choice applies only to rankings exports.

Expanded feature-preserving mockups now represent the requested analytics, exact weekly lineup table, advisors, trade evidence/prefill, round forecasts and Advanced calibration, correct server-managed profile/writing semantics, and complete history category workflows. Replaced explanatory detail panels with accessible tooltips while retaining control/evidence views and meaningful caveats. Standalone browser checks passed for all primary views and history categories at 1440px and 390px, with no runtime errors or page-wide overflow; automated WCAG A/AA checks passed for default views excluding the unchanged legacy export. Interaction checks covered sample CSV/JSON downloads, chart and manager filters, forecast reruns, waiver/lineup scenarios, prefilled trades, model/consent/cancel, archive import/export and Wrapped revocation. Production implementation and regression validation are still pending; no acceptance criteria are checked off and no removal is approved.

Integrated all three GPT-6.1 Sol high subagents with separate ownership and lead code/screenshot review. Shared seven-destination navigation, contextual Other tools, compact Live profile access, focused ranking authoring and retained edit-all mode, profile/connections/league management are implemented. Preserved production data/calculation/mutation flows and all feature IDs; original/compact PNG downloads match existing baselines. Full Chrome suite passed 71 tests; full component suite passed 759 tests with one existing opt-in live provider check skipped, followed by added account isolation/recovery regressions. Final coverage, checks and finalization are in progress. TASK-147 and the untracked design references remain unchanged.

Final lead validation passed: 761 component/server/provider/calculation tests across 150 files, one existing opt-in live dual-source test skipped; all 71 Chrome browser tests plus final 4 account/navigation/writing reruns; lint, format, typecheck, production build and diff whitespace checks. Reviewed production-component screenshots against approved design references. Live fits 1440x900, 2048x942, 1280x720 and phone layouts; long names/statuses wrap, larger rosters independently scroll. Original and compact PNGs match unchanged baselines. Real CSV/JSON downloads, state retention, draft/conflict/revision/publication, sharing/revocation/snapshots, cancellation, account isolation and error recovery have deterministic regression coverage. No live account/tenant email/CLI quota or optional disposable Mongo HTTP harness was exercised; existing data/provider limitations remain disclosed. No feature reductions, deployment, merge or commit. TASK-147 remains To Do.

Live account validation is now possible through the existing signed-in Chrome tab. Initial production inspection found excessive context-selector margins, a large sharing header, and duplicate ranking route/editor headings not represented in the isolated fixture. A read-only GPT-6.1 Sol high subagent is independently reviewing the uncommitted redesign. Existing working-tree work and original/compact exports remain protected.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the approved Manager Explorer design across production navigation, rankings, accounts/leagues, analytics, decisions, Live and complete history with three GPT-6.1 Sol high subagents and lead integration. Preserved all feature contracts, data/calculation/mutation paths and unchanged original/compact exports. Verified 761 tests, 71 browser checks, final account/navigation regressions, screenshots at required viewport sizes, lint, format, types, production build and diff checks; coverage documentation records retained data limits and live-validation boundaries. TASK-147 remains separate.
<!-- SECTION:FINAL_SUMMARY:END -->
