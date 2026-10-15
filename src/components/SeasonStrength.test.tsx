import { render, screen, fireEvent, within } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { SeasonStrength } from './SeasonStrength';
import { strengthData } from '../../tests/ui/SeasonStrengthPreview';

const { chartDefinition } = vi.hoisted(() => ({ chartDefinition: vi.fn() }));
vi.mock('@tanstack/charts/react', () => ({
  Chart: ({ ariaLabel, definition }: { ariaLabel: string; definition: unknown }) => {
    chartDefinition(definition);
    return <img alt={ariaLabel} />;
  },
}));
const wrap = (data = strengthData) => (
  <ChakraProvider value={defaultSystem}>
    <SeasonStrength data={data} managedTeamId="1" />
  </ChakraProvider>
);

it('shows exact position values, highlights the managed team, sorts and explains schedule sources', () => {
  render(wrap());
  fireEvent.click(screen.getByRole('button', { name: 'Projected remaining weeks' }));
  const ranks = screen.getByRole('table', { name: 'Position group rankings' });
  expect(
    within(ranks).queryByRole('columnheader', { name: 'Weeks covered' }),
  ).not.toBeInTheDocument();
  expect(
    within(screen.getByRole('table', { name: 'Remaining schedule difficulty' })).queryByRole(
      'columnheader',
      { name: 'Opponent weeks measured' },
    ),
  ).not.toBeInTheDocument();
  expect(within(ranks).getByText('The Underdogs with a very long team name')).toBeInTheDocument();
  expect(within(ranks).getByText('Your team')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Sort roster charts by'), { target: { value: 'WR' } });
  expect(
    within(screen.getByRole('table', { name: 'Position group rankings' })).getAllByRole('row')[1],
  ).toHaveTextContent('Fourth & Long');
  fireEvent.click(screen.getByText('Fourth & Long · Your team · week-by-week opponents'));
  const opponents = screen.getByRole('table', { name: 'Fourth & Long remaining opponents' });
  expect(within(opponents).getAllByText('Sleeper weekly lineup')).toHaveLength(6);
  expect(within(opponents).getAllByRole('row')).toHaveLength(7);
});

it('replaces projections with unavailable states for completed seasons and exposes fallback coverage', () => {
  const view = render(wrap());
  fireEvent.click(screen.getByRole('button', { name: 'Projected remaining weeks' }));
  const old = structuredClone(strengthData);
  delete old.playoffProjection;
  view.rerender(wrap(old));
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText(/Position projections are unavailable/)).toBeInTheDocument();
  fireEvent.click(screen.getByText('Fourth & Long · Your team · week-by-week opponents'));
  expect(
    within(screen.getByRole('table', { name: 'Fourth & Long remaining opponents' })).getAllByText(
      'Completed-score average',
    ),
  ).toHaveLength(6);
  old.completedWeek = 11;
  view.rerender(wrap({ ...old }));
  expect(screen.getByText(/The regular season is complete/)).toBeInTheDocument();
  expect(
    screen.queryByRole('table', { name: 'Remaining schedule difficulty' }),
  ).not.toBeInTheDocument();
});

it('defaults to completed-week starter points and switches to projections and back', () => {
  render(wrap());
  const completed = screen.getByRole('button', { name: 'Completed weeks only' });
  expect(completed).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('heading', { name: 'Completed-week scoring' })).toBeInTheDocument();
  expect(screen.getByRole('img')).toHaveAccessibleName(/Completed-week actual starter points/);
  expect(screen.getByText(/completed weeks 1, 2, 3, 4/)).toBeInTheDocument();
  const ranks = screen.getByRole('table', { name: 'Position group rankings' });
  expect(
    within(ranks).getByRole('columnheader', { name: /Total actual points/ }),
  ).toBeInTheDocument();
  expect(within(ranks).getByText('344')).toBeInTheDocument();
  expect(screen.getByRole('table', { name: 'Remaining schedule difficulty' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Projected remaining weeks' }));
  expect(completed).toHaveAttribute('aria-pressed', 'false');
  expect(screen.getByRole('img')).toHaveAccessibleName(/Roster projections by position/);
  expect(screen.getByRole('heading', { name: 'Roster projections' })).toBeInTheDocument();
  fireEvent.click(completed);
  expect(completed).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('heading', { name: 'Completed-week scoring' })).toBeInTheDocument();
});

it.each(['Sleeper', 'ESPN'] as const)(
  'shows saved %s next-week rankings when later projection weeks are empty',
  (provider) => {
    const data = structuredClone(strengthData);
    data.playoffProjection!.provider = provider;
    data.playoffProjection!.weekly!.slice(1).forEach((week) => {
      week.teamPoints = {};
      week.positionPoints = {};
    });
    render(wrap(data));
    fireEvent.click(screen.getByRole('button', { name: 'Projected remaining weeks' }));
    expect(screen.getByRole('img')).toHaveAccessibleName(/Roster projections by position/);
    expect(screen.getByRole('table', { name: 'Position group rankings' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Totals do not cover the full remaining season',
    );
    expect(screen.getByRole('columnheader', { name: 'Weeks covered' })).toBeInTheDocument();
    expect(
      screen.queryByText(/Position projections are unavailable for this report/),
    ).not.toBeInTheDocument();
  },
);

it('offers completed mode without forecasts and explains missing positions or no completed weeks', () => {
  const data = structuredClone(strengthData);
  delete data.playoffProjection;
  const view = render(wrap(data));
  expect(screen.getByRole('img')).toHaveAccessibleName(/Completed-week actual starter points/);
  data.scores.forEach((score) => score.starters.forEach((player) => delete player.position));
  view.rerender(wrap({ ...data }));
  expect(screen.getByText(/Completed-week position data is unavailable/)).toBeInTheDocument();
  data.completedWeek = 0;
  view.rerender(wrap({ ...data }));
  expect(screen.getByText(/No completed weeks yet/)).toBeInTheDocument();
});

it('counts a missing opening week even when every team is missing it', () => {
  const data = structuredClone(strengthData);
  data.scores = data.scores.filter((score) => score.week !== 1);
  render(wrap(data));
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  const coverage = screen.getByRole('table', { name: 'Completed-week position coverage' });
  expect(within(coverage).getAllByText('3 / 4')).toHaveLength(data.teams.length);
});

it('explains unknown legacy horizons and keeps completed rankings unavailable', () => {
  const data = structuredClone(strengthData);
  delete data.reportingStartWeek;
  render(wrap(data));
  expect(screen.getByRole('status')).toHaveTextContent('configured season start is unavailable');
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

it('uses fixed semantic rank tiers and retains rank, exact points and unavailable values', () => {
  const data = structuredClone(strengthData);
  for (const id of ['5', '6']) {
    data.teams.push({ ...data.teams[0], teamId: id, teamName: `Team ${id}` });
    data.scores.push(
      ...data.scores
        .filter((score) => score.teamId === '1')
        .map((score) => ({
          ...score,
          teamId: id,
          starters: score.starters.map((player) => ({ ...player, points: id === '5' ? 10 : 1 })),
        })),
    );
  }
  render(wrap(data));
  const table = screen.getByRole('table', { name: 'Position group rankings' });
  for (const [rank, tier] of [
    [1, 1],
    [2, 1],
    [3, 2],
    [4, 2],
    [5, 3],
    [6, 4],
  ]) {
    const cell = Array.from(table.querySelectorAll('.position-rank-cell')).find(
      (element) => element.querySelector('strong')?.textContent === `#${rank}`,
    );
    expect(cell).toHaveClass(`tier-${tier}`);
    expect(cell?.querySelector('small')).toHaveTextContent('pts');
  }
  expect(table).toHaveTextContent('-8 pts');
});

const axisDefinition = () =>
  chartDefinition.mock.lastCall![0] as {
    scales: { x: { scale: { domain: () => number[] }; axis: { ticks: { values: number[] } } } };
    margin: { right: number };
  };
const actualPoints = (points: Record<string, number>) => {
  const data = structuredClone(strengthData);
  data.completedWeek = 1;
  data.scores = data.scores
    .filter((score) => score.week === 1)
    .map((score) => ({
      ...score,
      starters: Object.entries(points).map(([position, points]) => ({
        playerId: `${score.teamId}-${position}`,
        position,
        points,
      })),
    }));
  return data;
};

describe.each(['completed', 'projected'] as const)('%s adaptive chart scale', (mode) => {
  it.each<{ label: string; points: Record<string, number>; domain: number[] }>([
    { label: 'positive', points: { QB: 500, WR: 218 }, domain: [0, 800] },
    {
      label: 'mixed with a tiny negative tail',
      points: { QB: 500, WR: 218, DEF: -8 },
      domain: [-8, 800],
    },
    { label: 'negative only', points: { QB: -500, WR: -218 }, domain: [-800, 0] },
    {
      label: 'offsetting positive and negative totals',
      points: { QB: 718, DEF: -700 },
      domain: [-700, 800],
    },
    { label: 'all zero', points: { QB: 0, DEF: 0 }, domain: [0, 1] },
    { label: 'tiny', points: { QB: 0.01 }, domain: [0, 0.01] },
    { label: 'large', points: { QB: 500000, WR: 218000 }, domain: [0, 800000] },
  ])(
    'fits $label stacks and keeps a zero baseline with useful finite ticks',
    ({ points, domain }) => {
      const data = actualPoints(points);
      if (mode === 'projected') {
        const week = {
          ...data.playoffProjection!.weekly![0],
          week: 2,
          positionPoints: Object.fromEntries(
            data.teams.map((team) => [team.teamId, { ...points }]),
          ),
          teamPoints: Object.fromEntries(
            data.teams.map((team) => [
              team.teamId,
              Object.values(points).reduce((sum, value) => sum + value, 0),
            ]),
          ),
        };
        data.playoffProjection = { ...data.playoffProjection!, ...week, weekly: [week] };
      }
      render(wrap(data));
      if (mode === 'projected')
        fireEvent.click(screen.getByRole('button', { name: 'Projected remaining weeks' }));
      const axis = axisDefinition().scales.x;
      expect(axis.scale.domain()).toEqual(domain);
      const ticks = axis.axis.ticks.values;
      expect(ticks).toContain(0);
      expect(ticks.length).toBeGreaterThanOrEqual(3);
      expect(ticks.length).toBeLessThanOrEqual(8);
      expect(ticks.every(Number.isFinite)).toBe(true);
      expect(ticks.every((value, index) => index === 0 || value > ticks[index - 1])).toBe(true);
      expect(screen.getByRole('table', { name: 'Position group rankings' })).toHaveTextContent(
        'pts',
      );
    },
  );
});

it('recomputes bounds across completed/projected modes and changed league report data', () => {
  const view = render(wrap());
  expect(axisDefinition().scales.x.scale.domain()).toEqual([-8, 400]);
  fireEvent.click(screen.getByRole('button', { name: 'Projected remaining weeks' }));
  expect(axisDefinition().scales.x.scale.domain()).toEqual([0, 1000]);
  const larger = structuredClone(strengthData);
  larger.playoffProjection!.weekly!.forEach((week) => {
    for (const points of Object.values(week.positionPoints!))
      for (const position of Object.keys(points)) points[position] *= 10;
    for (const team of Object.keys(week.teamPoints)) week.teamPoints[team] *= 10;
  });
  view.rerender(wrap(larger));
  expect(axisDefinition().scales.x.scale.domain()).toEqual([0, 10000]);
  fireEvent.click(screen.getByRole('button', { name: 'Completed weeks only' }));
  expect(axisDefinition().scales.x.scale.domain()).toEqual([-8, 400]);
  view.rerender(wrap(actualPoints({ QB: 718 })));
  expect(axisDefinition().scales.x.scale.domain()).toEqual([0, 800]);
});

it('reserves enough pixel margin for large total labels without padding the data range', () => {
  render(wrap(actualPoints({ QB: 7180000000000 })));
  expect(axisDefinition().scales.x.scale.domain()).toEqual([0, 8000000000000]);
  expect(axisDefinition().margin.right).toBeGreaterThan(100);
  expect(screen.getByRole('table', { name: 'Position group rankings' })).toHaveTextContent(
    '7,180,000,000,000',
  );
});

it('keeps missing and nonfinite starter points unavailable instead of drawing zero charts', () => {
  const missing = actualPoints({ QB: Number.NaN });
  const view = render(wrap(missing));
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText(/Completed-week position data is unavailable/)).toBeVisible();
  const noProjection = structuredClone(strengthData);
  delete noProjection.playoffProjection;
  view.rerender(wrap(noProjection));
  fireEvent.click(screen.getByRole('button', { name: 'Projected remaining weeks' }));
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  expect(screen.getByText(/Position projections are unavailable/)).toBeVisible();
});
