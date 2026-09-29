import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import { Provider } from './ui/provider';
import { SessionContext } from '../auth/session';
import { AppShell, HeaderControls } from './AppShell';

vi.mock('@tanstack/react-router', () => ({
  useRouterState: () => '/insights',
  useSearch: () => ({ leagueId: '123', year: 2026 }),
  Link: ({
    to,
    children,
    onClick,
    className,
  }: {
    to: string;
    children: ReactNode;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

function Page() {
  const [league, setLeague] = useState('123');
  return (
    <>
      <HeaderControls>
        <label>
          League
          <select value={league} onChange={(event) => setLeague(event.target.value)}>
            <option value="123">Sunday League</option>
            <option value="456">Monday League</option>
          </select>
        </label>
      </HeaderControls>
      <output>Selected league: {league}</output>
    </>
  );
}

it('moves page selectors into the header while retaining their page state and main content', () => {
  render(
    <Provider>
      <AppShell>
        <Page />
      </AppShell>
    </Provider>,
  );
  const header = screen.getByRole('banner');
  const select = within(header).getByRole('combobox', { name: 'League' });
  expect(within(header).getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
  expect(within(screen.getByRole('main')).queryByRole('combobox')).not.toBeInTheDocument();
  fireEvent.change(select, { target: { value: '456' } });
  expect(screen.getByText('Selected league: 456')).toBeInTheDocument();
});

it('offers account editing and sign out through the profile disclosure', () => {
  const signOut = vi.fn();
  render(
    <Provider>
      <SessionContext.Provider value={{ isAuthenticated: true, signOut }}>
        <AppShell>
          <Page />
        </AppShell>
      </SessionContext.Provider>
    </Provider>,
  );
  fireEvent.click(screen.getByLabelText('Profile menu'));
  expect(screen.getByRole('link', { name: 'Edit profile' })).toHaveAttribute('href', '/profile');
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(signOut).toHaveBeenCalledTimes(1);
});
