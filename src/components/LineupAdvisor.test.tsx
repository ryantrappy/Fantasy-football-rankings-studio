import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from './ui/provider';
import { LineupAdvisor } from './LineupAdvisor';
it('shows named swaps, stale/unknown-lock notices and read-only alternatives', () => {
  const team = {
    teamId: '1',
    name: 'Me',
    score: null,
    players: [
      {
        id: 'a',
        name: 'Starter',
        position: 'RB',
        lineupSlot: 'RB',
        projectedPoints: 10,
        points: null,
        starter: true,
      },
      { id: 'b', name: 'Bench', position: 'RB', projectedPoints: 20, points: null, starter: false },
    ],
  };
  render(
    <Provider>
      <LineupAdvisor team={team} slots={['RB']} capturedAt="2020-01-01T00:00:00Z" />
    </Provider>,
  );
  expect(screen.getByText(/Start: Bench/)).toBeInTheDocument();
  expect(screen.getByText(/Change: \+10.00/)).toBeInTheDocument();
  expect(screen.getByText(/Roster may be stale/)).toBeInTheDocument();
  expect(screen.getByText(/locks are unknown/)).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText('Exclude Bench'));
  expect(screen.queryByText(/Start: Bench/)).not.toBeInTheDocument();
  expect(screen.getByText(/Change: \+0.00/)).toBeInTheDocument();
  expect(team.players[0].starter).toBe(true);
  expect(team.players[1].starter).toBe(false);
});
