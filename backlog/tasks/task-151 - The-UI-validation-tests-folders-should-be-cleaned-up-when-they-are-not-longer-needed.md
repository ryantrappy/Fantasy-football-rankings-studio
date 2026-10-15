---
id: TASK-151
title: >-
  The UI validation tests folders should be cleaned up when they are not longer
  needed
status: Done
assignee:
  - '@codex'
created_date: '2026-10-15 16:26'
updated_date: '2026-10-15 20:11'
labels: []
dependencies: []
ordinal: 158000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove completed redesign-only references and obsolete UI validation artifacts before integration, retaining durable feature contracts, regression tests, fixtures, export baselines and useful testing guidance. Investigate the reported writing cancellation and cold forecast browser failures and rerun all validation gates.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Reported writing cancellation failure is deterministic and verifies real cancellation without lost safety assertions.
- [x] #2 Cold forecast tests retain seeded parity and meaningful responsiveness assertions and pass with the full browser suite.
- [x] #3 Completed mockups, design PDF, one-off redesign reports and obsolete generated validation folders are removed; retained documentation has no broken active references.
- [x] #4 Useful regression tests, production fixtures, canonical export baselines and feature contracts remain intact.
- [x] #5 Full unit/UI suites, typecheck, lint, formatting and build pass; independent review and final evidence are recorded.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Delegate the two reported test failures to non-overlapping owners. Lead inventories and cleans obsolete design artifacts, preserves durable requirements and testing guidance, then reviews changes and runs full integration checks. Independent reviewer checks test strength, cleanup boundaries and remaining references.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Removed 45 obsolete ignored test-results-* directories, docs/mockups, the completed design PDF and ten one-off reports: 57 targets, 867 files, about 173 MiB. All 25 browser spec files, fixtures, canonical PNG baselines, domain/feature contracts and future TASK-147/TASK-148 requirements remain. Useful guidance is consolidated in docs/ui-testing.md; active local links were verified and historical task notes retained.

The writing cancellation test waits for enabled consent and controller readiness, then verifies actual signal abort, cancellation feedback, no applied output/error and generation-slot release. All 10 tests pass with 30 repeats. Cold forecast checks run alone before parallel functional tests; all five assertions, the 50 ms limit and exact 20,000-trial parity remain. Observer flushing/final-gap measurements now detect blocking completion tails; an 80 ms negative control failed as intended. The original failures were not reproduced in baseline/stress runs, so timing isolation is preventive stability rather than a confirmed production-bug fix.

Final validation: npm test passed 860 tests across 153 files, with one optional live ESPN integration skip (34.39 s). The default npm run test:ui passed all 143 tests in one run (2.1 min); the 32-team check had an 11.4 ms maximum gap, no long tasks and exact parity. Typecheck, lint, formatting, production build and whitespace checks pass. Independent review approved with no unresolved findings. Logs: /tmp/task-151-{unit,ui,types,lint,format-final,build}.log; cleanup manifest: /tmp/task-151-cleanup-manifest.json. No runtime source, export source or baseline changes; no merge or deployment.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Removed completed prototypes/PDF, ten one-off reports and 45 obsolete result directories (about 173 MiB), preserving reusable regression tests, fixtures, export baselines, feature contracts and future task requirements. Added durable testing guidance and repaired active links. Stabilized writing cancellation synchronization and isolated forecast timing without weakening assertions. All 860 unit tests and 143 UI tests pass, with one optional live integration skip; static/build checks and independent review pass.
<!-- SECTION:FINAL_SUMMARY:END -->
