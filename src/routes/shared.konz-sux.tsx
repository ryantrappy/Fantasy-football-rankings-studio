import { createFileRoute } from '@tanstack/react-router';
import { ManagerReportPage } from '../components/ManagerReportPage';
export const Route = createFileRoute('/shared/konz-sux')({
  head: () => ({
    meta: [{ title: 'konz4: the receipts' }, { name: 'robots', content: 'noindex, nofollow' }],
  }),
  component: ManagerReportPage,
});
