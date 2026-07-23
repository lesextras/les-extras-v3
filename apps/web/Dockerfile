# ============================================================================
# LES EXTRAS v3 — WEB (Next.js 14 App Router, output: standalone)
# Build context = racine du monorepo
# Build:  docker build -f apps/web/Dockerfile -t lesextras-web .
# Coolify : Base Directory = / , Dockerfile Location = apps/web/Dockerfile
# PRÉREQUIS : apps/web/next.config.mjs doit contenir `output: 'standalone'`
#             (voir point d'intégration Web-Core dans DEPLOY_RUNBOOK.md)
# ============================================================================

# ---- Base : Node 20 + pnpm (corepack) --------------------------------------
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH"
RUN corepack enable && corepack prepare pnpm@10.6.1 --activate
WORKDIR /app

# ---- Dépendances -----------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --no-frozen-lockfile

# ---- Build : next build (standalone) ---------------------------------------
FROM deps AS build
# L'URL de l'API est inlinée dans le bundle client (NEXT_PUBLIC_*) au build.
ARG NEXT_PUBLIC_API_URL="http://localhost:3001/api"
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_TELEMETRY_DISABLED=1
COPY tsconfig*.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm --filter @lesextras/web build

# ---- Runtime : serveur Node standalone minimal -----------------------------
FROM node:20-slim AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
# Le build standalone embarque le strict nécessaire (server.js + node_modules tracés)
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs \
    && chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

# server.js est généré à la racine du standalone pour le package @lesextras/web
CMD ["node", "apps/web/server.js"]
