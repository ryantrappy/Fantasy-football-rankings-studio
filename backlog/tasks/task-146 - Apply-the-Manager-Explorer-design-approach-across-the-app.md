---
id: TASK-146
title: Apply the Manager Explorer design approach across the app
status: To Do
assignee: []
created_date: '2026-10-13 21:35'
updated_date: '2026-10-14 03:49'
labels: []
dependencies:
  - TASK-145
references:
  - docs/mockups/app-explorer/feature-coverage.md
ordinal: 153000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
After choosing the Manager Explorer history mockup, the user requested the same design feel throughout the rest of the app. Other screens should use the completed history redesign as the visual and interaction reference so dense analytics remain approachable and navigation, controls, and supporting details feel consistent.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Review the remaining app screens against the completed history explorer and identify inconsistent navigation, redundant controls, and dense stacked content.
- [ ] #2 Use consistent typography, surfaces, spacing, compact summary areas, and clear active states based on the history explorer.
- [ ] #3 Keep league, season, manager, and player context in predictable places; related views preserve their relevant selections.
- [ ] #4 Organize dense analytics into focused views with progressive disclosure and nearby evidence while retaining existing features, calculations, exports, and sharing behavior.
- [ ] #5 Verify keyboard navigation, accessible controls, empty/loading/error states, and phone layouts without page-wide overflow on every changed screen.
- [ ] #6 Document the reusable design conventions and validate affected screens with appropriate component and browser tests.
- [ ] #7 Preserve all feature contracts and unlisted behavior during implementation; any proposed feature removal requires separate explicit user approval recorded before implementation.
- [ ] #8 Retain positional strength charts and projected/completed scoring, schedule difficulty and weekly opponents, manager report cards/former managers, exact lineup accuracy tables, and CSV exports.
- [ ] #9 Retain complete lineup, waiver, player comparison, trade capacity, trade idea rationale and prefilled scenario workflows; forecast round odds and full weekly values remain available, with calibration and replay downloads in an Advanced area.
- [ ] #10 Correct Profile and writing assistant controls to reflect server-managed Codex readiness, setup, shared quota and key precedence; retain identity/verification/password recovery, model selection, cancellation and revocable context-sharing consent.
- [ ] #11 Retain every league history category, archive workflow, evidence presentation and sharing control; replace purely explanatory disclosure panels with accessible tooltips where appropriate without hiding required caveats, controls or data.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
User confirmed the feature-preservation audit gaps must be restored in the design and final implementation. Mockups remain a separate review artifact using sample data, not completed production behavior. No feature removal is approved; ask individually before any proposed reduction. Keep the seven-item navigation, all-managed-league weekly overview, dense four-game Live board, and original rankings export. The separate TASK-147 theme choice applies only to rankings exports.

Expanded feature-preserving mockups now represent the requested analytics, exact weekly lineup table, advisors, trade evidence/prefill, round forecasts and Advanced calibration, correct server-managed profile/writing semantics, and complete history category workflows. Replaced explanatory detail panels with accessible tooltips while retaining control/evidence views and meaningful caveats. Standalone browser checks passed for all primary views and history categories at 1440px and 390px, with no runtime errors or page-wide overflow; automated WCAG A/AA checks passed for default views excluding the unchanged legacy export. Interaction checks covered sample CSV/JSON downloads, chart and manager filters, forecast reruns, waiver/lineup scenarios, prefilled trades, model/consent/cancel, archive import/export and Wrapped revocation. Production implementation and regression validation are still pending; no acceptance criteria are checked off and no removal is approved.
<!-- SECTION:NOTES:END -->
