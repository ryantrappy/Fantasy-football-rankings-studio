import { fireEvent, render, screen, within } from '@testing-library/react';
import { HistoryAnalytics } from './HistoryAnalytics';
import { DataTable, ReportExportScope } from '../DataTable';
import { Provider } from '../ui/provider';
import { calculateInsights } from '../../server/insights/calculate';
import type { SeasonRecord } from '../../league-summary';

function season(year: number): SeasonRecord {
  const teams = ['Alex', 'Blair', 'Casey', 'Devon'].map((name, index) => ({
    teamId: `${year}-${index}`,
    managerKey: name.toLowerCase(),
    managerName: name,
    teamName: `${name}'s team`,
  }));
  return {
    year,
    data: calculateInsights({
      completedWeek: 4,
      playoffSettings: { regularSeasonEnd: 4, playoffTeams: 2 },
      teams,
      results: teams.map((team, index) => ({
        teamId: team.teamId,
        playoff: index < 2,
        finish: index + 1,
        champion: index === 0,
        lastPlace: index === 3,
      })),
      scores: Array.from({ length: 4 }, (_, index) => index + 1).flatMap((week) =>
        teams.map((team, index) => ({
          teamId: team.teamId,
          week,
          actual: 120 - index * 10 + week,
          projected: null,
          opponentTeamId: teams[index ^ 1].teamId,
          starters: [],
        })),
      ),
      moves: [],
      playerNames: {},
      notes: [],
      draftPickTrades: 0,
    }),
  };
}
const records = [season(2025), season(2024)];
const props = { records, years: [2025, 2024, 2023], leagueId: 'league' };
const renderExplorer = (extra: Partial<Parameters<typeof HistoryAnalytics>[0]> = {}) =>
  render(<HistoryAnalytics {...props} {...extra} />, { wrapper: Provider });

it('carries one manager through keyboard-accessible views and retains their controls', () => {
  renderExplorer();
  const competition = screen.getByRole('tab', { name: 'Competition' });
  expect(competition).toHaveAttribute('aria-selected', 'true');
  for (const tab of screen.getAllByRole('tab'))
    expect(document.getElementById(tab.getAttribute('aria-controls')!)).toBeInTheDocument();
  fireEvent.click(
    within(screen.getByRole('group', { name: 'Explore a manager' })).getByRole('button', {
      name: 'Blair',
    }),
  );
  expect(screen.getByRole('heading', { name: 'Blair', level: 2 })).toBeVisible();
  expect(document.querySelector('.history-explorer-stats')).toHaveTextContent('0–8–0');
  fireEvent.keyDown(competition, { key: 'ArrowRight' });
  const seasons = screen.getByRole('tab', { name: 'Season history' });
  expect(seasons).toHaveFocus();
  expect(screen.getByRole('table', { name: 'Manager season results' })).toHaveTextContent('0–4–0');
  fireEvent.keyDown(seasons, { key: 'ArrowRight' });
  const moments = screen.getByRole('tab', { name: 'Matchup stories' });
  expect(moments).toHaveFocus();
  expect(screen.queryByLabelText('Moments manager')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Moments season'), { target: { value: '2024' } });
  fireEvent.keyDown(moments, { key: 'End' });
  const profile = screen.getByRole('tab', { name: 'Manager profiles' });
  expect(profile).toHaveFocus();
  const activity = screen.getByRole('table', { name: 'Transactions per manager and season' });
  expect(activity).toHaveTextContent('Blair');
  expect(activity).not.toHaveTextContent('Alex');
  fireEvent.click(screen.getByLabelText('Show playful activity labels'));
  fireEvent.keyDown(profile, { key: 'Home' });
  expect(competition).toHaveFocus();
  fireEvent.click(moments);
  expect(screen.getByLabelText('Moments season')).toHaveValue('2024');
  fireEvent.click(profile);
  expect(screen.getByLabelText('Show playful activity labels')).toBeChecked();
});

it('keeps league records reachable one at a time and preserves record-book controls', () => {
  renderExplorer({
    leagueOverview: <p>League leaders</p>,
    comparison: <p>Paired manager comparison</p>,
  });
  fireEvent.click(screen.getByText('Browse the whole league archive', { exact: false }));
  fireEvent.click(screen.getByRole('button', { name: /League overview/ }));
  expect(screen.getByText('League leaders')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: /Matchup records/ }));
  expect(screen.getByText('League leaders')).not.toBeVisible();
  expect(screen.getByRole('table', { name: 'All-time scoring record book' })).toBeVisible();
  fireEvent.change(screen.getByLabelText('Record category'), { target: { value: 'individual' } });
  fireEvent.change(screen.getByLabelText('Search matchup records'), { target: { value: 'Blair' } });
  fireEvent.click(screen.getByRole('button', { name: /Competitive eras/ }));
  expect(
    screen.queryByRole('table', { name: 'All-time scoring record book' }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Matchup records/ }));
  expect(screen.getByLabelText('Record category')).toHaveValue('individual');
  expect(screen.getByLabelText('Search matchup records')).toHaveValue('Blair');
});

it('uses shared season links and keeps saved snapshots local', () => {
  const { rerender } = renderExplorer({ shared: true });
  expect(
    within(screen.getByRole('complementary', { name: 'Selected rivalry' })).getAllByRole('link')[0],
  ).toHaveAttribute('href', '/shared/insights?leagueId=league&year=2025');
  rerender(<HistoryAnalytics {...props} shared snapshot />);
  expect(
    within(screen.getByRole('complementary', { name: 'Selected rivalry' })).queryByRole('link'),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Season history' }));
  expect(
    within(screen.getByRole('table', { name: 'Manager season results' })).queryByRole('link'),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('tab', { name: 'Manager profiles' }));
  fireEvent.click(screen.getByRole('button', { name: 'Wrapped' }));
  expect(screen.queryByRole('button', { name: /share.*wrapped/i })).not.toBeInTheDocument();
});

it('automatically includes a former manager selected from the league matrix', () => {
  const include = vi.fn(),
    choose = vi.fn();
  renderExplorer({
    activeManagerKeys: ['alex', 'blair'],
    onIncludeFormerChange: include,
    onManagerChange: choose,
  });
  fireEvent.click(screen.getByRole('button', { name: 'League matrix' }));
  fireEvent.click(screen.getByRole('button', { name: /Inspect Casey versus Devon:/ }));
  expect(include).toHaveBeenCalledWith(true);
  expect(choose).toHaveBeenCalledWith('casey');
});

it('shows an explicit empty state without inventing manager results', () => {
  renderExplorer({ records: [] });
  expect(screen.getByText(/No managers are available/)).toBeVisible();
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  expect(screen.queryByText('0–0–0')).not.toBeInTheDocument();
});

it('shares the focused season across schedule, moments and both Wrapped scopes without narrowing aggregate history', () => {
  renderExplorer();
  fireEvent.click(screen.getByRole('button', { name: 'Schedule & luck' }));
  fireEvent.change(screen.getByLabelText('Schedule season'), { target: { value: '2024' } });
  fireEvent.click(screen.getByRole('tab', { name: 'Matchup stories' }));
  expect(screen.getByLabelText('Moments season')).toHaveValue('2024');
  fireEvent.click(screen.getByRole('tab', { name: 'Manager profiles' }));
  fireEvent.click(screen.getByRole('button', { name: 'Wrapped' }));
  expect(screen.getByLabelText('Wrapped season')).toHaveValue('2024');
  expect(screen.getByRole('heading', { name: "Alex's 2024 Fantasy Wrapped" })).toBeVisible();
  fireEvent.change(screen.getByLabelText('Recap scope'), { target: { value: 'league' } });
  expect(screen.getByRole('article', { name: 'Wrapped share preview' })).toHaveTextContent(
    'league',
  );
  fireEvent.change(screen.getByLabelText('Wrapped season'), { target: { value: '2025' } });
  fireEvent.click(screen.getByRole('tab', { name: 'Competition' }));
  expect(screen.getByLabelText('Schedule season')).toHaveValue('2025');
  expect(document.querySelector('.history-explorer-stats')).toHaveTextContent('8–0–0');
  fireEvent.click(screen.getByRole('button', { name: 'Whole league' }));
  expect(
    screen.getByRole('table', { name: 'Historical expected wins' }).querySelectorAll('tbody tr'),
  ).toHaveLength(8);
  fireEvent.click(screen.getByRole('tab', { name: 'Matchup stories' }));
  expect(screen.getByLabelText('Moments season')).toHaveValue('2025');
  fireEvent.change(screen.getByLabelText('Moments season'), { target: { value: '2023' } });
  expect(screen.getByRole('status')).toHaveTextContent('Season history unavailable');
});

it('keeps regular and final placements distinct and exposes achievement coverage and the existing comparison', () => {
  renderExplorer({ comparison: <h3>Existing manager comparison</h3> });
  fireEvent.click(screen.getByRole('tab', { name: 'Season history' }));
  const results = screen.getByRole('table', { name: 'Manager season results' });
  for (const name of [
    'Regular-season placement',
    'Final placement',
    'Playoffs',
    'Champion',
    'Last place',
  ])
    expect(within(results).getByRole('columnheader', { name: new RegExp(name) })).toBeVisible();
  const managers = within(screen.getByRole('group', { name: 'Explore a manager' }));
  fireEvent.click(managers.getByRole('button', { name: 'Blair' }));
  const seasonCells = within(within(results).getAllByRole('row')[1]).getAllByRole('cell');
  expect(seasonCells[4]).toHaveTextContent('3');
  expect(seasonCells[5]).toHaveTextContent('2');
  fireEvent.click(managers.getByRole('button', { name: 'Alex' }));
  fireEvent.click(screen.getByRole('button', { name: 'Achievements' }));
  const achievements = screen.getByRole('region', { name: 'Selected manager achievements' });
  expect(achievements).toHaveTextContent('Championships2');
  expect(achievements).toHaveTextContent('2 of 3 selected seasons with verified results');
  expect(results).not.toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Compare managers' }));
  expect(screen.getByRole('heading', { name: 'Existing manager comparison' })).toBeVisible();
});

it('keeps the detailed season table and CSV reachable without a manager and mounts one copy when managers return', () => {
  const seasonHistory = (
    <DataTable<{ year: number }>
      label="Manager season history"
      data={[]}
      getRowId={(row) => String(row.year)}
      columns={[
        { id: 'year', header: 'Season', value: (row) => row.year, cell: (row) => row.year },
      ]}
    />
  );
  const explorer = (available: boolean) => (
    <ReportExportScope
      value={{
        context: { League: 'League', Coverage: 'Partial history' },
        filenameContext: 'league-2025',
      }}
    >
      <HistoryAnalytics
        {...props}
        activeManagerKeys={available ? ['alex'] : []}
        seasonHistory={seasonHistory}
      />
    </ReportExportScope>
  );
  const { rerender, container } = render(explorer(false), { wrapper: Provider });
  expect(screen.getByText(/No managers are available/)).toBeVisible();
  expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  fireEvent.click(screen.getByText('Browse the whole league archive', { exact: false }));
  fireEvent.click(screen.getByRole('button', { name: /Detailed season metrics/ }));
  expect(screen.getByRole('table', { name: 'Manager season history' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Download Manager season history CSV' })).toBeVisible();
  expect(container.querySelectorAll('table[aria-label="Manager season history"]')).toHaveLength(1);
  rerender(explorer(true));
  fireEvent.click(screen.getByRole('tab', { name: 'Season history' }));
  fireEvent.click(screen.getByRole('button', { name: 'Detailed season metrics' }));
  expect(screen.getByRole('table', { name: 'Manager season history' })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Download Manager season history CSV' })).toBeVisible();
  expect(container.querySelectorAll('table[aria-label="Manager season history"]')).toHaveLength(1);
  expect(
    within(screen.getByRole('group', { name: 'League archive views' })).queryByRole('button', {
      name: /Detailed season metrics/,
    }),
  ).not.toBeInTheDocument();
});

it('populates evidence for every focused group and clears a rivalry from a previous manager', () => {
  renderExplorer();
  const rivalry = screen.getByRole('complementary', { name: 'Selected rivalry' });
  expect(rivalry).toHaveTextContent('Alex vs. Blair');
  fireEvent.click(screen.getByRole('button', { name: 'Inspect rivalry with Devon' }));
  expect(rivalry).toHaveTextContent('Alex vs. Devon');
  fireEvent.click(
    within(screen.getByRole('group', { name: 'Explore a manager' })).getByRole('button', {
      name: 'Casey',
    }),
  );
  expect(rivalry).toHaveTextContent('Casey vs. Devon');
  expect(rivalry).toHaveTextContent('8 verified meetings');
  for (const view of ['Schedule & luck', 'Elo ratings', 'Playoffs']) {
    fireEvent.click(screen.getByRole('button', { name: view }));
    expect(screen.getByRole('complementary', { name: 'Record evidence' })).toHaveTextContent(
      'Loaded source reports',
    );
  }
  fireEvent.click(screen.getByRole('tab', { name: 'Season history' }));
  expect(screen.getByRole('complementary', { name: 'Record evidence' })).toHaveTextContent(
    'Casey · 2025',
  );
  fireEvent.click(screen.getByRole('tab', { name: 'Matchup stories' }));
  expect(screen.getByRole('complementary', { name: 'Record evidence' })).toHaveTextContent(
    'Missing probabilities are never inferred',
  );
  fireEvent.click(screen.getByRole('tab', { name: 'Manager profiles' }));
  expect(screen.getByRole('complementary', { name: 'Record evidence' })).toHaveTextContent(
    'Casey · 2025 activity',
  );
});

it('keeps every former ownership group in the heatmap and adopts its inspected manager context', () => {
  const include = vi.fn(),
    choose = vi.fn();
  renderExplorer({
    activeManagerKeys: ['alex', 'blair'],
    onIncludeFormerChange: include,
    onManagerChange: choose,
  });
  fireEvent.click(screen.getByRole('button', { name: 'Matchup heatmap' }));
  const heatmap = within(screen.getByRole('table', { name: 'All-manager matchup heatmap' }));
  expect(heatmap.getAllByRole('rowheader')).toHaveLength(4);
  fireEvent.click(
    heatmap.getByRole('button', { name: /Inspect Casey versus Devon: 8-0-0 8 games/ }),
  );
  expect(include).toHaveBeenCalledWith(true);
  expect(choose).toHaveBeenCalledWith('casey');
});
