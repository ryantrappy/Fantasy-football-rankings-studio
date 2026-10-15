---
id: TASK-149
title: 'Correct insights scales and History defaults, spacing and matchup heatmap'
status: Done
assignee:
  - '@codex'
created_date: '2026-10-15 15:24'
updated_date: '2026-10-15 15:46'
labels: []
dependencies: []
priority: medium
type: enhancement
ordinal: 156000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Address the October 15 usability feedback: Season Insights axes should scale to real stacked values rather than a fixed 2200 floor; League history should initially include every available season without overriding explicit selections; header controls need consistent spacing/baselines; provide a real manager head-to-head heatmap with accessible exact records and evidence; replace the broken GitHub operator Codex setup link with local in-app guidance. Preserve calculations, co-owner identity, CSV/sharing/snapshots, bounded season loading, writing readiness/consent and existing workflows.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Position charts fit real positive/negative extents with useful ticks for both actual and projected modes, including zero/small/missing data; exact values remain available.
- [x] #2 History defaults to all provider-available years; explicit years including empty selections, shared snapshots, cache/progress/error behavior and bounded concurrency remain correct.
- [x] #3 History header league/actions align with clear gaps and fit desktop/phone layouts without clipped text or inaccessible sharing.
- [x] #4 A manager-versus-manager heatmap shows real W-L-T and sample sizes, distinguishes self/no-games from losses, uses stable manager identity and opens pair evidence via keyboard or pointer; existing matrix/CSV remain.
- [x] #5 Writing settings and builder expose local accessible operator setup guidance with correct server-managed login, shared quota and personal-key precedence, with no broken GitHub link.
- [x] #6 Focused component/browser regressions, independent review, static checks and production build pass; feature contracts and completion evidence are updated.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Coordinate three non-overlapping implementation owners for chart scaling, History year defaults/navigation and matchup heatmap. Lead owns shared header spacing, local Codex guidance, coverage, integration and validation. Review completed slices independently, repair findings, capture production screenshots and finish required gates.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Implemented by three non-overlapping owners and integrated by the lead. Adaptive actual/projected stack bounds; private all-season defaults with explicit empty/subset preservation and background bounded preloads; aligned responsive History header; exact manager matchup heatmap plus CSV/evidence; local Codex operator guide in Profile and rankings assistant. Independent review found one explicit-year fallback issue; owner repaired it, added five regressions, and reviewer approved the final delta. Validation: 831 tests pass (one existing opt-in integration skip); 141 distinct browser checks pass across full run and final 26-check affected-page rerun; typecheck, lint, formatting, whitespace and production build pass. Original/Compact image exports are pixel-identical to prior captures. Live account confirms 718.44→800 chart scale, all 12 years selected with nine available reports, and a real nine-manager contextual CSV. Provider-unavailable 2015–2017 remain clearly excluded from calculations. No deployment, merge, credential/consent/draft/publication mutation. Feature checklist: docs/insights-history-followup-coverage.md.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Finished all five October 15 follow-ups without feature removal. Local Codex setup replaces the broken GitHub link; chart scales use real extents; History defaults to all years while preserving explicit inputs; header spacing is corrected; a keyboard-accessible matchup heatmap opens verified evidence and downloads exact contextual CSV. Independent review approved after one repaired edge case. Full validation and export parity are recorded in the follow-up coverage document.
<!-- SECTION:FINAL_SUMMARY:END -->
