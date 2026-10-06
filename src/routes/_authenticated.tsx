import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AppShell } from '../components/AppShell';
import { Authentication } from '../auth/Authentication';
import { WorkspacePreloader } from '../components/WorkspacePreloader';

export const Route = createFileRoute('/_authenticated')({
  component: () => (
    <Authentication>
      <AppShell>
        <WorkspacePreloader shared={false} />
        <Outlet />
      </AppShell>
    </Authentication>
  ),
});
