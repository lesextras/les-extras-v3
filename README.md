# LES EXTRAS v3

Marketplace médico-social nouvelle génération (2026) — **FREELANCE × ESTABLISHMENT**.
Réécriture complète *from scratch* de l'app Symfony, avec en plus la gestion
**multi-comptes / sous-comptes / invitations**.

## Stack
- **Frontend** : Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui — design "Quietly Bold".
- **Backend** : NestJS + Prisma + PostgreSQL + JWT.
- **Monorepo** : pnpm + TurboRepo. **Déploiement** : Docker + Coolify v4.

## Structure
```
apps/
  api/   → API NestJS (15 modules) — port 3001, préfixe /api
  web/   → Front Next.js 14 — port 3000
packages/
docs/    → Brief agents, threat model, hardening, migration, runbook
```

## Démarrage local
```bash
cp .env.example .env          # renseigner DATABASE_URL, JWT_SECRET, SESSION_SECRET
pnpm install
pnpm prisma:generate
pnpm prisma:migrate           # crée le schéma en base
pnpm prisma:seed              # données de démo (comptes, freelances, missions...)
pnpm dev                      # web:3000 + api:3001
```

## Comptes de démo (après seed) — mot de passe `Password123!`
- `admin@les-extras.fr` (ADMIN plateforme)
- `direction@mecs-hirondelles.fr` (ESTABLISHMENT — MECS)
- `direction@ime-lechateau.fr` (ESTABLISHMENT — IME)
- `amina.bensaid@example.com` (FREELANCE)

## Fonctionnalités couvertes (parité Symfony + nouveautés)
Inscription/verif email, connexion JWT, dashboard role-based, **SOS Renfort** (publication
→ diffusion en cascade SALARIES→RESERVED→PUBLIC → candidatures → booking), **Ateliers /
Éducat'heures**, planning, messagerie, avis, factures, profil éditable, back-office admin,
coffre-fort conformité, stats ROI, et **comptes / sous-comptes / invitations** (RBAC par compte).

## Déploiement
Voir `docs/DEPLOY_RUNBOOK.md` (Coolify) et `docker-compose.yml`.

## Docs
`docs/AGENT_BRIEF.md` · `docs/THREAT_MODEL.md` · `docs/SECURITY_HARDENING.md` ·
`docs/MIGRATION_SYMFONY_TO_V3.md` · `docs/DEPLOY_RUNBOOK.md`
