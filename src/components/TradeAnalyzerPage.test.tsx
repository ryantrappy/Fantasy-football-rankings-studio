import { fireEvent, render, screen, within } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ApiContext } from '../auth/session';
import { TradeAnalyzerPage } from './TradeAnalyzerPage';
async function setup() {
  const player = (id: string, projectedPoints: number) => ({
    id,
    name: id,
    position: 'RB',
    lineupSlot: 'RB',
    projectedPoints,
    starter: true,
    points: null,
    owned: true,
    locked: false,
    availability: null,
    bye: false,
  });
  const api = {
    getLiveMatchups: vi.fn().mockResolvedValue([
      {
        leagueId: '1',
        leagueName: 'League',
        season: 2026,
        week: 5,
        provider: 'Sleeper',
        capturedAt: '2026-10-01',
        lineupSlots: ['RB'],
        matchups: [
          {
            id: '1',
            home: {
              teamId: '1',
              name: 'One',
              score: null,
              players: [
                player('A', 10),
                player('C', 5),
                { ...player('Locked', 1), locked: true, starter: false, lineupSlot: undefined },
              ],
            },
            away: { teamId: '2', name: 'Two', score: null, players: [player('B', 20)] },
          },
          {
            id: '2',
            home: { teamId: '3', name: 'Three', score: null, players: [player('D', 15)] },
            away: null,
          },
        ],
      },
    ]),
  };
  render(
    <Provider>
      <ApiContext value={api as never}>
        <TradeAnalyzerPage />
      </ApiContext>
    </Provider>,
  );
  await screen.findByLabelText('Send A');
  return api;
}

it('shows both lineup impacts and receiving players without drop controls', async () => {
  const api = await setup();
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.queryByLabelText(/Drop/)).not.toBeInTheDocument();
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Send Locked')).toBeDisabled();
  expect(screen.getByText(/Game locked/)).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Send C'));
  fireEvent.click(screen.getByLabelText('Send B'));
  const one = screen.getByRole('region', { name: 'Trade team 1' });
  const two = screen.getByRole('region', { name: 'Trade team 2' });
  expect(within(one).getByLabelText('One lineup impact')).toHaveTextContent('+10.00');
  expect(within(one).getByText('Before: 10.00 → After: 20.00')).toBeInTheDocument();
  expect(within(two).getByText('Before: 20.00 → After: 5.00')).toBeInTheDocument();
  expect(within(two).getByLabelText('Two lineup impact')).toHaveTextContent('-15.00');
  expect(within(one).getByLabelText('One exchange')).toHaveTextContent('Receiving · 1 playerB');
  expect(api.getLiveMatchups).toHaveBeenCalledTimes(1);
});

it('keeps selected players visible while searching and supports removing and clearing them', async () => {
  await setup();
  fireEvent.click(screen.getByLabelText('Send A'));
  const one = screen.getByRole('region', { name: 'Trade team 1' });
  fireEvent.change(within(one).getByLabelText('Find a player'), { target: { value: 'C' } });
  expect(screen.queryByLabelText('Send A')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Remove A from trade' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Remove A from trade' }));
  expect(screen.getByRole('button', { name: 'Clear trade' })).toBeDisabled();
  fireEvent.change(within(one).getByLabelText('Find a player'), { target: { value: 'RB' } });
  fireEvent.click(screen.getByLabelText('Send A'));
  fireEvent.click(screen.getByRole('button', { name: 'Clear trade' }));
  expect(screen.getByLabelText('Send A')).not.toBeChecked();
  fireEvent.change(within(one).getByLabelText('Find a player'), { target: { value: 'missing' } });
  expect(screen.getByText('No players match your search.')).toBeInTheDocument();
});

it('only asks for roster space on uneven trades and clears stale selections and assumptions', async () => {
  await setup();
  fireEvent.click(screen.getByLabelText('Send A'));
  fireEvent.click(screen.getByLabelText('Send C'));
  fireEvent.click(screen.getByLabelText('Send B'));
  const slots = screen.getByLabelText('Available open roster slots for Two');
  const confirm = screen.getByLabelText(/I confirm this roster space/);
  fireEvent.click(confirm);
  expect(screen.getByRole('status')).toHaveTextContent('Two needs 1 open roster slot');
  fireEvent.change(slots, { target: { value: '1' } });
  expect(confirm).not.toBeChecked();
  fireEvent.click(confirm);
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Two lineup impact')).toHaveTextContent('Active roster: 2');
  fireEvent.click(screen.getByLabelText('Send C'));
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Send C'));
  expect(screen.getByLabelText(/I confirm this roster space/)).not.toBeChecked();
  expect(
    within(screen.getByLabelText('Trade team 1', { selector: 'select' })).getByRole('option', {
      name: 'Two',
    }),
  ).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Trade team 2', { selector: 'select' }), {
    target: { value: '3' },
  });
  expect(screen.getByLabelText('Send A')).not.toBeChecked();
  expect(screen.getByLabelText('Send D')).not.toBeChecked();
  expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Send A'));
  fireEvent.click(screen.getByLabelText('Send C'));
  fireEvent.click(screen.getByLabelText('Send D'));
  expect(screen.getByLabelText('Available open roster slots for Three')).toHaveValue(0);
});

vi.mock('./PlayerProfileLink', () => ({
  PlayerProfileLink: ({
    leagueId,
    year,
    playerId,
    children,
  }: {
    leagueId: string;
    year: number;
    playerId: string;
    children: React.ReactNode;
  }) => <a href={`/players?leagueId=${leagueId}&year=${year}&playerId=${playerId}`}>{children}</a>,
}));
