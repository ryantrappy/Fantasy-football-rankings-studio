---
id: TASK-147
title: Allow choosing classic or new rankings export theme
status: To Do
assignee: []
created_date: '2026-10-13 23:13'
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
- [ ] #1 Rankings studio offers a clearly labeled Classic or New export theme choice with a preview of the selected appearance.
- [ ] #2 Classic is the default and retains existing original and compact export geometry, typography, green header, green and red rank circles, row backgrounds, and movement colors.
- [ ] #3 The selected theme applies consistently to original and compact PNG exports and ranking publication previews without changing ranking order, commentary, records, trends, or sharing behavior.
- [ ] #4 The choice persists for the user across visits; users without a saved preference receive Classic.
- [ ] #5 Theme selection and exports work on desktop and phone with accessible controls, and regression checks cover the unchanged Classic export and the optional New theme.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 - Tests pass
- [ ] #2 Docs updated
<!-- DOD:END -->
