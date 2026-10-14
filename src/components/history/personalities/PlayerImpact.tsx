import type { SeasonRecord } from '../../../league-summary';
import { playerImpact } from '../../../history/personalities/player-impact';
export function PlayerImpact({
  records,
  managerKey,
  open,
}: {
  records: SeasonRecord[];
  managerKey?: string;
  open?: boolean;
}) {
  const impact = playerImpact(records);
  const rows = impact.rows.filter((row) => !managerKey || row.managerKey === managerKey);
  return (
    <details open={open}>
      <summary>Nemesis and guardian-angel players</summary>
      <p>
        Verified rostered starters in reciprocal completed matchups only. Guardian angels scored in
        wins; nemeses scored for opponents in losses. Decisive means removing that player's points
        reverses the result, without assuming a replacement. This is descriptive, not causal.
      </p>
      <p>
        {impact.excluded} unavailable matchup/roster samples excluded. Provider player IDs remain
        distinct across identity changes; names never merge records. Fewer than three appearances is
        a small sample.
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <caption>Verified player impact</caption>
          <thead>
            <tr>
              <th>Manager</th>
              <th>Role / player</th>
              <th>Matchups</th>
              <th>Points</th>
              <th>Decisive</th>
              <th>Seasons / sample</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.managerKey}:${row.role}:${row.playerId}`}>
                <th>{row.manager}</th>
                <td>
                  {row.role}: {row.player} ({row.playerId})
                </td>
                <td>{row.appearances}</td>
                <td>{row.points.toFixed(1)}</td>
                <td>{row.decisive}</td>
                <td>
                  {row.seasons.join(', ')} ·{' '}
                  {row.appearances < 3 ? 'Small sample' : '3+ appearances'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p>No verified player appearances available.</p>}
    </details>
  );
}
