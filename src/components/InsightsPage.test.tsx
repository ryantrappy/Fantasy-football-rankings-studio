import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { InsightsPage } from './InsightsPage';
import { ApiContext } from '../auth/session';
import { strengthData } from '../../tests/ui/SeasonStrengthPreview';

const { api } = vi.hoisted(() => ({
  api: { listLeagues: vi.fn(), getInsights: vi.fn(), getLeagueSeasons: vi.fn() },
}));
vi.mock('../auth/InsightsAccess', () => ({ useInsightsApi: () => api }));
vi.mock('./AppShell', () => ({
  HeaderControls: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock('./ShareReport', () => ({ ShareReport: () => null }));
vi.mock('./LeagueSummary', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./LeagueSummary')>()),
  LeagueSummary: () => null,
}));
vi.mock('@tanstack/charts/react', () => ({
  Chart: ({ ariaLabel }: { ariaLabel: string }) => <img alt={ariaLabel} />,
}));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

it('starts with focused team scoring and preserves exact weekly evidence and team selection across views', async () => {
  api.listLeagues.mockResolvedValue([
    { leagueId: 'one', leagueName: 'League', leagueType: 0, seasonId: 2026 },
  ]);
  api.getLeagueSeasons.mockResolvedValue({ activeManagerKeys: [], activeSeason: 2026 });
  api.getInsights.mockResolvedValue(strengthData);
  render(
    <ChakraProvider value={defaultSystem}>
      <InsightsPage search={{ leagueId: 'one', year: 2026 }} navigate={vi.fn()} />
    </ChakraProvider>,
  );
  const scoring = await screen.findByRole('table', { name: 'Team scoring' });
  expect(screen.getAllByRole('table')[0]).toBe(scoring);
  expect(screen.getAllByRole('table')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Team scoring' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Manager report card' }));
  expect(screen.getByRole('table', { name: 'Schedule luck' })).toBeVisible();
  expect(screen.getByLabelText('Include former managers in summary')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Weekly trends' }));
  const selector = screen.getByRole('combobox', { name: 'Team' });
  expect(selector).toHaveValue('');
  const legend = screen.getByLabelText('Team colors');
  strengthData.teams.forEach((team) =>
    expect(within(legend).getByText(team.teamName)).toBeInTheDocument(),
  );
  const weekly = screen.getByRole('table', { name: 'Weekly scores' });
  for (const name of [
    'Actual points',
    'Projected points',
    'Difference',
    'Best lineup',
    'Missed points',
    'Start accuracy',
    'Coverage',
  ])
    expect(within(weekly).getByRole('columnheader', { name })).toBeInTheDocument();
  expect(screen.getByText(/Historical lineup coverage:/)).toBeVisible();
  expect(within(weekly).getByRole('columnheader', { name: 'Team' })).toBeInTheDocument();
  expect(within(weekly).getAllByRole('row')).toHaveLength(strengthData.scores.length + 1);
  fireEvent.change(selector, { target: { value: strengthData.teams[0].teamId } });
  expect(
    within(screen.getByLabelText('Team colors')).getByText(strengthData.teams[0].teamName),
  ).toBeInTheDocument();
  expect(
    within(screen.getByLabelText('Team colors')).queryByText(strengthData.teams[1].teamName),
  ).not.toBeInTheDocument();
  expect(within(weekly).getAllByRole('row')).toHaveLength(
    strengthData.scores.filter((score) => score.teamId === strengthData.teams[0].teamId).length + 1,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Roster strength' }));
  fireEvent.click(screen.getByRole('button', { name: 'Projected remaining weeks' }));
  fireEvent.change(screen.getByLabelText('Sort roster charts by'), { target: { value: 'WR' } });
  expect(screen.getByRole('table', { name: 'Position group rankings' })).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Remaining schedule' }));
  expect(screen.getByRole('table', { name: 'Remaining schedule difficulty' })).toBeVisible();
  expect(screen.queryByRole('table', { name: 'Position group rankings' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Roster strength' }));
  expect(screen.getByLabelText('Sort roster charts by')).toHaveValue('WR');
  expect(screen.getByRole('button', { name: 'Projected remaining weeks' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  fireEvent.click(screen.getByRole('button', { name: 'Weekly trends' }));
  expect(selector).toHaveValue(strengthData.teams[0].teamId);
  expect(
    within(screen.getByRole('table', { name: 'Weekly scores' })).getAllByRole('row'),
  ).toHaveLength(5);
  fireEvent.click(screen.getByRole('button', { name: 'Trades' }));
  expect(screen.getByText('No completed player trades returned for this season.')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Pickups' }));
  expect(screen.getByLabelText('Filter pickups by team')).toHaveValue(strengthData.teams[0].teamId);
  expect(screen.getByText('No completed pickups returned for this selection.')).toBeVisible();
}, 15_000);

it('clears charts and managed-team identity while a new league report is pending', async () => {
  api.listLeagues.mockResolvedValue(
    ['one', 'two'].map((leagueId) => ({
      leagueId,
      leagueName: leagueId,
      leagueType: 0,
      seasonId: 2026,
    })),
  );
  api.getLeagueSeasons.mockResolvedValue({ activeManagerKeys: [], activeSeason: 2026 });
  api.getInsights.mockResolvedValueOnce(strengthData);
  let finishReport!: (value: typeof strengthData) => void;
  api.getInsights.mockReturnValueOnce(
    new Promise((resolve) => {
      finishReport = resolve;
    }),
  );
  let finishSelection!: (value: { teamId: string; needsReselection: boolean }) => void;
  const privateApi = {
    managedTeam: {
      get: vi
        .fn()
        .mockResolvedValueOnce({ teamId: '1', needsReselection: false })
        .mockReturnValueOnce(
          new Promise((resolve) => {
            finishSelection = resolve;
          }),
        ),
    },
  };
  const navigate = vi.fn();
  const wrap = (leagueId: string) => (
    <ChakraProvider value={defaultSystem}>
      <ApiContext value={privateApi as never}>
        <InsightsPage search={{ leagueId, year: 2026 }} navigate={navigate} />
      </ApiContext>
    </ChakraProvider>
  );
  const view = render(wrap('one'));
  await screen.findByRole('table', { name: 'Team scoring' });
  fireEvent.click(screen.getByRole('button', { name: 'Roster strength' }));
  await screen.findByRole('table', { name: 'Position group rankings' });
  await waitFor(() => expect(screen.getAllByText('Your team').length).toBeGreaterThan(0));
  view.rerender(wrap('two'));
  expect(screen.queryByRole('table', { name: 'Position group rankings' })).not.toBeInTheDocument();
  expect(screen.queryByText('Your team')).not.toBeInTheDocument();
  finishReport({ ...strengthData });
  await screen.findByRole('table', { name: 'Position group rankings' });
  expect(screen.queryByText('Your team')).not.toBeInTheDocument();
  finishSelection({ teamId: '2', needsReselection: false });
  await waitFor(() => expect(screen.getAllByText('Your team').length).toBeGreaterThan(0));
  expect(privateApi.managedTeam.get.mock.calls).toEqual([
    ['one', 2026],
    ['two', 2026],
  ]);
});

it('inspects scoring rows without changing views and keeps the inspector across every season view', async () => {
  api.listLeagues.mockResolvedValue([
    { leagueId: 'one', leagueName: 'League', leagueType: 0, seasonId: 2026 },
  ]);
  api.getLeagueSeasons.mockResolvedValue({ activeManagerKeys: [], activeSeason: 2026 });
  api.getInsights.mockResolvedValue(strengthData);
  render(
    <ChakraProvider value={defaultSystem}>
      <InsightsPage search={{ leagueId: 'one', year: 2026 }} navigate={vi.fn()} />
    </ChakraProvider>,
  );
  const table = await screen.findByRole('table', { name: 'Team scoring' });
  const team = strengthData.teams[2];
  fireEvent.click(within(table).getByRole('button', { name: team.teamName }));
  expect(screen.getByRole('button', { name: 'Team scoring' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const inspector = screen.getByRole('complementary', { name: 'Selected team inspector' });
  expect(inspector).toHaveTextContent(team.teamName);
  expect(inspector).toHaveTextContent(team.managerName);
  for (const view of [
    'Weekly trends',
    'Roster strength',
    'Remaining schedule',
    'Manager report card',
    'Trades',
    'Pickups',
    'Team scoring',
  ]) {
    fireEvent.click(screen.getByRole('button', { name: view }));
    expect(inspector).toBeVisible();
    expect(inspector).toHaveTextContent(team.teamName);
  }
  fireEvent.click(within(inspector).getByRole('button', { name: 'Open in Weekly trends' }));
  expect(screen.getByRole('button', { name: 'Weekly trends' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(
    within(screen.getByRole('table', { name: 'Weekly scores' })).getAllByRole('row'),
  ).toHaveLength(5);
});
