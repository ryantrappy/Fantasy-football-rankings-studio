---
id: TASK-99
title: Combine ESPN and Sleeper player projections for either league provider
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 04:36'
updated_date: '2026-10-04 04:53'
labels: []
dependencies: []
references:
  - src/server/live-matchups.server.ts
  - src/server/live-projections.server.ts
  - src/server/waivers.server.ts
  - src/components/PlayerProfilesPage.tsx
documentation:
  - README.md
priority: high
type: feature
ordinal: 106000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Player recommendations currently use only the league provider projection. Use ESPN and Sleeper player-level data for either league type, matching the same NFL player explicitly and applying the selected league scoring rules, so recommendations include both forecasts and their disagreement.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sleeper and ESPN league rosters can receive current-week projections from both sources without requiring a league on the other provider.
- [x] #2 Players are joined using explicit cross-provider IDs; ambiguous or absent mappings do not produce false matches.
- [x] #3 Raw projections are scored with the target league rules; unsupported scoring and missing source data are disclosed, with a safe native fallback.
- [x] #4 Lineup and trade recommendations use the combined estimate when comparable forecasts exist, while player profiles expose source values and disagreement; ownership and locks remain league-authoritative.
- [x] #5 Tests cover both league directions, custom scoring, identity gaps, provider failures and user-facing provenance; docs explain the combination limits.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Verify public ESPN projection and Sleeper identity/stat contracts. Add cached cross-provider player projections and explicit ID mapping, normalize supported scoring rules, combine comparable weekly forecasts with a native fallback and source notes. Enrich live rosters and Sleeper waiver candidates, expose provenance in profiles and advisors, verify both directions and failure cases, then commit the completed task.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added shared public ESPN/Sleeper player projections using unique catalog ESPN IDs, target-league additive scoring and explicit native fallbacks. Live lineups/trades and top-30 Sleeper waiver candidates use comparable means; profiles expose values, IDs, timestamps and disagreement. Verified both directions against live public feeds, 443 deterministic tests pass (1 optional network test skipped), typecheck and targeted lint pass. Provider interfaces remain undocumented and unsupported scoring/identity cases retain native data.
<!-- SECTION:FINAL_SUMMARY:END -->
