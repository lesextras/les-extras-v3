# Import : ancienne application SaaS Les Extras

Cette branche `legacy-saas` contient **une application différente et indépendante**
de celle qui vit sur `main`.

- Origine : archive `SAAS-LES-EXTRAS--main.zip` (Google Drive, 27/07/2026)
- Nature : monorepo Next.js 14 + NestJS + Prisma — l'ancienne application
  qui tournait sur desk.les-extras.com, dont le code était introuvable jusqu'ici.
- Déploiement : https://saas.les-extras.fr (projet Coolify séparé, base séparée)

## Ce qui a été modifié à l'import

Uniquement `docker-compose.coolify.yml`, pour neutraliser les domaines codés
en dur (`les-extras.com`, `www`, `api.les-extras.com`, `desk.les-extras.com`).
Laissés tels quels, les libellés Traefik auraient détourné le routage des
domaines de production. Ils pointent désormais sur `saas.les-extras.fr` et
`api-saas.les-extras.fr`.

Le reste du code est **strictement identique à l'archive**.

## Isolation

Cette branche ne partage rien avec `main` : historique distinct, projet
Coolify distinct, base de données distincte, sous-domaines distincts.
