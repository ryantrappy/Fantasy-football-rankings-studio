---
id: TASK-9
title: Publicly accessible page to point of flaws in manager
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 04:13'
updated_date: '2026-09-09 11:50'
labels: []
dependencies: []
priority: medium
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
league id 1312529175982129152 sleeper 
manager name konz4

I need to create a page full of as many stats that show konz4 is not a good manager. Highlight poor trades, poor player adds/drops, draft misses, or any other stat that might show an error being made in hindsight.

This page should be separate from the rest of the application and only accessible by going to the page directly. name it something like /shared/konz-sux
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add /shared/konz-sux as a standalone route outside the public navigation layout, with no navigation entry and noindex metadata.
2. Resolve konz4 in the fixed public Sleeper league, follow linked seasons (up to six most recent), and build a cached public report with per-season coverage and errors. Do not accept arbitrary target/user inputs.
3. Show evidence-backed weak scoring, unfavorable all-play/median results, losses, negative graded trades, negative pickup lifts (including dropped-player baselines), and same-position draft hindsight comparisons when common observed weeks support them. Include sample sizes, dates/seasons, source links, and explicit no-evidence/unavailable states.
4. Keep tone as fantasy-league banter tied to measured decisions. Test calculations/selection, empty/failed data, public access without Auth0, and responsive report rendering. Document scope and limitations.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Live verification loaded all six linked seasons in about 6.5 seconds with zero season errors: 44 below-median weeks / 86 observed weeks, 5 negative graded trades, 17 negative rated pickups. Browser production check at 1280px and 390px: report loads anonymously, zero navigation elements, noindex/nofollow present, no browser errors and mobile document width equals viewport. Inspected mobile screenshot. Five new unit/DOM tests pass; production build/typecheck and lint pass. Temporary live test removed after verification.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added the direct-only /shared/konz-sux report with no navigation entry or Auth0 requirement. It follows six fixed public Sleeper seasons and presents negative scoring, trade and pickup evidence plus same-position draft hindsight comparisons, with explicit samples, source links, missing-data states and critical-selection disclosure. Confirmed finishes remain visible, including the 2025 championship.

Server requests are cached and deduplicated. Validation: live six-season load succeeded; five new calculation/DOM tests pass; production build/typecheck and lint pass. Desktop/mobile browser checks confirmed anonymous access, no navigation, noindex metadata, no page errors and no horizontal overflow at 390px.
<!-- SECTION:FINAL_SUMMARY:END -->
