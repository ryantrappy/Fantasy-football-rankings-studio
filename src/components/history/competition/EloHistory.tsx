import { useState } from 'react';
import { historicalElo } from '../../../history/competition/elo';
import { number, type CompetitionProps } from './CompetitionHistory';
import { DataTable } from '../../DataTable';
export function EloHistory({ records }: CompetitionProps) {
  const { rankings, movements } = historicalElo(records);
  const [selected, setSelected] = useState('');
  const key = rankings.some((r) => r.key === selected) ? selected : rankings[0]?.key;
  return (
    <details>
      <summary>Cross-season Elo manager ratings</summary>
      <p>
        New managers start at 1500. Each completed reciprocal game updates rating by 32 × (result −
        expected); expected = 1 / (1 + 10^((opponent rating − rating) / 400)). Ties are half a win.
        Games run by season, week and stable matchup ID; ratings carry across years without reset.
        No margin bonus. Missing seasons are omitted, so this is a rating over loaded history, not a
        complete career estimate. Renames follow provider identity; new owners and unknown seasonal
        identities start fresh.
      </p>
      <DataTable
        label="Historical Elo ratings"
        data={rankings}
        getRowId={(r) => r.key}
        initialSorting={[{ id: 'rating', desc: true }]}
        columns={[
          { id: 'name', header: 'Manager', value: (r) => r.name, cell: (r) => r.name },
          ...(['rating', 'games', 'lastDelta'] as const).map((id) => ({
            id,
            header: id === 'lastDelta' ? 'Last movement' : id,
            value: (r: (typeof rankings)[number]) => r[id],
            cell: (r: (typeof rankings)[number]) => number(r[id]),
          })),
        ]}
      />
      <label>
        Elo game evidence{' '}
        <select value={key ?? ''} onChange={(e) => setSelected(e.target.value)}>
          {rankings.map((r) => (
            <option key={r.key} value={r.key}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <ol>
        {movements
          .filter((m) => m.key === key)
          .map((m) => (
            <li key={m.id}>
              {m.year} week {m.week} vs {m.opponent}: {number(m.before)} → {number(m.after)} (
              {number(m.delta)}); expected {number(m.expected * 100)}%, result{' '}
              {m.actual === 1 ? 'win' : m.actual === 0 ? 'loss' : 'tie'}
            </li>
          ))}
      </ol>
      {!movements.some((m) => m.key === key) && (
        <p>No completed games available; rating is the initial prior.</p>
      )}
    </details>
  );
}
