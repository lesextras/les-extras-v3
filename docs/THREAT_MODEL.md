# LES EXTRAS v3 — Modèle de menaces (STRIDE)

> Lane **QA-Security**. Centré multi-tenant, auth JWT, invitations, uploads, IDOR.
> Légende statut : ✅ mitigé · 🟡 partiel / à confirmer · 🔴 à implémenter.
> Chaque menace référence les tests qui la couvrent (`apps/api/test/*`).

## 1. Actifs & surfaces

| Actif | Sensibilité | Surface d'exposition |
|---|---|---|
| Identités `User` + mots de passe | Critique | `/api/auth/*` |
| Cloisonnement des tenants (`Account`) | **Critique** | Header `x-account-id`, toutes routes scoppées |
| Missions / Bookings / Invoices | Élevée (données médico-sociales + financières) | `/api/missions`, `/api/bookings`, `/api/invoices` |
| Memberships & rôles (`AccountRole`) | Élevée (escalade) | `/api/memberships`, `/api/invitations` |
| Tokens d'invitation | Élevée (accès non autorisé au tenant) | `/api/invitations/accept` |
| Documents (coffre-fort conformité, diplômes) | Élevée (données perso RGPD) | uploads |
| JWT / secrets | Critique | `JWT_SECRET`, `SESSION_SECRET` |

Frontière de confiance principale : **le compte actif**. Tout ce qui traverse
`x-account-id` doit être ré-autorisé côté serveur (jamais faire confiance au client).

---

## 2. STRIDE

### S — Spoofing (usurpation d'identité)

| # | Menace | Risque | Mitigation | Statut | Test |
|---|---|---|---|---|---|
| S1 | Token JWT forgé / signé avec un autre secret | Accès complet usurpé | Vérif signature HS256 via `JWT_SECRET`, `JwtAuthGuard` global | ✅ | `auth.e2e` (forge/expired) |
| S2 | Token d'un autre user rejoué | Usurpation de session | JWT court (`JWT_EXPIRES_IN`), `exp` vérifié ; prévoir rotation/refresh | 🟡 | `auth.e2e` (expired) |
| S3 | **Usurpation de tenant via `x-account-id`** | Un user pose l'ID d'un compte tiers | `AccountGuard` : exige un `Membership ACTIVE` (user × account) avant tout accès | ✅ visé | `multi-tenant-isolation.e2e` |
| S4 | Énumération de comptes au login | Reconnaissance | Réponse 401 uniforme (mauvais mdp = compte inconnu) | ✅ | `auth.e2e` (no-enumeration) |
| S5 | Spoofing expéditeur email (invitations) | Phishing via nom de domaine | SPF/DKIM/DMARC sur le domaine d'envoi | 🔴 | — (infra) |

### T — Tampering (altération)

| # | Menace | Risque | Mitigation | Statut | Test |
|---|---|---|---|---|---|
| T1 | Injection d'`accountId` dans un body de création | Rattacher une ressource à un autre tenant | Ignorer tout `accountId` du body ; forcer `req.account.id` ; `ValidationPipe whitelist+forbidNonWhitelisted` | ✅ visé | `multi-tenant-isolation.e2e` (création mission) |
| T2 | Mass-assignment du `role`/`GlobalRole` à l'inscription | Escalade globale ADMIN | DTO strict, champs non déclarés rejetés | ✅ visé | `auth.e2e` (mass-assignment) |
| T3 | Modification directe d'un statut booking illégal | Corruption du cycle de vie | Machine à états serveur (transitions validées) | 🟡 | `bookings.e2e` |
| T4 | Altération SQL (injection) | Fuite/corruption | Prisma (requêtes paramétrées), pas de `$queryRawUnsafe` | ✅ | revue statique |
| T5 | Falsification du cookie de session web | Session forgée | Cookie signé (`SESSION_SECRET`, `jose`), `httpOnly`+`secure`+`sameSite` | 🟡 | à confirmer côté Web-Core |

### R — Repudiation (répudiation)

| # | Menace | Risque | Mitigation | Statut |
|---|---|---|---|---|
| R1 | Action sensible non tracée (invite, suppression membre, changement rôle) | Pas d'imputabilité | Journal d'audit (who/what/account/when) sur mutations sensibles | 🔴 |
| R2 | Horodatage manquant | Contestation | `createdAt/updatedAt` présents au schéma ; `lastLoginAt` sur User | ✅ (schéma) |

### I — Information Disclosure (fuite)

| # | Menace | Risque | Mitigation | Statut | Test |
|---|---|---|---|---|---|
| I1 | **IDOR cross-tenant** (lecture mission/booking/invoice d'un autre compte par ID) | Fuite de données médico-sociales & financières | Filtrage systématique par `accountId` du compte actif ; 404 si hors périmètre | ✅ visé | `multi-tenant-isolation.e2e` (IDOR × missions/bookings/invoices) |
| I2 | Liste non scoppée renvoyant tous les tenants | Fuite massive | `where: { accountId }` obligatoire sur chaque `findMany` | ✅ visé | `multi-tenant-isolation.e2e` (listes) |
| I3 | Hash bcrypt / mot de passe exposé dans les réponses | Compromission crédentials | Sérialisation excluant `password` (interceptor / select Prisma) | ✅ visé | `auth.e2e` (`/me`, register) |
| I4 | Fuite de la liste des membres d'un autre compte | Reconnaissance sociale | Scope `accountId` sur memberships | ✅ visé | `multi-tenant-isolation.e2e` (memberships) |
| I5 | Messages d'erreur trop verbeux (stack, SQL) | Reconnaissance | `ExceptionFilter` global, pas de stack en prod | 🟡 |
| I6 | Accès direct à un fichier uploadé d'un autre tenant (URL devinable) | Fuite document conformité | Stockage hors webroot + contrôle d'accès à la lecture (pas de chemin séquentiel) | 🔴 |

### D — Denial of Service

| # | Menace | Risque | Mitigation | Statut |
|---|---|---|---|---|
| D1 | Brute-force login / accept invitation | Compromission / abus | Rate-limiting (`@nestjs/throttler`), backoff | 🔴 |
| D2 | Upload volumineux / bombe zip | Épuisement disque/CPU | Limite taille + type MIME + antivirus optionnel | 🔴 |
| D3 | Payloads JSON géants | Épuisement mémoire | `bodyParser` limite (`limit: '1mb'`) | 🟡 |
| D4 | Requêtes non paginées (`findMany` sans `take`) | Épuisement DB | Pagination obligatoire par défaut | 🟡 |

### E — Elevation of Privilege (escalade)

| # | Menace | Risque | Mitigation | Statut | Test |
|---|---|---|---|---|---|
| E1 | **MEMBER invite/supprime des membres** | Prise de contrôle du compte | `@AccountRoles('OWNER','ADMIN')` sur mutations membres/invitations | ✅ visé | `rbac.e2e` |
| E2 | MEMBER se promeut ADMIN/OWNER (patch de son membership) | Escalade verticale | Contrôle de rôle + interdiction d'auto-élévation | ✅ visé | `rbac.e2e` |
| E3 | Invitation créée avec un rôle > rôle de l'inviteur | Escalade par proxy | Borne : on ne peut inviter qu'à un rôle ≤ le sien | 🟡 | `rbac.e2e` (member→OWNER) |
| E4 | Suppression/rétrogradation de l'OWNER | Détournement du compte | OWNER protégé (transfert explicite requis) | 🟡 | `rbac.e2e` |
| E5 | `GlobalRole=ADMIN` confondu avec pouvoir intra-compte | Contournement RBAC | RBAC basé sur `AccountRole` du compte actif, pas sur `role` global | ✅ visé | conception + `rbac.e2e` |

---

## 3. Menaces spécifiques — Invitations

| # | Menace | Risque | Mitigation | Statut | Test |
|---|---|---|---|---|---|
| INV1 | **Token guessing** (deviner un token d'invitation) | Rejoindre un compte non autorisé | Token `cuid()` haute entropie (≥ 128 bits) ; 404 si inconnu | ✅ visé | `invitations.e2e` (guessing) |
| INV2 | **Replay** (accepter 2× le même token) | Double rattachement / réactivation | Statut passe à `ACCEPTED`, 2e acceptation refusée ; idempotence membership | ✅ visé | `invitations.e2e` (replay) |
| INV3 | **Expiry non respecté** | Token périmé encore valable | `expiresAt` vérifié à l'acceptation | ✅ visé | `invitations.e2e` (expired) |
| INV4 | Acceptation d'une invitation **révoquée** | Contournement de révocation | Statut `REVOKED` bloque l'acceptation | ✅ visé | `invitations.e2e` (revoked) |
| INV5 | Révoquer l'invitation d'un **autre compte** | Sabotage cross-tenant | Scope `accountId` + rôle OWNER/ADMIN | ✅ visé | `invitations.e2e` (cross-tenant) |
| INV6 | Invitation acceptée par un **autre email** que le destinataire | Détournement d'invitation | Lier l'acceptation à l'email invité (ou au user authentifié correspondant) | 🟡 | à renforcer |
| INV7 | Fuite du token dans logs / referer | Interception | Ne jamais logger le token ; lien via POST/landing, pas de token en query loggée | 🟡 |

---

## 4. Uploads (documents, avatars, diplômes)

| # | Menace | Risque | Mitigation | Statut |
|---|---|---|---|---|
| U1 | Upload d'exécutable / SVG piégé (XSS stored) | RCE / XSS | Whitelist MIME + extension, `Content-Disposition: attachment`, pas de rendu inline SVG | 🔴 |
| U2 | Path traversal sur nom de fichier | Écrasement fichiers serveur | Renommer (uuid), stockage hors webroot | 🔴 |
| U3 | IDOR sur documents (voir U/I6) | Fuite conformité | Contrôle d'accès à la lecture, URLs signées à durée limitée | 🔴 |
| U4 | Absence de scan antivirus | Distribution de malware | ClamAV / scan à l'ingest (optionnel selon budget) | 🟡 |

---

## 5. Synthèse — Top risques résiduels à traiter en priorité

1. **Rate-limiting absent** (D1) — brute-force login & accept invitation → `@nestjs/throttler`.
2. **Durcissement uploads** (U1–U3) — MIME whitelist, renommage, stockage hors webroot, accès contrôlé.
3. **Journal d'audit** (R1) — traçabilité des actions sensibles multi-tenant.
4. **IDOR documents / URLs signées** (I6/U3) — le coffre-fort conformité contient des données RGPD sensibles.
5. **Bornage des rôles d'invitation & protection OWNER** (E3/E4) — éviter l'escalade par proxy.

> Les mitigations ✅ « visé » sont **encodées comme tests** dans `apps/api/test/`.
> Un test rouge = fuite/escalade réelle à corriger avant mise en prod.
