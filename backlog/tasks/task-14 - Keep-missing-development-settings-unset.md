---
id: TASK-14
title: Keep missing development settings unset
status: Done
assignee:
  - '@codex'
created_date: '2026-09-09 11:52'
updated_date: '2026-09-09 16:46'
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
- [x] #1 Absent server settings remain absent after Vite configuration runs.
- [x] #2 Defined file values load and existing process values retain precedence.
- [x] #3 Regression coverage includes absent Auth0/ESPN settings.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Guard the development environment assignment so only defined file values enter process.env, preserving shell overrides. Add regressions for missing Auth0, ESPN and writing-assistant settings; document default behavior. Run configuration tests, typecheck and lint, then commit this task separately.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Guarded undefined Vite file settings before process.env assignment. Regression tests cover absent Auth0, ESPN and writing settings, defined file values and shell precedence. Both configuration tests, typecheck, lint and git diff --check pass. README documents missing-setting behavior.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Missing development settings remain absent instead of becoming the string "undefined". Existing shell values retain precedence. Configuration regressions and documentation updated; tests, typecheck and lint pass.
<!-- SECTION:FINAL_SUMMARY:END -->
