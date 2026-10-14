import { useId, useState } from 'react';
import type { SeasonRecord } from '../../../league-summary';
import { competitionGames, pairRecord, rivalryLabels } from '../../../history/competition/games';
import { CompetitionTable as DataTable } from './CompetitionTable';
import { PlayoffsHistory } from './PlayoffsHistory';
import { EloHistory } from './EloHistory';
import { ScheduleHistory } from './ScheduleHistory';

export const number = (n: number | null | undefined) =>
  n == null ? 'Unavailable' : n.toLocaleString(undefined, { maximumFractionDigits: 2 });
export interface CompetitionProps {
  records: SeasonRecord[];
  years: number[];
  leagueId?: string;
  shared?: boolean;
  managerKey?: string;
  onManagerChange?: (key: string) => void;
  active?: boolean;
}

const views = [
  ['rivalries', 'Rivalries'],
  ['schedule', 'Schedule & luck'],
  ['elo', 'Elo ratings'],
  ['playoffs', 'Playoffs'],
] as const;

export function CompetitionHistory({
  records,
  years,
  leagueId,
  shared,
  managerKey,
  onManagerChange,
}: CompetitionProps) {
  const { games, managers, skipped } = competitionGames(records);
  const [selected, setSelected] = useState('');
  const key =
    managerKey && managers.has(managerKey)
      ? managerKey
      : managers.has(selected)
        ? selected
        : [...managers.keys()][0];
  const [view, setView] = useState<(typeof views)[number][0]>('rivalries');
  const [visited, setVisited] = useState<Partial<Record<(typeof views)[number][0], boolean>>>({
    rivalries: true,
  });
  const [matrix, setMatrix] = useState(false);
  const [minimum, setMinimum] = useState(3);
  const [query, setQuery] = useState('');
  const [opponent, setOpponent] = useState('');
  const regionId = useId();
  const rows = [...managers.keys()].filter((k) => k !== key).map((k) => pairRecord(games, key, k));
  const labels = rivalryLabels(rows, minimum);
  const filteredRows = rows.filter((r) =>
    managers.get(r.opponent)?.toLowerCase().includes(query.toLowerCase()),
  );
  const rivalry =
    rows.find((r) => r.opponent === opponent) ?? [...rows].sort((a, b) => b.games - a.games)[0];
  const meetings = games
    .filter(
      (g) =>
        (g.a.key === key && g.b.key === rivalry?.opponent) ||
        (g.b.key === key && g.a.key === rivalry?.opponent),
    )
    .reverse();
  const changeManager = (next: string) => {
    setSelected(next);
    onManagerChange?.(next);
  };
  const seasonHref = (year: number) =>
    `${shared ? '/shared/insights' : '/insights'}?leagueId=${encodeURIComponent(leagueId ?? '')}&year=${year}`;
  const context = {
    records,
    years,
    leagueId,
    shared,
    managerKey: key,
    onManagerChange: changeManager,
    active: true,
  };
  const gameEvidence = (limit?: number) => (
    <ol className="history-rivalry-games">
      {meetings.slice(0, limit).map((game) => {
        const [own, other] = game.a.key === key ? [game.a, game.b] : [game.b, game.a];
        const result =
          own.points > other.points ? 'Win' : own.points < other.points ? 'Loss' : 'Tie';
        const when = `${game.year} · ${game.weeks.length > 1 ? `Weeks ${game.weeks.join(', ')}` : `Week ${game.week}`}`;
        return (
          <li key={game.id}>
            {leagueId ? <a href={seasonHref(game.year)}>{when}</a> : <span>{when}</span>}
            <strong className={`history-rivalry-result history-rivalry-${result.toLowerCase()}`}>
              {result} · {number(own.points)} – {number(other.points)}
            </strong>
            <small>
              {game.phase === 'playoff'
                ? 'Playoff series'
                : game.phase === 'regular'
                  ? 'Regular season'
                  : 'Season phase unavailable'}
            </small>
          </li>
        );
      })}
    </ol>
  );
  return (
    <section className="history-explorer-competition" aria-label="Competition history">
      {!managerKey && (
        <label className="history-explorer-manager-fallback">
          Head-to-head manager{' '}
          <select value={key || ''} onChange={(e) => changeManager(e.target.value)}>
            {[...managers].map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
      <fieldset className="history-explorer-subnav" aria-label="Competition views">
        {views.map(([id, title]) => (
          <button
            key={id}
            type="button"
            aria-pressed={view === id}
            aria-controls={regionId}
            onClick={() => {
              setView(id);
              setVisited((current) => (current[id] ? current : { ...current, [id]: true }));
            }}
          >
            {title}
          </button>
        ))}
      </fieldset>
      <div id={regionId}>
        {visited.schedule && (
          <div hidden={view !== 'schedule'}>
            <ScheduleHistory {...context} />
          </div>
        )}
        {visited.elo && (
          <div hidden={view !== 'elo'}>
            <EloHistory {...context} />
          </div>
        )}
        {visited.playoffs && (
          <div hidden={view !== 'playoffs'}>
            <PlayoffsHistory {...context} />
          </div>
        )}
        <div hidden={view !== 'rivalries'}>
          <div className="history-explorer-sectionhead">
            <div>
              <h3>Head-to-head</h3>
              <p>
                {managers.get(key) ?? 'Select a manager'} against the league. Select an opponent to
                inspect the games.
              </p>
            </div>
            <fieldset
              className="history-explorer-view-switch"

              aria-label="Rivalry display"
            >
              <button type="button" aria-pressed={!matrix} onClick={() => setMatrix(false)}>
                Opponent records
              </button>
              <button type="button" aria-pressed={matrix} onClick={() => setMatrix(true)}>
                League matrix
              </button>
            </fieldset>
          </div>
          <div className="history-rivalry-layout">
            <div className="history-rivalry-main">
              <div className="history-rivalry-highlights">
                {Object.entries(labels).map(([label, r]) => (
                  <button
                    key={label}
                    type="button"
                    className="history-rivalry-highlight"
                    disabled={!r}
                    onClick={() => r && setOpponent(r.opponent)}
                  >
                    <span>
                      {label === 'punchingBag'
                        ? 'Punching bag'
                        : label === 'rival'
                          ? 'Closest rival'
                          : 'Kryptonite'}
                    </span>
                    <strong>{r ? managers.get(r.opponent) : 'Insufficient samples'}</strong>
                    <small>
                      {r
                        ? `${r.wins}-${r.losses}-${r.ties} · ${r.games} games`
                        : `At least ${minimum} meetings required`}
                    </small>
                  </button>
                ))}
              </div>
              <div className="history-explorer-toolbar">
                {!matrix && (
                  <label>
                    Search opponents{' '}
                    <input
                      type="search"
                      placeholder="Find an opponent"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                )}
                <label>
                  Minimum rivalry games{' '}
                  <input
                    type="number"
                    min={1}
                    value={minimum}
                    onChange={(e) =>
                      setMinimum(Math.max(1, Math.floor(Number(e.target.value) || 1)))
                    }
                  />
                </label>
              </div>
              {matrix ? (
                <div className="history-rivalry-matrix insight-table-wrap">
                  <p>
                    Row manager’s W-L-T record against each opponent. Select a record to inspect
                    that pair.
                  </p>
                  <table className="insight-table">
                    <caption>League rivalry matrix</caption>
                    <thead>
                      <tr>
                        <th scope="col">Manager</th>
                        {[...managers].map(([k, n]) => (
                          <th key={k} scope="col">
                            {n}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[...managers].map(([k, n]) => (
                        <tr key={k}>
                          <th scope="row">{n}</th>
                          {[...managers].map(([o, name]) => {
                            const r = pairRecord(games, k, o);
                            return (
                              <td key={o}>
                                {o === k ? (
                                  '—'
                                ) : (
                                  <button
                                    type="button"
                                    aria-label={`Inspect ${n} versus ${name}: ${r.games ? `${r.wins}-${r.losses}-${r.ties}, ${r.games} games` : 'no verified games'}`}
                                    aria-pressed={k === key && o === rivalry?.opponent}
                                    onClick={() => {
                                      changeManager(k);
                                      setOpponent(o);
                                    }}
                                  >
                                    {r.games ? `${r.wins}-${r.losses}-${r.ties}` : 'Unavailable'}
                                    <small>
                                      {r.games} games{r.games < minimum ? ' · Low sample' : ''}
                                    </small>
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <>
                  <DataTable
                    label="All-time head-to-head"
                    className="insight-table history-rivalry-table"
                    data={filteredRows}
                    getRowId={(r) => r.opponent}
                    initialSorting={[{ id: 'games', desc: true }]}
                    columns={[
                      {
                        id: 'name',
                        header: 'Opponent',
                        value: (r) => managers.get(r.opponent),
                        cell: (r) => (
                          <button
                            type="button"
                            className="history-rivalry-opponent"
                            aria-pressed={r.opponent === rivalry?.opponent}
                            aria-label={`Inspect rivalry with ${managers.get(r.opponent)}`}
                            onClick={() => setOpponent(r.opponent)}
                          >
                            {managers.get(r.opponent)}
                          </button>
                        ),
                      },
                      {
                        id: 'record',
                        header: 'W-L-T',
                        value: (r) => r.wins,
                        exportValue: (r) => `${r.wins}-${r.losses}-${r.ties}`,
                        cell: (r) => `${r.wins}-${r.losses}-${r.ties}`,
                      },
                      {
                        id: 'games',
                        header: 'Games',
                        value: (r) => r.games,
                        cell: (r) => number(r.games),
                      },
                      {
                        id: 'rate',
                        header: 'Win %',
                        value: (r) => r.rate,
                        cell: (r) => (r.rate == null ? 'Unavailable' : `${number(r.rate * 100)}%`),
                      },
                      {
                        id: 'margin',
                        header: 'Avg. margin',
                        value: (r) => r.margin,
                        cell: (r) => number(r.margin),
                      },
                    ]}
                  />
                  <p className="history-explorer-footnote">
                    {filteredRows.length} opponents · W-L-T = wins, losses, ties. The minimum
                    applies to rivalry labels only.
                  </p>
                  {!filteredRows.length && <p>No opponents match your search.</p>}
                </>
              )}
              <details className="history-explorer-methodology">
                <summary>Rivalry definitions & coverage</summary>
                <p>
                  Closest rival = closest to 50% wins, then most meetings. Punching bag = highest
                  winning rate above 50%; kryptonite = lowest below 50%. Ties count as half a win;
                  tied labels use sample size then stable identity. Labels require {minimum}{' '}
                  meetings. Average margin uses the same verified games.
                </p>
                <p>
                  Competition coverage: {records.length}/{years.length} selected seasons. Missing
                  seasons:{' '}
                  {years.filter((y) => !records.some((r) => r.year === y)).join(', ') || 'none'}.{' '}
                  {games.length} verified completed games; {skipped} unusable score rows.{' '}
                  {records.reduce(
                    (n, r) =>
                      n +
                      r.data.scores.filter(
                        (s) => s.week <= r.data.completedWeek && !s.opponentTeamId,
                      ).length,
                    0,
                  )}{' '}
                  score rows without an opponent (byes or unavailable matchup links). Renames follow
                  provider manager identity; unidentified owners stay separate by season.
                </p>
              </details>
            </div>
            <aside className="history-rivalry-inspector" aria-label="Selected rivalry">
              {rivalry ? (
                <>
                  <span className="history-explorer-eyebrow">Selected rivalry</span>
                  <h3>
                    {managers.get(key)} vs. {managers.get(rivalry.opponent)}
                  </h3>
                  <p>{rivalry.games} verified meetings across the selected seasons</p>
                  <dl className="history-rivalry-stats">
                    <div>
                      <dt>Record (W-L-T)</dt>
                      <dd>
                        {rivalry.wins}-{rivalry.losses}-{rivalry.ties}
                      </dd>
                    </div>
                    <div>
                      <dt>Win rate</dt>
                      <dd>
                        {rivalry.rate == null ? 'Unavailable' : `${number(rivalry.rate * 100)}%`}
                      </dd>
                    </div>
                    <div>
                      <dt>Points for / against</dt>
                      <dd>
                        {rivalry.games
                          ? `${number(rivalry.pointsFor)} / ${number(rivalry.pointsAgainst)}`
                          : 'Unavailable'}
                      </dd>
                    </div>
                    <div>
                      <dt>Average margin</dt>
                      <dd>{number(rivalry.margin)}</dd>
                    </div>
                  </dl>
                  <h4>Latest meetings</h4>
                  {meetings.length ? (
                    gameEvidence(3)
                  ) : (
                    <p>No verified games between these managers in the selected seasons.</p>
                  )}
                  {meetings.length > 3 && (
                    <details className="history-explorer-methodology">
                      <summary>All {meetings.length} contributing games</summary>
                      {gameEvidence()}
                    </details>
                  )}
                </>
              ) : (
                <p>No opponents available in the selected history.</p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}
