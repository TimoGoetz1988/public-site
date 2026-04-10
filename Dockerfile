# ────────────────────────────────────────────────────────────
# Stage 1 — build
# ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Prune dev deps for the runtime layer
RUN npm prune --omit=dev

# ────────────────────────────────────────────────────────────
# Stage 2 — runtime (Node SSR via @astrojs/node standalone)
# ────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 4321

# Healthcheck calls the API liveness probe.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4321/api/v1/health || exit 1

CMD ["node", "./dist/server/entry.mjs"]
