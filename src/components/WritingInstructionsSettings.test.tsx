import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from './ui/provider';
import { WritingInstructionsSettings } from './WritingInstructionsSettings';
import { MAX_WRITING_INSTRUCTIONS_LENGTH, type WritingApi } from '../writing';

function makeApi(instructions = 'Use specific football details and short league banter.') {
  return {
    instructions: vi.fn().mockResolvedValue({ instructions }),
    saveInstructions: vi.fn().mockImplementation((value) => Promise.resolve(value)),
  } satisfies Pick<WritingApi, 'instructions' | 'saveInstructions'>;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function panel(api: ReturnType<typeof makeApi>) {
  return (
    <Provider>
      <WritingInstructionsSettings api={api} />
    </Provider>
  );
}

it('loads only the saved instructions and explains account scope and assistant sharing', async () => {
  const api = makeApi('My saved writing style');
  render(panel(api));
  expect(screen.getByRole('status')).toHaveTextContent('Loading writing instructions');
  const input = await screen.findByLabelText('Writing instructions');
  expect(input).toHaveValue('My saved writing style');
  expect(input).toHaveAttribute('maxLength', String(MAX_WRITING_INSTRUCTIONS_LENGTH));
  expect(screen.getByText(/for this account only/)).toHaveTextContent(
    /sent to the selected assistant with your writing requests/,
  );
  expect(screen.getByText(/default writing guidance/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save writing instructions' })).toBeDisabled();
});

it('saves replacement instructions verbatim and disables edits while saving', async () => {
  const api = makeApi();
  const save = deferred<{ instructions: string }>();
  api.saveInstructions.mockReturnValue(save.promise);
  render(panel(api));
  const input = await screen.findByLabelText('Writing instructions');
  const instructions = '  Keep my voice.\nUse league-specific details.  ';
  fireEvent.change(input, { target: { value: instructions } });
  expect(screen.getByRole('status')).toHaveTextContent('Unsaved writing instructions.');
  fireEvent.click(screen.getByRole('button', { name: 'Save writing instructions' }));
  expect(api.saveInstructions).toHaveBeenCalledWith({ instructions });
  expect(input).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Saving writing instructions…' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Clear writing instructions' })).toBeDisabled();
  await act(async () => save.resolve({ instructions }));
  expect(screen.getByRole('status')).toHaveTextContent('Writing instructions saved.');
  expect(input).toHaveValue(instructions);
  expect(input).toBeEnabled();
});

it('persists an empty value when clearing saved instructions', async () => {
  const api = makeApi();
  render(panel(api));
  const input = await screen.findByLabelText('Writing instructions');
  fireEvent.click(screen.getByRole('button', { name: 'Clear writing instructions' }));
  await screen.findByText('Writing instructions saved.');
  expect(api.saveInstructions).toHaveBeenCalledWith({ instructions: '' });
  expect(input).toHaveValue('');
  expect(screen.getByRole('button', { name: 'Clear writing instructions' })).toBeDisabled();
});

it('keeps the editable draft when clearing fails and only empties it after a successful retry', async () => {
  const api = makeApi('Saved instructions');
  const clear = deferred<{ instructions: string }>();
  api.saveInstructions.mockReturnValueOnce(clear.promise);
  render(panel(api));
  const input = await screen.findByLabelText('Writing instructions');
  fireEvent.change(input, { target: { value: 'Unsaved instructions worth keeping' } });
  fireEvent.click(screen.getByRole('button', { name: 'Clear writing instructions' }));
  expect(input).toHaveValue('Unsaved instructions worth keeping');
  await act(async () => clear.reject(new Error('Clear unavailable.')));
  expect(screen.getByRole('alert')).toHaveTextContent('Clear unavailable.');
  expect(input).toHaveValue('Unsaved instructions worth keeping');
  expect(input).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Clear writing instructions' }));
  await screen.findByText('Writing instructions saved.');
  expect(input).toHaveValue('');
  expect(api.saveInstructions).toHaveBeenNthCalledWith(1, { instructions: '' });
  expect(api.saveInstructions).toHaveBeenNthCalledWith(2, { instructions: '' });
});

it('preserves an unsaved draft after a save failure and lets the user retry', async () => {
  const api = makeApi();
  api.saveInstructions.mockRejectedValueOnce(new Error('Save unavailable.'));
  render(panel(api));
  const input = await screen.findByLabelText('Writing instructions');
  fireEvent.change(input, { target: { value: 'Keep this unsaved draft.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save writing instructions' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Save unavailable.');
  expect(input).toHaveValue('Keep this unsaved draft.');
  expect(screen.getByRole('status')).toHaveTextContent('Unsaved writing instructions.');
  fireEvent.click(screen.getByRole('button', { name: 'Save writing instructions' }));
  await screen.findByText('Writing instructions saved.');
  expect(api.saveInstructions).toHaveBeenCalledTimes(2);
});

it('retries a failed load without substituting default personal instructions', async () => {
  const api = makeApi('');
  api.instructions.mockRejectedValueOnce(new Error('Instructions unavailable.'));
  render(panel(api));
  expect(await screen.findByRole('alert')).toHaveTextContent('Instructions unavailable.');
  expect(screen.queryByLabelText('Writing instructions')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Retry writing instructions' }));
  expect(await screen.findByLabelText('Writing instructions')).toHaveValue('');
  expect(api.instructions).toHaveBeenCalledTimes(2);
});

it('hides old account data and ignores a previous API load completing after an account change', async () => {
  const first = makeApi();
  const load = deferred<{ instructions: string }>();
  first.instructions.mockReturnValue(load.promise);
  const view = render(panel(first));
  const next = makeApi('Next account instructions');
  view.rerender(panel(next));
  const input = await screen.findByLabelText('Writing instructions');
  await act(async () => load.resolve({ instructions: 'Private first account style' }));
  expect(input).toHaveValue('Next account instructions');
  expect(screen.queryByDisplayValue('Private first account style')).not.toBeInTheDocument();
});

it.each(['resolve', 'reject'] as const)(
  'ignores a previous API save that later %ss after an account change',
  async (outcome) => {
    const first = makeApi('Private first account style');
    const save = deferred<{ instructions: string }>();
    first.saveInstructions.mockReturnValue(save.promise);
    const view = render(panel(first));
    fireEvent.change(await screen.findByLabelText('Writing instructions'), {
      target: { value: 'First account draft' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save writing instructions' }));
    const next = makeApi('Next account instructions');
    view.rerender(panel(next));
    const input = await screen.findByLabelText('Writing instructions');
    fireEvent.change(input, { target: { value: 'Next account draft' } });
    await act(async () => {
      if (outcome === 'resolve') save.resolve({ instructions: 'First account draft' });
      else save.reject(new Error('First account failure'));
    });
    expect(input).toHaveValue('Next account draft');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved writing instructions.');
    expect(next.saveInstructions).not.toHaveBeenCalled();
  },
);

it('does not restore an old draft while the next account instructions are loading', async () => {
  const first = makeApi('Private first account style');
  const view = render(panel(first));
  fireEvent.change(await screen.findByLabelText('Writing instructions'), {
    target: { value: 'Private first account draft' },
  });
  const next = makeApi();
  next.instructions.mockReturnValue(new Promise(() => {}));
  view.rerender(panel(next));
  await waitFor(() => expect(next.instructions).toHaveBeenCalled());
  expect(screen.queryByLabelText('Writing instructions')).not.toBeInTheDocument();
  expect(screen.getByRole('status')).toHaveTextContent('Loading writing instructions');
});
