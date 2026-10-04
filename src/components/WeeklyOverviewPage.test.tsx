import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WeeklyOverviewPage } from './WeeklyOverviewPage';
import { Provider } from './ui/provider';
import { ApiContext } from '../auth/session';
import { loadWeeklyOverview } from '../weekly-overview';
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
function view() {
  return render(
    <Provider>
      <ApiContext value={{ managedTeam: {} } as never}>
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
