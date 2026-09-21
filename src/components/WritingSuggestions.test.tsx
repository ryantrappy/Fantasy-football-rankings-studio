import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from './ui/provider';
import { WritingSuggestions } from './WritingSuggestions';
import type { WritingApi } from '../writing';

function api(): WritingApi {
  return {
    context: vi.fn(),
    providers: vi
      .fn()
      .mockResolvedValue([{ id: 'codex', installed: true, enabled: true, status: 'ready' }]),
    generate: vi.fn().mockImplementation(({ teamId }) => Promise.resolve(`Summary ${teamId}`)),
  };
}

function renderSuggestions(client: WritingApi, onSummaryChange = vi.fn()) {
  render(
    <Provider>
      <WritingSuggestions
        api={client}
        leagueId="123"
        year={2025}
        week={2}
        onSummaryChange={onSummaryChange}
        onControllerChange={vi.fn()}
        onGenerationStateChange={vi.fn()}
      />
    </Provider>,
  );
  return onSummaryChange;
}

it('asks for one approval, hides it, and exposes per-team generation', async () => {
  const client = api();
  const onSummaryChange = vi.fn();
  let controller!: { generate: (teamId: string) => Promise<void> };
  render(
    <Provider>
      <WritingSuggestions
        api={client}
        leagueId="123"
        year={2025}
        week={2}
        onSummaryChange={onSummaryChange}
        onControllerChange={(value) => {
          controller = value;
        }}
        onGenerationStateChange={vi.fn()}
      />
    </Provider>,
  );
  await waitFor(() => expect(client.providers).toHaveBeenCalled());
  const approval = screen.getByRole('checkbox');
  fireEvent.click(approval);
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  await controller.generate('1');
  expect(client.generate).toHaveBeenCalledWith(
    expect.objectContaining({ teamId: '1', approved: true }),
    expect.any(AbortSignal),
  );
  expect(onSummaryChange).toHaveBeenCalledWith('1', expect.any(String));
});

it('requires approval again when the provider changes', async () => {
  const client = api();
  vi.mocked(client.providers).mockResolvedValue([
    { id: 'codex', installed: true, enabled: true, status: 'ready' },
    { id: 'claude', installed: true, enabled: true, status: 'ready' },
  ]);
  renderSuggestions(client);
  await waitFor(() => expect(screen.getByRole('option', { name: /Claude/ })).toBeInTheDocument());
  fireEvent.click(screen.getByRole('checkbox'));
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Writing assistant'), { target: { value: 'claude' } });
  expect(screen.getByRole('checkbox')).toBeInTheDocument();
});

it('cancels generation without exposing the partial result as an error', async () => {
  const client = api();
  let reject!: (reason?: unknown) => void;
  let controller!: { generate: (teamId: string) => Promise<void> };
  vi.mocked(client.generate).mockReturnValueOnce(
    new Promise((_resolve, rejectPromise) => {
      reject = rejectPromise;
    }),
  );
  render(
    <Provider>
      <WritingSuggestions
        api={client}
        leagueId="123"
        year={2025}
        week={2}
        onSummaryChange={vi.fn()}
        onControllerChange={(value) => {
          controller = value;
        }}
        onGenerationStateChange={vi.fn()}
      />
    </Provider>,
  );
  await waitFor(() => expect(client.providers).toHaveBeenCalled());
  fireEvent.click(screen.getByRole('checkbox'));
  void controller.generate('1');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel generation' })).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Cancel generation' }));
  reject(new DOMException('Cancelled', 'AbortError'));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
});
