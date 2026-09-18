import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPublicInsightsApi, type PublicInsightsApi } from '../api/public-insights';
import { withOwnerInsights, type PrivateInsightsApi } from '../api/owner-insights';
const Context = createContext<ReturnType<typeof createPublicInsightsApi> | null>(null);
export function InsightsAccess({
  children,
  privateApi,
  publicApi: suppliedPublicApi,
}: {
  children: ReactNode;
  privateApi?: PrivateInsightsApi;
  publicApi?: PublicInsightsApi;
}) {
  const [publicApi] = useState(() => suppliedPublicApi || createPublicInsightsApi());
  useEffect(
    () => () => {
      if (!suppliedPublicApi) publicApi.dispose();
    },
    [publicApi, suppliedPublicApi],
  );
  const api = useMemo(
    () => (privateApi ? withOwnerInsights(publicApi, privateApi) : publicApi),
    [publicApi, privateApi],
  );
  return <Context.Provider value={api}>{children}</Context.Provider>;
}
export function useInsightsApi() {
  const api = useContext(Context);
  if (!api) throw new Error('Insights access is not available.');
  return api;
}
