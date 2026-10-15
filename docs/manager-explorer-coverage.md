# TASK-146 Manager Explorer implementation coverage

Created before production edits on October 14, 2026. No feature reductions are authorized. TASK-147 is excluded. Existing untracked `docs/mockups/` is preserved.

The lead owns shared shell/navigation/tooltips, rankings, profile/connections, league setup/management, integration and final checks. Analytics, Decision support and History agents own separate components and detailed area checklists. Shared calculations, provider services and persistence remain the production baseline.

## Reading the checklist

A checked feature means its preservation impact was reviewed against its contract and the validation below; it does not claim a fresh deployment, live-account verification or a new backup rehearsal for unchanged operational/research work. TASK-72's existing deployed-tenant caveat remains in force. No approval-log exception was used.

The three implementation subagents ran as GPT-6.1 Sol with high reasoning. Work used explicit non-overlapping ownership in the existing application checkout; the lead reviewed every contribution, interfaces, calculations added for bye counting, regressions and production-component screenshots.

## Feature inventory

### Lead

- [x] TASK-3 — Change the theme to be better looking (navigation-and-performance); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-27 — Make report freshness and partial failures visible (navigation-and-performance); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-39 — Add loading bars when loading multiple seasons (navigation-and-performance); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-43 — Dispose session collections after live queries detach (navigation-and-performance); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-53 — caching (navigation-and-performance); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-100 — Redesign the public sign-in page with clear spacing and visible actions (navigation-and-performance); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-104 — Refresh the application visual design and add a fantasy football favicon (navigation-and-performance); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-105 — Match loading placeholder spacing to the refreshed workspace (navigation-and-performance); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-107 — Await session collection disposal in router test teardown (navigation-and-performance); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-119 — Coalesce concurrent cold Sleeper player catalog reads (navigation-and-performance); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-120 — Preload workspace tabs through TanStack Router and shared session queries (navigation-and-performance); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-143 — Reduce report loading latency and move browser forecasts off the main thread (navigation-and-performance); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-13 — Suggest things to write about (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-13.1 — Explain writing-assistant readiness and setup failures (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-13.2 — Cancel a writing-suggestion request (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-13.3 — Ground depth suggestions in current roster ownership (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-15 — Protect ranking drafts across reloads and connection loss (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-16 — Prevent simultaneous editors from silently overwriting rankings (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-17 — Separate private drafts from published ranking editions (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-19 — Show and restore ranking revision history (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-23 — Copy selected content from a previous edition (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-24 — Use the correct historical record in weekly rankings (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-30 — Offer an optional mobile-friendly ranking image (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-33 — Show keyboard shortcuts in the ranking editor (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-63 — When creating a new league in the ranking studio suggest a ranking based on power not necessarily record (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-83 — Prevent autosave revision history from exhausting the ranking document size (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-86 — Prevent delayed publication requests from replacing newer publication decisions (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-88 — Use a finite power-ranking baseline for teams without completed matchups (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-114 — Resolve ESPN ranking-studio matchups by scoring week rather than period ID (rankings); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-6 — Store the espn auth data in in the Auth0 user data rather than in env file (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-7 — Create user profile page (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-8 — Ensure it is possible to reset password through auth0 flow (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-11 — Keep Sleeper co-owner groups separate in manager history (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-20 — Archive leagues without losing their rankings (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-21 — Rename a league in the workspace (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-22 — Remember the last league and edition selection (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-25 — Support identical league IDs across providers and accounts (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-26 — Use season-specific valid week selections (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-31 — Add a guided first-league experience (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-44 — Preserve league setup when visiting ESPN settings (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-59 — Allow deleting and editing leagues via league id as well (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-60 — Fix profile editing to use management api with env vars (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-61 — Allow editing league id associated with a league as well as delete leagues fully (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-70 — allow users to enter their own codex or claude api keys and encrypt and store them by user in the same way the espn cookies are stored (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-72 — Restore Auth0 profile editing (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-84 — Make permanent league deletion safe against concurrent ranking and publication writes (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-85 — Invalidate provider-dependent cached data when a league ID changes (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-87 — Disambiguate league management when external IDs match across providers (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-89 — Save the user's managed team for each league and season (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-97 — Explain the server-managed Codex OAuth path in writing-assistant settings (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-98 — Default current-season week selections to the current NFL week (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-101 — Make managed-team saving reliable and show unsaved changes (accounts-and-leagues); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-1 — Create separate public page for shared insights (sharing); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-1.1 — Allow owners to revoke public report access (sharing); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-1.2 — Give shared reports useful link previews (sharing); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-9 — Publicly accessible page to point of flaws in manager (sharing); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-45 — Reuse public league data for link previews and reports (sharing); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-54 — ESPN sharing snapshot (sharing); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-71 — remove quotes from params (sharing); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-121 — Repair ESPN snapshot links after empty maps are removed during persistence (sharing); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-2 — Implement react compiler (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-10 — Error handling/logging (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-12 — Load the ESPN encryption key during local development (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-14 — Keep missing development settings unset (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-18 — Document and verify backup and recovery (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-32 — Run repeatable checks for every proposed change (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-35 — Keep the local integration check compatible with new server functions (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-38 — Use Ox compiler (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-46 — Eliminate empty stylesheet URLs in router tests (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-47 — Add deterministic ESPN integration coverage (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-48 — Make the repository format check enforceable (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-62 — Add example values commented out to docker-compose file for easy configuration (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-64 — Run deterministic browser checks serially in CI (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-65 — Update ranking-editor test fixtures for getMatchups (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-66 — Make insights refresh-status test timezone independent (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-67 — Remove transient transform assertion from reduced-motion drag tests (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-68 — Keep league-provider selection responsive in the creation form (operations); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-96 — Evaluate additional NFL analytics and projection providers (operations); preservation reviewed — see validation evidence and area checklists below.

### Analytics

- [x] TASK-4 — Improve documentation of how calculations are done (season-insights); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-5 — Add displays of basic stats in current and previous seasons display (season-insights); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-28 — Compare two managers over selected seasons (season-insights); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-29 — Download report tables as CSV (season-insights); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-40 — Average regular season placement as well as end of season placement in separate columns (season-insights); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-50 — Figure out historical records of best vs best for players left on bench (season-insights); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-51 — Figure out top possible scoring weeks ever for the best lineup for each player (season-insights); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-52 — Figure out historical starting accuracy, aka if a player on the bench outscored a player in the lineup for each manager (season-insights); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-108 — Show position group rankings and roster projection charts in Season Insights (season-insights); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-109 — Quantify remaining fantasy schedule strength in Season Insights (season-insights); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-111 — Toggle position strength between remaining projections and completed-week actual points (season-insights); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-113 — Preserve the configured season start when measuring completed position coverage (season-insights); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-34 — Use Markov chains or other statistics methods to project who will make playoffs (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-36 — Move playoff simulation into its own tab (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-37 — Include projections for simulations (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-41 — Use the league's settings in the playoff simulation (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-42 — Allow simulations for playoffs starting in week 1 but add disclaimer about inaccuracy (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-49 — Ensure projections for playoffs include players on the bench (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-55 — Use real schedules and player availability in playoff forecasts (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-56 — Measure and improve playoff forecast uncertainty and accuracy (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-57 — Load next-week projections at the first playoff-round boundary (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-69 — Add a toggle to the playoff simulation screen that changes to histogram mode (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-73 — Add historical season-level playoff calibration and convergence chart (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-74 — Export playoff calibration data for model review (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-75 — Compare playoff forecasts with standings and separate predictive diagnostics (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-76 — Fix ESPN historical playoff qualification loading (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-77 — Apply season-specific playoff qualification and bracket rules (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-78 — Evaluate playoff forecast uncertainty across both leagues (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-79 — Compare My Fantasy Analyzer outlook with our Sleeper forecast (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-80 — Use best legal projected lineups throughout remaining season simulations (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-81 — Archive one as-of playoff forecast per league week (playoffs); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-116 — Keep uncached playoff simulations from blocking interactive rendering (playoffs); preservation reviewed — see validation evidence and area checklists below.

### Decision support

- [x] TASK-90 — Add a weekly overview of the user's teams across all leagues (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-91 — Expose a weekly lineup advisor with suggested starter and bench swaps (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-92 — Recommend league-available waiver pickups and corresponding roster drops (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-93 — Evaluate proposed trades using roster and weekly lineup impact for both teams (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-94 — Add searchable player profiles and comparisons scored for the selected league (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-95 — 'Show actionable injury, bye-week, and lineup-risk alerts for managed teams' (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-99 — Combine ESPN and Sleeper player projections for either league provider (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-102 — Improve trade analyzer usability and remove drop controls (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-103 — Improve Players tab browsing and comparison usability (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-106 — Default Live matchups to the viewer’s managed teams in the first four leagues (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-110 — Suggest possible trades for the user's team in the selected league (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-112 — Keep unusable Sleeper live projections unavailable instead of zero (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-115 — Make Player Profiles refresh invalidate cached season reports (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-117 — Fetch live data only for the selected league in Players and Trade Analyzer (decision-support); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-118 — Retain player names and primary positions for historical profile browsing (decision-support); preservation reviewed — see validation evidence and area checklists below.

### History

- [x] TASK-122 — Show all-time manager head-to-head records and rivalries (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-123 — Add historical expected wins and completed-season schedule difficulty (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-124 — Add a cross-season Elo manager power ranking (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-125 — Create a league Hall of Fame and Hall of Shame record book (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-126 — Detect fantasy manager dynasties and competitive eras (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-127 — 'Rate historical playoff performance, clutch results and choking' (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-128 — Build an all-time matchup and scoring record book (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-129 — Add a weekly loss Pain Index (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-130 — Track Monday night fantasy comebacks and miracles (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-131 — Replay historical matchup win probability (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-132 — Compare draft picks with draft position and measure manager draft skill (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-133 — Track players managers dropped before breakout weeks (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-134 — Add perfect-lineup records and retrospective start-sit regret (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-135 — 'Show league trade networks, trade partners and trade trees' (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-136 — Expand trade evaluation beyond short-term scoring windows (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-137 — Summarize manager transaction activity and tinkering tendencies (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-138 — Identify manager nemesis and guardian-angel players (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-139 — Track manager player loyalty and historical ownership (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-140 — Show fantasy soulmate drafting overlap and draft steals (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-141 — Create evidence-based manager archetypes (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-142 — Generate shareable personal and league Fantasy Wrapped recaps (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-144 — Use single-week playoff scores for all-time scoring highs (league-history); preservation reviewed — see validation evidence and area checklists below.
- [x] TASK-145 — Redesign league history as a manager explorer (league-history); preservation reviewed — see validation evidence and area checklists below.

## Area evidence

- [Analytics](manager-explorer-analytics-coverage.md): exact weekly evidence/coverage and filtered CSV; strength modes and charts; schedules; manager reports; full forecast rounds and exact bye counters; Advanced diagnostics, cancellation and replay.
- [Decision support](manager-explorer-decision-coverage.md): all managed leagues, complete lineup/waiver scenarios, comparison provenance, two-sided trades and editable ideas, four-game Live board with full names/statuses allowed to wrap and independent roster scrolling.
- [History](manager-explorer-history-coverage.md): every competition/season/moments/profile/archive view, focused manager/year context, personal/league Wrapped, immutable snapshots/sharing, and detailed tables/CSV even with no selectable managers.
- Lead: focused team authoring and retained edit-all mode, unchanged export rendering/styles, save/recovery/conflict/copy/revision/publication paths, per-provider consent/cancel/model/source context, account identity/verification/recovery, private key/cookie forms, managed team selection and league mutations/onboarding.

## Required integration evidence

- [x] Seven primary destinations, secondary tool active state/deep links and compact Live profile menu.
- [x] Account/league/season/team selections, keyboard/focus, accessible tooltips and responsive/partial states.
- [x] Ranking edits, autosave/manual save, reorder/undo, recovery/conflicts, copy/revisions/publication; unchanged original/compact PNG baselines.
- [x] Writing readiness/model/provider/consent/revocation/cancellation and roster evidence; keys remain private.
- [x] Profile identity/verification/recovery, encrypted keys/cookies, archive/restore/delete safeguards and onboarding return.
- [x] Analytics, decisions and history subagent checklists reviewed and contributions integrated.
- [x] Real CSV/JSON downloads, sharing/revocation/snapshots and cancellation regression coverage.
- [x] Full component/browser tests, typecheck, lint, format check, production build and diff review.
- [x] Production-component screenshots reviewed against approved references, including four required Live sizes.

## Design conventions

Use the approved system sans (14px body; 28/20/16px headings), navy #17223b header/text, #f3f5fb workspace, white surfaces, #3949ab selected controls and #eef1ff selection fill. Keep context near the work, focused views and adjacent evidence. Styling must never reach ranking export descendants. Keep source/coverage/error notices and actionable controls available; use tooltips only for definitions.

## Integration validation — October 14, 2026

- Final full component/server/provider/calculation suite: 761 passed across 150 files, with one pre-existing opt-in live dual-source provider test skipped (762 total). This covers owner isolation, credential redaction, caching, disposal, provider week semantics, legal lineups, draft/conflict/revision/publication, sharing/revocation/expiration and immutable archive behavior.
- Full Chrome suite: 71 passed; the four final account/navigation/writing checks also passed again after the final account-isolation and remembered-edition safeguards. Original and compact downloaded PNGs match the existing baselines with no changed pixels; original exports checked at 1440px and 390px. Real emitted CSV and replay JSON bytes were inspected. Forecast worker parity/responsiveness remains bounded.
- Live verified at 1440×900, 2048×942, 1280×720 and phone widths. Standard 18-player rosters fit the 1440px fixture; larger/longer real rosters scroll independently. Long names and injury statuses wrap rather than disappearing. Phone rosters remain in page flow.
- Production-component screenshots reviewed against the approved mockups: rankings, profile/connections, tools/navigation, league forms, all seven analytics views, Advanced evaluation, overview/advisors, players/trades, all History views/Wrapped and Live. Browser evidence uses deterministic test-only provider data; production calculations/components render the screens.
- Final integration fixes preserve password recovery during profile API errors, prevent consent/readiness/evidence crossing API/account identity, retain no-manager detailed History exports, add explicit per-row weekly coverage, and avoid trace artifacts triggering browser reloads. Existing meaningful assertions and image baselines are retained.
- Mockups remain untouched review assets. Their global-script architecture is excluded from production lint/format checks; generated browser artifacts are ignored as artifacts. No calculation fixtures, simulated actions or mock services were introduced into production.

## Validation boundary and retained limitations

No live Sleeper/ESPN account, Auth0 tenant email delivery, operator CLI quota, production publication or deployment was exercised. The optional live HTTP/Mongo integration harness was not run; deterministic server/provider/ownership tests passed. Current-week trade/waiver horizons, unavailable overview power ranking, unsupported brackets, source coverage and Live remaining-time fractions remain explicitly disclosed by the existing production models. No personal Codex account connection flow or new ranking export theme is introduced. TASK-147, export.css, RankingPreview and PNG baselines are unchanged.

Final gates: `npm test -- --maxWorkers=4` (761 pass, one opt-in live-provider skip), `npx playwright test --workers=2 --output=test-results-verified` (71 pass), final focused account/navigation Chrome rerun (4 pass), `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run build`, and `git diff --check` all passed. No required implementation remains; TASK-146 is complete. No deployment, merge, commit or unrelated cleanup was performed.
