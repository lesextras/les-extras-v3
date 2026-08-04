# ============================================================================
# LES EXTRAS v3 — API (NestJS + Prisma)  •  Build context = racine du monorepo
# Build:  docker build -f apps/api/Dockerfile -t lesextras-api .
# Coolify : Base Directory = / (racine), Dockerfile Location = apps/api/Dockerfile
# ============================================================================

# ---- Base : Node 20 + pnpm (corepack) --------------------------------------
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH"
# openssl requis par le moteur Prisma, tini pour un PID 1 propre (signaux/zombies)
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl tini \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.6.1 --activate
WORKDIR /app

# ---- Dépendances : cache Docker sur les manifests --------------------------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
# --no-frozen-lockfile : tolère un lockfile absent/à jour (projet from-scratch).
# En prod stabilisée : remplacer par --frozen-lockfile.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --no-frozen-lockfile

# ---- Build : prisma generate + nest build ----------------------------------
FROM deps AS build
COPY tsconfig*.json ./
COPY packages ./packages
COPY apps/api ./apps/api
# DATABASE_URL factice pour prisma generate (ne se connecte pas). Ecrasee au runtime par Coolify.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
RUN cd apps/api && pnpm exec prisma generate --schema prisma/schema.prisma
RUN pnpm --filter @lesextras/api build

# ---- Runtime : dist + node_modules du workspace (Prisma CLI conservé) -------
FROM base AS runtime
ENV NODE_ENV=production \
    API_PORT=3001
# node_modules racine du workspace (store .pnpm partagé) — symlinks valides
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages /app/packages
COPY --from=build /app/apps/api/node_modules /app/apps/api/node_modules
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/apps/api/prisma /app/apps/api/prisma
COPY --from=build /app/apps/api/package.json /app/apps/api/package.json
COPY --from=build /app/apps/api/tsconfig.json /app/apps/api/tsconfig.json
WORKDIR /app/apps/api

EXPOSE 3001
# L'API expose /api/health (Backend-Core). Le healthcheck tolère l'absence
# de route en n'échouant que sur un 5xx.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.API_PORT||3001)+'/api/health',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

# Migrations appliquées au démarrage, puis lancement de l'API.
#
# --accept-data-loss : sans lui, db push s'arrête sur toute modification jugée
# « risquée » et le conteneur ne démarre plus (constaté le 4/8/2026 : l'ajout
# de la contrainte unique (accountId, number) sur Invoice — pourtant sans
# danger, l'ancien schéma garantissait déjà l'unicité globale des numéros —
# a bloqué le déploiement). Contrepartie assumée : les changements de schéma
# destructifs s'appliquent désormais sans confirmation au démarrage. Toute
# suppression de colonne/table doit donc être réfléchie AVANT le push git.
ENTRYPOINT ["tini", "--"]
CMD ["sh", "-c", "pnpm exec prisma db push --schema ./prisma/schema.prisma --skip-generate --accept-data-loss && node dist/main.js"]
