# LES EXTRAS v3 — Brief partagé des agents (À LIRE EN PREMIER)

Monorepo `les-extras-v3` — pnpm + TurboRepo. Objectif : marketplace médico-social
2026, from scratch, **parité totale avec le Symfony actuel** + **multi-comptes /
sous-comptes / invitations**. Chef d'orchestre : l'agent principal (intégration + prod).

## Racine
`/sessions/vigilant-zen-curie/mnt/Downloads/les-extras-v3` (= C:\Users\siham\Downloads\les-extras-v3)

## Stack imposée
- Backend : NestJS (latest) + Prisma + PostgreSQL + JWT. Port 3001, préfixe global `/api`.
- Frontend : Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui. Port 3000.
- Tests : Jest (api), Vitest (web). Package manager : pnpm@10.6.1.
- Schéma Prisma **déjà écrit** : `apps/api/prisma/schema.prisma` (ne pas casser ; extensions OK).

## Vocabulaire obligatoire
FREELANCE / ESTABLISHMENT (jamais talent/candidat/client/structure).

## Modèle multi-comptes (cœur)
- `User` = identité de connexion (login). `role` global = USER|ADMIN.
- `Account` = tenant : type ESTABLISHMENT (ex MECS) ou FREELANCE. `owner`.
- `Membership` = SOUS-COMPTE : User↔Account + `AccountRole` (OWNER|ADMIN|MANAGER|MEMBER).
- `Invitation` = invite email → Account, avec rôle + token + expiry + statut.
- RBAC : les permissions dépendent du `AccountRole` DANS le compte actif, pas du role global.
- Le compte actif est porté par un header `x-account-id` (API) / cookie côté web.

## Parité fonctionnelle avec le Symfony actuel (à couvrir)
Inscription (rôle FREELANCE/ESTABLISHMENT) + vérif email ; connexion JWT ; dashboard
role-based ; **SOS Renfort** : publier mission → diffusion en cascade
(SALARIES→RESERVED→PUBLIC) → candidatures → booking → contrat ; **Éducat'heures /
Ateliers** : catalogue + réservation ; planning calendrier missions ; messagerie ;
avis bidirectionnels ; factures PDF ; profil éditable (photo+infos+diplômes) ;
back-office admin (users, modération offres) ; coffre-fort conformité (documents) ;
stats ROI. NOUVEAU : comptes/sous-comptes/invitations.

## Conventions Backend (apps/api)
- Module = `x.module.ts` / `x.controller.ts` / `x.service.ts` / `dto/`.
- Guard JWT : `@UseGuards(JwtAuthGuard)` depuis `src/auth/jwt-auth.guard.ts`.
- Guard compte : `@UseGuards(AccountGuard)` + `@AccountRoles(...)` (créés par Backend-Core).
- `req.user` = { id, role } ; `req.account` = { id, role } (rôle dans le compte).
- Prisma via `src/prisma/prisma.service.ts` (import relatif).
- DTO validés avec class-validator. Réponses JSON typées.
- Modules attendus (noms EXACTS, importés dans app.module.ts par Backend-Core) :
  auth, users, accounts, memberships, invitations, missions, bookings, services,
  conversations, reviews, notifications, invoices, admin.

## Conventions Frontend (apps/web)
- App Router. Cookie session `lesextras_session` (JWT signé `SESSION_SECRET`).
- `src/lib/session.ts` (getSession) et `src/lib/api.ts` (apiRequest) créés par Web-Core.
- Groupes de routes : `(auth)`, `(onboarding)`, `(dashboard)`, `(admin)`, publiques.
- Design system "Quietly Bold" dans `src/styles` + `src/components/ui` (Web-Core).

## Design "Quietly Bold" (tokens)
- Primary teal `#0D7377` · Secondary terracotta `#C75B39` · Bg ivoire `#FAF7F2`
- Surface `#FFFFFF` · Text `#1A1A1A` / `#6B7280`. Thème clair par défaut + mode sombre assumé (bascule dans l'en-tête, `BasculeTheme`). Chaleureux, pro, micro-interactions.
- Inspiration UX : Hublo (leader remplacement médico-social) + Mediflash, différenciée par notre identité.

## Répartition (ne PAS écrire hors de ta lane pour éviter les conflits)
1. **Backend-Core** : main.ts, app.module.ts (importe TOUS les modules), config,
   prisma module, common (guards/decorators/filters), + modules auth, users,
   accounts, memberships, invitations. apps/api/package.json, tsconfig, nest-cli.
2. **Backend-Marketplace** : modules missions, bookings, services, conversations,
   reviews, notifications, invoices, admin (dossiers séparés ; NE PAS toucher app.module.ts).
3. **Web-Core** : next.config, tailwind, tsconfig, package.json, styles/tokens,
   components/ui (shadcn), components/layout (AppShell/Sidebar/Header), lib/session,
   lib/api, routes (auth) + (onboarding), providers.
4. **Web-Marketplace** : routes (dashboard), (admin), marketplace, SOS Renfort flow,
   ateliers, bookings, inbox, finance, account+invitations UI, pages publiques.
   Importe les composants de Web-Core (assume qu'ils existent aux chemins ci-dessus).
5. **QA-Security** : tests Jest/Vitest, threat model, revue isolation multi-tenant,
   hardening checklist, CI GitHub Actions (.github/workflows).
6. **DevOps-Data** : Dockerfiles api+web (multi-stage), docker-compose Coolify,
   .env, seed Prisma (apps/api/prisma/seed.ts), plan migration Symfony→v3, runbook.

## Règles Git
Tout dans un seul repo, branche `main`. Pas de PR. (Le push sera fait par l'orchestrateur.)

## Livrable attendu de chaque agent
Écrire les fichiers de ta lane, code réel et cohérent (pas de TODO vides), et
renvoyer un résumé COURT : fichiers créés + points d'intégration + hypothèses.
