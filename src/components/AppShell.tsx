import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useRouterState } from '@tanstack/react-router';
import { useSessionStatus } from '../auth/session';
import { AppNavigation } from './AppNavigation';
import { ToolsBreadcrumb } from './OtherToolsPage';

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
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) menu.current?.removeAttribute('open');
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menu.current?.open) {
        menu.current.removeAttribute('open');
        menu.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, []);
  const live = pathname === '/live';
  return (
    <HeaderTarget.Provider value={controls}>
      <div className={`app-shell${live ? ' app-shell-live' : ''}`}>
        <a className="studio-skip-link" href="#workspace-content">
          Skip to content
        </a>
        <header className="workspace-header">
          <div className="workspace-toolbar">
            <Link to="/" className="workspace-brand">
              <img src="/studio-icon.svg" alt="" width="40" height="40" />
              <span>
                Trapp<span className="workspace-brand-caption">Fantasy Studio</span>
              </span>
            </Link>
            <AppNavigation shared={shared} />
            {!shared && (
              <details className="profile-menu" ref={menu}>
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
                    to="/leagues/new"
                    onClick={(event) =>
                      event.currentTarget.closest('details')?.removeAttribute('open')
                    }
                  >
                    Create league
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
          <div className="workspace-selectors" ref={setControls} />
        </header>
        <main
          id="workspace-content"
          tabIndex={-1}
          className={
            live
              ? 'workspace-main workspace-main-live studio-surface'
              : 'workspace-main studio-surface'
          }
        >
          {['/tools', '/players', '/trades'].includes(pathname) && (
            <ToolsBreadcrumb pathname={pathname} />
          )}
          {children}
        </main>
      </div>
    </HeaderTarget.Provider>
  );
}
