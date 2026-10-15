# Navigation, presentation, caching, and performance: preservation contracts

Read only when this area or a shared dependency is affected. Start at the [feature index](../feature-preservation.md). Any reduction requires explicit user approval recorded in the [approval log](approved-changes.md) before implementation.

## Important constraints

- **Keep the original ranking download.** The visual refresh request explicitly says “Do not change the download version” (TASK-3). Publishing and compact export contracts retain the original PNG/default and all commentary (TASK-17, TASK-30). Pending theme-choice work is not permission to replace the existing export.
- **Keep navigation fast without losing state.** Reuse historical reports between pages, support explicit refresh, show multi-season progress, retain usable results during failures, and keep background work bounded and cancellable. Focused history views retain manager context and every existing analytic (TASK-27, TASK-39, TASK-53, TASK-116–TASK-120, TASK-143, TASK-145).

## Related areas and verification

Read the affected product contracts as well: faster loading or a new layout must retain their controls, calculations, access checks and failure states. Area names refer to files linked in the index; follow only relevant dependencies.

Useful references/checks (starting points, not a substitute for inspecting affected code):

- [insights-cache.test.ts](../../src/api/insights-cache.test.ts)
- [AppShell.test.tsx](../../src/components/AppShell.test.tsx)

## Feature contracts

Stable IDs trace to the original backlog. Criteria are requirements, not evidence that today’s code or deployment was tested. Load source requests/history only to resolve a specific detail. Later completed corrections refine earlier implementation details.

### TASK-3 — Change the theme to be better looking

- Preserve the refreshed responsive app theme and accessible focus/contrast.
- Explicit user constraint: “Do not change the download version.” Keep export markup, styling and original image behavior intact.

Source: [TASK-3](../../backlog/tasks/task-3%20-%20Change-the-theme-to-be-better-looking.md).

### TASK-27 — Make report freshness and partial failures visible

- Reports show when their displayed data was last successfully refreshed.
- A refresh failure preserves usable data and labels affected sections without describing them as current.
- Retry feedback distinguishes loading, success and continued partial availability in an accessible way.

Source: [TASK-27](../../backlog/tasks/task-27%20-%20Make-report-freshness-and-partial-failures-visible.md).

### TASK-39 — Add loading bars when loading multiple seasons

- A determinate loading bar reports completed and total selected seasons during the initial multi-season load.
- The same progress indicator resets and advances during a refresh without hiding retained season data.
- Progress updates are accessible to assistive technology and disappear when the selected seasons finish.

Source: [TASK-39](../../backlog/tasks/task-39%20-%20Add-loading-bars-when-loading-multiple-seasons.md).

### TASK-43 — Dispose session collections after live queries detach

- Navigating away, signing out, and replacing the authenticated account do not clean up a collection until all dependent live queries have detached.
- Every league and ranking collection is still disposed after its session ends, and cached records never become visible to the next account.
- Regression coverage repeatedly mounts and tears down authenticated ranking routes without TanStack DB live-query warnings or leaked subscriptions.

Source: [TASK-43](../../backlog/tasks/task-43%20-%20Dispose-session-collections-after-live-queries-detach.md).

### TASK-53 — caching

- Past-season reports are reused when switching pages without repeated server reads.
- Explicit refresh retrieves updated results, and private caches remain scoped to the authenticated session.
- Caching behavior is tested and documented.

Source: [TASK-53](../../backlog/tasks/task-53%20-%20caching.md).

### TASK-100 — Redesign the public sign-in page with clear spacing and visible actions

- The signed-out page presents the NFL analytics capabilities with a cohesive responsive visual layout and clear primary sign-in action.
- Section spacing, typography and mobile touch targets are consistent; action buttons have visible boundaries or filled backgrounds instead of appearing as plain text.
- Existing Auth0 redirects, password recovery and session loading/error states remain functional and accessible.
- Desktop and phone browser checks verify layout, accessible controls and no horizontal overflow.

Source: [TASK-100](../../backlog/tasks/task-100%20-%20Redesign-the-public-sign-in-page-with-clear-spacing-and-visible-actions.md).

### TASK-104 — Refresh the application visual design and add a fantasy football favicon

- Navigation and all primary application screens use a coherent, lively visual hierarchy with clear controls, cards and meaningful accents.
- Desktop and mobile layouts, contrast, keyboard access and core workflows remain usable, including ranking exports and live matchups.
- A fantasy football favicon and matching browser/app icons are generated, installed and referenced by the document and manifest.

Source: [TASK-104](../../backlog/tasks/task-104%20-%20Refresh-the-application-visual-design-and-add-a-fantasy-football-favicon.md).

### TASK-105 — Match loading placeholder spacing to the refreshed workspace

- Main loading placeholders share consistent block layout, card padding, line spacing and responsive spacing with the refreshed UI.
- Rankings retains the same page heading while loading and loaded; loading announcements and history progress remain accessible.
- Desktop and mobile loading states fit their containers and transition correctly into loaded content.

Source: [TASK-105](../../backlog/tasks/task-105%20-%20Match-loading-placeholder-spacing-to-the-refreshed-workspace.md).

### TASK-107 — Await session collection disposal in router test teardown

- Every router test awaits disposal of all created sessions before jsdom teardown.
- Router and API tests pass with no unhandled cleanup errors.

Source: [TASK-107](../../backlog/tasks/task-107%20-%20Await-session-collection-disposal-in-router-test-teardown.md).

### TASK-119 — Coalesce concurrent cold Sleeper player catalog reads

- Concurrent cold or expired catalog reads share one provider request and equivalent normalized results across catalog consumers.
- A failed shared request does not poison future reads; subsequent requests can retry and existing cache freshness behavior is preserved.
- The shared catalog continues to contain only public player metadata and does not mix league ownership or user credentials into its cache.
- Deferred-response tests verify single provider request, expiry, shared failures and retry behavior; redundant local coalescing code is removed only if made unnecessary by this change.

Source: [TASK-119](../../backlog/tasks/task-119%20-%20Coalesce-concurrent-cold-Sleeper-player-catalog-reads.md).

### TASK-120 — Preload workspace tabs through TanStack Router and shared session queries

- The first ready workspace load preloads each main navigation tab without blocking the active page; search context and explicit league/season selection are respected.
- Loaders and pages share query keys and concurrent requests, with appropriate freshness for live, current-season and historical data and working explicit refresh.
- Account, provider identity and credential changes cannot reuse stale private data; no private requests run before authentication/setup, and public tabs remain public.
- Router integration and cache tests verify first-load warming, navigation reuse, refresh, errors and isolation; browser checks, build and static checks pass and behavior is documented.

Source: [TASK-120](../../backlog/tasks/task-120%20-%20Preload-workspace-tabs-through-TanStack-Router-and-shared-session-queries.md).

### TASK-143 — Reduce report loading latency and move browser forecasts off the main thread

- Historical weeks and selected seasons load with bounded concurrency while preserving ordering, progress, retained results, errors and cancellation.
- Season loading reuses duplicate Sleeper metadata and roster reads and overlaps independent sections without expanding provider traffic beyond a shared bound.
- Browser forecasts and calibration use bounded worker execution with deterministic parity, cancellation and a compatible fallback.
- History report groups mount on first visit and retain their controls after switching tabs.
- Relevant regressions, typecheck, lint and production build pass and performance behavior is documented.

Source: [TASK-143](../../backlog/tasks/task-143%20-%20Reduce-report-loading-latency-and-move-browser-forecasts-off-the-main-thread.md).

### TASK-146 — Shared Manager Explorer presentation

- Seven primary destinations: Rankings studio, Weekly overview, Live matchups, Season insights, Playoff simulator, League history and Other tools. Players/Trade analyzer retain direct URLs, context, the Other tools active state and return breadcrumbs.
- Profile, Create league and Manage leagues are in the top-right dropdown. Navigation/outside click dismiss it; Escape closes and restores focus, including compact Live. The skip link, horizontal phone navigation, current selections, preloading and public/snapshot restrictions remain.
- Compact headings, white evidence surfaces and accessible definition tooltips follow the approved palette. Data/source/caveat/configuration controls remain reachable. Tooltip clicks/touch/focus/Escape and reduced motion are covered; dense Live uses bounded desktop layout and full phone flow.
- [UI regression guidance](../ui-testing.md) records responsive, keyboard, loading/partial/error, cache/disposal, performance and screenshot evidence. Rankings export markup is excluded from workspace restyling.

## TASK-146 usability iteration — October 14, 2026

The usability iteration keeps one sticky navy brand/navigation/profile bar, with compact Live height, inline page-owned title/context/actions, accessible sharing disclosures and a contextual Other tools switcher. Original loading, focus, cache, account and navigation contracts remain. See [UI regression guidance](../ui-testing.md).

The screenshot follow-up aligns workspace control typography, flat borders, attached ranking tabs, compact toolbars and 340px desktop inspectors with the usability designs. Phone panels return to normal flow; control state, keyboard focus and export isolation remain required. See [UI regression guidance](../ui-testing.md).
