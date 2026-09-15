---
id: TASK-48
title: Make the repository format check enforceable
status: To Do
assignee: []
created_date: '2026-09-14 22:14'
labels:
  - tooling
  - ci
dependencies: []
documentation:
  - README.md
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

- [ ] #1 The checked-in source, test, script, and documentation files covered by the formatter pass `npm run format:check` from a clean checkout.
- [ ] #2 Generated output, build artifacts, baselines, dependencies, and intentionally excluded files are represented explicitly in formatter configuration rather than relying on local state.
- [ ] #3 CI runs the format check for proposed changes and provides a clear command for contributors to repair failures without altering generated or user-owned artifacts.

<!-- AC:END -->

## Definition of Done

<!-- DOD:BEGIN -->

- [ ] #1 Tests pass
- [ ] #2 Docs updated

<!-- DOD:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->

Observed throughout backlog verification: `npx oxfmt --write` was safe for each task's changed files, while the global check included unrelated historical differences. Land the normalization as a dedicated mechanical commit, review its scope separately from behavior changes, and then add the check to `.github/workflows/verify-proposed-change.yml`.

<!-- SECTION:NOTES:END -->
