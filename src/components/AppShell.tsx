import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useRouterState } from '@tanstack/react-router';
import { useSessionStatus } from '../auth/session';
import { AppNavigation } from './AppNavigation';
import { ToolsBreadcrumb } from './OtherToolsPage';
import { PersistentDisclosure } from './DisclosureMotion';

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
  const locationKey = useRouterState({ select: (state) => state.location.href });
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
              <PersistentDisclosure
                className="profile-menu"
                contentClassName="profile-menu-items"
                accessibleLabel="Profile menu"
                label={
                  <>
                    Profile <span aria-hidden="true">☰</span>
                  </>
                }
                closeKey={locationKey}
                closeOnAction
              >
                <Link to="/profile" search={{ returnTo: undefined }}>
                  Edit profile
                </Link>
                <Link to="/leagues/new">Connect league</Link>
                <Link to="/leagues/manage">Manage leagues</Link>
                <button type="button" onClick={session.signOut}>
                  Sign out
                </button>
              </PersistentDisclosure>
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
