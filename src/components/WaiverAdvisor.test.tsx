import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from './ui/provider';
import { WaiverAdvisor } from './WaiverAdvisor';
it('loads on demand and compares read-only candidate/drop scenarios with coverage', async () => {
  const player = (id: string, points: number, starter = false) => ({
    id,
    name: id,
    projectedPoints: points,
    position: 'RB',
    lineupSlot: starter ? 'RB' : undefined,
    starter,
    points: null,
    locked: false,
    availability: null,
    bye: false,
  });
  const api = {
    get: vi
      .fn()
      .mockResolvedValue({
        week: 5,
        capturedAt: '2026-10-01',
        ownership: { covered: 10, expected: 10 },
        candidates: [player('Candidate', 20)],
        team: {
          teamId: '1',
          name: 'Me',
          score: null,
          players: [player('Starter', 10, true), player('Bench', 5)],
        },
        slots: ['RB'],
        notices: ['Waiver claim restrictions are not verified.'],
      }),
  };
  render(
    <Provider>
      <WaiverAdvisor api={api} leagueId="1" year={2026} />
    </Provider>,
  );
  expect(api.get).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Load / refresh available players' }));
  await screen.findByText(/Rosters 10\/10/);
  fireEvent.change(screen.getByLabelText('Unowned candidate'), { target: { value: 'Candidate' } });
  fireEvent.change(screen.getByLabelText('Hypothetical roster drop'), {
    target: { value: 'Bench' },
  });
  expect(screen.getByText(/\+10.00 points/)).toBeInTheDocument();
  expect(api.get).toHaveBeenCalledWith('1', 2026);
});
it('discloses unsupported coverage and allows retry after provider failure', async () => {
  const api = {
    get: vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({
        week: null,
        capturedAt: 'now',
        candidates: [],
        notices: [],
        unavailable: 'ESPN pool unsupported.',
      }),
  };
  render(
    <Provider>
      <WaiverAdvisor api={api} leagueId="1" year={2026} />
    </Provider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Load / refresh available players' }));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Load / refresh available players' }));
  await screen.findByText('ESPN pool unsupported.');
  expect(screen.queryByLabelText('Unowned candidate')).not.toBeInTheDocument();
});
