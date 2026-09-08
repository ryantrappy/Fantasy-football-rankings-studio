import type { ReactNode } from 'react';
import { createRootRoute, HeadContent, Link, Outlet, Scripts } from '@tanstack/react-router';
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
  component: Outlet,
  notFoundComponent: () => (
    <section className="panel">
      <h1>Page not found</h1>
      <Link to="/">Back to rankings</Link>
    </section>
  ),
  errorComponent: ({ reset }) => (
    <section className="panel" role="alert">
      <h1>We couldn’t open this page.</h1>
      <button onClick={reset}>Try again</button>
      <Link to="/">Back to rankings</Link>
    </section>
  ),
});

function Document({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <header className="site-header">
          <Link to="/" className="brand">
            POWER / RANK
          </Link>
          <span>Fantasy Power Rankings</span>
        </header>
        <main>{children}</main>
        <Scripts />
      </body>
    </html>
  );
}
