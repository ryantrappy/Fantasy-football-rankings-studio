# Fantasy Power Rankings

React 19 and TypeScript application served by Vite. Use Node.js 22.12 or newer.

## Development

```sh
npm ci
npm start
```

The development server runs at http://localhost:3001.

## Checks and formatting

```sh
npm run lint          # Oxlint correctness checks; warnings fail the check
npm run lint:fix      # Apply safe lint fixes
npm run format        # Format the project with Oxfmt
npm run format:check  # Check formatting without changing files
npm run typecheck    # Check TypeScript types
npm test             # Run Vitest once
npm run build        # Check types and produce the Vite build in dist/
```

Oxlint and Oxfmt replace ESLint and Prettier. Configuration lives in
`.oxlintrc.json` and `.oxfmtrc.json`. Generated files, dependency directories,
coverage, and the npm lockfile are excluded from formatting.
