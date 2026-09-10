import { createContext, useContext } from 'react';
import { createApi } from '../api/client';

export const ApiContext = createContext<ReturnType<typeof createApi> | null>(null);
export const SessionContext = createContext({ isAuthenticated: false });

export function useApi() {
  const api = useContext(ApiContext);
  if (!api) throw new Error('The league API requires an authenticated session.');
  return api;
}

export function useSessionStatus() {
  return useContext(SessionContext);
}
