import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useApi } from '../auth/session';
import { loadWeeklyOverview, type WeeklyOverviewRow } from '../weekly-overview';
import { WaiverAdvisor } from './WaiverAdvisor';
import { LineupAdvisor } from './LineupAdvisor';
import { reportFreshnessLabel } from './report-freshness';

export function WeeklyOverviewPage() {
  const api = useApi();
  const [rows, setRows] = useState<WeeklyOverviewRow[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState<string>();
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    // Fetch the overview when entering this account session or requesting a refresh.
    // oxlint-disable-next-line react/set-state-in-effect
    setBusy(true);
    void loadWeeklyOverview({ ...api, managedTeam: api.managedTeam! })
      .then(
        (next) => {
          if (active) {
            setRows(next);
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
  return (
    <Box>
      <Heading as="h1" mb={3}>
        My weekly overview
      </Heading>
      <Flex gap={3} align="center" wrap="wrap" mb={4}>
        <Button disabled={busy} onClick={() => setRefresh((value) => value + 1)}>
          Refresh overview
        </Button>
        <Text as="output">
          {busy
            ? 'Loading overview…'
            : updated
              ? `Matchups loaded at ${updated}. Refresh on demand; season reports use the existing cache.`
              : ''}
        </Text>
      </Flex>
      {error && <Text role="alert">{error}</Text>}
      {!busy && !error && rows.length === 0 && (
        <Box>
          <Text>Connect a league to start your weekly overview.</Text>
          <Link to="/leagues/new">Connect a league</Link>
        </Box>
      )}
      <Box
        display="grid"
        gridTemplateColumns={{ base: '1fr', md: 'repeat(auto-fit, minmax(280px, 1fr))' }}
        gap={4}
      >
        {rows.map((row) => {
          const selected = row.selection?.teams.find(
            (team) => team.teamId === row.selection?.teamId,
          );
          const myTeam =
            row.matchup?.home.teamId === selected?.teamId ? row.matchup?.home : row.matchup?.away;
          const opponent =
            row.matchup?.home.teamId === selected?.teamId ? row.matchup?.away : row.matchup?.home;
          return (
            <Box
              as="section"
              key={row.league.leagueId}
              p={4}
              borderWidth="1px"
              rounded="lg"
              minW={0}
            >
              <Heading as="h2" size="lg">
                {row.league.leagueName}
              </Heading>
              <Text>
                {row.league.leagueType === 0 ? 'Sleeper' : 'ESPN'} · {row.league.seasonId} ·{' '}
                {row.week === null ? 'Week unavailable' : `Week ${row.week}`}
              </Text>
              {selected ? (
                <>
                  <Heading as="h3" size="md" mt={3}>
                    {selected.teamName}
                  </Heading>
                  <Text>
                    {row.matchup
                      ? `${myTeam?.score?.toFixed(2) ?? '—'} vs ${opponent ? `${opponent.name} (${opponent.score?.toFixed(2) ?? '—'})` : 'Bye'}`
                      : 'Matchup unavailable'}
                  </Text>
                  <Text>
                    Record:{' '}
                    {row.team
                      ? `${row.team.wins}–${row.team.loss}–${row.team.ties}`
                      : 'Unavailable'}
                  </Text>
                  <Text>
                    Estimated playoff chance:{' '}
                    {row.playoff === null ? 'Unavailable' : `${(row.playoff * 100).toFixed(1)}%`}
                  </Text>
                  {row.refreshedAt && (
                    <Text fontSize="sm">
                      {reportFreshnessLabel(row.refreshedAt)} · through week {row.completedWeek}.
                      Playoff estimates are not calibrated odds.
                    </Text>
                  )}
                  {myTeam && (
                    <details>
                      <summary>Lineup advisor</summary>
                      <LineupAdvisor
                        team={myTeam}
                        slots={row.lineupSlots}
                        capturedAt={row.rosterCapturedAt}
                      />
                    </details>
                  )}
                  {api.waivers && (
                    <details>
                      <summary>Waiver advisor</summary>
                      <WaiverAdvisor
                        key={`${row.league.leagueId}:${row.league.seasonId}`}
                        api={api.waivers}
                        leagueId={row.league.leagueId}
                        year={row.league.seasonId}
                      />
                    </details>
                  )}
                  <Flex mt={3} gap={3} wrap="wrap">
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
