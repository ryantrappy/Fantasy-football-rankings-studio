import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from './ui/provider';
import { WritingSuggestions } from './WritingSuggestions';
import type { WritingApi } from '../writing';

function api(): WritingApi {
  return {
    context: vi.fn(),
    instructions: vi.fn().mockResolvedValue({ instructions: '' }),
    saveInstructions: vi.fn().mockImplementation((data) => Promise.resolve(data)),
    consent: vi.fn().mockResolvedValue({ codex: false, claude: false }),
    saveConsent: vi
      .fn()
      .mockImplementation(({ provider, approved }) =>
        Promise.resolve({ codex: false, claude: false, [provider]: approved }),
      ),
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

it('opens local operator setup in the rankings assistant without changing approval or generating', async () => {
  const client = api();
  renderSuggestions(client);
  await waitFor(() => expect(client.providers).toHaveBeenCalled());
  const setup = screen.getByText('Operator Codex setup instructions');
  expect(setup.tagName).toBe('SUMMARY');
  fireEvent.click(setup);
  expect(setup.closest('details')).toHaveAttribute('open');
  expect(screen.getByText(/login --device-auth/)).toBeVisible();
  expect(screen.getByText(/Authorized users share the operator/)).toBeVisible();
  expect(screen.queryByRole('link', { name: 'Operator Codex setup instructions' })).toBeNull();
  expect(screen.getByRole('checkbox')).not.toBeChecked();
  expect(client.saveConsent).not.toHaveBeenCalled();
  expect(client.generate).not.toHaveBeenCalled();
});

it('asks for one approval, hides it, and exposes per-team generation', async () => {
  const client = api();
  const onSummaryChange = vi.fn();
  let controller!: { generate: (teamId: string) => Promise<void>; ready: boolean };
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
  await waitFor(() => expect(screen.queryByRole('checkbox')).not.toBeInTheDocument());
  await waitFor(() => expect(controller.ready).toBe(true));
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
  await waitFor(() => expect(screen.queryByRole('checkbox')).not.toBeInTheDocument());
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
  await waitFor(() => expect(screen.queryByRole('checkbox')).not.toBeInTheDocument());
  void controller.generate('1');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Cancel generation' })).toBeInTheDocument(),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Cancel generation' }));
  reject(new DOMException('Cancelled', 'AbortError'));
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
});

it('restores saved account approval and persists revocation', async () => {
  const client = api();
  vi.mocked(client.consent).mockResolvedValue({ codex: true, claude: false });
  renderSuggestions(client);
  const revoke = await screen.findByRole('button', { name: 'Revoke context-sharing approval' });
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  fireEvent.click(revoke);
  await waitFor(() =>
    expect(client.saveConsent).toHaveBeenCalledWith({ provider: 'codex', approved: false }),
  );
  await waitFor(() => expect(screen.getByRole('checkbox')).not.toBeChecked());
});
it('does not treat a failed preference save as approval', async () => {
  const client = api();
  vi.mocked(client.saveConsent).mockRejectedValue(new Error('offline'));
  renderSuggestions(client);
  await waitFor(() => expect(screen.getByRole('checkbox')).toBeEnabled());
  fireEvent.click(screen.getByRole('checkbox'));
  await screen.findByRole('alert');
  expect(screen.getByRole('checkbox')).not.toBeChecked();
});

it('inspects real owned roster context and never substitutes evidence from a different team', async () => {
  const client = api();
  const context = {
    teamName: 'Current team',
    year: 2025,
    throughWeek: 1,
    facts: ['Completed scoring: 120 points'],
    depth: ['Starter: Owned receiver · 18.0 projected', 'Bench: Owned reserve · 8.0 projected'],
    depthNote: 'Latest owned roster only',
    depthSnapshotAt: '2025-09-10T12:00:00Z',
    notes: ['Historical ownership may be unavailable'],
  };
  vi.mocked(client.context).mockResolvedValue(context);
  const props = {
    api: client,
    leagueId: '123',
    year: 2025,
    week: 2,
    teams: [
      { teamId: '1', teamName: 'Current team' },
      { teamId: '2', teamName: 'Other team' },
    ],
    selectedTeamId: '1',
    onSummaryChange: vi.fn(),
    onControllerChange: vi.fn(),
    onGenerationStateChange: vi.fn(),
  };
  const view = render(
    <Provider>
      <WritingSuggestions {...props} />
    </Provider>,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Inspect roster evidence' }));
  await screen.findByText('Starter: Owned receiver · 18.0 projected');
  expect(client.context).toHaveBeenCalledWith({
    leagueId: '123',
    year: 2025,
    week: 2,
    teamId: '1',
  });
  expect(screen.getByText(/Roster captured:/)).toBeInTheDocument();
  view.rerender(
    <Provider>
      <WritingSuggestions {...props} selectedTeamId="2" />
    </Provider>,
  );
  expect(screen.queryByText('Starter: Owned receiver · 18.0 projected')).not.toBeInTheDocument();
});
it('ignores late cancelled output and retains the selected editable model and provider approval', async () => {
  const client = api();
  vi.mocked(client.consent).mockResolvedValue({ codex: true, claude: false });
  let resolve!: (value: string) => void;
  vi.mocked(client.generate).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const onSummaryChange = vi.fn();
  let controller!: { generate: (teamId: string) => Promise<void>; ready: boolean };
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
  await waitFor(() => expect(controller.ready).toBe(true));
  fireEvent.change(screen.getByLabelText('Model (optional)'), {
    target: { value: 'account-model' },
  });
  const pending = controller.generate('1');
  fireEvent.click(await screen.findByRole('button', { name: 'Cancel generation' }));
  expect(await screen.findByText(/Generation cancelled/)).toBeInTheDocument();
  resolve('Late suggestion');
  await pending;
  expect(onSummaryChange).not.toHaveBeenCalled();
  expect(client.generate).toHaveBeenCalledWith(
    expect.objectContaining({ model: 'account-model', provider: 'codex' }),
    expect.any(AbortSignal),
  );
  expect(screen.getByLabelText('Model (optional)')).toHaveValue('account-model');
});

it('requires the current account readiness and consent before exposing generation after a session change', async () => {
  const previous = api();
  vi.mocked(previous.consent).mockResolvedValue({ codex: true, claude: false });
  let controller!: { generate: (teamId: string) => Promise<void>; ready: boolean };
  const props = {
    leagueId: '123',
    year: 2025,
    week: 2,
    onSummaryChange: vi.fn(),
    onControllerChange: (value: typeof controller) => {
      controller = value;
    },
    onGenerationStateChange: vi.fn(),
  };
  const view = render(
    <Provider>
      <WritingSuggestions api={previous} {...props} />
    </Provider>,
  );
  await waitFor(() => expect(controller.ready).toBe(true));
  const next = api();
  vi.mocked(next.consent).mockReturnValue(new Promise(() => {}));
  vi.mocked(next.providers).mockReturnValue(new Promise(() => {}));
  view.rerender(
    <Provider>
      <WritingSuggestions api={next} {...props} />
    </Provider>,
  );
  expect(controller.ready).toBe(false);
  await controller.generate('1');
  expect(next.generate).not.toHaveBeenCalled();
  expect(
    screen.queryByText('Context sharing is approved for this assistant and saved to your account.'),
  ).not.toBeInTheDocument();
});

it('refreshes readiness without allowing a delayed consent read to undo revocation', async () => {
  const client = api();
  vi.mocked(client.consent).mockResolvedValueOnce({ codex: true, claude: false });
  let finishRefresh!: (value: Awaited<ReturnType<WritingApi['providers']>>) => void;
  vi.mocked(client.providers)
    .mockResolvedValueOnce([{ id: 'codex', installed: true, enabled: true, status: 'ready' }])
    .mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = resolve;
        }),
    );
  renderSuggestions(client);
  const revoke = await screen.findByRole('button', { name: 'Revoke context-sharing approval' });
  fireEvent.click(screen.getByRole('button', { name: 'Refresh writing readiness' }));
  await waitFor(() => expect(client.providers).toHaveBeenCalledTimes(2));
  fireEvent.click(revoke);
  await waitFor(() => expect(screen.getByRole('checkbox')).not.toBeChecked());
  finishRefresh([{ id: 'codex', installed: true, enabled: true, status: 'ready' }]);
  await waitFor(() => expect(screen.getByRole('checkbox')).not.toBeChecked());
  expect(client.consent).toHaveBeenCalledTimes(1);
});
