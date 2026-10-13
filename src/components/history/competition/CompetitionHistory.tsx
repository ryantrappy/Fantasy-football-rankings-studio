import { PainHistory } from './PainHistory';
import { RecordsHistory } from './RecordsHistory';
import { PlayoffsHistory } from './PlayoffsHistory';
import { ErasHistory } from './ErasHistory';
import { HonorsHistory } from './HonorsHistory';
import { EloHistory } from './EloHistory';
import { ScheduleHistory } from './ScheduleHistory';
import { useState } from 'react';
import type { SeasonRecord } from '../../../league-summary';
import { competitionGames, pairRecord, rivalryLabels } from '../../../history/competition/games';
import { CompetitionTable as DataTable } from './CompetitionTable';
export const number = (n: number | null | undefined) =>
  n == null ? 'Unavailable' : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
export interface CompetitionProps {
  records: SeasonRecord[];
  years: number[];
  leagueId?: string;
  shared?: boolean;
}
export function CompetitionHistory({ records, years, leagueId, shared }: CompetitionProps) {
  const { games, managers, skipped } = competitionGames(records);
  const [selected, setSelected] = useState('');
  const key = managers.has(selected) ? selected : [...managers.keys()][0];
  const [minimum, setMinimum] = useState(3);
  const rows = [...managers.keys()].filter((k) => k !== key).map((k) => pairRecord(games, key, k));
  const labels = rivalryLabels(rows, minimum);
  return (
    <section className="panel insight-section">
      <h2>Competition history</h2>
      <p>
        Competition coverage: {records.length}/{years.length} selected seasons. Missing seasons:{' '}
        {years.filter((y) => !records.some((r) => r.year === y)).join(', ') || 'none'}.{' '}
        {games.length} verified completed games; {skipped} unusable score rows.{' '}
        {records.reduce(
          (n, r) =>
            n +
            r.data.scores.filter((s) => s.week <= r.data.completedWeek && !s.opponentTeamId).length,
          0,
        )}{' '}
        score rows without an opponent (byes or unavailable matchup links). Renames follow provider
        manager identity; unidentified owners stay separate by season.
      </p>
      <label>
        Head-to-head manager{' '}
        <select value={key || ''} onChange={(e) => setSelected(e.target.value)}>
          {[...managers].map(([k, n]) => (
            <option key={k} value={k}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label>
        Minimum rivalry games{' '}
        <input
          type="number"
          min={1}
          value={minimum}
          onChange={(e) => setMinimum(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
        />
      </label>
      {Object.entries(labels).map(([label, r]) => (
        <p key={label}>
          {label === 'punchingBag' ? 'Punching bag' : label === 'rival' ? 'Rival' : 'Kryptonite'}:{' '}
          {r
            ? `${managers.get(r.opponent)} — ${r.wins}-${r.losses}-${r.ties}, ${r.games} games, ${number(r.rate! * 100)}% wins`
            : 'Insufficient samples'}
        </p>
      ))}
      <p>
        Rival = closest to 50% wins, then most meetings. Punching bag = highest winning rate above
        50%; kryptonite = lowest below 50%. Ties count as half a win; tied labels use sample size
        then stable identity.
      </p>
      <DataTable
        label="All-time head-to-head"
        data={rows}
        getRowId={(r) => r.opponent}
        columns={[
          {
            id: 'name',
            header: 'Opponent',
            value: (r) => managers.get(r.opponent),
            cell: (r) => managers.get(r.opponent),
          },
          ...(
            [
              'games',
              'wins',
              'losses',
              'ties',
              'pointsFor',
              'pointsAgainst',
              'rate',
              'margin',
            ] as const
          ).map((id) => ({
            id,
            header: {
              games: 'Games',
              wins: 'Wins',
              losses: 'Losses',
              ties: 'Ties',
              pointsFor: 'Points for',
              pointsAgainst: 'Points against',
              rate: 'Win %',
              margin: 'Avg. margin',
            }[id],
            value: (r: (typeof rows)[number]) => r[id],
            cell: (r: (typeof rows)[number]) =>
              id === 'rate' ? `${number(r.rate == null ? null : r.rate * 100)}%` : number(r[id]),
          })),
        ]}
      />
      <div style={{ overflowX: 'auto' }}>
        <table>
          <caption>League rivalry matrix — row manager W-L-T (games)</caption>
          <thead>
            <tr>
              <th>Manager</th>
              {[...managers].map(([k, n]) => (
                <th key={k}>{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...managers].map(([k, n]) => (
              <tr key={k}>
                <th scope="row">{n}</th>
                {[...managers.keys()].map((o) => {
                  const r = pairRecord(games, k, o);
                  return (
                    <td key={o}>
                      {o === k
                        ? '—'
                        : r.games
                          ? `${r.wins}-${r.losses}-${r.ties} (${r.games})${r.games < minimum ? ' · Insufficient samples' : ''}`
                          : 'Unavailable'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ScheduleHistory records={records} years={years} />
      <EloHistory records={records} years={years} />
      <HonorsHistory records={records} years={years} />
      <ErasHistory records={records} years={years} />
      <PlayoffsHistory records={records} years={years} />
      <RecordsHistory records={records} years={years} leagueId={leagueId} shared={shared} />
      <PainHistory records={records} years={years} />
    </section>
  );
}
