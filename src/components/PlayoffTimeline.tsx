/* oxlint-disable jsx-a11y/prefer-tag-over-role -- SVG needs role="img" for a named chart. */
import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';
import { useEffect, useState, type CSSProperties } from 'react';
import type { SeasonInsights } from '../insights';
import { cachedPlayoffForecast } from '../playoff-timeline';
import type { PlayoffForecast, PlayoffSettings } from '../playoff-forecast';
import { DataTable } from './DataTable';

type Metric = 'playoff' | 'championship';
const colors = [
  '#246747',
  '#a34f2d',
  '#345eae',
  '#8a4aa0',
  '#a2720c',
  '#007e86',
  '#b03362',
  '#5a681c',
  '#8052b4',
  '#3b7192',
  '#9b584b',
  '#62708b',
];
const left = 52;
const right = 18;
const top = 18;
const bottom = 310;
const width = 920;
const percent = (value: number | null) => (value == null ? '—' : `${(value * 100).toFixed(1)}%`);

export function PlayoffTimeline({
  data,
  settings,
  maxWeek,
  metric,
  onMetricChange,
}: {
  data: SeasonInsights;
  settings: PlayoffSettings;
  maxWeek: number;
  metric: Metric;
  onMetricChange: (metric: Metric) => void;
}) {
  const [progress, setProgress] = useState<{
    data: SeasonInsights;
    settings: PlayoffSettings;
    forecasts: PlayoffForecast[];
  }>(() => ({ data, settings, forecasts: [] }));
  const forecasts =
    progress.data === data && progress.settings === settings ? progress.forecasts : [];
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let week = 1;
    const next = () => {
      if (cancelled) return;
      const result = cachedPlayoffForecast(data, settings, week);
      setProgress((previous) => ({
        data,
        settings,
        forecasts: [
          ...(previous.data === data && previous.settings === settings ? previous.forecasts : []),
          result,
        ],
      }));
      week++;
      if (week <= maxWeek) timer = setTimeout(next, 0);
    };
    if (maxWeek > 0) timer = setTimeout(next, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [data, settings, maxWeek]);

  const teams = data.teams;
  const chartWidth = Math.max(width, maxWeek * 54 + left + right);
  const x = (week: number) =>
    left +
    (maxWeek === 1
      ? (chartWidth - left - right) / 2
      : ((week - 1) * (chartWidth - left - right)) / (maxWeek - 1));
  const y = (value: number) => bottom - value * (bottom - top);
  const valueFor = (forecast: PlayoffForecast, teamId: string) => {
    const row = forecast.rows.find((item) => item.teamId === teamId);
    return row ? (metric === 'playoff' ? row.playoff : (row.advance.at(-1) ?? null)) : null;
  };
  const tableRows = forecasts.map((forecast) => ({
    week: forecast.throughWeek,
    values: Object.fromEntries(teams.map((team) => [team.teamId, valueFor(forecast, team.teamId)])),
  }));
  const label = metric === 'playoff' ? 'Make playoffs' : 'Win championship';
  const available = forecasts.some((forecast) => !forecast.reason);

  return (
    <Box as="section" aria-label="Week-by-week playoff forecast" mt={5}>
      <Heading as="h3" size="md" mb={2}>
        Season trend
      </Heading>
      <Text mb={3}>
        Each point reruns the simulation using results through that completed regular-season week.
        Older weeks exclude today’s player projections and injuries. Lines show estimates, not
        official clinching or elimination decisions.
      </Text>
      <Flex as="fieldset" gap={2} flexWrap="wrap" mb={4} border="0" p="0">
        <Box as="legend" fontWeight="bold" mb={2}>
          Percentage
        </Box>
        <Button
          size="sm"
          colorPalette="green"
          variant={metric === 'playoff' ? 'solid' : 'outline'}
          aria-pressed={metric === 'playoff'}
          onClick={() => onMetricChange('playoff')}
        >
          Make playoffs
        </Button>
        <Button
          size="sm"
          colorPalette="green"
          variant={metric === 'championship' ? 'solid' : 'outline'}
          aria-pressed={metric === 'championship'}
          onClick={() => onMetricChange('championship')}
        >
          Win championship
        </Button>
      </Flex>
      {forecasts.length < maxWeek && (
        <Box as="output" mb={3} display="block">
          Simulating week {forecasts.length + 1} of {maxWeek}…
        </Box>
      )}
      {forecasts.some((forecast) => forecast.reason) && (
        <Text mb={3} fontSize="sm">
          Weeks with incomplete results are omitted from the lines and shown as unavailable in the
          exact-value table.
        </Text>
      )}
      {!available && forecasts.length === maxWeek ? (
        <Text>Week-by-week estimates are unavailable: {forecasts.at(-1)?.reason}</Text>
      ) : (
        <>
          <Box overflowX="auto" pb={2}>
            <svg
              className="playoff-timeline-chart"
              viewBox={`0 0 ${chartWidth} 350`}
              width={chartWidth}
              height="350"
              role="img"
              aria-label={`${label} probability by completed week for each team. Exact values are in the table below.`}
            >
              {[0, 0.25, 0.5, 0.75, 1].map((value) => (
                <g key={value}>
                  <line
                    x1={left}
                    x2={chartWidth - right}
                    y1={y(value)}
                    y2={y(value)}
                    stroke="var(--chakra-colors-border)"
                    strokeDasharray={value ? '3 5' : undefined}
                  />
                  <text
                    x={left - 8}
                    y={y(value) + 4}
                    textAnchor="end"
                    fill="var(--chakra-colors-fg-muted)"
                    fontSize="12"
                  >
                    {value * 100}%
                  </text>
                </g>
              ))}
              {Array.from({ length: maxWeek }, (_, index) => (
                <text
                  key={index}
                  x={x(index + 1)}
                  y={bottom + 23}
                  textAnchor="middle"
                  fill="var(--chakra-colors-fg-muted)"
                  fontSize="12"
                >
                  {index + 1}
                </text>
              ))}
              {teams.map((team, teamIndex) => {
                const points = forecasts
                  .map((forecast) => ({
                    week: forecast.throughWeek,
                    value: valueFor(forecast, team.teamId),
                  }))
                  .filter(
                    (point): point is { week: number; value: number } => point.value !== null,
                  );
                return (
                  <g key={team.teamId}>
                    {points
                      .slice(1)
                      .map(
                        (point, index) =>
                          points[index].week === point.week - 1 && (
                            <line
                              key={point.week}
                              x1={x(points[index].week)}
                              y1={y(points[index].value)}
                              x2={x(point.week)}
                              y2={y(point.value)}
                              stroke={colors[teamIndex % colors.length]}
                              strokeWidth="2.5"
                              strokeDasharray={teamIndex >= colors.length ? '6 4' : undefined}
                            />
                          ),
                      )}
                    {points.map((point) => (
                      <circle
                        key={`${metric}:${point.week}`}
                        cx={x(point.week)}
                        cy={y(point.value)}
                        r="4.5"
                        fill={colors[teamIndex % colors.length]}
                        stroke="var(--chakra-colors-bg)"
                        strokeWidth="1.5"
                        style={
                          {
                            '--point-rise': `${bottom - y(point.value)}px`,
                            animationDelay: `${(point.week - 1) * 65 + teamIndex * 12}ms`,
                          } as CSSProperties
                        }
                      >
                        <title>
                          {team.teamName}, week {point.week}: {percent(point.value)}
                        </title>
                      </circle>
                    ))}
                  </g>
                );
              })}
              <text
                x={(left + chartWidth - right) / 2}
                y="346"
                textAnchor="middle"
                fill="var(--chakra-colors-fg)"
                fontSize="13"
              >
                Completed week
              </text>
            </svg>
          </Box>
          <Flex
            as="ul"
            listStyleType="none"
            flexWrap="wrap"
            gapX={5}
            gapY={2}
            p={0}
            mt={3}
            mb={4}
            aria-label="Team colors"
          >
            {teams.map((team, index) => (
              <Box as="li" key={team.teamId} fontSize="sm">
                <Box
                  as="span"
                  display="inline-block"
                  width="3"
                  height="3"
                  rounded="full"
                  bg={colors[index % colors.length]}
                  mr={2}
                  aria-hidden="true"
                />
                {team.teamName}
              </Box>
            ))}
          </Flex>
          <Box as="details">
            <Box as="summary" cursor="pointer" fontWeight="bold" mb={3}>
              Exact weekly percentages
            </Box>
            <Box overflowX="auto">
              <DataTable
                label={`Weekly ${label.toLowerCase()} probabilities`}
                data={tableRows}
                getRowId={(row) => String(row.week)}
                columns={[
                  {
                    id: 'week',
                    header: 'Week',
                    value: (row) => row.week,
                    rowHeader: true,
                    cell: (row) => row.week,
                  },
                  ...teams.map((team) => ({
                    id: team.teamId,
                    header: team.teamName,
                    value: (row: (typeof tableRows)[number]) => row.values[team.teamId],
                    cell: (row: (typeof tableRows)[number]) => percent(row.values[team.teamId]),
                  })),
                ]}
              />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
