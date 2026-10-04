---
id: TASK-95
title: 'Show actionable injury, bye-week, and lineup-risk alerts for managed teams'
status: Done
assignee:
  - '@codex'
created_date: '2026-10-04 02:43'
updated_date: '2026-10-04 04:16'
labels:
  - analytics
  - alerts
dependencies:
  - TASK-89
references:
  - src/server/insights/projections.ts
  - src/server/insights/load.server.ts
  - src/components/report-freshness.ts
  - src/api/client.ts
  - src/components/AppNavigation.tsx
documentation:
  - README.md
priority: medium
type: feature
ordinal: 102000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Injury/bye information currently influences forecasts but does not create a manager-facing list of actions. A one-stop workspace should surface a confirmed unavailable starter, an uncovered upcoming roster slot, or a material roster/projection refresh without requiring the manager to inspect every report. Scope the first version to in-app alerts; email, push delivery, and provider roster writes are separate future work.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The user sees team-specific in-app alerts for confirmed unavailable starters and upcoming bye/lineup gaps, with severity, affected player/week, timestamp, and a relevant workflow link.
- [x] #2 Uncertain or missing status data is distinguished from a confirmed injury; stale inputs cannot trigger a confidently current alert.
- [x] #3 Repeated refreshes do not create duplicate alerts, resolved conditions stop appearing as active, and dismissal preferences are scoped to the account/team/condition.
- [x] #4 Tests cover condition transitions, lineup/roster changes, partial provider failures, and privacy; the first version sends no external messages.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Derive stable team/week/player risk conditions from current managed roster snapshots, separating confirmed injury/bye/gap risks from unknown or stale inputs. 2. Display in-app overview alerts with severity/timestamp and profile/lineup links; persist bounded browser dismissals per account/team/condition. 3. Verify transitions, deduplication, stale/partial inputs, roster changes and account privacy; document and commit.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added team-specific overview risk alerts with severity, player/week, source timestamp and profile/lineup links. Fresh confirmed unavailable/bye starters and empty slots differ from uncertain or missing status/projections/locks; stale inputs downgrade to refresh warnings, including while the page remains open. Stable condition IDs deduplicate refreshes, resolved conditions disappear, and bounded browser dismissals are isolated by account/team/week/condition with restore controls. Verified transitions, roster changes, partial/stale data, elapsed-time downgrade and dismissal privacy in eight affected tests; lint/typecheck passed. No external delivery. README updated.
<!-- SECTION:FINAL_SUMMARY:END -->
