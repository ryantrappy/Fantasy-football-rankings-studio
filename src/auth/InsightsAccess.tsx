import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPublicInsightsApi } from '../api/public-insights';
import { withOwnerInsights, type PrivateInsightsApi } from '../api/owner-insights';
const Context = createContext<ReturnType<typeof createPublicInsightsApi> | null>(null);
export function InsightsAccess({
  children,
  privateApi,
}: {
  children: ReactNode;
  privateApi?: PrivateInsightsApi;
}) {
  const [publicApi] = useState(createPublicInsightsApi);
  useEffect(() => () => publicApi.dispose(), [publicApi]);
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
