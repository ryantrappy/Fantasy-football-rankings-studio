# Historical feature catalogue archive

Reference only: do not load this whole archive for routine implementation work.
Start with the [current feature index](feature-preservation.md), load only affected
area contracts, and use the [current approval log](features/approved-changes.md).
The original catalogue below is a frozen October 13, 2026 record. Its workflow
instructions and empty approval log are historical; current guidance takes precedence.
No feature behavior is being removed by reorganizing this documentation.

---

# Feature preservation contract

Baseline date: October 13, 2026. Scope: `react_refactor_fantasy_website`.

## Mandatory preservation rule

AI agents MUST preserve existing features during refactors, redesigns, framework migrations, performance work, cleanup, and bug fixes. A request to simplify, modernize, reorganize, or refactor is not permission to remove or reduce functionality.

Before removing, disabling, narrowing, hiding, or changing the meaning of an existing feature, the agent MUST explain the specific proposed change and its user impact, ask the user, and receive explicit approval. Record that approval in this document's **Approved feature changes** section before implementing the reduction. Identify the affected feature IDs, exact approved scope, date, user approval wording, and replacement/migration behavior. An agent's proposal, unchecked approval template, silence, backlog completion status, or passing tests is not approval. Do not manufacture approval or broaden its scope.

Preservation covers the reachable workflow and its details: controls, filters, exports, public routes, saved content, provider support, calculations, identity/ownership boundaries, coverage disclosures, keyboard/mobile access, and retained selections. Keeping a calculation helper while removing its screen or control does not preserve the feature. Do not weaken tests or delete requirements to make a regression appear intentional. Unlisted existing behavior is protected too; this catalogue is a baseline, not an exhaustive exemption list.

Routine changes that preserve behavior do not need extra approval. Where behavior cannot be established or requirements conflict, inspect the linked backlog and current implementation; ask the user before resolving the ambiguity by reducing a feature.

## How an AI agent must use this document

1. Read the preservation rule, priorities, capability index, and approval log before planning a change. Read every detailed entry for affected areas and shared dependencies; use the stable `TASK-*` IDs in the plan/review.
2. Inspect the linked source tasks, relevant domain documentation, current code, and existing tests. Determine what must remain available before editing. Source requests can describe the old problem; acceptance criteria and delivered behavior establish the intended result.
3. Map each affected capability to where users will reach it after the change. Preserve its filters, calculations, data lifecycle, privacy, failure states, and accessibility, including shared/snapshot variants. A redesign may move controls when the complete workflow remains reachable and understandable.
4. Implement behavior-preserving work. If a reduction is necessary, follow the explicit approval rule first; continue independent safe work while approval is pending.
5. Validate affected behavior with appropriate existing checks and targeted regression coverage where needed. Report which feature IDs were checked and any unresolved limitations. Historical test counts in source summaries are not evidence for the current change.
6. Update this catalogue when features are added or intentionally changed. Retain stable IDs, source links, original intent, coverage caveats, and approval history. Never silently delete an entry to permit removal.

## User priorities and interpretation boundaries

These priorities summarize recorded requests and contracts. The detailed entries retain the original request text so an agent can distinguish source wording from this synthesis. Backlog descriptions may have been authored by earlier agents; they are recorded requirements, not proof that every sentence was spoken verbatim by the user.

- **Keep the original ranking download.** The visual refresh request explicitly says “Do not change the download version” (TASK-3). Publishing and compact export contracts retain the original PNG/default and all commentary (TASK-17, TASK-30). Pending theme-choice work is not permission to replace the existing export.
- **Keep reports shareable and private data private.** Public reports reuse analytics without the rankings builder or repeated Auth0 initialization. Public ESPN requests never use environment or account cookies. Private ESPN sharing serves a uniquely identified stored snapshot of the displayed data, not a fresh provider fetch; preserve revocation and ten-day expiration (TASK-1, TASK-6, TASK-54).
- **Preserve the writer's work.** Reloads, network failures, simultaneous editors, revision restoration, delayed publication, and league archiving must not silently lose or expose prose (TASK-15–TASK-20, TASK-83, TASK-86).
- **Use the league's actual context.** Provider, workspace, account, manager group, season, scoring week, roster slots, scoring rules, and playoff configuration are distinct identities/inputs. Same external league IDs can coexist without crossing ownership boundaries (TASK-11, TASK-24–TASK-26, TASK-41, TASK-77, TASK-87, TASK-114).
- **Optimize legal lineups from starters AND bench.** The user explicitly asks that projections not simply use the current starting lineup, so bye weeks and replacements are considered. Preserve legal slot eligibility, availability/locks, actual versus projected semantics, historical best-lineup scores, missed points, and weighted sit/start accuracy (TASK-49–TASK-52, TASK-80, TASK-91, TASK-134).
- **Explain the numbers and limits.** Luck and other metrics need definitions, denominators, coverage and worked context. Keep regular-season versus final placement separate. Missing values are unavailable, not invented zeros; legitimate zero/negative points remain valid (TASK-4, TASK-5, TASK-40, TASK-112, TASK-113).
- **Preserve forecast depth and honesty.** Keep playoff/round/title odds, the dedicated tab, weekly trend view, playoff/championship toggles, quick cached switching, point animation with reduced-motion support, calibration and replay exports. Use only data available at the selected cutoff; keep early-season uncertainty and unsupported-format explanations (TASK-34, TASK-36–TASK-42, TASK-55–TASK-57, TASK-69, TASK-73–TASK-81).
- **Keep navigation fast without losing state.** Reuse historical reports between pages, support explicit refresh, show multi-season progress, retain usable results during failures, and keep background work bounded and cancellable. Focused history views retain manager context and every existing analytic (TASK-27, TASK-39, TASK-53, TASK-116–TASK-120, TASK-143, TASK-145).
- **Keep decision support inspectable.** Lineup, waiver, trade and player workflows must work without generated prose, disclose scoring/projection provenance, respect observed ownership, and remain read-only toward provider transactions. Writing suggestions are optional, configurable, cancellable and editable (TASK-13 and subtasks, TASK-90–TASK-95, TASK-99, TASK-110).
- **Keep historical storytelling evidence-based.** Preserve the full competition, moments, personalities and recap capabilities, their minimum samples, source evidence, supported sharing and explicit unavailable states. Do not infer missing archives, queue intent, ownership or future trade value (TASK-122–TASK-145).
- **Preserve the special direct-only report.** TASK-9 requests a separate publicly accessible manager critique page reachable directly. Its delivered contract keeps it out of navigation, uses noindex metadata, and presents measured fantasy-league evidence and coverage.
- **Prefer TanStack when a framework choice exists.** This remains an explicit workspace instruction; implementation modernization must still preserve product behavior.

## Catalogue provenance and limits

This inventory includes every item with frontmatter `status: Done` in `backlog/tasks`, `backlog/completed`, and `backlog/archive/tasks` at the baseline date: **148 completed records**. Completion is determined by status, not folder. Maintenance, operational safeguards and research deliverables are included because their contracts can also regress; research entries do not imply an implemented integration.

Each detailed entry has a stable feature ID, a source link, recorded intent when present, preservation criteria when present, and a historical delivery summary when present. Criteria retain their source checkbox states. Historical summaries describe recorded implementation, not fresh verification of production. Original problem descriptions do not require preserving the bug. Later completed corrections refine earlier implementation details; preserve the capability and latest supported semantics rather than obsolete internals (for example TASK-38 updates TASK-2's compiler integration, TASK-80 expands TASK-37's projection horizon, and TASK-83 changes revision storage).

**Known completion caveat:** TASK-72 is marked Done but its acceptance criteria and definition of done remain unchecked and it has no final summary. Preserve the profile feature and owner/secret boundaries established by TASK-7/TASK-60; do not claim the deployed tenant flow was verified solely from TASK-72's status. Several other Done records lack final summaries; their recorded criteria still remain preservation requirements.

Four records are not completed and are excluded from the baseline:

- [TASK-58 — Support Private sleeper leagues using sleeper login information](../backlog/archive/tasks/task-58%20-%20Support-Private-sleeper-leagues-using-sleeper-login-information.md) — To Do.
- [TASK-82 — Configure Auth0 in Docker images published by the release workflow](../backlog/archive/tasks/task-82%20-%20Configure-Auth0-in-Docker-images-published-by-the-release-workflow.md) — To Do.
- [TASK-146 — Apply the Manager Explorer design approach across the app](../backlog/tasks/task-146%20-%20Apply-the-Manager-Explorer-design-approach-across-the-app.md) — To Do.
- [TASK-147 — Allow choosing classic or new rankings export theme](../backlog/tasks/task-147%20-%20Allow-choosing-classic-or-new-rankings-export-theme.md) — To Do.

In particular, TASK-146 (app-wide Manager Explorer styling) and TASK-147 (classic/new export theme choice) are proposals at this baseline, not completed capabilities or approved removals. TASK-145 is Done in the current working tree; its inclusion does not imply those in-progress files have been committed or independently revalidated here.

## Approved feature changes

**None recorded.** This document authorizes no feature removals or reductions.

For each actual user-approved change, append a dated record with these fields. Do not fill in an approval before receiving it:

- Change ID and affected feature IDs:
- Previous protected behavior:
- Exact approved change and user impact:
- User approval wording and conversation/task reference:
- Approval date:
- Replacement, compatibility or data migration behavior:
- Implementation and validation evidence:

Keep the original feature entry and annotate it with the approved change ID. Approval applies only to that recorded scope.

## Capability index

Read the relevant groups before searching the detailed entries by feature ID. Shared dependencies may require reading several groups.

### Sharing and public reports

Anonymous season/history/playoff reports, previews, revocation, stored ESPN snapshots, canonical links, and the direct-only manager report.

Features: [1](#task-1), [1.1](#task-1-1), [1.2](#task-1-2), [9](#task-9), [45](#task-45), [54](#task-54), [71](#task-71), [121](#task-121).

### Rankings studio and exports

Writing, recoverable drafts, conflict resolution, revision history, publishing, copying, suggested power order, keyboard interaction, and original/compact image exports.

Features: [13](#task-13), [13.1](#task-13-1), [13.2](#task-13-2), [13.3](#task-13-3), [15](#task-15), [16](#task-16), [17](#task-17), [19](#task-19), [23](#task-23), [24](#task-24), [30](#task-30), [33](#task-33), [63](#task-63), [83](#task-83), [86](#task-86), [88](#task-88), [114](#task-114).

### Accounts, credentials, and league management

Profile editing, password recovery, private credentials, provider/workspace identity, onboarding, archive/delete, account-scoped selections, and managed-team setup.

Features: [6](#task-6), [7](#task-7), [8](#task-8), [11](#task-11), [20](#task-20), [21](#task-21), [22](#task-22), [25](#task-25), [26](#task-26), [31](#task-31), [44](#task-44), [59](#task-59), [60](#task-60), [61](#task-61), [70](#task-70), [72](#task-72), [84](#task-84), [85](#task-85), [87](#task-87), [89](#task-89), [97](#task-97), [98](#task-98), [101](#task-101).

### Season insights and historical lineup accuracy

Basic achievements, manager comparison, CSV reports, distinct placements, best legal historical lineups, weighted start accuracy, positional strength, and schedule difficulty.

Features: [4](#task-4), [5](#task-5), [28](#task-28), [29](#task-29), [40](#task-40), [50](#task-50), [51](#task-51), [52](#task-52), [108](#task-108), [109](#task-109), [111](#task-111), [113](#task-113).

### Playoff forecasts, trends, and model evaluation

Dedicated forecasts, round/title odds, legal projected lineups, schedules, season-specific rules, early-season warnings, trend charts, calibration, JSON replay exports, and immutable as-of archives.

Features: [34](#task-34), [36](#task-36), [37](#task-37), [41](#task-41), [42](#task-42), [49](#task-49), [55](#task-55), [56](#task-56), [57](#task-57), [69](#task-69), [73](#task-73), [74](#task-74), [75](#task-75), [76](#task-76), [77](#task-77), [78](#task-78), [79](#task-79), [80](#task-80), [81](#task-81), [116](#task-116).

### Live teams, players, and decision support

Cross-league overview, lineup advice, available waivers, trade scenarios and suggestions, player search/comparisons, alerts, combined projections, and selected-league reads.

Features: [90](#task-90), [91](#task-91), [92](#task-92), [93](#task-93), [94](#task-94), [95](#task-95), [99](#task-99), [102](#task-102), [103](#task-103), [106](#task-106), [110](#task-110), [112](#task-112), [115](#task-115), [117](#task-117), [118](#task-118).

### League history and Manager Explorer

Rivalries, expected wins, Elo, honors/shame, eras, clutch results, record books, Pain Index, archived moments, draft skill, transaction networks, player relationships, archetypes, Wrapped, and focused manager navigation.

Features: [122](#task-122), [123](#task-123), [124](#task-124), [125](#task-125), [126](#task-126), [127](#task-127), [128](#task-128), [129](#task-129), [130](#task-130), [131](#task-131), [132](#task-132), [133](#task-133), [134](#task-134), [135](#task-135), [136](#task-136), [137](#task-137), [138](#task-138), [139](#task-139), [140](#task-140), [141](#task-141), [142](#task-142), [144](#task-144), [145](#task-145).

### Navigation, presentation, caching, and performance

Responsive visual design, sign-in, loading placeholders, freshness, retained results, multi-season progress, shared session caches, catalogue coalescing, tab preloading, and bounded background computation.

Features: [3](#task-3), [27](#task-27), [39](#task-39), [43](#task-43), [53](#task-53), [100](#task-100), [104](#task-104), [105](#task-105), [107](#task-107), [119](#task-119), [120](#task-120), [143](#task-143).

### Operations, quality, and research

Compiler behavior, error reporting/redaction, environment handling, safe backups, deterministic integration/browser checks, format gates, deployment examples, and documented provider research.

Features: [2](#task-2), [10](#task-10), [12](#task-12), [14](#task-14), [18](#task-18), [32](#task-32), [35](#task-35), [38](#task-38), [46](#task-46), [47](#task-47), [48](#task-48), [62](#task-62), [64](#task-64), [65](#task-65), [66](#task-66), [67](#task-67), [68](#task-68), [96](#task-96).

## Detailed feature contracts

Entries are ordered numerically by stable backlog ID. Source sections are reproduced to retain details rather than paraphrasing away constraints.

<a id="task-1"></a>

### TASK-1 — Create separate public page for shared insights

Source: [TASK-1](../backlog/tasks/task-1%20-%20Create-separate-public-page-for-shared-insights.md) · Baseline status: Done.

**Recorded intent / important context**

- Use the same components as internal but don't display the power rankings builder tab.
- Auth should be done in a way where it is not checked every rerender so the tabs are static
- If an espn league is shared don't use the env variable ever for the public versions

**Preserve these acceptance criteria**

- [x] #1 Use the same components as internal but don't display the power rankings builder tab.
- [x] #2 Auth should be done in a way where it is not checked every rerender so the tabs are static
- [x] #3 If an espn league is shared don't use the env variable ever for the public versions

**Recorded delivered behavior (historical)**

Shared reports now live at /shared/insights and /shared/history and reuse the internal season/history components. Their layout does not initialize Auth0, their navigation always excludes Rankings studio, and their API remains public even for a signed-in league owner. Internal /insights and /history retain authenticated owner access. Share links always point to the public routes and preserve report selections.

Updated README and route/DOM regression tests. Verified existing public ESPN requests omit environment credentials, including concurrent owner reads and denied requests. Validation: 90 tests across 18 files passed; production build, lint, final typecheck and diff whitespace checks passed. Live provider integration was not exercised.

<a id="task-1-1"></a>

### TASK-1.1 — Allow owners to revoke public report access

Source: [TASK-1.1](../backlog/tasks/task-1.1%20-%20Allow-owners-to-revoke-public-report-access.md) · Baseline status: Done.

**Recorded intent / important context**

Shared season and history reports currently use publicly readable registered-league URLs. Owners need control when a link should stop being accessible.

**Preserve these acceptance criteria**

- [x] #1 Owners can disable public access to their season and history reports and see the current sharing state.
- [x] #2 Disabled access is enforced for direct URLs and report data requests, including previously issued links.
- [x] #3 The chosen behavior for existing shared links is documented; owner access continues to work.

**Recorded delivered behavior (historical)**

Added owner-only report-sharing controls and enforced publicReports on the shared lookup used by every anonymous report endpoint. Existing leagues stay enabled unless disabled; re-enabling restores existing links, and owner reads remain available. Real MongoDB tests verify disable/enable and non-owner denial; seven focused server/DOM tests, build/typecheck and lint pass. README describes existing-link and already-copied-data behavior.

<a id="task-1-2"></a>

### TASK-1.2 — Give shared reports useful link previews

Source: [TASK-1.2](../backlog/tasks/task-1.2%20-%20Give-shared-reports-useful-link-previews.md) · Baseline status: Done.

**Recorded intent / important context**

Links pasted into a league chat should identify the report instead of looking like a generic application URL.

**Preserve these acceptance criteria**

- [x] #1 Public report pages expose a meaningful page title and description based on public league and season context.
- [x] #2 Preview metadata contains no private account identifiers, credentials or unpublished prose.
- [x] #3 Invalid or unavailable reports use a safe generic preview and do not expose provider errors.

**Delivery evidence:** No final summary is recorded; consult the source, implementation and tests before claiming verification.

<a id="task-2"></a>

### TASK-2 — Implement react compiler

Source: [TASK-2](../backlog/tasks/task-2%20-%20Implement-react-compiler.md) · Baseline status: Done.

**Recorded intent / important context**

use latest version of react compiler to make code faster

**Recorded delivered behavior (historical)**

Enabled the latest stable official React Compiler through the Vite Babel preset in the application and browser fixture. Production assets contain generated memo caches. Build/typecheck, lint, 154 unit tests and 14 browser tests pass, including unchanged download snapshots. README documents integration and verification.

<a id="task-3"></a>

### TASK-3 — Change the theme to be better looking

Source: [TASK-3](../backlog/tasks/task-3%20-%20Change-the-theme-to-be-better-looking.md) · Baseline status: Done.

**Recorded intent / important context**

Currently it is a very boring green and tan color only. I want it to be less lame
Do not change the download version

**Recorded delivered behavior (historical)**

Refreshed the app with navy/indigo semantic colors, cool neutral surfaces, warm header accent, navigation hover states and card focus/shadows. Export CSS and markup remain unchanged. All 14 UI tests pass including desktop/mobile download snapshots; final header contrast rerun passes. Visual desktop review and mobile overflow check pass. Production build/typecheck and lint pass; README updated.

<a id="task-4"></a>

### TASK-4 — Improve documentation of how calculations are done

Source: [TASK-4](../backlog/tasks/task-4%20-%20Improve-documentation-of-how-calculations-are-done.md) · Baseline status: Done.

**Recorded intent / important context**

Right now some of the values that are displayed are not as obvious where they come from, ie luck score

**Recorded delivered behavior (historical)**

Added a shared expandable calculation guide to season/history summaries with a worked schedule-luck example, scoring/projection denominators, trade/pickup grading rules, sample thresholds and historical weighting. Added docs/calculations.md and a README link for a full reference.

Verification: 23 report/calculation tests pass, including guide expansion in the DOM; typecheck and lint pass.

<a id="task-5"></a>

### TASK-5 — Add displays of basic stats in current and previous seasons display

Source: [TASK-5](../backlog/tasks/task-5%20-%20Add-displays-of-basic-stats-in-current-and-previous-seasons-display.md) · Baseline status: Done.

**Recorded intent / important context**

Display how many playoff appearances each team has in the historcal area, championships, and last place finishes. Add average finish as well.

**Recorded delivered behavior (historical)**

Added playoff appearances, championships, last-place finishes and average final placement to season and history summaries, plus per-season outcomes in manager history. Every metric shows known-season coverage; incomplete/unsupported provider results stay unknown.

Sleeper normalization handles championship placements, playoff byes and identifiable consolation/toilet-bowl progression. ESPN uses completed-season final ranks and championship-bracket entrants. Historical counts follow manager identity and exclude unknown outcomes. Calculation reference and README explain provider limitations and denominators.

Validation: all 135 tests pass, including provider results, missing/unfinished data, aggregation and DOM output; typecheck/lint pass. Live ESPN public fixture is now private (401), so provider result validation uses controlled fixtures.

<a id="task-6"></a>

### TASK-6 — Store the espn auth data in in the Auth0 user data rather than in env file

Source: [TASK-6](../backlog/tasks/task-6%20-%20Store-the-espn-auth-data-in-in-the-Auth0-user-data-rather-than-in-env-file.md) · Baseline status: Done.

**Recorded intent / important context**

Scope ESPN cookies to the verified Auth0 user rather than global environment variables. User approved encrypted storage in the existing MongoDB keyed by Auth0 subject (instead of Auth0 metadata) and optional credential entry during first-time application onboarding immediately after signup.

**Preserve these acceptance criteria**

- [x] #1 ESPN credentials are encrypted in MongoDB and scoped exclusively to the verified Auth0 subject; saved cookie values never return through client APIs.
- [x] #2 Users can optionally supply ESPN cookies immediately after signup/sign-in, skip setup, and later replace or remove their credentials.
- [x] #3 Authenticated ESPN operations use only that user's credentials; public reports and Sleeper requests never load them, and ESPN environment-cookie fallback is removed.

**Recorded delivered behavior (historical)**

Replaced deployment-wide ESPN cookies with credentials encrypted in MongoDB and keyed to the verified Auth0 subject, as approved. AES-256-GCM uses random nonces and subject-bound authenticated data; client responses expose only setup/status flags. All authenticated ESPN paths use request-local owner credentials, while public reports and Sleeper never resolve them. No global ESPN cookie fallback remains.

First-login setup lets users enter cookies or skip, preserving their requested destination. /espn provides write-only replacement/removal. Updated report-cache invalidation, configuration example, migration docs and live-check function count.

Validation: 113 tests across 21 files passed; production build/typecheck, lint and diff checks passed. Deployment requires ESPN_CREDENTIALS_KEY and per-user cookie entry; existing .env files were untouched. No live MongoDB/Auth0/ESPN integration run.

<a id="task-7"></a>

### TASK-7 — Create user profile page

Source: [TASK-7](../backlog/tasks/task-7%20-%20Create-user-profile-page.md) · Baseline status: Done.

**Recorded intent / important context**

Create page where user can view/edit the auth0 data

**Recorded delivered behavior (historical)**

Added /profile and a session navigation link to view Auth0 identity/email verification and edit name/nickname. Updates use the verified JWT subject and a server-only Management API client; arbitrary identity/privilege fields are rejected. Accessible loading, retry and save feedback preserve drafts on errors.

Validation: service, DOM and RPC authorization tests cover read/save, token reuse, identity isolation, invalid input, missing configuration, upstream failures and session changes; production build/typecheck and full existing suite pass. README and .env.example document M2M permissions and social profile synchronization. Live editing requires the documented tenant credentials; no tenant configuration or secrets were modified.

<a id="task-8"></a>

### TASK-8 — Ensure it is possible to reset password through auth0 flow

Source: [TASK-8](../backlog/tasks/task-8%20-%20Ensure-it-is-possible-to-reset-password-through-auth0-flow.md) · Baseline status: Done.

**Recorded delivered behavior (historical)**

Added password recovery entry points to signed-out authentication and the authenticated profile. Uses Auth0 SDK Universal Login with prompt=login and preserved return path; explains hosted recovery and external-provider passwords. Pending state, safe failure and retry are covered with SDK mocks. All 156 tests, build/typecheck and lint pass. README documents database connection/reset email requirements and live verification procedure. No tenant settings changed or live reset emails sent; tenant email delivery remains a deployment verification step.

<a id="task-9"></a>

### TASK-9 — Publicly accessible page to point of flaws in manager

Source: [TASK-9](../backlog/tasks/task-9%20-%20Publicly-accessible-page-to-point-of-flaws-in-manager.md) · Baseline status: Done.

**Recorded intent / important context**

league id 1312529175982129152 sleeper
manager name konz4

I need to create a page full of as many stats that show konz4 is not a good manager. Highlight poor trades, poor player adds/drops, draft misses, or any other stat that might show an error being made in hindsight.

This page should be separate from the rest of the application and only accessible by going to the page directly. name it something like /shared/konz-sux

**Recorded delivered behavior (historical)**

Added the direct-only /shared/konz-sux report with no navigation entry or Auth0 requirement. It follows six fixed public Sleeper seasons and presents negative scoring, trade and pickup evidence plus same-position draft hindsight comparisons, with explicit samples, source links, missing-data states and critical-selection disclosure. Confirmed finishes remain visible, including the 2025 championship.

Server requests are cached and deduplicated. Validation: live six-season load succeeded; five new calculation/DOM tests pass; production build/typecheck and lint pass. Desktop/mobile browser checks confirmed anonymous access, no navigation, noindex metadata, no page errors and no horizontal overflow at 390px.

<a id="task-10"></a>

### TASK-10 — Error handling/logging

Source: [TASK-10](../backlog/tasks/task-10%20-%20Error-handling-logging.md) · Baseline status: Done.

**Recorded intent / important context**

Log all errors that are caught to the console. If uncaught also try to log it. Prevent server crashes if possible

**Recorded delivered behavior (historical)**

Expanded error logging across browser catches, page errors, Auth0 failures, uncaught browser events and recoverable season-discovery fallbacks. Logs select diagnostic fields, redact credentials, avoid duplicate propagation of browser Error objects, and cannot interrupt recovery if the console fails.

Existing request envelopes and Nitro runtime capture continue to contain recoverable failures. README documents logging destinations, retained drafts/retry behavior and production supervision limits. Validation: 129 tests pass, including browser event/cleanup and redaction/failing-sink coverage; production build, typecheck and lint pass.

<a id="task-11"></a>

### TASK-11 — Keep Sleeper co-owner groups separate in manager history

Source: [TASK-11](../backlog/tasks/task-11%20-%20Keep-Sleeper-co-owner-groups-separate-in-manager-history.md) · Baseline status: Done.

**Recorded intent / important context**

Sleeper manager history currently keys teams only by the primary owner, so changes to co-owners are merged into the same history even though the report promises changed co-owner groups receive separate records. This can attribute results and upcoming finish totals to the wrong management group.

**Preserve these acceptance criteria**

- [x] #1 Sleeper team identity includes the primary owner and all co-owners, independent of their ordering.
- [x] #2 Changing a co-owner produces a separate historical manager record while renamed teams with unchanged owners stay together.
- [x] #3 Tests cover reordered co-owners, changed groups, and a roster with no owner.

**Recorded delivered behavior (historical)**

Sleeper team identities now include all primary/co-owner IDs in sorted, deduplicated order. Manager labels include available co-owner names; existing single-owner keys and primary-owner team metadata remain intact. Added provider/history regression tests and README explanation. Validation: 14 affected tests, typecheck and lint pass.

<a id="task-12"></a>

### TASK-12 — Load the ESPN encryption key during local development

Source: [TASK-12](../backlog/tasks/task-12%20-%20Load-the-ESPN-encryption-key-during-local-development.md) · Baseline status: Done.

**Recorded intent / important context**

The Vite configuration loads an explicit list of server environment variables from .env but omits ESPN_CREDENTIALS_KEY. As a result, npm run dev can report that ESPN credential storage is not configured even when the key is present in the documented .env file. Production start loads environment files separately.

**Preserve these acceptance criteria**

- [x] #1 A valid ESPN_CREDENTIALS_KEY in .env or .env.local is available to server code in npm run dev without an extra shell export.
- [x] #2 The key stays server-only and never enters the client bundle.
- [x] #3 Existing process environment overrides retain precedence, with a regression check for development configuration.

**Recorded delivered behavior (historical)**

Local Vite development now loads ESPN_CREDENTIALS_KEY alongside other server settings while retaining shell override precedence. Added a configuration regression and setup documentation. Verified a production build with a synthetic key contains no key value in browser assets; build/typecheck pass.

<a id="task-13"></a>

### TASK-13 — Suggest things to write about

Source: [TASK-13](../backlog/tasks/task-13%20-%20Suggest-things-to-write-about.md) · Baseline status: Done.

**Recorded intent / important context**

Automatically generate context about a users team and provide that in the power rankings generator screen. Use that context and tanstack AI to talk to the users LLM to determine what to actually suggest talking about. The goal are notable trends in the user's team or trades/pickups that went well or poorly. It can also include general depth talk regarding the total team or positions. The LLM used should be configurable and ideally would auto discover what clis it has access to and use those if approved

**Recorded delivered behavior (historical)**

Adds optional writing suggestions to the rankings editor using verified scoring, move and observed-depth context. Supports discovered Codex/Claude CLI providers through TanStack AI, configurable models, explicit consent, restricted execution and editable suggestions. README documents configuration and server-account semantics. Regression checks and production build pass.

<a id="task-13-1"></a>

### TASK-13.1 — Explain writing-assistant readiness and setup failures

Source: [TASK-13.1](../backlog/tasks/task-13.1%20-%20Explain-writing-assistant-readiness-and-setup-failures.md) · Baseline status: Done.

**Recorded intent / important context**

Users currently need to interpret installed/enabled CLI labels and environment configuration. Readiness feedback should make the next setup step clear.

**Preserve these acceptance criteria**

- [x] #1 The panel distinguishes missing installation, missing account enablement and a failed generation/login check without claiming PATH discovery proves authentication.
- [x] #2 User-facing failures provide actionable next steps without exposing server paths, tokens or raw CLI output.
- [x] #3 Operator documentation includes verification steps for the same OS account and environment that run the app.

**Delivery evidence:** No final summary is recorded; consult the source, implementation and tests before claiming verification.

<a id="task-13-2"></a>

### TASK-13.2 — Cancel a writing-suggestion request

Source: [TASK-13.2](../backlog/tasks/task-13.2%20-%20Cancel-a-writing-suggestion-request.md) · Baseline status: Done.

**Recorded intent / important context**

A writer may switch tasks or choose the wrong model while generation is running. Cancellation should stop unnecessary work and allow a fresh request.

**Preserve these acceptance criteria**

- [x] #1 A running generation exposes a cancel action with clear pending and cancelled feedback.
- [x] #2 Cancellation stops the associated server work and releases the user's request slot.
- [x] #3 Cancelled or late responses cannot populate another team's suggestions; cancellation preserves ranking prose.

**Delivery evidence:** No final summary is recorded; consult the source, implementation and tests before claiming verification.

<a id="task-13-3"></a>

### TASK-13.3 — Ground depth suggestions in current roster ownership

Source: [TASK-13.3](../backlog/tasks/task-13.3%20-%20Ground-depth-suggestions-in-current-roster-ownership.md) · Baseline status: Done.

**Recorded intent / important context**

Writing context currently describes observed positional depth rather than a complete current roster. Actual ownership would make current depth discussion more useful while avoiding false historical claims.

**Preserve these acceptance criteria**

- [x] #1 Current-season depth separates starters and bench players from the latest available roster with a visible snapshot date.
- [x] #2 Players no longer owned are excluded from claims about current depth.
- [x] #3 Historical selections do not substitute today's roster for historical ownership; unsupported snapshots are identified explicitly.

**Delivery evidence:** No final summary is recorded; consult the source, implementation and tests before claiming verification.

<a id="task-14"></a>

### TASK-14 — Keep missing development settings unset

Source: [TASK-14](../backlog/tasks/task-14%20-%20Keep-missing-development-settings-unset.md) · Baseline status: Done.

**Recorded intent / important context**

The Vite environment allowlist assigns missing file values into process.env. Node coerces undefined to the literal string "undefined", so optional services can appear configured and required-service checks can be bypassed accidentally. This affects clean development setups without every server setting.

**Preserve these acceptance criteria**

- [x] #1 Absent server settings remain absent after Vite configuration runs.
- [x] #2 Defined file values load and existing process values retain precedence.
- [x] #3 Regression coverage includes absent Auth0/ESPN settings.

**Recorded delivered behavior (historical)**

Missing development settings remain absent instead of becoming the string "undefined". Existing shell values retain precedence. Configuration regressions and documentation updated; tests, typecheck and lint pass.

<a id="task-15"></a>

### TASK-15 — Protect ranking drafts across reloads and connection loss

Source: [TASK-15](../backlog/tasks/task-15%20-%20Protect-ranking-drafts-across-reloads-and-connection-loss.md) · Baseline status: Done.

**Recorded intent / important context**

Writers can spend significant time composing weekly commentary. A browser reload, interrupted connection or expired session should not force them to recreate unsaved work.

**Preserve these acceptance criteria**

- [x] #1 An unsaved edition can be recovered after a reload with its title, introduction, order and commentary intact.
- [x] #2 Recovery is isolated by account, league, season and week; another signed-in account cannot see the draft.
- [x] #3 The writer can choose whether to restore or discard a recovered draft without silently replacing saved content.

**Recorded delivered behavior (historical)**

Synchronous browser draft snapshots now preserve unsaved ranking content by account/league/year/week. Reload offers explicit restore/discard and blocks mutation/saving until decided; matching snapshots clear only after a successful save. Storage failures are surfaced without losing in-memory edits. Nine editor-hook tests pass, including full draft restoration, account isolation and discard, plus build/typecheck and lint. README documents recovery and local-storage limitations.

<a id="task-16"></a>

### TASK-16 — Prevent simultaneous editors from silently overwriting rankings

Source: [TASK-16](../backlog/tasks/task-16%20-%20Prevent-simultaneous-editors-from-silently-overwriting-rankings.md) · Baseline status: Done.

**Recorded intent / important context**

The same writer may open multiple tabs or devices. A stale save should not silently replace a newer edition.

**Preserve these acceptance criteria**

- [x] #1 Saving a stale edition reports a conflict and preserves the local draft.
- [x] #2 The writer can inspect the newer saved edition before choosing a resolution.
- [x] #3 Two overlapping saves are covered by a regression scenario demonstrating no silent data loss.

**Recorded delivered behavior (historical)**

Added server-managed revision numbers and atomic compare-and-swap updates by ID and by week, including legacy revision-zero records. Stale saves return 409 and preserve the local draft. Writers can load and inspect remote title/intro/commentary, choose remote content or retry local content against the inspected revision. The full 167-test suite and 11 focused tests including an overlapping-writer service simulation and interactive conflict recovery pass; production build/typecheck and lint pass. README documents client revision semantics.

<a id="task-17"></a>

### TASK-17 — Separate private drafts from published ranking editions

Source: [TASK-17](../backlog/tasks/task-17%20-%20Separate-private-drafts-from-published-ranking-editions.md) · Baseline status: Done.

**Recorded intent / important context**

Writers need a deliberate publication step so readers see a finished edition while edits remain private.

**Preserve these acceptance criteria**

- [x] #1 Owners can publish and unpublish a selected weekly edition explicitly.
- [x] #2 A public read-only link shows only the published version, including while its draft is being edited.
- [x] #3 Unpublished editions and draft content are unavailable to anonymous readers; the original PNG format stays unchanged.

**Recorded delivered behavior (historical)**

Added explicit owner-only publish/status/unpublish controls backed by separate immutable-at-publication snapshots and opaque public links. Public read-only pages expose only the chosen saved snapshot; draft changes do not alter it, stale publish requests fail and unpublishing revokes the link. Tests prove snapshot isolation, ownership checks, stale revision rejection and explicit UI publish/revoke behavior. All 172 tests and 14 browser checks pass, including original PNG snapshots; build/typecheck/lint pass. README documents sharing semantics. Found and logged unrelated integration-script count bug as medium TASK-35.

<a id="task-18"></a>

### TASK-18 — Document and verify backup and recovery

Source: [TASK-18](../backlog/tasks/task-18%20-%20Document-and-verify-backup-and-recovery.md) · Baseline status: Done.

**Recorded intent / important context**

League configuration and written editions are valuable data. Operators need a repeatable way to recover the service after storage loss.

**Preserve these acceptance criteria**

- [x] #1 A documented backup and restoration procedure covers league and ranking data and the separate configuration needed to decrypt saved ESPN credentials.
- [x] #2 A restore rehearsal uses an isolated destination and verifies recovered editions and ownership boundaries.
- [x] #3 Documentation specifies retention, access restrictions and how to avoid overwriting the running database.

**Recorded delivered behavior (historical)**

Added a backup/recovery runbook covering complete MongoDB archives, separate ESPN encryption key and Auth0 recovery material, encrypted off-host storage, retention, quiesced writes and restore-to-new-database/cutover safeguards. Added npm run backup:verify, which launches its own disposable loopback mongod and performs real mongodump/mongorestore into another namespace. The rehearsal passes using actual application ownership and decryption services, verifying editions/revisions, unique indexes, publication data, owner isolation and real MongoDB concurrent-save rejection. Typecheck, lint and diff checks pass. No application environment files or production data were accessed; real deployment backup restoration remains an operator procedure.

<a id="task-19"></a>

### TASK-19 — Show and restore ranking revision history

Source: [TASK-19](../backlog/tasks/task-19%20-%20Show-and-restore-ranking-revision-history.md) · Baseline status: Done.

**Recorded intent / important context**

Writers should be able to recover an earlier saved edition after an accidental edit and understand how it changed.

**Preserve these acceptance criteria**

- [x] #1 Owners can list saved revisions of an edition with timestamps.
- [x] #2 A revision preview shows title, introduction, order and commentary before restoration.
- [x] #3 Restoring an older revision creates a new current revision without erasing history or exposing another owner's data.

**Recorded delivered behavior (historical)**

Added atomic pre-save revision snapshots with timestamps, owner-only list/restore RPCs and an editor preview/restore panel. Restoring produces a new revision without altering publications. Real MongoDB rehearsal verifies revision order, restored commentary and cross-owner denial; interactive DOM preview test passes. Build output, corrected test typecheck, lint and diff checks pass. README documents rollout and document-size limits.

<a id="task-20"></a>

### TASK-20 — Archive leagues without losing their rankings

Source: [TASK-20](../backlog/tasks/task-20%20-%20Archive-leagues-without-losing-their-rankings.md) · Baseline status: Done.

**Recorded intent / important context**

Old leagues can clutter the active workspace, but deleting their written history would be undesirable.

**Preserve these acceptance criteria**

- [x] #1 Owners can archive and restore a league with clear feedback.
- [x] #2 Archived leagues are hidden from the default active picker but remain discoverable in an archive view.
- [x] #3 Archiving retains existing editions and does not change public visibility implicitly.

**Recorded delivered behavior (historical)**

Added owner-only archive/restore operations and a Manage leagues view with active/archive switching. Active pickers exclude archived records; rankings, history and sharing remain intact. Real MongoDB checks verify list filtering, data retention, public visibility and ownership denial; interactive archive/restore test passes. Production build/typecheck/lint pass; README documents archive semantics.

<a id="task-21"></a>

### TASK-21 — Rename a league in the workspace

Source: [TASK-21](../backlog/tasks/task-21%20-%20Rename-a-league-in-the-workspace.md) · Baseline status: Done.

**Recorded intent / important context**

An imported league name may be outdated or too similar to another league. A local display name helps writers identify the right workspace.

**Preserve these acceptance criteria**

- [x] #1 Owners can edit a league's display name and cancel without saving.
- [x] #2 Blank names and unreasonable lengths are rejected with accessible feedback.
- [x] #3 Renaming does not modify the provider's league or unexpectedly rewrite existing edition titles.

**Delivery evidence:** No final summary is recorded; consult the source, implementation and tests before claiming verification.

<a id="task-22"></a>

### TASK-22 — Remember the last league and edition selection

Source: [TASK-22](../backlog/tasks/task-22%20-%20Remember-the-last-league-and-edition-selection.md) · Baseline status: Done.

**Recorded intent / important context**

Returning writers should resume their recent workspace without repeatedly selecting the same league, season and week.

**Preserve these acceptance criteria**

- [x] #1 A returning account resumes its last valid league, season and week when no explicit URL selection is supplied.
- [x] #2 Explicit URL selections take precedence over remembered values.
- [x] #3 Unavailable or archived selections fall back safely, and selections do not leak across accounts.

**Delivery evidence:** No final summary is recorded; consult the source, implementation and tests before claiming verification.

<a id="task-23"></a>

### TASK-23 — Copy selected content from a previous edition

Source: [TASK-23](../backlog/tasks/task-23%20-%20Copy-selected-content-from-a-previous-edition.md) · Baseline status: Done.

**Recorded intent / important context**

Weekly writing often builds on the prior edition. Explicit copying can save retyping while giving the writer control over which material carries forward.

**Preserve these acceptance criteria**

- [x] #1 The writer can select a source edition and choose whether to copy introduction, team commentary and ordering.
- [x] #2 The destination remains unchanged until the writer confirms, and existing destination content is identified before replacement.
- [x] #3 Missing or renamed teams are explained; unmatched teams are not silently dropped and the source remains unchanged.

**Recorded delivered behavior (historical)**

Added selective copying from previous editions with an explicit review/confirm step, replacement warnings and stable team-ID matching. Unmatched destination teams are retained; source editions remain unchanged. Focused component/helper tests, typecheck and lint pass; README updated.

<a id="task-24"></a>

### TASK-24 — Use the correct historical record in weekly rankings

Source: [TASK-24](../backlog/tasks/task-24%20-%20Use-the-correct-historical-record-in-weekly-rankings.md) · Baseline status: Done.

**Recorded intent / important context**

The README states that provider records are season-to-date rather than reconstructed for the selected historical week. An older ranking can therefore display wins and losses from later games.

**Preserve these acceptance criteria**

- [x] #1 Historical editions display team records through the selected week for supported providers.
- [x] #2 When historical records cannot be established, the UI identifies that limitation rather than presenting current records as historical.
- [x] #3 Regression fixtures include an older week followed by additional wins, losses and ties; exported records match the selected week.

**Recorded delivered behavior (historical)**

New editions reconstruct completed regular-season records through the selected week for Sleeper head-to-head and ESPN H2H_POINTS. ESPN multi-week matchups count only when fully completed. Missing history/unsupported formats show an explicit limitation instead of current standings; saved editions remain unchanged. Regression fixtures verify later wins/losses/ties, unfinished periods and exported records. Full suite had 180 passing tests and one outdated ownership fixture; corrected fixture and focused nine tests, typecheck and lint pass. README documents coverage.

<a id="task-25"></a>

### TASK-25 — Support identical league IDs across providers and accounts

Source: [TASK-25](../backlog/tasks/task-25%20-%20Support-identical-league-IDs-across-providers-and-accounts.md) · Baseline status: Done.

**Recorded intent / important context**

The documented ownership model permits only one account per external league ID and does not support cross-provider collisions. Independent writers should be able to register their own workspaces safely.

**Preserve these acceptance criteria**

- [x] #1 Sleeper and ESPN leagues with the same numeric ID can coexist.
- [x] #2 Two accounts can independently register the same external league without gaining access to one another's drafts or credentials.
- [x] #3 Existing league records and share links have a documented migration path with ownership-isolation regression coverage.

**Recorded delivered behavior (historical)**

New registrations use distinct numeric workspace IDs and providerLeagueId, with owner/provider/external-ID uniqueness enforced by a partial Mongo index. Provider requests resolve external IDs; existing documents, rankings and shared URLs retain their original IDs. Isolated Mongo verification covers same external ID across owners/providers, duplicate registration races and denied cross-owner reads. Full suite had 181 passes and one outdated projection assertion; corrected assertion passes with typecheck and lint. Documentation explains additive deployment migration.

<a id="task-26"></a>

### TASK-26 — Use season-specific valid week selections

Source: [TASK-26](../backlog/tasks/task-26%20-%20Use-season-specific-valid-week-selections.md) · Baseline status: Done.

**Recorded intent / important context**

The documented week picker is fixed at 1–18. League and season schedules can differ, so unavailable weeks should not lead writers into confusing empty states.

**Preserve these acceptance criteria**

- [x] #1 Week choices reflect the supported schedule for the selected league and season.
- [x] #2 Unavailable selections receive a clear explanation and a safe way to choose another week.
- [x] #3 Historical editions remain accessible and preseason behavior is explicitly defined.

**Recorded delivered behavior (historical)**

The rankings studio now loads season-specific week choices from authenticated provider metadata instead of always offering weeks 1–18. ESPN uses its final scoring period; Sleeper uses its configured start and playoff schedule with 17/18-week NFL-era caps and completed-season scoring bounds. Invalid weeks move to the first safe choice with an explanation. Saved editions outside provider metadata remain labeled and selectable, including when an old provider season is unavailable. Preseason limitations and recovery behavior are visible and documented. All 197 tests, lint and typecheck pass; the production build succeeds.

<a id="task-27"></a>

### TASK-27 — Make report freshness and partial failures visible

Source: [TASK-27](../backlog/tasks/task-27%20-%20Make-report-freshness-and-partial-failures-visible.md) · Baseline status: Done.

**Recorded intent / important context**

A report can contain cached data or missing provider results. Readers need to distinguish a complete recent report from a partially available one.

**Preserve these acceptance criteria**

- [x] #1 Reports show when their displayed data was last successfully refreshed.
- [x] #2 A refresh failure preserves usable data and labels affected sections without describing them as current.
- [x] #3 Retry feedback distinguishes loading, success and continued partial availability in an accessible way.

**Recorded delivered behavior (historical)**

Season Insights, Playoff Simulation and League History now show full last-successful refresh timestamps. Manual refreshes leave usable data visible; failures identify every stale season or report scope, preserve earlier timestamps and exclude seasons with no usable result. Loading, successful refresh and continued partial states use accessible status or alert semantics. Tolerated provider gaps are structured and labeled by affected section, including playoff projections, final finishes and lineup-dependent transaction analysis. README reporting behavior is updated. All 201 tests, lint, typecheck, production build and diff checks pass.

<a id="task-28"></a>

### TASK-28 — Compare two managers over selected seasons

Source: [TASK-28](../backlog/tasks/task-28%20-%20Compare-two-managers-over-selected-seasons.md) · Baseline status: Done.

**Recorded intent / important context**

League members often want a focused comparison rather than scanning the full history table.

**Preserve these acceptance criteria**

- [x] #1 Readers can choose two distinct managers and a season range.
- [x] #2 Comparison displays scoring, league-median performance and known season achievements on consistent coverage windows.
- [x] #3 Missing seasons and ownership-group differences are visible; changing the comparison never modifies ranking editions.

**Recorded delivered behavior (historical)**

League History now includes a focused, read-only comparison for two distinct manager ownership groups over a selectable contiguous season range. Side-by-side cards show average scoring, average performance versus the league median, above-median weeks, playoff appearances, championships and average finish. Scoring uses exact shared completed weeks; achievements use seasons where both groups appear and show known-result coverage. A season-by-season list identifies unavailable data and years played under different ownership groups, including season-scoped identities for unknown owners. The comparison has no ranking mutation path. Documentation is updated; all 203 tests, lint, typecheck, production build and diff checks pass.

<a id="task-29"></a>

### TASK-29 — Download report tables as CSV

Source: [TASK-29](../backlog/tasks/task-29%20-%20Download-report-tables-as-CSV.md) · Baseline status: Done.

**Recorded intent / important context**

League members may want to analyze report results elsewhere or retain a copy of the exact values they are viewing.

**Preserve these acceptance criteria**

- [x] #1 Season and history report tables can be exported with their active filters and visible ordering.
- [x] #2 Exports include clear column names, coverage or missing-value indicators and the relevant league/season context.
- [x] #3 Text values are safely escaped, including spreadsheet-formula-like names, and private account or credential fields are excluded.

**Recorded delivered behavior (historical)**

Every table in loaded Season Insights, Playoff Simulation and League History reports now offers a contextual CSV download. Files follow the table's active filters, current TanStack sorting and visible row limit, and include public league/season/coverage metadata, clear headers and explicit `Unavailable (not zero)` cells. Achievement exports retain known-season denominators. Serialization uses only declared table columns, excludes hidden account/credential properties, safely quotes CSV text and neutralizes formula-like strings. Documentation is updated; all 205 tests, lint, typecheck, production build and diff checks pass.

<a id="task-30"></a>

### TASK-30 — Offer an optional mobile-friendly ranking image

Source: [TASK-30](../backlog/tasks/task-30%20-%20Offer-an-optional-mobile-friendly-ranking-image.md) · Baseline status: Done.

**Recorded intent / important context**

The fixed wide ranking image is useful for its established format but difficult to read in phone chats. A separate compact export would provide a more readable option.

**Preserve these acceptance criteria**

- [x] #1 Writers can explicitly choose a compact export while the existing download remains the default.
- [x] #2 Compact exports preserve all team order and commentary, including long names and descriptions.
- [x] #3 The original desktop/mobile download snapshots remain unchanged; compact output is visually checked for clipping.

**Delivery evidence:** No final summary is recorded; consult the source, implementation and tests before claiming verification.

<a id="task-31"></a>

### TASK-31 — Add a guided first-league experience

Source: [TASK-31](../backlog/tasks/task-31%20-%20Add-a-guided-first-league-experience.md) · Baseline status: Done.

**Recorded intent / important context**

A first-time writer must connect a provider, select a league and understand the editor. Clear empty-state guidance can make the first successful edition easier.

**Preserve these acceptance criteria**

- [x] #1 An account with no leagues has a clear first action and provider-specific guidance for locating its league ID.
- [x] #2 Private ESPN setup requirements are explained before a failed import becomes the user's first feedback.
- [x] #3 After successful creation, the user reaches the new league's editor with a concise explanation of writing, saving and exporting.

**Delivery evidence:** No final summary is recorded; consult the source, implementation and tests before claiming verification.

<a id="task-32"></a>

### TASK-32 — Run repeatable checks for every proposed change

Source: [TASK-32](../backlog/tasks/task-32%20-%20Run-repeatable-checks-for-every-proposed-change.md) · Baseline status: Done.

**Recorded intent / important context**

The project has unit, browser, build and export-regression checks. Running a reliable set automatically reduces the chance of regressions reaching the main branch.

**Preserve these acceptance criteria**

- [x] #1 Proposed changes trigger installation from the lockfile, tests, typecheck, lint and a production build without production credentials.
- [x] #2 Browser coverage includes ranking interactions, accessibility contrast and unchanged original export snapshots.
- [x] #3 Failures retain useful diagnostics; live provider checks are separated from deterministic required checks and the workflow is documented.

**Delivery evidence:** No final summary is recorded; consult the source, implementation and tests before claiming verification.

<a id="task-33"></a>

### TASK-33 — Show keyboard shortcuts in the ranking editor

Source: [TASK-33](../backlog/tasks/task-33%20-%20Show-keyboard-shortcuts-in-the-ranking-editor.md) · Baseline status: Done.

**Recorded intent / important context**

Keyboard reordering exists, but writers may not discover it. A compact reference would make the editor easier to operate without a mouse.

**Preserve these acceptance criteria**

- [x] #1 The editor offers an accessible shortcut reference covering existing drag, move, cancel and undo interactions.
- [x] #2 The reference is usable at mobile widths and can be opened and closed using a keyboard.
- [x] #3 Documented shortcuts match actual behavior and do not intercept normal typing in commentary fields.

**Delivery evidence:** No final summary is recorded; consult the source, implementation and tests before claiming verification.

<a id="task-34"></a>

### TASK-34 — Use Markov chains or other statistics methods to project who will make playoffs

Source: [TASK-34](../backlog/tasks/task-34%20-%20Use-Markov-chains-or-other-statistics-methods-to-project-who-will-make-playoffs.md) · Baseline status: Done.

**Recorded intent / important context**

- Playoff chance
- Then each level of playoffs win percentage

**Recorded delivered behavior (historical)**

Adds cutoff-controlled Monte Carlo playoff scenarios to private and shared season insights, with qualification, round advancement and title probabilities. Uses reproducible score distributions and standard 2/4/6/8-team brackets with six-team byes. Clearly labels neutral future schedules, unsupported rules and retrospective forecasts; missing settings/history yield explanations. Seven numerical invariants/cutoff tests and two interactive DOM tests pass; full suite 165 tests, typecheck, lint and production build pass. README and calculation guide document assumptions.

<a id="task-35"></a>

### TASK-35 — Keep the local integration check compatible with new server functions

Source: [TASK-35](../backlog/tasks/task-35%20-%20Keep-the-local-integration-check-compatible-with-new-server-functions.md) · Baseline status: Done.

**Recorded intent / important context**

scripts/check-local.mjs asserts that the compiled app contains exactly 19 server functions. The app now has additional profile, writing, report and publication functions, so this count assertion prevents the integration check from exercising its intended scenarios.

**Preserve these acceptance criteria**

- [x] #1 The local integration check validates the specific server functions it needs without failing when unrelated functions are added.
- [x] #2 The check carries ranking revisions through updates and can exercise current save behavior.
- [x] #3 A successful run against an isolated test database is documented; production data is never modified.

**Delivery evidence:** No final summary is recorded; consult the source, implementation and tests before claiming verification.

<a id="task-36"></a>

### TASK-36 — Move playoff simulation into its own tab

Source: [TASK-36](../backlog/tasks/task-36%20-%20Move-playoff-simulation-into-its-own-tab.md) · Baseline status: Done.

**Recorded intent / important context**

User requested a separate tab for playoff simulations rather than embedding them among season statistics.

**Preserve these acceptance criteria**

- [x] #1 A clearly labeled Playoff simulation tab presents the existing forecast and controls.
- [x] #2 Season statistics no longer embed the forecast; league and season context and shared access remain available.

**Recorded delivered behavior (historical)**

Moved the forecast into a dedicated Playoff simulation navigation tab with private and shared routes. Navigation preserves league/season; simulation share links open the new view. Season insights no longer render the forecast. Production build/typecheck, lint and eight forecast/public-report tests passed. README updated.

<a id="task-37"></a>

### TASK-37 — Include projections for simulations

Source: [TASK-37](../backlog/tasks/task-37%20-%20Include-projections-for-simulations.md) · Baseline status: Done.

**Recorded intent / important context**

https://github.com/lum8rjack/sleeper-go/blob/main/undocumented_projections.go

here is a library that uses undocumented apis, use this as a base for your sleeper implementation.

https://stmorse.github.io/journal/espn-fantasy-projections.html

use this article for the espn version

**Preserve these acceptance criteria**

- [x] #1 Simulations can use provider player projections scored with league settings and current roster/lineup context for Sleeper and ESPN.
- [x] #2 Missing projections degrade visibly to the existing historical model; past cutoff simulations never use future projections.
- [x] #3 Deterministic fixtures verify scoring, projection coverage, provider failures and forecast behavior; setup and limitations are documented.

**Recorded delivered behavior (historical)**

Added current-week projection snapshots for Sleeper and ESPN. Sleeper projections are scored from player stats with the league scoring settings; ESPN uses current starter `statSourceId=1` applied totals. Complete league-wide coverage is blended 50/50 with historical team means for the immediate next simulated week only. Partial data, provider failures, older seasons and retrospective cutoffs visibly retain the historical model. Added deterministic scorer, coverage, failure and forecast tests; all 186 tests, lint, typecheck and the production build pass. Updated README and calculation documentation.

<a id="task-38"></a>

### TASK-38 — Use Ox compiler

Source: [TASK-38](../backlog/tasks/task-38%20-%20Use-Ox-compiler.md) · Baseline status: Done.

**Recorded intent / important context**

https://oxc.rs/docs/guide/usage/transformer/react-compiler.html
docs found here

import like this

import { transform } from "oxc-transform-react";

**Recorded delivered behavior (historical)**

Moved application and browser-fixture compilation to `react({ compiler: { target: '19' } })`, backed by `oxc-transform-react`, while preserving TanStack Start before the React plugin. Removed the Babel React Compiler preset and its direct Babel dependencies. Added a configuration assertion, documented the experimental Oxc integration, and confirmed React Compiler memo-cache output. All 187 tests, lint, typecheck and the production build pass.

<a id="task-39"></a>

### TASK-39 — Add loading bars when loading multiple seasons

Source: [TASK-39](../backlog/tasks/task-39%20-%20Add-loading-bars-when-loading-multiple-seasons.md) · Baseline status: Done.

**Recorded intent / important context**

Show determinate progress while League history loads or refreshes multiple selected seasons so users can see how much work remains.

**Preserve these acceptance criteria**

- [x] #1 A determinate loading bar reports completed and total selected seasons during the initial multi-season load.
- [x] #2 The same progress indicator resets and advances during a refresh without hiding retained season data.
- [x] #3 Progress updates are accessible to assistive technology and disappear when the selected seasons finish.

**Recorded delivered behavior (historical)**

Added accessible determinate progress for multi-season League History loads and refreshes, with retained-data behavior documented and covered by route tests. Verified with the full 230-test suite, TypeScript, oxlint, and a production build.

<a id="task-40"></a>

### TASK-40 — Average regular season placement as well as end of season placement in separate columns

Source: [TASK-40](../backlog/tasks/task-40%20-%20Average-regular-season-placement-as-well-as-end-of-season-placement-in-separate-columns.md) · Baseline status: Done.

**Recorded intent / important context**

Show managers' average regular-season placement separately from their average final postseason placement in League History.

**Preserve these acceptance criteria**

- [x] #1 League History calculates regular-season placement only after the configured regular season is complete and complete league scoring data is available.
- [x] #2 The achievements table shows separate average regular-season placement and average final placement columns with independent coverage.
- [x] #3 The year-by-year history table shows separate regular-season and final placements, leaving unavailable values blank rather than substituting one for the other.

**Recorded delivered behavior (historical)**

Added separate average regular-season and final placement reporting, plus year-by-year columns and documented completeness/tiebreak rules. Verified with calculation and route coverage, the full 231-test suite, TypeScript, oxlint, and a production build.

<a id="task-41"></a>

### TASK-41 — Use the league's settings in the playoff simulation

Source: [TASK-41](../backlog/tasks/task-41%20-%20Use-the-leagues-settings-in-the-playoff-simulation.md) · Baseline status: Done.

**Recorded intent / important context**

pull the settings for the league and use that in the playoff simulations

**Preserve these acceptance criteria**

- [x] #1 Provider-derived regular-season and playoff-team settings reach report data.
- [x] #2 Playoff simulation uses the configured team count and regular-season cutoff.
- [x] #3 Forecast behavior remains safe when provider settings are unavailable.

**Recorded delivered behavior (historical)**

Playoff simulations now have regression coverage proving provider league settings reach the report and control bracket sizing and simulation cutoff. Added provider-settings documentation; existing safe fallback remains when settings are unavailable. All 242 tests, formatting, typecheck, lint, and production build pass.

<a id="task-42"></a>

### TASK-42 — Allow simulations for playoffs starting in week 1 but add disclaimer about inaccuracy

Source: [TASK-42](../backlog/tasks/task-42%20-%20Allow-simulations-for-playoffs-starting-in-week-1-but-add-disclaimer-about-inaccuracy.md) · Baseline status: Done.

**Recorded intent / important context**

Allow playoff simulations after only one or two completed weeks, using the model's strong league-average shrinkage and any complete current provider projection while clearly warning that early-season estimates are especially uncertain.

**Preserve these acceptance criteria**

- [x] #1 A forecast can run with one or two complete paired scoring weeks per team instead of requiring three.
- [x] #2 Early-season forecasts continue to use complete current-week provider projections when available and retain conservative league-average shrinkage.
- [x] #3 Forecasts through week 1 or 2 display a prominent disclaimer that the small-sample estimate is especially uncertain.

**Recorded delivered behavior (historical)**

Enabled playoff forecasts from week 1 with conservative small-sample weighting, current projection support, and a prominent week 1–2 uncertainty disclaimer. Verified with focused tests, the full 232-test suite, TypeScript, oxlint, and a production build.

<a id="task-43"></a>

### TASK-43 — Dispose session collections after live queries detach

Source: [TASK-43](../backlog/tasks/task-43%20-%20Dispose-session-collections-after-live-queries-detach.md) · Baseline status: Done.

**Recorded intent / important context**

Authenticated route teardown can clean up a TanStack DB source collection while a child live query still depends on it. This currently produces a `[Live Query Error] ... manually cleaned up` warning during route-test cleanup and can also occur when a browser session changes or signs out.

**Preserve these acceptance criteria**

- [x] #1 Navigating away, signing out, and replacing the authenticated account do not clean up a collection until all dependent live queries have detached.
- [x] #2 Every league and ranking collection is still disposed after its session ends, and cached records never become visible to the next account.
- [x] #3 Regression coverage repeatedly mounts and tears down authenticated ranking routes without TanStack DB live-query warnings or leaked subscriptions.

**Recorded delivered behavior (historical)**

Made authenticated collection disposal subscriber-aware and idempotent, tied session identity to authenticated state, and added regression coverage for navigation teardown, sign-out, account replacement, collection cleanup, and cache isolation. Verified with the full 233-test suite, TypeScript, oxlint, and a production build.

<a id="task-44"></a>

### TASK-44 — Preserve league setup when visiting ESPN settings

Source: [TASK-44](../backlog/tasks/task-44%20-%20Preserve-league-setup-when-visiting-ESPN-settings.md) · Baseline status: Done.

**Recorded intent / important context**

The first-league form links private ESPN users to ESPN settings with a normal page load. Following that link can discard the selected provider, entered league ID, display name, and season, and saving credentials does not return the user to the import they were completing.

**Preserve these acceptance criteria**

- [x] #1 Opening ESPN settings from league creation uses application navigation and preserves the non-secret league form values for the current account.
- [x] #2 Saving or intentionally skipping ESPN credential setup returns the user to league creation with the preserved values and a clear next action.
- [x] #3 Completing or cancelling league creation clears the temporary form state, and no ESPN cookies or account tokens are stored with it.

**Recorded delivered behavior (historical)**

League creation now survives the ESPN credentials detour and reloads without persisting secrets. Saving or skipping credentials returns to a clearly restored form, while successful creation and cancellation remove the temporary account-scoped draft. Added unit and router coverage and documented the lifecycle.

<a id="task-45"></a>

### TASK-45 — Reuse public league data for link previews and reports

Source: [TASK-45](../backlog/tasks/task-45%20-%20Reuse-public-league-data-for-link-previews-and-reports.md) · Baseline status: Done.

**Recorded intent / important context**

Opening a shared season, playoff, or history URL currently reads the same public league once for route metadata and again when the report component initializes its league picker. Reusing the validated public result would reduce database work and prevent metadata and page state from observing different sharing states during one navigation.

**Preserve these acceptance criteria**

- [x] #1 An initial shared-report navigation performs no more than one public league lookup for both metadata and visible page context.
- [x] #2 Client navigation between shared report tabs reuses valid cached public league data while still respecting sharing revocation and normal freshness rules.
- [x] #3 Metadata and visible report state agree when a league is unavailable, and generic previews continue to hide provider errors and private fields.

**Recorded delivered behavior (historical)**

Shared report metadata and visible report context now use the same router-scoped, public-only query cache. Initial loads and fresh cross-tab navigation perform one league lookup, while stale navigation revalidates sharing. Unavailable leagues remain generic and consistent. Added cache-count, revocation, privacy, and layout coverage and updated documentation.

<a id="task-46"></a>

### TASK-46 — Eliminate empty stylesheet URLs in router tests

Source: [TASK-46](../backlog/tasks/task-46%20-%20Eliminate-empty-stylesheet-URLs-in-router-tests.md) · Baseline status: Done.

**Recorded intent / important context**

Router tests intermittently print React's warning that an empty string was passed to an `href`. The warning appears when the root document head is rendered under Vitest, where the imported stylesheet URL may resolve to an empty test value. Expected warnings make real invalid-link regressions easier to miss.

**Preserve these acceptance criteria**

- [x] #1 Rendering authenticated and public routes under Vitest does not create a link or anchor with an empty `href` and produces no corresponding React warning.
- [x] #2 The test environment supplies a realistic non-empty stylesheet asset URL or omits only the unavailable test asset without changing production head output.
- [x] #3 Router coverage fails on unexpected React DOM warnings while preserving explicit assertions for intentionally logged application errors.

**Recorded delivered behavior (historical)**

Router tests now render a valid document with a realistic non-empty stylesheet URL. Empty hrefs and unexpected React/console errors fail coverage, while structured application error diagnostics remain visible and testable. Production head behavior is unchanged, and the test contract is documented.

<a id="task-47"></a>

### TASK-47 — Add deterministic ESPN integration coverage

Source: [TASK-47](../backlog/tasks/task-47%20-%20Add-deterministic-ESPN-integration-coverage.md) · Baseline status: Done.

**Recorded intent / important context**

The public ESPN league previously used by `npm run check:local` now returns 401. The default disposable-database integration check therefore validates the complete Sleeper path but exercises ESPN only when a developer supplies a league ID and personal cookies.

**Preserve these acceptance criteria**

- [x] #1 A deterministic integration path covers ESPN league validation, teams, matchups, and report loading without requiring a developer's personal credentials.
- [x] #2 Coverage verifies that public ESPN requests omit cookies and private requests attach only the current account's encrypted credentials.
- [x] #3 Optional live ESPN verification remains available, while local and CI output clearly distinguishes deterministic coverage from live-provider coverage.

**Recorded delivered behavior (historical)**

ESPN now has deterministic end-to-end adapter coverage against a sanitized local HTTP contract, including full report loading and credential isolation, with no external access or personal secrets. Optional check:local live verification remains available and is clearly labeled. Added focused and full-suite scripts/docs; all 242 tests, typecheck, lint, and production build pass.

<a id="task-48"></a>

### TASK-48 — Make the repository format check enforceable

Source: [TASK-48](../backlog/tasks/task-48%20-%20Make-the-repository-format-check-enforceable.md) · Baseline status: Done.

**Recorded intent / important context**

`npm run format:check` reports many pre-existing formatting differences, so normal task verification must format only changed files and cannot use the repository-wide command as a reliable gate. This allows formatting drift to continue even though the check is documented.

**Preserve these acceptance criteria**

- [x] #1 The checked-in source, test, script, and documentation files covered by the formatter pass `npm run format:check` from a clean checkout.
- [x] #2 Generated output, build artifacts, baselines, dependencies, and intentionally excluded files are represented explicitly in formatter configuration rather than relying on local state.
- [x] #3 CI runs the format check for proposed changes and provides a clear command for contributors to repair failures without altering generated or user-owned artifacts.

**Recorded delivered behavior (historical)**

The repository-wide format check now passes on all 209 formatter-covered files. Oxfmt configuration explicitly represents excluded generated/dependency/Backlog/agent files, CI runs npm run format:check, and README documents npx oxfmt --write . for repair. Full tests (242), typecheck, lint, and production build pass.

<a id="task-49"></a>

### TASK-49 — Ensure projections for playoffs include players on the bench

Source: [TASK-49](../backlog/tasks/task-49%20-%20Ensure-projections-for-playoffs-include-players-on-the-bench.md) · Baseline status: Done.

**Recorded intent / important context**

When running projections, include the top projected player for each week. Do not just take what the current lineup is. That way bye weeks are taken into account

**Recorded delivered behavior (historical)**

Playoff simulations now calculate each team’s highest total legal next-week lineup from current starters and bench players. Sleeper uses configured roster slots, roster ownership and league-scored player projections; ESPN uses current roster slot eligibility and provider totals. A bench player can replace an unprojected starter such as a bye, and incomplete legal lineups retain the visible historical-scoring fallback. The forecast reports optimized-lineup coverage and bench selections. Added deterministic Sleeper/ESPN bench and missing-projection coverage, updated README, and verified 243 tests, production build, typecheck and lint.

<a id="task-50"></a>

### TASK-50 — Figure out historical records of best vs best for players left on bench

Source: [TASK-50](../backlog/tasks/task-50%20-%20Figure-out-historical-records-of-best-vs-best-for-players-left-on-bench.md) · Baseline status: Done.

**Preserve these acceptance criteria**

- [x] #1 Completed historical weeks expose each team’s actual score and best legal lineup score when provider player, position and slot data are complete.
- [x] #2 The weekly result records how many actual starters were retained by the best lineup; incomplete data remains unavailable rather than inferred.
- [x] #3 Sleeper and ESPN fixtures cover bench substitutions, roster-slot legality and unavailable historical player data.

**Recorded delivered behavior (historical)**

Added provider-safe historical best-lineup results to every completed team-week. The model calculates the highest legal actual-score lineup, records actual starters retained by that result, and leaves weeks unavailable when required player, position or slot data are incomplete. Sleeper uses configured slots and catalog positions; ESPN uses historical box-score entries and statSourceId=0 totals. Added bench substitution, legality and unavailable-data fixtures; README documents the boundary. Focused 16 tests, typecheck and lint pass.

<a id="task-51"></a>

### TASK-51 — Figure out top possible scoring weeks ever for the best lineup for each player

Source: [TASK-51](../backlog/completed/task-51%20-%20Figure-out-top-possible-scoring-weeks-ever-for-the-best-lineup-for-each-player.md) · Baseline status: Done.

**Recorded intent / important context**

Best possible line up would be replacing players on the starting line up with players who outscored them on the bench

**Preserve these acceptance criteria**

- [x] #1 The Season insights weekly table shows actual score, best legal lineup score, and missed points for each selected team-week when lineup data are complete.
- [x] #2 Weeks with incomplete provider score, position, or slot data display an unavailable value rather than a fabricated best-lineup total.
- [x] #3 The display is covered by component or DOM-focused tests and documentation explains the unavailable-data boundary.

**Recorded delivered behavior (historical)**

Added Best lineup and Missed points columns to the selected-team weekly scoring table. The values come from the provider-safe legal-lineup calculation completed in TASK-50; incomplete historical lineup data stays unavailable. Added a route-level DOM test for available and unavailable weeks, and documented the table semantics. Focused router tests, typecheck, and lint pass.

<a id="task-52"></a>

### TASK-52 — Figure out historical starting accuracy, aka if a player on the bench outscored a player in the lineup for each manager

Source: [TASK-52](../backlog/completed/task-52%20-%20Figure-out-historical-starting-accuracy-aka-if-a-player-on-the-bench-outscored-a-player-in-the-lineup-for-each-manager.md) · Baseline status: Done.

**Recorded intent / important context**

Report each manager’s historical sit/start accuracy: the percentage of actual starters retained by the best legal lineup, weighted across completed provider-eligible weeks.

**Preserve these acceptance criteria**

- [x] #1 Each eligible team-week displays sit/start accuracy as retained actual starts divided by legal lineup slots; incomplete historical lineup weeks remain unavailable.
- [x] #2 Season insights summarize each team’s eligible-week best-lineup average and weighted sit/start accuracy.
- [x] #3 League History summarizes each manager’s eligible-week best-lineup average and weighted sit/start accuracy across selected seasons.
- [x] #4 Calculation and UI tests cover aggregation, unavailable coverage, and the displayed percentage; documentation defines the metric.

**Recorded delivered behavior (historical)**

Added weighted sit/start accuracy to the weekly Season insights table, team scoring summary, Manager scorecard, and League History season table. Accuracy is retained actual starters divided by legal lineup slots; best-lineup averages and percentages use only complete provider-eligible weeks. Added calculation, cross-season aggregation, Season route DOM, and historical scorecard coverage. Full test suite (249 tests), typecheck, lint, and production build pass.

<a id="task-53"></a>

### TASK-53 — caching

Source: [TASK-53](../backlog/tasks/task-53%20-%20caching.md) · Baseline status: Done.

**Recorded intent / important context**

- Add a caching layer so the historical results are not retrieved every single time swapping between pages.
- This can either be in memory on the page or possibly in the DB (you decide but don't overdo the complexity)

**Preserve these acceptance criteria**

- [x] #1 Past-season reports are reused when switching pages without repeated server reads.
- [x] #2 Explicit refresh retrieves updated results, and private caches remain scoped to the authenticated session.
- [x] #3 Caching behavior is tested and documented.

**Recorded delivered behavior (historical)**

Historical reports reuse the existing session cache with one-hour idle retention, avoiding repeated provider reads on page navigation. Active seasons retain five-minute freshness and manual refresh remains available. Public layouts no longer dispose router-owned caches. Tests verify concurrent reads, historical reuse beyond five minutes, current-season refresh, manual refresh, and account isolation; README documents lifecycle.

<a id="task-54"></a>

### TASK-54 — ESPN sharing snapshot

Source: [TASK-54](../backlog/tasks/task-54%20-%20ESPN-sharing-snapshot.md) · Baseline status: Done.

**Recorded intent / important context**

When a user shares an espn league that is private and used their own cookie, create a cache/snapshot of the data used at that point and share with a unique id that references that data. Use that data for that exact link rather than requiring a shared user to have a cookie of their own. Store this data in a new table in the database

**Preserve these acceptance criteria**

- [x] #1 Sharing a loaded owner ESPN report saves the displayed season data in a new database collection and returns a unique snapshot link.
- [x] #2 Anonymous snapshot reads use only stored report data and require no ESPN cookies or provider calls.
- [x] #3 Snapshot creation verifies league ownership; saved/public data excludes cookies and account metadata; disabling league sharing blocks snapshot reads.
- [x] #4 The viewer identifies when the snapshot was saved, keeps report views inside the saved seasons, and provides actionable errors for unavailable links or failed saves.
- [x] #5 Tests cover persistence, isolation, public rendering and sharing; documentation describes snapshot behavior.
- [x] #6 Snapshots expire 10 days after creation, are denied immediately after expiration, and are automatically deleted even when the application was offline at the expiration time.

**Recorded delivered behavior (historical)**

Owner ESPN report sharing now saves the loaded season/history/playoff report into a new reportsnapshots collection and creates a unique /shared/snapshots/<id> link. Anonymous viewers use only the saved data, with saved-season navigation and no ESPN credentials or provider calls. Nested report validation excludes account/cookie metadata, manager IDs are remapped, and the original league sharing switch controls access. Snapshots expire after ten days using persisted expiresAt dates, a MongoDB TTL index, startup deletion of overdue records, and immediate expiry checks on reads. Tests cover independent snapshots, ownership, disabled sharing, metadata filtering, anonymous rendering, clipboard/save failures, expiry and restart cleanup. README documents usage and retention. Full suite (261 tests), final focused tests, typecheck, lint and production build pass.

<a id="task-55"></a>

### TASK-55 — Use real schedules and player availability in playoff forecasts

Source: [TASK-55](../backlog/tasks/task-55%20-%20Use-real-schedules-and-player-availability-in-playoff-forecasts.md) · Baseline status: Done.

**Recorded intent / important context**

Playoff odds currently randomize known remaining opponents and can select unavailable players. Improve forecast inputs using existing league-provider schedules, configured lineup slots, weekly projections and current availability, with explicit gaps and no future-data leakage.

**Preserve these acceptance criteria**

- [x] #1 Known regular-season matchups drive simulations, with missing or unsupported formats disclosed.
- [x] #2 Current projected lineups exclude confirmed unavailable players and use legal bench replacements; missing teams do not discard valid projections for other teams.
- [x] #3 Forecast inputs and availability coverage survive shared report snapshots.
- [x] #4 Provider and simulator tests cover schedules, unavailable players and retrospective isolation; docs describe the data limits.

**Recorded delivered behavior (historical)**

Forecasts now use complete published regular-season schedules from ESPN/Sleeper, disclose missing weeks, retain valid projections per team, and exclude confirmed unavailable players from current projected legal lineups. ESPN uses configured slots even when starters are empty, and Sleeper excludes reserve/taxi slots. Injury uncertainty is displayed without arbitrary percentage discounts. New inputs survive shared snapshots. Tests cover pairing, availability, missing projections, provider loading, serialization and retrospective projection isolation; documentation updated.

<a id="task-56"></a>

### TASK-56 — Measure and improve playoff forecast uncertainty and accuracy

Source: [TASK-56](../backlog/tasks/task-56%20-%20Measure-and-improve-playoff-forecast-uncertainty-and-accuracy.md) · Baseline status: Done.

**Recorded intent / important context**

The current model has unvalidated fixed blending and no historical probability diagnostics. Improve uncertainty estimates and add time-ordered evaluation so forecast accuracy claims are backed by evidence, distinguishing simulation precision from real forecast accuracy.

**Preserve these acceptance criteria**

- [x] #1 Forecast distributions account for limited samples and report their assumptions and simulation uncertainty.
- [x] #2 Time-ordered historical evaluation uses only earlier results and reports Brier score, log loss and reliability counts against an equal-chance baseline.
- [x] #3 Projection and injury effects remain explicitly limited to data actually available at the forecast cutoff.
- [x] #4 Tests establish no leakage, numerical behavior and readable accuracy diagnostics; research and limitations are documented.

**Recorded delivered behavior (historical)**

Replaced fixed 50/50 projection blending with week-specific provider-centered means and historical fallback. Added within-team pooled variance, small-sample predictive uncertainty, 20,000 deterministic trials and a dynamic Monte Carlo margin. Added leakage-safe rolling-origin Brier/log-loss/reliability diagnostics to the playoff UI and a public benchmark script. The 180-game benchmark improved slightly over the old model but did not beat 50/50 overall; docs explicitly limit accuracy claims and identify the need for immutable pregame data. Validation: 58 test files/276 tests passed, focused model/UI tests passed, TypeScript, lint and production build passed. Provider loading at the first-round boundary is handled separately in TASK-57.

<a id="task-57"></a>

### TASK-57 — Load next-week projections at the first playoff-round boundary

Source: [TASK-57](../backlog/tasks/task-57%20-%20Load-next-week-projections-at-the-first-playoff-round-boundary.md) · Baseline status: Done.

**Recorded intent / important context**

Discovered while auditing forecast accuracy: both provider loaders stop requesting projections at the end of the fantasy regular season, so the first playoff round cannot use current roster/injury-aware provider estimates even at the latest pre-playoff cutoff.

**Preserve these acceptance criteria**

- [x] #1 ESPN and Sleeper request active next-week projections at the first playoff-round boundary.
- [x] #2 Historical seasons, older cutoffs and later postseason snapshots do not leak into the pre-playoff forecast.
- [x] #3 Regression tests cover the boundary and changes are documented.

**Recorded delivered behavior (historical)**

Both provider loaders now retrieve active next-week projections through the first playoff round. ESPN requires available schedule settings; both adapters stop after this boundary and reject historical-season snapshots. Added six provider regression cases (current boundary, later round, historical season) and documented first-round-only behavior. Validation: 22 provider/simulator tests passed; typecheck, lint and diff checks passed. TASK-56 includes first-round simulation use and retrospective cutoff protection.

<a id="task-59"></a>

### TASK-59 — Allow deleting and editing leagues via league id as well

Source: [TASK-59](../backlog/tasks/task-59%20-%20Allow-deleting-and-editing-leagues-via-league-id-as-well.md) · Baseline status: Done.

**Preserve these acceptance criteria**

- [x] #1 Rename accepts either the app workspace league ID or the external provider league ID.
- [x] #2 Archive and restore accept either identifier and continue enforcing owner isolation.
- [x] #3 Focused tests cover provider-ID rename/archive behavior and documentation explains the accepted identifiers.

**Recorded delivered behavior (historical)**

Management rename, archive and restore now resolve either the app workspace league ID or the external Sleeper/ESPN provider league ID through an owner-scoped $or filter. Added provider-ID rename and archive regression tests, updated the existing service expectation, and documented identifier behavior in README. Validation: focused management/service tests passed (7 tests), TypeScript, oxlint and diff checks passed.

<a id="task-60"></a>

### TASK-60 — Fix profile editing to use management api with env vars

Source: [TASK-60](../backlog/tasks/task-60%20-%20Fix-profile-editing-to-use-management-api-with-env-vars.md) · Baseline status: Done.

**Recorded intent / important context**

Profile editing is not configured. Contact the site administrator.

**Preserve these acceptance criteria**

- [x] #1 Profile reads and updates work when server-only Auth0 M2M credentials are configured, using AUTH0_MANAGEMENT_DOMAIN or a validated AUTH0_ISSUER_BASE_URL fallback.
- [x] #2 The client cannot select another account or modify fields beyond name and nickname; management secrets remain server-only.
- [x] #3 Configuration examples and tests cover deployment setup and missing/invalid values.

**Recorded delivered behavior (historical)**

Profile Management API configuration now derives its hostname from a validated standard AUTH0_ISSUER_BASE_URL when AUTH0_MANAGEMENT_DOMAIN is omitted. The existing M2M client ID/secret requirement, narrow read:users/update:users scope, owner-derived target ID, strict editable-field validation, and generic errors remain unchanged. Added profile-service coverage for issuer fallback and invalid issuer rejection, and documented the deployment behavior. Validation: focused profile/RPC/UI tests (12 tests), TypeScript, lint, and diff checks passed.

<a id="task-61"></a>

### TASK-61 — Allow editing league id associated with a league as well as delete leagues fully

Source: [TASK-61](../backlog/tasks/task-61%20-%20Allow-editing-league-id-associated-with-a-league-as-well-as-delete-leagues-fully.md) · Baseline status: Done.

**Recorded intent / important context**

at leagues/manage the user should be able to edit leagues they have created

**Preserve these acceptance criteria**

- [x] #1 Manage leagues lets an owner change a league's external provider ID after validating the target with its existing provider.
- [x] #2 A confirmed deletion removes the owned workspace and its local rankings, publications, and report snapshots, but never deletes the provider league.
- [x] #3 Both operations remain owner-scoped, handle invalid/duplicate IDs safely, and have focused UI/service coverage plus documentation.

**Recorded delivered behavior (historical)**

Manage leagues now supports editing the external Sleeper/ESPN league ID and permanent local workspace deletion. Provider-ID updates normalize numeric IDs, validate the target through the configured provider, preserve the local display name, and retain owner scoping. The deletion flow requires the exact local display name and removes owned rankings (including revisions), published-edition records, report snapshots and the workspace record; it never deletes the upstream provider league. Added RPC/client wiring and focused service, authenticated client, and management UI coverage. Validation: full suite passed (58 files, 282 tests), production build, TypeScript, lint and diff checks passed. Documentation explains validation and the deletion scope.

<a id="task-62"></a>

### TASK-62 — Add example values commented out to docker-compose file for easy configuration

Source: [TASK-62](../backlog/tasks/task-62%20-%20Add-example-values-commented-out-to-docker-compose-file-for-easy-configuration.md) · Baseline status: Done.

**Preserve these acceptance criteria**

- [x] #1 docker-compose.yml contains commented examples for the app, Mongo persistence, Auth0 browser settings, and optional server-only integrations.
- [x] #2 Examples distinguish build-time VITE settings from runtime server-only values and never include a usable credential.
- [x] #3 Compose configuration remains valid and deployment documentation points users to the examples.

**Recorded delivered behavior (historical)**

Added non-secret commented Docker Compose examples for image pinning, runtime Auth0 Management API credentials, ESPN encryption, writing assistants, and Mongo persistence. Clarified that VITE_AUTH0_* values are baked into the image at build time and cannot be changed via runtime Compose environment values. README now describes the .env/Compose relationship. Validation: docker compose config --no-interpolate and diff checks passed. The repository-wide format check only reports four unrelated existing files, which were left untouched.

<a id="task-63"></a>

### TASK-63 — When creating a new league in the ranking studio suggest a ranking based on power not necessarily record

Source: [TASK-63](../backlog/tasks/task-63%20-%20When-creating-a-new-league-in-the-ranking-studio-suggest-a-ranking-based-on-power-not-necessarily-record.md) · Baseline status: Done.

**Recorded intent / important context**

- The rankings should be based on how likely the team is to win each week/the whole year not necessarily their current record

**Preserve these acceptance criteria**

- [x] #1 A new unsaved weekly ranking starts in a power order based on completed score and point-margin data, rather than provider standings alone.
- [x] #2 The score uses only weeks before the selected edition, shrinks small samples toward league average, and leaves saved editions unchanged.
- [x] #3 The studio explains the suggested order and tests cover ranking behavior, data boundaries, and unavailable matchup fallback.

**Recorded delivered behavior (historical)**

New unsaved weekly rankings now begin with a conservative power suggestion based on completed scoring and point margin before the selected week, rather than standings record. The score uses 70% points and 30% margin with three-game league-average shrinkage, deterministic name tiebreaks, and a provider-order fallback if matchup history cannot load. The editor labels it as an editable signal rather than a player/season forecast; saved rankings are unchanged. Validation: focused ranking utility tests (6 tests), TypeScript, lint and diff checks passed.

<a id="task-64"></a>

### TASK-64 — Run deterministic browser checks serially in CI

Source: [TASK-64](../backlog/tasks/task-64%20-%20Run-deterministic-browser-checks-serially-in-CI.md) · Baseline status: Done.

**Recorded intent / important context**

GitHub Actions browser specs intermittently time out before the ranking editor renders because four concurrent Chrome workers compete with PNG-export rendering against one Vite test server.

**Preserve these acceptance criteria**

- [x] #1 CI browser checks use a bounded worker count that avoids startup timeouts.
- [x] #2 Local browser runs retain normal parallel execution.
- [x] #3 Relevant Playwright configuration test behavior is verified and documented.

**Recorded delivered behavior (historical)**

Configured Playwright to use one worker only in CI, while local UI runs retain Playwright's default parallelism. Documented that PNG-export rendering shares the Vite test server and can delay page startup under concurrent CI workers.

<a id="task-65"></a>

### TASK-65 — Update ranking-editor test fixtures for getMatchups

Source: [TASK-65](../backlog/tasks/task-65%20-%20Update-ranking-editor-test-fixtures-for-getMatchups.md) · Baseline status: Done.

**Recorded intent / important context**

`npm run typecheck` fails because the `LeagueApi` interface now requires `getMatchups`, but the mocks passed to `useRankingEditor` tests do not implement it.

**Preserve these acceptance criteria**

- [x] #1 `npm run typecheck` passes with complete LeagueApi fixtures.
- [x] #2 Ranking-editor test mocks provide deterministic getMatchups behavior.
- [x] #3 The fixture change does not weaken existing test assertions.

**Recorded delivered behavior (historical)**

Updated the ranking-editor test API fixture with a deterministic `getMatchups` implementation so it satisfies the current LeagueApi contract and restores TypeScript validation.

<a id="task-66"></a>

### TASK-66 — Make insights refresh-status test timezone independent

Source: [TASK-66](../backlog/tasks/task-66%20-%20Make-insights-refresh-status-test-timezone-independent.md) · Baseline status: Done.

**Recorded intent / important context**

The shared-insights refresh recovery test hardcodes a Central-time calendar date for a UTC timestamp. GitHub Actions runs in UTC, so the rendered date differs and the text assertion fails.

**Preserve these acceptance criteria**

- [x] #1 The refresh-status test derives its expected label using the production formatter.
- [x] #2 The focused router test passes under both the local timezone and UTC.
- [x] #3 The assertion continues to verify both the initial stale-report label and refreshed label.

**Recorded delivered behavior (historical)**

Replaced hardcoded Central-time refresh dates in the shared-insights recovery test with labels generated by the production formatter. This removes GitHub Actions UTC date drift while retaining checks for both stale and refreshed report labels.

<a id="task-67"></a>

### TASK-67 — Remove transient transform assertion from reduced-motion drag tests

Source: [TASK-67](../backlog/tasks/task-67%20-%20Remove-transient-transform-assertion-from-reduced-motion-drag-tests.md) · Baseline status: Done.

**Recorded intent / important context**

The reduced-motion keyboard drag tests require an intermediate sibling transform. With motion disabled, that transform is not a stable or user-visible contract and intermittently remains the identity matrix in GitHub Actions.

**Preserve these acceptance criteria**

- [x] #1 Reduced-motion keyboard drag tests verify keyboard movement through stable user-visible behavior.
- [x] #2 The tests no longer depend on an intermediate CSS transform.
- [x] #3 The focused reorder suite passes.

**Recorded delivered behavior (historical)**

Made reduced-motion keyboard drag tests assert the accessible drag-over announcement and wait for keyboard-sensor readiness, removing the flaky intermediate CSS-transform expectation.

<a id="task-68"></a>

### TASK-68 — Keep league-provider selection responsive in the creation form

Source: [TASK-68](../backlog/tasks/task-68%20-%20Target-the-ESPN-radio-control-in-league-creation-UI-test.md) · Baseline status: Done.

**Recorded intent / important context**

The browser test initially selected the wrapping label, but targeting the native radio revealed the actual defect: updating the TanStack Form field from the radio event leaves the controlled input unchecked in Chrome. Keep provider selection in local React state and pass it to league creation.

**Preserve these acceptance criteria**

- [x] #1 The native ESPN radio remains checked after a pointer or keyboard selection.
- [x] #2 League creation submits the selected provider value.
- [x] #3 The focused Chakra browser test passes.

**Recorded delivered behavior (historical)**

Restored reliable ESPN provider selection in the creation form and supplied router context to the isolated browser preview. The browser test now selects the provider card, verifies its selected state, and completes league submission.

<a id="task-69"></a>

### TASK-69 — Add a toggle to the playoff simulation screen that changes to histogram mode

Source: [TASK-69](../backlog/tasks/task-69%20-%20Add-a-toggle-to-the-playoff-simulation-screen-that-changes-to-histogram-mode.md) · Baseline status: Done.

**Recorded intent / important context**

- in histogram mode it should run the simulation for each week that has passed and create a line the represents each team's projections for playoffs at that week so it is possible to figure out how the user's season is going
- when in histogram mode add a toggle between championship percentage and playoff percentage
- make sure the results are cached between toggles so the toggle happens quickly
- Add animations to the points as they are put on the graph so the come up from the x axis

**Recorded delivered behavior (historical)**

Added a week-by-week playoff trend view with a line and animated points for every team. The view switches between playoff and championship chances and includes an exact-value table. Each completed regular-season week uses the existing 20,000-trial model at its own cutoff; cached results keep view and metric switches quick. Documented the historical interpretation and validated the desktop chart, mobile browser behavior, reduced motion, full unit suite, typecheck, lint, and formatting.

<a id="task-70"></a>

### TASK-70 — allow users to enter their own codex or claude api keys and encrypt and store them by user in the same way the espn cookies are stored

Source: [TASK-70](../backlog/tasks/task-70%20-%20allow-users-to-enter-their-own-codex-or-claude-api-keys-and-encrypt-and-store-them-by-user-in-the-same-way-the-espn-cookies-are-stored.md) · Baseline status: Done.

**Recorded delivered behavior (historical)**

Implemented encrypted per-user OpenAI/Codex and Anthropic/Claude API-key support. Added an owner-bound AES-256-GCM credential collection with opaque status-only APIs, Profile save/replace/remove controls, and isolated CLI environment injection (`OPENAI_API_KEY` or `ANTHROPIC_API_KEY`) for only the matching user's temporary writing request. Existing server-managed CLI login remains the fallback. Added runtime configuration, redaction, backup/deployment documentation, and coverage for encryption, ownership isolation, auth, UI behavior, provider selection, and child-process secret isolation.

Verification: focused Vitest suite; full `npm test` (60 files, 295 tests); `npm run typecheck`; `npm run lint`; `npm run format:check`; `npm run build`; and `git diff --check`.

<a id="task-71"></a>

### TASK-71 — remove quotes from params

Source: [TASK-71](../backlog/tasks/task-71%20-%20remove-quotes-from-params.md) · Baseline status: Done.

**Recorded intent / important context**

http://localhost:3001/history?leagueId="1312529175982129152"

this is an example of a shared league id, remove the quotes and jsut have it be leagueId=1312529175982129152

**Recorded delivered behavior (historical)**

Fixed shared report links to serialize numeric `leagueId` values without JSON quotes, including history and insights links. Existing links containing a matching quoted numeric ID are normalized at parsing/report boundaries for backward compatibility. Documented the canonical URL format in README and added regression coverage for copied links and quoted legacy history links.

Verification: `npm test` (59 files, 289 tests), `npm run typecheck`, `npm run lint`, `npm run format:check`, and `git diff --check` all pass.

Follow-up completed: tab navigation now also emits unquoted numeric `leagueId` values. The router’s serializer removes JSON quotes only from valid numeric league IDs, preserving default query serialization elsewhere.

Re-verified: `npm test` (59 files, 289 tests), `npm run typecheck`, `npm run lint`, `npm run format:check`, and `git diff --check` all pass.

<a id="task-72"></a>

### TASK-72 — Restore Auth0 profile editing

Source: [TASK-72](../backlog/tasks/task-72%20-%20Restore-Auth0-profile-editing.md) · Baseline status: Done.

**Verification caveat:** Source criteria are unchecked and no final summary is recorded. Do not infer live deployment verification.

**Recorded intent / important context**

Signed-in users currently receive a generic Auth0 profile-request failure when opening or saving their profile, so the profile feature cannot reliably read or update the current account in the deployed tenant. The failure must be diagnosed against the live tenant while preserving server-only credentials and owner isolation.

**Preserve these acceptance criteria**

- [ ] #1 The current signed-in user's profile can be loaded and saved through the deployed Auth0 tenant.
- [ ] #2 The Auth0 application has only the Management API access needed to read and update users.
- [ ] #3 Automated coverage reproduces the identified failure mode and prevents regression without exposing credentials or upstream response bodies.
- [ ] #4 Relevant configuration and verification guidance reflects the working deployment requirements.

**Delivery evidence:** No final summary is recorded; consult the source, implementation and tests before claiming verification.

<a id="task-73"></a>

### TASK-73 — Add historical season-level playoff calibration and convergence chart

Source: [TASK-73](../backlog/tasks/task-73%20-%20Add-historical-season-level-playoff-calibration-and-convergence-chart.md) · Baseline status: Done.

**Recorded intent / important context**

Early-season playoff probabilities can be overconfident, and the existing held-out matchup panel does not validate eventual qualification. Backtest prior seasons to reveal whether season-level forecasts improve as results arrive.

**Preserve these acceptance criteria**

- [x] #1 Previous completed seasons are replayed at weekly cutoffs without future scores or current projections entering predictions.
- [x] #2 Weekly Brier score, log loss, qualification accuracy and equal-chance baseline are displayed with a convergence graph and cutoff-specific reliability bins.
- [x] #3 Missing outcomes and incomplete seasons are disclosed; sample counts and tests prevent unsupported accuracy claims.

**Recorded delivered behavior (historical)**

Added an on-demand previous-season playoff backtest using the unchanged 20,000-trial model at each cutoff. Displays Brier convergence against season-specific qualification baselines, log loss, threshold accuracy, sample counts and selectable reliability bins. Discloses exclusions, dependence, final-week rules checks and absence of archived projections. Verified all 313 unit tests, production build, TypeScript/lint and desktop/mobile Playwright checks; calculations documentation updated.

<a id="task-74"></a>

### TASK-74 — Export playoff calibration data for model review

Source: [TASK-74](../backlog/tasks/task-74%20-%20Export-playoff-calibration-data-for-model-review.md) · Baseline status: Done.

**Recorded intent / important context**

Historical calibration needs a portable artifact that can be attached to a conversation to investigate overconfidence and compare alternative models using the same seasons and cutoffs.

**Preserve these acceptance criteria**

- [x] #1 A JSON download includes unrounded team-week predictions, outcomes, weekly metrics, run context and coverage notes.
- [x] #2 Successful seasons include minimal historical score, schedule and playoff-setting inputs sufficient to replay alternative models, without credentials or roster details.
- [x] #3 Export is unavailable until a backtest completes with evaluable outcomes; unit and browser checks verify the downloaded file.

**Recorded delivered behavior (historical)**

Added Export calibration JSON after successful backtests. Versioned artifact retains full-precision predictions/outcomes, complete weekly metrics/reliability, coverage and model context, and minimal historical replay inputs. Includes predictive-only metrics excluding known final outcomes. Verified actual downloads on desktop/mobile plus 10 focused tests and TypeScript/lint/format checks; documented how to attach the file for review.

<a id="task-75"></a>

### TASK-75 — Compare playoff forecasts with standings and separate predictive diagnostics

Source: [TASK-75](../backlog/tasks/task-75%20-%20Compare-playoff-forecasts-with-standings-and-separate-predictive-diagnostics.md) · Baseline status: Done.

**Recorded intent / important context**

League calibration shows the current model outperforms simple alternatives, but the equal-chance benchmark ignores banked wins and final-week perfect results inflate convergence. Improve evaluation without replacing the forecasting model with an unproven alternative.

**Preserve these acceptance criteria**

- [x] #1 A deterministic standings benchmark preserves cutoff records, points and remaining schedule while assigning equal future scoring strength.
- [x] #2 Predictive convergence and per-season comparisons exclude final known-outcome cutoffs; final seeding agreement remains separately visible.
- [x] #3 JSON exports include standings probabilities, comparative metrics and a versioned description; tests prove leakage safety, baseline behavior and readable desktop/mobile displays.

**Recorded delivered behavior (historical)**

Improved playoff evaluation with a standings-based benchmark, predictive-only convergence, per-season Brier skill comparisons and a separate final-week rules check. Extended JSON exports to schema v2 and regenerated the supplied league artifact. All 700 original forecasts matched exactly; all 320 unit tests, build, TypeScript/lint and desktop/mobile browser checks passed. Historical forecast coefficients remain supported by the comparison rather than replaced with unproven alternatives.

<a id="task-76"></a>

### TASK-76 — Fix ESPN historical playoff qualification loading

Source: [TASK-76](../backlog/tasks/task-76%20-%20Fix-ESPN-historical-playoff-qualification-loading.md) · Baseline status: Done.

**Recorded intent / important context**

ESPN mMatchup omits playoffTierType, causing historical calibration seasons to be excluded. Load authoritative bracket labels without depending on manager continuity.

**Preserve these acceptance criteria**

- [x] #1 ESPN historical loading retrieves championship bracket labels
- [x] #2 Regression coverage verifies prior-season qualifiers independently of manager identity

**Recorded delivered behavior (historical)**

Added mMatchupScore to ESPN metadata requests so historical championship bracket labels are available. Verified ESPN 1140768 in 2023: mMatchup had no tier labels; mMatchupScore identifies qualifiers 1, 5, 7, 8. Regression test preserves all historical team IDs and former manager data. All 67 test files / 321 tests, typecheck, lint, and touched-file formatting pass. Updated calculation documentation.

<a id="task-77"></a>

### TASK-77 — Apply season-specific playoff qualification and bracket rules

Source: [TASK-77](../backlog/tasks/task-77%20-%20Apply-season-specific-playoff-qualification-and-bracket-rules.md) · Baseline status: Done.

**Recorded intent / important context**

Forecasts and calibration must use each requested season’s provider playoff format, divisions, seeding tiebreakers, round lengths and reseeding instead of league-wide wins/points assumptions.

**Preserve these acceptance criteria**

- [x] #1 Rules and team divisions are retrieved independently for every historical season and exported for replay
- [x] #2 Forecasts apply division qualification and provider tiebreakers, including head-to-head multi-team restart and unequal-meeting fallback
- [x] #3 Bracket simulations honor supported round lengths and reseeding; unknown formats produce an explicit unavailable reason
- [x] #4 ESPN league 1140768 historical final-cutoff qualifiers match actual entrants with regression coverage

**Recorded delivered behavior (historical)**

Normalized playoff rules from each requested ESPN/Sleeper season, including historical divisions, ordered tiebreakers, scoring weeks and reseeding. Implemented division-winner qualification, one-seed-at-a-time head-to-head with unequal-meeting fallback, division records, points against, multiweek rounds and reseeding. Unsupported rules are explicit; legacy snapshots are labeled. Schema-3 exports include season rules. Verified live provider metadata and replayed both submitted leagues: all 40 ESPN and 50 Sleeper final-cutoff qualifications agree with actual entrants. ESPN predictive Brier improves from 0.1696 to 0.1641 but still trails standings 0.1520; score-distribution coefficients remain unchanged. Updated exports saved in Downloads with season-rules suffix. All 69 files / 333 tests, build/typecheck, lint, formatting, diff checks and 2 desktop/mobile Playwright export tests pass.

<a id="task-78"></a>

### TASK-78 — Evaluate playoff forecast uncertainty across both leagues

Source: [TASK-78](../backlog/tasks/task-78%20-%20Evaluate-playoff-forecast-uncertainty-across-both-leagues.md) · Baseline status: Done.

**Recorded intent / important context**

Evaluate early strength shrinkage, joint predictive uncertainty and persistent roster/performance changes using both corrected league calibrations. Prioritize sound probabilistic assumptions, chronological/league validation and dependence-aware evidence; implement only supported shared improvements.

**Preserve these acceptance criteria**

- [x] #1 Candidate models use only cutoff data and the same season-specific playoff rules in both leagues
- [x] #2 Evaluation compares Brier, log loss, early reliability and season-level results against current and standings baselines with explicit small-sample limits
- [x] #3 Any adopted forecast represents mean and variance uncertainty coherently and does not invent injury probabilities from score-only data
- [x] #4 Changes, assumptions, validation and replayable exports are documented and tested

**Recorded delivered behavior (historical)**

Implemented coherent joint score uncertainty and updated diagnostics/UI/export assumptions after reviewing both leagues. Added local reproducible comparison and regenerated both calibration artifacts under Downloads/playoff-uncertainty-review. Improvement is supported by multiweek interval coverage and scores; playoff accuracy tradeoffs, unchanged prior assumptions and unestimated future injury risks are explicit. No deployment or commit performed.

<a id="task-79"></a>

### TASK-79 — Compare My Fantasy Analyzer outlook with our Sleeper forecast

Source: [TASK-79](../backlog/tasks/task-79%20-%20Compare-My-Fantasy-Analyzer-outlook-with-our-Sleeper-forecast.md) · Baseline status: Done.

**Recorded intent / important context**

Inspect the publicly loaded outlook scripts and exact simulation inputs for league 1312529175982129152. Explain the rank/playoff-probability difference, isolate future scoring assumptions from injury effects, and identify statistically defensible improvements without treating competitor output as ground truth.

**Preserve these acceptance criteria**

- [x] #1 Identify loaded scoring, variance, injury and playoff algorithms with source references
- [x] #2 Compare cutoff standings and team scoring inputs and quantify the injury sensitivity
- [x] #3 Document evidence, methodological limits and concrete validation requirements

**Recorded delivered behavior (historical)**

Documented evidence, recovered simulation methods, quantified scoring and injury differences, source links, statistical limitations and validation requirements in docs/mfa-outlook-comparison.md. Competitor probabilities are comparison evidence rather than calibration targets.

<a id="task-80"></a>

### TASK-80 — Use best legal projected lineups throughout remaining season simulations

Source: [TASK-80](../backlog/tasks/task-80%20-%20Use-best-legal-projected-lineups-throughout-remaining-season-simulations.md) · Baseline status: Done.

**Recorded intent / important context**

Build each remaining regular-season and playoff week from the current roster and that week’s provider player projections, respecting legal slots and weekly availability. Apply the corresponding team mean in matchup simulations, retain uncertainty, expose missing projection coverage, and preserve retrospective calibration integrity. Compare current validation-league outputs before and after without claiming unsupported historical accuracy gains.

**Preserve these acceptance criteria**

- [x] #1 Sleeper and ESPN load and optimize remaining weekly projections using current roster ownership
- [x] #2 Regular-season and configured playoff matchup simulations use the corresponding week’s complete legal lineup; missing data falls back explicitly
- [x] #3 Current snapshots never leak into retrospective cutoffs or historical calibration, and coverage/assumptions are visible
- [x] #4 Meaningful provider, lineup, simulation and regression checks pass, with current-league before/after evidence and documented accuracy limitations

**Recorded delivered behavior (historical)**

Remaining-week provider means now come from independently optimized legal lineups and feed matchup/round simulations. Coverage and frozen-roster assumptions are visible, historical calibration remains free of current information, and saved reports retain weekly inputs. Comparison JSON saved under Downloads/weekly-lineup-review; behavior and accuracy limitations documented in docs/weekly-lineup-review.md and docs/calculations.md.

<a id="task-81"></a>

### TASK-81 — Archive one as-of playoff forecast per league week

Source: [TASK-81](../backlog/tasks/task-81%20-%20Archive-one-as-of-playoff-forecast-per-league-week.md) · Baseline status: Done.

**Recorded intent / important context**

Store durable current-season playoff forecasts and their frozen inputs so weekly and final outcomes can validate provider-informed simulations without repeated database copies.

**Preserve these acceptance criteria**

- [x] #1 A unique league-season-cutoff key prevents duplicate archives from repeated or concurrent report loads.
- [x] #2 Archive contains weekly provider means and lineups, roster and availability context, season rules, completed scores, schedule, and forecast probabilities.
- [x] #3 Only eligible current-season forecasts are archived, and existing weeks are never overwritten.
- [x] #4 Focused tests verify eligibility, idempotency, and stored payload shape.

**Recorded delivered behavior (historical)**

Implemented durable once-per-completed-week playoff forecast archives, preserving prospective validation inputs and probabilities without duplicate records. Verified by archive/index tests and full build/check suite.

<a id="task-83"></a>

### TASK-83 — Prevent autosave revision history from exhausting the ranking document size

Source: [TASK-83](../backlog/tasks/task-83%20-%20Prevent-autosave-revision-history-from-exhausting-the-ranking-document-size.md) · Baseline status: Done.

**Recorded intent / important context**

RankingsService.updateRanking pushes a complete previous edition into the ranking document on every save, with no bound or separate storage. getByLeagueId and getRankingById also load embedded history even when the RPC strips it from the response. The README acknowledges this limit, but saves eventually become impossible for that edition. A scratch test using the actual service update shape and BSON sizing produced a 17,167,363-byte document after 120 revisions of a valid 14-team edition with 10,000-character commentary per team. This exceeds MongoDB's 16 MiB document limit. The reproduction used mocked persistence and BSON sizing, not a live oversized database write. Preserve the existing promise that restoring a revision does not erase history.

**Preserve these acceptance criteria**

- [x] #1 Repeated saves of valid large editions remain possible beyond the reproduced 120-save case without exceeding MongoDB document limits.
- [x] #2 Existing revision history remains readable and restorable through a documented rollout or migration; restoring still creates a new revision.
- [x] #3 Routine ranking list/load requests avoid materializing all historical snapshots, and revision browsing remains usable as history grows.
- [x] #4 Regression coverage verifies repeated saves, restoration, and stale-writer rejection with the revised persistence behavior.

**Recorded delivered behavior (historical)**

Moved durable immutable snapshots to indexed rankingrevisions, preserving revision CAS and standalone MongoDB. Legacy embedded history migrates idempotently before removal; routine reads exclude it. History pages ten older snapshots, with direct restoration of any revision; deletion cleans revision records. Verified 130 large saves, actual standalone MongoDB dump/restore, old-revision restoration and stale-writer conflicts; 370 tests, typecheck and lint passed. README and recovery rollout/rollback docs updated.

<a id="task-84"></a>

### TASK-84 — Make permanent league deletion safe against concurrent ranking and publication writes

Source: [TASK-84](../backlog/tasks/task-84%20-%20Make-permanent-league-deletion-safe-against-concurrent-ranking-and-publication-writes.md) · Baseline status: Done.

**Recorded intent / important context**

LeaguesService.deleteLeague snapshots ranking IDs, deletes publications only for those IDs, deletes rankings and report snapshots in parallel, and finally deletes the league. A create/publish request that already passed ownership checks can interleave after the ID snapshot and leave an orphan publication. publishing.read checks only the publication record and will still serve it even if its ranking and workspace no longer exist. Scratch mocked-interleaving checks reproduced a successful deletion leaving a late publication, and separately confirmed that public reads accept orphan publication records. Failures between the independent deletes can also leave a partially removed workspace. No live records were deleted during review.

**Preserve these acceptance criteria**

- [x] #1 Once permanent deletion succeeds, the workspace's rankings, revision data, report snapshots, and published links are unavailable, including when authorized writes were already in flight.
- [x] #2 A public edition whose source workspace has been deleted returns an unavailable response even if an orphan publication remains.
- [x] #3 Failure partway through deletion can be retried safely with a documented, consistent outcome; unrelated owner workspaces and upstream provider leagues remain intact.
- [x] #4 Deterministic tests cover create/publish interleavings, interrupted cleanup, retry, and cross-owner isolation.

**Recorded delivered behavior (historical)**

Deletion marks owner workspaces unavailable before cleanup and retains ranking cleanup IDs until successful completion. Failed deletions are shown in Manage leagues and can be retried. In-flight ranking create/update, publication and snapshot writes recheck workspace access and compensate late writes; public editions require an existing ranking and undeleted workspace. Verified deterministic create/publish races, interrupted cleanup and retry, orphan reads, late snapshots and owner isolation; full-suite run isolated one updated predicate assertion which now passes, 19 affected tests pass, standalone backup rehearsal, lint and typecheck pass. README updated.

<a id="task-85"></a>

### TASK-85 — Invalidate provider-dependent cached data when a league ID changes

Source: [TASK-85](../backlog/tasks/task-85%20-%20Invalidate-provider-dependent-cached-data-when-a-league-ID-changes.md) · Baseline status: Done.

**Recorded intent / important context**

createApi.management.updateProviderId only refetches the league collection. The season-discovery and insights query keys retain the same workspace leagueId, so a previously loaded report or season list is reused after the workspace points to a different provider league. Historical insights have infinite staleTime. A scratch test loaded 2025 insights and seasons, changed the provider ID, changed the mocked upstream response, and confirmed both reads still returned the old provider's data without calling their server functions again. Pending requests can also repopulate an old-provider entry after the association changes.

**Preserve these acceptance criteria**

- [x] #1 After a provider ID update, the next season and insights reads use the new association, including historical reports with infinite staleTime.
- [x] #2 Requests started before the association change cannot repopulate the workspace cache with old-provider results.
- [x] #3 Invalidation is scoped to the affected workspace and preserves unrelated leagues' cached reports and saved editions.
- [x] #4 Client regression coverage primes caches, changes provider ID, and verifies fresh current/historical data and delayed-request behavior.

**Recorded delivered behavior (historical)**

Provider-ID updates now increment a workspace-specific generation for season/insights query keys, cancel and remove old-generation requests, and retain unrelated reports and ranking collections. Verified primed current/historical caches, scoped preservation, and delayed old-provider completion in seven client tests; typecheck/lint passed. README updated.

<a id="task-86"></a>

### TASK-86 — Prevent delayed publication requests from replacing newer publication decisions

Source: [TASK-86](../backlog/tasks/task-86%20-%20Prevent-delayed-publication-requests-from-replacing-newer-publication-decisions.md) · Baseline status: Done.

**Recorded intent / important context**

publishing.publish verifies the requested draft revision before writing, but its publication upsert filters only by rankingId. Two requests can both pass their respective revision checks; if revision 0 pauses before the upsert, revision 1 publishes, and revision 0 resumes, the public snapshot rolls back to revision 0. A scratch controlled-interleaving test reproduced this with the actual publishing function. Similar ordering permits a publish that was already checked to recreate a link after a later unpublish. Existing stale-draft tests check only the initial revision mismatch, not overlapping publication mutations.

**Preserve these acceptance criteria**

- [x] #1 An older delayed publish cannot overwrite a newer successful publication of the same edition; the client receives a useful conflict outcome.
- [x] #2 A publish request already in flight cannot silently undo a later successful unpublish.
- [x] #3 Public readers see one complete approved snapshot, and intentional later republishing still works.
- [x] #4 Deterministic concurrency tests cover out-of-order publishes and publish/unpublish interleavings; existing owner and snapshot-isolation checks still pass.

**Recorded delivered behavior (historical)**

Captured publication generation before draft reads and added atomic decision predicates. Delayed publishes conflict after another decision, revoked tombstones prevent link recreation, and intentional republish uses a fresh link. Complete snapshots remain isolated from draft changes. Verified deterministic out-of-order publish and revoke races, ownership/deletion tests, actual standalone MongoDB publish/read/revoke/republish in recovery rehearsal, typecheck and lint. README updated.

<a id="task-87"></a>

### TASK-87 — Disambiguate league management when external IDs match across providers

Source: [TASK-87](../backlog/tasks/task-87%20-%20Disambiguate-league-management-when-external-IDs-match-across-providers.md) · Baseline status: Done.

**Recorded intent / important context**

TASK-25 allows one owner to register Sleeper and ESPN workspaces with the same numeric external ID. However ownerLeagueFilter resolves an unqualified ID with an owner-scoped OR on leagueId/providerLeagueId and no provider discriminator or ambiguity check. rename/archive/delete/provider-ID update can therefore select whichever matching workspace MongoDB encounters first. A scratch rename test with two provider workspaces sharing external ID 99 confirmed that reversing the match order changed which workspace was renamed. ManageLeagues also keys rows by providerLeagueId, yielding duplicate React keys for this supported case. This is a follow-up to completed TASK-25 and TASK-59, not a request to remove cross-provider support.

**Preserve these acceptance criteria**

- [x] #1 Workspace-ID management resolves the exact workspace, and ambiguous external-ID management cannot modify or delete an arbitrary match.
- [x] #2 Owners can explicitly resolve an external-ID collision using the provider or workspace identity; ownership checks remain enforced.
- [x] #3 Manage leagues renders and edits same-external-ID workspaces independently without duplicate React keys.
- [x] #4 Tests cover rename, archive, provider-ID change, and delete with same-owner cross-provider collisions and preserve legacy unambiguous identifier behavior.

**Recorded delivered behavior (historical)**

Management now resolves exact owner workspace IDs first and rejects ambiguous external aliases before mutation. Rename/archive/provider updates/delete share the resolver, including pending deletion retries. Manage leagues keys rows by workspace ID. Verified same-owner Sleeper/ESPN alias collisions across all four mutations, exact identity precedence, legacy unambiguous aliases, owner isolation and independent DOM editing without duplicate keys; 20 affected tests, lint/typecheck passed. README updated.

<a id="task-88"></a>

### TASK-88 — Use a finite power-ranking baseline for teams without completed matchups

Source: [TASK-88](../backlog/tasks/task-88%20-%20Use-a-finite-power-ranking-baseline-for-teams-without-completed-matchups.md) · Baseline status: Done.

**Recorded intent / important context**

powerOrderTeams computes average([]) for a team with no usable matchup history. Although its shrinkage weight is zero, zero times NaN remains NaN. Comparisons involving that team fall through to the alphabetical tie-break instead of the intended league-average baseline. A scratch test with teams ordered weak/missing/strong and one completed matchup (weak 50, strong 150) returned missing/strong/weak, placing the unmeasured team above the strongest scorer by name. This can affect partial provider histories and bye weeks; existing tests cover no data for all teams but not a mix of measured and unmeasured teams.

**Preserve these acceptance criteria**

- [x] #1 A team without completed matchups receives a finite neutral league baseline when other teams have data.
- [x] #2 In the reproduced weak/missing/strong case the measured strong team ranks above the unmeasured team, which ranks above the weak team; names do not override unequal power scores.
- [x] #3 Zero scores, byes, and partial histories are handled deterministically; when nobody has usable data the existing provider-order fallback remains.
- [x] #4 Focused utility tests cover mixed sample counts and saved-edition behavior remains unchanged.

**Recorded delivered behavior (historical)**

Teams without matchup samples now receive a finite neutral league baseline before any empty average is calculated. Verified strong/missing/weak order regardless of names, zero scores, byes, incomplete games and no-data provider fallback in utility tests; existing editor tests preserve saved edition behavior. Lint/typecheck passed; README updated.

<a id="task-89"></a>

### TASK-89 — Save the user's managed team for each league and season

Source: [TASK-89](../backlog/tasks/task-89%20-%20Save-the-users-managed-team-for-each-league-and-season.md) · Baseline status: Done.

**Recorded intent / important context**

The workspace links leagues to an Auth0 owner, but it does not identify which fantasy team that owner manages. Personalized lineup, waiver, roster-risk, and multi-league views need this association. Provider team IDs and manager ownership can change across seasons, and the Auth0 subject is not the provider manager identity. Establish a private, explicit team selection before treating a roster as 'my team'; retain league-wide reports for commissioners and users who do not select a team.

**Preserve these acceptance criteria**

- [x] #1 An owner can select, change, or clear their managed team for a registered league and season, and the choice survives browser/device changes.
- [x] #2 Only teams from that owned league and selected season can be associated; other accounts cannot read or alter the association.
- [x] #3 Season rollover, unavailable teams, and provider-ID changes trigger validation or reselection rather than silently mapping to another roster.
- [x] #4 The UI supports an unselected/commissioner mode and tests cover two owners, two leagues, and differing season team identities.

**Recorded delivered behavior (historical)**

Added account-private managed-team selection per workspace and season, validated against provider teams and manager identity, with commissioner mode and provider-change invalidation. Verified save/clear/season selection and retry in DOM tests; ownership, league isolation, missing teams, manager changes, and concurrent provider changes in server tests. Full suite: 355 tests passed; typecheck and lint passed. README documents setup.

<a id="task-90"></a>

### TASK-90 — Add a weekly overview of the user's teams across all leagues

Source: [TASK-90](../backlog/tasks/task-90%20-%20Add-a-weekly-overview-of-the-users-teams-across-all-leagues.md) · Baseline status: Done.

**Recorded intent / important context**

The current navigation separates the ranking studio, live matchups, season insights, playoff simulation, and league history. A manager following several leagues must repeatedly change context to answer 'what needs my attention this week?' Add a personalized overview that connects existing analytics to the selected team in each league, with deep links to the relevant workflow. Use provider-specific scoring calendars rather than assuming every league has the same active week.

**Preserve these acceptance criteria**

- [x] #1 The overview shows each active selected team, its league/week, next or current matchup, and available current standing/playoff context, with links preserving league and season selection.
- [x] #2 Missing/stale inputs and independent league failures are visible without hiding other usable teams; unavailable metrics are not presented as zero.
- [x] #3 Refresh is bounded and reuses the existing cache where appropriate; archived leagues are excluded unless explicitly requested.
- [x] #4 Users with no leagues or no selected team see useful setup actions; mobile, account-isolation, and mixed-provider/season behavior have coverage.

**Recorded delivered behavior (historical)**

Added My weekly overview route and navigation, composing account-owned active leagues with selected teams, provider scoring weeks, matchup scores, records and existing playoff estimates. Missing and partial data are explicit; workflow links retain league/season/week. Refresh is on demand, reads three league contexts concurrently, and reuses insights cache. Verified six focused tests, all 361 unit/DOM tests, phone layout and links in Chrome Playwright, typecheck and lint; production assets built successfully. README updated.

<a id="task-91"></a>

### TASK-91 — Expose a weekly lineup advisor with suggested starter and bench swaps

Source: [TASK-91](../backlog/tasks/task-91%20-%20Expose-a-weekly-lineup-advisor-with-suggested-starter-and-bench-swaps.md) · Baseline status: Done.

**Recorded intent / important context**

TASK-80 already optimizes legal weekly lineups inside playoff forecasts, and Live Matchups displays current starters/bench. Managers still lack a direct action-oriented comparison between their submitted lineup and the suggested legal lineup. Expose current-week recommendations with projected improvement, alternatives, and clear reasons for excluded or uncertain players. This extends the existing optimization into a manager workflow rather than recreating the simulation feature.

**Preserve these acceptance criteria**

- [x] #1 For the selected team/week, the advisor compares the submitted lineup with a legal proposed lineup and shows named starter/bench swaps and projected point differences when coverage is sufficient.
- [x] #2 Suggestions respect league slots, FLEX/Superflex eligibility, roster ownership, bye/availability status, and known game/lineup locks; unknown lock state is disclosed instead of claimed safe.
- [x] #3 Incomplete projections, uncertain injuries, and stale roster inputs are explained; users can inspect alternative legal scenarios without changing the provider lineup.
- [x] #4 Focused tests cover overlapping slots, locked players, byes, missing projections, and unchanged provider data; recommendations do not require AI generation.

**Recorded delivered behavior (historical)**

Added read-only current-week lineup advisor to selected team overview cards. Reuses legal optimizer with assigned slots and fixed locked starters, excludes locked bench/reserve/bye/unavailable players, supports provider multiple-slot eligibility and user exclusion scenarios. Shows named starts/benches, projected comparison, timestamps and coverage/uncertainty/unknown-lock warnings; unsupported ESPN multiweek/configuration remains unavailable. Verified overlapping FLEX/Superflex, lock constraints, byes/reserves, missing projections, unchanged input and DOM scenarios; 21 focused tests, full suite and production build passed; typecheck/lint passed. README updated.

<a id="task-92"></a>

### TASK-92 — Recommend league-available waiver pickups and corresponding roster drops

Source: [TASK-92](../backlog/tasks/task-92%20-%20Recommend-league-available-waiver-pickups-and-corresponding-roster-drops.md) · Baseline status: Done.

**Recorded intent / important context**

Season insights grade past pickups, while forecast ownership stays frozen and excludes hypothetical acquisitions. A one-stop analytics workspace should help a manager choose the next pickup: the relevant candidates are players actually available in that league, evaluated against the manager's roster and scoring. Begin with available add/drop comparisons and short-horizon streaming; do not assume a league-wide ownership percentage proves a player is available, or invent auction prices without budget data.

**Preserve these acceptance criteria**

- [x] #1 The user can view available players by position for their league, with verified roster/availability coverage and a freshness timestamp; unsupported provider data is explicitly unavailable.
- [x] #2 A candidate can be paired with a legal roster drop, with projected current/near-term lineup impact using that league's scoring and known bye schedule.
- [x] #3 Bench, reserve/taxi, roster limits, and provider waiver/free-agent restrictions are respected or clearly disclosed when unsupported; owned players are not mislabeled as free agents.
- [x] #4 Recommendation assumptions and projection gaps are visible, provider failure/ownership edge cases are tested, and the tool does not submit transactions.

**Recorded delivered behavior (historical)**

Added owner-only on-demand Sleeper waiver pool with complete unique roster coverage including reserve/taxi ownership, league-scored projections, freshness and position filtering. Candidate selection suggests an improving same-position active-roster drop when legal lineup coverage permits; users can compare other drops. Known locks/byes/injuries constrain scenarios. ESPN availability is explicitly unsupported, and claim/FAAB/undroppable restrictions are disclosed. No provider transactions occur. Verified ownership edge cases, roster changes, scoring, locks, byes, missing data and DOM load/retry/comparison; 391 tests, typecheck/lint passed. README updated.

<a id="task-93"></a>

### TASK-93 — Evaluate proposed trades using roster and weekly lineup impact for both teams

Source: [TASK-93](../backlog/tasks/task-93%20-%20Evaluate-proposed-trades-using-roster-and-weekly-lineup-impact-for-both-teams.md) · Baseline status: Done.

**Recorded intent / important context**

The existing trade summaries measure outcomes after transactions. Managers also need prospective comparisons that account for team needs and replacement starters, especially when a two-for-one offer changes roster size. Add explicit before/after roster scenarios grounded in the selected league's current ownership and projections. A blanket player-value score or a historical trade grade alone does not answer whether an offer improves either team's useful lineup.

**Preserve these acceptance criteria**

- [x] #1 Users can select two league teams and a proposed player exchange, seeing both rosters' before/after legal lineup expectations and positional coverage over selected available weeks.
- [x] #2 Roster-size imbalances require explicit drop/open-slot assumptions; duplicate players, non-owned assets, and unsupported draft-pick values are rejected or clearly excluded.
- [x] #3 Optional matchup/playoff scenario changes use the same available input snapshot and disclose uncertainty and projection gaps; no unsupported fair-value certainty is claimed.
- [x] #4 The proposal is read-only and leaves provider rosters, persisted rankings, and existing forecast observations unchanged; tests cover balanced/unbalanced trades and missing data.

**Recorded delivered behavior (historical)**

Added owner-only Trade analyzer route using one live provider-scored snapshot and explicit available current-week selection. Two team exchanges show before/after legal lineup expectations and active positional counts. Imbalances require explicit drops/open slots; duplicate/non-owned/reserve/known-locked assets are rejected. Unsupported picks, future projection weeks, provider roster caps and playoff changes are disclosed; no data is written. Five focused pure/DOM tests verify balanced/unbalanced proposals, gaps and unchanged inputs; production build, lint/typecheck passed. README updated.

<a id="task-94"></a>

### TASK-94 — Add searchable player profiles and comparisons scored for the selected league

Source: [TASK-94](../backlog/tasks/task-94%20-%20Add-searchable-player-profiles-and-comparisons-scored-for-the-selected-league.md) · Baseline status: Done.

**Recorded intent / important context**

Current pages focus on team/manager summaries and matchup rosters. A manager researching a starter, trade target, or free agent needs one place to inspect player scoring history, upcoming projections, ownership, and availability using the league's actual scoring. Provider identities and unsupported usage data must remain explicit; current roster-derived history does not establish complete career or free-agent coverage.

**Preserve these acceptance criteria**

- [x] #1 Users can search players and inspect provider/season identity, league-scored observed totals, recent trends, available weekly projections, and current ownership/status with source timestamps.
- [x] #2 Two or more players can be compared over a chosen common date/week range using consistent league scoring and visible sample coverage.
- [x] #3 Missing weeks and unsupported metrics such as targets/snap share are labeled unavailable; neither partial roster history nor name matching is treated as a complete cross-provider player history.
- [x] #4 Profiles are reachable from lineup/matchup and transaction views, remain useful without AI, and have coverage for scoring variants, identity collisions, and partial provider responses.

**Recorded delivered behavior (historical)**

Added searchable Players route and common-week-range comparisons using provider/season identities, league-scored roster observations, live projections/status/ownership and optional verified unowned pool. Profiles show source timestamps and partial sample coverage; missing or contradictory weeks and unsupported usage metrics remain unavailable. Added profile links in live matchup rosters, lineup assignments, waiver candidates and trade rosters. Verified scoring variants, name/ID collisions, partial responses and DOM comparison; full 412-test suite, production build, lint/typecheck and three Chrome desktop/mobile layout checks passed. README updated.

<a id="task-95"></a>

### TASK-95 — 'Show actionable injury, bye-week, and lineup-risk alerts for managed teams'

Source: [TASK-95](../backlog/tasks/task-95%20-%20Show-actionable-injury-bye-week-and-lineup-risk-alerts-for-managed-teams.md) · Baseline status: Done.

**Recorded intent / important context**

Injury/bye information currently influences forecasts but does not create a manager-facing list of actions. A one-stop workspace should surface a confirmed unavailable starter, an uncovered upcoming roster slot, or a material roster/projection refresh without requiring the manager to inspect every report. Scope the first version to in-app alerts; email, push delivery, and provider roster writes are separate future work.

**Preserve these acceptance criteria**

- [x] #1 The user sees team-specific in-app alerts for confirmed unavailable starters and upcoming bye/lineup gaps, with severity, affected player/week, timestamp, and a relevant workflow link.
- [x] #2 Uncertain or missing status data is distinguished from a confirmed injury; stale inputs cannot trigger a confidently current alert.
- [x] #3 Repeated refreshes do not create duplicate alerts, resolved conditions stop appearing as active, and dismissal preferences are scoped to the account/team/condition.
- [x] #4 Tests cover condition transitions, lineup/roster changes, partial provider failures, and privacy; the first version sends no external messages.

**Recorded delivered behavior (historical)**

Added team-specific overview risk alerts with severity, player/week, source timestamp and profile/lineup links. Fresh confirmed unavailable/bye starters and empty slots differ from uncertain or missing status/projections/locks; stale inputs downgrade to refresh warnings, including while the page remains open. Stable condition IDs deduplicate refreshes, resolved conditions disappear, and bounded browser dismissals are isolated by account/team/week/condition with restore controls. Verified transitions, roster changes, partial/stale data, elapsed-time downgrade and dismissal privacy in eight affected tests; lint/typecheck passed. No external delivery. README updated.

<a id="task-96"></a>

### TASK-96 — Evaluate additional NFL analytics and projection providers

Source: [TASK-96](../backlog/tasks/task-96%20-%20Evaluate-the-next-sport-and-provider-for-the-analytics-workspace.md) · Baseline status: Done.

**Recorded intent / important context**

Keep NFL as the only sport. Investigate additional data providers for better analytics and projections, with an evidence-backed recommendation and bounded first delivery.

**Preserve these acceptance criteria**

- [x] #1 Compare NFL enrichment sources, access, authentication, costs, terms and coverage; mark unverified access.
- [x] #2 Separate league ownership providers from enrichment and explain custom scoring, identity, calendar and provenance requirements.
- [x] #3 Recommend one bounded read-only slice with representative fixture evidence and explicit unsupported metrics.
- [x] #4 Propose focused follow-up briefs with dependencies, estimates and risks while preserving NFL records and share links.

**Recorded delivered behavior (historical)**

Documented NFL-only provider comparison using primary sources, a gated FantasyPros weekly comparison recommendation, synthetic scoring/identity evidence, and four delivery briefs with estimates and risks. No external feed was activated. Full unit suite passed (418 tests).

<a id="task-97"></a>

### TASK-97 — Explain the server-managed Codex OAuth path in writing-assistant settings

Source: [TASK-97](../backlog/tasks/task-97%20-%20Explain-the-server-managed-Codex-OAuth-path-in-writing-assistant-settings.md) · Baseline status: Done.

**Recorded intent / important context**

The profile prominently offers OpenAI/Anthropic API-key forms, while Codex ChatGPT OAuth is already supported through the administrator's CLI login and WRITING_AI_* allowlist. The user wants to use their Codex account rather than create a key, and currently needs deployment knowledge to understand that option. The README now documents Docker device-code login; expose a clear connection choice/readiness explanation in the product while keeping container login an operator action.

**Preserve these acceptance criteria**

- [x] #1 Writing-assistant settings explain both optional per-user API keys and the existing server-managed Codex account path without implying an API key is required.
- [x] #2 An allowlisted user can see server-provider readiness and a useful distinction between disabled, missing CLI, and login-check failure, with a link to the Docker OAuth setup instructions.
- [x] #3 The UI explains that server-managed use shares the administrator's account/quota and that a saved per-user key takes precedence; it offers the existing remove-key action when appropriate.
- [x] #4 No OAuth tokens, credential files, or other users' identifiers are exposed to browser/shared reports, and tests cover OAuth-ready, disabled, and saved-key states.

**Recorded delivered behavior (historical)**

Added the optional ChatGPT account path to profile settings with safe allowlist-scoped server readiness, Docker OAuth instructions, shared quota and saved-key precedence/removal guidance. Readiness refreshes after key changes; browser output contains only status enums and no secrets. Provider/UI regression tests pass (18 targeted tests), typecheck and lint pass.

<a id="task-98"></a>

### TASK-98 — Default current-season week selections to the current NFL week

Source: [TASK-98](../backlog/tasks/task-98%20-%20Default-current-season-week-selections-to-the-current-NFL-week.md) · Baseline status: Done.

**Recorded intent / important context**

The rankings studio currently initializes week selection to week 1 and resets it to week 1 when switching leagues or seasons. As a weekly fantasy analytics hub, the app should open the current NFL scoring week for the active season unless the user explicitly chooses a different week. Reuse authoritative NFL/provider season and week information and respect the selected league's available weeks. Define selection precedence so a stale remembered week does not indefinitely suppress the current-week default, while intentional URL/manual selections and historical-season browsing remain predictable.

**Preserve these acceptance criteria**

- [x] #1 For the current NFL season, initial selection and league/current-season switches default to the current scoring week when no explicit week selection applies, including when the current week is greater than 1.
- [x] #2 Explicit URL and manual week selections take precedence and remain stable during data refreshes; returning in a later NFL week with stale stored selection follows a documented policy that allows the default to advance.
- [x] #3 Defaults use authoritative season/week state and resolve to a week supported by the selected league. Preseason, offseason, season rollover, unavailable provider state, and historical seasons have documented deterministic fallbacks and never select an unsupported postseason week.
- [x] #4 Regression coverage verifies current-week defaults, league and season switches, explicit selections, stale remembered state, historical seasons, valid-week boundaries, and provider-state failure.

**Recorded delivered behavior (historical)**

Added authoritative NFL state with 30-second request reuse and provider scoring-week defaults bounded to supported league weeks. Studio defaults advance current-season remembered weeks while explicit URL/manual weeks win; league/season switches no longer force week 1. Historical, preseason, postseason/offseason and unavailable-state fallbacks are documented. Verified 43 focused state/selection/router tests, provider tests, typecheck and lint; full suite passed.

<a id="task-99"></a>

### TASK-99 — Combine ESPN and Sleeper player projections for either league provider

Source: [TASK-99](../backlog/tasks/task-99%20-%20Combine-ESPN-and-Sleeper-player-projections-for-either-league-provider.md) · Baseline status: Done.

**Recorded intent / important context**

Player recommendations currently use only the league provider projection. Use ESPN and Sleeper player-level data for either league type, matching the same NFL player explicitly and applying the selected league scoring rules, so recommendations include both forecasts and their disagreement.

**Preserve these acceptance criteria**

- [x] #1 Sleeper and ESPN league rosters can receive current-week projections from both sources without requiring a league on the other provider.
- [x] #2 Players are joined using explicit cross-provider IDs; ambiguous or absent mappings do not produce false matches.
- [x] #3 Raw projections are scored with the target league rules; unsupported scoring and missing source data are disclosed, with a safe native fallback.
- [x] #4 Lineup and trade recommendations use the combined estimate when comparable forecasts exist, while player profiles expose source values and disagreement; ownership and locks remain league-authoritative.
- [x] #5 Tests cover both league directions, custom scoring, identity gaps, provider failures and user-facing provenance; docs explain the combination limits.

**Recorded delivered behavior (historical)**

Added shared public ESPN/Sleeper player projections using unique catalog ESPN IDs, target-league additive scoring and explicit native fallbacks. Live lineups/trades and top-30 Sleeper waiver candidates use comparable means; profiles expose values, IDs, timestamps and disagreement. Verified both directions against live public feeds, 443 deterministic tests pass (1 optional network test skipped), typecheck and targeted lint pass. Provider interfaces remain undocumented and unsupported scoring/identity cases retain native data.

<a id="task-100"></a>

### TASK-100 — Redesign the public sign-in page with clear spacing and visible actions

Source: [TASK-100](../backlog/tasks/task-100%20-%20Redesign-the-public-sign-in-page-with-clear-spacing-and-visible-actions.md) · Baseline status: Done.

**Recorded intent / important context**

The current unauthenticated screen is a placeholder panel. Present the fantasy analytics workspace with a finished responsive layout, clear sign-in and recovery actions, consistent spacing, and comfortable button targets.

**Preserve these acceptance criteria**

- [x] #1 The signed-out page presents the NFL analytics capabilities with a cohesive responsive visual layout and clear primary sign-in action.
- [x] #2 Section spacing, typography and mobile touch targets are consistent; action buttons have visible boundaries or filled backgrounds instead of appearing as plain text.
- [x] #3 Existing Auth0 redirects, password recovery and session loading/error states remain functional and accessible.
- [x] #4 Desktop and phone browser checks verify layout, accessible controls and no horizontal overflow.

**Recorded delivered behavior (historical)**

Replaced the placeholder signed-out screen with a responsive analytics landing page, illustrative workspace preview and clear sign-in/recovery actions. Preserved redirects, loading/error handling and private hydration boundaries. Added visible boundaries to plain/ghost actions and table sorting, 44px minimum action heights and a responsive managed-team form. Verified full unit suite, seven browser checks, production build and changed-file lint/typecheck.

<a id="task-101"></a>

### TASK-101 — Make managed-team saving reliable and show unsaved changes

Source: [TASK-101](../backlog/tasks/task-101%20-%20Make-managed-team-saving-reliable-and-show-unsaved-changes.md) · Baseline status: Done.

**Recorded intent / important context**

A user reports their managed-team selection is not saving. Check provider validation, persistence, reload behavior and save feedback so a confirmed selection survives reopening the league.

**Preserve these acceptance criteria**

- [x] #1 A validated managed-team choice persists and reloads for the same owned league and season.
- [x] #2 Successful persistence does not report failure merely because a redundant provider read fails after the database write.
- [x] #3 Unsaved selections and save progress are clearly visible; failures preserve the choice for retry and server validation errors are useful.
- [x] #4 Regression tests cover save/reload, provider outages and UI save feedback.

**Recorded delivered behavior (historical)**

Team saves now confirm the actual persisted selection and avoid a redundant post-write provider request. The picker remembers the viewed season by account/league, shows unsaved changes and preserves failed drafts. Verified with 10 regression tests, real isolated MongoDB save/reload and backup test, and typecheck. Repository lint currently reports unrelated concurrent changes in TradeAnalyzerPage and DataTable.

<a id="task-102"></a>

### TASK-102 — Improve trade analyzer usability and remove drop controls

Source: [TASK-102](../backlog/tasks/task-102%20-%20Improve-trade-analyzer-usability-and-remove-drop-controls.md) · Baseline status: Done.

**Recorded intent / important context**

The trade tab mixes send/drop actions in an unstructured roster list, displays validation before a proposal exists, and makes lineup impact hard to scan. The user requested a clearer trading flow without drop controls.

**Preserve these acceptance criteria**

- [x] #1 Two distinct teams have searchable rosters, clear exchange summaries, and easy selection and reset controls.
- [x] #2 Drop controls are absent; uneven trades request sufficient explicit open roster slots only when needed.
- [x] #3 Initial guidance, lineup impact, locked players, and selection resets behave correctly on desktop and mobile.

**Recorded delivered behavior (historical)**

Reworked the trade analyzer into responsive searchable team cards with selected-player removal, sending/receiving summaries and prominent weekly lineup impact. Removed drop controls and the inert week selector; reveal explicit roster-space confirmation above the cards only for uneven trades. Prevent same-team selection and reset stale assumptions on proposal/team changes. Collapsed source/limits detail and suppressed premature validation. Verified 7 unit/DOM tests, 2 desktop/mobile browser tests with axe, production build/typecheck and changed-file lint/format. Unrelated project-wide DataTable lint issue remains.

<a id="task-103"></a>

### TASK-103 — Improve Players tab browsing and comparison usability

Source: [TASK-103](../backlog/tasks/task-103%20-%20Improve-Players-tab-browsing-and-comparison-usability.md) · Baseline status: Done.

**Recorded intent / important context**

The user liked the trade analyzer redesign and requested the same usability improvements for Players. The current page uses unstyled controls, a dense checkbox list and long text-only comparisons, making selection and scoring differences hard to scan.

**Preserve these acceptance criteria**

- [x] #1 Players can be found with clearly labeled search and filters, with compact identity, ownership and projection information.
- [x] #2 Selected players stay visible while filtering, can be removed individually or cleared, and have readable comparisons over a common week range.
- [x] #3 Deep-linked players, zero scores, missing data, refresh and league/season changes retain correct behavior; desktop/mobile layouts and accessibility are verified.

**Recorded delivered behavior (historical)**

Redesigned Players with styled league/season controls, searchable player rows, position filtering, persistent removable selections and responsive comparison cards. Prominent projection and observed metrics preserve zero/missing distinctions; weekly scores and provider details expand on demand. Default comparisons use the latest reported week. Fixed refresh resetting league/season, empty-list loading and stale unowned-pool responses after context changes. Verified 11 unit/DOM tests, desktop/mobile browser interactions with axe, production build and changed-file checks.

<a id="task-104"></a>

### TASK-104 — Refresh the application visual design and add a fantasy football favicon

Source: [TASK-104](../backlog/tasks/task-104%20-%20Refresh-the-application-visual-design-and-add-a-fantasy-football-favicon.md) · Baseline status: Done.

**Recorded intent / important context**

The user praised the new login, trade and Players layouts and requested a full visual pass because the rest of the application feels flat. Carry a cohesive visual hierarchy through navigation, dashboards, analytics, rankings editing and account/setup flows, and replace the generic app icons with a relevant fantasy football mark.

**Preserve these acceptance criteria**

- [x] #1 Navigation and all primary application screens use a coherent, lively visual hierarchy with clear controls, cards and meaningful accents.
- [x] #2 Desktop and mobile layouts, contrast, keyboard access and core workflows remain usable, including ranking exports and live matchups.
- [x] #3 A fantasy football favicon and matching browser/app icons are generated, installed and referenced by the document and manifest.

**Recorded delivered behavior (historical)**

Completed the full application visual refresh and installed matching fantasy football browser/app icons. Verified desktop/mobile layouts, accessibility, navigation, ranking exports and core workflows; 456 unit tests and 41 browser tests pass, with production build/typecheck, lint and formatting checks passing.

<a id="task-105"></a>

### TASK-105 — Match loading placeholder spacing to the refreshed workspace

Source: [TASK-105](../backlog/tasks/task-105%20-%20Match-loading-placeholder-spacing-to-the-refreshed-workspace.md) · Baseline status: Done.

**Recorded intent / important context**

Loading states still use inline output and older panel spacing after the visual refresh. Align main loading placeholders with workspace card spacing and keep the rankings heading visible during loading.

**Preserve these acceptance criteria**

- [x] #1 Main loading placeholders share consistent block layout, card padding, line spacing and responsive spacing with the refreshed UI.
- [x] #2 Rankings retains the same page heading while loading and loaded; loading announcements and history progress remain accessible.
- [x] #3 Desktop and mobile loading states fit their containers and transition correctly into loaded content.

**Recorded delivered behavior (historical)**

Aligned main loading placeholders with workspace spacing and retained headings/header space during data loads. Verified ten delayed-data screens on desktop/mobile, loaded transitions, relevant tests and production build.

<a id="task-106"></a>

### TASK-106 — Default Live matchups to the viewer’s managed teams in the first four leagues

Source: [TASK-106](../backlog/tasks/task-106%20-%20Default-Live-matchups-to-the-viewer%E2%80%99s-managed-teams-in-the-first-four-leagues.md) · Baseline status: Done.

**Recorded intent / important context**

On initial load, automatically highlight the signed-in viewer’s managed-team matchup for the first four leagues in sidebar order. Keep manual choices on score refresh and respect current four-matchup limit.

**Preserve these acceptance criteria**

- [x] #1 Initial highlights select the saved managed team on either side or a bye for the first four leagues, using each live league season.
- [x] #2 Missing, stale or unavailable team choices do not highlight arbitrary opponents or leagues beyond the first four.
- [x] #3 Manual choices, including clearing the board, survive refresh; a changed viewer API gets fresh defaults.

**Recorded delivered behavior (historical)**

Live matchups now automatically highlights the viewer’s saved managed-team matchups from the first four leagues. Manual choices persist during refresh and account changes receive fresh defaults. Verified with 12 unit/model tests, four desktop/mobile browser tests, production build/typecheck, lint and formatting.

<a id="task-107"></a>

### TASK-107 — Await session collection disposal in router test teardown

Source: [TASK-107](../backlog/tasks/task-107%20-%20Await-session-collection-disposal-in-router-test-teardown.md) · Baseline status: Done.

**Recorded intent / important context**

GitHub Actions reports an unhandled SyncCleanupError when delayed TanStack DB cleanup unmounts QueryClient after Vitest removes the jsdom window. Router tests unmount React without awaiting asynchronous session disposal.

**Preserve these acceptance criteria**

- [x] #1 Every router test awaits disposal of all created sessions before jsdom teardown.
- [x] #2 Router and API tests pass with no unhandled cleanup errors.

**Recorded delivered behavior (historical)**

Router tests now finish real session collection disposal before jsdom teardown, preventing QueryClient focus cleanup from accessing a removed window. Verified with the complete unit suite and a negative regression check.

<a id="task-108"></a>

### TASK-108 — Show position group rankings and roster projection charts in Season Insights

Source: [TASK-108](../backlog/tasks/task-108%20-%20Show-position-group-rankings-and-roster-projection-charts-in-Season-Insights.md) · Baseline status: Done.

**Recorded intent / important context**

Managers need to compare positional strengths and weaknesses across every team in the selected league. The user supplied two visual references: a team-by-position rank heatmap (1 is strongest) and horizontal stacked rest-of-season projected-points bars with position segments and team totals. Keep both views together in Season Insights. The screenshots are visual inspiration; their Sleeper attribution and completed-season behavior require validation against our supported providers and available projection history. League scoring, roster settings, and projection coverage must make the comparison interpretable rather than rewarding bench depth without explanation.

**Preserve these acceptance criteria**

- [x] #1 Season Insights shows both a position group ranking heatmap and a stacked roster projection chart for all teams in the selected league and season, using the supplied chart references.
- [x] #2 The heatmap shows league-relative ranks for supported positions, labels rank 1 as strongest, defines tie handling, and exposes the underlying projected-points values and full team names.
- [x] #3 The stacked chart labels position segments and team totals, supports sorting by total or position strength, and uses consistent position identities across both charts; unsupported league positions are handled explicitly.
- [x] #4 Both charts disclose the projection horizon, provider/source, refresh time, scoring basis, and positional aggregation rules, including starters versus bench/reserve, flex eligibility, and availability/bye treatment. Missing projection data is distinguished from zero.
- [x] #5 League or season changes cannot retain another selection's chart data. Historical or completed seasons use valid season-specific projections only when available; otherwise show a clear unavailable state without using current-season forecasts.
- [x] #6 Numeric labels and an accessible table make the results understandable without color or hover; charts remain usable on mobile, and verification covers custom positions, ties, missing data, and league/season isolation.

**Recorded delivered behavior (historical)**

Added roster projection bars and position rankings to Season Insights using best legal weekly lineups. Full suite passed 477 tests with one optional test skipped; final additional IDP regression passed separately (478 verified tests total). Two Chrome browser tests passed; production build, typecheck, lint, changed-file formatting and diff checks passed. README/calculation reference updated. Active reports need a refresh for new positional inputs; old/historical snapshots show unavailable data rather than current forecasts.

<a id="task-109"></a>

### TASK-109 — Quantify remaining fantasy schedule strength in Season Insights

Source: [TASK-109](../backlog/tasks/task-109%20-%20Quantify-remaining-fantasy-schedule-strength-in-Season-Insights.md) · Baseline status: Done.

**Recorded intent / important context**

Managers want to know how difficult their remaining fantasy matchups are relative to the other teams in the selected league. Add this to Season Insights alongside the positional-strength views. Interpret schedule strength as the strength of remaining fantasy league opponents, with NFL player matchup difficulty reserved for a separately scoped feature. Existing forecast tasks already provide remaining fixtures and weekly legal-lineup projections; this feature makes schedule difficulty directly visible rather than requiring users to infer it from playoff odds.

**Preserve these acceptance criteria**

- [x] #1 Season Insights shows a numeric remaining-schedule difficulty score and easiest-to-hardest league rank for every team, highlighting the saved managed team when one is selected.
- [x] #2 The default horizon covers uncompleted scheduled regular-season matchups from an explicit as-of week, counts repeated opponents and multiweek matchups according to league rules, and does not assume unknown playoff opponents.
- [x] #3 Each team has a week-by-week opponent and strength breakdown. The displayed formula, units, and rank direction explain how opponent strength is compared with the league baseline for the same weeks.
- [x] #4 Projection coverage, source, freshness, and any historical-strength fallback are disclosed; absent schedules or projections are not treated as easy opponents or zero strength, and teams with no remaining games have an explicit end-of-season state.
- [x] #5 Results respect the selected league, season, scoring settings, and report cutoff without future-data leakage in historical reports. Verification includes repeated opponents, differing remaining-game counts, incomplete schedules, and league/season changes.

**Recorded delivered behavior (historical)**

Added easiest-to-hardest schedule ranks, points-per-week difficulty, coverage and expandable opponent/baseline breakdowns to Season Insights. Verified calculation/calendar cases, report-switch isolation, historical fallback and snapshot preservation. Full suite passed 477 tests with one optional test skipped; final additional IDP regression passed separately (478 verified tests total). Both Chrome browser checks, build, typecheck, lint, changed-file formatting and diff checks passed. Formula and data limitations documented.

<a id="task-110"></a>

### TASK-110 — Suggest possible trades for the user's team in the selected league

Source: [TASK-110](../backlog/tasks/task-110%20-%20Suggest-possible-trades-for-the-users-team-in-the-selected-league.md) · Baseline status: Done.

**Recorded intent / important context**

The existing Trade analyzer evaluates an exchange after a manager chooses teams and players. Managers also want help discovering plausible offers for their saved managed team in the currently selected league. Suggest exchanges that address their weaknesses and make sense for the other manager, with transparent impact for both sides. This is future discovery work building on the existing analyzer, not another manually entered trade evaluation screen. A requested subagent brainstorm is saved separately as optional design exploration; revalidate its assumptions when implementation starts. Trade suggestions may link from Season Insights into the existing Trade analyzer; final navigation placement remains a product decision.

**Preserve these acceptance criteria**

- [x] #1 Suggestions use the currently selected owned league, season, and saved managed team. Missing or stale team selections prompt selection; league/season changes clear prior recommendations and cannot mix league ownership or rosters.
- [x] #2 Users receive a ranked, bounded set of concrete player exchanges with a named league counterpart and a rationale for both managers; the initial scope supports player-only one-for-one offers and a clear no-suitable-trades state.
- [x] #3 Each suggestion shows both teams' before/after best legal lineup expectations and positional coverage under the selected league's scoring and roster rules. Ranking rewards useful lineup improvement and counterpart benefit rather than the raw sum of bench-player projections.
- [x] #4 The evaluation horizon, projection sources, freshness, coverage, and availability assumptions are visible. Current-week estimates are explicitly labeled and are not presented as rest-of-season trade value; a season-long recommendation requires valid remaining-week inputs.
- [x] #5 Candidates respect current ownership, supported player identities, trade eligibility, and known league trade restrictions. Unknown roster limits, deadline rules, unsupported assets, and incomplete data are disclosed rather than assumed valid.
- [x] #6 Users can open a suggestion as a prefilled scenario in the existing Trade analyzer and inspect both sides. Generating or inspecting suggestions does not submit offers, message other managers, or change provider rosters or saved rankings.
- [x] #7 Verification covers league/team isolation, legal lineup and flex assignment, mutually beneficial versus one-sided proposals, duplicate exchanges, unavailable projections, and empty results. Explanations distinguish projected benefit from any claim about the other manager's willingness to accept.

**Recorded delivered behavior (historical)**

Implemented current-week trade discovery for the validated saved managed team in the selected owned league and season. Up to five one-for-one offers improve both legal lineups, show coverage and projection provenance, disclose eligibility limits, honor known Sleeper restrictions and prefill the existing analyzer for inspection. Scope changes clear stale recommendations and scenarios. Optimized the exact shared lineup search for full league rosters. Verified with 532 passing unit tests, 49 passing Chrome checks, type checking, lint, formatting and production build; updated README and trade-suggestions documentation.

<a id="task-111"></a>

### TASK-111 — Toggle position strength between remaining projections and completed-week actual points

Source: [TASK-111](../backlog/tasks/task-111%20-%20Toggle-position-strength-between-remaining-projections-and-completed-week-actual-points.md) · Baseline status: Done.

**Recorded intent / important context**

Position strength currently shows only remaining-week projections. Managers also want to compare positional scoring from weeks already completed, using the starters actually fielded in those weeks.

**Preserve these acceptance criteria**

- [x] #1 An always-available toggle switches the positional charts and rankings between projected remaining weeks and completed-week actual starter scoring.
- [x] #2 Completed mode excludes future and unfinished weeks, groups actual starters by primary position including flex once, preserves ties and negative/zero points, and discloses missing coverage.
- [x] #3 Actual starter position metadata survives report snapshots, historical reports do not require current rosters, and labels identify actual rather than projected data.
- [x] #4 Focused calculation/provider/UI tests, browser interaction, build and relevant static checks pass; formulas are documented.

**Recorded delivered behavior (historical)**

Added Projected remaining weeks / Completed weeks only buttons to Season Insights position strength. Completed mode ranks actual starter points through the completed cutoff, excludes bench and unfinished weeks, and preserves zeroes, negatives, ties and unavailable coverage. Captured starter positions survive snapshots, enabling historical reports without current projections. Documented formulas and verified calculations, providers, snapshots, browser switching, mobile layout, accessibility and build/static checks.

<a id="task-112"></a>

### TASK-112 — Keep unusable Sleeper live projections unavailable instead of zero

Source: [TASK-112](../backlog/tasks/task-112%20-%20Keep-unusable-Sleeper-live-projections-unavailable-instead-of-zero.md) · Baseline status: Done.

**Recorded intent / important context**

Live Sleeper normalization accepts any nonempty stat dictionary and sums absent scoring weights as zero. With league scoring rush_yd=0.1, a projection row containing only unrelated_stat=1 becomes a finite zero-point forecast. This differs from the season forecast coverage check and can feed Live, Players, lineup advice and trade analysis as though the player has a genuine zero forecast. A local mocked-provider reproduction confirmed projectedPoints=0 for that input. Related completed tasks 55 and 99 do not cover this normalization case.

**Preserve these acceptance criteria**

- [x] #1 A native projection with no finite stat applicable to the selected league scoring remains unavailable rather than becoming a zero forecast.
- [x] #2 Legitimate zero and negative projections remain numeric, while missing scoring settings, nonfinite inputs and unusable dictionaries do not claim covered projection data.
- [x] #3 Live, Players, lineup advice and trade analysis consistently disclose missing projection coverage; a valid optional cross-source estimate may still be used with its actual provenance.
- [x] #4 Provider regression tests reproduce the irrelevant-stat case and verify real zero, negative, missing and valid cross-source cases; calculation documentation explains the coverage rule.

**Recorded delivered behavior (historical)**

Restored finite applicable-stat projection scoring; zero/negative values remain valid and missing coverage stays unavailable, including optional-source provenance.

<a id="task-113"></a>

### TASK-113 — Preserve the configured season start when measuring completed position coverage

Source: [TASK-113](../backlog/tasks/task-113%20-%20Preserve-the-configured-season-start-when-measuring-completed-position-coverage.md) · Baseline status: Done.

**Recorded intent / important context**

Completed position rankings infer their starting week from the earliest available score. In a league that started in week 1, omitting all week-1 rows makes a through-week-3 report rank weeks 2 and 3 as complete 2/2 coverage. The code cannot distinguish a missing opening week from a league configured to start later. This is a gap in the new TASK-111 completed mode, confirmed with a local fixture after removing every first-week row. Store or otherwise retain the actual reporting horizon so incomplete results are not presented as full coverage.

**Preserve these acceptance criteria**

- [x] #1 Completed positional coverage uses the configured reporting start through the completed cutoff, rather than silently moving the start to the earliest returned score.
- [x] #2 Missing an opening week in a week-1 league leaves affected teams unranked with visible missing coverage, while a league configured to start in week 3 can be fully covered from week 3.
- [x] #3 The reporting horizon survives saved snapshots; legacy reports without reliable start metadata disclose uncertainty instead of asserting full-season coverage.
- [x] #4 Tests cover missing opening weeks, legitimate late starts, missing intermediate weeks, no completed weeks, snapshot round trips and UI coverage labels; formulas are updated.

**Recorded delivered behavior (historical)**

Restored configured reporting starts through provider loading, calculations and snapshots; missing opening weeks and unknown legacy horizons remain unranked with visible coverage.

<a id="task-114"></a>

### TASK-114 — Resolve ESPN ranking-studio matchups by scoring week rather than period ID

Source: [TASK-114](../backlog/tasks/task-114%20-%20Resolve-ESPN-ranking-studio-matchups-by-scoring-week-rather-than-period-ID.md) · Baseline status: Done.

**Recorded intent / important context**

EspnProvider.getMatchups requests a scoringPeriodId but filters schedule entries by matchupPeriodId === selected week. For a two-week calendar where period 2 covers weeks 3 and 4, selecting week 3 returns no matchup for the valid period-2 fixture; another period with ID 3 can instead select the wrong opponent. The ranking editor consumes this endpoint. Season schedule analysis already distinguishes these calendars. A local provider reproduction returned an empty array for the week-3/period-2 case. This is a separate gap from completed TASK-26 week choices and TASK-109 schedule strength.

**Preserve these acceptance criteria**

- [x] #1 A selected ESPN scoring week returns the matchup period containing that week using the published calendar or a validated equivalent mapping.
- [x] #2 The returned opponent and score context explicitly distinguish selected-week points from multiweek aggregate points; unknown or overlapping mappings do not substitute another period.
- [x] #3 Single-week leagues and bye matchups continue to work, including regular-season and playoff period mappings where published.
- [x] #4 Provider and ranking-editor regression tests cover week 3 inside period 2, unknown calendars, single-week behavior and selected-week versus aggregate scores; user-facing score semantics are documented.

**Recorded delivered behavior (historical)**

Resolved ESPN scoring weeks through validated matchup calendars, preserved weekly/aggregate/unavailable score context, and excluded aggregate scores from suggested ranking order.

<a id="task-115"></a>

### TASK-115 — Make Player Profiles refresh invalidate cached season reports

Source: [TASK-115](../backlog/tasks/task-115%20-%20Make-Player-Profiles-refresh-invalidate-cached-season-reports.md) · Baseline status: Done.

**Recorded intent / important context**

The Refresh player data button increments retry, but the reload effect calls getInsights(leagueId, year) without the refresh argument. That API keeps current seasons fresh for five minutes and historical seasons indefinitely within the cache lifetime. The button can therefore show fresh live rosters beside unchanged observed scores. A DOM reproduction confirmed the refresh call arguments remain [leagueId, year], while Season Insights and History pass an explicit refresh request. Related completed TASK-53 promises explicit refresh retrieves updated data.

**Preserve these acceptance criteria**

- [x] #1 An explicit Player Profiles refresh retrieves updated observed scoring even when the selected current or historical report is cached and fresh.
- [x] #2 Ordinary initial reads and league or season changes preserve normal cache reuse rather than forcing every read to reload.
- [x] #3 Refresh preserves the selected league, season and comparisons, and failures or delayed responses cannot replace a newer selected context.
- [x] #4 A regression test uses the real cache contract or an equivalent assertion to verify explicit invalidation, historical cache behavior, preserved selections and error handling.

**Recorded delivered behavior (historical)**

Explicit player refresh invalidates cached current and historical scoring while ordinary context changes reuse the cache; preserved selections and stale-response handling.

<a id="task-116"></a>

### TASK-116 — Keep uncached playoff simulations from blocking interactive rendering

Source: [TASK-116](../backlog/tasks/task-116%20-%20Keep-uncached-playoff-simulations-from-blocking-interactive-rendering.md) · Baseline status: Done.

**Recorded intent / important context**

PlayoffForecast invokes cachedPlayoffForecast during render, and a cache miss runs the default 20,000 simulations synchronously. A local Node benchmark with six completed weeks, a week-14 regular-season end and four playoff places measured 180–194 ms for 12 teams and 465–530 ms for 32 teams across three runs each. The timeline yields between cutoffs but each individual simulation still blocks. These are synthetic local timings, not production browser measurements. Caching helps repeat views but cannot help the first calculation. Preserve model semantics while keeping the interface responsive.

**Preserve these acceptance criteria**

- [x] #1 Loading an uncached forecast or changing the cutoff shows a pending state and keeps navigation and controls responsive during simulation.
- [x] #2 Seeded results, projection coverage, model version and simulation counts remain equivalent to the existing forecast for identical inputs; existing cutoff caching remains effective.
- [x] #3 Results from canceled, replaced or unmounted report contexts cannot update the active league or season.
- [x] #4 Repeatable browser measurements with representative 12-team and 32-team fixtures demonstrate that simulation no longer creates long blocking main-thread work; regression tests verify result parity, cancellation and loading behavior.

**Recorded delivered behavior (historical)**

Restored batched cancellable seeded forecasts, asynchronous timeline loading and cache reuse; Chrome checks confirm result parity and responsive 12/32-team simulations.

<a id="task-117"></a>

### TASK-117 — Fetch live data only for the selected league in Players and Trade Analyzer

Source: [TASK-117](../backlog/tasks/task-117%20-%20Fetch-live-data-only-for-the-selected-league-in-Players-and-Trade-Analyzer.md) · Baseline status: Done.

**Recorded intent / important context**

PlayerProfilesPage calls getLiveMatchups for every report context then filters to the selected league. TradeAnalyzerPage also loads every registered league before using one. The server operation fans out to all saved leagues concurrently, including optional per-player projection enrichment, and returns only after all complete. A slow unrelated league delays a selected-league page and switching leagues repeats unrelated provider work. This was verified by tracing both page requests and the operations.getLiveMatchups Promise.all. Keep the existing all-league Live and overview views usable while allowing selected-league consumers to avoid this work.

**Preserve these acceptance criteria**

- [x] #1 Players and Trade Analyzer request provider data only for their selected owned league; unrelated registered leagues cause no provider reads for those pages.
- [x] #2 A slow or failing unrelated league does not delay or fail the selected-league result.
- [x] #3 The all-league Live and weekly overview flows retain their current capability, and selected-league loading preserves account isolation and provider access checks.
- [x] #4 Request-count and delayed-provider tests verify selected-league scope, league switching and all-league behavior; UI loading and per-league errors remain clear.

**Recorded delivered behavior (historical)**

Reconnected the owned selected-league live endpoint, cache, pages and tab preloads while preserving newer trade suggestions and all-league overview reads.

<a id="task-118"></a>

### TASK-118 — Retain player names and primary positions for historical profile browsing

Source: [TASK-118](../backlog/tasks/task-118%20-%20Retain-player-names-and-primary-positions-for-historical-profile-browsing.md) · Baseline status: Done.

**Recorded intent / important context**

Historical observations create PlayerProfile records with names such as Player p0 and no position. Readable identity is filled only from live rosters or the optional current waiver pool. calculateInsights receives provider playerNames and playerPositions but does not retain a profile identity catalog in the report; historical-season views have no matching live roster. A local reproduction supplied Known Player/RB metadata and actual starter position to calculation, yet historical playerProfiles still returned Player p0 with no position. Scoring survives, but name search and position filtering cannot identify many historical or dropped players. TASK-94 implemented the profile view with this coverage limitation.

**Preserve these acceptance criteria**

- [x] #1 Players with historical observations retain available provider names and primary positions in the selected provider and season without requiring current roster ownership.
- [x] #2 Historical name search and position filtering work with that metadata; current ownership, injury status and projections remain unavailable when unsupported.
- [x] #3 Identity metadata is scoped to players represented in the report, survives snapshots and never merges players across providers or seasons by name; legacy or unknown identities remain explicit.
- [x] #4 Tests cover historical seasons without live data, dropped players, duplicate names across IDs, missing metadata and snapshot round trips; profile coverage documentation is updated.

**Recorded delivered behavior (historical)**

Retained represented player names and positions in reports and snapshots for historical search/filtering without introducing current-season claims.

<a id="task-119"></a>

### TASK-119 — Coalesce concurrent cold Sleeper player catalog reads

Source: [TASK-119](../backlog/tasks/task-119%20-%20Coalesce-concurrent-cold-Sleeper-player-catalog-reads.md) · Baseline status: Done.

**Recorded intent / important context**

sleeperNames caches only a completed catalog. Two callers arriving before the first request resolves both download and normalize the full NFL player catalog. A deferred mocked HTTP response reproduced two GET calls for two concurrent sleeperNames invocations. Live has a local playerCatalog promise wrapper, but season reports, waiver and enrichment callers access sleeperNames directly, so that wrapper does not coalesce all consumers. This is server-side catalog behavior, separate from completed report-cache and public-route-cache tasks 53 and 45.

**Preserve these acceptance criteria**

- [x] #1 Concurrent cold or expired catalog reads share one provider request and equivalent normalized results across catalog consumers.
- [x] #2 A failed shared request does not poison future reads; subsequent requests can retry and existing cache freshness behavior is preserved.
- [x] #3 The shared catalog continues to contain only public player metadata and does not mix league ownership or user credentials into its cache.
- [x] #4 Deferred-response tests verify single provider request, expiry, shared failures and retry behavior; redundant local coalescing code is removed only if made unnecessary by this change.

**Recorded delivered behavior (historical)**

Restored one shared in-flight public Sleeper catalog read with completion-based TTL and failure recovery across all consumers.

<a id="task-120"></a>

### TASK-120 — Preload workspace tabs through TanStack Router and shared session queries

Source: [TASK-120](../backlog/tasks/task-120%20-%20Preload-workspace-tabs-through-TanStack-Router-and-shared-session-queries.md) · Baseline status: Done.

**Recorded intent / important context**

Tab pages currently fetch in component effects, and several APIs force repeated reads. Warm route code and data during the first ready workspace load using TanStack Router loaders and the existing session cache so switching tabs reuses the same league, season, live and report queries.

**Preserve these acceptance criteria**

- [x] #1 The first ready workspace load preloads each main navigation tab without blocking the active page; search context and explicit league/season selection are respected.
- [x] #2 Loaders and pages share query keys and concurrent requests, with appropriate freshness for live, current-season and historical data and working explicit refresh.
- [x] #3 Account, provider identity and credential changes cannot reuse stale private data; no private requests run before authentication/setup, and public tabs remain public.
- [x] #4 Router integration and cache tests verify first-load warming, navigation reuse, refresh, errors and isolation; browser checks, build and static checks pass and behavior is documented.

**Recorded delivered behavior (historical)**

Workspace tabs now warm their route code and shared data in the background after authentication/setup. Later navigation reuses session queries while explicit refresh and mutation invalidation keep reads current. Public tabs stay public and account caches are isolated. Verified with 491 passing tests, 13 browser checks, production build, typecheck, lint and formatting.

<a id="task-121"></a>

### TASK-121 — Repair ESPN snapshot links after empty maps are removed during persistence

Source: [TASK-121](../backlog/tasks/task-121%20-%20Repair-ESPN-snapshot-links-after-empty-maps-are-removed-during-persistence.md) · Baseline status: Done.

**Recorded intent / important context**

Opening an ESPN snapshot succeeds at creation but shows Snapshot unavailable on read. Mongoose minimizes empty Mixed objects, removing teamPoints for future weeks without projection data; existing stored snapshots fail their read schema.

**Preserve these acceptance criteria**

- [x] #1 New snapshots retain empty projection and playoff-rule maps through Mongoose serialization.
- [x] #2 Previously stored snapshots missing empty required maps load without ESPN access while malformed map values remain rejected.
- [x] #3 The reported local snapshot URL displays its saved report.

**Recorded delivered behavior (historical)**

Preserved empty snapshot maps during Mongoose persistence and accepted omitted empty teamPoints/divisionByTeam maps in older snapshots while rejecting malformed map values. Updated round-trip tests to use Mongoose serialization, added regression coverage, and documented compatibility. Confirmed the reported snapshot displays its saved ESPN playoff forecast without rewriting stored data or fetching ESPN. Restarted the local dev server to clear stale dependency resolution. All required checks pass.

<a id="task-122"></a>

### TASK-122 — Show all-time manager head-to-head records and rivalries

Source: [TASK-122](../backlog/tasks/task-122%20-%20Show-all-time-manager-head-to-head-records-and-rivalries.md) · Baseline status: Done.

**Recorded intent / important context**

League history has multi-season manager summaries, but it does not answer who a manager consistently beats or loses to. Add pairwise records so managers can see total wins/losses/ties, points for and against, win rate and average margin against each opponent, with evidence-based biggest rival, personal punching bag and kryptonite callouts.

**Preserve these acceptance criteria**

- [x] #1 A manager can inspect their all-time matchup record against every other manager, with games played, W-L-T, points for/against, win percentage and average margin.
- [x] #2 Rival, punching bag and kryptonite labels use configurable minimum sample coverage and explain the evidence behind each label.
- [x] #3 A league-wide rivalry matrix compares every manager pair and handles ties, manager identity changes and missing historical seasons.
- [x] #4 Insufficient samples and unavailable history are shown explicitly.

**Recorded delivered behavior (historical)**

Added stable-identity head-to-head, evidence-backed configurable labels and complete rivalry matrix with coverage. Verified with four targeted Vitest tests and typecheck.

<a id="task-123"></a>

### TASK-123 — Add historical expected wins and completed-season schedule difficulty

Source: [TASK-123](../backlog/tasks/task-123%20-%20Add-historical-expected-wins-and-completed-season-schedule-difficulty.md) · Baseline status: Done.

**Recorded intent / important context**

League history already shows all-play rate and a luck index, and Season Insights covers remaining schedule strength. Add season-level historical context: expected wins derived from weekly scoring percentile, opponent scoring difficulty, and an alternate-schedule comparison that shows how each manager would have finished with another manager’s schedule.

**Preserve these acceptance criteria**

- [x] #1 Each manager season shows expected wins alongside actual wins, with the method and usable-week coverage.
- [x] #2 Completed-season schedule difficulty is based on opponent points scored, not opponent record.
- [x] #3 Users can compare a team’s result under another team’s schedule using the same season and scoring rules.
- [x] #4 Byes, ties, partial schedules and missing scores are handled transparently.

**Recorded delivered behavior (historical)**

Added historical percentile expected wins, opponent scoring difficulty and same-season interactive schedule replay with per-week evidence; eight tests and typecheck pass.

<a id="task-124"></a>

### TASK-124 — Add a cross-season Elo manager power ranking

Source: [TASK-124](../backlog/tasks/task-124%20-%20Add-a-cross-season-Elo-manager-power-ranking.md) · Baseline status: Done.

**Recorded intent / important context**

Current and historical summaries describe results but do not provide a rating that updates after each matchup and carries from season to season. Add an Elo-style manager rating to compare sustained competitive strength across league history.

**Preserve these acceptance criteria**

- [x] #1 Ratings update chronologically from completed head-to-head games and carry across season boundaries.
- [x] #2 The ranking includes an explanation of rating movement and the games contributing to each manager’s rating.
- [x] #3 New managers, incomplete histories, ties, and manager identity changes have documented treatment and coverage.

**Recorded delivered behavior (historical)**

Added chronological cross-season Elo with per-game evidence and documented priors/identity treatment. Twelve cumulative calculation/DOM tests and typecheck pass. Tightened schedule completeness and explicit bye handling during review.

<a id="task-125"></a>

### TASK-125 — Create a league Hall of Fame and Hall of Shame record book

Source: [TASK-125](../backlog/tasks/task-125%20-%20Create-a-league-Hall-of-Fame-and-Hall-of-Shame-record-book.md) · Baseline status: Done.

**Recorded intent / important context**

League history shows manager summaries and season outcomes, but lacks a browsable record book that celebrates sustained success and catalogs notable low points. Create evidence-backed Hall of Fame and Hall of Shame views across seasons.

**Preserve these acceptance criteria**

- [x] #1 Hall of Fame rankings combine championships, playoff performance, regular-season wins, scoring and longevity with visible metric weights.
- [x] #2 Hall of Shame entries identify records such as worst seasons, longest losing streaks, lowest scores and biggest collapses with season and matchup evidence.
- [x] #3 Coverage and sample size accompany each record; unknown provider results are not treated as failures.

**Recorded delivered behavior (historical)**

Added weighted, coverage-aware Hall of Fame plus browsable worst-season, losing-streak, lowest-score and collapse evidence. Fifteen cumulative focused tests and typecheck pass; unknown results excluded.

<a id="task-126"></a>

### TASK-126 — Detect fantasy manager dynasties and competitive eras

Source: [TASK-126](../backlog/tasks/task-126%20-%20Detect-fantasy-manager-dynasties-and-competitive-eras.md) · Baseline status: Done.

**Recorded intent / important context**

Championship totals and year-by-year history exist, but the app does not identify sustained championship runs or changes in league dominance. Detect manager eras such as multiple titles within a defined rolling span.

**Preserve these acceptance criteria**

- [x] #1 The league history identifies qualifying title runs and other configurable sustained-success eras with the seasons included.
- [x] #2 Era thresholds and supporting accomplishments are visible and consistently applied.
- [x] #3 Incomplete championship coverage does not produce false era claims.

**Recorded delivered behavior (historical)**

Added configurable calendar-span title dynasties and sustained regular success with explicit exclusions for unknown champions and missing seasons. Eighteen cumulative focused tests plus typecheck pass.

<a id="task-127"></a>

### TASK-127 — 'Rate historical playoff performance, clutch results and choking'

Source: [TASK-127](../backlog/tasks/task-127%20-%20Rate-historical-playoff-performance-clutch-results-and-choking.md) · Baseline status: Done.

**Recorded intent / important context**

The app forecasts playoff qualification and championships, but it does not summarize what managers historically do once playoffs begin or in high-pressure games. Add postseason performance, must-win clutch results, and a carefully contextualized choker rating for strong regular-season teams that repeatedly underperform in playoffs.

**Preserve these acceptance criteria**

- [x] #1 Managers can compare regular-season and playoff performance across completed seasons with sample sizes.
- [x] #2 Must-win and playoff performance definitions are explicit and include the games counted.
- [x] #3 Choker or clutch labels require sufficient evidence and are presented as descriptive statistics, not predictions.
- [x] #4 Missing brackets, byes and unsupported provider outcomes remain unknown.

**Recorded delivered behavior (historical)**

Added explicit provider-verified completed playoff series, regular/playoff comparison, elimination must-win evidence and sample-qualified descriptive labels. Unknown brackets/byes/ESPN elimination status preserved. Forty-four relevant tests and typecheck pass, including provider mapping and DOM checks.

<a id="task-128"></a>

### TASK-128 — Build an all-time matchup and scoring record book

Source: [TASK-128](../backlog/tasks/task-128%20-%20Build-an-all-time-matchup-and-scoring-record-book.md) · Baseline status: Done.

**Recorded intent / important context**

Historical pages focus on manager and season summaries rather than searchable game-level records. Add league records for closest games, largest blowouts, highest combined scores, highest individual team scores, and the worst beats where a top-scoring team still lost to an even higher scorer.

**Preserve these acceptance criteria**

- [x] #1 Users can browse and sort the closest games, blowouts and high-scoring games across league history.
- [x] #2 Worst-beat entries show each team’s scoring rank for that week and the margin.
- [x] #3 Record entries link to the season or matchup when available and show missing-history coverage.

**Recorded delivered behavior (historical)**

Added searchable, numerically sortable matchup/scoring records, full-week scoring ranks, worst-beat filtering and season links. Included verified playoff series once in rivalry/Elo inputs with explicit multiweek record labels. Twenty-seven focused tests plus typecheck pass.

<a id="task-129"></a>

### TASK-129 — Add a weekly loss Pain Index

Source: [TASK-129](../backlog/tasks/task-129%20-%20Add-a-weekly-loss-Pain-Index.md) · Baseline status: Done.

**Recorded intent / important context**

A close loss or a high-scoring loss can feel worse than an ordinary defeat, but the app has no way to surface the most painful historical weeks. Add an explainable weekly Pain Index using factors such as margin, scoring rank, opponent score and documented late-week swing data when available.

**Preserve these acceptance criteria**

- [x] #1 The index ranks a manager’s most painful losses and shows the factors and source data behind each score.
- [x] #2 Unavailable components are excluded or labeled; scores remain comparable only where the same components are available.
- [x] #3 The feature avoids claiming emotional certainty and presents the index as playful league context.

**Recorded delivered behavior (historical)**

Added explainable weekly loss Pain Index, manager selection and separate component-coverage cohorts, using documented archived expectations only where available. Thirty-three focused calculation/DOM tests, TypeScript and scoped lint pass. Also completed record-book individual scores for bye/unpaired weeks and shared report links.

<a id="task-130"></a>

### TASK-130 — Track Monday night fantasy comebacks and miracles

Source: [TASK-130](../backlog/tasks/task-130%20-%20Track-Monday-night-fantasy-comebacks-and-miracles.md) · Baseline status: Done.

**Recorded intent / important context**

Completed matchup results do not reveal dramatic comeback stories. Identify Monday-night wins after a low pre-game win probability, such as entering Monday below a configurable threshold, using trustworthy in-game scoring or archived projection data.

**Preserve these acceptance criteria**

- [x] #1 Qualifying comeback games show the pre-Monday probability, final outcome, players contributing and data source.
- [x] #2 Thresholds are configurable or clearly stated, and incomplete live/probability data is not inferred.
- [x] #3 Users can browse league-wide and manager-specific comeback records by season.

**Recorded delivered behavior (historical)**

Added configurable Monday comeback browsing from validated real archive input, export and snapshot roundtrip contract; preserves raw transaction coverage. Tests and typecheck pass.

<a id="task-131"></a>

### TASK-131 — Replay historical matchup win probability

Source: [TASK-131](../backlog/tasks/task-131%20-%20Replay-historical-matchup-win-probability.md) · Baseline status: Done.

**Recorded intent / important context**

The existing playoff timeline shows playoff odds by completed week, but old individual matchups cannot be replayed as win-probability graphs through Sunday and Monday. Add historical matchup win-probability timelines where archived scoring and projections support them.

**Preserve these acceptance criteria**

- [x] #1 A historical matchup view plots win probability across available game-time snapshots.
- [x] #2 The graph identifies snapshot timing, data coverage and the players or scoring events responsible for major changes when available.
- [x] #3 Matchups without sufficient archived data show an explicit unavailable state.

**Recorded delivered behavior (historical)**

Added accessible probability replay graph and exact event table using validated archive checkpoints; documents gaps and unavailable coverage.

<a id="task-132"></a>

### TASK-132 — Compare draft picks with draft position and measure manager draft skill

Source: [TASK-132](../backlog/tasks/task-132%20-%20Compare-draft-picks-with-draft-position-and-measure-manager-draft-skill.md) · Baseline status: Done.

**Recorded intent / important context**

Existing hindsight draft analysis can identify misses, but managers cannot review best and worst picks together or see whether their drafting consistently beats expectations across seasons. Add pick-level value and a multi-year manager draft-skill summary.

**Preserve these acceptance criteria**

- [x] #1 Each pick is compared with an explicit draft-position or ADP expectation using season production and league scoring.
- [x] #2 Best and worst picks are browseable by manager and season with the comparison baseline and coverage.
- [x] #3 Multi-season drafting skill aggregates comparable picks and shows sample size; missing ADP or draft data is not guessed.

**Recorded delivered behavior (historical)**

Added actual historical Sleeper picks and explicit nearby-pick production expectation, manager best/worst browsing and compatible multi-season skill with sample coverage.

<a id="task-133"></a>

### TASK-133 — Track players managers dropped before breakout weeks

Source: [TASK-133](../backlog/tasks/task-133%20-%20Track-players-managers-dropped-before-breakout-weeks.md) · Baseline status: Done.

**Recorded intent / important context**

Waiver summaries describe pickup lift, but the app does not highlight players dropped by a manager shortly before strong performances. Add a waiver graveyard that links a dropped player to subsequent scoring in a defined window.

**Preserve these acceptance criteria**

- [x] #1 Dropped-player entries identify the manager, transaction date, subsequent scoring window and relevant league availability.
- [x] #2 The report compares subsequent output with the stated baseline and avoids crediting points outside the configured window.
- [x] #3 Incomplete transaction or player history is labeled and excluded from unsupported conclusions.

**Recorded delivered behavior (historical)**

Added manager-filtered observed drop graveyard with configurable scoring window, explicit prior baseline, coverage and availability evidence.

<a id="task-134"></a>

### TASK-134 — Add perfect-lineup records and retrospective start-sit regret

Source: [TASK-134](../backlog/tasks/task-134%20-%20Add-perfect-lineup-records-and-retrospective-start-sit-regret.md) · Baseline status: Done.

**Recorded intent / important context**

Completed work measures historical starting accuracy and best possible weekly lineup potential, but managers do not have a clear perfect-lineup win-loss record or a weekly start/sit regret highlight. Build a retrospective view that connects lineup decisions to outcomes.

**Preserve these acceptance criteria**

- [x] #1 For each completed matchup, the report compares actual and optimal legal lineup points and indicates whether optimal management would change the result.
- [x] #2 The largest regret of each week identifies the manager, decision, points difference and matchup consequence.
- [x] #3 Position eligibility, lineup slots, scoring rules, incomplete rosters and sample coverage are respected.

**Recorded delivered behavior (historical)**

Added verified roster completeness and optimizer selections, actual/both-optimal records and weekly legal start-sit regret with consequences and explicit unavailable coverage.

<a id="task-135"></a>

### TASK-135 — 'Show league trade networks, trade partners and trade trees'

Source: [TASK-135](../backlog/tasks/task-135%20-%20Show-league-trade-networks-trade-partners-and-trade-trees.md) · Baseline status: Done.

**Recorded intent / important context**

Season Insights compares short-term player scoring after a trade, but there is no cross-season view of trading relationships or what happened to the assets from an original deal. Add trade-partner summaries and an asset-aware trade tree, especially for keeper and dynasty histories.

**Preserve these acceptance criteria**

- [x] #1 A league trade network shows trade counts between manager pairs and links to the underlying transactions.
- [x] #2 Trade trees follow assets through later trades where provider transaction data can establish continuity.
- [x] #3 Unresolvable assets, draft picks and future value are explicitly marked rather than assigned speculative values.

**Recorded delivered behavior (historical)**

Added cross-season observed manager trade partner network, linked transactions and player movement trails with explicit continuity and unresolved pick limitations.

<a id="task-136"></a>

### TASK-136 — Expand trade evaluation beyond short-term scoring windows

Source: [TASK-136](../backlog/tasks/task-136%20-%20Expand-trade-evaluation-beyond-short-term-scoring-windows.md) · Baseline status: Done.

**Recorded intent / important context**

Current trade grades compare short post-trade player scoring and explicitly do not value picks or long-term dynasty context. Add complementary trade analytics based on starts actually made and championship contribution, keeping the evidence and limitations visible rather than declaring a simplistic winner.

**Preserve these acceptance criteria**

- [x] #1 Trade reports distinguish observed points, starts actually made and documented playoff or championship contribution.
- [x] #2 Each view shows its evaluation window, data coverage and limitations; draft picks and future value are not fabricated.
- [x] #3 Close or context-dependent outcomes can remain unranked instead of forcing a winner.

**Recorded delivered behavior (historical)**

Added extended acquired-player roster points, actual starts, verified postseason contributions and separate recipient season results. Windows and coverage remain explicit; missing/ambiguous evidence is unknown and outcomes remain context-dependent.

<a id="task-137"></a>

### TASK-137 — Summarize manager transaction activity and tinkering tendencies

Source: [TASK-137](../backlog/tasks/task-137%20-%20Summarize-manager-transaction-activity-and-tinkering-tendencies.md) · Baseline status: Done.

**Recorded intent / important context**

League history reports outcomes of trades and pickups but not managers’ transaction volume or season-to-season tinkering patterns. Add transaction activity summaries that count waiver claims, roster moves and trades where provider data supports them.

**Preserve these acceptance criteria**

- [x] #1 Managers can compare transaction counts by season and transaction type.
- [x] #2 Counts use explicit provider coverage and distinguish unsupported transaction categories.
- [x] #3 Playful activity labels are optional, explainable and based on stated thresholds.

**Recorded delivered behavior (historical)**

Added provider-covered manager transaction comparisons and optional explained activity labels. Calculation and DOM tests passed; documentation records coverage limits.

<a id="task-138"></a>

### TASK-138 — Identify manager nemesis and guardian-angel players

Source: [TASK-138](../backlog/tasks/task-138%20-%20Identify-manager-nemesis-and-guardian-angel-players.md) · Baseline status: Done.

**Recorded intent / important context**

The analytics site tracks manager and team results, but it does not connect individual NFL player performances against a manager’s opponent history to matchup outcomes. Identify opposing players who most often hurt a manager and rostered players who most often help win matchups.

**Preserve these acceptance criteria**

- [x] #1 Nemesis and guardian-angel summaries show player, matchup count, scoring and the method used to attribute a win or loss.
- [x] #2 The view filters to verified appearances and roster ownership in the league history.
- [x] #3 Small samples, partial roster data and provider player-identity changes are handled transparently.

**Recorded delivered behavior (historical)**

Added verified nemesis/guardian player summaries with counterfactual attribution, samples and identity disclosure; calculation and DOM tests passed.

<a id="task-139"></a>

### TASK-139 — Track manager player loyalty and historical ownership

Source: [TASK-139](../backlog/tasks/task-139%20-%20Track-manager-player-loyalty-and-historical-ownership.md) · Baseline status: Done.

**Recorded intent / important context**

Historical player profiles do not show how managers’ roster relationships change over time. Add ownership history such as seasons and weeks rostered, repeated drafting or acquisition, and a best-supported favorite-player summary.

**Preserve these acceptance criteria**

- [x] #1 A manager-player view shows seasons, weeks rostered and known acquisition paths from league transactions.
- [x] #2 Favorite-player summaries use visible inputs such as draft, trade, pickup and roster duration with sample counts.
- [x] #3 The report does not claim complete NFL career ownership when league records are partial.

**Recorded delivered behavior (historical)**

Added observed ownership histories and transparent favorite ranking with partial-history disclosure. Calculation and DOM checks pass.

<a id="task-140"></a>

### TASK-140 — Show fantasy soulmate drafting overlap and draft steals

Source: [TASK-140](../backlog/tasks/task-140%20-%20Show-fantasy-soulmate-drafting-overlap-and-draft-steals.md) · Baseline status: Done.

**Recorded intent / important context**

The app does not surface managers who repeatedly target the same players or cases where one manager selected another’s queued player immediately before their pick. Add draft overlap and draft-steal insights only where draft order and queue data are available.

**Preserve these acceptance criteria**

- [x] #1 Managers can compare shared draft targets and player overlap with seasons and counts shown.
- [x] #2 Draft-steal claims require explicit queue or equivalent provider evidence; ordinary next-pick timing is not treated as proof of queue intent.
- [x] #3 Missing queue data and incomparable draft formats are labeled unsupported.

**Recorded delivered behavior (historical)**

Added format-aware draft overlap with observed season/count inputs and explicit unsupported queue steals. Verified calculations and DOM disclosures.

<a id="task-141"></a>

### TASK-141 — Create evidence-based manager archetypes

Source: [TASK-141](../backlog/tasks/task-141%20-%20Create-evidence-based-manager-archetypes.md) · Baseline status: Done.

**Recorded intent / important context**

The league can compare manager outcomes and activity, but it does not turn repeatable patterns into shareable manager profiles. Add playful archetypes such as Tinkerer, Waiver Hawk, Regular Season Merchant, Playoff Assassin or Eternal Runner-Up based on measurable league history.

**Preserve these acceptance criteria**

- [x] #1 Each archetype maps to explicit metrics, season coverage and minimum sample requirements.
- [x] #2 A manager can receive multiple profiles or no profile when evidence is insufficient.
- [x] #3 Labels remain playful and include the underlying evidence so users can assess the characterization.

**Recorded delivered behavior (historical)**

Added independent playful profiles with explicit metrics, thresholds, season coverage and insufficient-sample handling. Calculation/DOM tests pass.

<a id="task-142"></a>

### TASK-142 — Generate shareable personal and league Fantasy Wrapped recaps

Source: [TASK-142](../backlog/tasks/task-142%20-%20Generate-shareable-personal-and-league-Fantasy-Wrapped-recaps.md) · Baseline status: Done.

**Recorded intent / important context**

The product opportunity is to tell the story of a fantasy league, but there is no end-of-season recap designed for sharing. Create personal and league-wide Wrapped summaries with season records, expected performance, luck, rivalries, best and worst results, pickups, lineup decisions and manager archetypes where supported.

**Preserve these acceptance criteria**

- [x] #1 A personal recap summarizes one manager’s selected season with record, expected wins/luck, rivalries, best and worst matchup, pickups, lineup choices and supported player/archetype highlights.
- [x] #2 A league recap highlights champion, scoring leader, luck extremes, upsets, closest game, blowout, pickup, trade and rivalry of the year where data exists.
- [x] #3 Recaps disclose data coverage and omit unsupported claims; each can be shared through an intentional public snapshot with privacy controls.
- [x] #4 The layout is readable on mobile and produces a clear share preview.

**Recorded delivered behavior (historical)**

Delivered selected-season personal and league Wrapped cards, responsive share preview and intentional cards-only public snapshots with existing ownership, sharing revocation and expiry controls. Verified with 61 targeted tests, typecheck, focused lint and lead real-Chrome 390px integration exercise without overflow/errors.

<a id="task-143"></a>

### TASK-143 — Reduce report loading latency and move browser forecasts off the main thread

Source: [TASK-143](../backlog/tasks/task-143%20-%20Reduce-report-loading-latency-and-move-browser-forecasts-off-the-main-thread.md) · Baseline status: Done.

**Recorded intent / important context**

Cold history loads serialize seasons and historical weeks, repeat provider reads, and wait to start independent report sections. Hidden history groups also render eagerly. Local synthetic 12-team forecasts take 152–211 ms each and calibration performs 28 forecasts per season, motivating off-thread browser computation while preserving model results.

**Preserve these acceptance criteria**

- [x] #1 Historical weeks and selected seasons load with bounded concurrency while preserving ordering, progress, retained results, errors and cancellation.
- [x] #2 Season loading reuses duplicate Sleeper metadata and roster reads and overlaps independent sections without expanding provider traffic beyond a shared bound.
- [x] #3 Browser forecasts and calibration use bounded worker execution with deterministic parity, cancellation and a compatible fallback.
- [x] #4 History report groups mount on first visit and retain their controls after switching tabs.
- [x] #5 Relevant regressions, typecheck, lint and production build pass and performance behavior is documented.

**Recorded delivered behavior (historical)**

Reduced cold report latency through bounded concurrent seasons/weeks, report-scoped request reuse and overlapping independent reads. Moved browser simulations and calibration onto one cancellable worker and deferred history report groups until first use. Verified deterministic results, concurrency limits, retries, cancellation, retained data and tab state through 727 passing tests and four browser checks; production build, typecheck, lint and formatting passed.

<a id="task-144"></a>

### TASK-144 — Use single-week playoff scores for all-time scoring highs

Source: [TASK-144](../backlog/tasks/task-144%20-%20Use-single-week-playoff-scores-for-all-time-scoring-highs.md) · Baseline status: Done.

**Recorded intent / important context**

Two-week playoff series totals appear alongside single-week matchups in highest combined scores, inflating all-time scoring records.

**Preserve these acceptance criteria**

- [x] #1 Combined scoring highs compare actual individual weeks, including each week of multiweek playoff series.
- [x] #2 Individual weekly highs remain weekly, while closest games and blowouts retain series totals.
- [x] #3 Regression tests cover weekly splitting, invalid weekly data, and category switching; explanatory copy describes the scoring basis.

**Recorded delivered behavior (historical)**

Combined scoring highs now split multiweek playoff series into actual weekly scores, preserving individual weekly highs and aggregate matchup margin records. Missing, duplicate, or nonfinite weekly scores are omitted. Verified with 28 focused tests, typecheck, lint, and diff checks.

<a id="task-145"></a>

### TASK-145 — Redesign league history as a manager explorer

Source: [TASK-145](../backlog/tasks/task-145%20-%20Redesign-league-history-as-a-manager-explorer.md) · Baseline status: Done.

**Recorded intent / important context**

The competition history and surrounding archive sections stack many tables and independent controls into one dense screen. The user chose the Manager Explorer mockup, centered on a persistent manager context and focused views with nearby game evidence.

**Preserve these acceptance criteria**

- [x] #1 A shared manager picker and verified record summary carry context across competition, season history, stories, and profiles.
- [x] #2 Competition, story, and profile categories show one focused view at a time; all existing analytics and league record views remain reachable.
- [x] #3 Rivalry rows and matrix cells open real game evidence beside the selected record, with shared and snapshot navigation preserved.
- [x] #4 Desktop and phone layouts remain keyboard accessible without page-wide overflow; affected tests and type checks pass.

**Recorded delivered behavior (historical)**

Replaced dense stacked history analytics with the chosen manager-centered explorer, focused category navigation, and nearby game evidence. Verified manager context and retained controls, public/snapshot links, full-page season controls, and phone layouts through 77 affected tests and 4 browser tests; lint, typecheck and production build pass. Documented navigation and coverage behavior.
