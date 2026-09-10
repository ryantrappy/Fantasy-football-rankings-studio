# Running with Docker

## Prerequisites

- Docker Desktop or Docker Engine with the Compose plugin.
- An Auth0 single-page application and API audience.
- A completed `.env` file. Copy the template first:

  ```sh
  cp .env.example .env
  ```

## Fill out `.env`

Before building, set these required values:

| Variable | What to provide |
| --- | --- |
| `VITE_AUTH0_DOMAIN` | Auth0 tenant hostname, such as `your-tenant.auth0.com` |
| `VITE_AUTH0_CLIENT_ID` | Auth0 SPA client ID |
| `VITE_AUTH0_AUDIENCE` | Auth0 API audience |
| `AUTH0_ISSUER_BASE_URL` | The same Auth0 tenant URL, with `https://` |
| `AUTH0_AUDIENCE` | The same API audience |
| `ESPN_CREDENTIALS_KEY` | 64 hexadecimal characters; generate with `openssl rand -hex 32` |

The optional Auth0 Management API and writing-assistant variables can remain empty
unless those features are needed. Do not commit `.env` or put server secrets in
`VITE_*` variables.

`VITE_*` values are embedded into the browser bundle during `docker compose build`.
Changing them requires rebuilding the image. Runtime server settings are loaded
from `.env` when the container starts. Compose overrides `MONGODB_URI` to use
`mongodb://mongo:27017/fantasy_rankings`; do not change it to `localhost`, because
the app and MongoDB communicate over the `fantasy-internal` Docker network.

## Start the application

```sh
docker compose up --build
```

Open <http://localhost:3001>. Only the application port is published to the host;
MongoDB is reachable only by containers on the internal Compose network.

To stop the containers while retaining MongoDB data:

```sh
docker compose down
```

To remove the persisted MongoDB volume as well:

```sh
docker compose down -v
```
