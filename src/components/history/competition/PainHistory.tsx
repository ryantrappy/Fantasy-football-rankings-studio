import { useState } from 'react';
import { weeklyPain } from '../../../history/competition/pain';
import { CompetitionTable as DataTable } from './CompetitionTable';
import { number, type CompetitionProps } from './CompetitionHistory';
export function PainHistory({ records, years }: CompetitionProps) {
  const all = weeklyPain(records);
  const [manager, setManager] = useState(''),
    [selected, setSelected] = useState('');
  const managers = [...new Map(all.map((r) => [r.key, r.name]))];
  const key = managers.some(([k]) => k === manager) ? manager : managers[0]?.[0];
  const personal = all.filter((r) => r.key === key);
  const cohorts = [...new Set(personal.map((r) => r.cohort))];
  const cohort = cohorts.includes(selected) ? selected : cohorts[0];
  const rows = personal.filter((r) => r.cohort === cohort);
  return (
    <details>
      <summary>Weekly loss Pain Index</summary>
      <p>
        A playful league-context score, not a claim about anyone's feelings or future results. Only
        verified single-week losses qualify; ties, byes and aggregate multiweek series are excluded.{' '}
        {records.length}/{years.length} selected seasons loaded; {all.length} qualifying losses.
      </p>
      <p>
        Weights: closeness 30%, own weekly scoring percentile 30%, opponent scoring percentile 20%,
        archived pre-Monday expectation 20%. Closeness = 1 − min(1, margin / max(1, absolute
        opponent score)). Percentiles count ties half. An archived expectation measures the
        pre-Monday forecast probability that ended in a loss; it is not a reconstructed live swing.
        Missing components are omitted and remaining weights renormalized. Compare scores only
        within the same component coverage cohort.
      </p>
      <label>
        Pain Index manager{' '}
        <select value={key ?? ''} onChange={(e) => setManager(e.target.value)}>
          {managers.map(([k, n]) => (
            <option key={k} value={k}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label>
        Pain component coverage{' '}
        <select value={cohort ?? ''} onChange={(e) => setSelected(e.target.value)}>
          {cohorts.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <p>
        {personal.length} manager losses across {cohorts.length} component cohorts; {rows.length}{' '}
        comparable losses shown. Late-week swing data{' '}
        {rows.some((r) => r.late != null)
          ? 'uses the documented archive shown below'
          : 'unavailable; excluded from scores'}
        .
      </p>
      <DataTable
        label="Most painful weekly losses"
        data={rows}
        getRowId={(r) => r.id}
        initialSorting={[{ id: 'pain', desc: true }]}
        columns={[
          {
            id: 'game',
            header: 'Manager / matchup',
            value: (r) => r.year * 100 + r.week,
            cell: (r) =>
              `${r.name} / ${r.year} week ${r.week} vs ${r.winner.name}: ${r.loser.points}–${r.winner.points}, margin ${r.margin}`,
          },
          { id: 'pain', header: 'Pain Index', value: (r) => r.score, cell: (r) => number(r.score) },
          {
            id: 'factors',
            header: 'Factors and source',
            value: (r) => r.scoringRank,
            cell: (r) => (
              <>
                {r.components
                  .map(
                    (c) =>
                      `${c.name}: ${number(c.value * 100)} /100 (weight ${number(c.weight * 100)})`,
                  )
                  .join('; ')}
                . Scoring ranks {r.scoringRank ?? 'unknown'} vs {r.opponentRank ?? 'unknown'};{' '}
                {r.population}/{r.leagueTeams} weekly scores.{' '}
                {r.archiveSource
                  ? `Archive: ${r.archiveSource}, ${r.archiveTime}`
                  : 'Late archive unavailable'}
              </>
            ),
          },
        ]}
      />
      {!rows.length && <p>No qualifying weekly losses available.</p>}
    </details>
  );
}
