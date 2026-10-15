import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MatchupHeatmap } from './MatchupHeatmap';
import { competitionGames } from '../../../history/competition/games';
import { season } from '../../../history/competition/fixtures.test-support';
import { Provider } from '../../ui/provider';
import { ReportExportScope } from '../../DataTable';

function renderHeatmap(records = [season()]) {
  const onInspect = vi.fn();
  const inputs = competitionGames(records);
  render(
    <MatchupHeatmap {...inputs} managerKey="a" opponentKey="b" minimum={3} onInspect={onInspect} />,
    { wrapper: Provider },
  );
  return {
    onInspect,
    table: within(screen.getByRole('table', { name: 'All-manager matchup heatmap' })),
  };
}

it('shows directional exact records, half-win ties, low samples and neutral missing/self cells', () => {
  const { table } = renderHeatmap();
  const winning = table.getByRole('button', {
    name: 'Inspect a versus b: 1-0-1 2 games · 75% Low sample; wins with ties counted half',
  });
  const losing = table.getByRole('button', {
    name: 'Inspect b versus a: 0-1-1 2 games · 25% Low sample; wins with ties counted half',
  });
  expect(winning).toHaveClass('history-heatmap-win');
  expect(losing).toHaveClass('history-heatmap-loss');
  expect(winning).toHaveTextContent('1-0-1 2 games · 75% Low sample');
  const unavailable = table.getByRole('button', {
    name: 'Inspect a versus c: Unavailable 0 games; no verified games',
  });
  expect(unavailable).toHaveClass('history-heatmap-unavailable');
  expect(unavailable).toHaveTextContent('Unavailable 0 games');
  expect(table.getAllByText('Same manager')).toHaveLength(4);
  expect(table.queryByRole('button', { name: /Inspect a versus a/ })).not.toBeInTheDocument();
  expect(screen.getByRole('list', { name: 'Matchup heatmap color legend' })).toHaveTextContent(
    'More winsBalanced (50%)More lossesNo verified games',
  );
});

it('shows an all-tie series as balanced rather than as wins or losses', () => {
  const { table } = renderHeatmap([season(2024, [[100, 100, 80, 80]])]);
  expect(
    table.getByRole('button', { name: /Inspect a versus b: 0-0-1 1 games · 50%/ }),
  ).toHaveClass('history-heatmap-balanced');
});

it('joins renamed ownership identities and distinguishes different groups with the same full name', () => {
  const older = season(2023);
  older.data.teams[0].managerName = 'Earlier name';
  const newer = season(2024);
  newer.data.teams[0].managerName = 'Alex Morgan';
  newer.data.teams[2].managerName = 'Alex Morgan';
  const { table } = renderHeatmap([older, newer]);
  expect(table.getAllByRole('row')).toHaveLength(5);
  expect(table.queryByText('Earlier name')).not.toBeInTheDocument();
  expect(table.getByRole('rowheader', { name: 'Alex Morgan (ownership group 1)' })).toBeVisible();
  expect(table.getByRole('rowheader', { name: 'Alex Morgan (ownership group 2)' })).toBeVisible();
  expect(
    table.getByRole('button', {
      name: /Inspect Alex Morgan \(ownership group 1\) versus b: 2-0-2 4 games · 75%/,
    }),
  ).toBeVisible();
  expect(
    table.getByRole('button', {
      name: 'Inspect Alex Morgan (ownership group 1) versus Alex Morgan (ownership group 2): Unavailable 0 games; no verified games',
    }),
  ).toBeVisible();
});

it('moves between non-self cells with the keyboard and activates exact pair evidence', async () => {
  const user = userEvent.setup();
  const { onInspect, table } = renderHeatmap();
  const first = table.getByRole('button', { name: /Inspect a versus b:/ });
  await user.click(first);
  await user.keyboard('{ArrowLeft}');
  expect(table.getByRole('button', { name: /Inspect a versus d:/ })).toHaveFocus();
  await user.keyboard('{ArrowDown}');
  const next = table.getByRole('button', { name: /Inspect b versus d:/ });
  expect(next).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(onInspect).toHaveBeenLastCalledWith('b', 'd');
  await user.keyboard('{Home}');
  expect(table.getByRole('button', { name: /Inspect b versus a:/ })).toHaveFocus();
  await user.keyboard(' ');
  expect(onInspect).toHaveBeenLastCalledWith('b', 'a');
  expect(
    table
      .getAllByRole('button')
      .filter(
        (button) => button.classList.contains('history-heatmap-cell') && button.tabIndex === 0,
      ),
  ).toHaveLength(1);
});

it('keeps context-aware heatmap CSV available with the actual table', () => {
  const inputs = competitionGames([season()]);
  render(
    <ReportExportScope
      value={{
        context: { League: 'Verified league', Seasons: '2024' },
        filenameContext: 'league-2024',
      }}
    >
      <MatchupHeatmap {...inputs} managerKey="a" opponentKey="b" minimum={3} onInspect={vi.fn()} />
    </ReportExportScope>,
    { wrapper: Provider },
  );
  expect(
    screen.getByRole('button', { name: 'Download All-manager matchup heatmap CSV' }),
  ).toBeVisible();
  // Actual downloaded bytes and safely escaped display names are covered by the browser regression.
});
