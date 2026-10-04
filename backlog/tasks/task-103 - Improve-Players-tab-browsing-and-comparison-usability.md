---
id: TASK-103
title: Improve Players tab browsing and comparison usability
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 05:14'
updated_date: '2026-10-04 05:23'
labels: []
dependencies: []
ordinal: 110000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The user liked the trade analyzer redesign and requested the same usability improvements for Players. The current page uses unstyled controls, a dense checkbox list and long text-only comparisons, making selection and scoring differences hard to scan.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Players can be found with clearly labeled search and filters, with compact identity, ownership and projection information.
- [x] #2 Selected players stay visible while filtering, can be removed individually or cleared, and have readable comparisons over a common week range.
- [x] #3 Deep-linked players, zero scores, missing data, refresh and league/season changes retain correct behavior; desktop/mobile layouts and accessibility are verified.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Style league/season and browsing controls, replace the raw list with searchable player rows and a persistent selection summary. 2. Present selected player comparisons as responsive cards with prominent projection/observed metrics, structured weekly scores and expandable source detail. 3. Fix scoped loading/selection issues uncovered by the flow and verify component/browser behavior, build and lint; update Players documentation.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verified 11 focused component/model tests and 2 Players browser tests at 1280px and 390px with zero axe violations; trade browser tests also pass after preview integration. Reviewed rendered screenshots. Production build/typecheck and changed-file lint/format pass. Project-wide lint retains the unrelated DataTable aria-description issue. README documents filters, persistent selections, expandable metrics and default comparison range.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Redesigned Players with styled league/season controls, searchable player rows, position filtering, persistent removable selections and responsive comparison cards. Prominent projection and observed metrics preserve zero/missing distinctions; weekly scores and provider details expand on demand. Default comparisons use the latest reported week. Fixed refresh resetting league/season, empty-list loading and stale unowned-pool responses after context changes. Verified 11 unit/DOM tests, desktop/mobile browser interactions with axe, production build and changed-file checks.
<!-- SECTION:FINAL_SUMMARY:END -->
