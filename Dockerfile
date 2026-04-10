# ─────────────────────────────────────────────────────────────
# Stage 1 — build
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./

# Use `npm ci` first (fast, strict), fall back to `npm install` if the
# lockfile is out of sync with package.json (e.g. on a feature branch
# that adds dependencies before the lock gets committed).
RUN npm ci || (echo "npm ci failed — stale lockfile, falling back to npm install" && npm install)

COPY . .

# Dummy PUBLIC_* env vars so the Astro hybrid build doesn't crash while
# Vite inlines `import.meta.env.PUBLIC_*` into the client bundle. Real
# values come from the runtime environment (Coolify / Hetzner).
ENV PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
    PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key \
    PUBLIC_GOOGLE_FORM_URL=https://docs.google.com/forms/d/e/placeholder/viewform

RUN npm run build

# Prune dev deps for the runtime layer
RUN npm prune --omit=dev

# ─────────────────────────────────────────────────────────────
# Stage 2 — runtime (Node SSR via @astrojs/node standalone)
# ─────────────────────────────────────────────────────────────
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
