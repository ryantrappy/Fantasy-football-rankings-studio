---
id: TASK-61
title: >-
  Allow editing league id associated with a league as well as delete leagues
  fully
status: Done
assignee:
  - Codex
created_date: '2026-09-16 20:15'
updated_date: '2026-09-16 20:20'
labels: []
dependencies: []
ordinal: 64000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
at leagues/manage the user should be able to edit leagues they have created
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Manage leagues lets an owner change a league's external provider ID after validating the target with its existing provider.
- [x] #2 A confirmed deletion removes the owned workspace and its local rankings, publications, and report snapshots, but never deletes the provider league.
- [x] #3 Both operations remain owner-scoped, handle invalid/duplicate IDs safely, and have focused UI/service coverage plus documentation.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Add owner-scoped management service methods for changing the provider ID and permanently deleting a workspace. Validate a new numeric provider ID by reading it through the configured provider before saving; preserve the local display name. On delete, retrieve the owned workspace, delete its local publication records, rankings, report snapshots and finally the workspace record. Expose authenticated RPC/API methods. Add an accessible management form for provider ID editing and a typed-name deletion confirmation, then write focused service/component tests, document local deletion scope, validate and commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Validated target provider IDs before updating the association, retaining local display names. Permanent delete removes embedded ranking revisions with their rankings, associated publication records, and owner-scoped report snapshots before the league workspace. It does not call provider deletion APIs.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Manage leagues now supports editing the external Sleeper/ESPN league ID and permanent local workspace deletion. Provider-ID updates normalize numeric IDs, validate the target through the configured provider, preserve the local display name, and retain owner scoping. The deletion flow requires the exact local display name and removes owned rankings (including revisions), published-edition records, report snapshots and the workspace record; it never deletes the upstream provider league. Added RPC/client wiring and focused service, authenticated client, and management UI coverage. Validation: full suite passed (58 files, 282 tests), production build, TypeScript, lint and diff checks passed. Documentation explains validation and the deletion scope.
<!-- SECTION:FINAL_SUMMARY:END -->
