import { Box, Button, Container, Flex, Heading, Text, Link as ChakraLink } from '@chakra-ui/react';
import { useEffect, type ReactNode } from 'react';
import { installBrowserErrorLogging, logClientError } from '../logging';
import {
  createRootRouteWithContext,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router';
import { Provider } from '../components/ui/provider';
import type { RouterContext } from '../router-context';
import styles from '../index.css?url';

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Trapp Fantasy Studio' },
      {
        name: 'description',
        content: 'Create, edit, and share your weekly fantasy power rankings.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: styles },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  shellComponent: Document,
  onCatch: (error) => logClientError('route.error', error),
  component: RootLayout,
  notFoundComponent: () => (
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
        Page not found
      </Heading>
      <ChakraLink asChild>
        <Link to="/">Back to rankings</Link>
      </ChakraLink>
    </Box>
  ),
  errorComponent: ({ reset }) => (
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
        We couldn’t open this page.
      </Heading>
      <Button variant="outline" type="button" onClick={reset}>
        Try again
      </Button>
      <ChakraLink asChild>
        <Link to="/">Back to rankings</Link>
      </ChakraLink>
    </Box>
  ),
});

function RootLayout() {
  const workspace = useRouterState({
    select: (state) =>
      state.matches.some(
        (match) => match.routeId === '/_authenticated' || match.routeId === '/_public',
      ),
  });
  if (workspace) return <Outlet />;
  return (
    <>
      <Flex
        as="header"
        className="site-header"
        justify="space-between"
        gap={4}
        py={6}
        px="max(1rem, calc((100vw - 1280px) / 2))"
        bg="fg"
        color="white"
      >
        <ChakraLink asChild color="white">
          <Link to="/" className="brand">
            Trapp Fantasy Studio
          </Link>
        </ChakraLink>
        <Text display={{ base: 'none', md: 'block' }} m={0}>
          Trapp Fantasy Studio
        </Text>
      </Flex>
      <Container as="main" maxW="1280px" mx="auto" p={{ base: 4, md: 6 }}>
        <Outlet />
      </Container>
    </>
  );
}

function Document({ children }: { children: ReactNode }) {
  useEffect(() => installBrowserErrorLogging(window), []);
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Provider>{children}</Provider>
        <Scripts />
      </body>
    </html>
  );
}
