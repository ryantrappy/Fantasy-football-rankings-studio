# Historical moments

## TASK-130: Monday comebacks

Threshold defaults to 10% and is adjustable. Only a completed, reciprocal matchup won by the archived team can qualify; ties and losses never do. Probability is the archive author's supplied estimate, never derived from final results. Contributors are supplied scoring events after the explicit pre-Monday checkpoint; omitted contributors remain unknown. Current provider endpoints do not offer retrospective in-game checkpoints.

Use the Moments archive importer with a JSON array of these records. Archives are user-supplied evidence: the author must verify the checkpoint occurred before the relevant Monday kickoff. UTC date strings alone cannot establish an NFL kickoff schedule. No score/projection interpolation or implied full coverage occurs. Imports are temporary in the current view; use Export archive to retain them, then import again later. The optional SeasonInsights.matchupArchive field also roundtrips through saved report snapshots for applications supplying it before snapshot creation. Credentials and extra fields are stripped; exports include public player/team identifiers only.

```json
[{"week":1,"teamId":"1","opponentTeamId":"2","source":"Service export, captured live","preMondayAt":"2025-09-08T23:00:00.000Z","snapshots":[{"capturedAt":"2025-09-08T23:00:00.000Z","probability":0.05,"contributors":[]},{"capturedAt":"2025-09-09T03:00:00.000Z","probability":1,"contributors":[{"playerId":"123","points":27}]}]}]
```

Import validates size, bounded counts, finite scores/probabilities, probability range, increasing timestamps, explicit checkpoint and verified completed opponents. Source labels establish provenance, not independent certification. Raw provider transactions are retained with explicit weeks/types/coverage; absence never implies a complete history, and waiver subtype is unsupported.
