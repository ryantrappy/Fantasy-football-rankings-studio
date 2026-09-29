import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AppShell } from '../components/AppShell';
import { Authentication } from '../auth/Authentication';

export const Route = createFileRoute('/_authenticated')({
  component: () => (
    <Authentication>
      <AppShell>
        <Outlet />
      </AppShell>
    </Authentication>
  ),
});
