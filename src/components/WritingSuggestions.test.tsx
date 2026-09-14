import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from './ui/provider';
import { WritingSuggestions } from './WritingSuggestions';
import type { WritingApi } from '../writing';
const api = (): WritingApi => ({
  context: vi.fn().mockResolvedValue({
    teamName: 'Team',
    year: 2025,
    throughWeek: 2,
    facts: ['100 points per week.'],
    depth: [],
    notes: [],
  }),
  providers: vi
    .fn()
    .mockResolvedValue([{ id: 'codex', installed: true, enabled: true, status: 'ready' }]),
  generate: vi.fn().mockResolvedValue('Discuss the scoring trend.'),
});
it('loads factual context on expansion and requires fresh consent for generation', async () => {
  const client = api();
  render(
    <Provider>
      <WritingSuggestions
        api={client}
        leagueId="123"
        year={2025}
        week={2}
        teams={[{ teamId: '1', teamName: 'Team', managerName: 'A', wins: 1, loss: 0, ties: 0 }]}
      />
    </Provider>,
  );
  expect(client.context).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Talking points for your rankings'));
  await screen.findByText('100 points per week.');
  const button = screen.getByRole('button', { name: 'Suggest talking points' });
  expect(button).toBeDisabled();
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(button);
  expect(await screen.findByLabelText('Suggested talking points')).toHaveValue(
    'Discuss the scoring trend.',
  );
  expect(client.generate).toHaveBeenCalledWith(
    {
      leagueId: '123',
      year: 2025,
      week: 2,
      teamId: '1',
      provider: 'codex',
      model: '',
      approved: true,
    },
    expect.any(AbortSignal),
  );
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  expect(button).toBeDisabled();
});
it('keeps factual context when no CLI is enabled and prevents generation', async () => {
  const client = api();
  vi.mocked(client.providers).mockResolvedValue([
    { id: 'codex', installed: true, enabled: false, status: 'not-enabled' },
  ]);
  render(
    <Provider>
      <WritingSuggestions
        api={client}
        leagueId="123"
        year={2025}
        week={2}
        teams={[{ teamId: '1', teamName: 'Team', managerName: 'A', wins: 1, loss: 0, ties: 0 }]}
      />
    </Provider>,
  );
  fireEvent.click(screen.getByText('Talking points for your rankings'));
  await screen.findByText('100 points per week.');
  await waitFor(() => expect(screen.getByRole('checkbox')).toBeDisabled());
  expect(client.generate).not.toHaveBeenCalled();
  expect(screen.getByText(/installed, but your account is not enabled/i)).toBeInTheDocument();
});
it.each([
  [
    { id: 'codex' as const, installed: false, enabled: false, status: 'not-installed' as const },
    /not installed in the application server environment/i,
  ],
  [
    {
      id: 'codex' as const,
      installed: true,
      enabled: true,
      status: 'login-check-failed' as const,
    },
    /installed and enabled, but its login check failed.*application service account/i,
  ],
])('explains unavailable provider setup without exposing CLI output', async (option, message) => {
  const client = api();
  vi.mocked(client.providers).mockResolvedValue([option]);
  render(
    <Provider>
      <WritingSuggestions
        api={client}
        leagueId="123"
        year={2025}
        week={2}
        teams={[{ teamId: '1', teamName: 'Team', managerName: 'A', wins: 1, loss: 0, ties: 0 }]}
      />
    </Provider>,
  );
  fireEvent.click(screen.getByText('Talking points for your rankings'));
  await screen.findByText(message);
  expect(screen.getByRole('checkbox')).toBeDisabled();
});
it('sanitizes a generation failure and gives the operator a next step', async () => {
  const client = api();
  vi.mocked(client.generate).mockRejectedValue(
    new Error('secret token and /private/server/path from raw CLI output'),
  );
  render(
    <Provider>
      <WritingSuggestions
        api={client}
        leagueId="123"
        year={2025}
        week={2}
        teams={[{ teamId: '1', teamName: 'Team', managerName: 'A', wins: 1, loss: 0, ties: 0 }]}
      />
    </Provider>,
  );
  fireEvent.click(screen.getByText('Talking points for your rankings'));
  await screen.findByText('100 points per week.');
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Suggest talking points' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    /verify the selected CLI login and model/i,
  );
  expect(screen.queryByText(/secret token|private\/server\/path/i)).not.toBeInTheDocument();
});
it('cancels a pending request and ignores its late response', async () => {
  const client = api();
  let finish!: (value: string) => void;
  vi.mocked(client.generate).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(
    <Provider>
      <WritingSuggestions
        api={client}
        leagueId="123"
        year={2025}
        week={2}
        teams={[{ teamId: '1', teamName: 'Team', managerName: 'A', wins: 1, loss: 0, ties: 0 }]}
      />
    </Provider>,
  );
  fireEvent.click(screen.getByText('Talking points for your rankings'));
  await screen.findByText('100 points per week.');
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Suggest talking points' }));
  expect(await screen.findByText('Generation request pending…')).toBeInTheDocument();
  const signal = vi.mocked(client.generate).mock.calls[0][1];
  fireEvent.click(screen.getByRole('button', { name: 'Cancel generation' }));
  expect(signal?.aborted).toBe(true);
  expect(screen.getByText('Cancellation requested…')).toBeInTheDocument();
  finish('Late suggestions must be ignored.');
  expect(await screen.findByText(/Request cancelled/i)).toBeInTheDocument();
  expect(screen.queryByText('Late suggestions must be ignored.')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Suggest talking points' })).toBeDisabled();
});
it('aborts generation when the selected team changes and cannot populate the new team', async () => {
  const client = api();
  let finish!: (value: string) => void;
  vi.mocked(client.generate).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(
    <Provider>
      <WritingSuggestions
        api={client}
        leagueId="123"
        year={2025}
        week={2}
        teams={['1', '2'].map((teamId) => ({
          teamId,
          teamName: `Team ${teamId}`,
          managerName: 'A',
          wins: 1,
          loss: 0,
          ties: 0,
        }))}
      />
    </Provider>,
  );
  fireEvent.click(screen.getByText('Talking points for your rankings'));
  await screen.findByText('100 points per week.');
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Suggest talking points' }));
  const signal = vi.mocked(client.generate).mock.calls[0][1];
  fireEvent.change(screen.getByLabelText('Team context'), { target: { value: '2' } });
  await waitFor(() => expect(signal?.aborted).toBe(true));
  finish('Old team response');
  await waitFor(() => expect(client.context).toHaveBeenCalledTimes(2));
  expect(screen.queryByText('Old team response')).not.toBeInTheDocument();
});
it('discards old context after the selected team changes', async () => {
  const client = api();
  let oldContext!: (value: Awaited<ReturnType<WritingApi['context']>>) => void;
  vi.mocked(client.context).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        oldContext = resolve;
      }),
  );
  render(
    <Provider>
      <WritingSuggestions
        api={client}
        leagueId="123"
        year={2025}
        week={2}
        teams={['1', '2'].map((teamId) => ({
          teamId,
          teamName: `Team ${teamId}`,
          managerName: 'A',
          wins: 1,
          loss: 0,
          ties: 0,
        }))}
      />
    </Provider>,
  );
  fireEvent.click(screen.getByText('Talking points for your rankings'));
  await waitFor(() => expect(client.context).toHaveBeenCalledTimes(1));
  fireEvent.change(screen.getByLabelText('Team context'), { target: { value: '2' } });
  await screen.findByText('100 points per week.');
  oldContext({
    teamName: 'Old team',
    year: 2025,
    throughWeek: 2,
    facts: ['Stale facts'],
    depth: [],
    notes: [],
  });
  await waitFor(() => expect(client.context).toHaveBeenCalledTimes(2));
  expect(screen.queryByText('Stale facts')).not.toBeInTheDocument();
});
