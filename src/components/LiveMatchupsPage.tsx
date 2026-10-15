import './decision-explorer.css';
import { PlayerProfileLink } from './PlayerProfileLink';
import { InfoTooltip } from './InfoTooltip';
import { Icon } from './Icon';
import {
  Box,
  Button,
  IconButton,
  Flex,
  Heading,
  Text,
  Field,
  NativeSelect,
} from '@chakra-ui/react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useApi } from '../auth/session';
import { errorMessage } from '../api/client';
import {
  alignedPlayers,
  kickoffLabel,
  winProbability,
  type LiveLeague,
  type LiveMatchup,
  type LiveTeam,
  type LivePlayer,
} from '../live-matchups';

const score = (value: number | null) => (value == null ? '—' : value.toFixed(2));
const playerStatus = (player: LivePlayer) => {
  if (player.bye) return 'Bye';
  if (player.availability) return player.availability;
  if (player.remainingFraction === 0) return 'Final';
  if (player.remainingFraction !== undefined && player.remainingFraction < 1)
    return `${Math.round(player.remainingFraction * 100)}% left`;
  if (player.remainingFraction === 1) return 'Upcoming';
  return player.locked ? 'Locked' : 'Status unavailable';
};
const subscribeTimezone = () => () => {};
function useUserTimezone() {
  return useSyncExternalStore(
    subscribeTimezone,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    () => 'UTC',
  );
}
const matchupKey = (leagueId: string, id: string) => `${leagueId}:${id}`;

function Roster({
  team,
  groups,
  leagueId,
  year,
}: {
  team: LiveTeam;
  leagueId: string;
  year: number;
  groups: { label: string; rows: { position: string; player?: LivePlayer }[] }[];
}) {
  const timeZone = useUserTimezone();
  const bench = team.players.filter((player) => !player.starter);
  const benchTotal = bench.reduce((total, player) => total + (player.points ?? 0), 0);
  const benchIncomplete = bench.some((player) => player.points == null);
  return (
    <Box
      className="decision-explorer-live-roster"
      minW={0}
      as="section"
      tabIndex={0}
      aria-label={`${team.name} roster`}
    >
      <Flex className="live-team-heading" justify="space-between" gap={2} align="baseline">
        <Heading as="h3" className="live-roster-name" title={team.name}>
          {team.name}
        </Heading>
        <Text className="live-roster-score" fontWeight="bold" whiteSpace="nowrap">
          {score(team.score)}
        </Text>
      </Flex>
      {!team.players.length && (
        <Text className="live-roster-unavailable">Player scores unavailable.</Text>
      )}
      {groups
        .filter((group) => group.rows.length)
        .map((group) => (
          <Box key={group.label}>
            <Text className="live-roster-group live-lineup-heading">
              <span>{group.label}</span>
              {group.label === 'Starters' && (
                <span className="decision-explorer-live-columns">Status · Proj · Pts</span>
              )}
              {group.label === 'Bench' && (
                <span
                  className="live-bench-total"
                  aria-label={`${team.name} bench total`}
                  title={
                    benchIncomplete
                      ? 'Known bench points; some player scores are unavailable.'
                      : 'Total bench points'
                  }
                >
                  {score(benchTotal)}
                  {benchIncomplete ? '+' : ''}
                </span>
              )}
            </Text>
            {group.rows.map((row, index) => (
              <div
                key={`${row.position}:${index}`}
                className="live-player-row"
                data-position={row.position}
              >
                <span
                  className="live-player-position"
                  title={
                    row.player?.position ? `${row.position} · ${row.player.position}` : row.position
                  }
                  aria-label={row.position}
                >
                  {row.position === 'Unknown'
                    ? '—'
                    : row.position === 'SUPER FLEX'
                      ? 'SFLEX'
                      : row.position}
                </span>
                <span className="live-player-name" title={row.player?.name}>
                  {row.player ? (
                    <>
                      <PlayerProfileLink leagueId={leagueId} year={year} playerId={row.player.id}>
                        {row.player.name}
                      </PlayerProfileLink>
                      {!row.player.bye &&
                        row.player.nflSchedule &&
                        kickoffLabel(row.player.nflSchedule, timeZone) && (
                          <span
                            className="live-player-kickoff"
                            title={
                              row.player.nflSchedule
                                ? `${row.player.nflSchedule.source} · Checked ${new Date(row.player.nflSchedule.capturedAt).toLocaleString('en-US', { timeZone })} (${timeZone})`
                                : 'NFL schedule unavailable'
                            }
                          >
                            {kickoffLabel(row.player.nflSchedule, timeZone)}
                          </span>
                        )}
                    </>
                  ) : (
                    '—'
                  )}
                </span>
                <span
                  className="decision-explorer-live-status"
                  title={row.player ? playerStatus(row.player) : 'Player unavailable'}
                >
                  {row.player ? playerStatus(row.player) : '—'}
                </span>
                <span className="decision-explorer-live-projection" title="Projected points">
                  {score(row.player?.projectedPoints ?? null)}
                </span>
                <span className="live-player-points" title="Observed points">
                  {score(row.player?.points ?? null)}
                </span>
              </div>
            ))}
          </Box>
        ))}
    </Box>
  );
}

function MatchupRosters({
  matchup,
  leagueId,
  year,
}: {
  matchup: LiveMatchup;
  leagueId: string;
  year: number;
}) {
  const groups = [true, false].map((starter) => ({
    label: starter ? 'Starters' : 'Bench',
    rows: alignedPlayers(matchup.home.players, matchup.away?.players || [], starter),
  }));
  const roster = (team: LiveTeam, side: 'home' | 'away') => (
    <Roster
      team={team}
      leagueId={leagueId}
      year={year}
      groups={groups.map((group) => ({
        label: group.label,
        rows: group.rows.map((row) => ({ position: row.position, player: row[side] })),
      }))}
    />
  );
  return (
    <div className="live-rosters">
      {roster(matchup.home, 'home')}
      {matchup.away && roster(matchup.away, 'away')}
    </div>
  );
}

function WinProbability({ matchup }: { matchup: LiveMatchup }) {
  const home = winProbability(matchup);
  if (!matchup.away) return null;
  return (
    <div
      className="live-probability"
      title="Estimate from current scores, current starters’ projections, remaining NFL game time, and independent player scoring variation (65% of projected points). Not calibrated odds. Missing inputs are shown as unavailable. Completed ties split 50/50."
    >
      <span className="live-probability-label">
        Win estimate{' '}
        <InfoTooltip label="Win estimate methodology">
          Estimate from current scores, current starters’ projections, remaining NFL game time and
          independent player scoring variation (65% of projected points). Missing inputs remain
          unavailable. Completed ties split 50/50.
        </InfoTooltip>
      </span>
      <span className="decision-explorer-live-caveat">Uncalibrated</span>
      {home == null ? (
        <span className="live-probability-unavailable">Unavailable</span>
      ) : (
        <div
          className="live-probability-values"
          aria-label={`${matchup.home.name} ${home}%; ${matchup.away.name} ${100 - home}% estimated win probability`}
        >
          <strong>{home}%</strong>
          <div className="live-probability-track" aria-hidden="true">
            <span style={{ width: `${home}%` }} />
          </div>
          <strong>{100 - home}%</strong>
        </div>
      )}
    </div>
  );
}

function CompactMatchup({
  matchup,
  selected,
  disabled,
  onToggle,
  managedTeamId,
}: {
  managedTeamId?: string;
  matchup: LiveMatchup;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      className="compact-matchup"
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={`${selected ? 'Remove' : 'Highlight'} ${managedTeamId === matchup.home.teamId ? '★ ' : ''}${matchup.home.name} ${score(matchup.home.score)} – ${score(matchup.away?.score ?? null)} ${managedTeamId === matchup.away?.teamId ? '★ ' : ''}${matchup.away?.name || 'Bye'}`}
      title={`${matchup.home.name}: ${score(matchup.home.score)}\n${matchup.away ? `${matchup.away.name}: ${score(matchup.away.score)}` : 'Bye'}`}
      variant={selected ? 'solid' : 'outline'}
      colorPalette="indigo"
      h="auto"
      minH="30px"
      w="100%"
      px={2}
      py={1}
      display="block"
      textAlign="left"
      fontSize="xs"
    >
      <Flex className="compact-matchup-line" align="center" gap={1} minW={0}>
        <Text className="compact-home-name" truncate flex="1" minW={0}>
          {managedTeamId === matchup.home.teamId && <span aria-label="Managed team">★ </span>}
          {matchup.home.name}
        </Text>{' '}
        <Text className="compact-home-score" flexShrink={0}>
          {score(matchup.home.score)}
        </Text>{' '}
        <Text
          className="compact-separator"
          flexShrink={0}
          color={selected ? 'inherit' : 'fg.muted'}
        >
          –
        </Text>{' '}
        <Text className="compact-away-score" flexShrink={0}>
          {score(matchup.away?.score ?? null)}
        </Text>{' '}
        <Text className="compact-away-name" truncate flex="1" minW={0} textAlign="right">
          {managedTeamId === matchup.away?.teamId && <span aria-label="Managed team">★ </span>}
          {matchup.away?.name || 'Bye'}
        </Text>
      </Flex>
    </Button>
  );
}

export function LiveMatchupsPage({
  search = {},
}: {
  search?: { leagueId?: string; year?: number };
}) {
  const api = useApi();
  const timeZone = useUserTimezone();
  const [leagues, setLeagues] = useState<LiveLeague[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState<Date>();
  const [retry, setRetry] = useState(0);
  const [leagueFilter, setLeagueFilter] = useState(search.leagueId ?? '');
  const [managedTeamIds, setManagedTeamIds] = useState<Record<string, string>>({});
  const [contextNotice, setContextNotice] = useState('');
  const defaults = useRef({ api, initialized: false });

  useEffect(() => {
    if (defaults.current.api !== api) {
      defaults.current = { api, initialized: false };
      setSelected([]);
      setLeagues([]);
      setLeagueFilter(search.leagueId ?? '');
      setManagedTeamIds({});
      setContextNotice('');
      setLoading(true);
    }
    let active = true;
    let inFlight = false;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      setRefreshing(true);
      try {
        const next = await api.getLiveMatchups(retry > 0);
        if (!active) return;
        setLeagues(next);
        const requested = next.find(
          (league) =>
            league.leagueId === search.leagueId && (!search.year || league.season === search.year),
        );
        if (!defaults.current.initialized && search.leagueId && !requested) {
          setLeagueFilter('');
          setContextNotice(
            'The requested league/season has no current Live snapshot. Showing available current leagues.',
          );
        }
        const defaultLeagues = requested
          ? [requested, ...next.filter((league) => league !== requested)].slice(0, 4)
          : next.slice(0, 4);
        const managedTeams = api.managedTeam;
        const initialKeys =
          !defaults.current.initialized && managedTeams
            ? await Promise.all(
                defaultLeagues.map(async (league) => {
                  if (league.error) return undefined;
                  try {
                    const selection = await managedTeams.get(league.leagueId, league.season);
                    if (!selection.teamId || selection.needsReselection) return undefined;
                    const matchup = league.matchups.find(
                      (matchup) =>
                        matchup.home.teamId === selection.teamId ||
                        matchup.away?.teamId === selection.teamId,
                    );
                    if (!matchup) return undefined;
                    return {
                      key: matchupKey(league.leagueId, matchup.id),
                      leagueId: league.leagueId,
                      teamId: selection.teamId,
                    };
                  } catch {
                    // Scores and manual selection remain usable when a saved team cannot be read.
                    return undefined;
                  }
                }),
              )
            : [];
        if (!active) return;
        if (initialKeys.length)
          setManagedTeamIds(
            Object.fromEntries(
              initialKeys.flatMap((entry) => (entry ? [[entry.leagueId, entry.teamId]] : [])),
            ),
          );
        if (!defaults.current.initialized) {
          defaults.current.initialized = true;
          setSelected(initialKeys.flatMap((entry) => (entry ? [entry.key] : [])));
        } else {
          setSelected((previous) =>
            previous.filter((key) =>
              next.some((league) =>
                league.matchups.some((matchup) => matchupKey(league.leagueId, matchup.id) === key),
              ),
            ),
          );
        }
        setUpdated(new Date());
        setError('');
      } catch (failure) {
        if (active) setError(errorMessage(failure));
      } finally {
        inFlight = false;
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    void refresh();
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh();
    }, 60_000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [api, retry, search.leagueId, search.year]);

  const highlighted = selected.flatMap((key) =>
    leagues.flatMap((league) =>
      league.matchups
        .filter((matchup) => matchupKey(league.leagueId, matchup.id) === key)
        .map((matchup) => ({ league, matchup })),
    ),
  );
  const toggle = (key: string) => {
    defaults.current.initialized = true;
    setSelected((previous) =>
      previous.includes(key)
        ? previous.filter((item) => item !== key)
        : previous.length < 4
          ? [...previous, key]
          : previous,
    );
  };

  return (
    <>
      <div className="decision-explorer decision-explorer-live live-workspace">
        <aside className="live-sidebar" aria-label="All league matchups">
          <Heading as="h1" size="md" mb={1}>
            Live matchups
          </Heading>
          <div className="decision-explorer-live-controls">
            <Field.Root width="auto" minW="160px" gap={1}>
              <Field.Label>League</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={leagueFilter}
                  onChange={(event) => setLeagueFilter(event.target.value)}
                >
                  <option value="">All leagues</option>
                  {leagues.map((league) => (
                    <option key={league.leagueId} value={league.leagueId}>
                      {league.leagueName}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <IconButton
              aria-label="Refresh scores"
              title="Refresh scores"
              size="sm"
              variant="ghost"
              onClick={() => setRetry((value) => value + 1)}
              disabled={refreshing}
            >
              <Icon name="refresh" />
            </IconButton>
          </div>{' '}
          <Text fontSize="xs" color="fg.muted" mb={2}>
            {selected.length} of 4 selected
          </Text>
          <Text fontSize="10px" color="fg.muted" mb={3} aria-live="polite">
            {loading
              ? 'Loading matchups…'
              : updated
                ? `Updated ${updated.toLocaleTimeString()}. Refreshes every minute.`
                : ''}
          </Text>
          <Text fontSize="10px" color="fg.muted" mb={2}>
            NFL kickoffs: {timeZone}
          </Text>
          <details className="live-schedule-sources">
            <summary>NFL schedule sources</summary>
            <a href="https://www.espn.com/nfl/scoreboard" target="_blank" rel="noreferrer">
              ESPN NFL scoreboard
            </a>
            {leagues.map((league) => {
              const capturedAt = league.matchups
                .flatMap((matchup) =>
                  [matchup.home, matchup.away].flatMap(
                    (team) =>
                      team?.players.flatMap((player) => player.nflSchedule?.capturedAt ?? []) ?? [],
                  ),
                )
                .sort()
                .at(-1);
              return (
                <Text key={league.leagueId} fontSize="10px">
                  {league.leagueName}:{' '}
                  {capturedAt
                    ? `checked ${new Date(capturedAt).toLocaleString('en-US', { timeZone })} (${timeZone})`
                    : 'schedule unavailable'}
                </Text>
              );
            })}
          </details>
          {contextNotice && (
            <Text as="output" fontSize="xs">
              {contextNotice}
            </Text>
          )}
          {error && (
            <Box role="alert" className="notice error">
              {error}
            </Box>
          )}
          {!loading && !error && leagues.length === 0 && <Text>No leagues are connected yet.</Text>}
          {leagues
            .filter((league) => !leagueFilter || league.leagueId === leagueFilter)
            .map((league) => (
              <Box as="section" key={league.leagueId} mb={3}>
                <Heading as="h2" size="xs" mb={0}>
                  {league.leagueName}
                </Heading>
                <Text fontSize="10px" color="fg.muted" mb={1}>
                  {league.provider} · {league.season} · Week {league.week}
                </Text>
                {league.error ? (
                  <Box as="output">{league.error}</Box>
                ) : league.matchups.length === 0 ? (
                  <Text fontSize="sm">No matchups are available for this scoring period.</Text>
                ) : (
                  <Box display="grid" gap={1}>
                    {league.matchups.map((matchup) => {
                      const key = matchupKey(league.leagueId, matchup.id);
                      return (
                        <CompactMatchup
                          key={key}
                          matchup={matchup}
                          managedTeamId={managedTeamIds[league.leagueId]}
                          selected={selected.includes(key)}
                          disabled={selected.length >= 4 && !selected.includes(key)}
                          onToggle={() => toggle(key)}
                        />
                      );
                    })}
                  </Box>
                )}
              </Box>
            ))}
        </aside>
        <section
          className="live-board"
          aria-label="Highlighted matchups"
          data-count={highlighted.length}
        >
          {highlighted.length === 0 && (
            <Box p={6}>
              <Heading as="h2" size="lg" mb={2}>
                Your matchup board
              </Heading>
              <Text color="fg.muted">
                Select up to four matchups on the left to see both rosters.
              </Text>
            </Box>
          )}
          {highlighted.map(({ league, matchup }) => (
            <Box key={matchupKey(league.leagueId, matchup.id)} className="live-matchup-card">
              <Flex
                className="live-matchup-heading"
                justify="space-between"
                align="center"
                gap={2}
                mb={2}
              >
                <Box minW={0}>
                  <Text fontSize="10px" color="fg.muted">
                    {league.leagueName} · Week {league.week}
                  </Text>
                  <Heading
                    as="h2"
                    size="sm"
                    title={`${matchup.home.name} vs ${matchup.away?.name || 'Bye'}`}
                  >
                    {matchup.home.name} vs {matchup.away?.name || 'Bye'}
                  </Heading>
                </Box>
                <WinProbability matchup={matchup} />
                <Button
                  size="xs"
                  minW="28px"
                  aria-label={`Remove matchup ${matchup.home.name} versus ${matchup.away?.name || 'bye'}`}
                  variant="ghost"
                  onClick={() => toggle(matchupKey(league.leagueId, matchup.id))}
                >
                  <span aria-hidden="true">×</span>
                </Button>
              </Flex>
              <MatchupRosters matchup={matchup} leagueId={league.leagueId} year={league.season} />
            </Box>
          ))}
          {Array.from({ length: 4 - highlighted.length }, (_, index) => (
            <div key={`empty-${index}`} className="decision-explorer-live-empty">
              Select a matchup for this quarter.
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
