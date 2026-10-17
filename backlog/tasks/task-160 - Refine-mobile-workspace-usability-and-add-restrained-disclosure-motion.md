---
id: TASK-160
title: Refine mobile workspace usability and add restrained disclosure motion
status: Done
assignee:
  - '@codex'
created_date: '2026-10-17 04:07'
updated_date: '2026-10-17 19:02'
labels: []
dependencies: []
ordinal: 167000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
OpenPencil and browser review found mobile Live navigation overlap, crowded ranking rows, truncated context selectors, faint profile focus, and keyboard route dismissal gaps. The approved refinement retains existing identity and capabilities while improving interaction feedback.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Mobile Live, ranking rows, context selectors and inline detail navigation remain usable at 320 and390px with focus and state preserved.
- [x] #2 Profile and sharing disclosures support restrained springs, immediate reduced motion, keyboard navigation dismissal and rapid toggling without stale interactive content.
- [x] #3 League connection wording and destructive action grouping are clear without changing existing provider or confirmation workflows.
- [x] #4 Relevant feature contracts and regression tests pass, with original ranking exports unchanged.
- [x] #5 Separate editable OpenPencil proposal and before/after PR screenshots document the reviewed changes.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
Use three GPT-6.1 Sol medium agents with exclusive file ownership in an isolated branch from origin/main. Implement shell/motion, rankings/analytics, and league/design-evidence slices. Lead reviews diffs and rendered results, completes required checks, updates contracts, and opens an unmerged PR with commit-pinned screenshots.
<!-- SECTION:PLAN:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented with three GPT-6.1 Sol medium agents, then reviewed and integrated on codex/ui-refinement-motion from origin/main. Fixed mobile Live overlap, readable ranking rows, focus-preserving editor/detail return actions, full-width selectors, table overflow cues, Connect league wording and lifecycle grouping. Added persistent spring disclosures with immediate reduced motion and closing inertness. Review caught and fixed browser-history menu reopening and numeric export styling leakage. Validation: 893 unit tests passed (one optional live-provider test skipped), complete browser suite and strict forecast parity checked, canonical PNGs unchanged and same-environment exports pixel-identical, typecheck/lint/format/build passed. Separate OpenPencil proposal passed native save/reopen and rendering for ten frames; twelve labeled before/after screenshots accompany review. The 200% layout check uses equivalent CSS viewport/DPR, not browser toolbar zoom. Existing uncommitted current-app.fig remains untouched in the original checkout; PR is for review and must remain unmerged.
<!-- SECTION:FINAL_SUMMARY:END -->
