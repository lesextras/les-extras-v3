# LES EXTRAS v3 — Checklist de durcissement (Security Hardening)

> Lane **QA-Security**. À valider avant mise en production.
> Statut : ✅ fait · 🟡 partiel · 🔴 à faire · ⬜ à confirmer avec l'agent concerné.
> Cases à cocher = travail d'intégration attendu des agents Backend-Core / Web-Core / DevOps.

## 1. En-têtes HTTP & Helmet (apps/api)

- [ ] 🔴 Activer **`helmet()`** globalement dans `main.ts`.
- [ ] 🔴 `Content-Security-Policy` stricte (pas de `unsafe-inline` en prod).
- [ ] 🔴 `Strict-Transport-Security` (HSTS) `max-age=63072000; includeSubDomains; preload` (derrière TLS Coolify/Traefik).
- [ ] 🔴 `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`.
- [ ] 🔴 Désactiver l'en-tête `X-Powered-By` (`app.disable('x-powered-by')` / Nest express adapter).

## 2. CORS strict (apps/api)

- [ ] 🔴 `app.enableCors()` avec **origine allow-list** (`WEB_ORIGIN`, pas `*`).
- [ ] 🔴 `credentials: true` uniquement si cookies cross-site nécessaires ; sinon false.
- [ ] 🔴 Restreindre `methods` et `allowedHeaders` (dont `x-account-id`, `Authorization`).
- [ ] ⬜ Vérifier que la prod n'autorise que `https://app.les-extras.fr`.

## 3. Rate-limiting / anti-brute-force

- [ ] 🔴 Installer **`@nestjs/throttler`** ; `ThrottlerGuard` global.
- [ ] 🔴 Limite renforcée sur `/auth/login`, `/auth/register`, `/invitations/accept` (ex. 5/min/IP).
- [ ] 🔴 Backoff / verrouillage temporaire après N échecs de login.
- [ ] 🟡 Limite de taille de body (`json({ limit: '1mb' })`).
- [ ] 🔴 Pagination par défaut sur tous les `findMany` (anti-DoS DB).

## 4. Authentification & mots de passe

- [x] ✅ Hash **bcrypt** (jamais de mot de passe en clair) — vérifié par `auth.e2e`.
- [ ] ⬜ **Cost bcrypt ≥ 12** en prod (le cost 4 des tests ne doit JAMAIS partir en prod ; paramétrer via env/const).
- [ ] 🟡 Politique de mot de passe (longueur ≥ 10, complexité) au niveau DTO.
- [ ] 🔴 JWT court (`JWT_EXPIRES_IN` ≤ 1h idéalement) + mécanisme de **refresh token** rotatif.
- [ ] 🔴 **Rotation des secrets** `JWT_SECRET` / `SESSION_SECRET` (procédure + kid si multi-clés).
- [x] ✅ Réponses de login non énumérantes (401 uniforme) — vérifié par `auth.e2e`.
- [ ] 🔴 Vérification email obligatoire avant accès complet (`emailVerified`).

## 5. Isolation multi-tenant (cœur métier)

- [ ] ✅ `AccountGuard` : exige un `Membership ACTIVE` pour le `x-account-id` demandé.
- [ ] ✅ Toute requête Prisma scoppée par `accountId` du compte actif (lecture ET écriture).
- [ ] ✅ Ignorer tout `accountId` fourni dans le body (forcer `req.account.id`).
- [ ] 🟡 Réponse **404** (plutôt que 403) sur ressource hors périmètre, pour ne pas révéler son existence.
- [ ] 🔴 Test de non-régression en CI (`multi-tenant-isolation.e2e`) exécuté à chaque PR.
> Couverture tests : `apps/api/test/multi-tenant-isolation.e2e-spec.ts` + `rbac.e2e-spec.ts`.

## 6. Validation des entrées

- [ ] ⬜ `ValidationPipe` global : `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
- [ ] 🔴 DTO class-validator sur TOUTES les routes (types, bornes, enums).
- [x] ✅ Anti mass-assignment (`role`/`accountId` non assignables) — visé par tests.
- [ ] 🔴 Sanitisation des champs texte libres rendus en HTML (messages, descriptions) → anti-XSS stored.

## 7. Uploads

- [ ] 🔴 Whitelist **MIME + extension** ; rejeter SVG exécutable / HTML.
- [ ] 🔴 Renommer les fichiers (uuid) ; stockage **hors webroot** (`UPLOAD_DIR` non servi statiquement).
- [ ] 🔴 `Content-Disposition: attachment` au download ; pas de rendu inline.
- [ ] 🔴 Limite de taille par fichier + contrôle d'accès à la lecture (URLs signées, durée limitée).
- [ ] 🟡 Scan antivirus (ClamAV) à l'ingest — optionnel selon budget.

## 8. Cookies / CSRF (côté Web, apps/web)

- [ ] ⬜ Cookie session `lesextras_session` : `httpOnly`, `secure`, `sameSite=lax` (ou `strict`).
- [ ] 🔴 Si mutations pilotées par cookie : **protection CSRF** (double-submit token ou `sameSite=strict` + vérif Origin).
- [ ] 🟡 Si l'API est appelée en Bearer (pas de cookie cross-site), CSRF moins critique — documenter le choix.
- [ ] ⬜ Ne jamais exposer le JWT au JS client (le garder httpOnly côté serveur Next).

## 9. Logs & observabilité

- [ ] 🔴 **Ne jamais logger** : mots de passe, tokens JWT, tokens d'invitation, PII sensible.
- [ ] 🔴 Journal d'audit des actions sensibles (invite, révoquer, supprimer membre, changer rôle) : who/account/when.
- [ ] 🟡 `ExceptionFilter` global : messages génériques en prod (pas de stack ni SQL).
- [ ] ⬜ Monitoring/erreurs (Sentry) avec scrubbing des données sensibles.

## 10. RGPD / données médico-sociales

- [ ] 🔴 Registre des traitements ; base légale documentée.
- [ ] 🔴 Droit à l'effacement : suppression/anonymisation `User` + cascade (le schéma a `onDelete: Cascade` sur profil/memberships).
- [ ] 🔴 Droit d'accès / portabilité : export des données perso.
- [ ] 🔴 Minimisation : ne stocker que le nécessaire (diplômes/documents = sensibles).
- [ ] 🔴 Durées de conservation (missions closes, invitations expirées → purge planifiée).
- [ ] 🟡 Chiffrement au repos des documents sensibles (coffre-fort conformité).
- [ ] ⬜ Consentement + bannière cookies côté web ; DPA avec les sous-traitants (hébergeur, mail).

## 11. Secrets & configuration

- [ ] 🔴 Aucun secret par défaut en prod (`change-me-in-prod` interdit — fail-fast au boot si présent).
- [ ] 🔴 `.env` hors Git (déjà `.gitignore`) ; secrets injectés par Coolify.
- [ ] 🟡 Valider la présence des variables obligatoires au démarrage (config schema).
- [ ] ⬜ TLS partout (Traefik/Coolify) ; forcer HTTPS.

## 12. CI / chaîne de build

- [x] ✅ Pipeline CI : install, prisma generate, typecheck, lint, tests api+web, build (`.github/workflows/ci.yml`).
- [ ] 🟡 Ajouter `pnpm audit` / scan de dépendances (Dependabot ou `audit-ci`).
- [ ] 🟡 Bloquer la CI si les tests d'isolation multi-tenant échouent (déjà inclus dans `test`).
- [ ] ⬜ Scan de secrets committés (gitleaks) en pré-commit / CI.

---

### Prérequis d'intégration pour exécuter les tests API (Backend-Core)

Ajouter à `apps/api/package.json` (lane Backend-Core) :

- devDeps : `jest`, `ts-jest`, `@types/jest`, `@nestjs/testing`, `supertest`, `@types/supertest`,
  `@types/jsonwebtoken`, `bcrypt` (+ `@types/bcrypt`), `jsonwebtoken`.
- scripts :
  - `"test": "jest --config ./test/jest-e2e.json"`
  - `"test:e2e": "jest --config ./test/jest-e2e.json"`

Les specs supposent : `AppModule` (`src/app.module.ts`), `PrismaService`
(`src/prisma/prisma.service.ts`), `JwtModule` exposant `JwtService`, préfixe
global `/api`, auth Bearer + header `x-account-id`. Adapter uniquement
`apps/api/test/utils/test-app.ts` si ces conventions diffèrent.
