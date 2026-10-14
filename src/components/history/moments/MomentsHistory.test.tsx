import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from '../../ui/provider';
import { MomentsHistory } from './MomentsHistory';
import { calculateInsights } from '../../../server/insights/calculate';
import type { SeasonRecord } from '../../../league-summary';

function season(year: number, teamId: string): SeasonRecord {
  const data = calculateInsights({
    completedWeek: 1,
    teams: [
      { teamId, teamName: 'A', managerName: 'Alex', managerKey: 'alex' },
      { teamId: 'opponent', teamName: 'B', managerName: 'Blair', managerKey: 'blair' },
    ],
    scores: [
      { teamId, opponentTeamId: 'opponent', week: 1, actual: 101, projected: null, starters: [] },
      {
        teamId: 'opponent',
        opponentTeamId: teamId,
        week: 1,
        actual: 100,
        projected: null,
        starters: [],
      },
    ],
    moves: [],
    playerNames: {},
    notes: [],
    draftPickTrades: 0,
  });
  data.matchupArchive = [
    {
      week: 1,
      teamId,
      opponentTeamId: 'opponent',
      source: 'Verified archive',
      preMondayAt: '2025-09-09T00:00:00.000Z',
      snapshots: [
        { capturedAt: '2025-09-09T00:00:00.000Z', probability: 0.05, contributors: [] },
        { capturedAt: '2025-09-09T04:00:00.000Z', probability: 1, contributors: [] },
      ],
    },
  ];
  return { year, data };
}

it('keeps shared manager focus across changing season team ids and shows one usable view', () => {
  render(
    <MomentsHistory
      records={[season(2025, 'new'), season(2024, 'old')]}
      years={[2025, 2024]}
      managerKey="alex"
    />,
    { wrapper: Provider },
  );
  expect(screen.queryByLabelText('Moments manager')).not.toBeInTheDocument();
  expect(screen.getByText(/Alex over Blair/)).toBeVisible();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Post-drop window')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Archive JSON')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Moments season'), { target: { value: '2024' } });
  expect(screen.getByText(/Alex over Blair/)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Dropped breakouts' }));
  expect(screen.getByRole('table', { name: 'Waiver graveyard — observed drops' })).toBeVisible();
  expect(screen.getByText(/Alex over Blair/)).not.toBeVisible();
  fireEvent.change(screen.getByLabelText('Post-drop window'), { target: { value: '6' } });
  fireEvent.click(screen.getByRole('button', { name: 'Trades' }));
  fireEvent.click(screen.getByRole('button', { name: 'Dropped breakouts' }));
  expect(screen.getByLabelText('Post-drop window')).toHaveValue('6');
});

it('does not show league-wide results when the focused manager is absent from a season', () => {
  render(<MomentsHistory records={[season(2025, 'new')]} years={[2025]} managerKey="missing" />, {
    wrapper: Provider,
  });
  expect(screen.getByRole('status')).toHaveTextContent('This manager has no team in this season');
  expect(screen.getByText(/Alex over Blair/)).not.toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Lineup regrets' }));
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

it('gives separate explorers unique subview control targets', () => {
  const records = [season(2025, 'new')];
  const { container } = render(
    <>
      <MomentsHistory records={records} years={[2025]} />
      <MomentsHistory records={records} years={[2025]} />
    </>,
    { wrapper: Provider },
  );
  const targets = [...container.querySelectorAll('button[aria-controls]')].map((button) =>
    button.getAttribute('aria-controls')!,
  );
  expect(new Set(targets).size).toBe(targets.length);
  for (const target of targets) expect(document.getElementById(target)).toBeInTheDocument();
});

it('falls back to a selected season when the previous year is removed', () => {
  const { rerender } = render(
    <MomentsHistory
      records={[season(2025, 'new'), season(2024, 'old')]}
      years={[2025, 2024]}
      managerKey="alex"
    />,
    { wrapper: Provider },
  );
  fireEvent.change(screen.getByLabelText('Moments season'), { target: { value: '2024' } });
  rerender(<MomentsHistory records={[season(2025, 'new')]} years={[2025]} managerKey="alex" />);
  expect(screen.getByLabelText('Moments season')).toHaveValue('2025');
  expect(screen.getByText(/Alex over Blair/)).toBeVisible();
});
