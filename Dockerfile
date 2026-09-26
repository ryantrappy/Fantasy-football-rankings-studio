# syntax=docker/dockerfile:1

FROM node:24 AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_AUDIENCE
ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_AUDIENCE=$VITE_AUTH0_AUDIENCE
RUN npm run build

FROM node:24 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV CODEX_HOME=/app/.codex
ENV PATH="/app/codex-cli/node_modules/.bin:${PATH}"
RUN npm install --prefix /app/codex-cli @openai/codex@0.157.1 \
    && mkdir -p "$CODEX_HOME"
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
EXPOSE 3001
CMD ["sh", "-c", "PORT=${PORT:-3001} node --env-file-if-exists=.env --env-file-if-exists=.env.local .output/server/index.mjs"]
