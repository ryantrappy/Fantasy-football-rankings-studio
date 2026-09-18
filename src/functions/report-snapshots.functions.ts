import { createServerFn } from '@tanstack/react-start';
import {
  getRequestHeader,
  setResponseHeader,
  setResponseStatus,
} from '@tanstack/react-start/server';
import { execute, executePublic } from '../server/operations.server';
import { reportSnapshots } from '../server/report-snapshots.server';
import type { SnapshotInput } from '../report-snapshot';

export const createReportSnapshot = createServerFn({ method: 'POST' })
  .validator((data: SnapshotInput) => data)
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'no-store');
    const result = await execute(
      getRequestHeader('Authorization'),
      (owner) => reportSnapshots.create(owner, data),
      'snapshot.create',
    );
    if (!result.ok) setResponseStatus(result.error.status);
    return result;
  });
export const readReportSnapshot = createServerFn({ method: 'GET' })
  .validator((data: { publicId: string }) => data)
  .handler(async ({ data }) => {
    setResponseHeader('Cache-Control', 'no-store');
    const result = await executePublic(() => reportSnapshots.read(data), 'snapshot.read');
    if (!result.ok) setResponseStatus(result.error.status);
    return result;
  });
