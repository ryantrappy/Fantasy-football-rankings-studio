---
id: TASK-48
title: Make the repository format check enforceable
status: Done
assignee:
  - '@codex'
created_date: '2026-09-14 22:14'
updated_date: '2026-09-15 12:10'
labels:
  - tooling
  - ci
dependencies: []
documentation:
  - README.md
modified_files:
  - .github/workflows/verify-proposed-change.yml
  - .oxfmtrc.json
  - README.md
  - docker-compose.yml
  - docker-running.md
  - src/components/ManagerReportPage.test.tsx
  - src/routes/health.ts
  - src/server/insights/calculate.test.ts
  - src/server/tests/public-insights.test.ts
priority: low
type: enhancement
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
`npm run format:check` reports many pre-existing formatting differences, so normal task verification must format only changed files and cannot use the repository-wide command as a reliable gate. This allows formatting drift to continue even though the check is documented.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 The checked-in source, test, script, and documentation files covered by the formatter pass `npm run format:check` from a clean checkout.
- [x] #2 Generated output, build artifacts, baselines, dependencies, and intentionally excluded files are represented explicitly in formatter configuration rather than relying on local state.
- [x] #3 CI runs the format check for proposed changes and provides a clear command for contributors to repair failures without altering generated or user-owned artifacts.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Inventory current formatter failures and define explicit ignore rules for generated files, dependencies, build output, baselines, Backlog records, and user-owned agent guidance.
2. Mechanically format the remaining checked-in source, tests, scripts, configuration, and documentation, then add the format gate to proposed-change CI.
3. Document check and repair commands, run format/check/test/build verification, finalize Backlog, and commit the dedicated normalization.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Observed throughout backlog verification: `npx oxfmt --write` was safe for each task's changed files, while the global check included unrelated historical differences. Land the normalization as a dedicated mechanical commit, review its scope separately from behavior changes, and then add the check to `.github/workflows/verify-proposed-change.yml`.

Added explicit Oxfmt ignore patterns for Backlog records and agent guidance alongside existing dependency, generated, build, coverage, baseline, and lockfile exclusions. Mechanically normalized the six remaining formatter-covered files, added the repository format gate to proposed-change CI, and documented both the check and repair command. User-owned AGENTS.md/guidelines.md and untracked TASK-41 remain untouched.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
The repository-wide format check now passes on all 209 formatter-covered files. Oxfmt configuration explicitly represents excluded generated/dependency/Backlog/agent files, CI runs npm run format:check, and README documents npx oxfmt --write . for repair. Full tests (242), typecheck, lint, and production build pass.
<!-- SECTION:FINAL_SUMMARY:END -->
