---
id: TASK-38
title: Use Ox compiler
status: Done
assignee:
  - '@codex'
created_date: '2026-09-10 04:43'
updated_date: '2026-09-14 09:36'
labels: []
dependencies: []
priority: high
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->

https://oxc.rs/docs/guide/usage/transformer/react-compiler.html
docs found here

import like this

import { transform } from "oxc-transform-react";
<!-- SECTION:DESCRIPTION:END -->

## Definition of Done

<!-- DOD:BEGIN -->

- [x] #1 - Tests pass
- [x] #2 Docs updated

<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->

Replace the Babel React Compiler preset with `@vitejs/plugin-react`'s native Oxc compiler option in the application and browser-test Vite configurations. Install and lock `oxc-transform-react`, remove the dedicated Babel compiler dependencies, verify the React 19 target in configuration tests, and confirm memo-cache output in a production build.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->

Moved application and browser-fixture compilation to `react({ compiler: { target: '19' } })`, backed by `oxc-transform-react`, while preserving TanStack Start before the React plugin. Removed the Babel React Compiler preset and its direct Babel dependencies. Added a configuration assertion, documented the experimental Oxc integration, and confirmed React Compiler memo-cache output. All 187 tests, lint, typecheck and the production build pass.
<!-- SECTION:FINAL_SUMMARY:END -->
