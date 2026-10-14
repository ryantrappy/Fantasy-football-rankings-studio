import { useId, useMemo, useState, type ReactNode } from 'react';
import type { SeasonRecord } from '../../league-summary';
import { average, summarizeLeague } from '../../league-summary';
import { competitionGames, managerKey as identity } from '../../history/competition/games';
import { DataTable } from '../DataTable';
import { Icon } from '../Icon';
import { CompetitionHistory, number } from './competition/CompetitionHistory';
import { MomentsHistory } from './moments/MomentsHistory';
import { PersonalitiesHistory } from './personalities/PersonalitiesHistory';
import { HonorsHistory } from './competition/HonorsHistory';
import { ErasHistory } from './competition/ErasHistory';
import { RecordsHistory } from './competition/RecordsHistory';
import { PainHistory } from './competition/PainHistory';

const groups = ['Competition', 'Season history', 'Matchup stories', 'Manager profiles'] as const;
const archiveViews = [
  {
    key: 'overview',
    name: 'League overview',
    description: 'Achievements and long-term leaders',
    icon: 'chart',
  },
  {
    key: 'comparison',
    name: 'Manager comparison',
    description: 'Compare two ownership groups',
    icon: 'players',
  },
  {
    key: 'honors',
    name: 'Hall of Fame & Shame',
    description: 'Honors and evidence-backed low points',
    icon: 'trophy',
  },
  {
    key: 'eras',
    name: 'Competitive eras',
    description: 'Dynasties and sustained success',
    icon: 'archive',
  },
  {
    key: 'records',
    name: 'Matchup records',
    description: 'Scoring highs, close games, and worst beats',
    icon: 'ball',
  },
  {
    key: 'pain',
    name: 'Weekly Pain Index',
    description: 'Losses grouped by evidence coverage',
    icon: 'chart',
  },
] as const;
type ArchiveView = (typeof archiveViews)[number]['key'];

export function HistoryAnalytics({
  records,
  years,
  leagueId,
  shared = false,
  snapshot = false,
  managerKey,
  onManagerChange,
  activeManagerKeys,
  includeFormer = false,
  onIncludeFormerChange,
  seasonHistory,
  leagueOverview,
  comparison,
}: {
  records: SeasonRecord[];
  years: number[];
  leagueId: string;
  shared?: boolean;
  snapshot?: boolean;
  managerKey?: string;
  onManagerChange?: (key: string) => void;
  activeManagerKeys?: string[];
  includeFormer?: boolean;
  onIncludeFormerChange?: (value: boolean) => void;
  seasonHistory?: ReactNode;
  leagueOverview?: ReactNode;
  comparison?: ReactNode;
}) {
  const id = useId();
  const { games, managers } = useMemo(() => competitionGames(records), [records]);
  const choices = [...managers]
    .filter(
      ([key]) =>
        activeManagerKeys === undefined || includeFormer || activeManagerKeys.includes(key),
    )
    .sort((a, b) => a[1].localeCompare(b[1]));
  const [selected, setSelected] = useState('');
  const requested = managerKey ?? selected;
  const key = choices.some(([value]) => value === requested) ? requested : (choices[0]?.[0] ?? '');
  const name = managers.get(key) ?? 'No manager selected';
  const [active, setActive] = useState(0);
  const [visited, setVisited] = useState([0]);
  const [archive, setArchive] = useState<ArchiveView | null>(null);
  const [archiveVisited, setArchiveVisited] = useState<ArchiveView[]>([]);
  const managerGames = games.filter((game) => game.a.key === key || game.b.key === key);
  const wins = managerGames.filter((game) => {
    const [own, opponent] = game.a.key === key ? [game.a, game.b] : [game.b, game.a];
    return own.points > opponent.points;
  }).length;
  const ties = managerGames.filter((game) => game.a.points === game.b.points).length;
  const losses = managerGames.length - wins - ties;
  const seasons = records.filter((record) =>
    record.data.teams.some((team) => identity(team, record.year) === key),
  ).length;
  function chooseManager(next: string) {
    if (activeManagerKeys && !includeFormer && !activeManagerKeys.includes(next))
      onIncludeFormerChange?.(true);
    setSelected(next);
    onManagerChange?.(next);
  }
  function selectGroup(index: number) {
    setActive(index);
    setVisited((previous) => (previous.includes(index) ? previous : [...previous, index]));
  }
  const archiveProps = {
    records,
    years,
    leagueId: snapshot ? undefined : leagueId,
    shared,
    active: true,
  };
  return (
    <section className="history-analytics history-explorer" aria-label="Manager explorer">
      <div className="history-explorer-intro">
        <div>
          <p className="eyebrow">Explore a manager</p>
          <h2>Manager explorer</h2>
          <p>Choose a manager, then explore one part of their history at a time.</p>
        </div>
        {onIncludeFormerChange && (
          <label className="history-explorer-former">
            <input
              type="checkbox"
              checked={includeFormer}
              onChange={(event) => onIncludeFormerChange(event.target.checked)}
            />{' '}
            Include former managers
          </label>
        )}
      </div>
      <label
        className={`history-explorer-manager-select${choices.length <= 8 ? ' history-explorer-manager-select-mobile' : ''}`}
      >
        Explore a manager
        <select
          value={key}
          onChange={(event) => chooseManager(event.target.value)}
          disabled={!choices.length}
        >
          {!choices.length && <option value="">No managers available</option>}
          {choices.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      {choices.length <= 8 && (
        <fieldset className="history-explorer-managers" aria-label="Explore a manager">
          {choices.map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={value === key}
              onClick={() => chooseManager(value)}
            >
              <span className="history-explorer-avatar" aria-hidden="true">
                {label
                  .split(/\s+/)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
              <span>{label}</span>
            </button>
          ))}
        </fieldset>
      )}
      {!choices.length ? (
        <p className="notice">
          No managers are available in this selection.{' '}
          {onIncludeFormerChange && 'Include former managers to explore earlier ownership groups.'}
        </p>
      ) : (
        <div className="history-explorer-dossier">
          <div className="history-explorer-profile">
            <div className="history-explorer-identity">
              <span className="history-explorer-avatar" aria-hidden="true">
                {name
                  .split(/\s+/)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
              <div>
                <h2>{name}</h2>
                <p>
                  {seasons} of {years.length} selected seasons · verified matchups
                </p>
              </div>
            </div>
            <dl className="history-explorer-stats">
              <div>
                <dt>Record (W–L–T)</dt>
                <dd>{managerGames.length ? `${wins}–${losses}–${ties}` : 'Unavailable'}</dd>
              </div>
              <div>
                <dt>Win rate</dt>
                <dd>
                  {managerGames.length
                    ? `${number(((wins + ties / 2) / managerGames.length) * 100)}%`
                    : 'Unavailable'}
                </dd>
              </div>
              <div>
                <dt>Games</dt>
                <dd>{managerGames.length}</dd>
              </div>
            </dl>
          </div>
          <div role="tablist" aria-label="Historical analytics" className="history-explorer-tabs">
            {groups.map((group, index) => (
              <button
                key={group}
                type="button"
                role="tab"
                id={`${id}-tab-${index}`}
                aria-selected={index === active}
                aria-controls={`${id}-panel-${index}`}
                tabIndex={index === active ? 0 : -1}
                onClick={() => selectGroup(index)}
                onKeyDown={(event) => {
                  const next =
                    event.key === 'Home'
                      ? 0
                      : event.key === 'End'
                        ? groups.length - 1
                        : event.key === 'ArrowRight'
                          ? (index + 1) % groups.length
                          : event.key === 'ArrowLeft'
                            ? (index + groups.length - 1) % groups.length
                            : null;
                  if (next === null) return;
                  event.preventDefault();
                  selectGroup(next);
                  document.getElementById(`${id}-tab-${next}`)?.focus();
                }}
              >
                {group}
              </button>
            ))}
          </div>
          {groups.map((group, index) => (
            <div
              key={group}
              role="tabpanel"
              id={`${id}-panel-${index}`}
              aria-labelledby={`${id}-tab-${index}`}
              hidden={index !== active}
              tabIndex={0}
            >
              {visited.includes(index) && index === 0 && (
                <CompetitionHistory
                  {...archiveProps}
                  managerKey={key}
                  onManagerChange={chooseManager}
                />
              )}
              {visited.includes(index) && index === 1 && (
                <section className="history-explorer-view">
                  <h3>Season history</h3>
                  <p>Year-by-year results for {name}. Missing results stay unavailable.</p>
                  <ManagerSeasonHistory
                    records={records}
                    managerKey={key}
                    leagueId={snapshot ? undefined : leagueId}
                    shared={shared}
                  />
                  {seasonHistory && (
                    <details className="history-explorer-method">
                      <summary>Detailed season metrics</summary>
                      {seasonHistory}
                    </details>
                  )}
                </section>
              )}
              {visited.includes(index) && index === 2 && (
                <MomentsHistory
                  records={records}
                  years={years}
                  leagueId={snapshot ? undefined : leagueId}
                  managerKey={key}
                />
              )}
              {visited.includes(index) && index === 3 && (
                <PersonalitiesHistory
                  records={records}
                  years={years}
                  leagueId={snapshot ? undefined : leagueId}
                  shared={shared}
                  managerKey={key}
                />
              )}
            </div>
          ))}
        </div>
      )}
      <details className="history-explorer-library">
        <summary>
          <span>
            <Icon name="archive" size={18} /> Browse the whole league archive{' '}
            <small>Records, comparisons, and more</small>
          </span>
          <Icon name="down" size={16} />
        </summary>
        <fieldset className="history-explorer-library-grid" aria-label="League archive views">
          {archiveViews
            .filter((view) => view.key !== 'overview' || leagueOverview)
            .filter((view) => view.key !== 'comparison' || comparison)
            .map((view) => (
              <button
                type="button"
                key={view.key}
                aria-pressed={archive === view.key}
                aria-controls={`${id}-archive-${view.key}`}
                onClick={() => {
                  setArchive(view.key);
                  setArchiveVisited((previous) =>
                    previous.includes(view.key) ? previous : [...previous, view.key],
                  );
                }}
              >
                <Icon name={view.icon} size={18} />
                <span>
                  {view.name}
                  <small>{view.description}</small>
                </span>
                <Icon name="arrow" size={16} />
              </button>
            ))}
        </fieldset>
        {archiveViews.map((view) => (
          <section
            key={view.key}
            id={`${id}-archive-${view.key}`}
            hidden={archive !== view.key}
            className="history-explorer-archive-view"
            aria-label={view.name}
          >
            {archiveVisited.includes(view.key) &&
              (view.key === 'overview' ? (
                leagueOverview
              ) : view.key === 'comparison' ? (
                comparison
              ) : view.key === 'honors' ? (
                <HonorsHistory {...archiveProps} />
              ) : view.key === 'eras' ? (
                <ErasHistory {...archiveProps} />
              ) : view.key === 'records' ? (
                <RecordsHistory {...archiveProps} />
              ) : (
                <PainHistory {...archiveProps} />
              ))}
          </section>
        ))}
      </details>
    </section>
  );
}

function ManagerSeasonHistory({
  records,
  managerKey,
  leagueId,
  shared,
}: {
  records: SeasonRecord[];
  managerKey: string;
  leagueId?: string;
  shared: boolean;
}) {
  const rows = useMemo(
    () =>
      records.flatMap((record) => {
        const manager = summarizeLeague([record]).find((row) => row.key === managerKey);
        if (!manager) return [];
        const games = competitionGames([record]).games.filter(
          (game) => game.a.key === managerKey || game.b.key === managerKey,
        );
        const wins = games.filter((game) =>
          game.a.key === managerKey ? game.a.points > game.b.points : game.b.points > game.a.points,
        ).length;
        const ties = games.filter((game) => game.a.points === game.b.points).length;
        return [
          {
            year: record.year,
            ...manager,
            games: games.length,
            wins,
            ties,
            losses: games.length - wins - ties,
          },
        ];
      }),
    [records, managerKey],
  );
  return (
    <div className="insight-table-wrap">
      <DataTable
        label="Manager season results"
        data={rows}
        getRowId={(row) => String(row.year)}
        initialSorting={[{ id: 'year', desc: true }]}
        columns={[
          {
            id: 'year',
            header: 'Season',
            value: (row) => row.year,
            cell: (row) =>
              leagueId ? (
                <a
                  href={`${shared ? '/shared/insights' : '/insights'}?leagueId=${encodeURIComponent(leagueId)}&year=${row.year}`}
                >
                  {row.year}
                </a>
              ) : (
                row.year
              ),
          },
          {
            id: 'record',
            header: 'W–L–T',
            value: (row) => row.wins,
            cell: (row) => (row.games ? `${row.wins}–${row.losses}–${row.ties}` : 'Unavailable'),
          },
          {
            id: 'rate',
            header: 'Win %',
            value: (row) => (row.games ? ((row.wins + row.ties / 2) / row.games) * 100 : null),
            cell: (row) =>
              row.games
                ? `${number(((row.wins + row.ties / 2) / row.games) * 100)}%`
                : 'Unavailable',
          },
          {
            id: 'points',
            header: 'Avg. points',
            value: (row) => average(row.totalPoints, row.weeks),
            cell: (row) => number(average(row.totalPoints, row.weeks)),
          },
          {
            id: 'finish',
            header: 'Final finish',
            value: (row) => average(row.finishTotal, row.finishSeasons),
            cell: (row) => number(average(row.finishTotal, row.finishSeasons)),
          },
        ]}
      />
    </div>
  );
}
