# UI refinement review

Deterministic production-component fixture data only; no production accounts, credentials or provider calls. Before captures use the unchanged checkout on port 3107. After captures use this branch on port 3108. Chrome, device scale 1, reduced motion enabled; images show settled states, so browser tests cover disclosure transitions and keyboard behavior separately.

| Evidence                                                                                                    | Viewport / crop                       | What to compare                                                                      |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------ |
| [Live before](before/mobile-live-header.png) / [after](after/mobile-live-header.png)                        | 390 × 844                             | Header/nav spacing and Live controls                                                 |
| [Editor before](before/mobile-ranking-editor.png) / [after](after/mobile-ranking-editor.png)                | 390 × 1000                            | Editor navigation and saved-state controls                                           |
| [Ranking row before](before/mobile-ranking-row.png) / [after](after/mobile-ranking-row.png)                 | 390 × 844, scrolled to Team entries   | Team name, readiness, take excerpt, Edit take and movement controls                  |
| [Analytics before](before/mobile-analytics-navigation.png) / [after](after/mobile-analytics-navigation.png) | 390 × 1000                            | League/season controls, Team selector and detail navigation                          |
| [Analytics details before](before/mobile-analytics-detail.png) / [after](after/mobile-analytics-detail.png) | 390 × 844, same selected fixture team | Inspector evidence and return navigation; baseline scrolls directly to its inspector |
| [Profile focus before](before/desktop-profile-focus.png) / [after](after/desktop-profile-focus.png)         | 1440 × 900, top-right 480 × 440 crop  | Profile opened with Enter, first destination focused with Tab                        |

Reproduce with the fixture servers running:

```sh
node docs/ui-review/ui-refinement/capture.mjs
UI_REVIEW_PHASE=after UI_REVIEW_BASE_URL=http://127.0.0.1:3108 node docs/ui-review/ui-refinement/capture.mjs
```

The separate [editable OpenPencil proposal](../../../design/openpencil/ui-refinement/README.md) includes desktop/mobile rankings, season insights, Live, manage leagues and connect league. Browser PNGs are the rendering authority; the native proposal preserves editable text, rectangles, borders and vectors with the baseline's documented fixed-layout limitations.

Validation includes 893 passing unit tests (one optional live-provider test skipped), typecheck, lint, formatting, production build, strict forecast responsiveness/seeded parity and browser regressions. Layout checks cover 320, 390, 768, 1280 and 1440 px. The 200% reflow check models a 1280 × 900 display using a 640 × 450 CSS viewport at DPR 2; it does not exercise Chrome's toolbar zoom control. Original/Compact canonical PNGs pass unchanged, and same-environment before/after exports match every decoded pixel. Provider behavior is tested with deterministic fixtures; this review does not claim live provider verification.

Motion is limited to profile/share disclosures and user-opened forecast assumptions: enter translates 6 px with spring stiffness 400, damping 40, mass 1 and a 140 ms opacity fade; exit translates 4 px with stiffness 500, damping 45, mass 1 and a 100 ms fade. Hover color/border feedback takes 120 ms; focus outlines are immediate. Reduced motion is immediate, closing content becomes inert immediately, and mounted content retains state across rapid reopening.
