import { useState } from 'react';
import { historicalPlayoffs } from '../../../history/competition/playoffs';
import { CompetitionTable as DataTable } from './CompetitionTable';
import { number, type CompetitionProps } from './CompetitionHistory';
export function PlayoffsHistory({ records }: CompetitionProps) {
  const [minimum, setMinimum] = useState(3),
    [selected, setSelected] = useState('');
  const rows = historicalPlayoffs(records, minimum);
  const own = rows.find((r) => r.key === selected) ?? rows[0];
  return (
    <details>
      <summary>Playoff performance and clutch results</summary>
      <label>
        Minimum elimination games{' '}
        <input
          type="number"
          min={1}
          value={minimum}
          onChange={(e) => setMinimum(Math.max(1, Math.floor(Number(e.target.value) || 3)))}
        />
      </label>
      <p>
        Regular games require a known regular-season boundary. Postseason games require verified
        winners-bracket series with every scoring week complete; consolation and byes do not count.
        Must-win means a confirmed championship-path elimination series (currently Sleeper); ESPN
        winners-bracket games have unknown elimination status and contribute only to postseason
        performance. Regular-season qualification must-wins cannot be verified from final standings
        and remain unavailable.
      </p>
      <p>
        Clutch record requires at least {minimum} elimination games and 65% wins. Underperformance
        requires the same sample, elimination losses in two separate seasons with at least 65%
        regular wins and {minimum} regular games each, plus a 20-point regular-to-playoff win-rate
        decline. These descriptive labels summarize observed history and predict nothing.
      </p>
      <DataTable
        label="Regular and playoff performance"
        data={rows}
        getRowId={(r) => r.key}
        columns={[
          { id: 'name', header: 'Manager', value: (r) => r.name, cell: (r) => r.name },
          ...(
            [
              'regularGames',
              'regularRate',
              'playoffGames',
              'playoffRate',
              'mustWinGames',
              'mustWinRate',
            ] as const
          ).map((id) => ({
            id,
            header: {
              regularGames: 'Regular games',
              regularRate: 'Regular win rate',
              playoffGames: 'Playoff series',
              playoffRate: 'Playoff win rate',
              mustWinGames: 'Must-win series',
              mustWinRate: 'Must-win rate',
            }[id],
            value: (r: (typeof rows)[number]) => r[id],
            cell: (r: (typeof rows)[number]) => number(r[id]),
          })),
          {
            id: 'label',
            header: 'Evidence / label',
            value: (r) => r.knownSeasons,
            cell: (r) =>
              `${r.label}; ${r.knownSeasons} seasons with bracket metadata; ${r.strongLossYears} strong-season elimination losses`,
          },
        ]}
      />
      <label>
        Playoff game evidence{' '}
        <select value={own?.key ?? ''} onChange={(e) => setSelected(e.target.value)}>
          {rows.map((r) => (
            <option key={r.key} value={r.key}>
              {r.name}
            </option>
          ))}
        </select>
      </label>
      <ul>
        {own?.evidence.map((e) => (
          <li key={e.id}>
            {e.year} weeks {e.weeks.join(', ')} vs {e.opponent}: {e.points}–{e.against},{' '}
            {e.win === 1 ? 'W' : e.win === 0 ? 'L' : 'T'} ·{' '}
            {e.elimination ? 'must-win championship path' : 'elimination status unknown'}
          </li>
        ))}
      </ul>
      {!own?.evidence.length && (
        <p>
          Playoff games unavailable; missing brackets, incomplete series and byes remain unknown.
        </p>
      )}
    </details>
  );
}
