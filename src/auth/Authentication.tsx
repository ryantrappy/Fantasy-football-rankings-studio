import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { ClientOnly, useRouter } from '@tanstack/react-router';
import { createApi, errorMessage } from '../api/client';

const ApiContext = createContext<ReturnType<typeof createApi> | null>(null);

export function useApi() {
  const api = useContext(ApiContext);
  if (!api) throw new Error('The league API requires an authenticated session.');
  return api;
}

function LoadingSession() {
  return (
    <section className="panel">
      <h1>Your league. Your rankings.</h1>
      <output>Loading your session…</output>
    </section>
  );
}

export function Authentication({ children }: { children: ReactNode }) {
  return (
    <ClientOnly fallback={<LoadingSession />}>
      <BrowserAuthentication>{children}</BrowserAuthentication>
    </ClientOnly>
  );
}

function BrowserAuthentication({ children }: { children: ReactNode }) {
  const router = useRouter();
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
  if (!domain || !clientId || !audience) {
    return (
      <section className="panel" role="alert">
        <h1>Sign-in is not configured.</h1>
        <p>
          Set VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, and VITE_AUTH0_AUDIENCE in the application
          environment.
        </p>
      </section>
    );
  }
  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{ redirect_uri: window.location.origin, audience }}
      onRedirectCallback={(state) => {
        const target = state?.returnTo;
        void router.navigate({
          href:
            typeof target === 'string' &&
            target.startsWith('/') &&
            !target.startsWith('//') &&
            !target.includes('\\')
              ? target
              : '/',
          replace: true,
        });
      }}
    >
      <Session>{children}</Session>
    </Auth0Provider>
  );
}

function Session({ children }: { children: ReactNode }) {
  const {
    isLoading,
    isAuthenticated,
    error,
    loginWithRedirect,
    logout,
    getAccessTokenSilently,
    user,
  } = useAuth0();
  const [loginError, setLoginError] = useState('');
  const api = useMemo(
    () => createApi(getAccessTokenSilently, user?.sub),
    [getAccessTokenSilently, user?.sub],
  );
  useEffect(
    () => () => {
      void api.dispose();
    },
    [api],
  );
  if (isLoading) return <LoadingSession />;
  if (!isAuthenticated || error)
    return (
      <section className="panel">
        <h1>Your league. Your rankings.</h1>
        <p>Sign in to manage leagues and publish your weekly takes.</p>
        {(error || loginError) && <p role="alert">{error?.message || loginError}</p>}
        <button
          className="button primary"
          onClick={() =>
            void loginWithRedirect({
              appState: { returnTo: window.location.pathname + window.location.search },
            }).catch((failure) => setLoginError(errorMessage(failure)))
          }
        >
          Sign in
        </button>
      </section>
    );
  return (
    <ApiContext.Provider value={api}>
      <div className="session-actions">
        <button
          className="text-button"
          onClick={() => void logout({ logoutParams: { returnTo: window.location.origin } })}
        >
          Sign out
        </button>
      </div>
      {children}
    </ApiContext.Provider>
  );
}
