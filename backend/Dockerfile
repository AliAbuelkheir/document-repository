# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app

# ---- All dependencies (for building) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Production dependencies only ----
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- Compile TypeScript ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Runtime ----
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./

# Created here so the named volume mounted at /app/uploads inherits node ownership.
RUN mkdir -p /app/uploads && chown node:node /app/uploads

USER node
EXPOSE 4000
CMD ["node", "dist/server.js"]
