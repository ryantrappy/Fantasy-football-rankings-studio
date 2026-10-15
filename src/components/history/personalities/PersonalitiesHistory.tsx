import { RecordEvidence, RecordEvidenceLayout } from '../RecordEvidence';
import { Wrapped } from './Wrapped';
import { Archetypes } from './Archetypes';
import { DraftOverlap } from './DraftOverlap';
import { PlayerLoyalty } from './PlayerLoyalty';
import { PlayerImpact } from './PlayerImpact';
import { useId, useState } from 'react';
import type { SeasonRecord } from '../../../league-summary';
import { transactionActivity } from '../../../history/personalities/activity';
import { competitionGames } from '../../../history/competition/games';

const views = [
  ['activity', 'Activity'],
  ['impact', 'Player impact'],
  ['loyalty', 'Player loyalty'],
  ['overlap', 'Draft overlap'],
  ['archetypes', 'Archetypes'],
  ['wrapped', 'Wrapped'],
] as const;
export function PersonalitiesHistory({
  records,
  years,
  leagueId,
  shared,
  managerKey,
  seasonYear,
  onSeasonChange,
}: {
  records: SeasonRecord[];
  years: number[];
  leagueId?: string;
  shared?: boolean;
  managerKey?: string;
  seasonYear?: number;
  onSeasonChange?: (year: number) => void;
}) {
  const [labels, setLabels] = useState(false);
  const [localManager, setManager] = useState('');
  const [view, setView] = useState<(typeof views)[number][0]>('activity');
  const [visited, setVisited] = useState(() => new Set<string>(['activity']));
  const viewId = useId();
  const manager = managerKey ?? localManager;
  const managers = competitionGames(records).managers;
  const activity = transactionActivity(records).filter((row) => !manager || row.key === manager);
  return (
    <section className="panel insight-section" aria-label="Manager personalities">
      <h2>Manager personalities</h2>
      {managerKey === undefined && (
        <div className="history-filters">
          <label>
            Personality manager{' '}
            <select value={manager} onChange={(event) => setManager(event.target.value)}>
              <option value="">All managers</option>
              {[...managers].map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
      <nav className="history-explorer-subnav" aria-label="Manager personalities views">
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
      <div id={`${viewId}-activity`} className="history-explorer-view" hidden={view !== 'activity'}>
        <RecordEvidenceLayout
          evidence={
            <RecordEvidence
              records={records}
              scope={manager}
              entries={activity.map((row) => ({
                id: `${row.year}:${row.key}`,
                year: row.year,
                title: `${row.manager} · ${row.year} activity`,
                detail: (
                  <>
                    <p>
                      {row.pickups ?? 'Unsupported'} pickups, {row.drops ?? 'unsupported'} drops and{' '}
                      {row.trades ?? 'unsupported'} trades.
                    </p>
                    <p>
                      Provider coverage: {row.coverage}. Waiver claims are unsupported when the
                      provider does not distinguish them.
                    </p>
                  </>
                ),
              }))}
              empty="No transaction activity for this manager in the selected seasons. Missing provider categories remain unsupported."
            />
          }
        >
          <details open>
            <summary>Transaction activity</summary>
            <p>
              Activity coverage: {records.length}/{years.length} selected seasons. Waiver claims are
              unsupported when providers do not distinguish them from free-agent pickups.
            </p>
            <label>
              <input
                type="checkbox"
                checked={labels}
                onChange={(e) => setLabels(e.target.checked)}
              />{' '}
              Show playful activity labels
            </label>
            {labels && (
              <p>
                Tinkerer: at least two pickups plus drops per covered week. Steady hand: fewer than
                two. Requires complete coverage and at least four weeks.
              </p>
            )}
            <div style={{ overflowX: 'auto' }}>
              <table>
                <caption>Transactions per manager and season</caption>
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>Manager</th>
                    <th>Pickups</th>
                    <th>Drops</th>
                    <th>Trades</th>
                    <th>Coverage</th>
                    {labels && <th>Activity</th>}
                  </tr>
                </thead>
                <tbody>
                  {activity.map((row) => (
                    <tr key={`${row.year}:${row.key}`}>
                      <td>{row.year}</td>
                      <th scope="row">{row.manager}</th>
                      <td>{row.pickups ?? 'Unsupported'}</td>
                      <td>{row.drops ?? 'Unsupported'}</td>
                      <td>{row.trades ?? 'Unsupported'}</td>
                      <td>{row.coverage}</td>
                      {labels && <td>{row.label || 'Insufficient evidence'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </RecordEvidenceLayout>
        {!activity.length && (
          <p>No transaction activity available for this manager in the selected seasons.</p>
        )}
      </div>
      <div id={`${viewId}-impact`} className="history-explorer-view" hidden={view !== 'impact'}>
        {visited.has('impact') && <PlayerImpact records={records} managerKey={manager} open />}
      </div>
      <div id={`${viewId}-loyalty`} className="history-explorer-view" hidden={view !== 'loyalty'}>
        {visited.has('loyalty') && <PlayerLoyalty records={records} managerKey={manager} open />}
      </div>
      <div id={`${viewId}-overlap`} className="history-explorer-view" hidden={view !== 'overlap'}>
        <p>League-wide comparison: explore shared draft targets between every manager pair.</p>
        {visited.has('overlap') && <DraftOverlap records={records} open />}
      </div>
      <div
        id={`${viewId}-archetypes`}
        className="history-explorer-view"
        hidden={view !== 'archetypes'}
      >
        {visited.has('archetypes') && <Archetypes records={records} managerKey={manager} open />}
      </div>
      <div id={`${viewId}-wrapped`} className="history-explorer-view" hidden={view !== 'wrapped'}>
        {visited.has('wrapped') && (
          <Wrapped
            key={manager}
            records={records}
            leagueId={leagueId}
            shared={shared}
            managerKey={manager}
            seasonYear={seasonYear}
            onSeasonChange={onSeasonChange}
            open
          />
        )}
      </div>
    </section>
  );
}
