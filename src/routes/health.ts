import { logClientError } from '../logging';
import { logServerError } from '../server/logging.server';
import { createFileRoute } from '@tanstack/react-router';
import { connectDatabase } from '../server/database.server';
export const Route = createFileRoute('/health')({
  server: {
    handlers: {
      GET: async () => {
        try {
          await connectDatabase();
          return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
        } catch (error) {
        logClientError('health', error);
          logServerError('health', error, 503);
          return Response.json({ status: 'unavailable' }, { status: 503 });
        }
      },
    },
  },
});
