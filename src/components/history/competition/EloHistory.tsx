import { InfoTooltip } from '../../InfoTooltip';
import { useState } from 'react';
import { historicalElo } from '../../../history/competition/elo';
import { number, type CompetitionProps } from './CompetitionHistory';
import { CompetitionTable as DataTable } from './CompetitionTable';
export function EloHistory({ records, managerKey, onManagerChange, active }: CompetitionProps) {
  const { rankings, movements } = historicalElo(records);
  const [selected, setSelected] = useState('');
  const key = rankings.some((r) => r.key === managerKey)
    ? managerKey
    : rankings.some((r) => r.key === selected)
      ? selected
      : rankings[0]?.key;
  return (
    <details open={active || undefined} className="history-explorer-analysis">
      <summary>Cross-season Elo manager ratings</summary>
      <div className="history-explorer-definition">
        <span>Elo rating method</span>
        <InfoTooltip label="Elo rating method">
          New managers start at 1500. Each completed reciprocal game updates rating by 32 × (result
          − expected); expected = 1 / (1 + 10^((opponent rating − rating) / 400)). Ties are half a
          win. Games run by season, week and stable matchup ID; ratings carry across years without
          reset. No margin bonus.
        </InfoTooltip>
      </div>
      <p className="history-explorer-footnote">
        Missing seasons are omitted, so this rates loaded history rather than a complete career.
        Renames follow provider identity; new owners and unknown seasonal identities start fresh.
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
        <select
          value={key ?? ''}
          onChange={(e) => {
            setSelected(e.target.value);
            onManagerChange?.(e.target.value);
          }}
        >
          {rankings.map((r) => (
            <option key={r.key} value={r.key}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <details open={active || undefined} className="history-explorer-methodology">
        <summary>
          Rating movements for {rankings.find((r) => r.key === key)?.name ?? 'selected manager'}
        </summary>
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
      </details>
      {!movements.some((m) => m.key === key) && (
        <p>No completed games available; rating is the initial prior.</p>
      )}
    </details>
  );
}
