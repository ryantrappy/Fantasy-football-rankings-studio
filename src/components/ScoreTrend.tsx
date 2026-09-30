import { useMemo } from 'react';
import { defineChart, dot, lineY } from '@tanstack/charts';
import { Chart } from '@tanstack/charts/react';
import { decorative } from '@tanstack/charts/mark/decorative';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import { tooltip } from '@tanstack/charts/tooltip';
import type { ScoreWeek } from '../insights';

export function ScoreTrend({ scores }: { scores: ScoreWeek[] }) {
  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          decorative(lineY(scores, { x: 'week', y: 'actual', stroke: '#246747', strokeWidth: 3 })),
          dot(scores, { x: 'week', y: 'actual', fill: '#246747', r: 4 }),
          lineY(scores, {
            x: 'week',
            y: 'projected',
            stroke: '#8a531d',
            strokeWidth: 2,
            strokeDasharray: '5 4',
          }),
          dot(
            scores.filter((score) => score.projected !== null),
            { x: 'week', y: 'projected', fill: '#8a531d', r: 4 },
          ),
        ],
        tooltip: {
          use: tooltip,
          format: (point) =>
            `Week ${point.datum.week}\nActual: ${point.datum.actual.toFixed(1)} points${point.datum.projected === null ? '' : `\nLineup projection: ${point.datum.projected.toFixed(1)} points`}`,
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
    [scores],
  );
  return (
    <Chart
      definition={definition}
      className="score-trend-chart"
      height={280}
      ariaLabel="Weekly actual fantasy points and available lineup projections. Exact values are in the table below."
    />
  );
}
