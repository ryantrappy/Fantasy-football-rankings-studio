import { useId, useMemo, useState } from 'react';
import { Box, Button, Flex, Heading, NativeSelect, Text } from '@chakra-ui/react';
import { barX, defineChart, text } from '@tanstack/charts';
import { Chart } from '@tanstack/charts/react';
import { decorative } from '@tanstack/charts/mark/decorative';
import { scaleBand } from '@tanstack/charts/scales/band';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { tooltip } from '@tanstack/charts/tooltip';
import type { SeasonInsights } from '../insights';
import {
  positionStrength,
  remainingScheduleStrength,
  type PositionStrength,
  type PositionStrengthMode,
} from '../season-strength';
import { DataTable } from './DataTable';

const number = (value: number | null) =>
  value === null ? 'Unavailable' : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
const signed = (value: number | null) =>
  value === null ? 'Unavailable' : `${value > 0 ? '+' : ''}${number(value)}`;
const palette: Record<string, string> = {
  RB: '#79b5fc',
  WR: '#59dc94',
  QB: '#ffd34a',
  TE: '#b69afa',
  K: '#ef95c7',
  DEF: '#5ed4e6',
};
const extras = ['#e9a36b', '#a5c47f', '#92a4e8', '#d7a2a2'];
const color = (position: string, positions: string[]) =>
  palette[position] ??
  extras[positions.filter((p) => !palette[p]).indexOf(position) % extras.length];

function ProjectionBars({ model, sort }: { model: PositionStrength; sort: string }) {
  const definition = useMemo(() => {
    const rows = [...model.rows].sort(
      (a, b) =>
        (sort === 'total' ? (b.total ?? -Infinity) : (b.points[sort] ?? -Infinity)) -
          (sort === 'total' ? (a.total ?? -Infinity) : (a.points[sort] ?? -Infinity)) ||
        a.teamName.localeCompare(b.teamName),
    );
    const segments = rows.flatMap((row) => {
      if (row.total === null) return [];
      let positive = 0;
      let negative = 0;
      return model.positions.map((position) => {
        const points = row.points[position]!;
        const start = points < 0 ? negative : positive;
        const end = start + points;
        if (points < 0) negative = end;
        else positive = end;
        return {
          id: `${row.teamId}:${position}`,
          teamId: row.teamId,
          teamName: row.teamName,
          position,
          points,
          start,
          end,
          center: (start + end) / 2,
          label: number(points),
        };
      });
    });
    const max = Math.max(1, ...segments.map((s) => s.end));
    const min = Math.min(0, ...segments.map((s) => s.end));
    const totals = rows
      .filter((row) => row.total !== null)
      .map((row) => ({
        ...row,
        edge: Math.max(0, ...segments.filter((s) => s.teamId === row.teamId).map((s) => s.end)),
        label: number(row.total),
      }));
    const names = new Map(rows.map((row) => [row.teamId, row.teamName]));
    return defineChart({
      marks: [
        barX(segments, {
          x1: 'start',
          x2: 'end',
          y: 'teamId',
          key: 'id',
          fill: (s) => color(s.position, model.positions),
          inset: 5,
        }),
        decorative(
          text(
            segments.filter((s) => Math.abs(s.points) > (max - min) * 0.035),
            {
              x: 'center',
              y: 'teamId',
              text: 'label',
              fill: '#14251f',
              fontSize: 12,
              fontWeight: 700,
            },
          ),
        ),
        decorative(
          text(totals, {
            x: 'edge',
            y: 'teamId',
            text: 'label',
            dx: 8,
            anchor: 'start',
            fontWeight: 700,
          }),
        ),
      ],
      tooltip: {
        use: tooltip,
        format: (point) =>
          `${point.datum.teamName} · ${point.datum.position}: ${number(point.datum.points)} ${model.mode === 'completed' ? 'actual' : 'projected'} points`,
      },
      scales: {
        x: {
          scale: scaleLinear().domain([min, max * 1.12]),
          axis: {
            label:
              model.mode === 'completed'
                ? 'Completed-week starter fantasy points'
                : 'Remaining projected fantasy points',
          },
        },
        y: {
          scale: scaleBand().domain(rows.map((row) => row.teamId)),
          axis: {
            ticks: {
              format: (id) => {
                const name = names.get(String(id)) ?? String(id);
                return name.length > 25 ? `${name.slice(0, 24)}…` : name;
              },
            },
          },
        },
      },
    });
  }, [model, sort]);
  return (
    <Chart
      definition={definition}
      height={Math.max(230, model.rows.length * 42 + 70)}
      ariaLabel={`${model.mode === 'completed' ? 'Completed-week actual starter points' : 'Roster projections'} by position. Full team names, position values and totals are in the tables below.`}
    />
  );
}

export function SeasonStrength({
  data,
  managedTeamId,
}: {
  data: SeasonInsights;
  managedTeamId?: string | null;
}) {
  const [mode, setMode] = useState<PositionStrengthMode>('projected');
  const completed = mode === 'completed';
  const positions = useMemo(() => positionStrength(data, mode), [data, mode]);
  const schedule = useMemo(() => remainingScheduleStrength(data), [data]);
  const [sort, setSort] = useState('total');
  const sortId = useId();
  const teamLabel = (row: { teamId: string; teamName: string }) => (
    <>
      {row.teamName}
      {row.teamId === managedTeamId && <small> Your team</small>}
    </>
  );
  const hasPositions = positions.rows.some((row) => row.total !== null);
  return (
    <Box
      as="section"
      className="insight-section season-strength"
      aria-label="Roster and remaining schedule strength"
    >
      <Text className="eyebrow" mb={4}>
        Where every team stands
      </Text>
      <Heading as="h2" size="xl" mb={4}>
        Roster strength &amp; the road ahead
      </Heading>
      <Box className="panel" p={{ base: 4, md: 6 }} mb={6}>
        <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
          <Heading as="h3" size="lg" mb={4}>
            {completed ? 'Completed-week scoring' : 'Roster projections'}
          </Heading>
          <Flex
            as="fieldset"
            aria-label="Position ranking weeks"
            gap={2}
            flexWrap="wrap"
            border="0"
            p="0"
          >
            <Button
              colorPalette="indigo"
              variant={completed ? 'outline' : 'solid'}
              aria-pressed={!completed}
              onClick={() => {
                setMode('projected');
                setSort('total');
              }}
            >
              Projected remaining weeks
            </Button>
            <Button
              colorPalette="indigo"
              variant={completed ? 'solid' : 'outline'}
              aria-pressed={completed}
              onClick={() => {
                setMode('completed');
                setSort('total');
              }}
            >
              Completed weeks only
            </Button>
          </Flex>
          {hasPositions && (
            <label htmlFor={sortId}>
              Sort charts by
              <NativeSelect.Root mt={2}>
                <NativeSelect.Field
                  id={sortId}
                  aria-label="Sort roster charts by"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="total">
                    {completed ? 'Total actual points' : 'Total projected points'}
                  </option>
                  {positions.positions.map((position) => (
                    <option key={position} value={position}>
                      {position} strength
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </label>
          )}
        </Flex>
        <Text mb={4}>
          {completed ? (
            "Actual points from the starters each manager fielded in completed weeks, grouped by primary position. Bench points and future or unfinished weeks are excluded. FLEX and SUPER_FLEX starters count under the player's position once. Commissioner adjustments to team totals are not assigned to a position."
          ) : (
            <>
              Best legal weekly lineups from current rosters, grouped by each selected player's
              primary position. Bench players compete for starting slots; reserve and taxi players
              are excluded. FLEX and SUPER_FLEX count under the player's position, once per week.
            </>
          )}
        </Text>
        {positions.notice && (
          <Text as="output" display="block" mb={4}>
            {positions.notice}
          </Text>
        )}
        {hasPositions ? (
          <>
            <Text mb={4} className="insights-meta">
              {completed ? (
                <>
                  Actual starter scoring under the selected league's rules · completed weeks{' '}
                  {positions.weeks.join(', ')} · through week {data.completedWeek} · report captured{' '}
                  {data.generatedAt}. Primary positions come from provider player metadata (Sleeper
                  uses its current position catalog). Rankings require complete starter scores and
                  positions for every displayed week.
                </>
              ) : (
                <>
                  {data.playoffProjection?.provider} native projections · selected league scoring
                  and lineup rules · weeks {positions.weeks.join(', ')} (including configured
                  playoff weeks) · captured {data.playoffProjection?.capturedAt ?? data.generatedAt}
                  . Published byes score zero. Confirmed absences are excluded in the current week
                  only; future injury recovery is unknown. Rankings use the same full horizon for
                  every team.
                </>
              )}
            </Text>
            <Box overflowX="auto">
              <Box minW="720px">
                <ProjectionBars
                  model={positions}
                  sort={positions.positions.includes(sort) ? sort : 'total'}
                />
              </Box>
            </Box>
            <Flex gap={4} flexWrap="wrap" my={4} aria-label="Position colors">
              {positions.positions.map((position) => (
                <Flex key={position} gap={2} align="center">
                  <Box
                    width="14px"
                    height="14px"
                    bg={color(position, positions.positions)}
                    aria-hidden="true"
                  />
                  {position}
                </Flex>
              ))}
            </Flex>
            <Heading as="h3" size="lg" my={4}>
              Position group rankings
            </Heading>
            <Text mb={4}>
              1 is strongest. Equal totals to two decimal places share a rank; the next rank skips
              tied teams. Ranks compare teams with complete{' '}
              {completed ? 'actual starter data' : 'projections'}. Gray cells are unavailable, never
              zero.
            </Text>
            <Box overflowX="auto">
              <DataTable
                key={`ranks:${mode}:${sort}`}
                label="Position group rankings"
                data={positions.rows}
                getRowId={(row) => row.teamId}
                initialSorting={[{ id: sort === 'total' ? 'total' : sort, desc: true }]}
                columns={[
                  {
                    id: 'team',
                    header: 'Team',
                    value: (row) => row.teamName,
                    rowHeader: true,
                    cell: (row) => teamLabel(row),
                  },
                  ...positions.positions.map((position) => ({
                    id: position,
                    header: position,
                    value: (row: PositionStrength['rows'][number]) => row.points[position],
                    cell: (row: PositionStrength['rows'][number]) => {
                      const rank = row.ranks[position];
                      const count = positions.rows.filter((r) => r.ranks[position] !== null).length;
                      const fill =
                        rank === null
                          ? '#e4e8e6'
                          : rank <= Math.ceil(count / 4)
                            ? '#79b5fc'
                            : rank <= Math.ceil(count / 2)
                              ? '#59dc94'
                              : rank <= Math.ceil((count * 3) / 4)
                                ? '#ffd34a'
                                : '#f3a1a1';
                      return (
                        <span className="position-rank-cell" style={{ background: fill }}>
                          <strong>{rank === null ? '—' : `#${rank}`}</strong>
                          <small>
                            {number(row.points[position])}
                            {rank === null ? '' : ' pts'}
                          </small>
                        </span>
                      );
                    },
                  })),
                  {
                    id: 'total',
                    header: completed ? 'Total actual points' : 'Total projected points',
                    value: (row) => row.total,
                    cell: (row) => number(row.total),
                  },
                  {
                    id: 'coverage',
                    header: 'Weeks covered',
                    value: (row) => row.coveredWeeks,
                    cell: (row) => `${row.coveredWeeks} / ${positions.weeks.length}`,
                  },
                ]}
              />
            </Box>
          </>
        ) : (
          <Text className="notice">
            {completed ? (
              data.completedWeek === 0 ? (
                'No completed weeks yet. Actual position rankings will appear after a week finishes.'
              ) : (
                'Completed-week position data is unavailable for this report. Refresh to load starter positions. Missing lineup details or player positions are not scored as zero.'
              )
            ) : (
              <>
                Position projections are unavailable for this report. Refresh an active-season
                report to load the new positional breakdown. Historical and completed seasons do not
                substitute current projections; missing or unsupported lineup positions are not
                scored as zero.
              </>
            )}
          </Text>
        )}
        {completed && !hasPositions && positions.weeks.length > 0 && (
          <DataTable
            label="Completed-week position coverage"
            data={positions.rows}
            getRowId={(row) => row.teamId}
            columns={[
              {
                id: 'team',
                header: 'Team',
                value: (row) => row.teamName,
                rowHeader: true,
                cell: (row) => teamLabel(row),
              },
              {
                id: 'coverage',
                header: 'Starter week coverage',
                value: (row) => row.coveredWeeks,
                cell: (row) => `${row.coveredWeeks} / ${positions.weeks.length}`,
              },
            ]}
          />
        )}
      </Box>
      <Box className="panel" p={{ base: 4, md: 6 }}>
        <Heading as="h3" size="lg" mb={4}>
          Remaining schedule strength
        </Heading>
        <Text mb={4}>
          Average opponent points above the same-week league average. Negative is easier, positive
          is harder; rank 1 is easiest. Each remaining scoring week counts equally, including
          repeated opponents and each week of a multiweek matchup. Published byes are excluded.
          Playoff opponents are not assumed.
        </Text>
        <Text mb={4} className="insights-meta">
          As of completed week {data.completedWeek} ·{' '}
          {schedule.weeks.length
            ? `remaining regular-season weeks ${schedule.weeks.join(', ')}`
            : 'no remaining regular-season weeks'}{' '}
          · report captured {data.generatedAt}. Complete league-wide legal-lineup projections are
          used when available; otherwise the entire week uses each team's completed regular-season
          scoring average. That fallback is labeled below and uses no scores after this cutoff.
        </Text>
        {!schedule.endWeek ? (
          <Text className="notice">
            The regular-season calendar is unavailable; schedule difficulty cannot be quantified.
          </Text>
        ) : !schedule.weeks.length ? (
          <Text className="notice">
            The regular season is complete. No remaining fantasy matchups to rank.
          </Text>
        ) : (
          <>
            <Box overflowX="auto">
              <DataTable
                label="Remaining schedule difficulty"
                data={schedule.rows}
                getRowId={(row) => row.teamId}
                initialSorting={[{ id: 'rank', desc: false }]}
                columns={[
                  {
                    id: 'team',
                    header: 'Team',
                    value: (row) => row.teamName,
                    rowHeader: true,
                    cell: (row) => teamLabel(row),
                  },
                  {
                    id: 'rank',
                    header: 'Rank · easiest first',
                    value: (row) => row.rank,
                    cell: (row) => (row.rank === null ? 'Unranked' : `#${row.rank}`),
                  },
                  {
                    id: 'difficulty',
                    header: 'Difficulty · pts / week',
                    value: (row) => row.difficulty,
                    cell: (row) => signed(row.difficulty),
                  },
                  {
                    id: 'coverage',
                    header: 'Opponent weeks measured',
                    value: (row) => row.measuredWeeks,
                    cell: (row) =>
                      `${row.measuredWeeks} / ${row.scheduledWeeks} known${row.unknownWeeks ? ` · ${row.unknownWeeks} unknown` : ''}`,
                  },
                  {
                    id: 'historical',
                    header: 'Historical fallback weeks',
                    value: (row) => row.historicalWeeks,
                    cell: (row) => row.historicalWeeks,
                  },
                ]}
              />
            </Box>
            <Text mb={4}>
              Incomplete schedules or opponent estimates remain unranked. Ties share a rank, with
              the next rank skipped. A zero difficulty means league-average opponents.
            </Text>
            {schedule.rows.map((team) => (
              <details key={team.teamId} className="schedule-strength-details">
                <summary>
                  {team.teamName}
                  {team.teamId === managedTeamId ? ' · Your team' : ''} · week-by-week opponents
                </summary>
                <Box overflowX="auto">
                  <DataTable
                    label={`${team.teamName} remaining opponents`}
                    data={team.opponents}
                    getRowId={(row) => String(row.week)}
                    columns={[
                      {
                        id: 'week',
                        header: 'Week',
                        value: (row) => row.week,
                        cell: (row) => row.week,
                      },
                      {
                        id: 'opponent',
                        header: 'Opponent',
                        value: (row) => row.opponentName,
                        rowHeader: true,
                        cell: (row) => row.opponentName,
                      },
                      {
                        id: 'points',
                        header: 'Expected opponent points',
                        value: (row) => row.points,
                        cell: (row) => number(row.points),
                      },
                      {
                        id: 'baseline',
                        header: 'League average',
                        value: (row) => row.baseline,
                        cell: (row) => number(row.baseline),
                      },
                      {
                        id: 'difference',
                        header: 'Difference',
                        value: (row) => row.difference,
                        cell: (row) => signed(row.difference),
                      },
                      {
                        id: 'source',
                        header: 'Basis',
                        value: (row) => row.source,
                        cell: (row) =>
                          row.source === 'projection'
                            ? `${data.playoffProjection?.provider} weekly lineup`
                            : row.source === 'historical'
                              ? 'Completed-score average'
                              : row.status === 'bye'
                                ? 'Excluded bye'
                                : 'Unavailable',
                      },
                    ]}
                  />
                </Box>
              </details>
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
