# Historical competition

The competition panel uses loaded SeasonRecord snapshots only. Every game requires exactly one finite completed-week score per team and reciprocal opponent IDs. Byes, future scores, ambiguous duplicate rows and unmatched opponents never become wins or losses. Selected seasons missing from the snapshots are explicitly reported. Account manager keys survive renames; unknown identities are scoped to season and team.

## Rivalries

The manager picker displays every opponent's games, W-L-T, points for/against, tie-adjusted win percentage and average margin. The matrix includes every manager. The adjustable minimum defaults to three games. Rival is closest to a 50% record, then most meetings. Punching bag and kryptonite require a winning and losing record respectively; ties in labels prefer more games then stable identity. No eligible sample means insufficient evidence.

## Schedule context

Expected wins sum (teams outscored + half tied) / other finite team scores each verified regular matchup week. Actual wins include half ties over those verified games. Usable-week and configured regular-season coverage are shown. Opponent difficulty is mean opponent score, deliberately not opponent winning record. Incomplete regular seasons are labeled provisional. The replay compares a target's scores to a donor schedule in the same season, ignoring byes and self-matchups with explicit exclusion counts and game evidence. No unknown schedule is reconstructed. A partial replay cannot establish final placement or tie-breakers.

## Elo

Ratings start at 1500 and use K=32 with expected win probability 1/(1+10^((opponent−own)/400)). Results are 1/0.5/0 for wins/ties/losses. Scores do not affect movement beyond the result. Reciprocal completed games are replayed chronologically; games in the same week use stable matchup-ID order. Ratings carry across seasons. The UI exposes every game, prior/post rating, expectation and delta. Missing history is never synthesized. New identities start at 1500, renamed identities retain ratings, and a manager with no eligible games retains an explicitly labeled prior.

Expected-vs-actual comparisons require one finite score for every rostered team in the week; both totals use precisely that usable sample. Difficulty still uses all verified regular games and reports its own game count. Only an explicit schedule bye fixture is counted as a bye; absent opponent metadata alone remains unavailable.

## Hall of Fame / Shame

Fame uses a weighted mean over available metrics: championship rate 40, playoff reciprocal final finish (confirmed appearances only) 20, regular-season win rate 20, expected scoring percentile 15, and longevity (seasons/5 capped at1) 5. Unknown outcomes are omitted from denominators; coverage therefore matters more than small rank differences. Components and each sample are visible. This is a configurable-source descriptive honor, not an objective measure of talent.

Shame records show season and game evidence: worst regular win rate requires every configured game; longest regular losing streak resets at missing weeks and year boundaries; lowest finite completed score includes its week; collapse requires complete regular history and at least two games in each half, measured by first-half minus second-half win rate. Byes preclude the complete-game records rather than being counted as losses. Unsupported results remain unknown.
