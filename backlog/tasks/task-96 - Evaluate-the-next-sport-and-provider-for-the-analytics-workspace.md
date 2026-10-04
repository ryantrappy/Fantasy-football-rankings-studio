---
id: TASK-96
title: Evaluate additional NFL analytics and projection providers
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 02:43'
updated_date: '2026-10-04 04:23'
labels:
  - analytics
  - roadmap
  - providers
dependencies: []
references:
  - src/server/interfaces/league.interface.ts
  - src/server/providers/league-provider.ts
  - src/server/insights/load.server.ts
  - src/server/insights/projections.ts
  - src/playoff-forecast.ts
  - src/util/rankings.ts
documentation:
  - README.md
priority: medium
type: spike
ordinal: 103000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Keep NFL as the only sport. Investigate additional data providers for better analytics and projections, with an evidence-backed recommendation and bounded first delivery.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Compare NFL enrichment sources, access, authentication, costs, terms and coverage; mark unverified access.
- [x] #2 Separate league ownership providers from enrichment and explain custom scoring, identity, calendar and provenance requirements.
- [x] #3 Recommend one bounded read-only slice with representative fixture evidence and explicit unsupported metrics.
- [x] #4 Propose focused follow-up briefs with dependencies, estimates and risks while preserving NFL records and share links.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Research primary provider documentation. Document the comparison and a gated recommendation, show a synthetic normalization/scoring example, and propose delivery briefs without adding another sport or integrating paid services.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Documented NFL-only provider comparison using primary sources, a gated FantasyPros weekly comparison recommendation, synthetic scoring/identity evidence, and four delivery briefs with estimates and risks. No external feed was activated. Full unit suite passed (418 tests).
<!-- SECTION:FINAL_SUMMARY:END -->
