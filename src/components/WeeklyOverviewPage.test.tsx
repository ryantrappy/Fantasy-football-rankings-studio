import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { WeeklyOverviewPage } from './WeeklyOverviewPage';
import { Provider } from './ui/provider';
import { ApiContext } from '../auth/session';
import { loadWeeklyOverview, type WeeklyOverviewRow } from '../weekly-overview';
vi.mock('../weekly-overview', () => ({ loadWeeklyOverview: vi.fn() }));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, search, children }: { to: string; search?: object; children: React.ReactNode }) => (
    <a href={`${to}${search ? '?' + new URLSearchParams(search as Record<string, string>) : ''}`}>
      {children}
    </a>
  ),
}));
const row = {
  league: { leagueId: '1', leagueName: 'League', leagueType: 0 as const, seasonId: 2026 },
  week: 5,
  playoff: null,
  notices: ['Some projections unavailable.'],
  selection: {
    teamId: '10',
    teams: [{ teamId: '10', teamName: 'My team', managerName: 'Owner' }],
    needsReselection: false,
  },
};
beforeEach(() => {
  vi.mocked(loadWeeklyOverview).mockReset();
});
function view(api: unknown = { managedTeam: {} }) {
  return render(
    <Provider>
      <ApiContext value={api as never}>
        <WeeklyOverviewPage />
      </ApiContext>
    </Provider>,
  );
}
it('shows missing metrics and workflow links with preserved league/season/week and refreshes only on demand', async () => {
  vi.mocked(loadWeeklyOverview).mockResolvedValue([row]);
  view();
  await screen.findByRole('heading', { name: 'My team' });
  expect(screen.getByLabelText('Record for My team')).toBeInTheDocument();
  expect(screen.getByLabelText('Estimated playoff chance for My team')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Rankings' })).toHaveAttribute(
    'href',
    '/?leagueId=1&year=2026&week=5',
  );
  expect(screen.getByRole('link', { name: 'Season insights' })).toHaveAttribute(
    'href',
    '/insights?leagueId=1&year=2026',
  );
  expect(screen.getByText('Some projections unavailable.')).toBeInTheDocument();
  expect(loadWeeklyOverview).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Refresh overview' }));
  await waitFor(() => expect(loadWeeklyOverview).toHaveBeenCalledTimes(2));
});
it('provides setup actions for no leagues and unselected teams', async () => {
  vi.mocked(loadWeeklyOverview)
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([
      { ...row, selection: { teamId: null, teams: [], needsReselection: false } },
    ]);
  view();
  expect(await screen.findByRole('link', { name: 'Connect a league' })).toHaveAttribute(
    'href',
    '/leagues/new',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Refresh overview' }));
  expect(await screen.findByRole('link', { name: 'Choose my team' })).toHaveAttribute(
    'href',
    '/leagues/manage',
  );
});

function decisionRow(): WeeklyOverviewRow {
  const player = {
    id: 'starter',
    name: 'Starting Runner',
    position: 'RB',
    lineupSlot: 'RB',
    projectedPoints: 10,
    points: 8,
    starter: true,
    locked: false,
    owned: true,
    bye: false,
    availability: null,
    remainingFraction: 0,
  };
  return {
    ...row,
    rosterCapturedAt: new Date().toISOString(),
    lineupSlots: ['RB'],
    matchup: {
      id: 'game',
      home: {
        teamId: '20',
        name: 'Opponent',
        score: 100,
        players: [{ ...player, id: 'opponent' }],
      },
      away: {
        teamId: '10',
        name: 'My team',
        score: 90,
        players: [
          player,
          { ...player, id: 'bench', name: 'Bench Runner', starter: false, projectedPoints: 18 },
        ],
      },
    },
  };
}
function waiverPool(current: WeeklyOverviewRow) {
  return {
    capturedAt: new Date().toISOString(),
    week: current.week,
    team: current.matchup!.away!,
    slots: ['RB'],
    ownership: { covered: 2, expected: 2 },
    candidates: [
      {
        ...current.matchup!.away!.players[1],
        id: 'available',
        name: 'Available Runner',
        owned: false,
        projectedPoints: 22,
      },
    ],
    notices: ['Verify waiver claim restrictions.'],
  };
}
it('uses the real away-team win estimate and actual legal lineup/waiver gains in quick preview', async () => {
  const current = decisionRow();
  const pool = waiverPool(current);
  const api = { managedTeam: {}, waivers: { get: vi.fn().mockResolvedValue(pool) } };
  vi.mocked(loadWeeklyOverview).mockResolvedValue([current]);
  view(api);
  await screen.findByText('1 upgrade');
  expect(
    screen.getByLabelText('My team 0%; Opponent 100% uncalibrated win estimate'),
  ).toBeInTheDocument();
  expect(screen.getByText('Lineup advisor', { exact: true }).closest('summary')).toHaveTextContent(
    '+8.00 pts',
  );
  fireEvent.click(screen.getByText('Quick preview', { exact: true }));
  const preview = screen.getByRole('table', { name: 'Quick lineup & waiver preview' });
  expect(
    within(preview).getByRole('row', { name: /Starter changes Starting Runner Bench Runner/ }),
  ).toHaveTextContent('+8.00 pts');
  expect(within(preview).getByRole('row', { name: /Waiver upgrade/ })).toHaveTextContent(
    'Available Runner+4.00 pts',
  );
  expect(api.waivers.get).toHaveBeenCalledWith('1', 2026);
  expect(screen.getByRole('link', { name: 'Live matchups' })).toHaveAttribute(
    'href',
    '/live?leagueId=1&year=2026',
  );
});
it('does not label stale or partial waiver evidence as zero upgrades', async () => {
  const current = decisionRow();
  const stale = { ...waiverPool(current), capturedAt: '2000-01-01T00:00:00Z' };
  const api = { managedTeam: {}, waivers: { get: vi.fn().mockResolvedValue(stale) } };
  vi.mocked(loadWeeklyOverview).mockResolvedValue([current]);
  view(api);
  await waitFor(() => expect(api.waivers.get).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByText('Quick preview', { exact: true }));
  expect(
    await screen.findByText(/Fresh current-week managed-team\/ownership coverage unavailable/),
  ).toBeVisible();
  expect(screen.queryByText('0 upgrades')).not.toBeInTheDocument();
  expect(screen.queryByRole('row', { name: /Waiver upgrade/ })).not.toBeInTheDocument();
});
it('hides loaded cards immediately when the API identity changes and ignores delayed old waiver evidence', async () => {
  const current = decisionRow();
  let finish!: (pool: ReturnType<typeof waiverPool>) => void;
  const first = {
    subject: 'same-session',
    managedTeam: {},
    waivers: {
      get: vi.fn(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      ),
    },
  };
  const second = { subject: 'same-session', managedTeam: {} };
  vi.mocked(loadWeeklyOverview)
    .mockResolvedValueOnce([current])
    .mockImplementationOnce(() => new Promise(() => {}));
  const { rerender } = view(first);
  await waitFor(() => expect(finish).toBeDefined());
  rerender(
    <Provider>
      <ApiContext value={second as never}>
        <WeeklyOverviewPage />
      </ApiContext>
    </Provider>,
  );
  expect(screen.queryByRole('heading', { name: 'My team' })).not.toBeInTheDocument();
  await act(async () => finish(waiverPool(current)));
  expect(screen.queryByText('1 upgrade')).not.toBeInTheDocument();
});
it('bounds proactive waiver reads to three leagues at a time', async () => {
  const current = decisionRow();
  const rows = Array.from({ length: 5 }, (_, index) => ({
    ...current,
    league: { ...current.league, leagueId: String(index) },
  }));
  const finishes: ((pool: ReturnType<typeof waiverPool>) => void)[] = [];
  const api = {
    managedTeam: {},
    waivers: { get: vi.fn(() => new Promise((resolve) => finishes.push(resolve))) },
  };
  vi.mocked(loadWeeklyOverview).mockResolvedValue(rows);
  view(api);
  await waitFor(() => expect(api.waivers.get).toHaveBeenCalledTimes(3));
  await act(async () => {
    finishes.slice(0, 3).forEach((finish) => finish(waiverPool(current)));
  });
  await waitFor(() => expect(api.waivers.get).toHaveBeenCalledTimes(5));
  await act(async () => {
    finishes.slice(3).forEach((finish) => finish(waiverPool(current)));
  });
});
it('keeps partial projection coverage unavailable rather than claiming no waiver upgrades', async () => {
  const current = decisionRow();
  const pool = waiverPool(current);
  pool.candidates[0].projectedPoints = undefined as never;
  const api = { managedTeam: {}, waivers: { get: vi.fn().mockResolvedValue(pool) } };
  vi.mocked(loadWeeklyOverview).mockResolvedValue([current]);
  view(api);
  await waitFor(() => expect(api.waivers.get).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByText('Quick preview', { exact: true }));
  expect(
    await screen.findByText(/Complete waiver lineup\/projection comparison unavailable/),
  ).toBeVisible();
  expect(screen.queryByText('0 upgrades')).not.toBeInTheDocument();
});
