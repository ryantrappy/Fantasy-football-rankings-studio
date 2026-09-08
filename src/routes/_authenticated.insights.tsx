import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../auth/Authentication';
import { errorMessage } from '../api/client';
import { defaultSeason } from '../util/rankings';
import type { League } from '../types';
import type { SeasonInsights } from '../insights';
import { LeagueSummary } from '../components/LeagueSummary';
import { ScoreTrend } from '../components/ScoreTrend';

export const Route = createFileRoute('/_authenticated/insights')({
  validateSearch: (input: Record<string, unknown>) => ({
    leagueId:
      typeof input.leagueId === 'string' && /^\d{1,30}$/.test(input.leagueId) ? input.leagueId : '',
    year:
      Number.isInteger(Number(input.year)) &&
      Number(input.year) >= 2000 &&
      Number(input.year) <= 2100
        ? Number(input.year)
        : defaultSeason(),
  }),
  component: InsightsPage,
});
const number = (value: number | null) =>
  value === null ? '—' : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
const signed = (value: number | null) =>
  value === null ? '—' : `${value > 0 ? '+' : ''}${number(value)}`;
function InsightsPage() {
  const api = useApi();
  const { leagueId, year } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [leagueResult, setLeagueResult] = useState<{ api: typeof api; entries: League[] }>();
  const leagues = leagueResult?.api === api ? leagueResult.entries : [];
  const [result, setResult] = useState<{
    key: string;
    api: typeof api;
    data?: SeasonInsights;
    error?: string;
  }>();
  const [reload, setReload] = useState(0);
  const [teamId, setTeamId] = useState('');
  const [pickupTeam, setPickupTeam] = useState('');
  const [allPickups, setAllPickups] = useState(false);
  const requestKey = `${leagueId}:${year}:${reload}`;
  const loading = result?.key !== requestKey || result?.api !== api;
  const data = loading ? undefined : result?.data;
  const error = loading ? '' : result?.error || '';
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const entries = await api.listLeagues();
        if (cancelled) return;
        setLeagueResult({ api, entries });
        const selected =
          entries.find((l) => l.leagueId === leagueId) || (!leagueId ? entries[0] : undefined);
        if (!selected) {
          if (leagueId) throw new Error('This league is not available to your account.');
          setResult({ api, key: requestKey });
          return;
        }
        if (!leagueId) {
          void navigate({ search: { leagueId: selected.leagueId, year }, replace: true });
          return;
        }
        const result = await api.getInsights(selected.leagueId, year, reload > 0);
        if (!cancelled) {
          setResult({ api, key: requestKey, data: result });
          setTeamId(result.teams[0]?.teamId || '');
          setPickupTeam('');
          setAllPickups(false);
        }
      } catch (failure) {
        if (!cancelled) setResult({ api, key: requestKey, error: errorMessage(failure) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, leagueId, year, reload, navigate, requestKey]);
  const scoreRows = useMemo(
    () => data?.scores.filter((s) => s.teamId === teamId).sort((a, b) => a.week - b.week) || [],
    [data, teamId],
  );
  const selectedTeam = data?.teams.find((t) => t.teamId === teamId);
  const names = new Map(data?.teams.map((t) => [t.teamId, t.teamName]));
  const evaluatedPickups = data?.pickups.filter((p) => p.lift !== null) || [];
  const bestPickup = evaluatedPickups[0];
  const filteredPickups = data?.pickups.filter((p) => !pickupTeam || p.teamId === pickupTeam) || [];
  const visiblePickups = allPickups ? filteredPickups : filteredPickups.slice(0, 10);
  const judgedTrades = data?.tradeComparisons.filter((t) => t.winner !== null).length || 0;
  const leader = data?.teams
    .filter((t) => t.average !== null)
    .sort((a, b) => b.average! - a.average!)[0];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">The season, by the numbers</p>
          <h1>Did the moves pay off?</h1>
          <p>Follow the points. Find the steals. See who keeps beating expectations.</p>
        </div>
      </div>
      <div className="selection-bar insights-controls">
        <label>
          League
          <select
            value={leagueId}
            onChange={(e) => void navigate({ search: { leagueId: e.target.value, year } })}
          >
            <option value="" disabled>
              Choose a league
            </option>
            {leagues.map((l) => (
              <option key={l.leagueId} value={l.leagueId}>
                {l.leagueName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Season
          <select
            value={year}
            onChange={(e) => void navigate({ search: { leagueId, year: Number(e.target.value) } })}
          >
            {Array.from({ length: defaultSeason() - 1999 }, (_, i) => defaultSeason() - i).map(
              (y) => (
                <option key={y}>{y}</option>
              ),
            )}
          </select>
        </label>
        <button
          className="button secondary"
          disabled={loading}
          onClick={() => setReload((v) => v + 1)}
        >
          Refresh insights
        </button>
      </div>
      {error && (
        <div className="notice error" role="alert">
          {error} <button onClick={() => setReload((v) => v + 1)}>Try again</button>
        </div>
      )}
      {loading && (
        <output className="panel">
          Reading season scores and transactions… This can take a moment for a full season.
        </output>
      )}
      {!loading && !error && !leagues.length && (
        <section className="panel">
          <h2>Your season starts with a league.</h2>
          <Link to="/leagues/new">Connect a league</Link>
        </section>
      )}
      {data && (
        <>
          <p className="insights-meta">
            {data.completedWeek
              ? `Through completed week ${data.completedWeek}`
              : 'No completed weeks yet'}{' '}
            · Updated{' '}
            {new Date(data.generatedAt).toLocaleTimeString(undefined, {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
          {!data.completedWeek && (
            <div className="notice insights-notice">
              The current week is excluded while games are unfinished. Choose an earlier season to
              explore historical results.
            </div>
          )}
          <div className="insight-cards">
            <article>
              <p className="eyebrow">Scoring pace</p>
              <h2>
                {number(leader?.average ?? null)} <small>pts / week</small>
              </h2>
              <p>{leader?.teamName || 'Waiting for completed scores'}</p>
            </article>
            <article>
              <p className="eyebrow">Best pickup above baseline</p>
              <h2>{bestPickup?.player || 'Not yet evaluated'}</h2>
              <p>
                {bestPickup
                  ? `${signed(bestPickup.lift)} pts / start vs. ${bestPickup.baseline} · ${bestPickup.comparisonWeeks.length} starts`
                  : 'At least two comparable starts are needed.'}
              </p>
            </article>
            <article>
              <p className="eyebrow">Trade verdicts</p>
              <h2>
                {judgedTrades} <small>with a scoring leader</small>
              </h2>
              <p>
                {data.tradeComparisons.length} player trades assessed individually over equal
                post-trade windows.
              </p>
            </article>
          </div>
          <LeagueSummary records={[{ year, data }]} />
          <p>
            <Link to="/history" search={{ leagueId }}>
              Explore this league’s history →
            </Link>
          </p>
          <section className="panel insight-section">
            <div className="insight-heading">
              <div>
                <p className="eyebrow">Expectation vs. reality</p>
                <h2>Weekly scoring trends</h2>
              </div>
              <label>
                Team
                <select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                  {data.teams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.teamName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {scoreRows.length ? (
              <>
                <p>
                  <strong>{number(selectedTeam?.average ?? null)}</strong> points per week ·{' '}
                  <strong>{selectedTeam?.aboveMedian}</strong> of {selectedTeam?.weeks} weeks above
                  the league median
                  {selectedTeam?.projectedWeeks ? (
                    <>
                      {' '}
                      · <strong>{signed(selectedTeam.projectionDelta)}</strong> average vs.
                      projection across {selectedTeam.projectedWeeks} weeks
                    </>
                  ) : (
                    ''
                  )}
                </p>
                <p className="chart-legend">
                  <span>● Actual points</span>
                  {scoreRows.some((s) => s.projected !== null) && <span>┄ Lineup projection</span>}
                </p>
                <ScoreTrend scores={scoreRows} />
                <details>
                  <summary>View exact weekly scores</summary>
                  <div className="insight-table-wrap">
                    <table className="insight-table">
                      <thead>
                        <tr>
                          <th>Week</th>
                          <th>Actual points</th>
                          <th>Projected points</th>
                          <th>Difference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scoreRows.map((s) => (
                          <tr key={s.week}>
                            <td>{s.week}</td>
                            <td>{number(s.actual)}</td>
                            <td>{number(s.projected)}</td>
                            <td>{signed(s.projected === null ? null : s.actual - s.projected)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            ) : (
              <p>No completed scores for this team and season.</p>
            )}
          </section>
          <section className="panel insight-section">
            <p className="eyebrow">The whole league</p>
            <h2>Who delivers every week?</h2>
            <div className="insight-table-wrap">
              <table className="insight-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Avg. points</th>
                    <th>Best week</th>
                    <th>Above median</th>
                    <th>Avg. vs. projection</th>
                    <th>Beat projection</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.teams]
                    .sort((a, b) => (b.average ?? -Infinity) - (a.average ?? -Infinity))
                    .map((t) => (
                      <tr key={t.teamId}>
                        <th scope="row">
                          {t.teamName}
                          <small>{t.managerName}</small>
                        </th>
                        <td>{number(t.average)}</td>
                        <td>{number(t.best)}</td>
                        <td>
                          {t.aboveMedian} / {t.weeks}
                        </td>
                        <td>{signed(t.projectionDelta)}</td>
                        <td>
                          {t.projectedWeeks ? `${t.beatProjection} / ${t.projectedWeeks}` : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="panel insight-section">
            <p className="eyebrow">Head to head</p>
            <h2>Who won each trade?</h2>
            <p>
              Compare the value each side gained over the same first four post-trade weeks. Value
              means points above the league’s median starter at each player’s position, per week.
              Bench scoring is included to evaluate the players exchanged, independent of lineup
              choices.
            </p>
            {data.tradeComparisons.length ? (
              data.tradeComparisons.map((trade) => (
                <article className="trade-detail" key={trade.id}>
                  <div className="insight-heading">
                    <h3>
                      Week {trade.week} ·{' '}
                      {trade.sides.map((side) => names.get(side.teamId) || side.teamId).join(' ↔ ')}
                    </h3>
                    <strong>
                      {trade.verdict === 'leader'
                        ? `${names.get(trade.winner!) || trade.winner} leads`
                        : trade.verdict === 'close'
                          ? 'Too close to call'
                          : trade.verdict === 'picks'
                            ? 'Draft picks not valued'
                            : 'Insufficient comparable data'}
                    </strong>
                  </div>
                  <p>
                    {trade.weeks.length} of {trade.possibleWeeks} completed weeks compared
                    {trade.weeks.length ? ` (weeks ${trade.weeks.join(', ')})` : ''}.{' '}
                    {trade.possibleWeeks < 4
                      ? 'Early read: the four-week window is not complete.'
                      : 'Four-week assessment.'}
                  </p>
                  <div className="insight-table-wrap">
                    <table className="insight-table">
                      <thead>
                        <tr>
                          <th>Team / received players</th>
                          <th>Sent players</th>
                          <th>Received value / wk</th>
                          <th>Sent value / wk</th>
                          <th>Net gain / wk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trade.sides.map((side) => (
                          <tr key={side.teamId}>
                            <th scope="row">
                              {names.get(side.teamId) || side.teamId}
                              <small>{side.received.join(', ') || 'No players'}</small>
                            </th>
                            <td>{side.sent.join(', ') || 'No players'}</td>
                            <td>{signed(side.receivedValue)}</td>
                            <td>{signed(side.sentValue)}</td>
                            <td>
                              <strong>{signed(side.gain)}</strong>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))
            ) : (
              <p>No completed player trades returned for this season.</p>
            )}
          </section>
          <section className="panel insight-section">
            <p className="eyebrow">Found on the wire</p>
            <h2>Free-agent moves that paid off</h2>
            <p>
              Pickups ranked by average improvement per start in their first four post-pickup weeks.
              We use the dropped player at the same position when there is one clear pair and
              complete scoring coverage; otherwise we use the league’s positional starter median.
            </p>
            <label className="pickup-filter">
              Filter pickups by team
              <select
                value={pickupTeam}
                onChange={(e) => {
                  setPickupTeam(e.target.value);
                  setAllPickups(false);
                }}
              >
                <option value="">All teams</option>
                {data.teams.map((t) => (
                  <option key={t.teamId} value={t.teamId}>
                    {t.teamName}
                  </option>
                ))}
              </select>
            </label>
            {filteredPickups.length ? (
              <div className="insight-table-wrap">
                <table className="insight-table">
                  <thead>
                    <tr>
                      <th>Player</th>
                      <th>Team</th>
                      <th>Added week</th>
                      <th>Baseline</th>
                      <th>Avg. player / baseline</th>
                      <th>Lift / start</th>
                      <th>Compared starts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visiblePickups.map((p) => (
                      <tr key={p.id}>
                        <th scope="row">
                          {p.player}
                          <small>{p.position || 'Position unavailable'}</small>
                        </th>
                        <td>{names.get(p.teamId) || p.teamId}</td>
                        <td>{p.week}</td>
                        <td>{p.baseline}</td>
                        <td>
                          {number(p.averagePoints)} / {number(p.averageBaseline)}
                        </td>
                        <td>{p.lift === null ? 'Insufficient data' : signed(p.lift)}</td>
                        <td>
                          {p.comparisonWeeks.length}
                          <small>
                            {p.comparisonWeeks.length
                              ? `Weeks ${p.comparisonWeeks.join(', ')}`
                              : ''}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No completed pickups returned for this selection.</p>
            )}
            {filteredPickups.length > 10 && (
              <button className="text-button" onClick={() => setAllPickups((value) => !value)}>
                {allPickups ? 'Show top 10' : `Show all ${filteredPickups.length} pickups`}
              </button>
            )}
          </section>
          <section className="insights-method">
            <h2>How to read these numbers</h2>
            <ul>
              <li>
                Only completed weeks are included. A dash means unavailable or not yet evaluable; it
                is not a zero.
              </li>
              <li>
                Assessments use at most the first four weeks after a move, excluding the transaction
                week. Trades use identical weeks for every asset, including bench scoring; later
                lineup decisions do not change who appears to have won. Pickups count starts only
                while retained, before the next move.
              </li>
              <li>
                Each positional baseline is the median of at least three other distinct starters in
                this league that week, excluding all traded assets. Multi-player package values are
                summed above these baselines, so a raw quarterback score does not automatically beat
                a receiver package.
              </li>
              <li>
                A scoring leader needs at least two common weeks, at least 75% coverage of the
                completed comparison window, and more than a 1-point/week gap between the leading
                net gains. Close results remain uncalled. This is an early scoring assessment, not a
                statistical confidence claim.
              </li>
              <li>
                We only observe players present in league roster snapshots. Missing scores and
                unknown positions are not treated as zero; byes/injuries with reported zero points
                count as zero. Trade grades exclude FAAB, draft picks and long-term dynasty value.
                Trades with picks receive no overall winner call.
              </li>
              {data.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
