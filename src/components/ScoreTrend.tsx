import { useMemo } from 'react';
import { defineChart, dot, lineY } from '@tanstack/charts';
import { Chart } from '@tanstack/charts/react';
import { decorative } from '@tanstack/charts/mark/decorative';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import { tooltip } from '@tanstack/charts/tooltip';
import type { ScoreWeek } from '../insights';
import { Box, Flex, Text } from '@chakra-ui/react';

const colors = [
  '#246747',
  '#315ea8',
  '#8a531d',
  '#914d9a',
  '#a03d4d',
  '#157782',
  '#716016',
  '#555ab5',
  '#8b523b',
  '#4a6b25',
  '#8b3972',
  '#416876',
];

export function ScoreTrend({
  scores,
  teams,
}: {
  scores: ScoreWeek[];
  teams: { teamId: string; teamName: string }[];
}) {
  const series = useMemo(
    () =>
      teams
        .map((team, index) => ({
          ...team,
          color: colors[index % colors.length],
          scores: scores.filter((score) => score.teamId === team.teamId),
        }))
        .filter((team) => team.scores.length),
    [scores, teams],
  );
  const definition = useMemo(
    () =>
      defineChart({
        marks: series.flatMap((team) => [
          decorative(
            lineY(team.scores, { x: 'week', y: 'actual', stroke: team.color, strokeWidth: 3 }),
          ),
          dot(team.scores, { x: 'week', y: 'actual', fill: team.color, r: 4 }),
          lineY(team.scores, {
            x: 'week',
            y: 'projected',
            stroke: team.color,
            strokeWidth: 2,
            strokeDasharray: '5 4',
          }),
          dot(
            team.scores.filter((score) => score.projected !== null),
            { x: 'week', y: 'projected', fill: team.color, r: 4 },
          ),
        ]),
        tooltip: {
          use: tooltip,
          format: (point) =>
            `${teams.find((team) => team.teamId === point.datum.teamId)?.teamName || 'Team'} · Week ${point.datum.week}\nActual: ${point.datum.actual.toFixed(1)} points${point.datum.projected === null ? '' : `\nLineup projection: ${point.datum.projected.toFixed(1)} points`}`,
        },
        scales: {
          x: { scale: scalePoint, axis: { label: 'Completed week' } },
          y: {
            scale: scaleLinear().domain([
              Math.min(0, ...scores.map((s) => s.actual)),
              Math.max(1, ...scores.flatMap((s) => [s.actual, s.projected ?? 0])) * 1.1,
            ]),
            axis: { label: 'Fantasy points' },
          },
        },
      }),
    [scores, teams, series],
  );
  return (
    <Box>
      <Flex gap={4} flexWrap="wrap" mb={4} aria-label="Team colors">
        {series.map((team) => (
          <Flex key={team.teamId} gap={2} align="center">
            <Box width="12px" height="12px" bg={team.color} rounded="full" aria-hidden="true" />
            {team.teamName}
          </Flex>
        ))}
      </Flex>
      <Text mb={4} className="chart-legend">
        <span>● Actual points</span>
        {scores.some((score) => score.projected !== null) && <span>┄ Lineup projection</span>}
      </Text>
      <Chart
        definition={definition}
        className="score-trend-chart"
        height={280}
        ariaLabel="Weekly actual fantasy points and available lineup projections. Exact values are in the table below."
      />
    </Box>
  );
}
