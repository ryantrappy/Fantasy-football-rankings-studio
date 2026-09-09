import { createServerFn } from '@tanstack/react-start';
import { setResponseHeader, setResponseStatus } from '@tanstack/react-start/server';
import { executePublic } from '../server/operations.server';
import { getManagerReport } from '../server/manager-report.server';
export const getKonzReport = createServerFn({ method: 'GET' }).handler(async () => {
  setResponseHeader('Cache-Control', 'no-store');
  const result = await executePublic(getManagerReport, 'public.konzReport');
  if (!result.ok) setResponseStatus(result.error.status);
  return result;
});
