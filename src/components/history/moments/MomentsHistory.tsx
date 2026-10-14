import { Button, Flex } from '@chakra-ui/react';
import { TradeContributions } from './TradeContributions';
import { TradeNetwork } from './TradeNetwork';
import { LineupRegrets } from './LineupRegrets';
import { DroppedBreakouts } from './DroppedBreakouts';
import { DraftSkill } from './DraftSkill';
import { ProbabilityReplay } from './ProbabilityReplay';
import { useId, useState } from 'react';
import type { SeasonRecord } from '../../../league-summary';
import { importArchive, mondayComebacks } from '../../../history/moments/archive';
import { managerKey as identityKey } from '../../../history/competition/games';

const views = [
  ['miracles', 'Monday miracles'],
  ['trades', 'Trades'],
  ['network', 'Trade network'],
  ['lineups', 'Lineup regrets'],
  ['drops', 'Dropped breakouts'],
  ['draft', 'Draft skill'],
  ['replay', 'Probability replay'],
  ['archive', 'Archive tools'],
] as const;
export function MomentsHistory({
  records,
  years,
  leagueId,
  managerKey,
  seasonYear,
  onSeasonChange,
}: {
  records: SeasonRecord[];
  years: number[];
  leagueId?: string;
  managerKey?: string;
  seasonYear?: number;
  onSeasonChange?: (year: number) => void;
}) {
  const [selectedSeason, setSeason] = useState<number>(records[0]?.year || years[0]);
  const requestedSeason = seasonYear ?? selectedSeason;
  const season = years.includes(requestedSeason) ? requestedSeason : years[0];
  const [localManager, setManager] = useState('');
  const [view, setView] = useState<(typeof views)[number][0]>('miracles');
  const [visited, setVisited] = useState(() => new Set<string>(['miracles']));
  const viewId = useId();
  const [threshold, setThreshold] = useState(0.1);
  const [json, setJson] = useState('');
  const [imports, setImports] = useState<Record<number, ReturnType<typeof importArchive>>>({});
  const [error, setError] = useState('');
  const record = records.find((r) => r.year === season);
  const data = record && {
    ...record.data,
    matchupArchive: imports[season] ?? record.data.matchupArchive,
  };
  const selectedTeam = data?.teams.find((team) => identityKey(team, season) === managerKey);
  const manager = managerKey === undefined ? localManager : selectedTeam?.teamId || '';
  const missingManager = !!data && !!managerKey && !selectedTeam;
  const rows = data
    ? mondayComebacks(data, threshold).filter((r) => !manager || r.teamId === manager)
    : [];
  const name = (id: string) => data?.teams.find((t) => t.teamId === id)?.managerName || id;
  return (
    <section aria-label="Historical moments">
      <h2>Historical moments</h2>
      <div className="history-filters">
        <label>
          Moments season{' '}
          <select
            value={season}
            onChange={(e) => {
              setSeason(Number(e.target.value));
              onSeasonChange?.(Number(e.target.value));
              setManager('');
            }}
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
        {managerKey === undefined && (
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
        )}
      </div>
      <nav className="history-explorer-subnav" aria-label="Historical moments views">
        {views.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            aria-controls={`${viewId}-${id}`}
            onClick={() => {
              setView(id);
              setVisited((current) => new Set(current).add(id));
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      {(!data || missingManager) && (
        <output className="history-explorer-empty">
          {missingManager
            ? 'This manager has no team in this season. Choose another season to explore their moments.'
            : 'Season history unavailable. Choose a loaded season to explore moments.'}
        </output>
      )}
      <div
        id={`${viewId}-miracles`}
        className="history-explorer-view"
        hidden={view !== 'miracles' || missingManager || !data}
      >
        <details open>
          <summary>Monday miracles</summary>
          <label>
            Pre-Monday probability at most{' '}
            <input
              type="number"
              min="0"
              max="100"
              value={threshold * 100}
              onChange={(e) =>
                setThreshold(Math.max(0, Math.min(100, Number(e.target.value))) / 100)
              }
            />
            %
          </label>
          <p>
            Only supplied archives with an explicit pre-Monday checkpoint qualify. Final scores
            never imply an earlier probability. Archive provenance is user-supplied and must be
            verified by its author.
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
                    (p) =>
                      `${data?.playerIdentities?.[p.playerId]?.name || p.playerId}: ${p.points}`,
                  )
                  .join(', ') || 'Not supplied'}
                .
              </li>
            ))}
          </ul>
        </details>
      </div>
      <div
        id={`${viewId}-trades`}
        className="history-explorer-view"
        hidden={view !== 'trades' || missingManager || !data}
      >
        {visited.has('trades') && data && <TradeContributions data={data} manager={manager} open />}
      </div>
      <div
        id={`${viewId}-network`}
        className="history-explorer-view"
        hidden={view !== 'network' || missingManager || !data}
      >
        {visited.has('network') && record && (
          <TradeNetwork record={record} records={records} manager={manager} open />
        )}
      </div>
      <div
        id={`${viewId}-lineups`}
        className="history-explorer-view"
        hidden={view !== 'lineups' || missingManager || !data}
      >
        {visited.has('lineups') && data && <LineupRegrets data={data} manager={manager} open />}
      </div>
      <div
        id={`${viewId}-drops`}
        className="history-explorer-view"
        hidden={view !== 'drops' || missingManager || !data}
      >
        {visited.has('drops') && data && <DroppedBreakouts data={data} manager={manager} open />}
      </div>
      <div
        id={`${viewId}-draft`}
        className="history-explorer-view"
        hidden={view !== 'draft' || missingManager || !data}
      >
        {visited.has('draft') && record && (
          <DraftSkill record={record} records={records} manager={manager} open />
        )}
      </div>
      <div
        id={`${viewId}-replay`}
        className="history-explorer-view"
        hidden={view !== 'replay' || missingManager || !data}
      >
        {visited.has('replay') && data && <ProbabilityReplay data={data} manager={manager} open />}
      </div>
      <div id={`${viewId}-archive`} className="history-explorer-view" hidden={view !== 'archive'}>
        {visited.has('archive') && (
          <details open>
            <summary>Import or export an archive</summary>
            <p>Archive tools manage the league-wide archive for this season.</p>
            <p>
              Paste the documented JSON contract. Imports stay in this view until exported;
              refreshing discards unsaved imports. No provider credentials or private notes belong
              in this public archive.
            </p>
            <label>
              Archive JSON <textarea value={json} onChange={(e) => setJson(e.target.value)} />
            </label>
            <Flex gap={3} wrap="wrap" mt={4}>
              <Button
                type="button"
                variant="outline"
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
              </Button>
              <Button
                type="button"
                variant="outline"
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
              </Button>
            </Flex>
            {error && <p role="alert">{error}</p>}
          </details>
        )}
      </div>
    </section>
  );
}
