import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from './ui/provider';
import { RosterRiskAlerts } from './RosterRiskAlerts';
vi.mock('./PlayerProfileLink', () => ({
  PlayerProfileLink: ({ children }: { children: React.ReactNode }) => (
    <a href="/players">{children}</a>
  ),
}));
it('dismisses and restores team conditions without sharing another account’s preferences', () => {
  const values = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    },
  });
  const props = {
    team: {
      teamId: '1',
      name: 'Me',
      score: null,
      players: [
        {
          id: 'a',
          name: 'Starter',
          points: null,
          starter: true,
          projectedPoints: 10,
          availability: 'OUT',
          bye: false,
          locked: false,
        },
      ],
    },
    leagueId: '10',
    year: 2026,
    week: 5,
    capturedAt: new Date().toISOString(),
    slots: ['RB'],
  };
  const view = (subject: string) => (
    <Provider>
      <RosterRiskAlerts key={subject} {...props} subject={subject} />
    </Provider>
  );
  const { rerender } = render(view('owner-a'));
  expect(screen.getByText(/confirmed OUT/)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Review lineup' })).toHaveAttribute('href', '#lineup-10');
  fireEvent.click(screen.getByRole('button', { name: /Dismiss Starter/ }));
  expect(screen.queryByText(/confirmed OUT/)).not.toBeInTheDocument();
  rerender(view('owner-b'));
  expect(screen.getByText(/confirmed OUT/)).toBeInTheDocument();
  rerender(view('owner-a'));
  expect(screen.queryByText(/confirmed OUT/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Show dismissed risks for this team' }));
  expect(screen.getByText(/confirmed OUT/)).toBeInTheDocument();
});

it('downgrades stale conditions as time passes without a new provider snapshot', () => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date('2026-10-01T12:00:00Z'));
    render(
      <Provider>
        <RosterRiskAlerts
          team={{
            teamId: '1',
            name: 'Me',
            score: null,
            players: [
              {
                id: 'a',
                name: 'Starter',
                points: null,
                starter: true,
                projectedPoints: 10,
                availability: 'OUT',
                bye: false,
                locked: false,
              },
            ],
          }}
          leagueId="10"
          year={2026}
          week={5}
          capturedAt="2026-10-01T12:00:00Z"
          slots={['RB']}
        />
      </Provider>,
    );
    expect(screen.getByText(/confirmed OUT/)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(6 * 60_000));
    expect(screen.queryByText(/confirmed OUT/)).not.toBeInTheDocument();
    expect(screen.getByText(/inputs are stale/)).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});
