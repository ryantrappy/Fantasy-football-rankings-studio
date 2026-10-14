import type { SeasonInsights } from '../../../insights';
import { lineupRegrets } from '../../../history/moments/lineups';
export function LineupRegrets({
  data,
  manager,
  open,
}: {
  data: SeasonInsights;
  manager: string;
  open?: boolean;
}) {
  const { rows, largest } = lineupRegrets(data);
  const visible = rows.filter((r) => !manager || r.score.teamId === manager);
  const name = (id: string) => data.playerIdentities?.[id]?.name || id;
  return (
    <details open={open}>
      <summary>Perfect-lineup records and weekly regret</summary>
      <p>
        Retrospective legal optimization uses that week's roster, eligible positions, lineup slots
        and league scoring. Complete rosters and matching starter totals are required; commissioner
        overrides, unknown rosters and missing eligibility are unranked. Unilateral outcome changes
        only this team's lineup; perfect-lineup record optimizes both opponents. No kickoff-time
        knowledge or future prediction is implied.
      </p>
      <p>
        Coverage: {visible.filter((r) => r.optimal !== null).length}/{visible.length} team matchups;
        perfect-lineup W–L–T:{' '}
        {['W', 'L', 'T']
          .map((result) => visible.filter((r) => r.bothOptimal === result).length)
          .join('–')}
        .
      </p>
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table>
          <caption>Actual and optimal completed matchups</caption>
          <thead>
            <tr>
              <th>Week / manager</th>
              <th>Actual / optimal points</th>
              <th>Actual / unilateral / both optimal outcome</th>
              <th>Legal decision</th>
              <th>Regret</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={`${r.score.week}:${r.score.teamId}`}>
                <td>
                  {r.score.week} /{' '}
                  {data.teams.find((t) => t.teamId === r.score.teamId)?.managerName ||
                    r.score.teamId}
                </td>
                <td>
                  {r.score.actual.toFixed(1)} / {r.optimal?.toFixed(1) ?? 'Unavailable'}
                </td>
                <td>
                  {r.actual ?? 'Unknown'} / {r.unilateral ?? 'Unknown'} /{' '}
                  {r.bothOptimal ?? 'Unknown'}
                  {r.unilateral && r.actual !== r.unilateral ? ' — result changes' : ''}
                </td>
                <td>
                  {r.optimal === null
                    ? 'Incomplete evidence'
                    : `Start ${r.benchIn.map(name).join(', ') || 'same players'}; sit ${r.startersOut.map(name).join(', ') || 'none'}`}
                </td>
                <td>{r.regret?.toFixed(1) ?? 'Unranked'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul aria-label="Largest regret each week">
        {largest
          .filter((r) => !manager || r.score.teamId === manager)
          .map((r) => (
            <li key={r.score.week}>
              Week {r.score.week}:{' '}
              {data.teams.find((t) => t.teamId === r.score.teamId)?.managerName || r.score.teamId},{' '}
              {r.regret!.toFixed(1)} points; start {r.benchIn.map(name).join(', ') || 'same lineup'}
              , sit {r.startersOut.map(name).join(', ') || 'none'}; {r.actual} → {r.unilateral}{' '}
              against actual opponent.
            </li>
          ))}
      </ul>
    </details>
  );
}
