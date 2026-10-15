# Feature preservation index

## Read only what the task needs

1. Read this index before planning changes. Identify affected areas, including shared dependencies.
2. Load only their contract files below; within a large area, search for relevant `TASK-*` IDs/headings and read those sections. Do not concatenate all contracts or read the archive by default.
3. Inspect linked backlog records, domain docs and code/tests only when needed for the affected behavior. Map affected IDs to preserved workflows and appropriate validation; report unresolved limitations.
4. Consult relevant entries in the [approval log](features/approved-changes.md) before relying on any exception. Before a new reduction, ask the user, receive explicit approval, and record its exact scope there before implementing it.

Preserve existing features, important user constraints, reachable controls, exports, saved content, provider support, calculations, privacy, missing-data disclosures, accessibility and selection state. Unlisted behavior is protected too. A refactor/redesign request is not permission to reduce features. Do not weaken tests or delete requirements to excuse a regression. Behavior-preserving work needs no extra approval.

## Choose affected areas

- **[Sharing and public reports](features/sharing.md)** — Anonymous season/history/playoff reports, previews, revocation, stored ESPN snapshots, canonical links, and the direct-only manager report.
- **[Rankings studio and exports](features/rankings.md)** — Writing, recoverable drafts, conflict resolution, revision history, publishing, copying, suggested power order, keyboard interaction, and original/compact image exports.
- **[Accounts, credentials, and league management](features/accounts-and-leagues.md)** — Profile editing, password recovery, private credentials, provider/workspace identity, onboarding, archive/delete, account-scoped selections, and managed-team setup.
- **[Season insights and historical lineup accuracy](features/season-insights.md)** — Basic achievements, manager comparison, CSV reports, distinct placements, best legal historical lineups, weighted start accuracy, positional strength, and schedule difficulty.
- **[Playoff forecasts, trends, and model evaluation](features/playoffs.md)** — Dedicated forecasts, round/title odds, legal projected lineups, schedules, season-specific rules, early-season warnings, trend charts, calibration, JSON replay exports, and immutable as-of archives.
- **[Live teams, players, and decision support](features/decision-support.md)** — Cross-league overview, lineup advice, available waivers, trade scenarios and suggestions, player search/comparisons, alerts, combined projections, and selected-league reads.
- **[League history and Manager Explorer](features/league-history.md)** — Rivalries, expected wins, Elo, honors/shame, eras, clutch results, record books, Pain Index, archived moments, draft skill, transaction networks, player relationships, archetypes, Wrapped, and focused manager navigation.
- **[Navigation, presentation, caching, and performance](features/navigation-and-performance.md)** — Responsive visual design, sign-in, loading placeholders, freshness, retained results, multi-season progress, shared session caches, catalogue coalescing, tab preloading, and bounded background computation.
- **[Operations, quality, and research](features/operations.md)** — Compiler behavior, error reporting/redaction, environment handling, safe backups, deterministic integration/browser checks, format gates, deployment examples, and documented provider research.

## Baseline and maintenance

Baseline: October 13, 2026; 148 records marked Done across active, completed and archived backlog folders. Area contracts retain all stable feature IDs and acceptance requirements; they condense request/delivery history into behavior constraints. Recorded intent may originate from earlier agents. Historical completion is not current test evidence.

TASK-72 is Done with unchecked criteria and no final summary; do not infer deployed profile verification. TASK-58, TASK-82, TASK-146 and TASK-147 are To Do at baseline and are not completed features or approval for reductions. TASK-145 is included from the working tree; inclusion does not imply a commit or fresh verification.

When completing or intentionally changing a feature, update only its relevant area contract and index routing as needed. Keep stable IDs, source links, important user constraints and approval references. Keep old intent and approved-change history; do not silently erase requirements. Later completed fixes refine older internals while preserving capabilities.

The [full original catalogue](feature-preservation-archive.md) retains original requests, criteria and delivery notes for targeted historical lookup. It is reference material, not required routine context; its old workflow/approval instructions are superseded by this index and the current approval log.

## Manager Explorer implementation

TASK-146 was implemented and validated on October 14, 2026. Its preservation audit is tracked in [the implementation coverage checklist](manager-explorer-coverage.md), with separate Analytics, Decision support and History evidence. The original/compact ranking-image contract remains unchanged and TASK-147 remains future work. No reduction is authorized by this redesign.

The subsequent usability iteration follows `trapp-ui-usability-implementation-spec.pdf` and `mockups/usability-improvements/`, preserving the user’s `gemini_app_redesign` edits. Its fresh checklist and validation boundaries are in [usability implementation coverage](usability-implementation-coverage.md); earlier counts above describe the earlier iteration. No reduction is approved and TASK-147 remains separate.
