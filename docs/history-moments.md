# Historical moments

## TASK-130: Monday comebacks

Threshold defaults to 10% and is adjustable. Only a completed, reciprocal matchup won by the archived team can qualify; ties and losses never do. Probability is the archive author's supplied estimate, never derived from final results. Contributors are supplied scoring events after the explicit pre-Monday checkpoint; omitted contributors remain unknown. Current provider endpoints do not offer retrospective in-game checkpoints.

Use the Moments archive importer with a JSON array of these records. Archives are user-supplied evidence: the author must verify the checkpoint occurred before the relevant Monday kickoff. UTC date strings alone cannot establish an NFL kickoff schedule. No score/projection interpolation or implied full coverage occurs. Imports are temporary in the current view; use Export archive to retain them, then import again later. The optional SeasonInsights.matchupArchive field also roundtrips through saved report snapshots for applications supplying it before snapshot creation. Credentials and extra fields are stripped; exports include public player/team identifiers only.

```json
[{"week":1,"teamId":"1","opponentTeamId":"2","source":"Service export, captured live","preMondayAt":"2025-09-08T23:00:00.000Z","snapshots":[{"capturedAt":"2025-09-08T23:00:00.000Z","probability":0.05,"contributors":[]},{"capturedAt":"2025-09-09T03:00:00.000Z","probability":1,"contributors":[{"playerId":"123","points":27}]}]}]
```

Import validates size, bounded counts, finite scores/probabilities, probability range, increasing timestamps, explicit checkpoint and verified completed opponents. Source labels establish provenance, not independent certification. Raw provider transactions are retained with explicit weeks/types/coverage; absence never implies a complete history, and waiver subtype is unsupported.

## TASK-131: Matchup probability replay

The replay plots supplied chronological checkpoint probabilities on a time-proportional axis. The accessible table is authoritative for exact timing, changes and available contributors. A change of at least 20 percentage points is labeled a major swing. Events are supplied by the archive and do not establish independent causality. Lines join known points; nothing fills the unknown intervals. At least two checkpoints are required. Season and manager controls apply to replay archives. Report snapshot validation preserves the archive and strips unknown fields, including credentials.

## TASK-132: Draft value and skill

Completed historical Sleeper drafts are read from the resolved season's league drafts endpoint and its draft picks endpoint ([provider contract](https://docs.sleeper.com/#get-all-picks-in-a-draft)). Multiple drafts, unassigned picks and endpoint failures remain explicit gaps. ESPN draft data, ADP and private queues are currently unavailable. Format is preserved; unknown/auction formats are unranked.

The baseline averages other drafted players within one league-width of overall pick, with at least two observed peers. Production sums the configured completed season weeks using league-scored player records; every week must be present and duplicate observations must agree. Free agent weeks absent from roster scoring are unknown, never zero. Best/worst pick ordering uses points above baseline. Cross-season skill averages relative points above baseline within format and stable provider manager identity; missing manager keys stay season-specific. Sample sizes and seasons are displayed. This is a local draft-position comparison, not an external ADP prediction or a causal ability measure.

## TASK-133: Dropped-player breakouts

The default three-week scoring window is configurable from one to six weeks. The transaction week is excluded because lineup locks are not available. Baseline is the player's mean of at least two observed scores in the previous three weeks, excluding the drop week. Output and positive breakout lift require every requested subsequent week through the completed cutoff; future and unobserved scores remain missing. Only the requested window counts. Player scoring uses the league's actual provider values, including bench records when available.

Observed pickup dates identify the next recorded availability transition. No intervening free-agent ownership is guessed, and an absent pickup never implies continued availability. Coverage notes explain missing transaction history; incomplete player histories stay unranked. These are observed drops and later performances, not proof that the manager could have started or reacquired the player.

## TASK-134: Perfect lineups and regrets

Providers now preserve the actual optimizer-selected player IDs and explicitly mark full weekly roster scoring/position coverage. Old reports without these fields remain unavailable for decision-level conclusions. Sleeper uses verified roster player lists, league roster slots and player positions; ESPN excludes IR, respects saved slot eligibility and requires observed points/positions for every eligible roster entry. The existing legal lineup optimizer provides selections. Starter totals must match actual team points, excluding commissioner overrides that cannot be allocated to players.

Each completed reciprocal matchup shows actual, optimal points, unilateral outcome against the actual opponent, and the outcome when both opponents optimize. Both-optimal W–L–T counts require coverage for both teams. The largest supported regret each week names the legal start/sit set, points gap and unilateral outcome consequence. This is hindsight; it does not assume the manager had advance scoring information. Unavailable matchups remain visible and are excluded from records.

## TASK-135: Trade networks and trees

Partner counts count unique transaction IDs per season, regardless of the number of player moves. Multi-party trades count once for each participating pair. Underlying transaction anchors retain season and ID. Stable manager keys link partner relationships across selected seasons; names are display labels and never identity joins.

Asset trails follow same-season player IDs through their next observed ownership movement. Confirmed continuity requires matching receiving/sending team and complete coverage of trade, drop and pickup records in every intervening week. Missing coverage labels the next observation as unverified continuity; intervening drops/pickups break a trade-only lineage. No cross-season continuity is asserted without a boundary ownership archive. Pick-bearing trade IDs persist into saved snapshots, including pick-only trades whose player participants are unknown. Draft pick lineage/value, unresolvable assets and future value are explicitly unresolved. Providers with incomplete transaction history cannot produce confirmed uninterrupted holdings.
