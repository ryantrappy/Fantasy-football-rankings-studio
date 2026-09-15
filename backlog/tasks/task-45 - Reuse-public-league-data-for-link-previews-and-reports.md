---
id: TASK-45
title: Reuse public league data for link previews and reports
status: To Do
assignee: []
created_date: '2026-09-14 22:08'
labels:
  - performance
  - sharing
dependencies: []
documentation:
  - README.md
priority: low
type: enhancement
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

Opening a shared season, playoff, or history URL currently reads the same public league once for route metadata and again when the report component initializes its league picker. Reusing the validated public result would reduce database work and prevent metadata and page state from observing different sharing states during one navigation.

<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria

<!-- AC:BEGIN -->

- [ ] #1 An initial shared-report navigation performs no more than one public league lookup for both metadata and visible page context.
- [ ] #2 Client navigation between shared report tabs reuses valid cached public league data while still respecting sharing revocation and normal freshness rules.
- [ ] #3 Metadata and visible report state agree when a league is unavailable, and generic previews continue to hide provider errors and private fields.

<!-- AC:END -->

## Definition of Done

<!-- DOD:BEGIN -->

- [ ] #1 Tests pass
- [ ] #2 Docs updated

<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Observed after adding route-head loaders for shared link previews. Consider feeding loader data into the public TanStack Query cache or making the report component accept validated initial league data. Keep cache keys public-only and do not reuse authenticated owner collections.

<!-- SECTION:NOTES:END -->
