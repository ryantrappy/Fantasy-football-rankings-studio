import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { Route } from '../routes/_public';
import { SessionContext } from '../auth/session';
import { useInsightsApi } from '../auth/InsightsAccess';
import { AppNavigation } from './AppNavigation';
import { ShareReport } from './ShareReport';

const { readPublic, readAuth } = vi.hoisted(() => ({ readPublic: vi.fn(), readAuth: vi.fn() }));
vi.mock('@auth0/auth0-react', () => ({
  Auth0Provider: () => {
    readAuth();
    throw new Error('Public reports must not initialize Auth0');
  },
  useAuth0: readAuth,
}));
vi.mock('../functions/public-insights.functions', () => ({
  getPublicInsights: readPublic,
}));
vi.mock('@tanstack/react-router', async (original) => ({
  ...(await original<typeof import('@tanstack/react-router')>()),
  createFileRoute: () => (options: unknown) => ({ options }),
  useSearch: () => ({ leagueId: '123' }),
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
  Outlet: () => <ReportProbe />,
}));
function ReportProbe() {
  const api = useInsightsApi();
  return <button onClick={() => void api.getInsights('123', 2025)}>Read report</button>;
}
const PublicLayout = Route.options.component as () => ReactNode;
const wrap = (children: ReactNode, authenticated = false) => (
  <ChakraProvider value={defaultSystem}>
    <SessionContext.Provider value={{ isAuthenticated: authenticated }}>
      {children}
    </SessionContext.Provider>
  </ChakraProvider>
);
afterEach(() => vi.clearAllMocks());
it('keeps public navigation and data public across session changes and rerenders', async () => {
  readPublic.mockResolvedValue({ ok: true, data: {} });
  const view = render(wrap(<PublicLayout />));
  expect(screen.queryByText('Rankings studio')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Season insights' })).toHaveAttribute(
    'href',
    '/shared/insights',
  );
  view.rerender(wrap(<PublicLayout />, true));
  expect(screen.queryByText('Rankings studio')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'League history' })).toHaveAttribute(
    'href',
    '/shared/history',
  );
  fireEvent.click(screen.getByText('Read report'));
  await waitFor(() => expect(readPublic).toHaveBeenCalledTimes(1));
  expect(readAuth).not.toHaveBeenCalled();
});
it('retains the studio and internal destinations in owner navigation', () => {
  render(wrap(<AppNavigation />, true));
  expect(screen.getByRole('link', { name: 'Rankings studio' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: 'Season insights' })).toHaveAttribute(
    'href',
    '/insights',
  );
});
it.each(['/insights', '/history'] as const)(
  'copies a public %s URL with report selections',
  async (path) => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(
      wrap(
        <ShareReport path={path} search={{ leagueId: '123', year: 2025, years: [2025, 2024] }} />,
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy share link' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const url = new URL(writeText.mock.calls[0][0]);
    expect(url.pathname).toBe(`/shared${path}`);
    expect(JSON.parse(url.searchParams.get('leagueId')!)).toBe('123');
    expect(url.searchParams.get('years')).toBe('[2025,2024]');
  },
);

it('makes calculation explanations expandable in season and historical summaries', async () => {
  const { LeagueSummary } = await import('./LeagueSummary');
  const view = render(wrap(<LeagueSummary records={[]} />));
  const summary = screen.getByText('How are these numbers calculated?');
  const details = summary.closest('details')!;
  expect(details.open).toBe(false);
  fireEvent.click(summary);
  expect(details.open).toBe(true);
  expect(screen.getByText(/Example: in a four-team league/)).toBeVisible();
  view.rerender(wrap(<LeagueSummary records={[]} historical />));
  expect(screen.getByText('How are these numbers calculated?')).toBeInTheDocument();
});
