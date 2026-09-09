---
id: TASK-13.1
title: Explain writing-assistant readiness and setup failures
status: To Do
assignee: []
created_date: '2026-09-09 21:45'
labels:
  - writing-ai
dependencies: []
documentation:
  - README.md
parent_task_id: TASK-13
priority: medium
type: enhancement
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Users currently need to interpret installed/enabled CLI labels and environment configuration. Readiness feedback should make the next setup step clear.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 The panel distinguishes missing installation, missing account enablement and a failed generation/login check without claiming PATH discovery proves authentication.
- [ ] #2 User-facing failures provide actionable next steps without exposing server paths, tokens or raw CLI output.
- [ ] #3 Operator documentation includes verification steps for the same OS account and environment that run the app.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
