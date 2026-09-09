import { createFileRoute, Outlet } from '@tanstack/react-router';
import { AppNavigation } from '../components/AppNavigation';
import { Authentication } from '../auth/Authentication';

export const Route = createFileRoute('/_authenticated')({
  component: () => (
    <Authentication>
      <AppNavigation />
      <Outlet />
    </Authentication>
  ),
});
