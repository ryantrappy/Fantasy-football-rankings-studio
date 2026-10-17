# UI refinement proposal

Open [ui-refinement.fig](ui-refinement.fig) in OpenPencil. Its two proposal pages contain five paired desktop (1440px) and mobile (390px) frames: Rankings studio, Season insights, Live matchups, Manage leagues and Connect league. Layers are native editable text/shapes/vectors, generated from the changed production-component fixtures. The existing `current-app.fig` baseline remains separate.

[reference/](reference/) contains browser rendering references, [screens.json](screens.json) the measured layer inputs and [frames.json](frames.json) the saved frame IDs. Inter substitutes for platform system fonts; fixed positions, gradients, shadows, native input adornments and hidden interactive states retain the [baseline fidelity limits](../README.md#fidelity-and-scope). The native document cannot demonstrate animation; interactive behavior is verified in the browser. This is an implementation review proposal, not a feature reduction authorization.

From the application root, with this branch's fixture server running on 3108:

```sh
node design/openpencil/build-ui-refinement.mjs
DESIGN_OUTPUT_DIR=./ui-refinement/ DESIGN_FILE_NAME=ui-refinement.fig DESIGN_EXPECTED_FRAMES=10 node design/openpencil/verify.mjs
```

The wrapper restricts capture to these five affected screens and writes only this proposal directory. Capture/build/verify scripts keep their original baseline defaults when no environment overrides are supplied. Verification reopens all ten native frames, checks editable text/vector layers and native truncation, edits/reopens a temporary copy, and renders each frame with strict font checks. Browser review evidence lives in [docs/ui-review/ui-refinement](../../../docs/ui-review/ui-refinement/README.md).
