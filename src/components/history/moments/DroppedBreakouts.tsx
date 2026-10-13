import { useState } from 'react';
import type { SeasonInsights } from '../../../insights';
import { droppedBreakouts } from '../../../history/moments/drops';
export function DroppedBreakouts({ data, manager }: { data: SeasonInsights; manager: string }) {
  const [window, setWindow] = useState(3);
  const rows = droppedBreakouts(data, window)
    .filter((r) => !manager || r.drop.from === manager)
    .sort((a, b) => (b.lift ?? -Infinity) - (a.lift ?? -Infinity));
  return (
    <details>
      <summary>Dropped-player breakouts</summary>
      <label>
        Post-drop window{' '}
        <select value={window} onChange={(e) => setWindow(Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} weeks
            </option>
          ))}
        </select>
      </label>
      <p>
        Baseline: mean of at least two observed player scores in the three weeks before the drop
        week. The drop week is excluded because lineup lock times are unknown. Breakout means
        positive total points above this baseline across the full selected window. Incomplete
        scoring windows stay unranked.{' '}
        {data.moveCoverage?.note || 'Transaction coverage unavailable.'}
      </p>
      {!data.moves && <p>Drop history unavailable.</p>}
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table>
          <caption>Waiver graveyard — observed drops</caption>
          <thead>
            <tr>
              <th>Manager / player</th>
              <th>Drop date</th>
              <th>Scoring window</th>
              <th>Baseline</th>
              <th>Output / lift</th>
              <th>League availability</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>
                  {data.teams.find((t) => t.teamId === r.drop.from)?.managerName || r.drop.from} /{' '}
                  {data.playerIdentities?.[r.drop.playerId]?.name || r.drop.playerId}
                </td>
                <td>{new Date(r.drop.timestamp).toISOString()}</td>
                <td>
                  {r.output.map((p) => `W${p.week}: ${p.points ?? 'unavailable'}`).join('; ')}
                </td>
                <td>
                  {r.baseline?.toFixed(1) ?? 'Unavailable'} ({r.baselineWeeks} weeks)
                </td>
                <td>
                  {r.total?.toFixed(1) ?? 'Incomplete'} / {r.lift?.toFixed(1) ?? 'Unranked'}
                  {r.lift !== null && r.lift > 0 ? ' — breakout' : ''}
                </td>
                <td>{r.availability}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
