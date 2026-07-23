# Migration des données — Symfony (adepa-app-v2, MySQL) → LES EXTRAS v3 (Postgres)

But : reprendre les données de l'app Symfony actuellement en production (clone
`adepa-app-v2`, base **MySQL**) vers le nouveau schéma **Prisma / PostgreSQL** de v3,
en créant au passage le modèle **multi-comptes / sous-comptes / invitations** qui
n'existe pas dans l'ancienne app.

> Principe directeur : **on ne migre pas les mots de passe hashés Symfony tels quels
> s'ils ne sont pas bcrypt.** Voir §5 (auth).

---

## 1. Stratégie générale

```
MySQL (Symfony)  --mysqldump-->  dump.sql / CSV
        │
        ▼
  Script Node de transform (ETL)  ──  lecture MySQL (mysql2)
        │                              écriture Postgres (@prisma/client)
        ▼
  PostgreSQL v3 (schema.prisma)
```

Étapes :
1. **Geler** l'app Symfony (mode maintenance / lecture seule) le temps de l'export.
2. **Exporter** MySQL (`mysqldump` complet + dumps CSV par table utile).
3. **Transformer** via un script Node idempotent (`scripts/migrate-symfony.ts`) qui lit
   MySQL et écrit dans Postgres avec `@prisma/client` (upsert, ordre des dépendances).
4. **Vérifier** (comptages, échantillons, intégrité des FK) — voir checklist §7.
5. **Bascule** DNS/domaines vers v3.

L'ETL tourne **après** `prisma migrate deploy` (le schéma v3 doit exister).

---

## 2. Mapping des entités Symfony → modèles Prisma

> Les noms de tables/colonnes Symfony ci-dessous sont à **confirmer** sur le dump réel
> (`SHOW TABLES;` puis `DESCRIBE <table>;`). Adapter le script en conséquence.

| Symfony (MySQL)                     | Prisma v3 (Postgres)            | Notes |
|-------------------------------------|---------------------------------|-------|
| `user`                              | `User` (+ `Account` + `Membership`) | 1 user → 1 identité ; voir §3 pour comptes |
| `user` (champs profil freelance)    | `Profile`                       | bio, métier, SIRET, ville, tarif, diplôme |
| `user` (établissement)              | `Account` type ESTABLISHMENT    | 1 établissement Symfony → 1 Account |
| `mission` / `offre` / `renfort`     | `ReliefMission`                 | SOS Renfort |
| `service` / `educatheure` / `atelier` | `Service`                     | catalogue ateliers / Éducat'heures |
| `booking` / `reservation` / `candidature` | `Booking`                 | statut ← mapping enum (§4) |
| `contract` / `contrat`              | `Booking` (statut) + `Invoice`  | contrat = booking confirmé + facture |
| `review` / `avis`                   | `Review`                        | bidirectionnel author/target |
| `message` + `conversation`/`thread` | `Conversation` + `Message`      | |
| `notification`                      | `Notification`                  | `type` en String libre |
| `invoice` / `facture`               | `Invoice`                       | `number` unique obligatoire |
| `document` / `media` (diplômes…)    | `Document`                      | coffre-fort conformité |

### Champs sans équivalent
- **Nouveaux (créés par la migration, pas dans Symfony)** : `Membership`, `Invitation`,
  `Account.slug`, `Account.credits`. Générés/valorisés par le script (§3).
- **Abandonnés** : colonnes techniques Symfony (`roles` JSON, `is_verified`, timestamps
  Doctrine) → remappées vers `role`/`status`/`emailVerified`/`createdAt`.

---

## 3. Comptes & sous-comptes (le cœur de la migration)

L'app Symfony est **mono-utilisateur par structure** : pas de notion de compte partagé.
Règles de création :

1. **Chaque établissement existant** (user Symfony de type établissement / structure)
   → 1 `Account` `type = ESTABLISHMENT`, `slug` = slugify(nom), `ownerId` = user migré.
   Le user devient **`Membership` OWNER** de son Account.
2. **Chaque freelance existant** → 1 `Account` `type = FREELANCE` (compte perso),
   `ownerId` = user, + `Membership` OWNER + `Profile`.
3. **Slug** : `slugify(name)` avec suffixe `-2`, `-3`… en cas de collision (contrainte
   unique `Account.slug`).
4. **Invitations** : aucune donnée source → table vide au départ (les établissements
   inviteront leurs collègues dans v3). Optionnel : pré-générer des invitations `PENDING`
   à partir d'une liste RH fournie.
5. **Rattachement des données** : `ReliefMission.accountId`, `Service.accountId`,
   `Booking.accountId`, `Invoice.accountId` = l'Account créé pour la structure/freelance
   propriétaire de l'enregistrement Symfony.

Table de correspondance en mémoire pendant l'ETL :
`symfonyUserId (int) → { userId, accountId }` — indispensable pour recâbler les FK.

---

## 4. Mapping des valeurs (enums)

À ajuster selon les valeurs réelles côté Symfony. Exemples :

- **Rôle global** : `ROLE_ADMIN` → `GlobalRole.ADMIN`, sinon `USER`.
- **UserStatus** : `is_verified=1` → `VERIFIED`, sinon `PENDING` ; banni → `BANNED`.
- **MissionStatus** : `brouillon→DRAFT`, `publiée→PUBLISHED`, `pourvue→FILLED`,
  `terminée/clôturée→CLOSED`, `annulée→CANCELLED`.
- **MissionVisibility** : par défaut `PUBLIC` ; si diffusion restreinte connue →
  `SALARIES` / `RESERVED`.
- **BookingStatus** : `en_attente→REQUESTED`, `acceptée→ACCEPTED`,
  `confirmée→CONFIRMED`, `en_cours→IN_PROGRESS`, `terminée→COMPLETED`,
  `annulée→CANCELLED`.
- **InvoiceStatus** : `brouillon→DRAFT`, `émise→ISSUED`, `payée→PAID`, `annulée→CANCELLED`.
- **MissionCategory / ServiceCategory** : mapper les libellés métier vers l'enum le plus
  proche ; à défaut `RENFORT` / `ATELIER`.

Types : montants MySQL `DECIMAL`/`FLOAT` → `Decimal` Prisma (passer une **string**).
Dates MySQL `DATETIME` → `Date` JS. Champs horaires texte (`"09h00"`) conservés tels quels.

---

## 5. Authentification / mots de passe

- Symfony hash souvent en **bcrypt** (`$2y$…`) : bcrypt est **compatible** avec la lib
  `bcrypt` de v3 → on peut **réutiliser le hash tel quel** (juste normaliser `$2y$`↔`$2b$`
  si besoin, ils sont interopérables).
- Si l'ancien hash est **argon2id** ou autre : ne pas tenter de convertir. Migrer les
  users avec un mot de passe aléatoire + `emailVerified=false` et **forcer un
  « mot de passe oublié »** au premier login (envoi email de reset).
- Vérifier l'algorithme réel dans `security.yaml` / `config/packages/security.yaml`.

---

## 6. Script ETL (squelette)

`scripts/migrate-symfony.ts` (hors périmètre du build applicatif, lancé à la main) :

```ts
import mysql from 'mysql2/promise';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const my = await mysql.createConnection(process.env.MYSQL_URL!);
  // 1. users -> User + Account(OWNER) + Profile
  const [users] = await my.query('SELECT * FROM user');
  const map = new Map<number, { userId: string; accountId: string }>();
  for (const u of users as any[]) {
    const user = await prisma.user.upsert({ where: { email: u.email }, update: {}, create: { /* mapping */ } });
    const account = await prisma.account.upsert({ where: { slug: slugify(u.name) }, update: {}, create: { /* type, ownerId: user.id */ } });
    await prisma.membership.upsert({ where: { userId_accountId: { userId: user.id, accountId: account.id } }, update: {}, create: { userId: user.id, accountId: account.id, role: 'OWNER' } });
    map.set(u.id, { userId: user.id, accountId: account.id });
  }
  // 2. missions, services, bookings, invoices, reviews, messages … en réutilisant `map`
  // (respecter l'ordre des dépendances FK)
  await my.end();
  await prisma.$disconnect();
}
run();
```

Idempotence : **upsert partout**, clés naturelles (`email`, `slug`, `Invoice.number`),
sinon id déterministe dérivé de l'id Symfony (ex. `sf-mission-<id>`).

---

## 7. Checklist de migration

- [ ] `mysqldump` complet sauvegardé + copie hors-serveur.
- [ ] `SHOW TABLES` / `DESCRIBE` documentés, mapping colonnes confirmé.
- [ ] Postgres v3 provisionné, `prisma migrate deploy` OK (schéma présent).
- [ ] Algorithme de hash Symfony identifié (§5) → stratégie mot de passe tranchée.
- [ ] ETL lancé sur un **dump de staging** d'abord (dry-run).
- [ ] Comptages cohérents : `users`, `accounts` (= établissements + freelances),
      `missions`, `services`, `bookings`, `invoices`, `reviews`.
- [ ] FK vérifiées : aucun `accountId`/`userId` orphelin.
- [ ] Chaque structure a **1 Membership OWNER** ; slugs uniques.
- [ ] Montants `Decimal` corrects (pas d'arrondi/virgule perdue).
- [ ] Échantillon manuel : 3 établissements + 3 freelances relus dans l'UI v3.
- [ ] Emails de reset envoyés (si hash non réutilisable).
- [ ] Rejeu de l'ETL sans doublon (idempotence confirmée).
- [ ] Bascule DNS + `NEXT_PUBLIC_API_URL` mis à jour + ancienne app en lecture seule.
