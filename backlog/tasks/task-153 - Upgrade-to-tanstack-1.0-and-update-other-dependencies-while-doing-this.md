---
id: TASK-153
title: Upgrade to tanstack 1.0 and update other dependencies while doing this
status: Done
assignee:
  - '@codex'
created_date: '2026-10-15 16:30'
updated_date: '2026-10-15 20:40'
labels: []
dependencies: []
ordinal: 160000
---

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Upgrade the application to the stable TanStack Start release and compatible current direct dependencies. Migrate non-streaming AI results and await asynchronous collection writes without changing product behavior. Document versions and compatibility, then validate focused regressions, the full unit suite, compiler, lint, format, production build and browser coverage.

Resolve label/content mismatches surfaced by the upgraded Axe checker in heatmap and Live matchup buttons, preserving visible evidence, keyboard interaction and strict accessibility gates.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Upgraded the application to stable Start 1.169.2 and current compatible dependencies. AI non-streaming results now read ChatResult.text; CLI private provider renamed to avoid new public adapter metadata collision. League/ranking saves await asynchronous cache writes. Vite React plugin requires Oxc compiler ^0.152.0, so selected 0.152.0 rather than incompatible latest 0.154.0. Strict npm install succeeded with zero vulnerabilities; npm ls confirms deduped Router, DB, React and compatible compiler peers. Focused writing/API/router coverage: 4 files, 72 tests passed. Typecheck, lint and format checks passed. Parent integration will run full unit, production build and browser suites before finalization. Root package remains untouched because it is outside the application Git repository.

Full integration: 878 unit tests passed, production build/typecheck/lint/format passed. Initial fresh-server browser suite passed 142/148; six accessibility cases exposed the new Axe 4.14 label-content-name-mismatch rule in existing heatmap/Live labels. Correcting names to include visible evidence, retaining accessibility assertions and data semantics; rerunning affected suites.

Final verification: 879 unit tests pass, one optional live ESPN test skipped. Production build (including typecheck), lint and repository formatting pass. Fresh-server browser suite: 142 of 148 initially passed; all six failures were Axe 4.14 label/content mismatches. Corrected heatmap/Live names and semantic whitespace; retained strict Axe checks, geometry/density assertions, all record/score evidence and interaction assertions. Five heatmap accessibility browser tests and all 11 Live browser tests now pass; remaining 16 history browser cases passed, so every scenario has passing evidence. Canonical Classic PNG baselines and cold forecast timing/parity checks passed. Dependency tree compatible and npm audit clean.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Upgraded to stable TanStack Start 1.169.2 and compatible current dependencies. Migrated TanStack AI non-streaming responses and adapter metadata, awaited asynchronous collection writes, and corrected accessible heatmap/Live names exposed by the new Axe checker. Verified 879 unit tests, all 148 browser scenarios across the full run and affected reruns, build/typecheck/lint/format, compatible peers and zero audit vulnerabilities. One optional live-provider check remains skipped.
<!-- SECTION:FINAL_SUMMARY:END -->
