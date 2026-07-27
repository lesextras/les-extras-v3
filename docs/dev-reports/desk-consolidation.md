# Desk — Rapport de consolidation technique

> Généré le 2026-04-29 · Sprints Desk 2-5

---

## Architecture Desk

### Routes admin

| Route | Page | Composant client |
|-------|------|-----------------|
| `/admin` | `admin/page.tsx` | `AdminStats`, `RequiredActions` |
| `/admin/demandes` | `admin/demandes/page.tsx` | `DeskRequestsTable` |
| `/admin/incidents` | `admin/incidents/page.tsx` | `FinanceIncidentsTable` |
| `/admin/contournements` | `admin/contournements/page.tsx` | `ContactBypassEventsTable` |
| `/admin/users` | `admin/users/page.tsx` | `UsersTable` |
| `/admin/kyc` | `admin/kyc/page.tsx` | `KycQueueTable` |
| `/admin/missions` | `admin/missions/page.tsx` | `MissionsTable` |
| `/admin/services` | `admin/services/page.tsx` | `ServicesTable` |
| `/admin/finance` | `admin/finance/page.tsx` | `AdminInvoicesTable`, `AdminQuotesTable`, `AdminAwaitingPaymentTable` |

### Sécurité des pages

Toutes les pages Desk (`/admin/**`) utilisent `fetchAdminSafe` pour isoler les erreurs API. En cas d'erreur d'authentification, `fetchAdminSafe` redirige vers `/admin/login`. En cas d'erreur réseau, il retourne les données de fallback et affiche une alerte partielle.

```
fetchAdminSafe(action, fallback, label)
  ├── success → { data, error: null }
  ├── UnauthorizedError → redirect("/admin/login")
  └── other error → { data: fallback, error: message_utilisateur }
```

---

## Libs Desk créés (Sprints 2-5)

### `src/lib/desk-status.ts`

Centralise tous les labels et variantes pour les statuts et priorités des tickets Desk.

| Export | Rôle |
|--------|------|
| `getDeskStatusLabel(status)` | OPEN → "Ouverte", IN_PROGRESS → "En cours", ANSWERED → "Répondue", CLOSED → "Clôturée" |
| `getDeskStatusVariant(status)` | Variante Badge ("default", "secondary", "outline") |
| `getDeskPriorityLabel(priority)` | LOW → "Basse", NORMAL → "Normale", HIGH → "Haute", URGENT → "Urgente" |
| `getDeskPriorityVariant(priority)` | Variante Badge ("quiet", "default", "amber", "coral") |
| `isDeskRequestOpen(status)` | true si OPEN ou IN_PROGRESS |
| `isDeskRequestLate(request, now)` | true si délai dépassé selon priorité (URGENT 2h, HIGH 24h, NORMAL 72h, LOW 7j) |
| `sortDeskRequestsByPriority(requests, now)` | Tri URGENT → HIGH → NORMAL → LOW, puis plus ancien en premier |

### `src/lib/contact-bypass-risk.ts`

Scoring de risque pour les événements de contournement messagerie.

| Export | Rôle |
|--------|------|
| `getContactBypassRiskScore(event)` | Score 0–4 (PHONE/WHATSAPP/TELEGRAM = 3, EMAIL = 2, URL = 1, +1 si BANNED/PENDING) |
| `getContactBypassRiskLabel(score)` | "Haut" (≥3), "Moyen" (2), "Bas" (≤1) |
| `getContactBypassRiskVariant(score)` | "coral" / "amber" / "quiet" |
| `getContactBypassReasonLabel(reason)` | Téléphone / WhatsApp / Telegram / Email / URL externe |
| `sortContactBypassEvents(events)` | Tri score décroissant, puis date décroissante |

### `src/lib/admin-priority.ts` (pré-existant)

Tri avancé des tickets Desk pour le tableau de bord Overview (tient compte de l'assignation).

| Export | Rôle |
|--------|------|
| `sortDeskRequestsByPriority(requests)` | Tri priorité → non-assigné en premier → ancienneté |
| `sortPendingUsersByAge(users)` | Tri utilisateurs PENDING par ancienneté |
| `sortUrgentMissionsByDate(missions)` | Tri missions urgentes par date de début |

### `src/lib/desk-labels.ts` (pré-existant)

Labels des types de tickets et utilitaires de contexte.

---

## Flux de traitement d'un ticket Desk

```
Création automatique ou manuelle
       │
       ▼
  status: OPEN
       │
       ├─ Admin prend en charge ──────► status: IN_PROGRESS
       │                                        │
       │                                        ▼
       │                              Admin rédige réponse
       │                                        │
       │                                        ▼
       │                              respondToDeskRequest()
       │                                        │
       │                                        ▼
       └──────────────────────────────► status: ANSWERED
                                               │
                                               ▼
                                       (optionnel) Clôture
                                               │
                                               ▼
                                        status: CLOSED
```

**Actions admin disponibles :**
- `updateDeskRequestStatus(id, status)` — change le statut
- `assignDeskRequest(id, adminId)` — assigne à un admin
- `respondToDeskRequest(id, response)` — envoie une réponse (notifie l'utilisateur)
- `createFinanceIncident(dto)` — crée un incident finance manuellement

**Actions contournement :**
- `monitorContactBypassEvent(id)` — marque comme surveillé
- `sendAdminOutreach(userId, message, options)` — contacte l'utilisateur directement
- `banUser(userId)` — suspend le compte

---

## Couverture de tests

| Fichier | Couvre |
|---------|--------|
| `desk-status.test.ts` | Tous les exports de `desk-status.ts` (27 tests) |
| `contact-bypass-risk.test.ts` | Tous les exports de `contact-bypass-risk.ts` (24 tests) |
| `DeskRequestsTable.test.tsx` | Composant Inbox Desk : labels, tri, filtres, sheet (13 tests) |
| `FinanceIncidentsTable.test.tsx` | Composant Incidents Finance : labels, création, booking (17 tests) |
| `ContactBypassEventsTable.test.tsx` | Composant Contournements : filtres, monitor, outreach (11 tests) |
| `admin-desk-pages.test.tsx` | No-crash des 3 pages Desk serveur (11 tests) |
| `admin-priority.test.ts` | Tri avancé admin-priority.ts (4 tests) |
| `admin-safe-fetch.test.ts` | Wrapper fetchAdminSafe (existant) |
| `desk-requests.test.ts` | Actions admin CRUD (existant, étendu) |

---

## Dettes techniques restantes

### Double `sortDeskRequestsByPriority`

Il existe deux implémentations :

| Lib | Signature | Différence |
|-----|-----------|-----------|
| `admin-priority.ts` | `(requests: DeskRequestRow[])` | Non-assigné en premier, sans paramètre `now` |
| `desk-status.ts` | `(requests: DeskRequestRow[], now: Date)` | Priorité puis ancienneté, utilisé dans les tables Desk |

Ces deux versions servent des cas d'usage différents (overview vs tables). Refactoring possible en unifiant avec des options, mais non prioritaire.

### Pas de temps réel sur les tickets

Les tables Desk ne sont pas mises à jour en temps réel. L'admin doit recharger manuellement la page. Le système SSE existe pour les `orders` mais pas pour le Desk.

### Pas de pagination sur les listes Desk

La liste `/admin/demandes` et `/admin/incidents` charge tous les tickets en une requête. Pour un volume élevé, une pagination ou un lazy-load serait nécessaire.

### Templates réponse non personnalisables

Les 4 templates réponse (Problème technique, Litige, Demande mission, Paiement) sont codés en dur dans `DeskRequestsTable.tsx`. Un CRUD admin pour les gérer dynamiquement serait plus souple.

### Statut utilisateur non mis à jour en temps réel

Après `banUser()`, la table ne se rafraîchit pas automatiquement (pas de `router.refresh()` dans `ContactBypassEventsTable`). L'admin doit recharger la page.

---

## Commandes de test

```bash
# Typecheck complet
pnpm --filter @lesextras/web typecheck

# Suite complète
pnpm --filter @lesextras/web test

# Tests Desk uniquement
pnpm --filter @lesextras/web exec vitest run \
  desk-status \
  contact-bypass-risk \
  DeskRequestsTable \
  FinanceIncidentsTable \
  ContactBypassEventsTable \
  admin-desk-pages \
  admin-priority

# Tests en mode watch (développement)
pnpm --filter @lesextras/web test:watch
```
