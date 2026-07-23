# État de livraison v3 — passe d'intégration orchestrateur

## Construit (6 agents en parallèle + fondation)
- ~219 fichiers, ~14 300 lignes TS/TSX.
- **API** (`apps/api`) : 15 modules NestJS (auth, users, accounts, memberships,
  invitations, missions, bookings, services, conversations, reviews, notifications,
  invoices, admin, prisma, health) + guards multi-tenant + RBAC par compte.
- **Web** (`apps/web`) : design system Quietly Bold, AppShell role-based, landing,
  auth, onboarding, dashboard (renforts, ateliers, inbox, planning, finance, account),
  marketplace + détails, pages publiques, admin, modales (dont invitations).
- **Prisma** : schéma complet (multi-comptes/sous-comptes/invitations + entités métier).
- **Tests** : Jest (isolation multi-tenant, RBAC, invitations, bookings) + Vitest (web).
- **Sécurité** : THREAT_MODEL + SECURITY_HARDENING.
- **DevOps** : Dockerfiles api+web, docker-compose Coolify, seed, migration, runbook, CI.

## Corrigé à l'intégration (orchestrateur)
- `nav.ts` réaligné sur les routes réellement créées (les agents avaient divergé sur les noms).
- Endpoint `GET /api/health` ajouté (pour le healthcheck Docker/Coolify).
- `output: 'standalone'` ajouté à `next.config.mjs` (requis par le Dockerfile web).
- `use-toast` : ré-export vérifié présent.
- CI : `--no-frozen-lockfile` tant que `pnpm-lock.yaml` n'est pas généré.

## À faire dans un vrai environnement de build (le sandbox ne peut pas compiler)
1. `pnpm install` (génère `pnpm-lock.yaml` — à committer, puis rebasculer la CI sur `--frozen-lockfile`).
2. `pnpm prisma:generate` puis `pnpm typecheck` — corriger les éventuels écarts de types entre lanes.
3. Générer une 1re migration Prisma (`prisma migrate dev`) → dossier `apps/api/prisma/migrations`.
4. **Auth des mutations côté navigateur** : le token est en cookie httpOnly ; il faut soit un
   proxy same-origin (`/api/proxy`), soit `credentials:'include'` + CORS crédential. (Signalé par Web-Marketplace.)
5. Durcissement sécurité restant (par ordre) : `@nestjs/throttler` (rate-limit login/invitations),
   hardening uploads coffre-fort, journal d'audit multi-tenant. (Voir SECURITY_HARDENING.md.)
6. Build Docker + déploiement Coolify (runbook fourni), DNS `api.` / `app.les-extras.fr`.

## Statut
Fondation v3 **complète et cohérente au niveau code**, prête à être compilée/branchée
dans un environnement de build. Non compilée/exécutée ici (limites du sandbox : pas
d'install/build lourd possible).
