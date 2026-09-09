import { InsightsAccess } from './InsightsAccess';
import { Box, Button, Heading, Text, chakra } from '@chakra-ui/react';
import { useMemo, useState, useEffect, type ReactNode } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import { ClientOnly, useRouter } from '@tanstack/react-router';
import { errorMessage, createApi } from '../api/client';
import { ApiContext, SessionContext } from './session';

function LoadingSession() {
  return (
    <Box
      as="section"
      bg="bg"
      borderWidth="1px"
      borderStyle="solid"
      borderColor="border"
      rounded="lg"
      p={{ base: 4, md: 6 }}
      className="panel"
    >
      <Heading as="h1" size="3xl" mb={4}>
        Your league. Your rankings.
      </Heading>
      <chakra.output>Loading your session…</chakra.output>
    </Box>
  );
}

export function Authentication({
  children,
  optional = false,
}: {
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <ClientOnly
      fallback={optional ? <chakra.output>Loading report…</chakra.output> : <LoadingSession />}
    >
      <BrowserAuthentication optional={optional}>{children}</BrowserAuthentication>
    </ClientOnly>
  );
}

function BrowserAuthentication({ children, optional }: { children: ReactNode; optional: boolean }) {
  const router = useRouter();
  const domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
  if (!domain || !clientId || !audience) {
    if (optional)
      return (
        <SessionContext.Provider value={{ isAuthenticated: false }}>
          <InsightsAccess>{children}</InsightsAccess>
        </SessionContext.Provider>
      );
    return (
      <Box
        as="section"
        bg="bg"
        borderWidth="1px"
        borderStyle="solid"
        borderColor="border"
        rounded="lg"
        p={{ base: 4, md: 6 }}
        className="panel"
        role="alert"
      >
        <Heading as="h1" size="3xl" mb={4}>
          Sign-in is not configured.
        </Heading>
        <Text mb={4}>
          Set VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, and VITE_AUTH0_AUDIENCE in the application
          environment.
        </Text>
      </Box>
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
      <Session optional={optional}>{children}</Session>
    </Auth0Provider>
  );
}

function Session({ children, optional }: { children: ReactNode; optional: boolean }) {
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
  if (optional)
    return (
      <SessionContext.Provider value={{ isAuthenticated: !!isAuthenticated && !error }}>
        <InsightsAccess privateApi={isAuthenticated && !error ? api : undefined}>
          {children}
        </InsightsAccess>
      </SessionContext.Provider>
    );
  if (isLoading) return <LoadingSession />;
  if (!isAuthenticated || error)
    return (
      <Box
        as="section"
        bg="bg"
        borderWidth="1px"
        borderStyle="solid"
        borderColor="border"
        rounded="lg"
        p={{ base: 4, md: 6 }}
        className="panel"
      >
        <Heading as="h1" size="3xl" mb={4}>
          Your league. Your rankings.
        </Heading>
        <Text mb={4}>Sign in to manage leagues and publish your weekly takes.</Text>
        {(error || loginError) && (
          <Text mb={4} role="alert">
            {error?.message || loginError}
          </Text>
        )}
        <Button
          colorPalette="green"
          variant="solid"
          type="button"

          onClick={() =>
            void loginWithRedirect({
              appState: { returnTo: window.location.pathname + window.location.search },
            }).catch((failure) => setLoginError(errorMessage(failure)))
          }
        >
          Sign in
        </Button>
      </Box>
    );
  return (
    <SessionContext.Provider value={{ isAuthenticated: true }}>
      <ApiContext.Provider value={api}>
        <Box textAlign="right" className="session-actions">
          <Button
            variant="plain"
            type="button"

            onClick={() => void logout({ logoutParams: { returnTo: window.location.origin } })}
          >
            Sign out
          </Button>
        </Box>
        {children}
      </ApiContext.Provider>
    </SessionContext.Provider>
  );
}
