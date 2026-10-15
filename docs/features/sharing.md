# Sharing and public reports: preservation contracts

Read only when this area or a shared dependency is affected. Start at the [feature index](../feature-preservation.md). Any reduction requires explicit user approval recorded in the [approval log](approved-changes.md) before implementation.

## Important constraints

- **Keep reports shareable and private data private.** Public reports reuse analytics without the rankings builder or repeated Auth0 initialization. Public ESPN requests never use environment or account cookies. Private ESPN sharing serves a uniquely identified stored snapshot of the displayed data, not a fresh provider fetch; preserve revocation and ten-day expiration (TASK-1, TASK-6, TASK-54).
- **Preserve the special direct-only report.** TASK-9 requests a separate publicly accessible manager critique page reachable directly. Its delivered contract keeps it out of navigation, uses noindex metadata, and presents measured fantasy-league evidence and coverage.

## Related areas and verification

Also read accounts-and-leagues for credential/ownership changes, playoffs or league-history for changes to shared report content, and navigation-and-performance for public cache changes. Area names refer to files linked in the index; follow only relevant dependencies.

Useful references/checks (starting points, not a substitute for inspecting affected code):

- [calculations.md](../calculations.md)
- [ReportSharing.test.tsx](../../src/components/ReportSharing.test.tsx)

## Feature contracts

Stable IDs trace to the original backlog. Criteria are requirements, not evidence that today’s code or deployment was tested. Load source requests/history only to resolve a specific detail. Later completed corrections refine earlier implementation details.

### TASK-1 — Create separate public page for shared insights

- Use the same components as internal but don't display the power rankings builder tab.
- Auth should be done in a way where it is not checked every rerender so the tabs are static
- If an espn league is shared don't use the env variable ever for the public versions

Source: [TASK-1](../../backlog/tasks/task-1%20-%20Create-separate-public-page-for-shared-insights.md).

### TASK-1.1 — Allow owners to revoke public report access

- Owners can disable public access to their season and history reports and see the current sharing state.
- Disabled access is enforced for direct URLs and report data requests, including previously issued links.
- The chosen behavior for existing shared links is documented; owner access continues to work.

Source: [TASK-1.1](../../backlog/tasks/task-1.1%20-%20Allow-owners-to-revoke-public-report-access.md).

### TASK-1.2 — Give shared reports useful link previews

- Public report pages expose a meaningful page title and description based on public league and season context.
- Preview metadata contains no private account identifiers, credentials or unpublished prose.
- Invalid or unavailable reports use a safe generic preview and do not expose provider errors.

Source: [TASK-1.2](../../backlog/tasks/task-1.2%20-%20Give-shared-reports-useful-link-previews.md).

### TASK-9 — Publicly accessible page to point of flaws in manager

- Keep /shared/konz-sux publicly accessible by direct URL, separate from application navigation, with noindex/nofollow metadata.
- Keep the fixed public Sleeper league 1312529175982129152 and konz4 target, following up to six linked seasons.
- Show measured negative scoring, trades, pickups and same-position draft hindsight evidence, sample sizes, source links and missing-data states. Keep confirmed finishes, including championships, and disclose critical selection.
- Preserve cached/deduplicated reads and readable phone layout.

Source: [TASK-9](../../backlog/tasks/task-9%20-%20Publicly-accessible-page-to-point-of-flaws-in-manager.md).

### TASK-45 — Reuse public league data for link previews and reports

- An initial shared-report navigation performs no more than one public league lookup for both metadata and visible page context.
- Client navigation between shared report tabs reuses valid cached public league data while still respecting sharing revocation and normal freshness rules.
- Metadata and visible report state agree when a league is unavailable, and generic previews continue to hide provider errors and private fields.

Source: [TASK-45](../../backlog/tasks/task-45%20-%20Reuse-public-league-data-for-link-previews-and-reports.md).

### TASK-54 — ESPN sharing snapshot

- Sharing a loaded owner ESPN report saves the displayed season data in a new database collection and returns a unique snapshot link.
- Anonymous snapshot reads use only stored report data and require no ESPN cookies or provider calls.
- Snapshot creation verifies league ownership; saved/public data excludes cookies and account metadata; disabling league sharing blocks snapshot reads.
- The viewer identifies when the snapshot was saved, keeps report views inside the saved seasons, and provides actionable errors for unavailable links or failed saves.
- Tests cover persistence, isolation, public rendering and sharing; documentation describes snapshot behavior.
- Snapshots expire 10 days after creation, are denied immediately after expiration, and are automatically deleted even when the application was offline at the expiration time.

Source: [TASK-54](../../backlog/tasks/task-54%20-%20ESPN-sharing-snapshot.md).

### TASK-71 — remove quotes from params

- Emit numeric leagueId query values without JSON quotes in copied shared links and tab navigation.
- Continue accepting matching quoted legacy numeric IDs at parsing/report boundaries. Preserve default query serialization for other parameters.

Source: [TASK-71](../../backlog/tasks/task-71%20-%20remove-quotes-from-params.md).

### TASK-121 — Repair ESPN snapshot links after empty maps are removed during persistence

- New snapshots retain empty projection and playoff-rule maps through Mongoose serialization.
- Previously stored snapshots missing empty required maps load without ESPN access while malformed map values remain rejected.
- The reported local snapshot URL displays its saved report.

Source: [TASK-121](../../backlog/tasks/task-121%20-%20Repair-ESPN-snapshot-links-after-empty-maps-are-removed-during-persistence.md).

## TASK-146 usability iteration — October 14, 2026

The usability iteration groups sharing controls in an accessible command-bar disclosure. Privacy, private ESPN snapshot/expiry caveats, enabled/disabled state, fallback links, errors and real owner revocation remain alongside the actions before use. Escape returns focus to the disclosure; outside clicks dismiss it. Existing public/private snapshot services and identity boundaries are unchanged. See [UI regression guidance](../ui-testing.md).
