import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useRouterState } from '@tanstack/react-router';
import { useSessionStatus } from '../auth/session';
import { AppNavigation } from './AppNavigation';

const HeaderTarget = createContext<HTMLElement | null | undefined>(undefined);

// Keep each page's selectors and handlers together while displaying them in the shared header.
export function HeaderControls({ children }: { children: ReactNode }) {
  const target = useContext(HeaderTarget);
  if (target === undefined) return children;
  return target ? createPortal(children, target) : null;
}

export function AppShell({ children, shared = false }: { children: ReactNode; shared?: boolean }) {
  const [controls, setControls] = useState<HTMLDivElement | null>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const session = useSessionStatus();
  const live = pathname === '/live';
  return (
    <HeaderTarget.Provider value={controls}>
      <div className={`app-shell${live ? ' app-shell-live' : ''}`}>
        <header className="workspace-header">
          <div className="workspace-toolbar">
            <Link to="/" className="workspace-brand">
              Trapp Fantasy Studio
            </Link>
            <div className="workspace-selectors" ref={setControls} />
            {!shared && (
              <details className="profile-menu">
                <summary aria-label="Profile menu">
                  Profile <span aria-hidden="true">☰</span>
                </summary>
                <div className="profile-menu-items">
                  <Link
                    to="/profile"
                    search={{ returnTo: undefined }}
                    onClick={(event) =>
                      event.currentTarget.closest('details')?.removeAttribute('open')
                    }
                  >
                    Edit profile
                  </Link>
                  <Link
                    to="/leagues/manage"
                    onClick={(event) =>
                      event.currentTarget.closest('details')?.removeAttribute('open')
                    }
                  >
                    Manage leagues
                  </Link>
                  <button type="button" onClick={session.signOut}>
                    Sign out
                  </button>
                </div>
              </details>
            )}
          </div>
          <AppNavigation shared={shared} />
        </header>
        <main className={live ? 'workspace-main workspace-main-live' : 'workspace-main'}>
          {children}
        </main>
      </div>
    </HeaderTarget.Provider>
  );
}
