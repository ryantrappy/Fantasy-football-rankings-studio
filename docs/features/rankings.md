# Rankings studio and exports: preservation contracts

Read only when this area or a shared dependency is affected. Start at the [feature index](../feature-preservation.md). Any reduction requires explicit user approval recorded in the [approval log](approved-changes.md) before implementation.

## Important constraints

- **Keep the original ranking download.** The visual refresh request explicitly says “Do not change the download version” (TASK-3). Publishing and compact export contracts retain the original PNG/default and all commentary (TASK-17, TASK-30). Pending theme-choice work is not permission to replace the existing export.
- **Preserve the writer's work.** Reloads, network failures, simultaneous editors, revision restoration, delayed publication, and league archiving must not silently lose or expose prose (TASK-15–TASK-20, TASK-83, TASK-86).
- **Keep decision support inspectable.** Lineup, waiver, trade and player workflows must work without generated prose, disclose scoring/projection provenance, respect observed ownership, and remain read-only toward provider transactions. Writing suggestions are optional, configurable, cancellable and editable (TASK-13 and subtasks, TASK-90–TASK-95, TASK-99, TASK-110).

## Related areas and verification

Also read accounts-and-leagues for workspace/owner changes, sharing for public publication changes, and season-insights/playoffs for score or projection changes. Area names refer to files linked in the index; follow only relevant dependencies.

Useful references/checks (starting points, not a substitute for inspecting affected code):

- [useRankingEditor.test.tsx](../../src/hooks/useRankingEditor.test.tsx)
- [PublishEdition.test.tsx](../../src/components/PublishEdition.test.tsx)
- [RevisionHistory.test.tsx](../../src/components/RevisionHistory.test.tsx)

## Feature contracts

Stable IDs trace to the original backlog. Criteria are requirements, not evidence that today’s code or deployment was tested. Load source requests/history only to resolve a specific detail. Later completed corrections refine earlier implementation details.

### TASK-13 — Suggest things to write about

- Keep optional rankings-editor writing suggestions grounded in verified team scoring trends, trades/pickups and roster depth.
- Keep TanStack AI integration, configurable models, discovered Codex/Claude CLI providers, explicit consent, restricted execution and editable suggestions. Disclose server-account semantics.
- Preserve readiness explanations, cancellation and current-roster grounding in TASK-13.1–TASK-13.3.

Source: [TASK-13](../../backlog/tasks/task-13%20-%20Suggest-things-to-write-about.md).

### TASK-13.1 — Explain writing-assistant readiness and setup failures

- The panel distinguishes missing installation, missing account enablement and a failed generation/login check without claiming PATH discovery proves authentication.
- User-facing failures provide actionable next steps without exposing server paths, tokens or raw CLI output.
- Operator documentation includes verification steps for the same OS account and environment that run the app.

Source: [TASK-13.1](../../backlog/tasks/task-13.1%20-%20Explain-writing-assistant-readiness-and-setup-failures.md).

### TASK-13.2 — Cancel a writing-suggestion request

- A running generation exposes a cancel action with clear pending and cancelled feedback.
- Cancellation stops the associated server work and releases the user's request slot.
- Cancelled or late responses cannot populate another team's suggestions; cancellation preserves ranking prose.

Source: [TASK-13.2](../../backlog/tasks/task-13.2%20-%20Cancel-a-writing-suggestion-request.md).

### TASK-13.3 — Ground depth suggestions in current roster ownership

- Current-season depth separates starters and bench players from the latest available roster with a visible snapshot date.
- Players no longer owned are excluded from claims about current depth.
- Historical selections do not substitute today's roster for historical ownership; unsupported snapshots are identified explicitly.

Source: [TASK-13.3](../../backlog/tasks/task-13.3%20-%20Ground-depth-suggestions-in-current-roster-ownership.md).

### TASK-15 — Protect ranking drafts across reloads and connection loss

- An unsaved edition can be recovered after a reload with its title, introduction, order and commentary intact.
- Recovery is isolated by account, league, season and week; another signed-in account cannot see the draft.
- The writer can choose whether to restore or discard a recovered draft without silently replacing saved content.

Source: [TASK-15](../../backlog/tasks/task-15%20-%20Protect-ranking-drafts-across-reloads-and-connection-loss.md).

### TASK-16 — Prevent simultaneous editors from silently overwriting rankings

- Saving a stale edition reports a conflict and preserves the local draft.
- The writer can inspect the newer saved edition before choosing a resolution.
- Two overlapping saves are covered by a regression scenario demonstrating no silent data loss.

Source: [TASK-16](../../backlog/tasks/task-16%20-%20Prevent-simultaneous-editors-from-silently-overwriting-rankings.md).

### TASK-17 — Separate private drafts from published ranking editions

- Owners can publish and unpublish a selected weekly edition explicitly.
- A public read-only link shows only the published version, including while its draft is being edited.
- Unpublished editions and draft content are unavailable to anonymous readers; the original PNG format stays unchanged.

Source: [TASK-17](../../backlog/tasks/task-17%20-%20Separate-private-drafts-from-published-ranking-editions.md).

### TASK-19 — Show and restore ranking revision history

- Owners can list saved revisions of an edition with timestamps.
- A revision preview shows title, introduction, order and commentary before restoration.
- Restoring an older revision creates a new current revision without erasing history or exposing another owner's data.

Source: [TASK-19](../../backlog/tasks/task-19%20-%20Show-and-restore-ranking-revision-history.md).

### TASK-23 — Copy selected content from a previous edition

- The writer can select a source edition and choose whether to copy introduction, team commentary and ordering.
- The destination remains unchanged until the writer confirms, and existing destination content is identified before replacement.
- Missing or renamed teams are explained; unmatched teams are not silently dropped and the source remains unchanged.

Source: [TASK-23](../../backlog/tasks/task-23%20-%20Copy-selected-content-from-a-previous-edition.md).

### TASK-24 — Use the correct historical record in weekly rankings

- Historical editions display team records through the selected week for supported providers.
- When historical records cannot be established, the UI identifies that limitation rather than presenting current records as historical.
- Regression fixtures include an older week followed by additional wins, losses and ties; exported records match the selected week.

Source: [TASK-24](../../backlog/tasks/task-24%20-%20Use-the-correct-historical-record-in-weekly-rankings.md).

### TASK-30 — Offer an optional mobile-friendly ranking image

- Writers can explicitly choose a compact export while the existing download remains the default.
- Compact exports preserve all team order and commentary, including long names and descriptions.
- The original desktop/mobile download snapshots remain unchanged; compact output is visually checked for clipping.

Source: [TASK-30](../../backlog/tasks/task-30%20-%20Offer-an-optional-mobile-friendly-ranking-image.md).

### TASK-33 — Show keyboard shortcuts in the ranking editor

- The editor offers an accessible shortcut reference covering existing drag, move, cancel and undo interactions.
- The reference is usable at mobile widths and can be opened and closed using a keyboard.
- Documented shortcuts match actual behavior and do not intercept normal typing in commentary fields.

Source: [TASK-33](../../backlog/tasks/task-33%20-%20Show-keyboard-shortcuts-in-the-ranking-editor.md).

### TASK-63 — When creating a new league in the ranking studio suggest a ranking based on power not necessarily record

- A new unsaved weekly ranking starts in a power order based on completed score and point-margin data, rather than provider standings alone.
- The score uses only weeks before the selected edition, shrinks small samples toward league average, and leaves saved editions unchanged.
- The studio explains the suggested order and tests cover ranking behavior, data boundaries, and unavailable matchup fallback.

Source: [TASK-63](../../backlog/tasks/task-63%20-%20When-creating-a-new-league-in-the-ranking-studio-suggest-a-ranking-based-on-power-not-necessarily-record.md).

### TASK-83 — Prevent autosave revision history from exhausting the ranking document size

- Repeated saves of valid large editions remain possible beyond the reproduced 120-save case without exceeding MongoDB document limits.
- Existing revision history remains readable and restorable through a documented rollout or migration; restoring still creates a new revision.
- Routine ranking list/load requests avoid materializing all historical snapshots, and revision browsing remains usable as history grows.
- Regression coverage verifies repeated saves, restoration, and stale-writer rejection with the revised persistence behavior.

Source: [TASK-83](../../backlog/tasks/task-83%20-%20Prevent-autosave-revision-history-from-exhausting-the-ranking-document-size.md).

### TASK-86 — Prevent delayed publication requests from replacing newer publication decisions

- An older delayed publish cannot overwrite a newer successful publication of the same edition; the client receives a useful conflict outcome.
- A publish request already in flight cannot silently undo a later successful unpublish.
- Public readers see one complete approved snapshot, and intentional later republishing still works.
- Deterministic concurrency tests cover out-of-order publishes and publish/unpublish interleavings; existing owner and snapshot-isolation checks still pass.

Source: [TASK-86](../../backlog/tasks/task-86%20-%20Prevent-delayed-publication-requests-from-replacing-newer-publication-decisions.md).

### TASK-88 — Use a finite power-ranking baseline for teams without completed matchups

- A team without completed matchups receives a finite neutral league baseline when other teams have data.
- In the reproduced weak/missing/strong case the measured strong team ranks above the unmeasured team, which ranks above the weak team; names do not override unequal power scores.
- Zero scores, byes, and partial histories are handled deterministically; when nobody has usable data the existing provider-order fallback remains.
- Focused utility tests cover mixed sample counts and saved-edition behavior remains unchanged.

Source: [TASK-88](../../backlog/tasks/task-88%20-%20Use-a-finite-power-ranking-baseline-for-teams-without-completed-matchups.md).

### TASK-114 — Resolve ESPN ranking-studio matchups by scoring week rather than period ID

- A selected ESPN scoring week returns the matchup period containing that week using the published calendar or a validated equivalent mapping.
- The returned opponent and score context explicitly distinguish selected-week points from multiweek aggregate points; unknown or overlapping mappings do not substitute another period.
- Single-week leagues and bye matchups continue to work, including regular-season and playoff period mappings where published.
- Provider and ranking-editor regression tests cover week 3 inside period 2, unknown calendars, single-week behavior and selected-week versus aggregate scores; user-facing score semantics are documented.

Source: [TASK-114](../../backlog/tasks/task-114%20-%20Resolve-ESPN-ranking-studio-matchups-by-scoring-week-rather-than-period-ID.md).

### TASK-146 — Focused ranking authoring, unchanged images

- Default authoring pairs the selected team with its editable take; Edit all takes retains the full inline editor. Selection does not change rank order or another team's prose.
- The same protected draft hook, reorder sensors, manual/autosave, undo, recovery, conflicts, copy, revision and publication flows remain. Original/compact PNG rendering, stylesheet, records, trends and full commentary are unchanged.
- Writing preserves provider/model choice, actionable operator readiness, saved/revocable provider consent and cancellation. Inspect current-roster context through the existing owner-only API; suggestions are editable and applied only by an explicit action. Account changes cannot inherit readiness/consent/evidence.
- Verification and boundaries: [UI regression guidance](../ui-testing.md), existing draft/service tests and unchanged PNG baselines, new focused authoring/model/consent/source-evidence browser regressions. TASK-147 remains separate.

## TASK-146 usability iteration — October 14, 2026

The usability iteration moves real edition actions above the list, adds completion/movement/take previews and a sticky team editor with steppers, and offers isolated Original/Compact preview selection. Reordering pins the selected team; Undo move restores order while preserving prose written afterward. Readiness refresh cannot reload stale context-sharing consent over a revocation. Export styles/markup stay unchanged; same-environment before/after PNGs have zero changed pixels. See [UI regression guidance](../ui-testing.md) for saved-baseline rasterization limits and validation.

### TASK-150 — Apply only the writer's saved profile instructions

- Writing generation loads the verified requesting account's optional writing instructions for each request. No preference becomes a global default, leaks into another account's prompt, or changes the owned factual context.
- Saved text guides voice, phrasing, humor, and emphasis; the existing facts-only talking points, output limit, restricted tool/file access, provider/model selection, saved consent, cancellation, and explicit suggestion application remain intact. Empty instructions use the default prompt.
- Preference-read failure releases the active request slot and supports retry. Account changes cannot inherit another writer's saved style; profile save/clear behavior is documented in the accounts contract.

Source: [TASK-150](../../backlog/tasks/task-150%20-%20Save-private-writing-instructions-on-each-user-profile.md).
