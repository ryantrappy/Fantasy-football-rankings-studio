---
id: TASK-14
title: Keep missing development settings unset
status: To Do
assignee: []
created_date: '2026-09-09 11:52'
labels: []
dependencies: []
priority: medium
type: bug
ordinal: 14000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The Vite environment allowlist assigns missing file values into process.env. Node coerces undefined to the literal string "undefined", so optional services can appear configured and required-service checks can be bypassed accidentally. This affects clean development setups without every server setting.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Absent server settings remain absent after Vite configuration runs.
- [ ] #2 Defined file values load and existing process values retain precedence.
- [ ] #3 Regression coverage includes absent Auth0/ESPN settings.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
