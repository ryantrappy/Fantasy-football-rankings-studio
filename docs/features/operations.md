# Operations, quality, and research: preservation contracts

Read only when this area or a shared dependency is affected. Start at the [feature index](../feature-preservation.md). Any reduction requires explicit user approval recorded in the [approval log](approved-changes.md) before implementation.

## Important constraints

- **Prefer TanStack when a framework choice exists.** This remains an explicit workspace instruction; implementation modernization must still preserve product behavior.

## Related areas and verification

Read the product contracts affected by configuration, persistence, compiler or test-infrastructure changes; research records do not establish implemented integrations. Area names refer to files linked in the index; follow only relevant dependencies.

Useful references/checks (starting points, not a substitute for inspecting affected code):

- [backup-recovery.md](../backup-recovery.md)
- [nfl-data-providers.md](../nfl-data-providers.md)
- [ui-testing.md](../ui-testing.md)

## Feature contracts

Stable IDs trace to the original backlog. Criteria are requirements, not evidence that today’s code or deployment was tested. Load source requests/history only to resolve a specific detail. Later completed corrections refine earlier implementation details.

### TASK-2 — Implement react compiler

- Preserve React Compiler memoization in application and browser-fixture builds; TASK-38 updates the integration to Oxc.

Source: [TASK-2](../../backlog/tasks/task-2%20-%20Implement-react-compiler.md).

### TASK-10 — Error handling/logging

- Log caught/recoverable browser and server errors and uncaught browser events using safe diagnostic fields; redact credentials and avoid duplicate logging.
- Logging failures must not interrupt recovery. Preserve draft/retry behavior and documented production supervision limits.

Source: [TASK-10](../../backlog/tasks/task-10%20-%20Error-handling-logging.md).

### TASK-12 — Load the ESPN encryption key during local development

- A valid ESPN_CREDENTIALS_KEY in .env or .env.local is available to server code in npm run dev without an extra shell export.
- The key stays server-only and never enters the client bundle.
- Existing process environment overrides retain precedence, with a regression check for development configuration.

Source: [TASK-12](../../backlog/tasks/task-12%20-%20Load-the-ESPN-encryption-key-during-local-development.md).

### TASK-14 — Keep missing development settings unset

- Absent server settings remain absent after Vite configuration runs.
- Defined file values load and existing process values retain precedence.
- Regression coverage includes absent Auth0/ESPN settings.

Source: [TASK-14](../../backlog/tasks/task-14%20-%20Keep-missing-development-settings-unset.md).

### TASK-18 — Document and verify backup and recovery

- A documented backup and restoration procedure covers league and ranking data and the separate configuration needed to decrypt saved ESPN credentials.
- A restore rehearsal uses an isolated destination and verifies recovered editions and ownership boundaries.
- Documentation specifies retention, access restrictions and how to avoid overwriting the running database.

Source: [TASK-18](../../backlog/tasks/task-18%20-%20Document-and-verify-backup-and-recovery.md).

### TASK-32 — Run repeatable checks for every proposed change

- Proposed changes trigger installation from the lockfile, tests, typecheck, lint and a production build without production credentials.
- Browser coverage includes ranking interactions, accessibility contrast and unchanged original export snapshots.
- Failures retain useful diagnostics; live provider checks are separated from deterministic required checks and the workflow is documented.

Source: [TASK-32](../../backlog/tasks/task-32%20-%20Run-repeatable-checks-for-every-proposed-change.md).

### TASK-35 — Keep the local integration check compatible with new server functions

- The local integration check validates the specific server functions it needs without failing when unrelated functions are added.
- The check carries ranking revisions through updates and can exercise current save behavior.
- A successful run against an isolated test database is documented; production data is never modified.

Source: [TASK-35](../../backlog/tasks/task-35%20-%20Keep-the-local-integration-check-compatible-with-new-server-functions.md).

### TASK-38 — Use Ox compiler

- Keep application and browser-fixture React Compiler integration through Oxc (oxc-transform-react), preserving TanStack Start plugin ordering and generated memoization behavior.

Source: [TASK-38](../../backlog/tasks/task-38%20-%20Use-Ox-compiler.md).

### TASK-46 — Eliminate empty stylesheet URLs in router tests

- Rendering authenticated and public routes under Vitest does not create a link or anchor with an empty `href` and produces no corresponding React warning.
- The test environment supplies a realistic non-empty stylesheet asset URL or omits only the unavailable test asset without changing production head output.
- Router coverage fails on unexpected React DOM warnings while preserving explicit assertions for intentionally logged application errors.

Source: [TASK-46](../../backlog/tasks/task-46%20-%20Eliminate-empty-stylesheet-URLs-in-router-tests.md).

### TASK-47 — Add deterministic ESPN integration coverage

- A deterministic integration path covers ESPN league validation, teams, matchups, and report loading without requiring a developer's personal credentials.
- Coverage verifies that public ESPN requests omit cookies and private requests attach only the current account's encrypted credentials.
- Optional live ESPN verification remains available, while local and CI output clearly distinguishes deterministic coverage from live-provider coverage.

Source: [TASK-47](../../backlog/tasks/task-47%20-%20Add-deterministic-ESPN-integration-coverage.md).

### TASK-48 — Make the repository format check enforceable

- The checked-in source, test, script, and documentation files covered by the formatter pass `npm run format:check` from a clean checkout.
- Generated output, build artifacts, baselines, dependencies, and intentionally excluded files are represented explicitly in formatter configuration rather than relying on local state.
- CI runs the format check for proposed changes and provides a clear command for contributors to repair failures without altering generated or user-owned artifacts.

Source: [TASK-48](../../backlog/tasks/task-48%20-%20Make-the-repository-format-check-enforceable.md).

### TASK-62 — Add example values commented out to docker-compose file for easy configuration

- docker-compose.yml contains commented examples for the app, Mongo persistence, Auth0 browser settings, and optional server-only integrations.
- Examples distinguish build-time VITE settings from runtime server-only values and never include a usable credential.
- Compose configuration remains valid and deployment documentation points users to the examples.

Source: [TASK-62](../../backlog/tasks/task-62%20-%20Add-example-values-commented-out-to-docker-compose-file-for-easy-configuration.md).

### TASK-64 — Run deterministic browser checks serially in CI

- CI browser checks use one worker per runner across four independent macOS file-level shards, each with its own Vite server, preserving bounded concurrency and export baselines. Quality and isolated Ubuntu forecast checks run alongside the shards.
- Local browser runs retain normal parallel execution.
- Cold forecast timing checks run alone before the functional browser project so suite CPU contention does not distort their wall-clock measurements; functional checks retain local parallelism. Seeded parity, trial count, long-task checks and the 50 ms input-gap limit remain enforced, including the completion task.
- Shard selections preserve every functional case exactly once. Per-shard JSON timings/outcomes and failure diagnostics retain shard/run/attempt identity; the aggregate check fails on any failed, cancelled or skipped required job. Local project dependency behavior is retained and documented.

Source: [TASK-64](../../backlog/tasks/task-64%20-%20Run-deterministic-browser-checks-serially-in-CI.md).

### TASK-65 — Update ranking-editor test fixtures for getMatchups

- `npm run typecheck` passes with complete LeagueApi fixtures.
- Ranking-editor test mocks provide deterministic getMatchups behavior.
- The fixture change does not weaken existing test assertions.

Source: [TASK-65](../../backlog/tasks/task-65%20-%20Update-ranking-editor-test-fixtures-for-getMatchups.md).

### TASK-66 — Make insights refresh-status test timezone independent

- The refresh-status test derives its expected label using the production formatter.
- The focused router test passes under both the local timezone and UTC.
- The assertion continues to verify both the initial stale-report label and refreshed label.

Source: [TASK-66](../../backlog/tasks/task-66%20-%20Make-insights-refresh-status-test-timezone-independent.md).

### TASK-67 — Remove transient transform assertion from reduced-motion drag tests

- Reduced-motion keyboard drag tests verify keyboard movement through stable user-visible behavior.
- The tests no longer depend on an intermediate CSS transform.
- The focused reorder suite passes.

Source: [TASK-67](../../backlog/tasks/task-67%20-%20Remove-transient-transform-assertion-from-reduced-motion-drag-tests.md).

### TASK-68 — Keep league-provider selection responsive in the creation form

- The native ESPN radio remains checked after a pointer or keyboard selection.
- League creation submits the selected provider value.
- The focused Chakra browser test passes.

Source: [TASK-68](../../backlog/tasks/task-68%20-%20Target-the-ESPN-radio-control-in-league-creation-UI-test.md).

### TASK-96 — Evaluate additional NFL analytics and projection providers

- Compare NFL enrichment sources, access, authentication, costs, terms and coverage; mark unverified access.
- Separate league ownership providers from enrichment and explain custom scoring, identity, calendar and provenance requirements.
- Recommend one bounded read-only slice with representative fixture evidence and explicit unsupported metrics.
- Propose focused follow-up briefs with dependencies, estimates and risks while preserving NFL records and share links.

Source: [TASK-96](../../backlog/tasks/task-96%20-%20Evaluate-the-next-sport-and-provider-for-the-analytics-workspace.md).

### TASK-151 — Retire obsolete UI validation artifacts

- Completed redesign prototypes/PDF, one-off validation reports and obsolete generated result directories are removed under the user's scoped cleanup approval. Historical committed references remain recoverable through Git/task history.
- Maintained component/browser regressions, production-component fixtures, canonical ranking PNG baselines, domain documentation and feature contracts remain. Useful current failure diagnostics are separate from retired design artifacts.
- Active documentation links point to durable UI regression guidance. Asynchronous writing tests wait for actionable readiness and verify actual abort, no applied output/error and generation-slot release.
- Cleanup does not authorize runtime feature reductions, baseline changes or weaker assertions. Full unit/UI and required static/build gates must pass before completion.

Source: [TASK-151](../../backlog/tasks/task-151%20-%20The-UI-validation-tests-folders-should-be-cleaned-up-when-they-are-not-longer-needed.md).

### TASK-153 — Stable TanStack Start and compatible dependency updates

- Use the stable TanStack Start release with aligned Router and DB adapters, retaining the Node server build, private server-function caching, server-only settings and Oxc React Compiler integration.
- Non-streaming AI results preserve verified writing context, consent, restricted CLI execution, cancellation, empty-result errors and bounded suggestions. Confirmed league/ranking saves await asynchronous collection writes and propagate cache validation failures.
- Preserve existing tables, charts, exports, account-scoped cache freshness and safe session disposal. Accessible heatmap/Live button names include their visible records, samples and scores under the upgraded Axe checker. Validate dependency compatibility, focused regressions, full unit tests, static checks, production build and browser coverage; keep live-provider checks separate.

Source: [TASK-153](../../backlog/tasks/task-153%20-%20Upgrade-to-tanstack-1.0-and-update-other-dependencies-while-doing-this.md). Versions and migration details: [Dependency upgrade](../dependency-upgrade.md).

### TASK-154 — Match CI tooling to dependency runtime requirements

- CI quality/browser jobs and local development share Node 24.15.0 from `.nvmrc`, compatible with locked jsdom/Undici. Installation enforces dependency engines before tests run.
- The production Node engine contract remains unchanged; verification includes an exact-runtime clean install, full deterministic unit suite and static/build gates.

Source: [TASK-154](../../backlog/tasks/task-154%20-%20Repair-CI-test-runtime-compatibility-after-dependency-upgrades.md).

### TASK-157 — Independent workspace browser regression cases

- All nine workspace views retain hierarchy, navigation, view-specific workflows, overflow, accessibility, page-error and screenshot checks at 1280px and 390px. Each screen/viewport is an independent case with the unchanged default timeout.
- Splitting the two multi-screen loops improves failure attribution and avoids sharing one timeout across nine unrelated audits; no feature assertion or baseline is removed.

Source: [TASK-157](../../backlog/tasks/task-157%20-%20Give-each-workspace-screen-its-own-browser-regression-case.md).
