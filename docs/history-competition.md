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

## Competitive eras

Configurable span (2–10 calendar seasons), titles (default2), and sustained regular winning rate (default70%) define overlapping observed windows. Title eras require all team championship outcomes known and exactly one champion in every season of the full span. Missing years never bridge an era. Regular success requires full configured game and league scoring coverage in every season for that manager; ties count half. Every claim lists the seasons, accomplishments and threshold. Unknown title windows are explicitly excluded, independently of regular-season evidence.

## Playoff and clutch records

Only explicit provider winners-bracket series count, with finite scores for every published scoring week. Sleeper uses the p=1 championship final's winner-linked ancestors, excluding third-place/consolation paths, placeholders, byes and unresolved results; round IDs map to the published playoff settings. ESPN needs WINNERS_BRACKET and explicit matchup-period mappings; its elimination status stays unknown because placement rounds may share that tier. Multiweek series are aggregated once. Old snapshots without metadata show unknown playoff history. Metadata is validated and persisted in report snapshots.

Must-win is a verified championship-path elimination series; final regular-season standings cannot prove a regular-season must-win scenario. Clutch requires the configured minimum (default3) elimination games with at least65% wins. The descriptive underperformance/choker context requires that minimum plus elimination losses in two different strong regular seasons (65% wins, minimum regular samples each) and at least20 percentage points of regular-to-playoff win-rate decline. This is league context, never a prediction. All contributing series, weeks and scores are visible.

## Matchup record book

Browse closest games (ties included), blowouts, combined scoring, top individual matchup score and worst beats; every metric supports numeric sorting and names/year/week are searchable. Records show both native point totals, margin, season link where league context exists, and weekly scoring ranks. Competition ranks share ties. Full unique roster score coverage is required for ranks and worst beats. A worst beat is a top-quarter scoring loss (ceil(team count/4)); this definition is visible. Scores are not normalized across scoring-system eras. Unpaired scores cannot establish game records.

Verified playoff series also feed all-time head-to-head and Elo, once per series at its last scoring week. Their weekly score rows are suppressed to avoid duplicate game results. Record-book entries label multiweek aggregate series explicitly and withhold weekly scoring ranks for those totals.

## Weekly Pain Index

A playful descriptive score ranks verified single-week losses, excluding ties/byes and multiweek aggregate playoff series. Closeness (30%) is 1−min(1,margin/max(1,abs(opponent score))); own scoring percentile (30%) and opponent percentile (20%) require full unique finite roster scoring; documented pre-Monday win expectation (20%) is available only from an explicit matching source archive. The forecast expectation that ended in a loss is labeled, never called an observed live swing. Final box scores cannot reconstruct one.

Missing components are excluded and available weights renormalized. Separate selectable coverage cohorts prevent sorting scores with different component sets together. Every loss lists raw scores/margin, ranks and population, normalized component values/weights, and archive source/timestamp if present. This is league context, not emotional certainty or prediction.

Individual weekly scoring records independently include every unique finite completed team/week score, including confirmed byes and scores with unknown opponents. They never use multiweek series aggregates. Season links follow shared/private report context; snapshot consumers may omit leagueId to keep evidence local.
