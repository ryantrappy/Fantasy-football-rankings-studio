---
id: TASK-152
title: >-
  Create open pencil designs for current design so that I can mock up future
  designs before the changes are made
status: Done
assignee:
  - '@codex'
created_date: '2026-10-15 16:29'
updated_date: '2026-10-15 20:39'
labels: []
dependencies: []
documentation:
  - design/openpencil/README.md
ordinal: 159000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
OpenPencil
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Provide a native OpenPencil file with editable desktop and mobile baselines of the current main screens.
- [x] #2 Document how to open, duplicate, edit and regenerate designs, with explicit fidelity and fixture boundaries.
- [x] #3 Verify the saved file parses, supports text editing and save/reopen, and renders each screen using supported fonts.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Capture the maintained deterministic production-component fixtures at desktop and mobile widths. Build editable OpenPencil native .fig layers, validate read/write/rendering with the official CLI, and document editing and regeneration.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Generated design/openpencil/current-app.fig using official @open-pencil/cli@0.16.0 (matching installed OpenPencil 0.16.0). Two pages contain 24 full-height frames covering 12 existing production-component fixture screens at desktop 1440px and mobile 390px. Includes browser references, captured geometry, regeneration scripts and usage documentation. Native text is editable; shapes and supported SVG icons remain native layers. Inter substitutes for OS-dependent system-ui; fixed-position layout and omitted hidden states/CSS effects are explicitly documented. No runtime source changes. Pending final artifact verification and lead integration.

Final verification passed: 24 native screen PNG exports with strict font policy; two pages and 3,729 native nodes (2,380 editable text, 1,093 rectangles, 146 vectors); native text mutation/save/reopen and persisted ending-ellipsis checks. SVG brand assets retain scaled vector children. Lead independent visual review identified and verified fixes for mobile snippet overflow and SVG scaling. Artifact oxlint and oxfmt checks passed. Final rendered QA directory: /var/folders/2r/bksy2jc56bx42nlpy_4jxdvr0000gn/T/fantasy-openpencil-verify-Rbu57x. Status intentionally remains In Progress for lead integration and task commit.

Lead independently reviewed desktop and mobile native renders against browser references. Corrected text clipping/ellipsis and SVG child scaling; complete brand mark now fits. Native file contains two pages and 24 editable screen frames; all strict-font renders, edit/save/reopen and persisted ellipsis checks pass. Fidelity boundaries remain explicit in the usage guide; feature index links the current reference.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added an editable OpenPencil .fig baseline covering 12 current screens at desktop and mobile widths, with exact browser reference images, measured geometry, deterministic capture/build/verification scripts and practical editing documentation. Native vectors include the app brand mark, and truncating text retains its full editable content. Verified all 24 screen exports and native editing/save/reopen using the official CLI matching the installed OpenPencil version. Typography and static-layout limitations are documented; no runtime source or production behavior changed.
<!-- SECTION:FINAL_SUMMARY:END -->
