---
id: TASK-88
title: Use a finite power-ranking baseline for teams without completed matchups
status: Done
assignee:
  - '@codex'
created_date: '2026-10-03 21:23'
updated_date: '2026-10-04 04:03'
labels:
  - rankings
  - calculations
dependencies: []
references:
  - src/util/rankings.ts
  - src/util/rankings.test.ts
  - src/hooks/useRankingEditor.ts
documentation:
  - README.md
priority: medium
type: bug
ordinal: 99000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
powerOrderTeams computes average([]) for a team with no usable matchup history. Although its shrinkage weight is zero, zero times NaN remains NaN. Comparisons involving that team fall through to the alphabetical tie-break instead of the intended league-average baseline. A scratch test with teams ordered weak/missing/strong and one completed matchup (weak 50, strong 150) returned missing/strong/weak, placing the unmeasured team above the strongest scorer by name. This can affect partial provider histories and bye weeks; existing tests cover no data for all teams but not a mix of measured and unmeasured teams.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 A team without completed matchups receives a finite neutral league baseline when other teams have data.
- [x] #2 In the reproduced weak/missing/strong case the measured strong team ranks above the unmeasured team, which ranks above the weak team; names do not override unequal power scores.
- [x] #3 Zero scores, byes, and partial histories are handled deterministically; when nobody has usable data the existing provider-order fallback remains.
- [x] #4 Focused utility tests cover mixed sample counts and saved-edition behavior remains unchanged.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Return the neutral league baseline before averaging an empty team sample. 2. Verify mixed samples, zero scores, byes and no-data fallback alongside editor saved-edition tests; document and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Teams without matchup samples now receive a finite neutral league baseline before any empty average is calculated. Verified strong/missing/weak order regardless of names, zero scores, byes, incomplete games and no-data provider fallback in utility tests; existing editor tests preserve saved edition behavior. Lint/typecheck passed; README updated.
<!-- SECTION:FINAL_SUMMARY:END -->
