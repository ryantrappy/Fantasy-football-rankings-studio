# Accounts, credentials, and league management: preservation contracts

Read only when this area or a shared dependency is affected. Start at the [feature index](../feature-preservation.md). Any reduction requires explicit user approval recorded in the [approval log](approved-changes.md) before implementation.

## Important constraints

- **Use the league's actual context.** Provider, workspace, account, manager group, season, scoring week, roster slots, scoring rules, and playoff configuration are distinct identities/inputs. Same external league IDs can coexist without crossing ownership boundaries (TASK-11, TASK-24–TASK-26, TASK-41, TASK-77, TASK-87, TASK-114).

## Related areas and verification

Also read sharing for public access/snapshots, rankings for deletion/draft impact, and navigation-and-performance for private cache/session changes. Area names refer to files linked in the index; follow only relevant dependencies.

Useful references/checks (starting points, not a substitute for inspecting affected code):

- [ManageLeagues.test.tsx](../../src/components/ManageLeagues.test.tsx)
- [ProfilePage.test.tsx](../../src/components/ProfilePage.test.tsx)
- [league-setup-draft.test.ts](../../src/league-setup-draft.test.ts)

## Feature contracts

Stable IDs trace to the original backlog. Criteria are requirements, not evidence that today’s code or deployment was tested. Load source requests/history only to resolve a specific detail. Later completed corrections refine earlier implementation details.

### TASK-6 — Store the espn auth data in in the Auth0 user data rather than in env file

- ESPN credentials are encrypted in MongoDB and scoped exclusively to the verified Auth0 subject; saved cookie values never return through client APIs.
- Users can optionally supply ESPN cookies immediately after signup/sign-in, skip setup, and later replace or remove their credentials.
- Authenticated ESPN operations use only that user's credentials; public reports and Sleeper requests never load them, and ESPN environment-cookie fallback is removed.

Source: [TASK-6](../../backlog/tasks/task-6%20-%20Store-the-espn-auth-data-in-in-the-Auth0-user-data-rather-than-in-env-file.md).

### TASK-7 — Create user profile page

- Keep the profile page and navigation entry, identity/email-verification display, and name/nickname editing.
- Use the verified JWT subject and server-only Management API; reject arbitrary identity/privilege fields. Preserve drafts, loading, retry and save feedback.

Source: [TASK-7](../../backlog/tasks/task-7%20-%20Create-user-profile-page.md).

### TASK-8 — Ensure it is possible to reset password through auth0 flow

- Keep password recovery entry points on sign-in and profile through Auth0 Universal Login, preserving the return path.
- Explain hosted recovery and external-provider passwords; retain pending, failure and retry states. Tenant email delivery requires separate deployment verification.

Source: [TASK-8](../../backlog/tasks/task-8%20-%20Ensure-it-is-possible-to-reset-password-through-auth0-flow.md).

### TASK-11 — Keep Sleeper co-owner groups separate in manager history

- Sleeper team identity includes the primary owner and all co-owners, independent of their ordering.
- Changing a co-owner produces a separate historical manager record while renamed teams with unchanged owners stay together.
- Tests cover reordered co-owners, changed groups, and a roster with no owner.

Source: [TASK-11](../../backlog/tasks/task-11%20-%20Keep-Sleeper-co-owner-groups-separate-in-manager-history.md).

### TASK-20 — Archive leagues without losing their rankings

- Owners can archive and restore a league with clear feedback.
- Archived leagues are hidden from the default active picker but remain discoverable in an archive view.
- Archiving retains existing editions and does not change public visibility implicitly.

Source: [TASK-20](../../backlog/tasks/task-20%20-%20Archive-leagues-without-losing-their-rankings.md).

### TASK-21 — Rename a league in the workspace

- Owners can edit a league's display name and cancel without saving.
- Blank names and unreasonable lengths are rejected with accessible feedback.
- Renaming does not modify the provider's league or unexpectedly rewrite existing edition titles.

Source: [TASK-21](../../backlog/tasks/task-21%20-%20Rename-a-league-in-the-workspace.md).

### TASK-22 — Remember the last league and edition selection

- A returning account resumes its last valid league, season and week when no explicit URL selection is supplied.
- Explicit URL selections take precedence over remembered values.
- Unavailable or archived selections fall back safely, and selections do not leak across accounts.

Source: [TASK-22](../../backlog/tasks/task-22%20-%20Remember-the-last-league-and-edition-selection.md).

### TASK-25 — Support identical league IDs across providers and accounts

- Sleeper and ESPN leagues with the same numeric ID can coexist.
- Two accounts can independently register the same external league without gaining access to one another's drafts or credentials.
- Existing league records and share links have a documented migration path with ownership-isolation regression coverage.

Source: [TASK-25](../../backlog/tasks/task-25%20-%20Support-identical-league-IDs-across-providers-and-accounts.md).

### TASK-26 — Use season-specific valid week selections

- Week choices reflect the supported schedule for the selected league and season.
- Unavailable selections receive a clear explanation and a safe way to choose another week.
- Historical editions remain accessible and preseason behavior is explicitly defined.

Source: [TASK-26](../../backlog/tasks/task-26%20-%20Use-season-specific-valid-week-selections.md).

### TASK-31 — Add a guided first-league experience

- An account with no leagues has a clear first action and provider-specific guidance for locating its league ID.
- Private ESPN setup requirements are explained before a failed import becomes the user's first feedback.
- After successful creation, the user reaches the new league's editor with a concise explanation of writing, saving and exporting.

Source: [TASK-31](../../backlog/tasks/task-31%20-%20Add-a-guided-first-league-experience.md).

### TASK-44 — Preserve league setup when visiting ESPN settings

- Opening ESPN settings from league creation uses application navigation and preserves the non-secret league form values for the current account.
- Saving or intentionally skipping ESPN credential setup returns the user to league creation with the preserved values and a clear next action.
- Completing or cancelling league creation clears the temporary form state, and no ESPN cookies or account tokens are stored with it.

Source: [TASK-44](../../backlog/tasks/task-44%20-%20Preserve-league-setup-when-visiting-ESPN-settings.md).

### TASK-59 — Allow deleting and editing leagues via league id as well

- Rename accepts either the app workspace league ID or the external provider league ID.
- Archive and restore accept either identifier and continue enforcing owner isolation.
- Focused tests cover provider-ID rename/archive behavior and documentation explains the accepted identifiers.

Source: [TASK-59](../../backlog/tasks/task-59%20-%20Allow-deleting-and-editing-leagues-via-league-id-as-well.md).

### TASK-60 — Fix profile editing to use management api with env vars

- Profile reads and updates work when server-only Auth0 M2M credentials are configured, using AUTH0_MANAGEMENT_DOMAIN or a validated AUTH0_ISSUER_BASE_URL fallback.
- The client cannot select another account or modify fields beyond name and nickname; management secrets remain server-only.
- Configuration examples and tests cover deployment setup and missing/invalid values.

Source: [TASK-60](../../backlog/tasks/task-60%20-%20Fix-profile-editing-to-use-management-api-with-env-vars.md).

### TASK-61 — Allow editing league id associated with a league as well as delete leagues fully

- Manage leagues lets an owner change a league's external provider ID after validating the target with its existing provider.
- A confirmed deletion removes the owned workspace and its local rankings, publications, and report snapshots, but never deletes the provider league.
- Both operations remain owner-scoped, handle invalid/duplicate IDs safely, and have focused UI/service coverage plus documentation.

Source: [TASK-61](../../backlog/tasks/task-61%20-%20Allow-editing-league-id-associated-with-a-league-as-well-as-delete-leagues-fully.md).

### TASK-70 — allow users to enter their own codex or claude api keys and encrypt and store them by user in the same way the espn cookies are stored

- Keep optional encrypted per-user OpenAI/Codex and Anthropic/Claude key save/replace/remove controls; browser APIs return status only.
- Bind AES-256-GCM storage to the verified owner. Inject only the requesting user’s matching key into the isolated temporary CLI environment; preserve redaction and secret isolation.
- Keep server-managed CLI login as fallback and document configuration, backup and account/quota behavior.

Source: [TASK-70](../../backlog/tasks/task-70%20-%20allow-users-to-enter-their-own-codex-or-claude-api-keys-and-encrypt-and-store-them-by-user-in-the-same-way-the-espn-cookies-are-stored.md).

### TASK-72 — Restore Auth0 profile editing

**Completion caveat:** Marked Done, but source criteria remain unchecked and no final summary exists. Preserve TASK-7/TASK-60 behavior; deployed tenant verification is unconfirmed by this record.

- The current signed-in user's profile can be loaded and saved through the deployed Auth0 tenant.
- The Auth0 application has only the Management API access needed to read and update users.
- Automated coverage reproduces the identified failure mode and prevents regression without exposing credentials or upstream response bodies.
- Relevant configuration and verification guidance reflects the working deployment requirements.

Source: [TASK-72](../../backlog/tasks/task-72%20-%20Restore-Auth0-profile-editing.md).

### TASK-84 — Make permanent league deletion safe against concurrent ranking and publication writes

- Once permanent deletion succeeds, the workspace's rankings, revision data, report snapshots, and published links are unavailable, including when authorized writes were already in flight.
- A public edition whose source workspace has been deleted returns an unavailable response even if an orphan publication remains.
- Failure partway through deletion can be retried safely with a documented, consistent outcome; unrelated owner workspaces and upstream provider leagues remain intact.
- Deterministic tests cover create/publish interleavings, interrupted cleanup, retry, and cross-owner isolation.

Source: [TASK-84](../../backlog/tasks/task-84%20-%20Make-permanent-league-deletion-safe-against-concurrent-ranking-and-publication-writes.md).

### TASK-85 — Invalidate provider-dependent cached data when a league ID changes

- After a provider ID update, the next season and insights reads use the new association, including historical reports with infinite staleTime.
- Requests started before the association change cannot repopulate the workspace cache with old-provider results.
- Invalidation is scoped to the affected workspace and preserves unrelated leagues' cached reports and saved editions.
- Client regression coverage primes caches, changes provider ID, and verifies fresh current/historical data and delayed-request behavior.

Source: [TASK-85](../../backlog/tasks/task-85%20-%20Invalidate-provider-dependent-cached-data-when-a-league-ID-changes.md).

### TASK-87 — Disambiguate league management when external IDs match across providers

- Workspace-ID management resolves the exact workspace, and ambiguous external-ID management cannot modify or delete an arbitrary match.
- Owners can explicitly resolve an external-ID collision using the provider or workspace identity; ownership checks remain enforced.
- Manage leagues renders and edits same-external-ID workspaces independently without duplicate React keys.
- Tests cover rename, archive, provider-ID change, and delete with same-owner cross-provider collisions and preserve legacy unambiguous identifier behavior.

Source: [TASK-87](../../backlog/tasks/task-87%20-%20Disambiguate-league-management-when-external-IDs-match-across-providers.md).

### TASK-89 — Save the user's managed team for each league and season

- An owner can select, change, or clear their managed team for a registered league and season, and the choice survives browser/device changes.
- Only teams from that owned league and selected season can be associated; other accounts cannot read or alter the association.
- Season rollover, unavailable teams, and provider-ID changes trigger validation or reselection rather than silently mapping to another roster.
- The UI supports an unselected/commissioner mode and tests cover two owners, two leagues, and differing season team identities.

Source: [TASK-89](../../backlog/tasks/task-89%20-%20Save-the-users-managed-team-for-each-league-and-season.md).

### TASK-97 — Explain the server-managed Codex OAuth path in writing-assistant settings

- Writing-assistant settings explain both optional per-user API keys and the existing server-managed Codex account path without implying an API key is required.
- An allowlisted user can see server-provider readiness and a useful distinction between disabled, missing CLI, and login-check failure, with a link to the Docker OAuth setup instructions.
- The UI explains that server-managed use shares the administrator's account/quota and that a saved per-user key takes precedence; it offers the existing remove-key action when appropriate.
- No OAuth tokens, credential files, or other users' identifiers are exposed to browser/shared reports, and tests cover OAuth-ready, disabled, and saved-key states.

Source: [TASK-97](../../backlog/tasks/task-97%20-%20Explain-the-server-managed-Codex-OAuth-path-in-writing-assistant-settings.md).

### TASK-98 — Default current-season week selections to the current NFL week

- For the current NFL season, initial selection and league/current-season switches default to the current scoring week when no explicit week selection applies, including when the current week is greater than 1.
- Explicit URL and manual week selections take precedence and remain stable during data refreshes; returning in a later NFL week with stale stored selection follows a documented policy that allows the default to advance.
- Defaults use authoritative season/week state and resolve to a week supported by the selected league. Preseason, offseason, season rollover, unavailable provider state, and historical seasons have documented deterministic fallbacks and never select an unsupported postseason week.
- Regression coverage verifies current-week defaults, league and season switches, explicit selections, stale remembered state, historical seasons, valid-week boundaries, and provider-state failure.

Source: [TASK-98](../../backlog/tasks/task-98%20-%20Default-current-season-week-selections-to-the-current-NFL-week.md).

### TASK-101 — Make managed-team saving reliable and show unsaved changes

- A validated managed-team choice persists and reloads for the same owned league and season.
- Successful persistence does not report failure merely because a redundant provider read fails after the database write.
- Unsaved selections and save progress are clearly visible; failures preserve the choice for retry and server validation errors are useful.
- Regression tests cover save/reload, provider outages and UI save feedback.

Source: [TASK-101](../../backlog/tasks/task-101%20-%20Make-managed-team-saving-reliable-and-show-unsaved-changes.md).

### TASK-146 — Focused profile and league connections

- Profile details, Writing connections and ESPN settings are focused retained views. Account identity/email verification and unsaved edits remain; password recovery and onboarding settings stay reachable even if the profile API fails.
- Server-managed Codex explicitly describes operator login/readiness, shared account/quota, setup and personal-key precedence. Existing encrypted key save/replace/remove and cookie flows remain; no personal Connect Codex action is added.
- League management focuses one selected workspace while preserving independent provider/workspace identities, rename/provider-ID updates, managed-team selection/clearing, active/archive restore and exact-name permanent-deletion safeguards.
- See [integration coverage](../manager-explorer-coverage.md) for component/browser and owner/privacy verification. The existing TASK-72 deployed-tenant caveat is unchanged.
