---
id: TASK-87
title: Disambiguate league management when external IDs match across providers
status: Done
assignee:
  - '@codex'
created_date: '2026-10-03 21:23'
updated_date: '2026-10-04 04:03'
labels:
  - leagues
  - identity
dependencies: []
references:
  - src/server/services/leagues.service.ts
  - src/components/ManageLeagues.tsx
  - src/server/tests/league-rename.test.ts
  - src/components/ManageLeagues.test.tsx
documentation:
  - README.md
priority: medium
type: bug
ordinal: 98000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
TASK-25 allows one owner to register Sleeper and ESPN workspaces with the same numeric external ID. However ownerLeagueFilter resolves an unqualified ID with an owner-scoped OR on leagueId/providerLeagueId and no provider discriminator or ambiguity check. rename/archive/delete/provider-ID update can therefore select whichever matching workspace MongoDB encounters first. A scratch rename test with two provider workspaces sharing external ID 99 confirmed that reversing the match order changed which workspace was renamed. ManageLeagues also keys rows by providerLeagueId, yielding duplicate React keys for this supported case. This is a follow-up to completed TASK-25 and TASK-59, not a request to remove cross-provider support.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Workspace-ID management resolves the exact workspace, and ambiguous external-ID management cannot modify or delete an arbitrary match.
- [x] #2 Owners can explicitly resolve an external-ID collision using the provider or workspace identity; ownership checks remain enforced.
- [x] #3 Manage leagues renders and edits same-external-ID workspaces independently without duplicate React keys.
- [x] #4 Tests cover rename, archive, provider-ID change, and delete with same-owner cross-provider collisions and preserve legacy unambiguous identifier behavior.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Resolve exact owner workspace IDs first, then allow only one external-ID match; reject collisions with guidance to use workspace identity. Apply the resolver to every management mutation including pending deletions. 2. Key Manage leagues rows by workspace ID. 3. Test cross-provider collisions for all mutations, exact-ID precedence, owner isolation and legacy aliases; document and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Management now resolves exact owner workspace IDs first and rejects ambiguous external aliases before mutation. Rename/archive/provider updates/delete share the resolver, including pending deletion retries. Manage leagues keys rows by workspace ID. Verified same-owner Sleeper/ESPN alias collisions across all four mutations, exact identity precedence, legacy unambiguous aliases, owner isolation and independent DOM editing without duplicate keys; 20 affected tests, lint/typecheck passed. README updated.
<!-- SECTION:FINAL_SUMMARY:END -->
