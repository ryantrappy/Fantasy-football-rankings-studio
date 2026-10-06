import type { PublicInsightsApi } from './api/public-insights';
import type { createApi } from './api/client';

export interface RouterContext {
  publicInsightsApi: PublicInsightsApi;
  // Installed only by the mounted workspace, after authentication and setup.
  sessionApi?: ReturnType<typeof createApi>;
  sessionInsightsApi?: PublicInsightsApi;
}
