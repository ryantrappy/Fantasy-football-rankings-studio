import { fireEvent, render, screen, within } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { calculateInsights } from '../server/insights/calculate';
import { ProjectionLuck } from './ProjectionLuck';

function report() {
  return calculateInsights({
    completedWeek: 3,
    teams: ['a', 'b'].map((teamId) => ({
      teamId,
      teamName: `Team ${teamId}`,
      managerName: teamId,
    })),
    scores: [1, 2, 3].flatMap((week) =>
      ['a', 'b'].map((teamId) => {
        const actual = week === 3 ? (teamId === 'a' ? 20 : 5) : 10;
        return {
          teamId,
          week,
          actual,
          projected: null,
          opponentTeamId: teamId === 'a' ? 'b' : 'a',
          starters: [{ playerId: teamId, points: actual, projected: 10, position: 'RB' }],
        };
      }),
    ),
    playerNames: { a: 'Player Alpha', b: 'Player Beta' },
    moves: [],
    notes: [],
    draftPickTrades: 0,
  });
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('shows team and player evidence, orients matchups to the selected team and exports active filters', async () => {
  const data = report();
  let downloaded: Blob | undefined;
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn((blob: Blob) => {
      downloaded = blob;
      return 'blob:test';
    }),
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  const wrap = (teamId: string) => (
    <ChakraProvider value={defaultSystem}>
      <ProjectionLuck data={data} teamId={teamId} league="Test league" year={2025} />
    </ChakraProvider>
  );
  const view = render(wrap(''));
  expect(
    within(screen.getByRole('table', { name: 'Projection luck by team' })).getAllByRole('row'),
  ).toHaveLength(3);
  expect(screen.getByText(/may have been revised/)).toBeVisible();
  expect(screen.getAllByText(/Insufficient earlier-week/)).toHaveLength(1);
  const playerTable = screen.getByRole('table', { name: 'Player projection variance' });
  for (const heading of [
    'Weekly projection',
    'Actual points',
    'Difference',
    'Prior error variance (pts²)',
    'Prior observations',
    'Variance basis',
  ]) {
    expect(within(playerTable).getByRole('columnheader', { name: heading })).toBeInTheDocument();
  }
  view.rerender(wrap('b'));
  fireEvent.change(screen.getByRole('combobox', { name: 'Projection luck week' }), {
    target: { value: '3' },
  });
  const replays = screen.getByRole('table', { name: 'Projection matchup replays' });
  const row = within(replays).getAllByRole('row')[1];
  expect(within(row).getByRole('rowheader')).toHaveTextContent('Team b');
  expect(within(row).getByText('0–0–100')).toBeInTheDocument();
  expect(within(row).getByText('Loss')).toBeInTheDocument();
  expect(within(playerTable).getAllByRole('row')).toHaveLength(2);
  expect(within(playerTable).getByRole('rowheader')).toHaveTextContent('Player Beta');
  fireEvent.click(screen.getByRole('button', { name: 'Download Player projection variance CSV' }));
  const csv = await downloaded!.text();
  expect(csv).toContain('League,Test league');
  expect(csv).toContain('Season,2025');
  expect(csv).toContain('Team,Team b');
  expect(csv).toContain('Week,3');
  expect(csv).toContain('Player Beta,Team b,3,RB,10,5,-5,0,2,Player history');
  expect(csv).not.toContain('Player Alpha');
  expect(playerTable.parentElement).toHaveClass('insight-table-wrap');
});

it('keeps legacy reports readable with unavailable projections and replays', () => {
  const data = report();
  data.scores.forEach((s) => {
    delete s.starters[0].projected;
  });
  render(
    <ChakraProvider value={defaultSystem}>
      <ProjectionLuck data={data} teamId="a" league="Legacy" year={2025} />
    </ChakraProvider>,
  );
  expect(
    screen.getAllByText('Incomplete starter scores or weekly player projections.'),
  ).toHaveLength(3);
  const table = screen.getByRole('table', { name: 'Projection luck by team' });
  expect(within(table).getByText('0 / 3')).toBeInTheDocument();
  expect(within(table).getAllByText('—')).toHaveLength(5);
});
