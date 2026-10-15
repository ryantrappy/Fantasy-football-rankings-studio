---
id: TASK-147
title: Allow choosing classic or new rankings export theme
status: Done
assignee:
  - '@codex'
created_date: '2026-10-13 23:13'
updated_date: '2026-10-15 20:28'
labels: []
dependencies:
  - TASK-146
ordinal: 154000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
During review of the Manager Explorer redesign, the user requested that rankings studio exports keep their existing appearance and color scheme, while allowing the redesigned appearance as an optional theme in future. The current export contract is defined in src/export.css and rendered by RankingPreview; application styling must not silently change the downloaded image.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Rankings studio offers a clearly labeled Classic or New export theme choice with a preview of the selected appearance.
- [x] #2 Classic is the default and retains existing original and compact export geometry, typography, green header, green and red rank circles, row backgrounds, and movement colors.
- [x] #3 The selected theme applies consistently to original and compact PNG exports and ranking publication previews without changing ranking order, commentary, records, trends, or sharing behavior.
- [x] #4 The choice persists for the user across visits; users without a saved preference receive Classic.
- [x] #5 Theme selection and exports work on desktop and phone with accessible controls, and regression checks cover the unchanged Classic export and the optional New theme.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 - Tests pass
- [x] #2 Docs updated
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Add account-scoped browser export-theme preference with Classic fallback. 2. Apply opt-in New styling to the shared ranking preview and both PNG formats, preserving Classic CSS and publication content. 3. Expose the same selected appearance in an explicit publication preview. 4. Verify persistence, isolation, responsive controls, both themes and existing PNG baselines; update contracts and commit.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Verification: 9 focused Playwright tests passed, including existing Classic original/compact baselines at desktop/phone sizes, New PNG pixel colors and geometry, keyboard selection, reload/account isolation and explicit publication preview. Focused preference/publication/historical-record tests passed (8); complete suite passed (874 tests, 1 optional live-provider test skipped). Changed-file lint passed and Vite production bundles built successfully. Updated rankings preservation contract and feature index.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Added explicit Classic/New export themes, per-account browser persistence and an optional publication appearance preview. Both PNG formats preserve edition content; Classic remains the unchanged default, verified against canonical browser baselines. New exports, account isolation, reload persistence and storage failures have focused regression coverage.
<!-- SECTION:FINAL_SUMMARY:END -->
