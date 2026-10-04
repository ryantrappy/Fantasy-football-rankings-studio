import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from './ui/provider';
import { CodexAccountSettings, codexSetupUrl } from './CodexAccountSettings';
import type { WritingProviderOption } from '../writing';
it.each([
  ['ready', 'Server Codex login is ready'],
  ['not-enabled', 'Server Codex is disabled'],
  ['not-installed', 'server Codex CLI is missing'],
  ['login-check-failed', 'Server Codex login check failed'],
] as const)(
  'explains %s server state without requiring an API key',
  async (serverStatus, message) => {
    const api = { providers: vi.fn().mockResolvedValue([{ id: 'codex', serverStatus }]) };
    render(
      <Provider>
        <CodexAccountSettings api={api} revision={false} />
      </Provider>,
    );
    expect(await screen.findByRole('status')).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(message));
    expect(screen.getByText(/An API key is optional/)).toHaveTextContent(
      /share the operator’s account and quota/,
    );
    expect(
      screen.getByRole('link', { name: 'Docker Codex OAuth setup instructions' }),
    ).toHaveAttribute('href', codexSetupUrl);
  },
);
it('offers retry after a failed readiness request', async () => {
  const api = {
    providers: vi
      .fn()
      .mockRejectedValueOnce(new Error('secret CLI output'))
      .mockResolvedValue([
        { id: 'codex', serverStatus: 'ready' } satisfies Partial<WritingProviderOption>,
      ]),
  };
  render(
    <Provider>
      <CodexAccountSettings api={api} />
    </Provider>,
  );
  await screen.findByText(/readiness is unavailable/);
  expect(screen.queryByText(/secret CLI output/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh Codex readiness' }));
  await screen.findByText(/Server Codex login is ready/);
});
