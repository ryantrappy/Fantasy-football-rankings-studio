import { useState } from 'react';
import { matchupRecords } from '../../../history/competition/records';
import { CompetitionTable as DataTable } from './CompetitionTable';
import { number, type CompetitionProps } from './CompetitionHistory';
export function RecordsHistory({ records, years, leagueId }: CompetitionProps) {
  const [category, setCategory] = useState('closest'),
    [query, setQuery] = useState('');
  const all = matchupRecords(records);
  const rows = all.filter(
    (r) =>
      (category !== 'worst' || r.worstBeat) &&
      `${r.a.name} ${r.b.name} ${r.year} week ${r.week}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const metric =
    category === 'closest' || category === 'blowouts'
      ? 'margin'
      : category === 'individual'
        ? 'individual'
        : category === 'worst'
          ? 'loserPoints'
          : 'combined';
  return (
    <details>
      <summary>All-time matchup and scoring records</summary>
      <p>
        {all.length} verified games across {records.length}/{years.length} selected seasons. Missing
        seasons and unpaired/nonfinite scores are excluded; record leaders can change as history
        loads. Weekly ranks require one finite score for every rostered team; ties share competition
        rank. Worst beats mean the losing team finished in the top quarter of weekly scoring
        (rounded up). Multiweek playoff series use aggregate points and have no weekly scoring rank.
        Scores from different scoring-rule eras are shown in native points.
      </p>
      <label>
        Record category{' '}
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="closest">Closest games</option>
          <option value="blowouts">Largest blowouts</option>
          <option value="combined">Highest combined scores</option>
          <option value="individual">Highest individual matchup scores</option>
          <option value="worst">Worst beats</option>
        </select>
      </label>
      <label>
        Search matchup records <input value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <DataTable
        key={category}
        label="All-time scoring record book"
        data={rows}
        getRowId={(r) => r.id}
        initialSorting={[{ id: metric, desc: category !== 'closest' }]}
        columns={[
          {
            id: 'game',
            header: 'Matchup / season',
            value: (r) => `${r.year} ${r.week} ${r.a.name} ${r.b.name}`,
            cell: (r) => (
              <>
                {leagueId ? (
                  <a href={`/insights?leagueId=${encodeURIComponent(leagueId)}&year=${r.year}`}>
                    {r.year} week {r.week}
                  </a>
                ) : (
                  `${r.year} week ${r.week}`
                )}{' '}
                {r.weeks.length > 1 ? ` (playoff series weeks ${r.weeks.join(', ')})` : ''} —{' '}
                {r.a.name} {r.a.points} vs {r.b.name} {r.b.points}
              </>
            ),
          },
          ...(['margin', 'combined', 'individual'] as const).map((id) => ({
            id,
            header: {
              margin: 'Margin',
              combined: 'Combined points',
              individual: 'Top team points',
            }[id],
            value: (r: (typeof rows)[number]) => r[id],
            cell: (r: (typeof rows)[number]) => number(r[id]),
          })),
          {
            id: 'loserPoints',
            header: 'Losing score',
            value: (r) => r.loser.points,
            cell: (r) => (r.margin ? `${r.loser.name}: ${r.loser.points}` : 'Tie — no loser'),
          },
          {
            id: 'ranks',
            header: 'Weekly scoring ranks / coverage',
            value: (r) => r.aRank,
            cell: (r) =>
              `${r.a.name}: ${r.aRank ?? 'unknown'}; ${r.b.name}: ${r.bRank ?? 'unknown'} · ${r.population}/${r.leagueTeams} scores`,
          },
        ]}
      />
      {!rows.length && <p>No verified records match these filters.</p>}
    </details>
  );
}
