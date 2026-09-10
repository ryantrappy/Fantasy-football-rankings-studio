---
id: TASK-25
title: Support identical league IDs across providers and accounts
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 21:45'
updated_date: '2026-09-10 03:28'
labels:
  - leagues
dependencies: []
documentation:
  - README.md
priority: medium
type: enhancement
ordinal: 26000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The documented ownership model permits only one account per external league ID and does not support cross-provider collisions. Independent writers should be able to register their own workspaces safely.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Sleeper and ESPN leagues with the same numeric ID can coexist.
- [x] #2 Two accounts can independently register the same external league without gaining access to one another's drafts or credentials.
- [x] #3 Existing league records and share links have a documented migration path with ownership-isolation regression coverage.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Keep existing numeric workspace IDs and share links stable. Add separate providerLeagueId for new registrations, allocate unique numeric workspace IDs, and enforce owner+provider+external-ID uniqueness. Route all provider requests through the external ID fallback for legacy records. Preserve owner-scoped drafts and credentials, cover collisions and duplicate registration in the isolated Mongo fixture, document additive migration, and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
New registrations use distinct numeric workspace IDs and providerLeagueId, with owner/provider/external-ID uniqueness enforced by a partial Mongo index. Provider requests resolve external IDs; existing documents, rankings and shared URLs retain their original IDs. Isolated Mongo verification covers same external ID across owners/providers, duplicate registration races and denied cross-owner reads. Full suite had 181 passes and one outdated projection assertion; corrected assertion passes with typecheck and lint. Documentation explains additive deployment migration.
<!-- SECTION:FINAL_SUMMARY:END -->
