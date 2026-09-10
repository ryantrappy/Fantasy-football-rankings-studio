# Running with Docker

## Prerequisites

- Docker Desktop or Docker Engine with the Compose plugin.
- An Auth0 single-page application and API audience.
- A completed `.env` file for the server runtime. Copy the template first:

  ```sh
  cp .env.example .env
  ```

## Fill out `.env`

Before starting the container, set these required runtime values:

| Variable | What to provide |
| --- | --- |
| `AUTH0_ISSUER_BASE_URL` | The same Auth0 tenant URL, with `https://` |
| `AUTH0_AUDIENCE` | The same API audience |
| `ESPN_CREDENTIALS_KEY` | 64 hexadecimal characters; generate with `openssl rand -hex 32` |
| `MONGO_DATA_PATH` | Host directory where MongoDB data should be persisted, such as `./.docker/mongo-data` |

The published image is
`ryantrappy/fantasy-football-rankings-builder:latest`. Its `VITE_*` Auth0
settings were embedded when the image was built; changing those settings
requires publishing a new image, not only editing `.env`.

The optional Auth0 Management API and writing-assistant variables can remain empty
unless those features are needed. Do not commit `.env` or put server secrets in
`VITE_*` variables.

Runtime server settings are loaded from `.env` when the container starts.
Compose overrides `MONGODB_URI` to use
`mongodb://mongo:27017/fantasy_rankings`; do not change it to `localhost`, because
the app and MongoDB communicate over the `fantasy-internal` Docker network. The
directory in `MONGO_DATA_PATH` is bind-mounted to MongoDB's `/data/db`, so its
contents remain after containers are removed.

## Start the application

```sh
docker compose up
```

Open <http://localhost:3001>. Only the application port is published to the host;
MongoDB is reachable only by containers on the internal Compose network.

To stop the containers while retaining MongoDB data:

```sh
docker compose down
```

To remove the containers and their networks, then delete the persisted data
directory configured by `MONGO_DATA_PATH` if it is no longer needed:

```sh
docker compose down
```
