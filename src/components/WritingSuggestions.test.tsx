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
  providers: vi.fn().mockResolvedValue([{ id: 'codex', installed: true, enabled: true }]),
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
  expect(client.generate).toHaveBeenCalledWith({
    leagueId: '123',
    year: 2025,
    week: 2,
    teamId: '1',
    provider: 'codex',
    model: '',
    approved: true,
  });
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  expect(button).toBeDisabled();
});
it('keeps factual context when no CLI is enabled and prevents generation', async () => {
  const client = api();
  vi.mocked(client.providers).mockResolvedValue([{ id: 'codex', installed: true, enabled: false }]);
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
