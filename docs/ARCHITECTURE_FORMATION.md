# Architecture — Branche « Centre de formation / Qualiopi »

> Document d'architecture pour l'ajout du module Formation à LES EXTRAS v3.
> Statut : proposition d'intégration (analyse + plan). Aucun code applicatif modifié.
> Auteur : architecture. Date : 2026-07-23.

---

## 0. TL;DR — la recommandation en 6 lignes

1. **Formation = entité(s) séparée(s), PAS une extension de `Service`.** Le modèle `Service`/`Booking` est une relation 1↔1 (un freelance ↔ un établissement, une prestation ponctuelle). Une formation est 1↔N (une session = plusieurs apprenants, chacun avec son financement, son émargement, son évaluation, son attestation puis son certificat). Réutiliser `Service` créerait une dette structurelle immédiate.
2. On crée **3 modules API** : `formations` (cœur : programme + session + inscription), `qualiopi` (conformité), `tutorat` (accompagnement). Le module `documents` existant (kind générique) sert d'ancrage aux preuves/attestations.
3. Prisma : nouveaux modèles `Formation`, `FormationSession`, `Inscription`, `Emargement`, `Attestation` + module Qualiopi (`QualiopiCriterion`/`QualiopiIndicator`/`QualiopiProof`) + Tutorat (`Tutorat`/`Entretien`/`Jalon`). **Réutilisation** de `Account`, `Membership`, `User`, `Category` (nouveau `type = "formation"`), `Invoice`, `Notification`, `Document`.
4. Deux parcours pilotés par un seul enum `FormationType { CERTIFIANTE, INTERNE }` qui conditionne : qui crée, financement autorisé, Qualiopi appliqué ou non, attestation seule vs attestation+certificat.
5. Navigation : on **respecte le regroupement existant** (Activité / Catalogue / Mon espace). « Formations » s'ajoute dans **Catalogue** pour freelance & établissement, la formation interne va dans **Activité** de l'établissement, et l'ADMIN reçoit une nouvelle section dédiée **« Centre de formation »** (+ Qualiopi).
6. EDOF : pas d'API publique → on ne synchronise pas. On produit un **registre**, le **BPF** (Bilan Pédagogique et Financier) et des **exports** (CSV/PDF) que l'OF ressaisit sur EDOF.

---

## 1. Architecture actuelle (état des lieux)

### 1.1 Modules API (`apps/api/src`)

| Module | Route | Rôle |
|--------|-------|------|
| `auth` | `/api/auth` | register, login, JWT |
| `users` | `/api/users` | profil, onboarding, `me` |
| `accounts` | `/api/accounts` | comptes (tenants) |
| `memberships` | `/api/memberships` | sous-comptes (User↔Account + rôle interne) |
| `invitations` | `/api/invitations` | invitations par email + token |
| `missions` | `/api/missions` | `ReliefMission` (SOS Renfort) + candidatures |
| `bookings` | `/api/bookings` | cycle de vie Booking |
| `services` | `/api/services` | Ateliers (catalogue freelance) |
| `conversations` | `/api/conversations` | messagerie |
| `reviews` | `/api/reviews` | avis bidirectionnels |
| `notifications` | `/api/notifications` | notifications in-app |
| `invoices` | `/api/invoices` | factures PDF |
| `matching` | `/api/matching` | scoring multi-critères |
| `planning` | `/api/planning` | disponibilités + shifts |
| `categories` | `/api/categories` | taxonomie éditable |
| `admin` | `/api/admin/*` | back-office (users, missions, services, comptes, catégories, articles, réservations, factures, stats) |

**Convention module** (à recopier) : `xxx.module.ts` / `xxx.controller.ts` / `xxx.service.ts` / `dto/`. Guard `@UseGuards(JwtAuthGuard)`, utilisateur courant via `req.user` (`AuthRequest` = `{ id, role }`), Prisma en **import relatif** `../prisma/prisma.service`, DTO en `class-validator`. Un module qui notifie importe `NotificationsModule` (voir `services.module.ts`).

### 1.2 Modèles Prisma clés

- **Identité / multi-comptes** : `User` (identité de connexion, `role` global USER|ADMIN) → `Membership` (rattachement à un `Account` avec `AccountRole` OWNER|ADMIN|MANAGER|MEMBER) → `Account` (tenant : `type` ESTABLISHMENT|FREELANCE). `Invitation` pour inviter par email. `Profile` porte `skills[]` et `job` côté freelance.
- **Marketplace** : `ReliefMission` (renfort, publiée par un établissement) et `Service` (atelier, proposé par un freelance) ; les deux référencent `Category` via `categoryId`/`categoryRef`. `Booking` relie un compte à une mission **ou** un service (1↔1, avec `Review`, `Invoice`, `Shift` en dérivé).
- **Transverse** : `Conversation`/`Message`, `Review`, `Notification`, `Invoice`, `Document` (générique, `kind` = avatar/diploma/siret/contract…), `Category` (arborescente, `type` = mission/service/article/**educatheure**…), `Article`.
- **Planning** : `Availability`, `Shift`.

> Détail important : `ServiceCategory` contient déjà `FORMATION`, et l'écran admin **« Éducat'heures »** filtre les services `FORMATION`/`ATELIER`. C'est aujourd'hui une **simple étiquette de catalogue** — aucune notion de session multi-apprenants, d'émargement, de financement ni de certificat. C'est exactement la limite qui justifie une entité séparée (§3).

### 1.3 Navigation par rôle (`apps/web/src/lib/nav.ts`)

Structure récemment refondue en **sections regroupées** identiques pour chaque rôle : un item libre (Tableau de bord), puis **Activité**, **Catalogue**, **Mon espace**.

- **FREELANCE** : Activité (Opportunités, Mon planning, Messagerie) · Catalogue (Marketplace, Mes ateliers) · Mon espace (Factures & revenus, Mon compte).
- **ESTABLISHMENT** : Activité (SOS Renfort, Planning, Messagerie) · Catalogue (Marketplace, Ateliers) · Mon espace (Équipe & invitations, Factures).
- **ADMIN** : Contenu (Articles, Catégories) · Administration (Établissements, Ateliers, Utilisateurs) · **ADéPA** (Réservations, Missions, Éducat'heures) · Facturation (Factures) · Pilotage (Statistiques).

`resolveNavRole()` déduit le rôle UI : ADMIN global prime, sinon `AccountType`.

### 1.4 Groupes de routes web (`apps/web/src/app`)

- `(auth)` : /login, /register.
- `(dashboard)` : espace authentifié (AppShell + OnboardingGuard). Sous-routes : `dashboard/{opportunites, renforts, planning, inbox, ateliers, finance, account}`.
- `marketplace` : `missions/[id]`, `services/[id]` (catalogue authentifié).
- `(public)` : `ateliers/[id]`, `freelances/[id]`, `etablissements`, `legal`.
- `(admin)` : `admin/{articles, categories, etablissements, ateliers, utilisateurs, reservations, missions, educatheures, factures, statistiques}`.
- `(onboarding)` : /welcome, /wizard.
- `_shared/` : composants serveur + tables/managers admin réutilisés (`server.ts`, `ui.tsx`, `types.ts`, `Admin*Table.tsx`…).

---

## 2. Vision fonctionnelle de la branche Formation

Deux parcours coexistent sous une même ossature de données.

### Parcours A — CERTIFIANT (catalogue ADéPA, Qualiopi)
Catalogue ADéPA (ADéPA = OF certifié Qualiopi) → **formateur = FREELANCE** → éligible **CPF** → Qualiopi appliqué → **attestation puis CERTIFICAT** délivré.
Cycle : **catalogue → session → inscrits → émargement → attestation → certificat → facturation**.

### Parcours B — INTERNE (établissement, sans Qualiopi)
Un **ESTABLISHMENT** sollicite un de ses **SALARIÉS** (un `Membership` du compte dont le `Profile.skills` liste une compétence « formation ») pour former ses collègues.
Parcours **simplifié, SANS Qualiopi** (formateur ponctuel), **attestation interne**, **pas de CPF**.

---

## 3. Décision d'architecture : entité séparée vs extension de `Service`

### Recommandation : **entité séparée** (`Formation` + `FormationSession` + `Inscription`).

| Critère | `Service` (atelier) | `Formation` |
|--------|---------------------|-------------|
| Cardinalité | 1 prestation ↔ 1 booking (1 client) | 1 session ↔ N apprenants |
| Objet réservé | le service lui-même | une **session datée** distincte du programme |
| Financement | prix simple sur `Booking.totalAmount` | par apprenant : CPF / OPCO / établissement / perso / interne |
| Suivi individuel | inexistant | émargement + évaluation + attestation **par apprenant** |
| Livrable | aucun | attestation → **certificat** (parcours certifiant) |
| Conformité | aucune | **Qualiopi** (7 critères / 32 indicateurs + preuves) |
| Formateur | = propriétaire du service | freelance (certifiant) **ou** salarié-membre (interne) |

Étendre `Service` obligerait à greffer des colonnes nullables massives (financement, émargement, certification) sur un modèle 1↔1, et à surcharger `Booking` d'une logique multi-apprenants qu'il n'a pas. **Coût de dette élevé, lisibilité faible.** L'entité séparée isole proprement le cycle formation tout en réutilisant l'ossature transverse.

### Ce qu'on RÉUTILISE (anti-duplication)
- `Account` / `Membership` / `User` / `Profile` : formateur, apprenants, établissement, OF ADéPA — aucune nouvelle notion d'identité.
- `Category` (nouveau `type = "formation"`) : thématiques du catalogue, éditables depuis l'admin existant.
- `Invoice` : la facturation formation branche sur le modèle facture existant (nouveau lien optionnel `inscriptionId`/`sessionId`).
- `Notification`, `Document` (kind = `attestation`, `certificat`, `emargement`, `qualiopi_proof`), `Conversation` (échanges apprenant/formateur).
- `Availability`/`Shift` : le planning du formateur peut réutiliser `Shift` (lien `sessionId` optionnel) pour ne pas dupliquer la couche planning.

### Ce qu'on retire/renomme (léger, évident)
- L'écran admin **« Éducat'heures »** (filtre FORMATION sur `Service`) est remplacé par le vrai **« Centre de formation »**. On garde `ServiceCategory.FORMATION` pour les ateliers-formation ponctuels non certifiants qui restent de simples prestations, mais on **documente** que « formation diplômante/certifiante/interne à sessions » = le nouveau module, pas une catégorie de service.

---

## 4. Schéma Prisma proposé

> Convention : `cuid()`, `createdAt`/`updatedAt`, index sur FK + statuts. À placer dans `apps/api/prisma/schema.prisma` après le bloc Marketplace.

```prisma
// ---------------------------------------------------------------------------
// CENTRE DE FORMATION (Qualiopi) — programme / session / inscription
// ---------------------------------------------------------------------------

/// PROGRAMME de formation (le "quoi"). Catalogue ADéPA (certifiant) OU interne établissement.
model Formation {
  id             String          @id @default(cuid())
  type           FormationType   @default(CERTIFIANTE)
  /// Compte propriétaire du programme : ADéPA (OF) pour le certifiant, l'établissement pour l'interne.
  ownerAccountId String
  ownerAccount   Account         @relation("FormationOwner", fields: [ownerAccountId], references: [id], onDelete: Cascade)
  title          String
  slug           String          @unique
  summary        String?
  objectives     String?         // objectifs pédagogiques (Qualiopi crit. 1)
  prerequisites  String?
  program        String?         // contenu détaillé
  targetAudience String?         // public visé
  durationHours  Int?
  categoryId     String?
  categoryRef    Category?       @relation("FormationCategoryRef", fields: [categoryId], references: [id], onDelete: SetNull)
  // Éligibilité / certification
  cpfEligible    Boolean         @default(false)   // toujours false si type = INTERNE
  certifying     Boolean         @default(false)   // délivre un certificat (vs attestation seule)
  certificationName String?      // ex: "RS1234 - ..."
  edofRef        String?         // référence EDOF (saisie manuelle, pas d'API)
  status         FormationStatus @default(DRAFT)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  sessions       FormationSession[]
  @@index([type, status])
  @@index([ownerAccountId])
}

/// SESSION : instance datée d'un programme (le "quand/où/avec qui").
model FormationSession {
  id              String         @id @default(cuid())
  formationId     String
  formation       Formation      @relation(fields: [formationId], references: [id], onDelete: Cascade)
  /// Formateur : FREELANCE (certifiant) OU salarié-membre (interne). C'est un User.
  trainerId       String?
  trainer         User?          @relation("SessionTrainer", fields: [trainerId], references: [id], onDelete: SetNull)
  /// Compte organisateur (utile pour l'interne : l'établissement hôte).
  hostAccountId   String?
  hostAccount     Account?       @relation("SessionHost", fields: [hostAccountId], references: [id], onDelete: SetNull)
  title           String?        // libellé de session (sinon hérite du programme)
  startDate       DateTime
  endDate         DateTime?
  location        String?        // présentiel / distanciel / adresse
  maxSeats        Int?
  priceHt         Decimal?       @db.Decimal(10, 2)
  status          SessionStatus  @default(SCHEDULED)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  inscriptions    Inscription[]
  emargements     Emargement[]
  qualiopiProofs  QualiopiProof[]
  @@index([formationId, startDate])
  @@index([trainerId])
}

/// INSCRIPTION : un apprenant sur une session (financement + éval + livrable).
model Inscription {
  id            String            @id @default(cuid())
  sessionId     String
  session       FormationSession  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  /// Apprenant identifié (membre) OU apprenant "externe" décrit en clair.
  learnerId     String?
  learner       User?             @relation("InscriptionLearner", fields: [learnerId], references: [id], onDelete: SetNull)
  learnerName   String?           // si apprenant non-utilisateur
  learnerEmail  String?
  /// Compte payeur (établissement) le cas échéant.
  payerAccountId String?
  payerAccount  Account?          @relation("InscriptionPayer", fields: [payerAccountId], references: [id], onDelete: SetNull)
  financing     FinancingType     @default(ESTABLISHMENT)
  status        InscriptionStatus @default(PENDING)
  satisfaction  Int?              // note à chaud 1..5 (Qualiopi crit. 2/6)
  evalResult    String?           // résultat évaluation (acquis/en cours)
  attestationUrl String?          // attestation d'assiduité (Document)
  certificatUrl  String?          // certificat (parcours certifiant uniquement)
  invoiceId     String?           @unique
  invoice       Invoice?          @relation(fields: [invoiceId], references: [id], onDelete: SetNull)
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  emargements   Emargement[]
  @@index([sessionId, status])
  @@index([learnerId])
}

/// ÉMARGEMENT : présence signée par apprenant et par créneau (demi-journée).
model Emargement {
  id            String           @id @default(cuid())
  sessionId     String
  session       FormationSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  inscriptionId String
  inscription   Inscription      @relation(fields: [inscriptionId], references: [id], onDelete: Cascade)
  slotDate      DateTime         // date du créneau
  slot          EmargementSlot   @default(MORNING)
  present       Boolean          @default(false)
  signatureUrl  String?          // trace signature (Document)
  signedAt      DateTime?
  createdAt     DateTime         @default(now())

  @@unique([inscriptionId, slotDate, slot])
  @@index([sessionId])
}

// ---------------------------------------------------------------------------
// CONFORMITÉ QUALIOPI (7 critères / 32 indicateurs + preuves)
// ---------------------------------------------------------------------------

/// Référentiel : un des 7 critères Qualiopi (données de référence, seedées).
model QualiopiCriterion {
  id          String              @id @default(cuid())
  number      Int                 // 1..7
  title       String
  indicators  QualiopiIndicator[]
  @@unique([number])
}

/// Un des 32 indicateurs, rattaché à un critère (données de référence, seedées).
model QualiopiIndicator {
  id          String            @id @default(cuid())
  criterionId String
  criterion   QualiopiCriterion @relation(fields: [criterionId], references: [id], onDelete: Cascade)
  number      Int               // 1..32
  label       String
  proofs      QualiopiProof[]
  @@unique([number])
  @@index([criterionId])
}

/// PREUVE déposée par l'OF (ADéPA) pour un indicateur. Peut cibler une session.
model QualiopiProof {
  id           String            @id @default(cuid())
  indicatorId  String
  indicator    QualiopiIndicator @relation(fields: [indicatorId], references: [id], onDelete: Cascade)
  ofAccountId  String            // le compte OF (ADéPA)
  ofAccount    Account           @relation("QualiopiOf", fields: [ofAccountId], references: [id], onDelete: Cascade)
  sessionId    String?
  session      FormationSession? @relation(fields: [sessionId], references: [id], onDelete: SetNull)
  label        String
  documentUrl  String?           // Document (kind = qualiopi_proof)
  status       ProofStatus       @default(TODO)
  reviewedAt   DateTime?
  createdAt    DateTime          @default(now())
  updatedAt    DateTime          @updatedAt

  @@index([indicatorId, status])
  @@index([ofAccountId])
}

// ---------------------------------------------------------------------------
// TUTORAT / ACCOMPAGNEMENT (tuteur, entretiens, jalons, projet d'avenir)
// ---------------------------------------------------------------------------

/// Suivi tutoral d'un apprenant (rattaché à une inscription).
model Tutorat {
  id            String       @id @default(cuid())
  inscriptionId String       @unique
  tutorId       String
  tutor         User         @relation("TutoratTutor", fields: [tutorId], references: [id], onDelete: Cascade)
  projetAvenir  String?      // "projet d'avenir" / plan de progression
  status        TutoratStatus @default(ACTIVE)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  entretiens    Entretien[]
  jalons        Jalon[]
  @@index([tutorId])
}

model Entretien {
  id        String   @id @default(cuid())
  tutoratId String
  tutorat   Tutorat  @relation(fields: [tutoratId], references: [id], onDelete: Cascade)
  date      DateTime
  notes     String?
  createdAt DateTime @default(now())
  @@index([tutoratId])
}

model Jalon {
  id        String     @id @default(cuid())
  tutoratId String
  tutorat   Tutorat    @relation(fields: [tutoratId], references: [id], onDelete: Cascade)
  label     String
  dueDate   DateTime?
  status    JalonStatus @default(PENDING)
  createdAt DateTime   @default(now())
  @@index([tutoratId])
}

// ---------------------------------------------------------------------------
// ENUMS FORMATION
// ---------------------------------------------------------------------------
enum FormationType     { CERTIFIANTE  INTERNE }
enum FormationStatus   { DRAFT  PUBLISHED  ARCHIVED }
enum SessionStatus     { SCHEDULED  OPEN  FULL  RUNNING  DONE  CANCELLED }
enum InscriptionStatus { PENDING  CONFIRMED  ATTENDED  CERTIFIED  CANCELLED }
enum FinancingType     { CPF  OPCO  ESTABLISHMENT  PERSONAL  POLE_EMPLOI  INTERNE }
enum EmargementSlot    { MORNING  AFTERNOON }
enum ProofStatus       { TODO  UPLOADED  VALIDATED  REJECTED }
enum TutoratStatus     { ACTIVE  COMPLETED  CANCELLED }
enum JalonStatus       { PENDING  DONE }
```

**Relations inverses à ajouter** sur les modèles existants :
- `Account` : `formationsOwned Formation[] @relation("FormationOwner")`, `sessionsHosted FormationSession[] @relation("SessionHost")`, `inscriptionsPaid Inscription[] @relation("InscriptionPayer")`, `qualiopiProofs QualiopiProof[] @relation("QualiopiOf")`.
- `User` : `sessionsTrained FormationSession[] @relation("SessionTrainer")`, `inscriptions Inscription[] @relation("InscriptionLearner")`, `tutoratsGiven Tutorat[] @relation("TutoratTutor")`.
- `Category` : `formationsRef Formation[] @relation("FormationCategoryRef")`.
- `Invoice` : `inscription Inscription? @relation` (côté inverse du lien `invoiceId`).

---

## 5. Les deux parcours — data + permissions

### 5.1 Tableau comparatif

| Dimension | CERTIFIANT (A) | INTERNE (B) |
|-----------|----------------|-------------|
| `Formation.type` | `CERTIFIANTE` | `INTERNE` |
| `ownerAccount` | ADéPA (OF, compte ADMIN/établissement dédié) | l'établissement lui-même |
| Qui crée le programme | ADMIN / ADéPA | OWNER/ADMIN/MANAGER de l'établissement |
| Formateur (`trainer`) | **FREELANCE** (via profil) | **salarié-membre** (Membership du compte, `skills` ⊇ « formation ») |
| `cpfEligible` | possible `true` | forcé `false` |
| `certifying` | `true` → certificat | `false` → attestation interne seulement |
| Qualiopi | **appliqué** (preuves obligatoires) | **non appliqué** |
| Financement (`FinancingType`) | CPF / OPCO / établissement / perso / Pôle emploi | `INTERNE` |
| Livrable | attestation d'assiduité → **certificat** | **attestation interne** |
| Facturation | `Invoice` par inscription (OF → payeur) | interne, souvent sans facture (coût RH) |
| EDOF | registre + BPF + export | hors périmètre EDOF |

### 5.2 Permissions (guards)

- **ADMIN (ADéPA)** : CRUD complet sur `Formation` certifiantes, gestion Qualiopi (`qualiopi` module réservé ADMIN/OF), validation des preuves, émission des certificats, registre + BPF.
- **ESTABLISHMENT** :
  - parcours A : consulte le catalogue certifiant, inscrit ses salariés (`Inscription` avec `payerAccountId` = son compte), suit émargement/attestations de ses inscrits.
  - parcours B : crée des `Formation` `INTERNE`, planifie des `FormationSession` en désignant un `trainer` **parmi ses propres membres**, inscrit ses collègues, génère les attestations internes. Un guard vérifie `trainer ∈ memberships(hostAccount)`.
- **FREELANCE** : peut être désigné `trainer` sur une session certifiante ; accès à ses sessions, feuille d'émargement, apprenants ; pas d'accès Qualiopi (c'est l'OF qui porte la certification).
- Règle transverse : `FinancingType.CPF` refusé si `Formation.type = INTERNE` ; `certificatUrl` refusé si `certifying = false` (validation DTO + service).

---

## 6. Placement des modules & routes

### 6.1 API — 3 nouveaux modules

```
apps/api/src/
  formations/
    formations.module.ts        # importe NotificationsModule, InvoicesModule
    formations.controller.ts    # /api/formations, /sessions, /inscriptions, /emargements
    formations.service.ts
    dto/{create-formation,update-formation,create-session,update-session,
         create-inscription,update-inscription,sign-emargement,query-formations}.dto.ts
  qualiopi/
    qualiopi.module.ts
    qualiopi.controller.ts      # /api/qualiopi/criteria, /indicators, /proofs  (ADMIN/OF)
    qualiopi.service.ts
    guards/of.guard.ts          # réserve à l'OF (ADéPA)
    dto/{upsert-proof,query-conformite}.dto.ts
  tutorat/
    tutorat.module.ts
    tutorat.controller.ts       # /api/tutorat, /entretiens, /jalons
    tutorat.service.ts
    dto/{create-tutorat,create-entretien,create-jalon,update-jalon}.dto.ts
```
Enregistrer les 3 modules dans `app.module.ts` (à la suite de `PlanningModule`). Ajouter les endpoints admin dans `admin.controller.ts` : `GET /admin/formations`, `GET /admin/sessions`, `GET /admin/qualiopi`, `GET /admin/formations/registre`, `GET /admin/formations/bpf`.

### 6.2 Web — routes

```
apps/web/src/app/
  (dashboard)/dashboard/
    formations/            # FREELANCE: mes sessions animées ; ESTABLISHMENT: inscriptions + formation interne
      page.tsx
      [sessionId]/page.tsx # détail session, feuille d'émargement, attestations
      interne/             # ESTABLISHMENT only: créer une formation interne
        page.tsx
  marketplace/
    formations/            # catalogue formations certifiantes (ADéPA)
      page.tsx
      [id]/page.tsx        # fiche programme + sessions ouvertes + s'inscrire
  (public)/
    formations/[id]/page.tsx   # fiche publique programme (SEO / vitrine ADéPA)
  (admin)/admin/
    formations/page.tsx        # remplace/complète "Éducat'heures"
    formations/[id]/page.tsx
    qualiopi/page.tsx          # tableau 7 critères / 32 indicateurs + preuves
    registre/page.tsx          # registre + export BPF
```
Composants `_shared/` à ajouter : `FormationSessionsTable.tsx`, `EmargementSheet.tsx`, `InscriptionForm.tsx`, `QualiopiMatrix.tsx`, `AdminFormationsTable.tsx`.

### 6.3 Navigation (`lib/nav.ts`) — sans casser le regroupement

- **FREELANCE** → section **Catalogue**, après « Mes ateliers » : `{ label: 'Mes formations', href: '/dashboard/formations', icon: GraduationCap, hint: 'Sessions que vous animez : émargement, apprenants, attestations' }`.
- **ESTABLISHMENT** → deux ajouts :
  - **Catalogue** : `{ label: 'Formations', href: '/marketplace/formations', icon: GraduationCap, hint: 'Catalogue certifiant ADéPA — inscrivez vos salariés' }`.
  - **Activité** : `{ label: 'Formation interne', href: '/dashboard/formations/interne', icon: GraduationCap, hint: 'Faites former vos équipes par un salarié référent' }`.
- **ADMIN** → nouvelle section **« Centre de formation »** (remplace l'item « Éducat'heures » de la section ADéPA) :
  ```
  { title: 'Centre de formation', items: [
     { label: 'Formations', href: '/admin/formations', icon: GraduationCap },
     { label: 'Conformité Qualiopi', href: '/admin/qualiopi', icon: ShieldCheck },
     { label: 'Registre & BPF', href: '/admin/registre', icon: FileText },
  ]},
  ```
  Icônes déjà importées (`GraduationCap`, `ShieldCheck`, `FileText`). Aucun nouveau design requis.

---

## 7. EDOF — pas d'API → registre + BPF + exports

EDOF (Mon Compte Formation / Caisse des Dépôts) **n'expose pas d'API d'écriture** utilisable ici. Conséquence :
- Aucune synchronisation automatique. L'OF (ADéPA) ressaisit sur EDOF.
- On produit : **(a)** un **registre des formations** (sessions + inscrits + heures + assiduité), **(b)** le **BPF** (Bilan Pédagogique et Financier annuel : effectifs, heures-stagiaires, produits par type de financement), **(c)** des **exports** CSV/PDF par session et annuels.
- Données déjà toutes disponibles depuis `FormationSession` + `Inscription` + `Emargement` + `Invoice` — le BPF est une agrégation, pas une nouvelle collecte.

---

## 8. Plan de build par phases

### P1 — Cœur (data + parcours minimal)
- Prisma : `Formation`, `FormationSession`, `Inscription`, `Emargement` + enums + relations inverses. Migration.
- API : module `formations` (CRUD programme/session, inscription, émargement/signature) + endpoints admin `formations`/`sessions`. Guards (formateur interne ∈ membres, CPF interdit si INTERNE).
- Web : `marketplace/formations` (catalogue + fiche + inscription), `dashboard/formations` (freelance : sessions animées + émargement ; établissement : inscriptions + `formations/interne`), admin `admin/formations`.
- Nav : ajouts §6.3 (Catalogue/Activité freelance & établissement, section admin).
- **Fichiers** : `apps/api/prisma/schema.prisma` (édit), `apps/api/src/formations/**`, `apps/api/src/app.module.ts` (édit), `apps/api/src/admin/admin.controller.ts` (édit), `apps/web/src/app/(dashboard)/dashboard/formations/**`, `apps/web/src/app/marketplace/formations/**`, `apps/web/src/app/(admin)/admin/formations/**`, `apps/web/src/lib/nav.ts` (édit), `_shared/{FormationSessionsTable,EmargementSheet,InscriptionForm,AdminFormationsTable}.tsx`.

### P2 — Documents (attestations, certificats, factures)
- Génération PDF attestation d'assiduité (interne + certifiant) et **certificat** (certifiant only) via la brique PDF des `invoices`.
- Branchement facturation : `Inscription.invoiceId` → `Invoice` (payeur = `payerAccountId`).
- Stockage via `Document` (`kind` = attestation/certificat).
- **Fichiers** : `apps/api/src/formations/` (service PDF + hooks Invoice), `_shared/AttestationButton.tsx`, écran finance établissement enrichi.

### P3 — Qualiopi + Tutorat + EDOF
- Prisma : `QualiopiCriterion`/`QualiopiIndicator`/`QualiopiProof` + seed des 7 critères / 32 indicateurs ; `Tutorat`/`Entretien`/`Jalon`.
- API : modules `qualiopi` (OF only) + `tutorat`. Endpoints registre + export BPF.
- Web : `admin/qualiopi` (matrice + upload preuves), `admin/registre` (export), volet tutorat sur la fiche inscription.
- **Fichiers** : `apps/api/src/qualiopi/**`, `apps/api/src/tutorat/**`, `apps/api/prisma/seed` (édit : indicateurs Qualiopi), `apps/web/src/app/(admin)/admin/{qualiopi,registre}/**`, `_shared/QualiopiMatrix.tsx`, `_shared/TutoratPanel.tsx`.

---

## 9. Risques & points de vigilance
- **Apprenant externe** (non-utilisateur) : géré par `learnerName`/`learnerEmail` sur `Inscription` — éviter de forcer la création d'un `User` pour chaque stagiaire.
- **Double emploi `Shift`/session** : ne pas dupliquer le planning ; relier une session à un `Shift` optionnel plutôt que recréer une couche calendrier.
- **Ne pas supprimer `ServiceCategory.FORMATION`** : les ateliers-formation ponctuels non certifiants restent des `Service`. La frontière « prestation ponctuelle » vs « session multi-apprenants » doit être explicite dans l'UI de création.
- **Qualiopi = données de référence** : critères/indicateurs seedés et non éditables par les comptes ; seules les preuves sont déposées.
- **Séparation OF** : le module `qualiopi` doit être verrouillé au(x) compte(s) OF via `of.guard.ts`, jamais exposé aux établissements/freelances.
