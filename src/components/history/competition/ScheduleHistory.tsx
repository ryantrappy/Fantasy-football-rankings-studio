import { RecordEvidence, RecordEvidenceLayout } from '../RecordEvidence';
import { InfoTooltip } from '../../InfoTooltip';
import { useState } from 'react';
import { historicalSchedules, alternateSchedule } from '../../../history/competition/schedule';
import { managerKey as identity } from '../../../history/competition/games';
import { CompetitionTable as DataTable } from './CompetitionTable';
import { number, type CompetitionProps } from './CompetitionHistory';
export function ScheduleHistory({
  records,
  managerKey,
  onManagerChange,
  active,
  seasonYear,
  onSeasonChange,
}: CompetitionProps) {
  const [year, setYear] = useState(0),
    [teamSelection, setTeamSelection] = useState({ managerKey, team: '' }),
    [donor, setDonor] = useState(''),
    [showLeague, setShowLeague] = useState(false);
  const record =
    records.find((r) => r.year === (seasonYear ?? year)) ??
    records.find((r) => r.data.teams.some((t) => identity(t, r.year) === managerKey)) ??
    records[0];
  const rows = records.flatMap(historicalSchedules);
  const teams = record?.data.teams ?? [];
  const team = teamSelection.managerKey === managerKey ? teamSelection.team : '';
  const contextTeam = teams.find((t) => record && identity(t, record.year) === managerKey);
  const target = teams.some((t) => t.teamId === team)
    ? team
    : (contextTeam?.teamId ?? teams[0]?.teamId);
  const source = teams.some((t) => t.teamId === donor) ? donor : (teams[1]?.teamId ?? target);
  const replay = record && alternateSchedule(record, target, source);
  return (
    <RecordEvidenceLayout
      evidence={
        <RecordEvidence
          records={records}
          scope={`${managerKey ?? 'league'}:${record?.year}`}
          entries={rows
            .filter((row) => (!managerKey || row.key === managerKey) && row.year === record?.year)
            .map((row) => ({
              id: `${row.year}:${row.teamId}`,
              year: row.year,
              title: `${row.name} · ${row.year} schedule`,
              detail: (
                <>
                  <p>
                    {number(row.actual)} actual wins against {number(row.expected)} expected wins.
                  </p>
                  <p>
                    {row.weeks}/{row.possibleWeeks ?? '?'} usable weeks; {row.games} completed
                    regular-season games. Opponent scoring difficulty: {number(row.difficulty)}{' '}
                    points per game.
                  </p>
                </>
              ),
            }))}
          empty="Schedule evidence unavailable for this manager in the selected season. Missing scores and unknown regular-season boundaries are excluded."
        />
      }
    >
      <details open={active || undefined} className="history-explorer-analysis">
        <summary>Expected wins and historical schedule difficulty</summary>
        <div className="history-explorer-definition">
          <span>Expected wins method</span>
          <InfoTooltip label="Expected wins method">
            Expected wins sum weekly all-play scoring percentiles for verified regular-season
            matchups with a unique finite score for every rostered team, ties worth half. Difficulty
            is opponent points per completed game.
          </InfoTooltip>
        </div>
        <p className="history-explorer-footnote">
          Scoring systems differ across years. Partial seasons are provisional. Byes add no wins.
          Missing scores are excluded.
        </p>
        {managerKey && (
          <fieldset className="history-explorer-view-switch" aria-label="Schedule comparison">
            <button type="button" aria-pressed={!showLeague} onClick={() => setShowLeague(false)}>
              Selected manager
            </button>
            <button type="button" aria-pressed={showLeague} onClick={() => setShowLeague(true)}>
              Whole league
            </button>
          </fieldset>
        )}
        <DataTable
          label="Historical expected wins"
          data={managerKey && !showLeague ? rows.filter((r) => r.key === managerKey) : rows}
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
        <div className="history-explorer-toolbar">
          <label>
            Schedule season{' '}
            <select
              value={record?.year ?? ''}
              onChange={(e) => {
                setYear(Number(e.target.value));
                onSeasonChange?.(Number(e.target.value));
              }}
            >
              {records.map((r) => (
                <option key={r.year} value={r.year}>
                  {r.year}
                </option>
              ))}
            </select>
          </label>
          <label>
            Replay team{' '}
            <select
              value={target ?? ''}
              onChange={(e) => {
                setTeamSelection({ managerKey, team: e.target.value });
                const selectedTeam = teams.find((t) => t.teamId === e.target.value);
                if (selectedTeam && record) onManagerChange?.(identity(selectedTeam, record.year));
              }}
            >
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
        </div>
        {managerKey && !contextTeam && (
          <p>
            This manager did not participate in the selected season. Replay is showing{' '}
            {teams.find((t) => t.teamId === target)?.managerName ?? 'an available team'}.
          </p>
        )}
        <div className="history-explorer-definition">
          <span>Schedule replay method</span>
          <InfoTooltip label="How schedule replay works">
            Replay preserves the target's same-season weekly scores against the schedule owner's
            opponents. Self-matchups are excluded; no replacement is invented.
          </InfoTooltip>
        </div>
        <p className="history-explorer-footnote">
          This is a partial counterfactual record, not a final placement. Unavailable and
          self-matchup weeks are listed with the result.
        </p>
        <p>
          {replay?.known
            ? `Alternate record: ${replay.wins}-${replay.losses}-${replay.ties}; ${replay.byes} byes; ${replay.skipped} unavailable or self-matchup weeks`
            : 'Regular-season boundary unavailable'}
        </p>
        <details className="history-explorer-methodology">
          <summary>Replay game evidence ({replay?.evidence.length ?? 0} weeks)</summary>
          <ul>
            {replay?.evidence.map((e) => (
              <li key={e.week}>
                Week {e.week}: {e.score} vs {e.opponent} {e.against} — {e.outcome}
              </li>
            ))}
          </ul>
        </details>
      </details>
    </RecordEvidenceLayout>
  );
}
