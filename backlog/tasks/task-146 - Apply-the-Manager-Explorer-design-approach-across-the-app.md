---
id: TASK-146
title: Apply the Manager Explorer design approach across the app
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 21:35'
updated_date: '2026-10-15 14:37'
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

7. New user direction: preserve current gemini_app_redesign edits and finish the usability PDF/mock implementation with three GPT-6.1 Sol high owners, shared PageHeading controls interface, fresh feature-ID coverage, then an independent review/fix/recheck loop and signed-in responsive validation. Original/compact exports and TASK-147 remain unchanged.

8. User requested a direct screenshot comparison against the usability designs. Capture matched design/current screens, audit typography/surfaces/controls/density, repair concrete style mismatches without reducing behavior, and repeat visual/regression/export checks before finalizing.

9. Address the user-reported heavy borders: soften neutral button/disclosure strokes and form borders, retain readable field boundaries and focus/selected/error states, verify the signed-in preview, contrast checks and unchanged ranking PNGs.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User confirmed the feature-preservation audit gaps must be restored in the design and final implementation. Mockups remain a separate review artifact using sample data, not completed production behavior. No feature removal is approved; ask individually before any proposed reduction. Keep the seven-item navigation, all-managed-league weekly overview, dense four-game Live board, and original rankings export. The separate TASK-147 theme choice applies only to rankings exports.

Expanded feature-preserving mockups now represent the requested analytics, exact weekly lineup table, advisors, trade evidence/prefill, round forecasts and Advanced calibration, correct server-managed profile/writing semantics, and complete history category workflows. Replaced explanatory detail panels with accessible tooltips while retaining control/evidence views and meaningful caveats. Standalone browser checks passed for all primary views and history categories at 1440px and 390px, with no runtime errors or page-wide overflow; automated WCAG A/AA checks passed for default views excluding the unchanged legacy export. Interaction checks covered sample CSV/JSON downloads, chart and manager filters, forecast reruns, waiver/lineup scenarios, prefilled trades, model/consent/cancel, archive import/export and Wrapped revocation. Production implementation and regression validation are still pending; no acceptance criteria are checked off and no removal is approved.

Integrated all three GPT-6.1 Sol high subagents with separate ownership and lead code/screenshot review. Shared seven-destination navigation, contextual Other tools, compact Live profile access, focused ranking authoring and retained edit-all mode, profile/connections/league management are implemented. Preserved production data/calculation/mutation flows and all feature IDs; original/compact PNG downloads match existing baselines. Full Chrome suite passed 71 tests; full component suite passed 759 tests with one existing opt-in live provider check skipped, followed by added account isolation/recovery regressions. Final coverage, checks and finalization are in progress. TASK-147 and the untracked design references remain unchanged.

Final lead validation passed: 761 component/server/provider/calculation tests across 150 files, one existing opt-in live dual-source test skipped; all 71 Chrome browser tests plus final 4 account/navigation/writing reruns; lint, format, typecheck, production build and diff whitespace checks. Reviewed production-component screenshots against approved design references. Live fits 1440x900, 2048x942, 1280x720 and phone layouts; long names/statuses wrap, larger rosters independently scroll. Original and compact PNGs match unchanged baselines. Real CSV/JSON downloads, state retention, draft/conflict/revision/publication, sharing/revocation/snapshots, cancellation, account isolation and error recovery have deterministic regression coverage. No live account/tenant email/CLI quota or optional disposable Mongo HTTP harness was exercised; existing data/provider limitations remain disclosed. No feature reductions, deployment, merge or commit. TASK-147 remains To Do.

Live account validation is now possible through the existing signed-in Chrome tab. Initial production inspection found excessive context-selector margins, a large sharing header, and duplicate ranking route/editor headings not represented in the isolated fixture. A read-only GPT-6.1 Sol high subagent is independently reviewing the uncommitted redesign. Existing working-tree work and original/compact exports remain protected.

New iteration baseline captured before edits. New checklist: docs/usability-implementation-coverage.md. The earlier checked criteria/final summary describe the earlier design; fresh verification remains pending for the usability specification.

Completed the new usability specification on the preserved gemini_app_redesign working tree using three GPT-6.1 Sol high implementation owners and an independent GPT-6.1 Sol high reviewer. The complete diff and final delta were approved with no unresolved findings. Fresh gates: 786 component/server/provider/calculation tests passed, with one existing opt-in test skipped; all 117 Chrome checks passed across the five specified viewports; typecheck, lint, format, production build and diff checks passed. Signed-in localhost usability and a real CSV download were verified. Original and compact downloads have zero changed pixels against the exact pre-iteration code in the same Chrome environment. Older saved PNGs have the identical pre-existing variation of at most one channel level; no baseline or tolerance was changed. The user chose existing real Live statuses and deferred scheduled start times to TASK-148. TASK-147 is unchanged. Complete evidence is in docs/usability-implementation-coverage.md and the area reports.

Completed the user's direct screenshot comparison follow-up across all 12 usability screens at matching 1633x828 CSS pixels using signed-in real ESPN/Sleeper data. Integrated three GPT-6.1 Sol high implementation owners and independent review. Corrected control fonts/borders, attached ranking tabs and density, 340px inspectors, aligned CSV actions, overview triggers, Live link/status treatment, player browsing, trade roster placement, History toolbar/context, profile/management panels and onboarding. Reviewer approved after fixing one clipped restored-draft notice at 320px with a permanent regression. Validation: full 786 tests passed with one existing opt-in skip, full 123 Chrome checks passed, final five style/onboarding and 14 History browser checks passed, final typecheck/lint/format/build/diff checks passed. Original and compact PNGs have zero changed RGBA pixels against pre-audit downloads. Comparison gallery: /tmp/fantasy-design-comparison/index.html. Evidence and coverage: docs/usability-style-comparison.md. No feature reductions, draft/account mutations, deployment, merge or commit. TASK-147 unchanged; future kickoff times remain TASK-148.

Completed the user-reported dark-border correction. Neutral Chakra/plain/ghost buttons and native CSV/sharing/tooltip/league-choice strokes now use #dce2ee; form outlines use #8995a7 with 3:1 contrast retained; native profile Sign out border is reset. Focus, selected and error states and all handlers remain. Signed-in localhost screenshot verified. Independent reviewer approved. All 24 focused Chrome checks, unchanged contrast assertions, build, typecheck, lint, format and whitespace checks passed. Original and Compact exports have zero changed pixels against the preceding implementation. Evidence: docs/usability-style-comparison.md and /tmp/fantasy-border-refinement/. No deployment, merge or feature reduction.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Finished the PDF/usability redesign and direct screenshot comparison while preserving the user's existing work and production functionality. All 12 views were compared; spacing, controls, panels and responsive density were corrected using three implementation subagents and an independent reviewer. Reviewed approval has no unresolved findings. Passed 786 tests, 123 full Chrome checks plus final focused regressions, static/build gates and zero-pixel Original/Compact export parity. See docs/usability-implementation-coverage.md and docs/usability-style-comparison.md. TASK-147 remains separate; scheduled start times remain future TASK-148. No deployment, merge or commit.

The subsequent dark-border refinement is complete and reviewed: subtle neutral strokes, readable form boundaries, preserved focus/error/selected states, 24 passing browser checks and unchanged ranking PNG pixels. Static/build checks pass; local preview only.
<!-- SECTION:FINAL_SUMMARY:END -->
