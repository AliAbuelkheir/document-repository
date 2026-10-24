# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
# `migrate deploy` runs the Prisma schema engine, which needs OpenSSL on Alpine.
RUN apk add --no-cache openssl

# ---- All dependencies (for building) ----
FROM base AS deps
# The `prisma generate` postinstall step needs the schema and the config.
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# ---- Production dependencies only (prune them, so the install scripts do not run again) ----
FROM deps AS prod-deps
RUN npm prune --omit=dev && npm cache clean --force

# ---- Compile TypeScript (app + seed) ----
FROM deps AS build
COPY . .
RUN npm run build

# ---- Runtime ----
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
# Schema + migrations for `migrate deploy`, sample files for the seed.
COPY --chown=node:node package.json prisma.config.ts ./
COPY --chown=node:node prisma ./prisma

# Create the directory here, so that the named volume at /app/uploads gets node ownership.
RUN mkdir -p /app/uploads && chown node:node /app/uploads

USER node
EXPOSE 4000
# Apply pending migrations, then replace the shell with node so it receives SIGTERM.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && exec node dist/src/server.js"]
