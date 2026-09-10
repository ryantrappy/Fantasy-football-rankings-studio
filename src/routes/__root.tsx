import { Box, Button, Container, Flex, Heading, Text, Link as ChakraLink } from '@chakra-ui/react';
import { useEffect, type ReactNode } from 'react';
import { installBrowserErrorLogging, logClientError } from '../logging';
import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router';
import { Provider } from '../components/ui/provider';
import styles from '../index.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Fantasy Power Rankings' },
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
  component: Outlet,
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

function Document({ children }: { children: ReactNode }) {
  useEffect(() => installBrowserErrorLogging(window), []);
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <Provider>
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
                POWER / RANK
              </Link>
            </ChakraLink>
            <Text display={{ base: 'none', md: 'block' }} m={0}>
              Fantasy Power Rankings
            </Text>
          </Flex>
          <Container as="main" maxW="1280px" mx="auto" p={{ base: 4, md: 6 }}>
            {children}
          </Container>
        </Provider>
        <Scripts />
      </body>
    </html>
  );
}
