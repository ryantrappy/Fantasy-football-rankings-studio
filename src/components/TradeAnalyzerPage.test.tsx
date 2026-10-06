import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    listLeagues: vi
      .fn()
      .mockResolvedValue([{ leagueId: '1', leagueName: 'League', seasonId: 2026, leagueType: 0 }]),
    getLiveMatchups: vi.fn(),
    getLiveLeague: vi.fn().mockResolvedValue({
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
    }),
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
  expect(screen.getByLabelText('Send Locked')).toBeEnabled();
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
  expect(api.getLiveLeague).toHaveBeenCalledTimes(1);
  expect(api.getLiveLeague).toHaveBeenCalledWith('1', false);
  expect(api.getLiveMatchups).not.toHaveBeenCalled();
});

it('allows league switching during a delayed scoped read and ignores the replaced response', async () => {
  const api = await setup();
  const current = await api.getLiveLeague.mock.results[0].value;
  api.listLeagues.mockResolvedValue([
    { leagueId: '1', leagueName: 'League', seasonId: 2026, leagueType: 0 },
    { leagueId: '2', leagueName: 'Slow league', seasonId: 2026, leagueType: 1 },
  ]);
  let finish!: (value: any) => void;
  api.getLiveLeague.mockImplementation(async (id: string) =>
    id === '1'
      ? current
      : new Promise((resolve) => {
          finish = resolve;
        }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh trade rosters' }));
  await screen.findByRole('option', { name: 'Slow league' });
  await screen.findByLabelText('Send A');
  fireEvent.change(screen.getByLabelText('Trade league'), { target: { value: '2' } });
  await waitFor(() => expect(api.getLiveLeague).toHaveBeenLastCalledWith('2', false));
  expect(screen.getByRole('status')).toHaveTextContent('Loading rosters');
  fireEvent.change(screen.getByLabelText('Trade league'), { target: { value: '1' } });
  await screen.findByLabelText('Send A');
  await act(async () => finish({ ...current, leagueId: '2', error: 'Slow provider failed' }));
  expect(screen.getByLabelText('Trade league')).toHaveValue('1');
  expect(screen.queryByText('Slow provider failed')).not.toBeInTheDocument();
  expect(api.getLiveMatchups).not.toHaveBeenCalled();
});

it('allows selecting and removing players whose games are locked', async () => {
  await setup();
  fireEvent.click(screen.getByLabelText('Send Locked'));
  expect(screen.getByLabelText('Send Locked')).toBeChecked();
  fireEvent.click(screen.getByLabelText('Send B'));
  expect(screen.getByLabelText('One lineup impact')).toHaveTextContent('+10.00');
  expect(screen.getByLabelText('Two lineup impact')).toHaveTextContent('-19.00');
  fireEvent.click(screen.getByRole('button', { name: 'Remove Locked from trade' }));
  expect(screen.getByLabelText('Send Locked')).not.toBeChecked();
});

it('hides stale trade rosters when refreshed league ownership cannot be loaded and recovers on retry', async () => {
  const api = await setup();
  api.listLeagues.mockRejectedValueOnce(new Error('Offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Refresh trade rosters' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Trade roster data is unavailable');
  expect(screen.queryByLabelText('Send A')).not.toBeInTheDocument();
  const current = await api.getLiveLeague.mock.results[0].value;
  let finish!: (value: typeof current) => void;
  api.getLiveLeague.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh trade rosters' }));
  await waitFor(() => expect(finish).toBeDefined());
  expect(screen.queryByLabelText('Send A')).not.toBeInTheDocument();
  await act(async () => finish(current));
  await waitFor(() => {
    expect(screen.getByLabelText('Send A')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
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
