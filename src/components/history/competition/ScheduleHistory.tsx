import { useState } from 'react';
import { historicalSchedules, alternateSchedule } from '../../../history/competition/schedule';
import { DataTable } from '../../DataTable';
import { number, type CompetitionProps } from './CompetitionHistory';
export function ScheduleHistory({ records }: CompetitionProps) {
  const [year, setYear] = useState(0),
    [team, setTeam] = useState(''),
    [donor, setDonor] = useState('');
  const record = records.find((r) => r.year === year) ?? records[0];
  const rows = records.flatMap(historicalSchedules);
  const teams = record?.data.teams ?? [];
  const target = teams.some((t) => t.teamId === team) ? team : teams[0]?.teamId;
  const source = teams.some((t) => t.teamId === donor) ? donor : (teams[1]?.teamId ?? target);
  const replay = record && alternateSchedule(record, target, source);
  return (
    <details>
      <summary>Expected wins and historical schedule difficulty</summary>
      <p>
        Expected wins sum weekly all-play scoring percentiles for verified regular-season matchups,
        ties worth half. Difficulty is opponent points per completed game; scoring systems differ
        across years. Partial seasons are provisional. Byes add no wins. Missing scores are
        excluded.
      </p>
      <DataTable
        label="Historical expected wins"
        data={rows}
        getRowId={(r) => `${r.year}:${r.teamId}`}
        columns={[
          {
            id: 'manager',
            header: 'Manager / year',
            value: (r) => r.name,
            cell: (r) => `${r.name} / ${r.year}`,
          },
          ...(['actual', 'expected', 'difficulty', 'weeks', 'games'] as const).map((id) => ({
            id,
            header: id,
            value: (r: (typeof rows)[number]) => r[id],
            cell: (r: (typeof rows)[number]) => number(r[id]),
          })),
          {
            id: 'coverage',
            header: 'Coverage',
            value: (r) => r.possibleWeeks,
            cell: (r) =>
              `${r.weeks}/${r.possibleWeeks ?? '?'} weeks · ${r.completed ? 'regular season complete' : 'partial/unknown season'}`,
          },
        ]}
      />
      <label>
        Schedule season{' '}
        <select value={record?.year ?? ''} onChange={(e) => setYear(Number(e.target.value))}>
          {records.map((r) => (
            <option key={r.year} value={r.year}>
              {r.year}
            </option>
          ))}
        </select>
      </label>
      <label>
        Replay team{' '}
        <select value={target ?? ''} onChange={(e) => setTeam(e.target.value)}>
          {teams.map((t) => (
            <option key={t.teamId} value={t.teamId}>
              {t.managerName}
            </option>
          ))}
        </select>
      </label>
      <label>
        Schedule owner{' '}
        <select value={source ?? ''} onChange={(e) => setDonor(e.target.value)}>
          {teams.map((t) => (
            <option key={t.teamId} value={t.teamId}>
              {t.managerName}
            </option>
          ))}
        </select>
      </label>
      <p>
        Replay preserves the target's same-season weekly scores against the schedule owner's
        opponents. Self-matchups are excluded; no replacement is invented. This is a partial
        counterfactual record, not a final placement.
      </p>
      <p>
        {replay?.known
          ? `Alternate record: ${replay.wins}-${replay.losses}-${replay.ties}; ${replay.byes} byes; ${replay.skipped} unavailable or self-matchup weeks`
          : 'Regular-season boundary unavailable'}
      </p>
      <ul>
        {replay?.evidence.map((e) => (
          <li key={e.week}>
            Week {e.week}: {e.score} vs {e.opponent} {e.against} — {e.outcome}
          </li>
        ))}
      </ul>
    </details>
  );
}
