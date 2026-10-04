import { PasswordReset } from './PasswordReset';
import { logClientError } from '../logging';
import { EspnSetup } from '../components/EspnSetup';
import { InsightsAccess } from './InsightsAccess';
import { Text } from '@chakra-ui/react';
import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { ClientOnly, useRouter } from '@tanstack/react-router';
import { errorMessage, createApi } from '../api/client';
import { ApiContext, SessionContext } from './session';
import { SignInLanding } from './SignInLanding';

function LoadingSession() {
  return <SignInLanding state="loading" />;
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
    return <SignInLanding state="unconfigured" />;
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
  useEffect(() => {
    if (error) logClientError('auth.session', error);
  }, [error]);
  const [loginError, setLoginError] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const subject = isAuthenticated ? user?.sub : undefined;
  const api = useMemo(
    () =>
      createApi(async () => {
        const token = await getAccessTokenSilently();
        if (!token) throw new Error('No access token returned for this session.');
        return token;
      }, subject),
    [getAccessTokenSilently, subject],
  );
  useEffect(
    () => () => {
      void api.dispose().catch((error) => logClientError('session.dispose', error));
    },
    [api],
  );
  if (isLoading) return <LoadingSession />;
  if (!isAuthenticated || error)
    return (
      <SignInLanding
        error={error?.message || loginError}
        signingIn={signingIn}
        recovery={<PasswordReset />}
        onSignIn={() => {
          if (signingIn) return;
          setSigningIn(true);
          setLoginError('');
          void loginWithRedirect({
            appState: { returnTo: window.location.pathname + window.location.search },
          })
            .catch((failure) => {
              logClientError('auth.login', failure);
              setLoginError(errorMessage(failure));
            })
            .finally(() => setSigningIn(false));
        }}
      />
    );
  return (
    <SessionContext.Provider
      value={{
        isAuthenticated: true,
        signOut: () => {
          void logout({ logoutParams: { returnTo: window.location.origin } }).catch((failure) => {
            logClientError('auth.logout', failure);
            setLoginError(errorMessage(failure));
          });
        },
      }}
    >
      <ApiContext.Provider value={api}>
        {loginError && <Text role="alert">{loginError}</Text>}
        <EspnSetup key={user?.sub} api={api}>
          <InsightsAccess privateApi={api}>{children}</InsightsAccess>
        </EspnSetup>
      </ApiContext.Provider>
    </SessionContext.Provider>
  );
}
