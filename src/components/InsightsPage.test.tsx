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
vi.mock('./LeagueSummary', () => ({ LeagueSummary: () => null }));
vi.mock('@tanstack/charts/react', () => ({
  Chart: ({ ariaLabel }: { ariaLabel: string }) => <img alt={ariaLabel} />,
}));
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

it('starts with league-wide trends and the scoring table, and can focus on one team', async () => {
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
  const selector = screen.getByRole('combobox', { name: 'Team', exact: true });
  expect(selector).toHaveValue('');
  const legend = screen.getByLabelText('Team colors');
  strengthData.teams.forEach((team) =>
    expect(within(legend).getByText(team.teamName)).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByText('View exact weekly scores'));
  const weekly = screen.getByRole('table', { name: 'Weekly scores' });
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
});

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
