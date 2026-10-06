import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from './ui/provider';
import { ApiContext } from '../auth/session';
import { TradeAnalyzerPage } from './TradeAnalyzerPage';
import type { LiveLeague, LivePlayer } from '../live-matchups';
import type { ManagedTeamSelection } from '../types';

vi.mock('./PlayerProfileLink', () => ({
  PlayerProfileLink: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
const player = (
  id: string,
  name: string,
  position: string,
  projectedPoints: number,
): LivePlayer => ({
  id,
  name,
  position,
  projectedPoints,
  points: null,
  starter: false,
  owned: true,
  bye: false,
  locked: false,
  availability: null,
});
function snapshot(leagueId = '100', prefix = ''): LiveLeague {
  return {
    leagueId,
    leagueName: `${prefix}League`,
    provider: 'Sleeper',
    season: 2026,
    week: 5,
    capturedAt: '2026-10-06T15:00:00Z',
    lineupSlots: ['RB', 'WR'],
    matchups: [
      {
        id: 'm',
        home: {
          teamId: '1',
          name: `${prefix}One`,
          score: null,
          players: [
            player('101', `${prefix}Lead RB`, 'RB', 20),
            player('102', `${prefix}Depth RB`, 'RB', 18),
            player('103', `${prefix}Weak WR`, 'WR', 5),
          ],
        },
        away: {
          teamId: '2',
          name: `${prefix}Two`,
          score: null,
          players: [
            player('201', `${prefix}Lead WR`, 'WR', 22),
            {
              ...player('202', `${prefix}Depth WR`, 'WR', 17),
              projectionMethod: 'mean',
              projectionSources: [
                {
                  provider: 'ESPN',
                  playerId: '999',
                  points: 16,
                  capturedAt: '2026-10-06T14:00:00Z',
                },
                {
                  provider: 'Sleeper',
                  playerId: '202',
                  points: 18,
                  capturedAt: '2026-10-06T14:05:00Z',
                },
              ],
            },
            player('203', `${prefix}Weak RB`, 'RB', 6),
          ],
        },
      },
    ],
  };
}
const saved = (teamId: string | null = '1'): ManagedTeamSelection => ({
  teamId,
  needsReselection: false,
  teams: [
    { teamId: '1', teamName: 'One', managerName: 'A' },
    { teamId: '2', teamName: 'Two', managerName: 'B' },
  ],
});
function makeApi(leagues = [snapshot()], selection = saved()) {
  return {
    subject: 'owner',
    getLiveMatchups: vi.fn().mockResolvedValue(leagues),
    managedTeam: {
      get: vi.fn().mockResolvedValue(selection),
      set: vi.fn().mockImplementation(async (_id, _year, teamId) => saved(teamId)),
    },
  };
}
function tree(api: ReturnType<typeof makeApi>, search = {}) {
  return (
    <Provider>
      <ApiContext value={api as never}>
        <TradeAnalyzerPage search={search} />
      </ApiContext>
    </Provider>
  );
}
afterEach(() => window.localStorage.clear());

it('shows ranked exchanges, both lineup gains and coverage, sources, horizon and a prefilled scenario', async () => {
  const api = makeApi();
  render(tree(api));
  const first = await screen.findByRole('article', { name: 'Suggestion 1 with Two' });
  expect(first).toHaveTextContent('Send Depth RB · Receive Depth WR');
  expect(first).toHaveTextContent('One: +12.00');
  expect(first).toHaveTextContent('Two: +12.00');
  expect(first).toHaveTextContent('Position coverage before: RB 2 · WR 1');
  expect(first).toHaveTextContent('Position coverage after: RB 1 · WR 2');
  expect(first).toHaveTextContent('ESPN: 16.00 points · fetched 2026-10-06T14:00:00Z');
  expect(first).toHaveTextContent('Sleeper: 18.00 points · fetched 2026-10-06T14:05:00Z');
  const suggestions = screen.getByRole('region', { name: 'Trade suggestions' });
  expect(suggestions).toHaveTextContent('Week 5 only · 2026');
  expect(suggestions).toHaveTextContent('not rest-of-season trade values');
  expect(suggestions).toHaveTextContent('Active owned projection coverage: 6/6');
  expect(suggestions).toHaveTextContent(
    'does not predict the other manager’s willingness to accept',
  );
  fireEvent.click(within(first).getByRole('button', { name: 'Inspect trade with Two' }));
  expect(screen.getByLabelText('Send Depth RB')).toBeChecked();
  expect(screen.getByLabelText('Send Depth WR')).toBeChecked();
  expect(screen.getByLabelText('One lineup impact')).toHaveTextContent(
    'Before: 25.00 → After: 37.00',
  );
  expect(screen.getByLabelText('Two lineup impact')).toHaveTextContent(
    'Before: 28.00 → After: 40.00',
  );
  expect(api.managedTeam.set).not.toHaveBeenCalled();
  expect(api.getLiveMatchups).toHaveBeenCalledTimes(1);
  expect(api.managedTeam.get).toHaveBeenCalledWith('100', 2026, false);
});

it.each([saved(null), { ...saved(), needsReselection: true }, { ...saved(), teamId: 'missing' }])(
  'prompts missing or stale managed-team selection and saves only for the selected season',
  async (selection) => {
    const api = makeApi([snapshot()], selection);
    window.localStorage.setItem('managed-team-season:v1:["owner","100"]', '2025');
    render(tree(api));
    const select = await screen.findByLabelText('My managed team');
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('My team season')).not.toBeInTheDocument();
    fireEvent.change(select, { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save my team' }));
    await screen.findByRole('article', { name: 'Suggestion 1 with Two' });
    expect(api.managedTeam.set).toHaveBeenCalledWith('100', 2026, '1');
    expect(api.managedTeam.get.mock.calls.every((call) => call[1] === 2026)).toBe(true);
  },
);

it('does not generate trades from an unsaved or failed team choice', async () => {
  const api = makeApi([snapshot()], saved(null));
  api.managedTeam.set.mockRejectedValueOnce(new Error('Save failed'));
  render(tree(api));
  fireEvent.change(await screen.findByLabelText('My managed team'), { target: { value: '1' } });
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save my team' }));
  await screen.findByRole('alert');
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
});

it('clears the inspected scenario when the saved managed team changes', async () => {
  const api = makeApi();
  render(tree(api));
  const first = await screen.findByRole('article', { name: 'Suggestion 1 with Two' });
  fireEvent.click(within(first).getByRole('button'));
  fireEvent.click(screen.getByRole('button', { name: 'Change my team' }));
  fireEvent.change(await screen.findByLabelText('My managed team'), { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save my team' }));
  await screen.findByRole('heading', { name: 'Suggested trades for Two' });
  expect(screen.getByLabelText('Send Depth RB')).not.toBeChecked();
  expect(screen.getByLabelText('Send Depth WR')).not.toBeChecked();
  expect(screen.getByRole('article', { name: 'Suggestion 1 with One' })).toBeInTheDocument();
});

it('uses the requested owned scope and resets recommendations and scenarios across leagues and seasons', async () => {
  const api = makeApi([snapshot(), snapshot('200', 'Other ')]);
  render(tree(api, { leagueId: '200', year: 2026 }));
  const first = await screen.findByRole('article', { name: 'Suggestion 1 with Other Two' });
  expect(api.managedTeam.get).toHaveBeenCalledWith('200', 2026, false);
  fireEvent.click(within(first).getByRole('button'));
  fireEvent.change(screen.getByLabelText('Trade season'), { target: { value: '2025' } });
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Send Other Depth RB')).not.toBeInTheDocument();
  expect(screen.getByText(/unavailable for the selected season/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Trade league'), { target: { value: '100' } });
  await screen.findByRole('article', { name: 'Suggestion 1 with Two' });
  expect(screen.queryByRole('article', { name: /Other Two/ })).not.toBeInTheDocument();
  expect(screen.getByLabelText('Send Depth RB')).not.toBeChecked();
});

it('uses the remembered workspace scope only when it belongs to an owned league', async () => {
  window.localStorage.setItem(
    'studio-selection:v1:"owner"',
    JSON.stringify({ leagueId: '200', year: 2026, week: 5 }),
  );
  const api = makeApi([snapshot(), snapshot('200', 'Other ')]);
  const view = render(tree(api));
  await screen.findByRole('article', { name: 'Suggestion 1 with Other Two' });
  view.unmount();
  render(tree(api, { leagueId: 'unowned', year: 2025 }));
  await screen.findByRole('article', { name: 'Suggestion 1 with Two' });
  expect(api.managedTeam.get).not.toHaveBeenCalledWith(
    'unowned',
    expect.anything(),
    expect.anything(),
  );
});

it('ignores a delayed managed-team response after a league switch', async () => {
  const api = makeApi([snapshot(), snapshot('200', 'Other ')]);
  let resolve!: (selection: ManagedTeamSelection) => void;
  api.managedTeam.get.mockImplementation((id) =>
    id === '100'
      ? new Promise((done) => {
          resolve = done;
        })
      : Promise.resolve(saved()),
  );
  render(tree(api));
  await screen.findByText('Loading your managed team…');
  fireEvent.change(screen.getByLabelText('Trade league'), { target: { value: '200' } });
  await screen.findByRole('article', { name: 'Suggestion 1 with Other Two' });
  resolve(saved('2'));
  await waitFor(() =>
    expect(
      screen.getByRole('heading', { name: 'Suggested trades for Other One' }),
    ).toBeInTheDocument(),
  );
  expect(
    screen.queryByRole('heading', { name: 'Suggested trades for Two' }),
  ).not.toBeInTheDocument();
});

it('clears account-specific snapshots immediately on account change', async () => {
  const api = makeApi();
  const view = render(tree(api));
  const first = await screen.findByRole('article', { name: 'Suggestion 1 with Two' });
  fireEvent.click(within(first).getByRole('button'));
  const other = { ...makeApi([snapshot('200', 'Other ')]), subject: 'other-owner' };
  view.rerender(tree(other));
  expect(screen.queryByRole('article', { name: 'Suggestion 1 with Two' })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Send Depth RB')).not.toBeInTheDocument();
  await screen.findByRole('article', { name: 'Suggestion 1 with Other Two' });
});

it('shows empty, unavailable and provider-restricted results explicitly', async () => {
  const league = snapshot();
  league.lineupSlots = ['RB'];
  const api = makeApi([league]);
  render(tree(api));
  await screen.findByText(/No suitable one-for-one trades/);
  league.tradeRules = { deadlinePassed: true };
  fireEvent.click(screen.getByRole('button', { name: 'Refresh trade rosters' }));
  await screen.findByText(/trade deadline has passed/);
  expect(api.managedTeam.get).toHaveBeenLastCalledWith('100', 2026, true);
  expect(screen.queryByRole('article')).not.toBeInTheDocument();
  delete league.tradeRules;
  league.matchups[0].home.players[1].projectedPoints = undefined;
  fireEvent.click(screen.getByRole('button', { name: 'Refresh trade rosters' }));
  await screen.findByText(
    /Complete managed-team lineup, identity or projection coverage is unavailable/,
  );
});
