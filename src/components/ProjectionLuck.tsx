import { memo, useId, useMemo, useState } from 'react';
import { Box, Heading, NativeSelect, Text } from '@chakra-ui/react';
import type { SeasonInsights } from '../insights';
import { MATCHUP_REPLAYS, projectionLuck } from '../projection-luck';
import { DataTable, ReportExportScope } from './DataTable';

const number = (n: number | null) =>
  n === null ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: 3 });
const signed = (n: number | null) => (n === null ? '—' : `${n > 0 ? '+' : ''}${number(n)}`);

export const ProjectionLuck = memo(function ProjectionLuck({
  data,
  teamId,
  league,
  year,
}: {
  data: SeasonInsights;
  teamId: string;
  league: string;
  year: number;
}) {
  const result = useMemo(() => projectionLuck(data), [data]);
  const [week, setWeek] = useState('');
  const weekId = useId();
  const names = new Map(data.teams.map((t) => [t.teamId, t.teamName]));
  const matchups = result.matchups
    .filter((m) => !teamId || m.home.teamId === teamId || m.away.teamId === teamId)
    .filter((m) => !week || m.weeks.includes(Number(week)))
    .map((m) => {
      const reverse = teamId === m.away.teamId;
      return {
        ...m,
        team: reverse ? m.away : m.home,
        opponent: reverse ? m.home : m.away,
        expected:
          m.homeExpectedWin === null ? null : reverse ? 1 - m.homeExpectedWin : m.homeExpectedWin,
        actual: reverse ? 1 - m.homeActualWin : m.homeActualWin,
        record:
          m.wins === null
            ? null
            : reverse
              ? `${m.losses}–${m.wins}–${m.ties}`
              : `${m.wins}–${m.losses}–${m.ties}`,
      };
    });
  const players = result.players.filter(
    (p) => (!teamId || p.teamId === teamId) && (!week || p.week === Number(week)),
  );
  const sources = [...new Set(data.scores.map((s) => s.projectionSource).filter(Boolean))];
  return (
    <ReportExportScope
      value={{
        context: {
          League: league,
          Season: year,
          'Completed through week': data.completedWeek,
          Team: names.get(teamId) ?? 'All teams',
          'Simulations per covered matchup': MATCHUP_REPLAYS,
          'Projection provenance':
            'Retrospective provider weekly projections; may have been revised',
        },
        filenameContext: `${league}-${year}-projection-luck-${teamId || 'all'}`,
      }}
    >
      <Box
        as="section"
        className="panel insight-section"
        bg="bg"
        borderWidth="1px"
        rounded="lg"
        p={{ base: 4, md: 6 }}
      >
        <Heading as="h2" size="xl" mb={4}>
          Projection performance luck
        </Heading>
        <Text mb={4}>
          Replay each recorded matchup {MATCHUP_REPLAYS} times using the actual starters and their
          weekly projections. Positive scoring differences mean overperformance; negative
          differences mean underperformance. Extra wins compare the real result with the simulated
          win credit.
        </Text>
        <Text mb={4} className="insights-meta">
          Historical provider projections were retrieved after the week and may have been revised.
          They are not independently archived pre-kickoff snapshots. {sources.join(' ')}
        </Text>
        <Box overflowX="auto" className="insight-table-wrap">
          <DataTable
            label="Projection luck by team"
            data={result.teams.filter((t) => !teamId || t.teamId === teamId)}
            getRowId={(t) => t.teamId}
            initialSorting={[{ id: 'luck', desc: true }]}
            columns={[
              {
                id: 'team',
                header: 'Team',
                rowHeader: true,
                value: (t) => t.teamName,
                cell: (t) => t.teamName,
              },
              {
                id: 'luck',
                header: 'Extra wins',
                value: (t) => t.extraWins,
                cell: (t) => signed(t.extraWins),
              },
              {
                id: 'actual',
                header: 'Actual win credit',
                value: (t) => t.actualWins,
                cell: (t) => number(t.actualWins),
              },
              {
                id: 'expected',
                header: 'Simulated win credit',
                value: (t) => t.expectedWins,
                cell: (t) => number(t.expectedWins),
              },
              {
                id: 'delta',
                header: 'Avg. scoring difference',
                value: (t) => t.difference,
                cell: (t) => signed(t.difference),
              },
              {
                id: 'opponentDelta',
                header: 'Avg. opponent difference',
                value: (t) => t.opponentDifference,
                cell: (t) => signed(t.opponentDifference),
              },
              {
                id: 'coverage',
                header: 'Verified matchup coverage',
                value: (t) => `${t.measured} / ${t.games}`,
                cell: (t) => `${t.measured} / ${t.games}`,
              },
              {
                id: 'unmatched',
                header: 'Weeks without verified matchup',
                value: (t) => t.unmatchedWeeks,
                cell: (t) => t.unmatchedWeeks,
              },
            ]}
          />
        </Box>
        <Text my={4} className="insights-meta">
          Season totals above use only successfully replayed matchups, with the same coverage for
          real and simulated win credit. Ties count half. Scoring differences are points per
          replayed matchup. Positive extra wins indicate favorable outcomes relative to projections;
          this is a model comparison, not proof that results were caused by luck. Schedule luck
          remains in Manager report card. Byes, unknown opponents and unpublished matchup-period
          boundaries are excluded. Verified playoff games are included; each published multiweek
          matchup counts once.
        </Text>
        <label htmlFor={weekId}>
          Matchup and player week
          <NativeSelect.Root maxW="220px" my={3}>
            <NativeSelect.Field
              id={weekId}
              aria-label="Projection luck week"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
            >
              <option value="">All completed weeks</option>
              {[...new Set(result.players.map((p) => p.week))].map((w) => (
                <option key={w} value={w}>
                  Week {w}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </label>
        <ReportExportScope
          value={{
            context: {
              League: league,
              Season: year,
              'Generated at': data.generatedAt,
              'Completed through week': data.completedWeek,
              Team: names.get(teamId) ?? 'All teams',
              Week: week || 'All completed weeks',
              'Simulations per covered matchup': MATCHUP_REPLAYS,
              'Projection provenance':
                'Retrospective provider weekly projections; may have been revised',
            },
            filenameContext: `${league}-${year}-projection-luck-${teamId || 'all'}-${week || 'all-weeks'}`,
          }}
        >
          <Heading as="h3" size="lg" my={4}>
            Matchup replays
          </Heading>
          {!matchups.length && (
            <Text mb={4}>
              No reciprocal recorded matchups for this selection. Byes and unknown opponents are
              excluded.
            </Text>
          )}
          <Box overflowX="auto" className="insight-table-wrap">
            <DataTable
              label="Projection matchup replays"
              data={matchups}
              getRowId={(m) => m.id}
              columns={[
                {
                  id: 'week',
                  header: 'Weeks',
                  value: (m) => m.weeks.join(', '),
                  cell: (m) => m.weeks.join(', '),
                },
                {
                  id: 'team',
                  header: 'Team',
                  rowHeader: true,
                  value: (m) => names.get(m.team.teamId) ?? m.team.teamId,
                  cell: (m) => names.get(m.team.teamId) ?? m.team.teamId,
                },
                {
                  id: 'opponent',
                  header: 'Opponent',
                  value: (m) => names.get(m.opponent.teamId) ?? m.opponent.teamId,
                  cell: (m) => names.get(m.opponent.teamId) ?? m.opponent.teamId,
                },
                {
                  id: 'actual',
                  header: 'Actual points',
                  value: (m) => m.team.actual,
                  cell: (m) => number(m.team.actual),
                },
                {
                  id: 'projected',
                  header: 'Starter projected points',
                  value: (m) => m.team.projected,
                  cell: (m) => number(m.team.projected),
                },
                {
                  id: 'delta',
                  header: 'Scoring difference',
                  value: (m) => m.team.difference,
                  cell: (m) => signed(m.team.difference),
                },
                {
                  id: 'opponentDelta',
                  header: 'Opponent difference',
                  value: (m) => m.opponent.difference,
                  cell: (m) => signed(m.opponent.difference),
                },
                {
                  id: 'chance',
                  header: 'Simulated win credit %',
                  value: (m) => (m.expected === null ? null : m.expected * 100),
                  cell: (m) => (m.expected === null ? '—' : `${number(m.expected * 100)}%`),
                },
                {
                  id: 'record',
                  header: 'Replay W–L–T',
                  value: (m) => m.record,
                  cell: (m) => m.record ?? '—',
                },
                {
                  id: 'result',
                  header: 'Real result',
                  value: (m) => (m.actual === 1 ? 'Win' : m.actual === 0.5 ? 'Tie' : 'Loss'),
                  cell: (m) => (m.actual === 1 ? 'Win' : m.actual === 0.5 ? 'Tie' : 'Loss'),
                },
                {
                  id: 'luck',
                  header: 'Extra win credit',
                  value: (m) => (m.expected === null ? null : m.actual - m.expected),
                  cell: (m) => signed(m.expected === null ? null : m.actual - m.expected),
                },
                {
                  id: 'coverage',
                  header: 'Replay coverage',
                  value: (m) => m.reason ?? `${MATCHUP_REPLAYS} replays`,
                  cell: (m) => m.reason ?? `${MATCHUP_REPLAYS} replays`,
                },
              ]}
            />
          </Box>
          <Heading as="h3" size="lg" my={4}>
            Player performance and variance
          </Heading>
          <Box overflowX="auto" className="insight-table-wrap">
            <DataTable
              label="Player projection variance"
              data={players}
              getRowId={(p) => `${p.week}:${p.teamId}:${p.playerId}`}
              columns={[
                {
                  id: 'player',
                  header: 'Player',
                  rowHeader: true,
                  value: (p) => data.playerIdentities?.[p.playerId]?.name ?? p.playerId,
                  cell: (p) => data.playerIdentities?.[p.playerId]?.name ?? p.playerId,
                },
                {
                  id: 'team',
                  header: 'Team',
                  value: (p) => names.get(p.teamId) ?? p.teamId,
                  cell: (p) => names.get(p.teamId) ?? p.teamId,
                },
                { id: 'week', header: 'Week', value: (p) => p.week, cell: (p) => p.week },
                {
                  id: 'position',
                  header: 'Position',
                  value: (p) => p.position,
                  cell: (p) => p.position ?? '—',
                },
                {
                  id: 'projected',
                  header: 'Weekly projection',
                  value: (p) => p.projected,
                  cell: (p) => number(p.projected),
                },
                {
                  id: 'actual',
                  header: 'Actual points',
                  value: (p) => p.actual,
                  cell: (p) => number(p.actual),
                },
                {
                  id: 'difference',
                  header: 'Difference',
                  value: (p) => p.difference,
                  cell: (p) => signed(p.difference),
                },
                {
                  id: 'variance',
                  header: 'Prior error variance (pts²)',
                  value: (p) => p.variance,
                  cell: (p) => number(p.variance),
                },
                {
                  id: 'samples',
                  header: 'Prior observations',
                  value: (p) => p.samples,
                  cell: (p) => p.samples,
                },
                {
                  id: 'basis',
                  header: 'Variance basis',
                  value: (p) =>
                    p.basis === 'player'
                      ? 'Player history'
                      : p.basis === 'position'
                        ? `Same-position history (${p.position})`
                        : 'Unavailable: needs 2 prior observations',
                  cell: (p) =>
                    p.basis === 'player'
                      ? 'Player history'
                      : p.basis === 'position'
                        ? `Same-position history (${p.position})`
                        : 'Unavailable: needs 2 prior observations',
                },
              ]}
            />
          </Box>
        </ReportExportScope>
        <Box as="details" mt={5}>
          <summary>How projection luck is calculated</summary>
          <Text mt={3}>
            Player difference = actual − weekly projection. For each earlier completed week, collect
            that error; sample variance = sum of squared deviations from the average error ÷
            (observations − 1). Use the player's history with at least two observations, otherwise
            earlier same-position starter errors from this league. With neither, variance and replay
            results are unavailable. No result from the week being replayed or later weeks enters
            its variance.
          </Text>
          <Text mt={3}>
            Each trial draws each starter independently from a normal distribution centered on the
            weekly projection with the estimated variance, then sums starter points and rounds team
            totals to two decimals. Real zero and negative values are retained. The actual starting
            lineup is fixed; bench optimization, injuries, player correlations and provider
            revisions are not modeled. Results are repeatable for the same inputs. Just 100 replays
            means coarse estimates: near 50%, sampling uncertainty is about ±10 percentage points at
            95%, separate from model error. Two-observation variance estimates are especially
            uncertain. Variance measures how much errors vary, not persistent projection bias:
            identical errors have zero variance, even if those errors are large.
          </Text>
        </Box>
        {!!result.duplicateTeamWeeks && (
          <Text mt={4}>
            Excluded {result.duplicateTeamWeeks} ambiguous team-weeks with duplicate scoring rows.
          </Text>
        )}
      </Box>
    </ReportExportScope>
  );
});
