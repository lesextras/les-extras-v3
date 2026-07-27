# LesExtras Monorepo

Monorepo TurboRepo avec :

- `apps/web` : Next.js 14 + Tailwind CSS + base Shadcn UI
- `apps/api` : NestJS + Prisma

## Démarrage

```bash
npm install
npm run dev
```

## Seed démo (LesExtras)

Pré-requis: configurer `DATABASE_URL` pour `apps/api`.

```bash
npm run prisma:migrate
npm run prisma:seed
```

Comptes démo seedés:

- `directeur@mecs-avenir.fr`
- `karim.educ@gmail.com`
- `admin@lesextras.local`

Le mot de passe seed est piloté par:

- `SEED_DEMO_PASSWORD` (prioritaire)
- sinon `DEMO_USER_PASSWORD`
- sinon fallback `password123`

## Déploiement Coolify v4 (3 services Dockerfile)

Production cible:

- `Front` (web client): `les-extras.com`
- `Desk` (web admin): `desk.les-extras.com`
- `API` (Nest): `api.les-extras.com`
- `DB`: service managé/externe (pas de stack compose prod)

### Dockerfiles utilisés

- Web (Front + Desk): `apps/web/Dockerfile`
- API: `apps/api/Dockerfile`

Le fichier `docker-compose.coolify.yml` reste utile pour local/backup, mais n'est plus le mode recommandé pour la prod.

### Variables Coolify par service

#### Service Front

- `APP_RUNTIME=front`
- `API_BASE_URL=https://api.les-extras.com/api`
- `NEXT_PUBLIC_API_URL=https://api.les-extras.com/api`
- `DEMO_USER_PASSWORD=password123`

#### Service Desk

- `APP_RUNTIME=desk`
- `API_BASE_URL=https://api.les-extras.com/api`
- `NEXT_PUBLIC_API_URL=https://api.les-extras.com/api`
- `JWT_SECRET=<identique a l'API>`
- `DEMO_USER_PASSWORD=password123`

#### Service API

- `DATABASE_URL=<postgres-url-complete>`
- `JWT_SECRET=<secret-jwt>`
- `JWT_EXPIRES_IN=7d`
- `CORS_ORIGINS=https://les-extras.com,https://www.les-extras.com,https://desk.les-extras.com,https://api.les-extras.com`
- `SEED_DEMO_PASSWORD=password123`
- `PORT=3001`

### Procédure Coolify

1. Créer 3 applications séparées (Build Pack Dockerfile).
2. Configurer le repository Git identique sur les 3 apps.
3. Paramétrer les Dockerfiles:
   - Front: `apps/web/Dockerfile`
   - Desk: `apps/web/Dockerfile`
   - API: `apps/api/Dockerfile`
4. Définir les domaines:
   - Front -> `les-extras.com`
   - Desk -> `desk.les-extras.com`
   - API -> `api.les-extras.com`
5. Déclarer les variables d'environnement ci-dessus.
6. Déployer API d'abord, puis Front et Desk.

### Healthchecks Coolify recommandes

#### Front / Desk

- Method: `GET`
- Scheme: `http`
- Host: `127.0.0.1`
- Port: `3000`
- Path: `/health`
- Return Code: `200`
- Response Text: vide

#### API

- Method: `GET`
- Scheme: `http`
- Host: `127.0.0.1`
- Port: `3001`
- Path: `/api/health`
- Return Code: `200`
- Response Text: vide

Au démarrage API, les migrations Prisma sont exécutées automatiquement via l'entrypoint (`prisma migrate deploy`).

## Routing multi-domaines (prod)

- Mode Front (`APP_RUNTIME=front`):
  - `/` redirige vers `/marketplace`
  - `/admin*` redirige vers `/marketplace`
- Mode Desk (`APP_RUNTIME=desk`):
  - `/` et routes non admin redirigent vers `/admin`
  - `/admin/login` public
  - `/admin*` protégé par session admin JWT

## Checklist DNS (avant go-live)

1. Créer un enregistrement DNS pour `les-extras.com`.
2. Créer un enregistrement DNS pour `desk.les-extras.com`.
3. Créer un enregistrement DNS pour `api.les-extras.com`.
4. Vérifier TLS sur les 3 domaines.
