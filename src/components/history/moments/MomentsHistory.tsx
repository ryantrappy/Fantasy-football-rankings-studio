import { TradeNetwork } from './TradeNetwork';
import { LineupRegrets } from './LineupRegrets';
import { DroppedBreakouts } from './DroppedBreakouts';
import { DraftSkill } from './DraftSkill';
import { ProbabilityReplay } from './ProbabilityReplay';
import { useState } from 'react';
import type { SeasonRecord } from '../../../league-summary';
import { importArchive, mondayComebacks } from '../../../history/moments/archive';
export function MomentsHistory({
  records,
  years,
  leagueId,
}: {
  records: SeasonRecord[];
  years: number[];
  leagueId?: string;
}) {
  const [season, setSeason] = useState<number>(records[0]?.year || years[0]);
  const [manager, setManager] = useState('');
  const [threshold, setThreshold] = useState(0.1);
  const [json, setJson] = useState('');
  const [imports, setImports] = useState<Record<number, ReturnType<typeof importArchive>>>({});
  const [error, setError] = useState('');
  const record = records.find((r) => r.year === season);
  const data = record && {
    ...record.data,
    matchupArchive: imports[season] ?? record.data.matchupArchive,
  };
  const rows = data
    ? mondayComebacks(data, threshold).filter((r) => !manager || r.teamId === manager)
    : [];
  const name = (id: string) => data?.teams.find((t) => t.teamId === id)?.managerName || id;
  return (
    <section aria-label="Historical moments">
      <h2>Historical moments</h2>
      <label>
        Moments season{' '}
        <select
          value={season}
          onChange={(e) => {
            setSeason(Number(e.target.value));
            setManager('');
          }}
        >
          {years.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </label>
      <label>
        Moments manager{' '}
        <select value={manager} onChange={(e) => setManager(e.target.value)}>
          <option value="">League-wide</option>
          {data?.teams.map((t) => (
            <option key={t.teamId} value={t.teamId}>
              {t.managerName}
            </option>
          ))}
        </select>
      </label>
      <details open>
        <summary>Monday miracles</summary>
        <label>
          Pre-Monday probability at most{' '}
          <input
            type="number"
            min="0"
            max="100"
            value={threshold * 100}
            onChange={(e) => setThreshold(Math.max(0, Math.min(100, Number(e.target.value))) / 100)}
          />
          %
        </label>
        <p>
          Only supplied archives with an explicit pre-Monday checkpoint qualify. Final scores never
          imply an earlier probability. Archive provenance is user-supplied and must be verified by
          its author.
        </p>
        {!data?.matchupArchive?.length && (
          <p>Unavailable: no in-game probability archive for this season.</p>
        )}
        {data?.matchupArchive?.length && !rows.length ? (
          <p>No verified wins meet this threshold.</p>
        ) : null}
        <ul>
          {rows.map((r, i) => (
            <li key={i}>
              Week {r.week}: {name(r.teamId)} over {name(r.opponentTeamId)},{' '}
              {(r.probability * 100).toFixed(1)}% → win {r.final}. Source: {r.source}. Checkpoint:{' '}
              {r.preMondayAt}. Contributors:{' '}
              {r.contributors
                .map(
                  (p) => `${data?.playerIdentities?.[p.playerId]?.name || p.playerId}: ${p.points}`,
                )
                .join(', ') || 'Not supplied'}
              .
            </li>
          ))}
        </ul>
      </details>
      {record && <TradeNetwork record={record} records={records} manager={manager} />}
      {data && <LineupRegrets data={data} manager={manager} />}
      {data && <DroppedBreakouts data={data} manager={manager} />}
      {record && <DraftSkill record={record} records={records} manager={manager} />}
      {data && <ProbabilityReplay data={data} manager={manager} />}
      <details>
        <summary>Import or export an archive</summary>
        <p>
          Paste the documented JSON contract. Imports stay in this view until exported; refreshing
          discards unsaved imports. No provider credentials or private notes belong in this public
          archive.
        </p>
        <label>
          Archive JSON <textarea value={json} onChange={(e) => setJson(e.target.value)} />
        </label>
        <button
          disabled={!data}
          onClick={() => {
            try {
              setImports({ ...imports, [season]: importArchive(json, data!) });
              setError('');
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Invalid archive');
            }
          }}
        >
          Import archive
        </button>
        <button
          disabled={!data?.matchupArchive}
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([JSON.stringify(data?.matchupArchive, null, 2)], {
                type: 'application/json',
              }),
            );
            const a = document.createElement('a');
            a.href = url;
            a.download = `${leagueId || 'league'}-${season}-archive.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export archive
        </button>
        {error && <p role="alert">{error}</p>}
      </details>
    </section>
  );
}
