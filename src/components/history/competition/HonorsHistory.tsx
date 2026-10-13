import { useState } from 'react';
import { historicalHonors, fameWeights } from '../../../history/competition/honors';
import { number, type CompetitionProps } from './CompetitionHistory';
import { DataTable } from '../../DataTable';
export function HonorsHistory({ records }: CompetitionProps) {
  const { rankings, shame } = historicalHonors(records);
  const [kind, setKind] = useState('Worst season');
  const rows = shame.filter((s) => s.kind === kind);
  return (
    <details>
      <summary>Hall of Fame and Hall of Shame</summary>
      <p>
        Fame weights:{' '}
        {Object.entries(fameWeights)
          .map(([k, w]) => `${k} ${w}`)
          .join(', ')}
        . Titles = known championship rate; playoffs = mean reciprocal finish among confirmed
        playoff appearances; wins = regular-game win rate; scoring = weekly all-play percentile;
        longevity = seasons / 5 capped at 1. Score is weighted mean of available metrics × 100.
        Missing metrics are excluded, so compare coverage before ranks. Unknown outcomes never count
        as failures.
      </p>
      <DataTable
        label="Hall of Fame"
        data={rankings}
        getRowId={(r) => r.key}
        initialSorting={[{ id: 'score', desc: true }]}
        columns={[
          { id: 'name', header: 'Manager', value: (r) => r.name, cell: (r) => r.name },
          {
            id: 'score',
            header: 'Fame score',
            value: (r) => r.score,
            cell: (r) => number(r.score),
          },
          {
            id: 'metrics',
            header: 'Observed components',
            value: (r) => r.titles,
            cell: (r) =>
              Object.entries(r.metrics)
                .map(([k, v]) => `${k}: ${number(v)}`)
                .join(' · '),
          },
          {
            id: 'coverage',
            header: 'Coverage',
            value: (r) => r.games,
            cell: (r) =>
              `${r.seasons} seasons · titles ${r.titles}/${r.titleKnown} known · playoff finish ${r.playoffKnown} · ${r.games} games · ${r.scoringWeeks} scoring weeks`,
          },
        ]}
      />
      <label>
        Shame record{' '}
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          {['Worst season', 'Losing streak', 'Lowest score', 'Biggest collapse'].map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </label>
      <p>
        Worst season and collapse require every configured regular-season game; missing games or
        byes make those records unavailable. Losing streaks require consecutive observed regular
        weeks and reset at gaps and season boundaries. Collapse means declining win rate from first
        to second half (at least two games each).
      </p>
      <DataTable
        label="Hall of Shame evidence"
        data={rows}
        getRowId={(r) => r.id}
        initialSorting={[
          { id: 'value', desc: kind === 'Losing streak' || kind === 'Biggest collapse' },
        ]}
        columns={[
          {
            id: 'name',
            header: 'Manager / season',
            value: (r) => r.name,
            cell: (r) => `${r.name} / ${r.year}`,
          },
          {
            id: 'value',
            header: 'Record value',
            value: (r) => r.value,
            cell: (r) => number(r.value),
          },
          {
            id: 'evidence',
            header: 'Evidence / sample',
            value: (r) => r.sample,
            cell: (r) => `${r.evidence} · ${r.sample} observed games/weeks`,
          },
        ]}
      />
      {!rows.length && <p>Insufficient history for this record.</p>}
    </details>
  );
}
