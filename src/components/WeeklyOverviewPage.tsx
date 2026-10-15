import './decision-explorer.css';
import { PageHeading } from './PageHeading';
import { LoadingSkeleton } from './LoadingSkeleton';
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useApi } from '../auth/session';
import { loadWeeklyOverview, type WeeklyOverviewRow } from '../weekly-overview';
import { RosterRiskAlerts } from './RosterRiskAlerts';
import { WaiverAdvisor } from './WaiverAdvisor';
import { LineupAdvisor } from './LineupAdvisor';
import { reportFreshnessLabel } from './report-freshness';
import { winProbability, type LivePlayer } from '../live-matchups';
import { adviseLineup } from '../lineup-advisor';
import { recommendedDrop, type WaiverPool } from '../waivers';
import { InfoTooltip } from './InfoTooltip';
const emptyRows: WeeklyOverviewRow[] = [];
const emptyPools: Record<string, WaiverPool> = {};
const poolKey = (row: WeeklyOverviewRow) =>
  JSON.stringify([row.league.leagueId, row.league.seasonId, row.selection?.teamId, row.week]);

export function WeeklyOverviewPage() {
  const api = useApi();
  return <WeeklyOverviewWorkspace key={api.subject} />;
}

function WeeklyOverviewWorkspace() {
  const api = useApi();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const [snapshot, setSnapshot] = useState<{ api: typeof api; rows: WeeklyOverviewRow[] }>();
  const rows = snapshot?.api === api ? snapshot.rows : emptyRows;
  const [exclusions, setExclusions] = useState<{
    api: typeof api;
    values: Record<string, string[]>;
  }>(() => ({ api, values: {} }));
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState<string>();
  const [refresh, setRefresh] = useState(0);
  const [waiverSnapshot, setWaiverSnapshot] = useState<{
    api: typeof api;
    rows: WeeklyOverviewRow[];
    pools: Record<string, WaiverPool>;
  }>();
  const pools =
    waiverSnapshot?.api === api && waiverSnapshot.rows === rows ? waiverSnapshot.pools : emptyPools;
  const [waiverErrors, setWaiverErrors] = useState<Record<string, string>>({});
  const [waiverBusy, setWaiverBusy] = useState(false);
  useEffect(() => {
    let active = true;
    // Fetch the overview when entering this account session or requesting a refresh.
    // oxlint-disable-next-line react/set-state-in-effect
    setBusy(true);
    void loadWeeklyOverview({ ...api, managedTeam: api.managedTeam! }, refresh > 0)
      .then(
        (next) => {
          if (active) {
            setSnapshot({ api, rows: next });
            setError('');
            setUpdated(new Date().toLocaleTimeString());
          }
        },
        () => {
          if (active)
            setError(
              'The overview could not refresh. Previously loaded cards may be stale. Try again.',
            );
        },
      )
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [api, refresh]);
  useEffect(() => {
    if (busy || !api.waivers) return;
    let active = true;
    const waivers = api.waivers;
    // Synchronize displayed waiver evidence with the newly loaded overview snapshot.
    // oxlint-disable-next-line react/set-state-in-effect
    setWaiverSnapshot({ api, rows, pools: {} });
    setWaiverErrors({});
    setWaiverBusy(true);
    const managed = rows.filter((row) => row.selection?.teamId && !row.selection.needsReselection);
    void (async () => {
      for (let offset = 0; offset < managed.length; offset += 3) {
        if (!active) return;
        await Promise.all(
          managed.slice(offset, offset + 3).map(async (row) => {
            try {
              const pool = await waivers.get(row.league.leagueId, row.league.seasonId);
              if (active)
                setWaiverSnapshot((previous) =>
                  previous?.api === api && previous.rows === rows
                    ? { ...previous, pools: { ...previous.pools, [poolKey(row)]: pool } }
                    : previous,
                );
            } catch {
              if (active)
                setWaiverErrors((previous) => ({
                  ...previous,
                  [row.league.leagueId]: 'Waiver preview unavailable. Open the advisor to retry.',
                }));
            }
          }),
        );
      }
      if (active) setWaiverBusy(false);
    })();
    return () => {
      active = false;
    };
  }, [api, rows, busy]);
  return (
    <Box className="decision-explorer decision-explorer-overview">
      <PageHeading
        title="Weekly overview"
        description="Your teams, this week’s matchups, and the next move to make."
      >
        <Button disabled={busy} onClick={() => setRefresh((value) => value + 1)}>
          Refresh overview
        </Button>
      </PageHeading>
      {(updated || rows.length > 0) && (
        <Text as="output" display="block" mb={4} fontSize="sm" color="fg.muted">
          {busy
            ? 'Loading overview…'
            : updated
              ? `Matchups loaded at ${updated}. Season reports refresh on demand.`
              : ''}
        </Text>
      )}
      {error && <Text role="alert">{error}</Text>}
      {!busy && !error && rows.length === 0 && (
        <Box>
          <Text>Connect a league to start your weekly overview.</Text>
          <Link to="/leagues/new">Connect a league</Link>
        </Box>
      )}
      <Box
        display="grid"
        gridTemplateColumns={{ base: 'minmax(0, 1fr)', lg: 'repeat(2, minmax(0, 1fr))' }}
        gap={4}
      >
        {busy && rows.length === 0 && <LoadingSkeleton label="Loading overview…" />}
        {rows.map((row) => {
          const selected = row.selection?.teams.find(
            (team) => team.teamId === row.selection?.teamId,
          );
          const myTeam =
            row.matchup?.home.teamId === selected?.teamId ? row.matchup?.home : row.matchup?.away;
          const opponent =
            row.matchup?.home.teamId === selected?.teamId ? row.matchup?.away : row.matchup?.home;
          const homeEstimate = row.matchup ? winProbability(row.matchup) : null;
          const estimate =
            homeEstimate === null
              ? null
              : myTeam === row.matchup?.home
                ? homeEstimate
                : 100 - homeEstimate;
          const excluded = exclusions.api === api ? (exclusions.values[poolKey(row)] ?? []) : [];
          const advice = myTeam
            ? adviseLineup(myTeam.players, row.lineupSlots, excluded)
            : undefined;
          const pool = pools[poolKey(row)];
          const capturedAt = pool ? new Date(pool.capturedAt).getTime() : NaN;
          const poolFresh =
            Number.isFinite(capturedAt) &&
            now - capturedAt <= 5 * 60_000 &&
            capturedAt <= now + 60_000;
          const poolCovered =
            pool &&
            !pool.unavailable &&
            poolFresh &&
            pool.team?.teamId === selected?.teamId &&
            pool.week === row.week &&
            pool.ownership &&
            pool.ownership.expected > 0 &&
            pool.ownership.covered === pool.ownership.expected;
          const poolLineupCovered =
            poolCovered && adviseLineup(pool.team!.players, pool.slots).difference !== null;
          const partialCandidates = pool?.candidates.some(
            (candidate) => !Number.isFinite(candidate.projectedPoints),
          );
          const upgrades = poolLineupCovered
            ? pool.candidates
                .filter((candidate) => Number.isFinite(candidate.projectedPoints))
                .flatMap((candidate) => {
                  const drop = recommendedDrop(pool, candidate);
                  return drop ? [{ candidate, drop }] : [];
                })
                .sort((a, b) => b.drop.impact.difference! - a.drop.impact.difference!)
            : [];
          const waiverLabel = !pool
            ? waiverBusy
              ? 'Loading upgrades…'
              : 'Unavailable'
            : !poolLineupCovered || (!upgrades.length && partialCandidates)
              ? 'Unavailable'
              : `${upgrades.length} ${partialCandidates ? 'covered ' : ''}${upgrades.length === 1 ? 'upgrade' : 'upgrades'}`;
          return (
            <Box as="section" key={row.league.leagueId} className="studio-card overview-card">
              <Heading as="h2" size="lg">
                {row.league.leagueName}
              </Heading>
              <Text className="overview-context">
                {row.league.leagueType === 0 ? 'Sleeper' : 'ESPN'} · {row.league.seasonId} ·{' '}
                {row.week === null ? 'Week unavailable' : `Week ${row.week}`}
              </Text>
              {row.rosterCapturedAt && (
                <Text fontSize="xs" color="fg.muted">
                  Roster captured: {row.rosterCapturedAt}.{' '}
                  {now - new Date(row.rosterCapturedAt).getTime() > 5 * 60_000
                    ? 'Inputs may be stale; refresh before acting.'
                    : ''}
                </Text>
              )}
              {selected ? (
                <>
                  <div className="decision-explorer-matchup">
                    <div>
                      <Text fontSize="xs">Your team</Text>
                      <Heading as="h3" size="md">
                        {selected.teamName}
                      </Heading>
                      <strong>{row.matchup ? (myTeam?.score?.toFixed(2) ?? '—') : '—'}</strong>
                    </div>
                    <span>vs.</span>
                    <div>
                      <Text fontSize="xs">Opponent</Text>
                      <Heading as="h3" size="md">
                        {row.matchup ? (opponent?.name ?? 'Bye week') : 'Matchup unavailable'}
                      </Heading>
                      <strong>{opponent?.score?.toFixed(2) ?? '—'}</strong>
                    </div>
                  </div>
                  {opponent && (
                    <div className="overview-win-estimate">
                      <div className="overview-win-labels">
                        <span>
                          {selected.teamName} {estimate === null ? 'Unavailable' : `${estimate}%`}
                        </span>
                        <span>
                          Uncalibrated win estimate{' '}
                          <InfoTooltip label="Overview win estimate methodology">
                            Uses current scores, starters’ projections and remaining game time with
                            independent scoring variation. Missing inputs remain unavailable; this
                            is not calibrated odds.
                          </InfoTooltip>
                        </span>
                        <span>
                          {estimate === null ? 'Unavailable' : `${100 - estimate}%`} {opponent.name}
                        </span>
                      </div>
                      {estimate !== null && (
                        <figure
                          className="overview-tug-bar"
                          aria-label={`${selected.teamName} ${estimate}%; ${opponent.name} ${100 - estimate}% uncalibrated win estimate`}
                        >
                          <span className="overview-tug-fill" style={{ width: `${estimate}%` }} />
                        </figure>
                      )}
                    </div>
                  )}
                  <div className="overview-stats">
                    <div aria-label={`Record for ${selected.teamName}`}>
                      <span>Record</span>
                      <strong>
                        {row.team
                          ? `${row.team.wins}–${row.team.loss}–${row.team.ties}`
                          : 'Unavailable'}
                      </strong>
                    </div>
                    <div aria-label={`Estimated playoff chance for ${selected.teamName}`}>
                      <span>Estimated playoff chance</span>
                      <strong>
                        {row.playoff === null
                          ? 'Unavailable'
                          : `${(row.playoff * 100).toFixed(1)}%`}
                      </strong>
                    </div>
                  </div>
                  {row.refreshedAt && (
                    <Text fontSize="sm">
                      {reportFreshnessLabel(row.refreshedAt)} · through week {row.completedWeek}.
                      Playoff estimates are not calibrated odds.
                    </Text>
                  )}
                  {myTeam && (
                    <details id={`lineup-${row.league.leagueId}`}>
                      <summary>
                        <span>Lineup advisor</span>{' '}
                        <span className="decision-impact-badge">
                          {advice?.difference == null
                            ? 'Unavailable'
                            : `${advice.difference >= 0 ? '+' : ''}${advice.difference.toFixed(2)} pts`}
                        </span>
                      </summary>
                      <LineupAdvisor
                        team={myTeam}
                        excludedIds={excluded}
                        onExcludedChange={(next) =>
                          setExclusions((previous) => ({
                            api,
                            values: {
                              ...(previous.api === api ? previous.values : {}),
                              [poolKey(row)]: next,
                            },
                          }))
                        }
                        leagueId={row.league.leagueId}
                        year={row.league.seasonId}
                        slots={row.lineupSlots}
                        capturedAt={row.rosterCapturedAt}
                      />
                    </details>
                  )}
                  {api.waivers && (
                    <details>
                      <summary>
                        <span>Waiver advisor</span>{' '}
                        <span className="decision-impact-badge">{waiverLabel}</span>
                      </summary>
                      <WaiverAdvisor
                        key={`${row.league.leagueId}:${row.league.seasonId}:${refresh}`}
                        loadedPool={pool}
                        onPoolChange={(next) =>
                          setWaiverSnapshot((previous) => {
                            if (previous?.api !== api || previous.rows !== rows) return previous;
                            const updated = { ...previous.pools };
                            if (next) updated[poolKey(row)] = next;
                            else delete updated[poolKey(row)];
                            return { ...previous, pools: updated };
                          })
                        }
                        api={api.waivers}
                        leagueId={row.league.leagueId}
                        year={row.league.seasonId}
                      />
                    </details>
                  )}
                  {myTeam && (
                    <details className="overview-quick-preview">
                      <summary>Quick preview</summary>
                      <div className="inline-advisor-box">
                        <Text fontSize="sm">
                          Current-week legal lineup and verified waiver impact. Open the full
                          advisors above for exclusions, alternative scenarios, sources and
                          candidate/drop controls.
                        </Text>
                        <Text fontSize="xs">
                          Roster captured: {row.rosterCapturedAt ?? 'Unavailable'}
                          {pool ? ` · Waiver ownership captured: ${pool.capturedAt}` : ''}. Refresh
                          stale inputs before acting; confirm provider locks and restrictions.
                        </Text>
                        <div className="decision-explorer-table-wrap">
                          <table className="decision-explorer-table">
                            <caption>Quick lineup &amp; waiver preview</caption>
                            <thead>
                              <tr>
                                <th scope="col">Action</th>
                                <th scope="col">Current / drop</th>
                                <th scope="col">Recommended</th>
                                <th scope="col">Net impact</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <th scope="row">Starter changes</th>
                                <td>
                                  {advice?.benches.map((player) => player.name).join(', ') ||
                                    'No proposed benches'}
                                </td>
                                <td>
                                  {advice?.starts
                                    .map(
                                      (player) =>
                                        `${player.name} (${advice.assignment.find((entry: { slot: string; player: LivePlayer }) => entry.player.id === player.id)?.slot ?? player.position ?? 'Slot unavailable'})`,
                                    )
                                    .join(', ') || 'No proposed starts'}
                                </td>
                                <td>
                                  {advice?.difference == null
                                    ? 'Unavailable'
                                    : `${advice.difference >= 0 ? '+' : ''}${advice.difference.toFixed(2)} pts`}
                                </td>
                              </tr>
                              {upgrades.slice(0, 3).map(({ candidate, drop }) => (
                                <tr key={candidate.id}>
                                  <th scope="row">Waiver upgrade</th>
                                  <td>{drop.player.name}</td>
                                  <td>{candidate.name}</td>
                                  <td>+{drop.impact.difference!.toFixed(2)} pts</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {advice?.reason && <Text as="output">{advice.reason}</Text>}
                        {advice?.notices.map((notice) => (
                          <Text as="output" display="block" key={notice}>
                            {notice}
                          </Text>
                        ))}
                        <Text as="output">
                          {pool?.unavailable ??
                            (pool && !poolCovered
                              ? 'Fresh current-week managed-team/ownership coverage unavailable. Inspect the full advisor before acting.'
                              : undefined) ??
                            waiverErrors[row.league.leagueId] ??
                            (!poolLineupCovered || (!upgrades.length && partialCandidates)
                              ? 'Complete waiver lineup/projection comparison unavailable. Open the full advisor to inspect coverage.'
                              : `${upgrades.length} covered current-week waiver upgrades; best three shown.${partialCandidates ? ' Other candidates have missing projections and cannot be evaluated.' : ''}`)}
                        </Text>
                        {pool?.notices.map((notice) => (
                          <Text as="output" display="block" key={notice}>
                            {notice}
                          </Text>
                        ))}
                      </div>
                    </details>
                  )}
                  {myTeam && (
                    <RosterRiskAlerts
                      key={`${api.subject}:${row.league.leagueId}:${row.rosterCapturedAt}`}
                      team={myTeam}
                      leagueId={row.league.leagueId}
                      year={row.league.seasonId}
                      week={row.week ?? 1}
                      capturedAt={row.rosterCapturedAt}
                      slots={row.lineupSlots}
                      subject={api.subject}
                    />
                  )}
                  <Flex className="overview-links">
                    <Link
                      to="/"
                      search={{
                        leagueId: row.league.leagueId,
                        year: row.league.seasonId,
                        ...(row.week === null ? {} : { week: row.week }),
                      }}
                    >
                      Rankings
                    </Link>
                    <Link
                      to="/insights"
                      search={{ leagueId: row.league.leagueId, year: row.league.seasonId }}
                    >
                      Season insights
                    </Link>
                    <Link
                      to="/playoffs"
                      search={{ leagueId: row.league.leagueId, year: row.league.seasonId }}
                    >
                      Playoff simulation
                    </Link>
                    <Link
                      to="/live"
                      search={{ leagueId: row.league.leagueId, year: row.league.seasonId }}
                    >
                      Live matchups
                    </Link>
                  </Flex>
                </>
              ) : (
                <Text mt={3}>
                  Select your managed team for this season, or continue in commissioner mode.
                </Text>
              )}
              {row.notices.map((notice, index) => (
                <Text as="output" key={index} display="block" mt={2}>
                  {notice}
                </Text>
              ))}
              <Box mt={3}>
                <Link to="/leagues/manage">{selected ? 'Change my team' : 'Choose my team'}</Link>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
