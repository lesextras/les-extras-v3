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
# Les variables NEXT_PUBLIC_* sont INLINÉES DANS LE BUNDLE AU MOMENT DU BUILD :
# elles doivent donc être connues ici, pas au démarrage du conteneur. Une
# variable ajoutée côté hébergeur sans être déclarée en ARG n'atteint jamais le
# build, et le code la lit alors comme `undefined` en production — sans la
# moindre erreur, ce qui la rend très difficile à repérer.
ARG NEXT_PUBLIC_API_URL="http://localhost:3001/api"
# MESURE DES CONVERSIONS PUBLICITAIRES.
#
# Vides par défaut, et c'est volontaire : `identifiantAds()` renvoie alors une
# chaîne vide, `mesureConfiguree()` est faux, et aucun script de mesure n'est
# chargé. Un environnement de développement ou de recette ne pollue donc pas
# les statistiques du compte publicitaire.
#
# En production, ces deux valeurs doivent être renseignées côté hébergeur AVANT
# le build (Coolify : variables d'environnement de l'application), faute de
# quoi la campagne tourne sans qu'aucune conversion ne remonte : on paie des
# clics sans jamais savoir lesquels ont produit une inscription.
ARG NEXT_PUBLIC_GOOGLE_ADS_ID=""
ARG NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_INSCRIPTION=""
# Mesure d'audience (Google Analytics 4, « G-… »). Distincte de l'identifiant
# Ads : la première mesure l'audience, la seconde attribue les conversions
# payantes. Les deux coexistent sur une même balise.
ARG NEXT_PUBLIC_GA4_ID=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_GOOGLE_ADS_ID=$NEXT_PUBLIC_GOOGLE_ADS_ID \
    NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_INSCRIPTION=$NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_INSCRIPTION \
    NEXT_PUBLIC_GA4_ID=$NEXT_PUBLIC_GA4_ID \
    NEXT_TELEMETRY_DISABLED=1
COPY tsconfig*.json ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN pnpm --filter @lesextras/web build

# ---- sharp : le moteur d'images, à part ------------------------------------
# SANS `sharp`, l'optimiseur d'images de Next répond 200 mais renvoie le fichier
# d'origine octet pour octet : ni redimensionnement, ni WebP. C'est exactement
# ce que faisait la production (accueil : 1,17 Mo d'images brutes, dont une
# JPEG de 345 Ko), et c'est pourquoi les dix `next/image` du dépôt portaient
# `unoptimized` — le drapeau ne faisait qu'acter la panne.
#
# Il s'installe dans un étage SÉPARÉ, jamais dans /app : un `npm install` lancé
# à la racine du standalone réconcilierait `node_modules` avec le `package.json`
# que Next y écrit, et supprimerait les dépendances qu'il vient de tracer.
# Même image de base que le runtime → le binaire natif correspond.
FROM node:20-slim AS sharp
WORKDIR /sharp
RUN npm init -y >/dev/null \
    && npm install --omit=dev sharp@0.33.5 \
    && node -e "require('/sharp/node_modules/sharp')"

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
# Greffe de sharp et de ses dépendances (color, detect-libc, semver, @img/*).
# Le build ÉCHOUE si `require('sharp')` ne passe pas : mieux vaut un déploiement
# refusé qu'une image qui repart silencieusement servir des JPEG de 345 Ko.
COPY --from=sharp /sharp/node_modules/ ./node_modules/
RUN node -e "const s=require('sharp'); console.log('sharp', s.versions.sharp, 'libvips', s.versions.vips)"

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs \
    && chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:'+(process.env.PORT||3000)+'/',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"

# server.js est généré à la racine du standalone pour le package @lesextras/web
CMD ["node", "apps/web/server.js"]
