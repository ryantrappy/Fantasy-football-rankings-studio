# Additional NFL data providers

TASK-96 research, checked October 4, 2026. NFL remains the only sport. This is a delivery recommendation, not a live integration or a claim that another projection source is more accurate.

## Source comparison

| Source                           | Access and cost                                                                                                                                                        | Useful coverage                                                                                                      | Constraints and verification                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing Sleeper / ESPN adapters | Existing workspace connection; no additional subscription configured                                                                                                   | League membership, rosters, settings, matchups and the current analytics inputs                                      | Remain authoritative for ownership and custom scoring. Existing provider limitations remain; an enrichment feed cannot prove fantasy waiver availability.                                                                                                                                                                                                                                |
| FantasyPros                      | REST API key; free sample/non-production tier. Personal production access through HOF, advertised from $8.99/month with annual billing; commercial licensing is custom | NFL weekly and rest-of-season stat projections, consensus ranks, player metadata/cross-references, injuries and news | Account entitlement, rate limits, historical availability and redistribution permission are unverified for this deployment. Public sharing needs an applicable license. See [official API product and pricing](https://www.fantasypros.com/api-data/).                                                                                                                                   |
| SportsDataIO                     | Subscription API key; production cost requires a quote/plan check                                                                                                      | Weekly player stat projections, NFL schedules, injuries and stable player identifiers                                | Confirm NFL trial entitlement: developer pages contain conflicting trial notes. [NFL API documentation](https://sportsdata.io/developers/api-documentation/nfl) and [licensing FAQ](https://sportsdata.io/help/data-rights-and-licensing-questions). Trial numbers may be adjusted 5–20%, so they cannot validate accuracy: [scrambled data](https://sportsdata.io/help/scrambled-data). |
| nflverse                         | Public downloads and open-source tooling; no paid production access verified or required by the overview                                                               | Historical play-by-play and NFL analysis tools; a candidate for explaining observed performance                      | Not established here as a forward projection service. Code licensing does not grant blanket rights to underlying data; review each dataset's owner/terms before ingestion or sharing. [Official overview and terms](https://nflverse.nflverse.com/).                                                                                                                                     |

No paid account was opened, key requested, or authenticated feed queried. Live response contracts, identity coverage and service reliability remain unverified. Prices and product entitlements may change.

## Recommended first delivery

Evaluate **FantasyPros weekly projections for a private, read-only player comparison** first, conditional on suitable access and licensing. Its advertised raw stat lines permit league-specific scoring and its identity cross-references may reduce matching work. This is a product-fit inference, not verified superiority. If access or licensing fails, retain the current source and evaluate SportsDataIO next. Historical nflverse enrichment is a separate later slice.

Start with offensive players already present in one owned Sleeper league. Show the existing and additional projections side by side on `/players`, with source, scoring coverage, timestamp and week. Do not average them automatically or change lineup/waiver/trade recommendations until a historical comparison supports that decision. No snaps, targets, rest-of-season totals, confidence intervals, individual defensive players or kicker/defense predictions should appear unless the contracted feed supplies and validates those fields.

## Integration boundaries

- Keep `LeagueType` and persisted league/ranking IDs unchanged. Store enrichment separately; published editions remain immutable and exclude newly licensed data by default. Never derive team ownership from an NFL roster feed.
- Scope observations by source, source player ID, NFL season, season phase and week. Use explicit cross-provider ID mappings, not names. Quarantine missing/ambiguous mappings and retain unmatched coverage counts. Do not manufacture IDs for rookies or defenses.
- Normalize raw stats then apply the workspace league's scoring weights. Missing required stats mean unavailable, not zero. Unsupported bonuses or premium scoring must produce a coverage warning and suppress comparable total claims.
- Distinguish projection snapshots from actual results. Retain source publication time when supplied, retrieval time, schema version and scoring version. Never backtest an updated post-game projection as a pre-game prediction.
- Use the current NFL state/week resolver. Regular weeks 1–18 and postseason/preseason require explicit source calendar translation; do not blindly reuse a feed's week range. NFL bye weeks and game locks retain existing schedule checks.
- Server-only credentials, bounded timeouts, schema validation, cached source/season/week data and a feature flag. Empty, expired, limited or failed responses leave existing analytics usable and show unavailable/stale status. Confirm allowed retention, attribution and public display before enabling shares.

## Representative synthetic evidence

The following is a proposed normalized contract, **not a provider response or real player**. Provider-specific field names and external IDs must be verified with an entitled sample before implementing an adapter.

```json
{
  "source": "candidate-feed",
  "sourcePlayerId": "fixture-wr-1",
  "leaguePlayerId": "sleeper:fixture-1",
  "season": 2026,
  "phase": "REG",
  "week": 4,
  "retrievedAt": "2026-10-04T00:00:00Z",
  "stats": { "receivingYards": 70, "receptions": 5, "receivingTouchdowns": 0.5 }
}
```

With receiving yards worth 0.1 and touchdowns 6, this yields 10 standard points, 12.5 half-PPR points or 15 PPR points. Fractions are valid projected events. A missing receptions field permits the standard total but makes PPR totals unavailable. Two same-name players with different IDs remain separate; an unmapped ID is excluded, with an explicit mapping gap. A postseason week 4 record cannot be combined with regular-season week 4.

These arithmetic/identity scenarios specify the adapter acceptance tests. They do not demonstrate real feed access or forecast accuracy.

## Proposed follow-up briefs

Estimates are engineering days, excluding vendor/account wait time. These are proposals, not newly scheduled tasks.

| Brief                                      | Dependency                                                                      | Estimate                                          | Completion evidence and risks                                                                                                                                                                                                              |
| ------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Confirm feed contract and license          | Operator chooses personal/private versus public/commercial use                  | 0.5–1                                             | Verify pricing, quota, caching, attribution, display rights, schema/base URL and an entitled offensive-player sample. Stop if required access is unavailable.                                                                              |
| Add isolated server adapter and ID mapping | Contract/license approved                                                       | 2–3                                               | Schema-validated fixtures, bounded requests, mapping-gap and cache tests, no changes to league types or published records. Main risk: incomplete external IDs/scoring stats.                                                               |
| Add private weekly comparison              | Adapter available                                                               | 1–2                                               | League-scored values, timestamps, coverage labels and stale/failure UI; existing provider remains the fallback. Tests cover PPR variants, unknown players and week/phase mismatch.                                                         |
| Evaluate forecast performance              | Archived pre-game snapshots plus corresponding actuals and retention permission | 2–3 initial study; collection takes calendar time | Compare matched-player error and coverage against the existing source by position/week. Report sample size and missingness; no accuracy promise from synthetic or scrambled data. Decide separately whether advisors may consume the feed. |

No rollout or database migration occurs in this spike. A future feature can be disabled without changing owned leagues, managed-team selections, revision history or existing share URLs.
