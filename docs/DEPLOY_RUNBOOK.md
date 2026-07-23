# Runbook de déploiement — LES EXTRAS v3 sur Coolify v4

Cible : Coolify v4 (Docker + Traefik) sur le VPS existant (celui qui héberge déjà
l'API de démo `http://168.231.86.146:8000`, EspoCRM, Mautic, Postiz…).
Repo monorepo pnpm/Turbo : `apps/api` (NestJS+Prisma), `apps/web` (Next.js 14).

Deux options d'installation Coolify :
- **Option A (recommandée)** : 3 ressources **séparées** (db, api, web) — meilleur
  contrôle des domaines/SSL/logs par service. C'est le fil directeur de ce runbook.
- **Option B** : 1 ressource **Docker Compose** avec `docker-compose.yml` de la racine.
  Plus simple, mais Traefik/labels à gérer à la main. Voir §8.

---

## 0. Pré-requis

- [ ] Repo poussé sur GitHub, branche `main`, **lockfile `pnpm-lock.yaml` commité**
      (sinon garder `--no-frozen-lockfile` dans les Dockerfiles — déjà le cas).
- [ ] **`apps/web/next.config.mjs` contient `output: 'standalone'`** (point d'intégration
      Web-Core, requis par `apps/web/Dockerfile`). Sans ça, le build web échoue.
- [ ] `apps/api/package.json` (Backend-Core) expose : `build` (nest build → `dist/main.js`),
      `prisma:generate`, `prisma:seed` ; `prisma` + `@prisma/client` + `bcrypt` en deps ;
      route `GET /api/health` pour le healthcheck.
- [ ] Sources GitHub connectées dans Coolify (GitHub App ou clé de déploiement).
- [ ] DNS : `api.les-extras.fr` et `app.les-extras.fr` → IP du VPS (A record).

---

## 1. Créer le projet

Coolify → **Projects → + New** → « LES EXTRAS v3 » → environnement `production`.

---

## 2. Ressource DB — PostgreSQL 16

Coolify → **+ New → Database → PostgreSQL 16**.
- Nom : `lesextras-db`.
- Renseigner `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` (ex. `lesextras`).
- **Ne pas exposer publiquement** le port (accès interne uniquement).
- Noter le **hostname interne** Coolify (ex. `lesextras-db`) → sert dans `DATABASE_URL`.
- Volume persistant : activé par défaut. Activer les **backups** (S3/local).

`DATABASE_URL` = `postgresql://<user>:<password>@<hostname-interne>:5432/<db>?schema=public`

---

## 3. Ressource API — NestJS

Coolify → **+ New → Application → Public/Private Repository**.
- Build Pack : **Dockerfile**.
- **Base Directory** : `/` (racine du repo — contexte de build monorepo).
- **Dockerfile Location** : `apps/api/Dockerfile`.
- **Port exposé** : `3001`.
- **Domaine** : `https://api.les-extras.fr` (Coolify gère le SSL Let's Encrypt).
- **Health check** : `GET /api/health` (déjà dans le Dockerfile).
- Variables d'env (§6).
- Le conteneur exécute **`prisma migrate deploy` au démarrage** (dans le `CMD`) — pas
  d'étape manuelle de migration au 1er déploiement.

---

## 4. Ressource WEB — Next.js

Coolify → **+ New → Application → même repo**.
- Build Pack : **Dockerfile**.
- **Base Directory** : `/`.
- **Dockerfile Location** : `apps/web/Dockerfile`.
- **Port exposé** : `3000`.
- **Domaine** : `https://app.les-extras.fr` (SSL auto).
- **Build Argument / env** : `NEXT_PUBLIC_API_URL=https://api.les-extras.fr/api`
  ⚠️ Inliné au **build** dans le bundle client → doit être défini **avant** le build,
  et pointer sur l'URL **publique** de l'API (pas le hostname interne).
- Variables d'env (§6).

---

## 5. Ordre de démarrage

1. **DB** d'abord (healthy).
2. **API** ensuite → applique les migrations au boot (`migrate deploy`) puis démarre.
3. **WEB** en dernier (dépend de l'API publique pour les appels navigateur).

En Option A, régler les dépendances via l'ordre de déploiement manuel ; en Option B
(compose), c'est géré par `depends_on` + `condition: service_healthy`.

---

## 6. Variables d'environnement (récapitulatif)

| Variable | db | api | web | Exemple / note |
|---|:--:|:--:|:--:|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | ✔ | | | secrets |
| `DATABASE_URL` | | ✔ | | `postgresql://user:pwd@lesextras-db:5432/lesextras?schema=public` |
| `JWT_SECRET` | | ✔ | | **secret fort** (openssl rand -base64 32) |
| `JWT_EXPIRES_IN` | | ✔ | | `7d` |
| `SESSION_SECRET` | | ✔ | ✔ | **même valeur** api↔web (cookie `lesextras_session`) |
| `API_PORT` | | ✔ | | `3001` |
| `API_BASE_URL` | | ✔ | | `https://api.les-extras.fr/api` |
| `WEB_ORIGIN` | | ✔ | | `https://app.les-extras.fr` (CORS) |
| `MAIL_DSN` | | ✔ | | `smtp://user:pass@smtp.hostinger.com:587` |
| `MAIL_FROM` | | ✔ | | `LES EXTRAS <no-reply@les-extras.fr>` |
| `UPLOAD_DIR` | | ✔ | | `/app/uploads` (+ volume persistant) |
| `NEXT_PUBLIC_API_URL` | | | ✔ | `https://api.les-extras.fr/api` (build-time) |
| `NODE_ENV` | | ✔ | ✔ | `production` |

> Générer les secrets : `openssl rand -base64 32`. Ne jamais commiter `.env`.

---

## 7. Migrations & Seed

- **Migrations** : automatiques au démarrage de l'API (`prisma migrate deploy`).
  Pré-requis : au moins une migration existe dans `apps/api/prisma/migrations/`
  (générée en amont via `pnpm --filter @lesextras/api exec prisma migrate dev --name init`
  puis commitée). Sans dossier `migrations`, `migrate deploy` ne fait rien → utiliser
  `prisma db push` en secours pour un premier jet.
- **Seed** (données de démo, une seule fois, hors prod réelle) :
  - Terminal du conteneur API (Coolify → API → **Terminal / Execute Command**) :
    `pnpm exec prisma db seed` **ou** `pnpm --filter @lesextras/api prisma:seed`.
  - Comptes créés — mot de passe `Password123!` :
    `admin@les-extras.fr` (ADMIN), `direction@mecs-hirondelles.fr` (MECS),
    `direction@ime-lechateau.fr` (IME), `amina.bensaid@example.com` (FREELANCE).
  - Idempotent : rejouable sans doublon.

---

## 8. Option B — Docker Compose (ressource unique)

Coolify → **+ New → Docker Compose** → coller `docker-compose.yml` (racine).
- Renseigner les variables d'env de la ressource (mêmes que §6).
- Décommenter les **labels Traefik** dans le compose (ou utiliser l'env magique Coolify
  `SERVICE_FQDN_API_3001` / `SERVICE_FQDN_WEB_3000`) pour attacher domaines + SSL.
- Retirer/neutraliser les `ports:` publiés (`5432`, `3001`, `3000`) en prod : seuls les
  domaines Traefik doivent être exposés ; le réseau interne `lesextras` suffit entre services.

---

## 9. Vérifications post-déploiement (smoke test)

- [ ] `https://api.les-extras.fr/api/health` → 200.
- [ ] Logs API : « migrate deploy » OK, pas d'erreur Prisma.
- [ ] `https://app.les-extras.fr` charge (pas de 502 → sinon voir §10).
- [ ] Login avec un compte seedé fonctionne (JWT + cookie session).
- [ ] Appels API depuis le web OK (vérifier `NEXT_PUBLIC_API_URL` + CORS `WEB_ORIGIN`).
- [ ] Certificats SSL délivrés sur les deux domaines.

---

## 10. Dépannage rapide

- **502 Bad Gateway** : le conteneur écoute-t-il sur le bon port (3001/3000) et
  `HOSTNAME=0.0.0.0` (web) ? Healthcheck vert ? Domaine mappé au bon port ?
- **Web build échoue** : `output: 'standalone'` absent de `next.config.mjs` (§0).
- **API crash au boot** : `DATABASE_URL` faux / DB pas encore healthy / dossier
  `prisma/migrations` absent. Vérifier l'ordre de démarrage (§5).
- **Prisma « engine not found »** : image runtime sans `openssl` — déjà installé dans
  le Dockerfile API ; si base changée, réajouter `openssl`.
- **Appels API 401/CORS** : `SESSION_SECRET` différent entre api/web, ou `WEB_ORIGIN`
  ne correspond pas au domaine du web.

---

## 11. Rollback

- Coolify garde l'historique des déploiements par ressource → **Redeploy** une version
  antérieure (bouton « Rollback » / choisir un commit précédent) pour api et/ou web.
- **DB** : ne jamais « rollback » une migration en prod sans stratégie. Restaurer depuis
  un **backup Postgres** (§2) si une migration a corrompu les données. Les migrations
  Prisma s'appliquent en avant uniquement (`migrate deploy`).
- Procédure sûre : 1) repointer le domaine sur l'ancienne image API, 2) restaurer le
  dump DB compatible si le schéma a changé, 3) réappliquer.
