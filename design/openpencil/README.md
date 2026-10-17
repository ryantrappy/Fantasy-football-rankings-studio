# Current app designs in OpenPencil

Open **[current-app.fig](current-app.fig)** in the installed OpenPencil desktop app with File → Open (or Cmd+O). This is a native editable document, created with the official OpenPencil plugin API, rather than screenshots placed on a canvas.

The **Desktop · current app** and **Mobile · current app** pages each contain twelve named screen frames. Desktop captures use 1440px width; mobile captures use 390px. Frames retain the full document height so below-the-fold content is available. Select a frame in the Layers panel and use Zoom to selection to inspect it. The frames are arranged horizontally in screen order.

| Screens                                                                                                                                                | Source                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Rankings studio, weekly overview, season insights, playoff forecasts, league history, profile and writing instructions, manage leagues, connect league | Existing `tests/ui/StudioPreview.tsx` production-component fixtures and application shell    |
| Live matchups                                                                                                                                          | Existing `tests/ui/LiveWorkspace.tsx` fixture                                                |
| Players, trade analyzer                                                                                                                                | Existing component fixtures, without application shell; frame names explicitly identify this |
| Sign in                                                                                                                                                | Existing `tests/ui/sign-in.tsx` production landing component fixture                         |

These use deterministic example teams and accounts from maintained browser tests, captured October 15, 2026. They contain no production account data or credentials. Browser references in [reference/](reference/) show the exact captured appearance and source content. `screens.json` records measured geometry, computed colors, text and fixture URLs; `frames.json` records the saved native file's frame IDs.

The separate [UI refinement proposal](ui-refinement/README.md) contains paired desktop/mobile frames for the current refinement, with its own references and regeneration command. It does not replace this baseline.

## Make a future mockup

1. Use Save As to make a proposal copy of `current-app.fig` before editing.
2. Duplicate a screen frame, rename it for the proposal and keep the original beside it for comparison.
3. Select a text layer to edit wording. Select shape layers to change fills, borders and spacing. Icons are vector layers. Layer names use their visible text or source control name.
4. Group related layers before moving a card or toolbar. Text is split at the original browser line breaks to retain layout; overflowing snippets keep native ending ellipsis and full editable source text; edit or regroup these lines together for longer copy.
5. Make the matching desktop and mobile changes, then export the selected proposal frame as PNG for review. Keep the `.fig` copy for further editing.
6. Compare against the affected [feature contracts](../../docs/feature-preservation.md) before implementing the proposal. A mockup does not authorize feature reductions.

## Fidelity and scope

The designs preserve captured layout geometry, colors, borders, rounded corners, visible text and supported SVG shapes. Text uses **Inter**, available to OpenPencil's font loader, in place of the app's OS-dependent `system-ui`; metrics and line positioning can differ slightly, and extremely narrow ellipsis snippets can render empty while retaining their full editable source text. The browser references are the visual authority. CSS gradients, shadows, pseudo-elements, emoji, browser-native select/textarea adornments and overflowing scroll regions may differ. Native design layers use fixed positions, without responsive auto-layout, interactive navigation, application calculations or data binding. Hidden menus, dialogs, expanded tabs and all possible league/data states are outside these baseline captures.

Use production components and regression tests for implementation behavior. This is a practical editable baseline for proposing future changes, not a replacement UI implementation or a new redesign.

## Regenerate from current components

From the application directory, start the existing test fixture server in one terminal:

```sh
npx vite --config tests/ui/vite.config.ts --host 127.0.0.1
```

In another terminal:

```sh
node design/openpencil/capture.mjs
node design/openpencil/build.mjs
node design/openpencil/verify.mjs
```

Requires project dependencies, Google Chrome, Node and npm. Build and verification use the pinned official `@open-pencil/cli@0.16.0` via `npx`; its initial download and font loading require network access. This does not add runtime dependencies or change app files. Set `DESIGN_BASE_URL` only if the fixture server uses a different origin. Regeneration overwrites the baseline `.fig`, references and JSON; keep proposals in a separate file.

Verification reopens the saved file, checks pages/screens, editable text/vector counts and persisted native ellipsis, edits and reopens a temporary copy, and renders each screen with strict font checks into a temporary directory. It leaves baseline and proposal files unchanged.

OpenPencil references: [native file format](https://openpencil.dev/reference/file-format), [exporting and opening files](https://openpencil.dev/user-guide/exporting), [official CLI and Figma plugin API](https://github.com/open-pencil/open-pencil). Format and commands were verified using the official CLI; opening `.fig` in OpenPencil is the intended editing workflow.
