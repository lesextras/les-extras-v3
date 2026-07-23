# Parcours logiciel LES EXTRAS v3 — notes explicatives par rôle

> Objectif : comprendre concrètement **comment on utilise le logiciel**, rôle par rôle, de la connexion jusqu'à chaque section du menu — et **où arrive la Formation**.
> Public : équipe produit, support, onboarding. Français, pédagogique.
> Date : 2026-07-23.

---

## 0. Rappel des rôles

LES EXTRAS est une marketplace du médico-social qui met en relation :

- **FREELANCE** — un intervenant indépendant (éducateur spécialisé, moniteur-éducateur, EJE, AES, psychologue…). Il propose ses services et répond aux besoins des structures.
- **ESTABLISHMENT** (établissement) — une structure (MECS, IME, ITEP, EHPAD, SESSAD…). Elle publie ses besoins de renfort et réserve des ateliers/formations. Un établissement est un **compte** qui peut avoir **plusieurs membres** (des salariés) avec des rôles internes (OWNER, ADMIN, MANAGER, MEMBER).
- **ADMIN** — l'équipe ADéPA qui pilote la plateforme depuis un back-office séparé.

Techniquement : une personne = un `User` (identité de connexion). Elle est rattachée à un ou plusieurs **comptes** (`Account`) via un **Membership**. Le type du compte actif (FREELANCE ou ESTABLISHMENT) détermine ce qu'elle voit. L'ADMIN est un rôle global qui prime sur tout.

---

## 1. La connexion (commun à tous)

1. L'utilisateur arrive sur **/login** (groupe de routes `(auth)`). Les admins ont une entrée dédiée.
2. Après authentification, un cookie de session signé (`lesextras_session`, JWT) est posé. Il contient `{ id, email, role, onboardingStep }`.
3. Redirection vers **/dashboard**. Le layout `(dashboard)` vérifie la session ; sans session → retour /login.
4. **OnboardingGuard** : si le profil n'est pas terminé (`onboardingStep < 4`), l'utilisateur est envoyé sur **/wizard** (groupe `(onboarding)`) pour compléter son inscription (profil, métier, compétences, SIRET/diplôme côté freelance ; coordonnées structure côté établissement).
5. Une fois l'onboarding validé, il atterrit sur son **tableau de bord**, dont le contenu et le menu latéral dépendent de son rôle (fonction `resolveNavRole`).

Le menu latéral est **regroupé en sections** identiques pour tous les rôles : un item libre **Tableau de bord**, puis **Activité** (ce que je fais au quotidien), **Catalogue** (ce que j'explore/propose) et **Mon espace** (mes documents et réglages).

---

## 2. Parcours FREELANCE

### 2.1 Tableau de bord
Vue d'ensemble : les actions à traiter, les opportunités qui matchent, l'agenda proche, les messages non lus. C'est le point de départ quotidien.

### 2.2 Section « Activité »
- **Opportunités** (`/dashboard/opportunites`) — les missions de renfort qui **correspondent à son profil**, classées par score de matching (métier, compétences, zone géographique, disponibilités). Il candidate depuis ici.
- **Mon planning** (`/dashboard/planning`) — ses interventions confirmées (les « shifts »), sous forme de calendrier. Il gère aussi ses disponibilités, qui alimentent le matching.
- **Messagerie** (`/dashboard/inbox`) — ses échanges avec les établissements (liés à une mission).

### 2.3 Section « Catalogue »
- **Marketplace** (`/marketplace`) — toutes les missions et ateliers ouverts, qu'il peut parcourir librement.
- **Mes ateliers** (`/dashboard/ateliers`) — il **crée et gère ses propres interventions** (art-thérapie, médiation, prévention…) qu'un établissement pourra réserver. Chaque atelier est un `Service` rattaché à une catégorie.
- **➡️ [Formation] Mes formations** (`/dashboard/formations`) — **nouveau**. Quand le freelance est désigné **formateur** sur une session du catalogue certifiant ADéPA, il retrouve ici les sessions qu'il anime : liste des inscrits, **feuille d'émargement** (présence signée par demi-journée), et suivi des attestations. C'est son cockpit de formateur.

### 2.4 Section « Mon espace »
- **Factures & revenus** (`/dashboard/finance`) — ses revenus, ses factures PDF.
- **Mon compte** (`/dashboard/account`) — profil, compétences, paramètres, sécurité. C'est ici qu'il déclare ses **compétences** — dont d'éventuelles compétences « formation » qui le rendent éligible à être formateur.

### 2.5 Où arrive la Formation pour le freelance ?
Le freelance est le **formateur du parcours certifiant**. Il n'administre pas la certification (c'est ADéPA/l'OF), mais il **anime les sessions** : il émarge, suit ses apprenants, et déclenche les attestations. L'accès se fait via **Catalogue → Mes formations**.

---

## 3. Parcours ESTABLISHMENT

### 3.1 Tableau de bord
Vue d'ensemble de la structure : besoins de renfort en cours, candidatures reçues, planning d'équipe, crédits/packs, messages. Un établissement pilote ici son activité multi-membres.

### 3.2 Section « Activité »
- **SOS Renfort** (`/dashboard/renforts`) — le cœur du produit côté établissement : il **publie un besoin de remplacement** (`ReliefMission` : métier, dates, horaires, lieu, taux) et suit les candidatures. La diffusion se fait en cascade (salariés → réservés → public).
- **Planning** (`/dashboard/planning`) — le calendrier des créneaux et interventions de la structure (shifts, missions confirmées).
- **Messagerie** (`/dashboard/inbox`) — échanges avec les freelances.
- **➡️ [Formation] Formation interne** (`/dashboard/formations/interne`) — **nouveau**. L'établissement organise une formation **par un de ses propres salariés** (un membre du compte dont le profil liste une compétence « formation ») pour former ses collègues. Parcours **simplifié, sans Qualiopi, sans CPF** : il crée le programme interne, planifie une session, désigne le salarié-formateur (obligatoirement un membre du compte), inscrit les collègues, et délivre une **attestation interne** en fin de session.

### 3.3 Section « Catalogue »
- **Marketplace** (`/marketplace`) — toutes les missions et ateliers.
- **Ateliers** (`/marketplace?type=services`) — le catalogue d'ateliers à réserver auprès des freelances.
- **➡️ [Formation] Formations** (`/marketplace/formations`) — **nouveau**. Le **catalogue de formations certifiantes ADéPA** (éligibles CPF, Qualiopi). L'établissement y **inscrit ses salariés** à une session : il choisit le financement (établissement, OPCO, CPF…), suit l'émargement de ses inscrits et récupère leurs attestations puis certificats.

### 3.4 Section « Mon espace »
- **Équipe & invitations** (`/dashboard/account`) — gestion des membres et des accès de la structure : inviter des salariés par email, définir leurs rôles internes. C'est ici que se peuplent les **salariés-membres** qui pourront devenir formateurs internes.
- **Factures** (`/dashboard/finance`) — factures et dépenses, y compris celles des inscriptions en formation certifiante.

### 3.5 Où arrive la Formation pour l'établissement ?
Deux portes d'entrée, volontairement distinctes :
- **se former via ADéPA** (certifiant, Qualiopi, CPF) → **Catalogue → Formations** ;
- **former en interne** avec ses propres ressources (simplifié) → **Activité → Formation interne**.

Cette séparation reflète les deux logiques métier : consommer une formation certifiée vs organiser une montée en compétence maison.

---

## 4. Parcours ADMIN (back-office ADéPA)

L'admin dispose d'un espace séparé `(admin)` avec son propre menu, structuré par domaines.

### 4.1 Tableau de bord (`/admin`)
Vue d'ensemble de la plateforme : volumétrie, activité, points à modérer.

### 4.2 Section « Contenu »
- **Articles** (`/admin/articles`) — blog / actualités.
- **Catégories** (`/admin/categories`) — la taxonomie éditable (catégories de missions, d'ateliers, d'articles… et bientôt de **formations**).

### 4.3 Section « Administration »
- **Établissements** (`/admin/etablissements`) — les comptes structures.
- **Ateliers** (`/admin/ateliers`) — modération des services.
- **Utilisateurs** (`/admin/utilisateurs`) — gestion des comptes utilisateurs (bannir, vérifier, créer, éditer).

### 4.4 Section « ADéPA »
- **Réservations** (`/admin/reservations`) — les bookings de la plateforme.
- **Missions** (`/admin/missions`) — modération des missions de renfort.
- **Éducat'heures** (`/admin/educatheures`) — *aujourd'hui* un simple filtre des services de catégorie « Formation ». **➡️ Sera remplacé par le vrai Centre de formation** (voir 4.5).

### 4.5 ➡️ [Formation] Nouvelle section « Centre de formation »
- **Formations** (`/admin/formations`) — gestion du **catalogue certifiant ADéPA** : création des programmes, sessions, formateurs (freelances), inscrits, suivi de bout en bout (catalogue → session → inscrits → émargement → attestation → certificat → facturation).
- **Conformité Qualiopi** (`/admin/qualiopi`) — la **matrice des 7 critères / 32 indicateurs** avec dépôt et validation des **preuves**, rattachables aux sessions. Réservé à l'OF (ADéPA).
- **Registre & BPF** (`/admin/registre`) — le **registre des formations** et l'export du **Bilan Pédagogique et Financier**. Comme EDOF n'a pas d'API, ADéPA **exporte** (CSV/PDF) et ressaisit sur EDOF.

### 4.6 Section « Facturation »
- **Factures** (`/admin/factures`) — toutes les factures, y compris celles des inscriptions formation.

### 4.7 Section « Pilotage »
- **Statistiques** (`/admin/statistiques`) — indicateurs plateforme.

### 4.8 Où arrive la Formation pour l'admin ?
L'admin/ADéPA est **l'organisme de formation (OF)** : il détient le catalogue certifiant, pilote la conformité Qualiopi, émet les certificats et produit le registre + BPF. Tout est concentré dans la nouvelle section **« Centre de formation »**.

---

## 5. Synthèse : les deux parcours de formation

| | Parcours CERTIFIANT | Formation INTERNE |
|---|---|---|
| Qui pilote | ADMIN / ADéPA (OF certifié) | l'établissement |
| Formateur | un FREELANCE | un salarié-membre de l'établissement |
| CPF | possible | non |
| Qualiopi | appliqué (preuves) | non appliqué |
| Livrable | attestation → **certificat** | attestation interne |
| Financement | CPF / OPCO / établissement / perso / Pôle emploi | interne |
| Point d'entrée établissement | Catalogue → **Formations** | Activité → **Formation interne** |
| Point d'entrée freelance | Catalogue → **Mes formations** (formateur) | — |
| Point d'entrée admin | Centre de formation → **Formations** + **Qualiopi** + **Registre** | (visible dans les stats/registre) |

---

## 6. Le cycle certifiant, pas à pas

1. **Catalogue** — ADéPA crée un programme (`Formation`, type certifiant, éligible CPF) et l'ouvre.
2. **Session** — ADéPA planifie une session datée et y **affecte un freelance formateur**.
3. **Inscrits** — un établissement inscrit ses salariés (ou un apprenant s'inscrit), avec un **mode de financement**.
4. **Émargement** — le formateur fait signer la présence par demi-journée (feuille d'émargement).
5. **Attestation** — en fin de session, une **attestation d'assiduité** est générée par apprenant.
6. **Certificat** — pour les formations certifiantes, un **certificat** est délivré après évaluation.
7. **Facturation** — une facture est émise par inscription (OF → payeur), puis les données alimentent le **registre + BPF** pour EDOF.

Le parcours interne suit le même squelette **jusqu'à l'attestation**, mais sans Qualiopi, sans CPF, sans certificat et sans EDOF.
