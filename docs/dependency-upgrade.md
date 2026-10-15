# Dependency upgrade — October 15, 2026

TASK-153 upgrades the application to the stable TanStack Start line and compatible current direct dependencies. TanStack's [October 13 stable announcement](https://tanstack.com/blog/tanstack-start-1-0) corresponds to `@tanstack/react-start@1.169.0` onward; the application uses `1.169.2`. Individual TanStack libraries retain their own version numbers.

## Updated application dependencies

Versions were checked against the npm registry on October 15, 2026. The committed lockfile records the exact installation; the package manifest retains compatible caret ranges.

| Package                         | Previous   | Updated    |
| ------------------------------- | ---------- | ---------- |
| `@tanstack/ai`                  | `0.64.0`   | `0.69.0`   |
| `@tanstack/charts`              | `1.0.0`    | `1.1.0`    |
| `@tanstack/db`                  | `0.11.3`   | `0.15.0`   |
| `@tanstack/query-core`          | `5.104.1`  | `5.104.3`  |
| `@tanstack/query-db-collection` | `1.3.4`    | `1.4.5`    |
| `@tanstack/react-db`            | `0.5.3`    | `0.5.10`   |
| `@tanstack/react-router`        | `1.170.41` | `1.170.44` |
| `@tanstack/react-start`         | `1.168.60` | `1.169.2`  |
| `@tanstack/react-table`         | `9.2.6`    | `9.3.1`    |
| `dotenv`                        | `18.0.5`   | `18.0.8`   |
| `mongoose`                      | `9.10.4`   | `9.11.2`   |
| `react`                         | `19.3.0`   | `19.3.1`   |
| `react-dom`                     | `19.3.0`   | `19.3.1`   |
| `zod`                           | `4.6.5`    | `4.6.7`    |
| `@axe-core/playwright`          | `4.13.0`   | `4.14.0`   |
| `@playwright/test`              | `1.63.0`   | `1.64.1`   |
| `@testing-library/user-event`   | `14.6.7`   | `14.6.8`   |
| `@types/node`                   | `26.6.4`   | `26.6.5`   |
| `@vitejs/plugin-react`          | `6.1.1`    | `6.1.2`    |
| `jsdom`                         | `30.1.2`   | `30.1.3`   |
| `oxc-transform-react`           | `0.145.0`  | `0.152.0`  |
| `oxfmt`                         | `0.71.0`   | `0.73.0`   |
| `oxlint`                        | `1.86.0`   | `1.88.0`   |
| `seroval`                       | `1.6.8`    | `1.6.9`    |
| `vite`                          | `8.3.2`    | `8.3.4`    |
| `vitest`                        | `5.0.3`    | `5.0.5`    |

Other direct dependencies were already current, including Nitro `3.0.260903-beta`. Its existing Node server preset, database startup plugin and private server-function cache rules remain in place.

## Compatibility and behavior

- Start `1.169.2` depends on Router `1.170.44`; these versions are aligned. Start requires Node `>=22.12.0`, Vite `>=8` and React `>=18`, covered by the existing Node engine constraint and updated dependencies. Rsbuild is an optional peer and is not required for the Vite build.
- React DB `0.5.10` and Query DB Collection `1.4.5` both depend on DB `0.15.0`. Query DB Collection requires Query Core `^5.90.15`; `5.104.3` satisfies it. Account-specific collections, explicit refresh, cancellation and disposal after live-query detachment remain supported.
- [TanStack AI `0.66.0`](https://github.com/TanStack/ai/blob/main/packages/ai/CHANGELOG.md) changed non-streaming chat results from a string to `{ text, chunks }`. The writing service reads `text`, preserving empty-result errors, the response length bound, saved consent/instructions, factual grounding, CLI restrictions and cancellation. The custom CLI adapter uses a private `cliProvider` field to avoid colliding with AI’s new public adapter `provider` metadata. OpenTelemetry remains optional.
- [Query DB Collection `1.4.0`](https://github.com/TanStack/db/blob/main/packages/query-db-collection/CHANGELOG.md) reports direct-write validation errors through rejected promises. League creation and ranking saves await cache publication and propagate failures. No optimistic success is reported before the cache write settles.
- [DB `0.12.3`](https://github.com/TanStack/db/blob/main/packages/db/CHANGELOG.md) starts source synchronization on subscription or preload and counts data-demanding subscribers. Session disposal still waits for dependent live queries to detach.
- Vite React plugin `6.1.2` requires optional compiler peer `oxc-transform-react@^0.152.0`. Use `0.152.0`; newer `0.154.0` falls outside that range and fails dependency resolution.
- Axe 4.14 adds label/content matching checks. Heatmap and Live matchup button names now include their visible records, samples and scores, preserving keyboard inspection and selection while supporting speech navigation.
- Table already uses the v9 feature APIs; this update retains sorting and CSV behavior. Charts `1.1.0` preserves layout defaults while fixing interactions, resize handling and tooltip styling. React Compiler remains enabled through Oxc in both application and browser-fixture builds.

## Validation

Run from the application directory:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test:ui
npm ls @tanstack/db @tanstack/react-router react react-dom
```

Focused regressions cover real CLI output through TanStack AI, empty and bounded writing results, awaited collection writes and rejected cache validation, alongside existing cache isolation, refresh and session-disposal tests. Browser coverage checks interaction, accessibility and existing export baselines. Live ESPN checks remain separate from deterministic required checks.

Integration verification: 879 unit tests passed (one optional live ESPN check skipped), with typecheck, lint, repository formatting, dependency compatibility and production build passing. The 148-scenario fresh-server browser suite initially passed 142; after resolving the new accessibility findings, all 11 Live and five heatmap accessibility regressions passed, covering every failed scenario. Canonical ranking PNG baselines and forecast responsiveness checks remained unchanged and passed.

## CI runtime correction — TASK-154

Actions previously pinned Node 22.12.0 while local verification ran on Node 26. The locked jsdom 30.1.3 requires Node `^22.22.2 || ^24.15.0 || >=26.0.0`, and Undici 8.12.2 requires Node `>=22.19.0`. Node 22.12 lacks `zlib.createZstdDecompress`, causing Undici to throw during import before Vitest can start jsdom workers. This failure reproduces directly with `require('undici')` under Node 22.12.

Both Actions jobs now read Node 24.15.0 from `.nvmrc`, also used for local development, and install with `npm ci --engine-strict` so future incompatible upgrades fail at installation. The existing production runtime engine range remains unchanged; these additional requirements concern installed development/test tooling. Docker already uses Node 24.
