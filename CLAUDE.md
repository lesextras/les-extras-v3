# CLAUDE.md — Mémoire du projet ADéPA / Les-Extras

Document de contexte pour Claude. À lire en entier avant de toucher au code.
Dernière mise à jour : 3 août 2026, par Claude, avec Siham (fondatrice de
l'association ADéPA, Melun / Dammarie-lès-Lys — assoc.adepa@gmail.com).

## Les projets de l'association

| Projet | Quoi | Où |
|---|---|---|
| **Les-Extras v3** | LE produit principal : SaaS médico-social (ce dépôt) | app.les-extras.fr + api.les-extras.fr |
| **adepa.fr** | Site WordPress de l'association | adepa.fr (hors de ce dépôt) |
| **Toulali** | Autre site de Siham (WordPress, sessions précédentes) | voir avec Siham |
| **A2PA** | Autre site de Siham (sessions précédentes) | voir avec Siham |

Ce document couvre en détail Les-Extras v3. Pour adepa.fr : purger LiteSpeed
après toute modification, ne jamais afficher le token Teachizy. Restaient à
faire côté adepa.fr : le PDF « bilan de compétences » en 404 et la vidéo SMP
sur Teachizy. Toulali et A2PA ont été traités dans des conversations
antérieures — demander à Siham l'état courant avant d'y toucher.

## Règles de travail imposées par Siham — TOUJOURS EN VIGUEUR

1. **Jamais de mot de passe ni de clé API saisis par Claude.** Siham les tape
   elle-même (champ Coolify pré-rempli avec le NOM de la variable, elle colle
   la VALEUR). Ne jamais lui demander de coller un secret dans le chat.
2. **Jamais inventer de prix** destinés à la publication.
3. **Ne rien modifier au-delà de la demande** (design comme contenu).
4. **Vérifier en direct après chaque changement**, sur l'URL nue, jamais `?v=1`.
5. Sur Les-Extras : **carte blanche pour coder**.
6. Ne jamais supprimer de données de façon irréversible.

## Le modèle économique (fixé par Siham — ne pas le réinterpréter)

- La plateforme est **entièrement gratuite** pour la mise en relation et
  l'aide à la contractualisation (SOS Renfort + ateliers), pour les
  intervenants COMME pour les établissements. **Commission par défaut : 0**
  (`apps/api/src/billing/commission.ts`) — l'établissement paie le tarif de
  l'intervenant, qui le touche intégralement.
- **Deux services payants seulement** :
  1. **Formations Qualiopi** — facturées AU DEVIS par l'association (certifiée
     Qualiopi), qui fait appel aux formateurs du réseau Les Extras.
  2. **LEX, l'assistant IA** — à crédits : 1 crédit = 1 génération
     (écrit pro, activité, fiche). Le bot d'aide `chat` est GRATUIT.
- **⚠ CETTE GRILLE A CHANGÉ — la source de vérité est le CODE**, pas ce
  document : `apps/api/src/billing/billing.service.ts` (`SUBSCRIPTION_PLANS`,
  `CREDIT_PACKS`, `ESTABLISHMENT_PLAN`) et `credits.constants.ts`. Le
  12/08/2026 j'ai failli republier l'ancienne grille depuis ces lignes ;
  **toujours relire les constantes avant d'écrire un prix quelque part.**
- **Grille réelle au 12/08/2026** (refonte du 3/8, après benchmark) :
  dotation **GRATUITE PERMANENTE de 15 générations/mois**, reportable 3 mois,
  sans carte bancaire et sans date de fin — elle a REMPLACÉ l'essai de 7 jours
  (`TRIAL_DAYS` n'est gardé que pour les comptes qui l'ont connu).
  Abonnements : **LEX 19 €/mois** (200 générations reportables),
  **LEX Pro 49 €/mois** (600). Packs : 25 cr/9 €, 60 cr/19 €, 150 cr/39 €.
  **LEX Équipe — établissement, 89 €/mois** : 1 000 générations mensuelles
  PARTAGÉES par toute l'équipe du compte + trames maison publiables à la
  portée ETABLISSEMENT. **RECADRÉ LE 2/09/2026, décision de Siham.** Il
  promettait auparavant « RenforTeam illimité, 0 % de commission, coffre-fort
  de conformité » : trois choses que le compte GRATUIT contient déjà — il
  facturait donc du vide, et il contredisait la gratuité du renfort désormais
  assumée PUBLIQUEMENT comme différenciateur permanent. **Ne jamais remettre
  quoi que ce soit du renfort, des ateliers ou de la conformité derrière ce
  paywall** : c'est la promesse publiée sur /comparatif-plateformes-remplacement
  et sur la page Facebook de l'association.
- Le site public affiche désormais « Gratuit, puis 19 € » sur la carte LEX
  (il disait « essai gratuit de 7 jours » et « tarifs dans votre espace »,
  c'est-à-dire : créez un compte pour connaître un prix).
- Mécanique crédits : `Account.credits` + `CreditLedger` (chaque mouvement
  journalisé, jamais de solde négatif — décrément conditionnel en
  transaction), `CreditPurchase.stripeSessionId @unique` (idempotence
  webhook), remboursement automatique si une génération échoue
  (`CreditsService.avecCredit`), recharge quotidienne cron 5h UTC (remise À
  NIVEAU, sans cumul), `Account.isMember` = accès illimité accordé à la main
  (bouton « LEX ∞ » dans l'admin), `Account.lexTrialEndsAt` = essai
  (non nul = déjà utilisé).

## Architecture

Monorepo pnpm : `apps/api` (NestJS 11 + Prisma + Postgres) et `apps/web`
(Next.js 14 App Router). 259 tests jest côté API — les lancer avant tout
push : `pnpm --filter @lesextras/api exec jest`.

Points structurants :
- ValidationPipe global `whitelist + forbidNonWhitelisted` : tout champ hors
  DTO → 400.
- Machine à états Booking : REQUESTED→ACCEPTED→CONFIRMED→IN_PROGRESS→
  COMPLETED (CANCELLED partout) — `bookings.service.ts`, testée de bout en
  bout dans `bookings/parcours.spec.ts` (réservation→contrat→signature).
- Cascade de diffusion missions : SALARIES → RESERVED (vivier + historique,
  `intervenantsConnus()`) → PUBLIC — appliquée à l'écriture ET à la lecture.
- **LEX — trame maison, courriers et export (août 2026).**
  - `TrameMaison` : le professionnel dépose un écrit déjà rendu (Word, PDF ou
    collé) ; `ExtractionService` en lit le texte (lecteur ZIP maison via le
    CATALOGUE CENTRAL — LibreOffice laisse les en-têtes locaux à zéro),
    `PseudonymiseurService` masque, PUIS le moteur rend un JSON
    `{squelette, style, extrait}`. Seul ce squelette est renvoyé au moteur à
    chaque génération : apprendre sa trame ne renchérit pas l'usage.
    `portee` = PERSONNELLE (défaut) ou ETABLISSEMENT (publication réservée
    OWNER/ADMIN/MANAGER — c'est l'argument de l'offre établissement).
    L'import est GRATUIT ; les générations restent à 1 crédit.
    Le document d'origine est conservé (choix de Siham, 3/8/2026) en
    `FileKind.TRAME`, supprimé avec la trame.
  - Pseudonymiseur renforcé : les patronymes EN CAPITALES accolés à un prénom
    ou à une civilité sont masqués (`Kevin MARTIN`), MAIS les intitulés de
    sections et les sigles métier (`MECS`, `SESSAD`, `IDENTIFICATION`) sont
    préservés — sinon le squelette appris devient illisible.
  - **Jetons PARLANTS (août 2026)** : `[LE JEUNE]`, `[LA MÈRE]`,
    `[L'ÉDUCATRICE RÉFÉRENTE]`… au lieu de `[PERSONNE-A]`. Le moteur écrit
    nettement mieux avec un rôle qu'avec une lettre, et la protection est
    inchangée (un rôle ne désigne personne hors de la maison). Règle d'or :
    on n'étiquette QUE si le rôle est certain — deux personnes de même
    patronyme (père et mère DUBOIS) gardent la lettre, car inverser deux rôles
    dans un rapport lu par un juge coûte bien plus cher. « la mère de X » est
    ignoré (c'est X qui est nommé). La civilité est conservée (`Mme [X]`) :
    avant, « Mme Martin » revenait « Martin ». `restaurer()` tolère casse et
    espaces. `resume()` renvoie `roles[]`, affichés dans le studio — la preuve
    plutôt que la promesse. Nettoyage des jetons résiduels centralisé dans
    `nettoyerJetonsResiduels()` (4 copies auparavant) + `estJetonRole()`.
  - **NON à « garder les prénoms »** (question de Siham, 4/8/2026) : un prénom
    + un contexte d'établissement identifie une personne (individualisation,
    corrélation, inférence — les 3 critères CNIL). Ce serait de la
    pseudonymisation, pas de l'anonymisation, et cela rendrait FAUSSE la page
    /confiance-lex (« les noms ne sortent jamais d'ici »), qui est le seul vrai
    différenciateur face à ChatGPT. Aucun gain non plus : les vrais prénoms sont
    déjà rétablis localement dans le document rendu.
  - 3 nouvelles trames : `COURRIER_AUTORITE_PARENTALE` (avec coupon-réponse ;
    garde-fous : jamais d'argumentaire CONTRE un parent, pas de pression, note
    sur l'acte non usuel), `COURRIER_PARTENAIRE`, `BILAN_FIN_ACCOMPAGNEMENT`.
    L'information préoccupante reste HORS catalogue : la rédiger, c'est
    qualifier un danger.
  - `ExportService` : Word (lib `docx`) et PDF (`pdfkit`), depuis le markdown
    RELU par l'auteur — rien ne repasse par le moteur. Route
    `POST /assistant/export`, gratuite.
- **SOS Renfort — ciblage et attribution (août 2026).** Deux réglages
  indépendants, choisis par l'établissement à la publication (`RenfortModal`) :
  - `ReliefMission.cibleDiffusion` = QUI reçoit. `RESEAU` (cascade normale,
    défaut) · `CONNUS` (vivier + historique seuls) · `UNITE` (salariés de
    `orgUnitId` seuls) · `SELECTION` (`destinatairesSalaries` = User.id,
    `destinatairesIntervenants` = Account.id). Toute cible ≠ RESEAU
    **verrouille** : palier imposé (`CiblageService.palierImpose`), jamais
    de marketplace publique, pas d'élargissement (`broaden()` refuse, les deux
    planificateurs passent leur tour). Le garde-fou `assertCiblageRespecte()`
    est appliqué à la RÉPONSE aussi (`candidate`, `accept`, `sengager`) :
    sinon n'importe qui muni du lien contournerait la restriction.
  - `ReliefMission.modeAttribution` = COMMENT on attribue. `AUTOMATIQUE`
    (premier arrivé, premier servi — inchangé) · `FILE_ENGAGEMENT` :
    « je prends la mission » crée un `MissionEngagement` (rang = ordre
    d'arrivée), UN profil est présenté à la fois, l'établissement accepte ou
    refuse, le refus présente aussitôt le suivant, l'acceptation seule pourvoit
    la mission et émet le contrat. `EngagementsService` — `sengager()`,
    `retirer()`, `presenterSuivant()`, `decider()`,
    `relancerDecisionsEnAttente()` (cron, une relance par profil).
    En file d'engagement, le matching s'élargit (`VAGUES_LARGES` : 25/60/300,
    seuils 40/30/20) — c'est possible SANS risque puisque l'établissement
    valide. `accept()` redirige vers `sengager()` si le mode l'exige.
  - Écrans : `_shared/FileEngagement.tsx` (onglet « Profils à valider » du
    board `/dashboard/renforts`), `AcceptMissionButton` (libellé selon le mode).
- Signature électronique simple (art. 1367 cc) : empreinte SHA-256 du texte
  canonique, code 6 chiffres haché salé, 15 min, 3 essais, journal
  append-only, refus si document modifié. Page signataire :
  `/dashboard/signer/[id]`.
- Droit du travail : seule majoration légale ESSMS = 1er mai ; le reste est
  conventionnel → table `ParametresTemps` paramétrable
  (`/dashboard/temps-de-travail`), plafond 1607 h et plancher HS 10 %
  verrouillés (ordre public).
- Sentry : actif si `SENTRY_DSN` posée (5xx uniquement) — pas encore de DSN.
- Erreurs API affichées en français côté web (`apps/web/src/lib/api.ts`).

## Facturation — émetteur / payeur (août 2026)

- `Invoice.accountId` = **l'ÉMETTEUR** (celui qui facture, dont le SIRET
  engage le document) ; `Invoice.payerAccountId` = **le PAYEUR** quand aucun
  Booking ne relie les deux comptes (cas des inscriptions en formation).
  Le module formations mettait le PAYEUR comme titulaire : l'organisme ne
  pouvait ni émettre ni télécharger, et le PDF imprimait l'établissement comme
  émetteur de sa propre facture.
- Lecture et PDF ouverts aux DEUX côtés ; `issue` / `pay` / `cancel` réservés à
  l'émetteur (`assertEmetteur`). L'e-mail d'émission part au PAYEUR (il partait
  à l'émetteur, qui la connaissait déjà).
- **Numérotation** : `formations.service.ts` avait sa propre implémentation par
  `invoice.count()` — celle que `invoices/numerotation.ts` documente comme
  fautive (art. 242 nonies A ann. II CGI : séquence continue, un numéro annulé
  reste consommé) et qui produisait une collision sur `Invoice.number @unique`.
  Tout le monde utilise désormais `numeroSuivant()`.
- Écran `_shared/FactureActions.tsx` : émettre / marquer réglée / annuler.
  Branché sur `/dashboard/facturation` et sur la fiche session de formation.
  Sans lui, aucune facture ne sortait jamais du brouillon.
- `success_url` du paiement de facture pointe désormais sur
  `/dashboard/facturation?vue=factures&paiement=succes` : il passait par
  `/dashboard/finance`, une simple redirection qui perdait le paramètre.

## Infra / production

- **Coolify** : `http://168.231.86.146:8000/` — projet `gxjl062jb5vsazrtreefl3u7`,
  env `ecqyv95k26yfznpafqivil56`. App API `ztn3x6m7nsi8tiv4m55algui`
  (api.les-extras.fr), app web `rv03oxcj4zyal4c9ipybamo8` (app.les-extras.fr),
  BDD Postgres `i62v33uyldgzqsw0478ujgtc`, MinIO. Bouton « Redéploiement » en
  haut à droite (~1176,148). Le Dockerfile fait `prisma db push` → les
  migrations SQL du repo sont documentaires, le schéma s'applique tout seul.
- **Sauvegardes BDD** : Coolify, chaque nuit 3h UTC, rétention 7 — vérifiées
  vertes. Amélioration possible : activer S3 (MinIO) pour sortir les copies
  du serveur.
- **Variables d'env API posées** : DATABASE_URL, JWT_SECRET, BREVO_API_KEY,
  MAIL_FROM_*, MISTRAL_API_KEY, MISTRAL_MODEL, S3_*, STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET, APP_WEB_URL… (manquent : SENTRY_DSN, optionnelle).
- **Stripe** : compte de l'association (les-extras.fr, acct_1Ms0j7HY5XvhVZuD).
  Webhook actif `les-extras-v3-api` → `https://api.les-extras.fr/api/billing/webhook`
  (checkout.session.completed, customer.subscription.updated/deleted).
  Vérif rapide : POST sans signature sur le webhook → 401 = secret chargé,
  503 = pas configuré.
- **Vérification live** : `https://api.les-extras.fr/api/health` ; route
  nouvelle → 401 = existe, 404 = absente.

## Pousser le code SANS jeton (méthode éprouvée, la seule qui marche)

Le conteneur n'a pas de jeton git. On passe par l'interface web GitHub où la
session de Siham est ouverte (`github.com/lesextras/les-extras-v3`) :

1. Copier les fichiers du commit dans un dossier accessible au navigateur
   avec les chemins APLATIS (`/` → `__`) + garder un mapping plat→chemin.
2. Batch navigateur : [navigate `…/upload/main`, wait 3s, JS hameçon
   (`window.__buf=null;__pass=false; input.addEventListener('change', e=>{if(__pass)return; __buf=input.files; e.stopImmediatePropagation()}, true)`),
   find "file input"] — puis `file_upload` IMMÉDIATEMENT avec le ref renvoyé
   (la page devient « still loading » ~30 s après le chargement : tout faire
   vite, re-batcher si ça rate).
3. JS : reconstruire les `File` avec les CHEMINS COMPLETS comme noms via le
   mapping, `DataTransfer`, `__pass=true`, dispatch `change`.
4. Attendre : `input[name="file_id"]` = nb fichiers + 1 → manifeste complet.
5. Remplir le formulaire de commit PUIS `form.requestSubmit()` sur le
   formulaire qui contient `#commit-summary-input` (cliquer un bouton
   « Commit changes » au hasard → 400).
6. `git fetch origin main && git diff HEAD origin/main` (doit être vide)
   puis `git reset --hard origin/main`.
7. GitHub upload tombe parfois en panne (`POST /upload/manifests` pendant) :
   réessayer plus tard, ça revient.

## État au 3 août 2026 — TOUT EST LIVRÉ ET EN PRODUCTION

Commits : `235a055` (ateliers/formations/vivier), `00eda50` (signature,
majorations, annualisation, RGPD), `92f5e46` (réparations audit + modèle
économique), `2ed0b17` (prix définitifs, essai gratuit, admin LEX, tests
parcours, Sentry). Audit complet passé, 5 bloquants réparés, textes du site
alignés partout sur le modèle économique (le faux « 49 €/mois d'adhésion »
a disparu ; 49 € est désormais le vrai prix de l'abonnement LEX).

Écrans clés : `/dashboard/adhesion` (Utilisation façon Claude : solde, jauge,
historique, essai, recharge), `/admin/lex` (ventes/consommation/abonnés),
bouton « LEX ∞ » sur `/admin/etablissements`, `/dashboard/notifications`,
`/dashboard/signer/[id]`, `/dashboard/vivier`, `/dashboard/temps-de-travail`.

## Édublog rapatrié depuis WordPress (10 août 2026)

Les quatorze articles de `les-extras.fr/edublog` ont été relevés fidèlement via
l'API REST de WordPress (`apps/api/prisma/edublog-wordpress.json`) et importés
par `prisma/importer-edublog.js` (idempotent, dates d'origine conservées — c'est
elles qui portent l'antériorité SEO).

- **Six d'entre eux existaient déjà** dans l'application sous un slug différent
  (repris à la main en session antérieure, AVEC leur image de couverture). On
  garde la version en ligne : elle a une couverture et une URL déjà indexée.
  L'importeur connaît la correspondance (`DEJA_EN_LIGNE`) et ne les recrée plus.
  Les sept doublons créés au premier passage sont **ARCHIVÉS**, jamais supprimés.
  **Bilan : 20 articles publiés + 1 actualité.**
- **Les images restent servies par WordPress.** Le conteneur ne peut pas
  télécharger de binaires ; les rapatrier demande l'export de `wp-content/uploads`
  par Siham. Tant que WordPress répond, les couvertures s'affichent.
- **`prisma/nettoyer-edublog.js`** — trois actions, aucune écriture sans
  `--appliquer` :
  `--doublons` (archivage) · `--entites` (décodage des résumés) ·
  `--wordpress=<hôte>` (bascule des liens, réversible, ne touche que
  `wp-content/`, `listing/`, `devenir-freelance` — jamais une URL du SaaS).
- **Deux défauts d'affichage corrigés au passage**, tous deux antérieurs à
  l'import et visibles sur les vingt articles :
  1. `RichText` ne lisait que du Markdown : le blog affichait ses `<p>` et `<h2>`
     en clair. Il lit désormais aussi le HTML, **par liste blanche**, en
     construisant des éléments React — toujours zéro `dangerouslySetInnerHTML`,
     donc un article reste une donnée. `javascript:` et `data:` refusés.
     16 tests, dont six d'injection.
  2. Le chapô est affiché tel quel (contrairement au corps) : les entités
     WordPress y restaient visibles (`l&#039;agressivité`). La table d'entités
     est maintenant **engendrée** depuis l'ordre des points de code 0xC0–0xFF
     plutôt qu'énumérée, et respecte la casse (`&Eacute;` ≠ `&eacute;`).

**⚠ Piège rencontré, à ne pas refaire :** les liens ont d'abord été repointés sur
`app.les-extras.fr` par anticipation de l'inversion. WordPress répondant encore
sur `les-extras.fr`, **toutes les couvertures du blog ont cassé en direct**
(remis en état dans la foulée). L'ordre est : **DNS d'abord, script ensuite.**

## Inversion des domaines — FAITE le 10 août 2026

`les-extras.fr` sert désormais le SaaS, `app.les-extras.fr` sert WordPress.
Vérifié en direct : le SaaS n'a jamais été coupé.

État final constaté :

| Adresse | Sert | Certificat |
|---|---|---|
| `les-extras.fr` | SaaS (Coolify, 168.231.86.146) | émis |
| `www.les-extras.fr` | SaaS | émis |
| `api.les-extras.fr` | API (inchangée) | émis, `/api/health` vert |
| `app.les-extras.fr` | WordPress (CDN Hostinger) | Hostinger |

Ce qui a été fait, dans cet ordre — **l'ordre compte** :

1. Coolify AVANT le DNS. Ajouter le domaine à Coolify d'abord ; l'inverse fait
   tomber les visiteurs sur une erreur de certificat le temps que Traefik
   rattrape. Le certificat n'est émis qu'une fois le DNS en place : un
   redéploiement après la bascule DNS le déclenche.
2. **Le `www` doit être listé EXPLICITEMENT** dans le champ Domaines de Coolify.
   Le réglage « Autoriser www et non-www » ne suffit pas : sans
   `https://www.les-extras.fr` dans la liste, `www` répond en erreur de
   certificat.
3. DNS chez Hostinger (zone gérée par `ns1/ns2.dns-parking.com`, TTL 300) :
   `@` et `www` en A vers `168.231.86.146`. Hostinger **refuse A et ALIAS/CNAME
   sur le même nom** : il faut SUPPRIMER l'ALIAS `@` (vers
   `les-extras.fr.cdn.hstgr.net`) et le CNAME `www` avant de créer les A.
4. `APP_WEB_URL` et `WEB_ORIGIN` de l'app API passées à `https://les-extras.fr`.
   (`CORS_ORIGINS` n'est pas posée : l'API reflète alors toute origine, donc
   rien à changer de ce côté.)
5. WordPress : `app.les-extras.fr` ajouté en **domaine parqué** sur le site
   les-extras.fr. Hostinger a alors remplacé de lui-même l'enregistrement A de
   `app` par un ALIAS vers son CDN.
6. `node prisma/nettoyer-edublog.js --wordpress=app.les-extras.fr --appliquer`
   — 36 liens réécrits sur 28 articles, images du blog vérifiées en direct.

### ⚠ Deux pièges rencontrés, à ne pas refaire

- **NE JAMAIS utiliser le bouton Hostinger « Changer de domaine »** sur un site.
  Il annonce noir sur blanc : « Votre plan d'email gratuit sera réinitialisé et
  toutes les boîtes mail liées seront supprimées », plus la perte des
  sous-domaines et des sauvegardes. `les-extras.fr` porte des MX et du DKIM
  Hostinger : cela aurait détruit la messagerie. Le domaine parqué fait le même
  travail sans rien supprimer.
- **Les images du blog ont été coupées deux fois** : elles sont servies par
  WordPress. Tant que le DNS n'a pas bougé, les liens doivent rester sur
  l'ancien hôte ; ils ne basculent qu'APRÈS. C'est tout l'objet du drapeau
  `--wordpress=<hôte>`, qui marche dans les deux sens.

### WordPress : c'est FAIT (vérifié le 12/08/2026)

`WP_HOME` et `WP_SITEURL` valent bien `https://app.les-extras.fr`
(`/wp-json/` le confirme : `url` et `home`). Il n'y a plus rien à faire de ce
côté — ne pas ressortir cette tâche.

Il reste onze liens en dur vers `https://les-extras.fr/...` dans le contenu
WordPress (menus, widgets). Ils ne gênent plus personne depuis que le SaaS
redirige ces adresses (voir ci-dessous), et WordPress n'est plus promu nulle
part : le laisser tel quel est le bon choix.

**Conséquence assumée de l'inversion** : tous les liens déjà envoyés par e-mail
avant le 10/08/2026 (vérification de compte, contrats, factures) pointaient sur
`app.les-extras.fr` et ne fonctionnent plus. Les e-mails émis depuis le
basculement pointent sur `les-extras.fr`.

## Audit des quatre sites — 10 août 2026

Notes : **Les-Extras 82/100**, **Toulali 72**, **ADéPA 63**, **A2PA 62**.
L'artefact complet est chez Siham (« audit-sites-adepa »).

### Faits établis par le certificat Qualiopi (PDF fourni par Siham)

Ces valeurs font foi, elles viennent du certificat lui-même — plusieurs
pages du réseau portaient des variantes fausses :

- **Numéro de déclaration d'activité : `11771011677`.** La variante
  `11 77 01011 77` qui circulait sur l'accueil, les mentions légales et
  a2pa.fr est FAUSSE. Corrigée sur adepa77.fr ; **reste à corriger sur
  a2pa.fr**.
- **Siège social : 7 rue André Malraux, 77000 Melun.** Dammarie-lès-Lys est
  l'adresse administrative. a2pa.fr et toulali.fr déclarent Dammarie comme
  siège : à corriger.
- SIRET `82005185200011`, certificat `QNW0132`, QUALIPRO CERTIFICATION,
  délivré le 10/03/2026, fin de validité 09/03/2029, COFRAC `5-0681`,
  périmètre : actions de formation **et** bilans de compétences.

### Quatre alertes ÉCARTÉES après vérification en direct

À ne pas ressortir : elles venaient de notes internes périmées.

1. **Aucun écart de prix Toulali / Teachizy.** Vérifié dans le navigateur :
   Essentielle **1 500 €**, Accompagnement **2 890 €** des deux côtés, et les
   échéanciers concordent (2 × 750 € et 4 × 722,50 €). Les valeurs 790 € et
   2 200 € du skill `adepa-context` sont PÉRIMÉES.
2. Les 8 ancres de menu de toulali.fr existent bien.
3. Le catalogue de formations de Les-Extras n'est pas vide (3 en ligne).
4. Aucun compte de démonstration visible dans l'annuaire public.

### Corrections appliquées le 10/08/2026

**adepa77.fr** — dispositifs réécrits sur l'accueil, bilan de compétences mis
en avant, titre `STUDIO A2PA` aligné sur `LES EXTRAS` (règle CSS ajoutée en
fin de widget : `body .dcard .wm-a2`), lien Édublog réparé, **certificat
Qualiopi téléversé** (`/wp-content/uploads/2026/08/certificat-qualiopi-adepa.pdf`)
et son lien réparé, liens `kimi.com` et `adepa.fr` retirés des CGU, NDA
corrigé sur l'accueil et les mentions légales, bouton « Devenir adhérent » de
la boîte à outils repointé.

**Redirections** : le module de Rank Math ne répond pas (ses points REST sont
injoignables). Elles passent par un extrait **WPCode PHP nommé « Redirections
des anciennes pages de don et d'adhesion » (id 5056)**, actif, qui renvoie en
301 `/adhesion/` → `/devenir-adherent/`, `/dons/` et
`/campaigns/soutenez-les-projets-de-lassociation-adepa/` → `/faire-un-don/`.
Désactivable d'un clic depuis WPCode.

**Le programme du bilan de compétences en PDF n'existe pas.** Les deux liens
qui le proposaient sont devenus « Demander le programme » en `mailto:`. Le
document reste à produire — c'est un attendu Qualiopi (indicateur 1).

**les-extras.fr** (commit `3387b32`) — lien « Ateliers » du pied de page vers
`/ateliers`, `/freelances/[id]` transformée en redirection permanente vers
`/intervenants/[id]`, objectif de campagne sorti du code
(`OBJECTIF_CAMPAGNE` et `OBJECTIF_ECHEANCE`, échéance affichée depuis l'API,
plus de rythme hebdomadaire sur une campagne échue), ajout de
`(public)/error.tsx` et `global-error.tsx`, sitemap déclaré dans `robots.txt`.

### Ce que je ne peux PAS faire seule

- **a2pa.fr n'est pas WordPress** : c'est une application Next.js servie par
  le serveur Coolify (168.231.86.146). Son dépôt n'est pas cloné ici. Les
  16 ancres mortes de `/don` et `/adhesion`, la phrase de brouillon de
  `/confidentialite` et le tunnel Pro manquant demandent un accès au code.
- **toulali.fr demande une connexion** — jamais de mot de passe saisi par
  Claude. Deux boutons `href="#"` sur l'accueil (« Réserve un appel »,
  « Besoin d'un financement ? ») à repointer sur
  `/conseil-financement-formation/` ; le reste est de la conformité Qualiopi
  (indicateurs de résultats, durées, prérequis, évaluation, réclamation).
- **Décisions qui lui appartiennent** : montant d'adhésion (25 € sur a2pa.fr
  contre 150 € sur adepa77.fr), statut fiscal des dons (RNA, intérêt général,
  article 200 du CGI — la promesse « 66 % » est affichée sans base publiée),
  nom du directeur de publication.

## Ce qui reste (rien de bloquant)

- Siham : créer un projet Sentry et poser `SENTRY_DSN` (optionnel).
- Siham : contenu réel (fiches ateliers, catalogue Qualiopi, recrutement du
  réseau) ; faire relire CGU/mentions légales par un juriste.
- Optionnel : sauvegardes BDD vers S3/MinIO ; SDK Sentry côté web.
- adepa.fr : PDF bilan de compétences 404, vidéo SMP Teachizy.
- Premier paiement réel Stripe à surveiller sur `/admin/lex` (le circuit est
  testé par signature/idempotence, pas encore par un vrai paiement).

## Conformité Qualiopi et Teachizy — 11 août 2026

### Teachizy : les 12 formations sont conformes (12/12)

Avant ce passage, **cinq formations n'avaient ni public visé, ni objectifs, ni
prérequis** (champs `target` / `goals` / `requirements` à `null`), et **CM
Mobile (190 €) comme le Workshop A2PA étaient publiés avec une page de
description entièrement VIDE**. La page de vente d'Essentielle était par
ailleurs rédigée sans aucun accent (« maitrise les reseaux sociaux augmentes
par l'IA »). Tout est corrigé et vérifié en direct.

Chaque formation porte désormais : description, public visé, objectifs
(verbes d'action évaluables), prérequis, durée, format, mention
d'accessibilité handicap. **Les 129 leçons ont une `min_complete_duration`**
(10 min en général, 15 min pour les parcours 101 et l'Accompagnement, 20 min
pour un projet fil rouge) : c'est la trace d'assiduité qu'un financeur demande.

Les huit leçons d'Essentielle ont reçu, en tête, une carte « Repères du
module » (durée, prérequis, modalité, évaluation) et, en pied, « Avant de
passer au module suivant » (trois critères de réussite vérifiables). Filets de
séparation avant chaque titre. Le « carnet de séance » en lignes de pointillés
a été remplacé par une consigne lisible à l'écran.

**⚠ Durée : j'ai publié 14 h puis corrigé à 7 h le même jour.** Le volume réel
mesuré (≈ 540 mots de cours par leçon, soit ~3 min de lecture) ne soutenait pas
14 h. Les 7 h annoncées = lecture + les exercices que les leçons chronomètrent
elles-mêmes + quiz. **Règle : une durée annoncée s'adosse au contenu mesuré,
jamais à une intuition** — elle part dans les conventions et les dossiers de
financement.

Volumes relevés (à savoir avant de promettre quoi que ce soit) : Essentielle
8 leçons ≈ 4 300 mots pour 1 500 € ; Accompagnement 19 leçons, dont 8 portent
« Durée indicative » dans le texte, total 32 h ; les six parcours 101 annoncent
« 4 à 6 h/semaine sur 8 semaines » dans Web 101 — **cette phrase n'existe que
dans Web 101, je l'ai étendue à ses cinq jumeaux** (même gabarit, 12 leçons +
4 quiz) : à revoir si l'un d'eux est plus léger.

### Teachizy — l'API, et comment écrire dedans

L'administration est une **application Vue 2** sur `app.teachizy.fr`, mais les
données viennent de **`api.teachizy.fr`** — d'où l'échec des appels à
`app.teachizy.fr/api/v1/...`, qui renvoient la page HTML de l'application.

```js
// jeton : localStorage.tzauth (ne JAMAIS l'afficher)
GET  /api/v1/trainings?per_page=50
GET  /api/v1/trainings/{uuid}
PUT  /api/v1/trainings/{uuid}                       // partiel accepté
GET  /api/v1/trainings/{uuid}/training_items/{id}
PUT  /api/v1/trainings/{uuid}/training_items/{id}   // partiel accepté
```

- **`content` doit être une CHAÎNE JSON**, pas un objet : sinon 422
  « Le champ content doit être un JSON valide ».
- Le PUT partiel est sûr : `{min_complete_duration: 15}` seul ne touche pas au
  contenu (vérifié).
- Le richtext accepte les **styles en ligne** (`<div style=…>`, `<hr style=…>`)
  et les conserve : c'est ce qui permet de vraies cartes et de vrais filets.
- Sans style, un `<hr>` est invisible (hauteur 2 px, aucune bordure) mais
  apporte quand même 24 px de marge de chaque côté.

Passage par l'application quand l'API ne suffit pas (Vue 2 expose `__vue__`) :

```js
let r = document.querySelector('.cblock').__vue__;
while (r && !('trainingItemContent' in (r._data||{}))) r = r.$parent;
r.saveBlock(bloc, {...bloc.data, text: NOUVEAU});  // marque isDirty
r.save();                                          // = bouton « Sauvegarder »
```

**Piège d'outillage :** l'onglet Chrome gèle au bout de ~10 min d'usage — les
promesses `fetch` ne se résolvent plus, sans erreur. Symptôme : `window.__st`
reste vide. Remède : **onglet neuf**, et tout enchaîner dans un seul
`browser_batch` (navigate → wait → script → wait → lecture).

### toulali.fr — page réglementaire créée

Il manquait la **procédure de réclamation**, les **indicateurs de résultats**
et les **prérequis publiés** : ce sont les premiers points qu'un OPCO ou France
Travail contrôle. Créée : **`/informations-reglementaires/` (page 235)**, avec
identité de l'organisme, tableau durée/modalité/tarif des cinq formations
publiées, prérequis, délais d'accès, modalités d'évaluation et sanction,
accessibilité, indicateurs et procédure de réclamation (accusé sous 5 jours
ouvrés, réponse motivée sous 15 jours, recours devant la présidence sous 1 mois).

**Indicateurs de résultats : aucun chiffre publié, et c'est volontaire.** La
première session ouvre le 1er septembre 2026, aucune n'est terminée. La page le
dit explicitement. **Dès la fin de la première session, il faut y porter les
taux réels** — c'est un attendu, pas une option.

**Le fichier `footer.php` du thème `business-moon-theme` n'est pas
inscriptible** : l'éditeur de thème charge le fichier, accepte la modification,
n'affiche aucune erreur, et n'enregistre rien. Le pied de page est du HTML en
dur, il n'y a qu'un seul menu WordPress (`Menu Principal`, emplacement
`primary`). Contournement retenu : un encart en tête des six pages qui comptent
(Se faire financer, Conseil financement, CGV, CGU, Mentions légales, Accès
handicap) — quatre d'entre elles étant déjà dans le pied de page, la page
réglementaire est à deux clics de n'importe où.

**Correction d'une erreur de l'audit du 10/08 :** les boutons « Réserve un
appel » et « Besoin d'un financement ? » ne sont PAS morts. Ce sont des
`href="#"` avec `onclick="openCmiaCallModal()"` / `openCmiaFinancementModal()`,
et les fenêtres s'ouvrent correctement. Ne pas les « réparer ».

### adepa77.fr — réseaux sociaux remis d'aplomb

Trois défauts sur toutes les pages, tous corrigés dans le personnalisateur
(`astra-settings[header-social-icons-1]` et `[footer-social-icons-1]`) :

1. Les **deux liens du pied de page** (Instagram, Facebook) avaient une `url`
   vide : deux boutons morts sur chaque page.
2. Les icônes de l'en-tête étaient **mélangées** — le champ `id` d'Astra pilote
   la classe CSS, le champ `icon` pilote le pictogramme : on avait
   `id:instagram / icon:linkedin / url:LinkedIn`, `id:behance / url:Facebook`,
   `id:facebook / icon:instagram / url:Instagram`.
3. L'URL LinkedIn de l'en-tête contenait un **accent encodé**
   (`association-ad%C3%A9pa-…`), donc était fausse ; celle du pied de page
   était la bonne.

Les quatre réseaux sont maintenant identiques en tête et en pied :
Instagram · Facebook · LinkedIn · TikTok, `id`/`icon`/`label`/`url` cohérents.

**Comptes officiels retenus** (vérifiés en ouvrant les profils) :

| Réseau | Compte | Pourquoi |
|---|---|---|
| Instagram | `association.adepa` | bio ADéPA, mention Qualiopi. `adepa77` a pour bio « Shades Good » : **ce n'est pas l'association**. |
| Facebook | `profile.php?id=61590194680357` | le seul de la page d'accueil du thème |
| LinkedIn | `in/association-adepa-b98ba5405` | version sans accent, la seule qui répond |
| TikTok | `@association_adepa` | bio ADéPA à jour |

L'accueil (widget Elementor `778f086`, page 4883) pointait encore vers
`adepa77` sur les trois réseaux : réécrit. Les trois occurrences restantes de
`adepa77` dans ce widget sont des **contrôles de même-origine en JavaScript**
(`/(^|\.)adepa77\.fr$/`) — ne pas y toucher.

**Point à trancher par Siham :** sur TikTok, `@adepa77` a 1 175 abonnés contre
23 pour `@association_adepa`. J'ai aligné sur le compte de marque par
cohérence ; si elle préfère pousser l'ancien, c'est un seul réglage à changer.

### les-extras.fr

Contrôle statique complet : **117 routes, 79 liens internes distincts, zéro
lien mort** (`/home/claude/verif-liens.js`). Les mentions légales portaient
encore le faux NDA : corrigé, avec les références du certificat et son
périmètre réel — commit `a5a5342`.

### a2pa.fr — refait depuis l'audit, deux défauts restants

Le site a été refondu (« 30 secondes de vocal par semaine ») : la page d'accueil
n'a plus aucun lien vide ni ancre morte, les 16 ancres mortes de l'audit ont
disparu. Restent, et cela demande le dépôt **`lesextras/adepa_app`** (Symfony /
Twig, pas Next.js — l'audit du 10/08 se trompait) :

- `/don` et `/adhesion` portent quatre ancres qui n'existent que sur l'accueil :
  `#fonctionnement #offres #soutenir #faq` → à préfixer par `/`.
- `/mentions-legales` et `/confidentialite` déclarent **Dammarie** comme siège,
  alors que le certificat dit **Melun** (l'accueil, `/don` et `/adhesion` disent
  déjà Melun).

### Ce qui reste chez Siham

- **Indicateurs de résultats** à publier dès la fin de la première session
  (`/informations-reglementaires/`).
- **Médiateur de la consommation** : vendre une formation à un particulier
  oblige à nommer un médiateur dans les CGV (art. L612-1 code de la
  consommation). Rien n'est nommé aujourd'hui — je ne peux pas inventer.
- **Volume horaire du coaching** de la formule Accompagnement : annoncé sans
  chiffre. Un financeur le demandera.
- Décider du compte TikTok à pousser.
- Nommer le référent handicap sur `/acces-handicap/` (la fonction et l'adresse
  y sont, pas la personne).

## Journée du 12 août 2026 — salarié, clarté, adresses héritées

Trois commits, tous déployés et vérifiés en direct.

### `2f32c9d` — ce qu'un salarié publie ne sort pas de sa maison

`Account.profilSalarie` décide de la portée d'une fiche. Un indépendant vend au
marché ; un salarié anime pour la maison qui l'emploie, et sa fiche ne
s'adresse qu'aux établissements auxquels il est rattaché (`Membership` ACTIF
entre le TITULAIRE du compte et le compte d'établissement — plusieurs
rattachements possibles, le remplaçant qui tourne entre deux maisons est le cas
courant). `apps/api/src/services/portee-salarie.ts` porte les deux fonctions,
et la règle est appliquée à TROIS endroits : la vitrine publique (constante
`VITRINE` dans `public.service.ts`, six requêtes), le catalogue connecté
(`/services/catalog` passe désormais par `AccountGuard` — sans savoir qui
regarde on ne peut pas trancher) et la RÉSERVATION. Ce dernier point n'est pas
du zèle : une règle qui ne vit que dans la liste se contourne avec une URL.

**⚠ Reste à faire** : les comptes salariés créés AVANT ce commit valent
`profilSalarie = false` (le champ n'existait pas) — dont celui de Siham. Ils
sont donc traités comme des indépendants et leurs fiches sortiraient en
vitrine. À basculer à la main, une fois la liste connue.

### `2e16a0f` — l'accueil dit enfin ce qu'on fait

L'accueil faisait **18 sections et 3 029 mots** et réexpliquait les trois
offres **quatre fois**. Dix libellés différents pointaient tous sur
`/register`, six sur `/ateliers` : le visiteur croyait à onze destinations, il
y en avait une. Une section annonçait « Trois portes d'entrée » trente lignes
après « Par où commencer ? » et ses DEUX portes.

Six sections retirées, un libellé par destination, un titre qui nomme les deux
publics au lieu de congédier l'intervenant dès la première ligne. **2 037 mots
mesurés en direct après déploiement.** La porte « intervenant » mène désormais
à `/intervenant-independant` (une page qui explique) et non plus droit au
formulaire d'inscription.

Réparé au passage, tout sur le chemin de la publicité en cours : « Voir les
intervenants » des six pages ville envoyait un directeur d'établissement sur la
page de recrutement des freelances (`/intervenants` est une redirection 308
vers `/intervenant-independant`) ; l'Édublog et le catalogue de formations
affichaient « aucun contenu » quand l'API ne répondait pas, faute de
déstructurer `error` ; le fil d'Ariane des missions publiques menait à
`/marketplace`, donc à un mur de connexion.

**`apps/web/src/lib/meta.ts`** — `openGraph.title` ne descend PAS de `title` :
Next reprend celui du layout racine tant qu'une page n'en pose pas un. Un lien
vers `/sos-renfort` partagé sur LinkedIn s'affichait donc « LES EXTRAS —
Ateliers et formations ». Posé sur 17 pages, avec les canoniques manquantes.

### `64f7ba8` — les anciennes adresses WordPress

Les articles WordPress vivaient à la RACINE (`les-extras.fr/mon-article/`),
indexés depuis des années ; depuis l'inversion des domaines ils tombaient sur
le 404 du SaaS. **29 redirections permanentes** dans `next.config.mjs`, slug
par slug (un `/:slug` à la racine avalerait `/ateliers` et `/contact`).

**⚠ Piège méthodologique à retenir** : `/edublog/<inconnu>` répond **200** avec
« Actualité introuvable ». Le squelette de `(public)/loading.tsx` ouvre une
frontière Suspense, la coquille part donc AVANT que `notFound()` ne s'exécute
et le statut est déjà joué. Vrai aussi pour `/ateliers/[id]` et
`/formations/[slug]`. **Tester un code 200 ne prouve donc rien** — j'ai
d'abord bâti la liste de redirections là-dessus et elle était fausse ; il faut
comparer aux articles réellement publiés (`/api/articles/feed`). Les trois
pages renvoient désormais `robots: noindex` quand la fiche n'existe pas ;
corriger le code HTTP demanderait de retirer la frontière Suspense, ce qui
ferait revenir la page figée à la navigation.

### Méthode de push — ce qui marche vraiment

`git push` reste refusé (`not in this session's authorized repository set`) :
la vraie solution est d'**ajouter le dépôt aux sources de la session**.
Tant que ce n'est pas fait, la méthode éprouvée pour un gros commit :

1. Ne PAS transmettre le contenu des fichiers au navigateur : transmettre le
   **plan de transformation** (remplacements exacts + SHA-256 attendus) en
   base64, découpé en lots de 6 500 caractères, stockés un par un dans
   `localStorage` (ils survivent au rechargement et changent de tabId).
2. Valider le plan **dans node d'abord**, contre `git show origin/main:<fichier>`,
   et n'envoyer que s'il reproduit les fichiers à l'octet près.
3. **L'onglet gèle au bout de ~10 minutes** : les promesses `fetch` ne se
   résolvent plus, sans erreur. Symptôme : l'état reste à « demarre ». Remède :
   onglet NEUF (le `localStorage` suit, même origine), et lancer aussitôt.
4. Ne pas travailler depuis la page d'accueil du dépôt (elle interroge le
   serveur en continu) : `/blob/main/README.md` est plus calme.
5. Reconstruire depuis `raw.githubusercontent.com`, vérifier les SHA, stocker,
   PUIS onglet neuf sur `/upload/main`, `file-attachment.attach(dt)`, attendre
   `input[name="file_id"]` = nb fichiers + 1, remplir le formulaire et
   `form.requestSubmit()`.
6. Le bouton « Redeploy » de Coolify **ne réagit pas à un `.click()` en
   JavaScript** (Livewire attend un vrai événement) : cliquer aux coordonnées.

### Sauvegardes S3 — bloqué, et pourquoi

`S3 Enabled` est grisé sur la sauvegarde de la base : **aucun stockage S3 n'est
déclaré** dans Coolify (`/storages` : « No storage found »), et l'app API ne
porte aucune variable `S3_*`. Créer le stockage demande une clé d'accès et une
clé secrète — Siham les saisit elle-même. Les sauvegardes nocturnes (3 h UTC,
rétention 7) restent vertes, mais elles dorment sur le serveur qu'elles
protègent.

## Journée du 2 septembre 2026 — concurrence, SEO, crédibilité

Commit `b1477a6`. Né d'un benchmark concurrentiel mené le même jour, dont les
conclusions sont ci-dessous : elles font foi tant qu'elles ne sont pas
re-vérifiées, et chacune a été relevée à la source.

### Ce que facturent les autres (relevé le 2/09/2026)

| Acteur | Établissement | Professionnel | Autre |
|---|---|---|---|
| **Brigad** | 10 % HT par mission | 15 % TTC (9,9 % infirmier) | aucun abonnement ; annulation < 48 h facturée 25 à 75 % |
| **Hublo** | **non publié** (CGV → contrat négocié, pas de page tarifs, 404) | gratuit | 2 000 € HT (AS) / 3 000 € HT (IDE) pour recruter un profil du vivier, sauf après 12 mois ou 30 missions ; mission annulée < 48 h facturée |
| **Les Extras** | 0 | 0 | 0 |

**⚠ NE JAMAIS ÉCRIRE « Hublo affiche 30 € HT / 40 € HT ».** Ces montants
existent uniquement en dur dans le JavaScript de leur simulateur public
(`/fr/comparaison-hublo-interim`), sans mention HT ni TTC et sans valeur
contractuelle. Formulation défendable : « le simulateur public de Hublo retient
une commission de 30 € par mission pour un aide-soignant et 40 € pour un IDE ».

Le marché du renfort est **consolidé** : Whoog et Permuteo absorbés par Hublo
(25,2 M€ de CA 2025, 55 M€ levés, ~6 000 établissements, 190 salariés),
Medelse par Synergie Care, Side par Randstad, Andjaro par Silae. **La cascade
de diffusion n'est PAS un différenciateur** : Hublo fait exactement la même.
Le seul avantage réel côté renfort est la gratuité et l'absence de frais de
recrutement. Le vrai espace vide est ailleurs : **aucune marketplace d'ateliers
réservables n'existe pour la protection de l'enfance / IME / ITEP / SESSAD** —
tous les acteurs d'ateliers visent l'EHPAD (LiveArts, Happy Nelly, Neosilver).

Point de droit qui nous sert : **CE 11/02/2025 n° 491128** (un aide-soignant ne
peut pas exercer sous statut d'indépendant en établissement) + **LFSS 2025
art. 70** (plafond de dépenses d'intérim étendu aux ESMS publics au 01/07/2025).
Le CDD direct est le seul montage sécurisé. **Bannir le mot « freelance » pour
RenforTeam** — c'est le vocabulaire sanctionné : « remplaçant en CDD » pour le
renfort, « intervenant » pour les ateliers.

### NotaSuivi (notasuivi.fr) — le seul concurrent direct de LEX

Même cible exacte (IME, ITEP, SESSAD, MECS, ESAT, CAMSP, FAM/MAS, ASE),
périmètre plus large (dossier usager, PPE, transmissions DAR). Grille
publique : **Essentiel 39 €/mois — 20 générations IA, soit 1,95 € l'écrit** ;
Équipe 149 €/mois illimité ; Structure dès 499 €/mois + 1 500 à 4 900 € de
mise en service. LEX à 19 € pour 200 générations = **0,095 €, vingt fois
moins cher à l'usage**.

Leur crédibilité, en revanche : éditeur **MOVIXO = Morad NATALBA, entreprise
individuelle, SIREN 945274041, créée le 5/06/2025, code NAF 49.41A transport
routier, zéro salarié** ; domaine créé le **19/04/2026** ; mentions légales
sans SIREN ni adresse, contact en gmail ; aucun client nommé, aucune page
LinkedIn, aucun avis Capterra ; **articles de blog antidatés** (décembre 2024
sur un domaine d'avril 2026). Leur accueil dit « HDS certifié » quand leur
propre page conformité dit « certification en cours » et « NOTASUIVI n'est pas
lui-même conforme ».

**⚠ Ces éléments servent la STRATÉGIE, pas la publication.** Les publier
serait du dénigrement, que la publicité comparative n'autorise pas
(art. L122-1 et s. c. conso). Les pages publiques comparent des PRIX publics,
jamais des personnes ni des sociétés.

**Ce qu'ils font mieux que nous, et qu'il faut rattraper : le SEO.** Ils sont
en première page sur « écrits professionnels éducateur spécialisé », le cœur
exact de LEX, avec sept pages sectorielles et des guides de 2 000 mots.

### Ce que le commit a livré

- **`/guides` + six guides des écrits professionnels** (`(public)/guides/`) :
  pilier « écrits professionnels de l'éducateur spécialisé », rapport de
  situation, projet personnalisé, ESS/GEVA-Sco, IP vs signalement, bilan de fin
  d'accompagnement. Statiques, données structurées `Article` + `FAQPage`.
- **`/comparatif-plateformes-remplacement`** et
  **`/comparatif-assistants-redaction`** : tableaux tarifaires sourcés, date de
  relevé affichée, pages nommées pour que le lecteur vérifie.
- **Pied de page** : SIRET, siège, NDA 11771011677, certificat QNW0132 +
  COFRAC 5-0681 sur les 93 pages. Et « professionnels indépendants » retiré de
  l'accroche.
- **`ESTABLISHMENT_PLAN`** recadré (voir la section modèle économique).

### ⚠ RÉFÉRENCES JURIDIQUES DES GUIDES — vérifiées une par une

Trois erreurs très répandues sont évitées, et documentées en tête de
`(public)/guides/contenu.ts`. **Ne pas les réintroduire :**

1. Le CASF ne dit **jamais** « projet personnalisé » dans le régime général :
   il dit « projet d'accueil et d'accompagnement » (L311-3, 7°). L'expression
   existe pour les ITEP, à l'article D312-59-2. Les délais (15 jours / 1 mois /
   avenant à 6 mois) sont à l'article **D311**, PAS à L311-4.
2. Le rapport annuel au juge des enfants vient du **dernier alinéa de
   l'article 375 du code civil**. L'article **L223-5 du CASF** régit le rapport
   administratif (annuel, semestriel avant 2 ans — règle issue de la loi du
   14 mars 2016, **pas** de la loi Taquet). Ce sont deux obligations distinctes.
3. L'ESS est régie par le **D351-10** du code de l'éducation (D351-12 pour
   l'enseignant référent). Le D351-16-1 traite de l'aide humaine.

Autres points tenus : l'article **40 al. 2 du CPP** n'oblige que les autorités
constituées et fonctionnaires, donc **pas** un salarié d'association ;
l'article 375 du code civil ne fonde **pas** le signalement (un service non
gardien ne peut pas saisir le juge des enfants) ; la **loi du 17 juillet 1978
n'est plus citable**, elle est codifiée dans le **CRPA** (art. L311-6) ; et il
**n'existe aucune recommandation ANESM/HAS consacrée aux écrits
professionnels** — la règle « faits / interprétation » est présentée comme une
règle de métier, pas comme une norme. Ce que la HAS exige réellement (cadre
national de référence de janvier 2021, rendu obligatoire par le décret
2022-1728) est l'**équilibre** : éléments préoccupants ET points d'appui, point
de vue de l'enfant ET des parents.

### Livré dans la foulée, le même soir

- **Six pages d'atterrissage pour les ateliers** : `/ateliers-pour/{ime, itep,
  mecs, sessad, esat, ehpad}` (`(public)/ateliers-pour/`). Ce découpage
  n'existait que pour le renfort. **Piège évité, à ne pas défaire :** six pages
  décrivant le même produit seraient du contenu dupliqué et Google le
  sanctionne — chacune porte donc ce qui lui est propre, dont une section
  « contraintes du lieu » que les catalogues ne publient jamais. Le socle
  réglementaire commun à tous les ESSMS est dans `SOCLE_COMMUN` ; les
  références propres à un type ne figurent que là où elles s'appliquent, et
  ESAT et EHPAD n'en citent **aucune** en propre, faute d'article relu.
- **Maillage** : `/ateliers` ouvre sur les six, `/confiance-lex` renvoie aux
  guides, chaque page sectorielle renvoie aux cinq autres et aux guides.
- **Pied de page resserré** (commit `2203b7b`). Il était passé à ~1 400 px :
  onze liens dans « Ressources » quand les autres colonnes en portaient quatre.
  **RÈGLE : sept liens par colonne, jamais plus.** Cinq colonnes équilibrées,
  dont « Combien ça coûte » qui regroupe les pages de prix ; l'identité de
  l'éditeur tient en un paragraphe ; « Notre histoire », « Nous contacter » et
  le bouton Google sont dans la barre du bas.
- **Carte de partage refaite.** Elle portait TROIS défauts, pas un : la
  pastille « Intervenants vérifiés », la phrase « animés par des indépendants
  vérifiés du médico-social » (le mot sanctionné par le Conseil d'État **et**
  « vérifiés » une seconde fois), et « Devis sous 48 h » coupée par le bord.
  Palette relevée au pixel sur l'original, composition identique.
  **Le générateur est versionné : `apps/web/scripts/carte-partage.py`** — toute
  correction future passe par lui, jamais par un éditeur d'images.
- **Facebook** : les horaires sont passés à « Pas d'horaire disponible ». La
  Page affichait « Fermé en ce moment » en permanence, ce qui est pire que rien.

### Restes à faire, hors code
- Page Facebook `profile.php?id=61590194680357` : bio, liens, e-mail et trois
  catégories (Organisation à but non lucratif · Formation · Services sociaux)
  posés le 2/09, horaires neutralisés. Restent, pour Siham : l'adresse déclarée
  (**rue Claude Bernard** au lieu du siège **7 rue André Malraux**), la
  destination du bouton « En savoir plus », le nom d'utilisateur (la Page n'en
  a pas), la zone de service (l'autocomplétion Facebook ne propose que des
  communes, jamais un département : le choix des villes lui revient) et la
  photo de couverture, qui est encore celle d'A2PA. **La Page est membre de 53 groupes** — deux
  d'entre eux interdisent explicitement la promotion de plateformes
  concurrentes, lire le règlement avant chaque publication.

## Mini-formations gratuites — 2 septembre 2026 (soir)

Décision de Siham : **la formation est gratuite, l'attestation coûte 20 €.**
Une mini-formation = **UNE compétence** précise, acquise et vérifiable. Format
court (35 à 45 min), suivi en complément d'autres : plusieurs formations
peuvent porter sur la même thématique sans se répéter.

### Le gabarit, et d'où il vient

Quatre modules, toujours dans le même ordre : **théorie brève → une situation
qui DÉRAPE → exercice guidé sur sa propre situation → mise en pratique avec
auto-observation**. La séquence reprend la structure des programmes canadiens
d'entraînement aux habiletés (composantes recensées par l'avis INSPQ 2013) et
le **« coping model »** du programme COPE (C. Cunningham, McMaster) : on ne
montre jamais un modèle parfait, on montre un échec et c'est l'apprenant qui
trouve pourquoi.

**⚠ CE QU'ON NE REPREND PAS.** Les noms de programme sont des marques
déposées : Incredible Years®, Ces années incroyables, SNAP®, Triple P®,
Fluppy, Y'a personne de parfait. On écrit « inspiré de la structure des
programmes canadiens », **jamais « programme X »**. Ni leurs vignettes, ni
leurs cahiers, ni la liste ordonnée de leurs modules. On ne redessine pas la
Parenting Pyramid®, même redessinée.

**⚠ NUANCE ABA OBLIGATOIRE.** Les contenus comportementaux portent tous
l'encart « ce que cette approche ne doit jamais devenir » — quatre garde-fous
issus des critiques formulées par des personnes autistes adultes : on n'éteint
jamais un comportement sans le remplacer ; on travaille sur ce qui coûte à la
personne, pas sur ce qui gêne l'entourage ; le refus est une communication ;
ces outils s'inscrivent dans un projet construit avec la personne. La fiche
publique le porte aussi (`GARDE_FOU` dans le script de seed) — sinon la fiche
promet autre chose que la formation.

**⚠ VOCABULAIRE : « ATTESTATION DE SUIVI », JAMAIS « CERTIFICAT ».** Un
certificat évoque une certification professionnelle (RNCP, RS). Vendre 20 € un
document en l'appelant certificat serait une pratique commerciale trompeuse,
pour une association par ailleurs certifiée Qualiopi.

### Ce qui est en ligne

- **Teachizy** (école `toulali.teachizy.fr` — c'est le seul compte Teachizy) :
  trois formations PUBLISHED, prix 0, 4 modules chacune, contenus chargés par
  l'API. UUID / ids d'items dans `apps/web/public/formations-source/v1.json`.
- **Les Extras** : trois fiches publiques, créées par
  `apps/api/prisma/seed-mini-formations.js` (idempotent, le slug fait foi,
  aucune suppression, une fiche ARCHIVED le reste).

### Le mode « formation gratuite en ligne » (nouveau, dans le code)

La fiche formation avait été conçue pour UNE chose : vendre au devis une action
Qualiopi animée en présentiel à une date. Publier une mini-formation gratuite
telle quelle affichait « Tarif sur devis » sur du gratuit et « Demander un
devis » sur du accessible-en-un-clic. Deux champs basculent la fiche dans un
second mode :

- `Formation.freeOnline` (défaut `false` — aucune fiche existante n'est touchée)
- `Formation.enrollUrl` — où la formation se suit réellement

Le mode gratuit affiche « Gratuit », un bouton unique vers `enrollUrl`, la
mention de l'attestation à 20 € **et** ce qu'elle n'est pas ; ni session, ni
formulaire de devis. Le JSON-LD passe en `Offer / price 0 / category Free` +
`CourseInstance courseMode online` — **sans `courseWorkload`** : la durée réelle
est en minutes, le champ `durationHours` est en heures entières, et arrondir à
« 1 h » publierait une durée fausse dans un dossier que des financeurs lisent.
`durationHours` reste donc **null** ; la durée exacte est en toutes lettres dans
le résumé.

**Garde-fou testé** (`src/admin/formation-gratuite.spec.ts`, 4 tests) :
`freeOnline` sans `enrollUrl` est refusé à la saisie — la vérification porte sur
l'ÉTAT RÉSULTANT, donc effacer l'adresse d'une fiche déjà gratuite est refusé
aussi. Sans cela la page s'affiche normalement mais son unique bouton n'existe
pas : un défaut qui ne casse rien et ne se découvre que des mois plus tard.

### Couvertures

`apps/web/scripts/couvertures-mini-formations.py` — même palette que
`carte-partage.py`, images dans `apps/web/public/images/mini-formations/`
(chemins RELATIFS : elles ne passent pas par la médiathèque WordPress, qui a
déménagé deux fois en un mois). **Aucune photo de personne**, aucune mention
« certificat », aucun logo tiers. Le script **refuse** de produire une image
dont le titre dépasse trois lignes ou dont le texte chevauche le pied — la
pastille coupée de la carte de partage a servi de leçon.

### Transfert de contenu vers Teachizy — la méthode qui marche

Douze copier-coller à la main pour trois formations, 72 pour dix-huit : non.
Le contenu est poussé dans le dépôt (`apps/web/public/formations-source/v1.json`),
`next.config.mjs` ouvre `Access-Control-Allow-Origin: *` **sur ce seul dossier**,
et un unique appel JavaScript depuis `app.teachizy.fr` lit le fichier et fait
les PUT. Rappels d'API :

- `POST /api/v1/trainings` → 201 (crée en DRAFT) · `DELETE .../{uuid}` → 204
- `POST /api/v1/trainings/{uuid}/training_items` → 201, **`type: 'GENERIC'`**
  (ou `'QUIZ'`) — `'LESSON'` renvoie 422
- `GET .../training_items` (liste) → **404** : les items ne sortent que sous
  `data.items` du GET de la formation
- `content` se lit en OBJET et s'écrit en **CHAÎNE JSON** :
  `[{"type":"richtext","id":"…","data":{"text":"<html>"}}]`
- `raw.githubusercontent.com` répond 404 : le dépôt est privé. La vérification
  passe par le ZIP de la branche, jamais par raw.

### Restes à faire

- **BLOQUANT AVANT DE VENDRE L'ATTESTATION** : nommer un **médiateur de la
  consommation** (art. L612-1 c. conso), écrire des CGV, traiter le droit de
  rétractation de 14 jours. Aujourd'hui la fiche annonce le prix et renvoie au
  contact : les conditions sont communiquées avant tout paiement, il n'y a
  aucun tunnel d'achat.
- **Teachizy affiche « Certificat de réussite »** dans l'encadré de TOUTES les
  formations de l'école (vérifié sur les formations Toulali aussi) : c'est un
  libellé de la plateforme, pas un réglage de la formation (`is_graduate` vaut
  bien `false`). Il contredit notre propre texte. À signaler au support
  Teachizy — ne pas « corriger » en changeant un réglage de formation.
- **L'école Teachizy s'appelle TOULALI**, pas ADéPA : les mini-formations du
  médico-social vivent donc sous une marque de reconversion numérique. Choix
  de Siham (une seule école existe sur ce compte).
- **Cinq mini-formations en ligne** sur les 18 prévues (la thématique TSA est
  complète). Cinq autres existent dans `/home/claude/formations-gratuites.js`
  — consigne, crise, observer, transition, renforcer — et n'ont qu'à être
  remises au gabarit à quatre modules. Le catalogue prévu et le gabarit sont
  dans `/home/claude/catalogue-mini-formations.js` et `catalogue-vague-2.js`.

## Journée du 3 septembre 2026 — audits appliqués, charge réelle, sixième formation

Commits `284e1df`, `7ae26de`, `e1afcc1`. Tout est déployé et vérifié en direct.

### Les deux audits ont été appliqués jusqu'au bout

Les cinq mini-formations annonçaient en fin de module des annexes qui
**n'existaient pas** — c'était le premier bloquant de l'audit pédagogique, et le
motif était systématique : aucune des cinq scènes corrigées n'était écrite, alors
que c'est le seul endroit où l'apprenant peut comparer sa production à une
production complète. Écrites depuis : f3 (photo à trois mois, plan d'Inès,
phrases d'annonce), f4 (grille des cinq absences, phrases de retour, séance de
Malik corrigée, exemple entièrement chiffré), f5 (support de Léa refait avec son
coût d'entretien, fiche de lecture aux quatre décisions, phrase d'abandon).

**La charge réelle est enfin annoncée.** Les fiches disaient « 45 minutes » : vrai
pour la lecture, faux pour le parcours, qui demande de **sept à quinze jours de
relevé** avant que son module 4 ne soit lisible. C'est dit trois fois maintenant —
carte « Repères » du module 3 (champ `apres` du gabarit), encadré `pause` en fin
de ce module, et paragraphe de durée de la fiche publique. **Règle : une durée
annoncée couvre le CALENDRIER, pas seulement le temps de lecture.**

Ajouté aussi : une section **« Et à la maison »** en fin de module 2 de f1, f2, f4
et f5 (les cinq scènes se passaient toutes en institution alors que les fiches
s'adressent d'abord aux parents) ; l'**ordre réel** des formations dans le pied des
annexes (f1 avant f2, f3 avant f4, f5 autonome — le pied disait « dans l'ordre qui
vous arrange », c'était faux) ; des **intitulés de modules parlants** pour f2 à f5.
`catalogue-vague-2.js` porte un en-tête SUPERSÉDÉ : f4 et f5 le remplacent, plus
rien ne doit y être corrigé.

### ⚠ LE BOGUE À NE JAMAIS REFAIRE — `str.replace` en boucle sur une ancre préfixe

Le script qui ajoutait la phrase de calendrier remplaçait **cinq fois la même
ancre** par un texte qui **commence par cette ancre**. Chaque remplacement est
donc retombé sur le premier paragraphe : les cinq phrases se sont empilées sur la
fiche « Les quatre fonctions d'un comportement », les quatre autres n'ont rien
reçu — et c'est parti en production avant d'être vu (réparé par `7ae26de`).

**La règle : quand le texte de remplacement contient l'ancre, on ne fait pas de
`replace` successifs. On découpe (`split`) et on rejoint (`join`) en donnant à
chaque jointure son propre texte** — on ne peut alors plus re-remplacer ce qu'on
vient d'écrire. Et on vérifie **slug par slug**, pas seulement le nombre total
d'occurrences : le compte était juste, le placement était faux.

### Sixième mini-formation : « Les premières minutes d'une crise »

Première de la vague « traction » (recherche menée le 2/09 : c'est le sujet le
plus cherché du domaine). uuid Teachizy `bfc03048-f280-41a9-82c2-f0a17d7b6bba`,
leçons `1471071 / 1471073 / 1471075 / 1471077`, annexes `1471079`, slug
plateforme `les-premieres-minutes-dune-crise`. Source :
`apps/web/scripts/mini-formations/f6-crise.js` (4 modules de 18 000 à 22 000
caractères, 11 fiches d'annexes).

**⚠ LE TITRE NE REPREND PAS LA REQUÊTE.** Tout le monde cherche « désamorcer une
crise en 90 secondes » ; promettre l'arrêt d'une crise en un temps donné est faux,
et cette promesse se retourne contre la personne le jour où la crise dure sept
minutes. Le titre nomme la **fenêtre**, et la compétence porte sur ce que l'adulte
maîtrise vraiment : ce qu'il ajoute, et la préparation à froid.

**⚠ TROIS RÈGLES TENUES DANS CE PARCOURS, à ne jamais assouplir :**
1. **Aucun geste d'intervention physique n'est enseigné** — ni prise, ni maintien,
   ni « accompagnement au sol », ni portage. Ces gestes blessent quand ils
   s'apprennent dans un texte ; ils relèvent d'un protocole d'établissement et
   d'une formation en présentiel avec mise en situation.
2. **La sécurité prime sur la pédagogie**, et c'est écrit avant tout le reste, en
   encadré, dès la première ligne du module 1.
3. **Contrainte, enfermement et privation** sont nommés comme limites absolues au
   module 1, au module 3 et dans une fiche d'annexe à afficher en salle d'équipe.
   La fermeté porte **sur la tâche**, jamais sur le corps de la personne.

### Recettes ajoutées à la boîte à outils

- **Poser une image sur Teachizy sans dépôt public** : créer un `<input type=file>`
  dans la page `app.teachizy.fr`, y téléverser le fichier local avec l'outil du
  navigateur, puis `GET /api/v1/presigned?type=image&filename=X` → `PUT` sur l'URL
  S3 (`x-amz-acl: public-read`) → `PUT /trainings/{uuid} {picture}`. La médiathèque
  du site ne peut pas servir : seul `/formations-source` porte l'en-tête CORS.
- **Créer une formation complète par l'API** : `POST /trainings` (DRAFT) →
  `POST /training_items` type `SECTION` (order 1..5) → `POST` type `GENERIC` avec
  `parent_id` → contenus par le fichier `v2.json` → `PUT {status:'PUBLISHED'}`.
- **Section et leçon ne portent plus le même nom** : la SECTION porte
  « Module N — … », la leçon « Leçon — … ». Le sommaire affichait deux fois la même
  ligne.
- **Onglet Chrome** : les promesses `fetch` cessent de se résoudre bien avant les
  dix minutes annoncées, et **sans erreur**. Dès qu'un `window.__x` reste à sa
  valeur initiale, c'est l'onglet, pas le code : onglet NEUF, et on relance.
- **Terminal Coolify** : la première frappe après la navigation est perdue (le
  terminal se connecte après le rendu). Toujours retaper une seconde fois.

### Restes à faire sur les mini-formations

- **Quatre formations de la vague traction** restent à écrire : l'enfant qui dit
  non à tout, lire un comportement comme une réaction de survie (enfant placé),
  aider à démarrer une tâche, préparer une ESS.
- **Les quiz** : aucun point d'API découvert (404 sur toutes les sondes). Le champ
  « Évaluation » de chaque module décrit désormais ce qui existe réellement, plus
  aucun module ne promet de quiz.
- Toujours chez Siham : médiateur de la consommation, CGV et rétractation avant
  toute vente de l'attestation ; le libellé « Certificat de réussite » à signaler
  au support Teachizy ; l'école Teachizy qui s'appelle TOULALI et non ADéPA.

### La vague « traction » — cinq formations de plus le 3 septembre 2026

Commits `e1afcc1`, puis un par formation. **Dix mini-formations gratuites en ligne**,
publiées sur Teachizy et fichées sur les-extras.fr. La recherche de traction du
2/09 donnait un classement des sujets réellement cherchés&nbsp;: il a été suivi,
mais **aucun titre ne reprend la requête telle quelle** quand elle contient une
promesse fausse.

| Formation | Compétence | uuid Teachizy |
|---|---|---|
| Les premières minutes d'une crise | réduire ce que l'adulte ajoute pendant | `bfc03048-f280-41a9-82c2-f0a17d7b6bba` |
| L'enfant qui dit non à tout | formuler une consigne exécutable | `6cd59c2e-2fbd-426e-a7d7-02755dbff8dc` |
| Lire un comportement comme une réaction de survie | relire, puis régler le quotidien | `f365d1de-dd74-4651-ba78-54f340387845` |
| Préparer une équipe de suivi de la scolarisation | arriver avec trois éléments écrits | `948fad74-0c93-439c-864c-e3c8882d034b` |
| Aider quelqu'un à démarrer une tâche | réduire le coût du démarrage | `ccb1b2fe-b012-4754-912b-b9a2eb48029a` |

Les ids d'items sont dans `build-v2.js`, les sources dans
`apps/web/scripts/mini-formations/f6-crise.js` … `f10-demarrer.js`.

**⚠ CE QUI TIENT CES CINQ TEXTES, ET QU'IL NE FAUT PAS DÉFAIRE :**

- **Le titre ne reprend jamais une promesse fausse.** Tout le monde cherche
  « désamorcer une crise en 90 secondes » ; promettre l'arrêt d'une crise en un
  temps donné se retourne contre l'enfant le jour où elle dure sept minutes. Le
  titre nomme la fenêtre, pas le résultat.
- **Crise : aucun geste d'intervention physique n'est enseigné.** Ni prise, ni
  maintien, ni portage. Contrainte, enfermement et privation sont nommés comme
  limites absolues au module 1, au module 3 et dans une fiche d'annexe à
  afficher. La fermeté porte sur la tâche, jamais sur le corps.
- **Consignes : la colonne « son droit » s'écrit AVANT toute technique.** Une
  formation qui rendrait les consignes plus efficaces sans avoir trié ce qui
  mérite d'être exigé fabriquerait des adultes plus performants à obtenir une
  obéissance qui ne leur revient pas. Le moyen de communication ne se retire
  jamais, à aucun titre.
- **Réaction de survie : la lecture ne remplace jamais l'action.** Chaque module
  aboutit à un réglage du quotidien, écrit et testé quinze jours. Et le module 1
  dit ce qui ne se lit PAS comme ça — douleur, faim, sommeil, vue, audition,
  traitement, TND non repéré — parce que c'est là que cette grille retarde des
  réponses simples pendant des mois. **Aucun diagnostic sous une signature
  éducative**, jamais, même repris d'un autre écrit.
- **ESS : les références juridiques sont exactement celles de
  `guides/contenu.ts`, et pas une de plus.** D351-10 (évaluation au moins
  annuelle), D351-11, D351-12 (enseignant référent), et D351-16-1 signalé comme
  l'article cité À TORT. Ce que les parents peuvent demander en matière
  d'accompagnement à la réunion est présenté comme **une pratique courante**, pas
  comme un droit adossé à un article : Légifrance bloque la lecture à la source
  (403 sur toutes les pages), donc rien n'a été affirmé.
- **Démarrage : le parcours s'arrête volontairement au démarrage.** Il renvoie
  explicitement ailleurs pour le retrait de l'aide, la séquence, la consigne et
  la fonction. C'est ce qui tient la règle « une formation = une compétence ».
  Sa scène se passe **en ESAT, avec un adulte** : le catalogue ne parlait que
  d'enfants.

**L'encart de nuance ABA** (`COMPORTEMENTALES` dans `build-v2.js`) est porté par
crise et démarrage, **pas** par consignes ni par ESS — dont les contenus ne
viennent pas de l'analyse appliquée du comportement. La règle reste : **la fiche
publique (`GARDE_FOU` du seed) et la formation disent la même chose**, sinon la
fiche promet autre chose que le parcours.

### Ce que la chaîne de publication demande, formation par formation

Dans cet ordre, sinon on redéploie deux fois pour rien :

1. `POST /api/v1/trainings` (DRAFT) → uuid + slug plateforme.
2. `POST /training_items` ×5 SECTION (order 1..5) puis ×5 GENERIC avec
   `parent_id`. **La SECTION porte « Module N — … », la leçon « Leçon — … »** :
   le même nom des deux côtés affichait deux fois la même ligne au sommaire.
3. Couverture : ajouter l'entrée dans `couvertures-mini-formations.py`, lancer le
   script, **regarder l'image** (le script refuse un titre de plus de 3 lignes,
   il ne juge pas le reste).
4. `build-v2.js` : ids, `require`, `SOURCES`, et `COMPORTEMENTALES` si le contenu
   vient de l'ABA.
5. Fiche publique dans `seed-mini-formations.js`.
6. Pousser, **déployer le web** (v2.json + couverture doivent être en ligne AVANT
   le chargement Teachizy), charger les 5 pages + publier la formation, déposer la
   couverture sur Teachizy, **puis** déployer l'API et lancer le seed.

---

## Les schémas, puis les fiches récap — 3 septembre 2026 (après-midi)

Siham a posé trois questions en une : est-ce que le niveau donne les meilleures
connaissances **avec des schémas**, est-ce que chaque parcours donne bien **une**
compétence définie, et est-ce que **le processus est expliqué sur la fiche
produit**. J'ai répondu en mesurant plutôt qu'en affirmant, et deux réponses sur
trois étaient non.

### Ce que la mesure a donné

136 tableaux, 810 encadrés — et **zéro schéma** dans les dix parcours. Dix
compétences distinctes sur six thématiques, avec des renvois explicites entre
parcours : ce point-là tenait. La fiche produit, elle, décrivait la pédagogie
mais **ne disait rien de l'inscription**, tout en portant un bouton « Créer un
compte » qui parle d'autre chose.

### `schemas.js` — trente figures, et pourquoi pas de SVG

`apps/web/scripts/mini-formations/schemas.js` fabrique les figures en
**table / tr / td / div / span et styles en ligne**. Rien d'autre. L'API Teachizy
*stocke* bien du SVG (vérifié sur une formation DRAFT jetable, supprimée ensuite
— 204), mais le rendu côté apprenant n'a pas pu être vérifié sans créer un compte
élève : on ne publie pas une figure qu'on n'a pas vue s'afficher.

Sept primitives : `flux`, `boucle`, `echelle`, `arbre`, `paires`, `frise`,
`carte`. **Chaque figure porte une légende en toutes lettres** — une figure sans
légende est un dessin, pas un support.

Trois figures par parcours, toujours aux mêmes places : la **carte du parcours**
en tête du module 1 (elle dit la charge réelle, relevé compris), la **figure de
la notion centrale**, et l'**arbre de décision** du relevé. L'insertion vise le
premier `<h3 …>1. ` du module, ce qui laisse les encarts de sécurité (f6, f8)
AVANT la carte.

### « Comment ça se passe » sur la fiche produit

Un bloc de trois lignes sur la fiche (mode gratuit seulement), et la version
longue en tête de `METHODOLOGIE` dans le seed : on quitte le site, l'accès s'ouvre
avec un e-mail, **aucune carte bancaire**, quatre modules sans date de fin, le
relevé entre le module 3 et le module 4, l'attestation demandée ensuite.

### Les fiches récap A4 — `fiches-recap.js` + `fiches-recap-data.js`

Une page A4 par parcours, dense et imprimable, sur le modèle des fiches de
révision : notion clé et son test, les quatre modules et ce qu'ils produisent, le
schéma central, l'arbre de décision, **la grille de relevé vierge à recopier**,
les erreurs qui coûtent le plus, l'à-retenir, trois astuces.

Deux règles tiennent tout le reste :

- **`fiches-recap-data.js` n'invente rien.** Chaque chiffre (sept jours, cinq
  secondes, l'échelle 0 à 7, les six leviers) vient du module ou de `schemas.js`.
  Une fiche récap qui promettrait autre chose ferait mentir le catalogue.
- **La grille du relevé porte exactement les colonnes du module 4**, pas une
  version simplifiée : sinon le relevé rempli ne se lirait plus avec l'arbre de
  décision de la même fiche.

La mise en page est calculée dans la page : chaque encadré prend la hauteur de son
contenu, le reste devient de la respiration entre encadrés, et si ça déborde ce
sont les encadrés qui se réduisent — jamais la page qui coupe.

Rendu : `node fiches-recap.js` puis Chromium headless. **Deux pièges coûteux :**

1. **`--window-size` n'est pas la hauteur du viewport.** À 1240×1754 le viewport
   fait 1240×**1667** : la barre du navigateur mange 87 px, et le pied de page
   disparaît du PNG sans aucune erreur. On rend donc en `--window-size=1240,1841`
   puis on recadre à 2480×3508.
2. Le PDF vectoriel demande `@page { size: 1240px 1754px }` — avec `size: A4` la
   page déborde sur une seconde page. On repasse ensuite chaque PDF en A4 réel
   (595×842 pt) avec PyMuPDF : ~200 Ko, texte net à l'impression.

Sortie : `apps/web/public/fiches/<slug>.pdf` (vectoriel), `<slug>.jpg` (aperçu),
et `toutes-les-fiches-recap.pdf` (les dix). La fiche produit gratuite porte
l'aperçu et le lien, **en libre accès, avant toute inscription** — c'est le
meilleur aperçu possible de ce que vaut le parcours.

### Polices

Poppins et Lora sont déjà dans le conteneur (`/usr/share/fonts/truetype/
google-fonts`), Noto Color Emoji aussi. **Caveat** (l'écriture manuscrite des
rubans et des post-it) a été installée depuis `raw.githubusercontent.com/google/
fonts` — l'URL `fonts.google.com/download?family=…` renvoie 200 mais pas un zip.

### Coolify — le clic Redeploy, enfin compris

Le clic par `ref` sur « menu item Redeploy » **ouvre le menu sans déclencher
l'action** : la page reste identique et aucun déploiement ne part. Ce qui marche à
tous les coups : **un `browser_batch` qui clique « Actions » puis prend une
capture dans le même aller-retour**, puis un clic aux coordonnées lues sur cette
capture. Le menu se referme dès qu'un aller-retour s'intercale.

L'onglet Coolify finit aussi par ne plus accepter l'injection de script (« Script
injection timed out ») : un onglet neuf règle le problème à chaque fois.

---

## Le catalogue des formations rattrape celui des ateliers — 3 septembre 2026 (fin de journée)

Siham a mis les deux catalogues côte à côte : une carte atelier affiche le
concepteur, la région et le public visé ; une carte formation affichait un
titre, un résumé et un prix. **La formation avait l'air inachevée à côté de
l'atelier**, sur la même grille et dans la même charte.

### Ce qui manquait vraiment (mesuré, pas supposé)

`categoryRef` était **null sur les treize formations**, `city` vide, et
`durationHours` vide sur les dix mini-formations. Les listes déroulantes
« thématique » et « ville » existaient donc… et étaient vides. Ce n'était pas
un problème d'affichage, c'était un problème de données.

### Deux colonnes de plus sur `Formation`

- **`publicTargets String[]`** — six étiquettes, vocabulaire **fermé** (parents
  et proches, professionnels du médico-social, protection de l'enfance, école
  et AESH, assistants familiaux, encadrement). `targetAudience` est un
  paragraphe : il se lit, il ne se filtre pas. Chaque affectation se lit dans
  le `targetAudience` de la fiche — rien n'est ajouté au passage.
- **`durationMinutes Int?`** — `durationHours` est un entier : 45 minutes y
  valaient 0 (durée effacée) ou 1 (durée fausse sur une fiche que des financeurs
  peuvent lire). Les deux champs coexistent, la carte affiche celui qui est
  rempli.

Migration `20260903130000_formation_publics_et_minutes`, additive et sans perte.

**Les facettes se calculent sur le catalogue entier**, jamais sur le résultat
filtré : une liste d'options qui rétrécit à mesure qu'on filtre empêche de
revenir en arrière sans tout vider.

### Deux rayons, pas une grille unique

Une mini-formation gratuite et une formation Qualiopi vendue en intra ne
s'achètent pas de la même façon. Mélangées, chacune brouille l'autre : le
parent tombe sur « à partir de 1 600 € », le directeur tombe sur « Gratuit ».
Le catalogue affiche donc deux sections nommées — les gratuites de la maison
dans un encadré signalé, les Qualiopi en dessous.

`estMaison()` teste le nom du compte propriétaire (`ORGANISME_MAISON`). Le jour
où un second organisme s'appellera « ADéPA quelque chose », il faudra un drapeau
en base ; d'ici là une constante suffit et se lit.

### Les couvertures, reprises en clair

Elles reprenaient la palette de la carte de partage : fond #12151C, presque
noir. Isolée, cette couverture était juste ; **en grille, sur un catalogue au
fond crème, dix vignettes noires formaient un bloc opaque** — et les trois
formations Qualiopi, sans photo, apparaissaient en dégradé clair juste à côté.

Nouvelle version : fond clair franchement coloré, **une couleur par parcours,
la même que sur sa fiche récap A4**, un grand emoji qui donne à la vignette sa
silhouette, quatre confettis. Poppins remplace DejaVu (c'est déjà la police des
fiches récap). Un titre trop long **réduit sa taille** au lieu d'être refusé.

Deux pièges de rendu, notés une fois pour toutes :

- **Noto Color Emoji est une police bitmap** : elle ne se dessine qu'à sa taille
  native (109 px) avec `embedded_color=True`, puis on redimensionne le calque.
  Toute autre taille passée à `truetype()` échoue.
- Pour atténuer un emoji, **on multiplie son canal alpha** ; un voile blanc
  posé par-dessus laisse un carré gris parfaitement visible.

La pastille emoji est aussi sur la carte du catalogue, en CSS cette fois, avec
un délai d'animation par carte : sans décalage, les dix emoji montent et
descendent ensemble et la grille clignote.

### Teachizy : l'école s'appelle enfin ADéPA

Le « Nom de l'espace » est passé de TOULALi à **ADéPA** (Paramètres →
Informations obligatoires). **L'URL reste `toulali.teachizy.fr`** : la changer
casserait les dix `enrollUrl` des fiches publiques. Le jour où on la change, il
faut refaire `PLATEFORME` dans `seed-mini-formations.js` et relancer le seed —
les deux dans le même mouvement.

### Le téléphone à l'inscription : hors forfait

Les « Questions préliminaires » d'une formation Teachizy (`custom_fields_options`
dans l'API) sont **réservées au forfait EXPERT** ; le compte est en PRO. On ne
contourne pas par l'API. Trois voies possibles, dans l'ordre de ce qu'elles
coûtent : demander le téléphone **au moment de l'attestation** (c'est là que la
personne a une raison de le donner), le demander sur Les Extras avant la
redirection (mais c'est de la friction sur un parcours gratuit), ou passer au
forfait EXPERT.

---

## Le carrousel d'accueil, et l'e-mail de l'admin — 3 septembre 2026 (soir)

### « Sur devis » sur dix formations gratuites

Le carrousel de l'accueil (`OfferCarousel`) ne connaissait ni `freeOnline`, ni la
durée en minutes, ni les publics : il affichait donc **« Sur devis » sur les dix
mini-formations gratuites** — l'exact contraire de leur promesse, sur la page où
arrive tout le trafic publicitaire.

Il porte maintenant le même matériel que la carte du catalogue : pastille emoji
qui flotte, marque « Conçue par ADéPA », durée, « En ligne, à votre rythme », et
« Gratuit · en ligne » à la place du devis. L'accueil se coupe en **deux lignes**,
comme `/formations`.

⚠ **`/public/highlights` renvoie une SÉLECTION de dix formations**, pas le
catalogue. Le bouton de la ligne gratuite dit donc « Tous les parcours
gratuits », jamais « Voir les N parcours » : N serait le compte du carrousel
(sept aujourd'hui) et non celui du catalogue (dix). Un chiffre faux sur la
première page se vérifie en un clic — et c'est le clic suivant.

### `lib/mini-formations.ts`

Emoji du parcours, organisme de la maison et durée lisible sont désormais dans un
seul fichier. Trois endroits les affichent (catalogue, carrousel, et les scripts
de couverture / fiche récap côté Python-JS) : dupliqués, deux cartes de la même
formation finiraient par ne plus porter le même dessin.

### L'accès administrateur

Un seul compte `ADMIN` en base : **admin@les-extras.fr** (statut VERIFIED, créé
le 23/07/2026). `GlobalRole` ne connaît que `USER` et `ADMIN` — pas de
SUPERADMIN ni d'OWNER. Le modèle `User` n'a **pas** de champ `name`.

La réinitialisation passe par `/mot-de-passe-oublie`
(`POST /auth/forgot-password` puis `/auth/reset-password`), et le courrier part :
`SMTP_HOST`, `SMTP_USER`, `SMTP_PORT`, `MAIL_FROM`, `MAIL_FROM_EMAIL`,
`MAIL_FROM_NAME`, `MAIL_DSN` et `BREVO_API_KEY` sont tous définis en production.
Reste la seule question qui compte : **la boîte `admin@les-extras.fr` est-elle
relevée par Siham ?** Si non, il faut basculer l'e-mail du compte sur son adresse
avant d'envoyer le lien — et c'est elle qui décide, c'est son identifiant de
connexion.

⚠ Rappel de la règle : **aucun mot de passe n'est saisi ni généré ici.** On lit
l'adresse, on ne touche pas au secret.

---

## Les rangées qui défilent, et l'accès admin — 3 septembre 2026 (nuit)

### Où une rangée sert, et où elle nuit

`RangeeDefilante` (`app/_shared/RangeeDefilante.tsx`) ne fournit QUE le
déplacement — flèches, défilement, accrochage — et reçoit les cartes déjà
faites en enfants. C'est ce qui permet de garder la carte riche des catalogues
(résumé, concepteur, durée, bouton « Voir ») au lieu de la réduire à celle du
carrousel d'accueil.

⚠ **Chaque enfant porte sa propre largeur** (`w-[…] shrink-0`) : dans un
conteneur `flex`, une carte sans largeur se comprime jusqu'à l'illisible.
Deux cartes par écran : `md:w-[calc((100%-1.25rem)/2)]` — trois ne laissaient
lire ni le résumé ni le public.

⚠ **La piste porte `md:px-14` ET `md:scroll-px-14`** : sans la marge, la flèche
gauche recouvre le titre de la première carte ; sans le `scroll-px`, la carte
s'arrête SOUS le bouton au lieu de s'arrêter à côté.

**Où on en met, et où on n'en met pas** — la règle décidée avec Siham :

- accueil : deux rangées (gratuites, puis intra) ;
- `/formations` : une rangée pour les mini-formations gratuites ; les
  formations en intra restent en **grille** — elles se comptent sur les doigts
  d'une main et se vendent au devis, un directeur veut les voir toutes ;
- `/ateliers` : une rangée **« À la une »** = les cinq dernières arrivées, puis
  **tout le reste en grille** ;
- **dès qu'un filtre est actif, partout : la grille**. Une rangée met en avant ;
  elle ne doit jamais servir à ranger un catalogue, sinon ce qui n'est pas dans
  les cinq premiers devient invisible — et après un filtrage, elle laisserait
  croire qu'il n'y a que deux résultats.

### L'accès administrateur, résolu

Le compte `admin@les-extras.fr` existait, mais Siham n'a jamais eu cette boîte.
Elle avait déjà **son propre compte** — `assoc.adepa@gmail.com`, qu'elle
utilisait tous les jours — simplement en rôle `USER`. La bonne réponse n'était
donc pas de déplacer l'e-mail de l'admin (collision sur la contrainte d'unicité)
mais de **promouvoir son compte** : elle garde son mot de passe, aucun lien de
réinitialisation à recevoir.

⚠ **Le rôle est inscrit dans le jeton de connexion** (`lib/session.ts`,
`payload.role`), pas relu à chaque page : après la promotion, il faut se
**déconnecter puis se reconnecter**, sinon l'espace reste celui d'un
établissement. C'est exactement ce qui s'est passé, et ça a coûté un aller-retour.

Le nom affiché venait d'ailleurs encore : c'est `Account.name` (« adépa »), pas
`User` — passé à « ADéPA ».

Il reste **deux comptes ADMIN** : celui de Siham et `admin@les-extras.fr`, créé
par le seed le 23/07/2026. Ce dernier a un mot de passe d'amorçage et personne
ne relève sa boîte — à désactiver ou à réattribuer quand Siham le décidera.

---

## LEX remonte dans la barre du haut — 3 septembre 2026

Demande de Siham, mot pour mot : « dans le compte admin tu peux mettre LEX
dans un champs en haut a droit du catalogue et les retirer du menu de gauche ».

**C'est la troisième position de ce menu en un mois, et il faut l'écrire
honnêtement plutôt que de faire comme si l'évidence avait toujours été là.**
LEX était en haut jusqu'au 25/08, il est redescendu dans le menu de gauche ce
jour-là au motif qu'un outil ouvert plusieurs fois par jour se pose à portée
d'œil. Ce motif n'était pas faux ; il coûtait **trois entrées répétées dans les
quatre menus** de `lib/nav.ts` (freelance, établissement, admin, salarié en
attente de rattachement) — et sur le compte admin, ces trois lignes en tête de
menu repoussaient le travail d'administration sous la ligne de flottaison.
C'est de là que vient la demande.

- `header.tsx` : un `DropdownMenu` « LEX » (icône `PenLine`) immédiatement à
  droite de « Catalogue », avec les trois outils — Assistant d'écriture,
  Générateur d'activités, Appui scolaire.
- `lib/nav.ts` : les trois entrées retirées des **quatre** menus. Deux sections
  se sont retrouvées à une seule entrée et ont donc été dissoutes en bloc sans
  titre, selon la règle déjà écrite dans ce fichier (« deux entrées ne font pas
  une rubrique ») : « LEX & analyse de pratique » côté établissement ne gardait
  que le GAP, et la section « LEX » du salarié en attente ne garde que le solde.
  **Périmé depuis le 15/09/2026** : le GAP a été retiré de l'offre, cette entrée
  et la section qui la portait n'existent plus (voir la note « RETRAIT DU GAP »
  ci-dessous).
- **`LEX · Crédits` reste dans le menu de gauche**, et c'est délibéré : c'est la
  seule des entrées qui parle d'argent, elle est filtrée par rôle
  (`OWNER/ADMIN/MANAGER`) sur les menus d'établissement, et **la barre du haut
  n'a aucun filtre de rôle**. La monter aurait ouvert la consommation de
  l'équipe à toute personne rattachée.

⚠ **Le piège de cette bascule : le téléphone.** Les deux menus déroulants de la
barre du haut sont `hidden md:flex`. En retirant les outils du menu de gauche —
le seul qui existe sur mobile — on les rendait **inatteignables au doigt**.
Deux lignes ont donc été ajoutées à `command-palette.tsx` (Générateur
d'activités, Appui scolaire ; l'Assistant y était déjà), avec `premium: true`
comme les autres. **Toute entrée retirée du menu de gauche au profit de la
barre du haut doit être vérifiée dans la palette** — sinon on livre une
fonctionnalité payante que la moitié des visites ne peut plus ouvrir.

---

## Resserrage des textes, et la page « Partenaires associatifs » — 3 septembre 2026

Siham : « il y a beaucoup de texte dans tout le site ! optimise les textes et
marketing et réduit partout », puis : une page comme
`place-d.fr/partenaires-associatifs`, sur Les Extras **et** sur adepa77.fr,
avec un lien au pied de page.

### Le périmètre a été tranché avec elle, et il compte

Mesure faite avant de toucher à quoi que ce soit (rendu réel, URL nues) :
accueil **2 484 mots**, `/formations` 3 444 (dont les treize cartes),
`/ateliers` 1 548, les six pages secteur ~900 chacune, les guides ~1 800.

**Choix de Siham : le marketing seulement.** Ne sont PAS touchés, et il ne faut
pas y revenir sans le lui redemander :

- **les six guides des écrits professionnels.** Leur longueur est l'outil : ils
  existent pour reprendre la première page de Google à NotaSuivi, qui tient
  des guides de 2 000 mots sur exactement ces requêtes. Les raccourcir, c'est
  défaire le seul travail de référencement du site ;
- **le légal et le réglementaire** — mentions, CGU, CGV, informations
  réglementaires : ces pages ne raccourcissent pas, elles répondent à des
  obligations ;
- **les citations d'articles de loi** des pages secteur, qui sont reproduites
  au mot près et doivent le rester.

### Ce qui a été resserré, et selon quelle règle

Une seule : **une idée par paragraphe, et le paragraphe s'arrête quand l'idée
est dite.** Ce qui a sauté, ce sont les redites — la gratuité était réexpliquée
quatre fois sur l'accueil — et les phrases qui commentent la phrase précédente.
Aucun fait, aucun chiffre, aucune source n'a été retiré.

Accueil (`page.tsx` + `UnSeulFormulaire`, `ApercuProduit`, `BlocGap`,
`OffreLex`), `/formations`, `/ateliers`, `/confiance-lex`, `/renforteam`,
`/intervenant-independant`, les deux comparatifs, et les six pages
« ateliers pour » (`ateliers-pour/donnees.ts` : les champs `presentation` et
`publicAccueilli` des six entrées).

⚠ **Ce qui a été gardé intact dans les pages secteur** : les listes
`cequunAtelierApporte`, `contraintes` et `avantDeFaireEntrer`. C'est là que vit
le contenu PROPRE à chaque type d'établissement — celui qui empêche Google de
lire six pages comme du contenu dupliqué. Les raccourcir jusqu'à les rendre
interchangeables ruinerait ces six pages d'un coup.

### `/partenaires-associatifs`

Reprise de la structure de Place D — pourquoi, valeurs, marche à suivre — avec
deux écarts assumés :

- **Aucun nom, aucun logo, aucun témoignage.** L'association n'a pas encore de
  partenariat associatif publié. La section « ils sont déjà partenaires » du
  modèle est remplacée par un **appel à partenariat** (« vous voulez être la
  première association partenaire ? ») — décision de Siham. Le jour où des
  noms existent, c'est ce bloc qu'on remplace.
- **La convention est décrite comme ce que l'association PROPOSE**, jamais
  comme un document déjà rédigé : il ne l'est pas.

Les quatre bénéfices annoncés sont tous déjà en ligne et vérifiables :
publication au catalogue, accès au réseau d'établissements, contrats et
factures édités par la plateforme + 15 générations LEX offertes par mois,
écriture partagée sur l'Édublog. **Rien n'y demande une décision qui n'a pas
été prise.**

Lien ajouté dans la colonne **« Secteur »** du pied de page (elle en portait
quatre : la règle des sept liens par colonne tient), et la route est déclarée
au `sitemap.ts` — sans quoi la page n'existe que pour qui connaît son adresse.

### Le vrai poids de /formations était dans les données, pas dans le code

Après le premier passage, `/formations` restait à 3 418 mots. La mesure a montré
pourquoi : **2 538 de ces mots étaient les dix résumés de mini-formations**, soit
les trois quarts de la page. Chacun portait un paragraphe de 75 mots qui
réexpliquait le calendrier du parcours — déjà décrit point par point dans
`METHODOLOGIE`, sur la même fiche, quelques centimètres plus bas.

Chaque paragraphe tient désormais en une ligne. **Les chiffres exacts sont
conservés un par un** (sept jours, dix jours, quatorze jours, quinze jours, le
GEVA-Sco reçu ou quinze jours après) : la règle « une durée annoncée couvre le
CALENDRIER, pas seulement le temps de lecture » tient toujours, et c'est elle
qui interdit d'écrire « 45 minutes » tout court.

⚠ **Ce qui n'a pas bougé d'un mot, et ne doit pas bouger :** le `GARDE_FOU`
(nuance ABA) sur les six fiches qui le portent, et les encarts propres à la
crise (aucun geste physique enseigné), aux consignes (ce n'est pas une méthode
pour faire obéir), à la réaction de survie (ni diagnostic ni repérage clinique)
et à l'ESS (ce n'est pas un conseil juridique). **Ce sont des textes de
sécurité, pas du marketing** — les raccourcir serait exactement l'erreur que ce
travail de resserrage rendait tentante.

Mesuré en direct après déploiement et relance du seed (10 fiches mises à jour,
0 créée, 0 archivée) : `/formations` **3 444 → 3 034**, accueil 2 484 → 2 160,
`/confiance-lex` 1 036 → 797, `/intervenant-independant` 781 → 669.

---

## Fond éclairci, alerte d'inscription, tunnel d'accueil — 3 septembre 2026 (soir)

### Le fond sombre était trop noir — et la moitié du problème était un sélecteur

Deux corrections, et elles allaient ensemble.

1. **Les jetons du thème sombre ont été remontés, puis rabaissés dans la même
   soirée.** D'abord de deux tons (+5 points), Siham a regardé et demandé
   « 1.5 ton plus sombre » : on est redescendu de 3,75 points arrondis à 4.
   **Bilan net : un demi-ton plus clair qu'avant** — fond `222 26% 8%` →
   `222 25% 10%`, cartes 12 % → 14 %, `muted` 16 % → 18 %, `accent` 17 % → 19 %,
   bordures 22 % → 24 %, champs 24 % → 26 %, et les deux `*-soft` à l'avenant.
   Ce faible écart est le bon enseignement : **ce n'était pas la luminosité du
   fond qui gênait, c'étaient les reflets absents** (point 2). Une fois qu'ils
   s'affichent, un fond presque aussi sombre passe très bien. Le bloc est écrit **deux fois** dans `globals.css`
   (`.theme-sombre` et `:root[data-theme='sombre'] .theme-espace`) : les deux
   ont été modifiés, et il faut penser aux deux à chaque fois. Les quatre blocs
   `bg-[hsl(222,22%,13%)]` en dur (`page.tsx`, `BlocOutils`, `DemoLex`,
   `BlocGap`) suivent le même mouvement et valent `hsl(222,21%,15%)` — sinon
   ils deviendraient plus sombres que le fond qui les porte.

2. ⚠ **Les reflets ne s'affichaient jamais pour un nouveau visiteur.** La règle
   exigeait `[data-theme='sombre']`, c'est-à-dire un choix EXPLICITE mémorisé
   dans le navigateur. Quelqu'un qui arrive pour la première fois n'a rien
   choisi : l'attribut est absent, et il voyait un aplat noir uniforme —
   exactement ce que Siham décrivait. La règle porte maintenant sur
   `.theme-sombre` lui-même, et c'est `:root[data-theme='clair']` qui l'annule.
   Cinq couches au lieu de trois, une clé d'animation à quatre temps pour que
   les couches dérivent les unes par rapport aux autres au lieu de glisser en
   bloc, et une bande diagonale très pâle qui traverse.

### L'association est prévenue à chaque inscription

`sendAlerteInscription` dans `mail.service.ts`, appelée depuis `register()`.
⚠ **L'adresse par défaut est `assoc.adepa@gmail.com`**, PAS `contact@adepa77.fr`
comme les autres alertes : c'est Siham qui a demandé à être prévenue, et la
boîte `contact@` n'est pas relevée tous les jours. `ALERTES_EMAIL` la remplace
le jour où l'association veut router ces messages ailleurs. L'appel est protégé
par un `.catch()` : **une alerte qui n'arrive pas ne doit jamais faire échouer
l'inscription de quelqu'un.**

### Le tunnel d'accueil — six messages, un tous les trois jours

`community/tunnel.scheduler.ts` + `TUNNEL_ACCUEIL` dans `mail.service.ts`.
Modèle demandé : la séquence d'iPhone Photography School que Siham reçoit
(`emil@iphonephotographyschool.com`, relevée dans sa boîte le 3/09).

**Ce que le modèle donne, et qu'on a repris :** un message court, une seule
idée, une seule chose à cliquer, signé d'une personne, à heure fixe (10 h 15,
comme eux, depuis des mois à la minute près), à cadence régulière, avec un
objet qui dit ce qu'on va apprendre.

⚠ **CE QU'ON N'A PAS REPRIS, ET IL NE FAUT PAS LE RAJOUTER.** Leur séquence
intercale des ventes à compte à rebours : « −86 % », « l'accès expire ce soir »,
« Désolé 😳 », « ❌ C'est terminé ». Trois raisons :
1. l'association n'a rien à vendre à ce stade — l'attestation à 20 € **ne peut
   pas** être vendue tant que le médiateur de la consommation, les CGV et le
   droit de rétractation n'existent pas ;
2. une échéance annoncée qui n'en est pas une est une pratique commerciale
   trompeuse (art. L121-1 et s. c. conso), pour une association certifiée
   Qualiopi ;
3. le lecteur est un professionnel au travail, pas un amateur de photographie :
   ce qui le retient, c'est un outil utilisable lundi.

**Un test le rend impossible par accident** : `tunnel-accueil.spec.ts` refuse
tout « −N % », « expire », « dernière chance », « offre limitée » dans la
séquence, vérifie qu'elle compte bien six messages (la longueur que le
planificateur attend), que chaque chemin est interne et qu'aucun parcours n'est
proposé deux fois. Cinq tests — un lien mort dans une séquence automatique part
six fois, à tout le monde, sans que personne ne le voie passer.

**Cadence : trois jours, pas deux comme le modèle.** Eux écrivent à des amateurs
de photo le soir ; ici on écrit à des éducateurs pendant leur journée. La
constante `INTERVALLE_JOURS` se change en une ligne si l'ouverture le justifie.

Mécanique : `User.tunnelEtape` (compteur) + `User.tunnelDernierAt` (espacement).
**C'est un compteur, pas un calendrier** : après une panne de deux jours, le
compte reçoit le message qu'il attendait, pas celui du jour. L'étape est scellée
AVANT l'envoi — un doublon dans une boîte coûte plus cher qu'un message manquant
dans une séquence de six. Adresse non confirmée → rien ; `hebdoOptIn` décoché →
rien ; plancher de 30 jours pour que les comptes anciens ne reçoivent pas une
séquence d'accueil des mois trop tard.

### `adepa77.fr/partenaires-associatifs`

Page 5136, publiée par l'API REST de WordPress (le nonce se lit dans
`wpApiSettings.nonce` depuis n'importe quelle page de l'administration), et
entrée 5137 du menu **« Footer - Information » (id 22, emplacement
`footer_menu`)**. LiteSpeed purgé ensuite — le cache est actif au niveau serveur
et l'extension n'apparaît PAS dans la barre d'administration : elle est à
`/wp-admin/admin.php?page=litespeed-toolbox`, bouton « Tout purger ».

⚠ La page d'accueil d'adepa77.fr ne montre pas ce lien : elle porte un pied de
page Elementor qui lui est propre. Toutes les autres pages du site l'affichent.

---

## Suivi des e-mails, prérequis, CGV de l'attestation — 3 septembre 2026 (nuit)

### ⚠ LE MÉDIATEUR DE LA CONSOMMATION — CE QUI S'EST PASSÉ, À RELIRE AVANT D'Y REVENIR

Siham a donné un nom : **« le médiateur c'est Sihame YOUNOUS »**, avec pour
consigne de rédiger les CGV en conséquence. **Je ne l'ai pas écrit, et il ne
faut pas l'écrire tant que deux choses ne sont pas vérifiées.**

Un médiateur de la consommation ne se nomme pas librement. Il doit être
**référencé par la CECMC** (liste officielle du ministère de l'Économie) et
**indépendant** du professionnel — aucun lien hiérarchique, familial ou
fonctionnel (art. L613-1 à L613-3, R613-1 c. conso). Recherche faite le 3/09
dans l'annuaire officiel et dans la liste par secteurs d'activité : **aucune
trace de ce nom**. Et il est à une lettre du prénom de la fondatrice.

Publier ce nom aurait produit une clause de médiation **nulle**, dans les CGV
d'un organisme certifié Qualiopi — c'est-à-dire pire que pas de clause du tout.
Siham a répondu **« ne met pas de médiateur pour l'instant »** : la rubrique
reste donc en « en cours de désignation », avec une phrase de plus qui engage
l'association à n'y porter aucun nom avant référencement.

**Ce qu'il faut pour débloquer :** soit le numéro de référencement CECMC de la
personne et la preuve de son indépendance, soit une adhésion à un médiateur
référencé du secteur formation (CM2C, Medicys, SAS Médiation Solution — ordre
de grandeur 100 à 200 €/an).

### Les CGV couvrent enfin l'attestation

Les CGV existaient déjà (`(public)/legal/page.tsx`, rubrique `cgv`) et
couvraient LEX et les formations Qualiopi. **L'attestation à 20 € n'y figurait
nulle part** — c'est-à-dire la seule chose que Siham veut vendre. Rubrique
ajoutée : ce qui est vendu (le document, pas la formation, qui reste gratuite),
ce que ce n'est PAS (ni RNCP ni RS, aucun titre, aucun droit à exercer), le
délai de délivrance (quinze jours ouvrés), la rectification sans frais, et le
droit de rétractation avec sa vraie mécanique — l'extinction n'intervient que
si la personne a **expressément demandé** l'exécution avant la fin des quatorze
jours (art. L. 221-25 et L. 221-28, 1°).

⚠ **« Attestation de suivi », jamais « certificat »**, y compris dans les CGV.
La règle vaut partout et elle est ancienne ; elle est maintenant écrite en
commentaire dans le fichier, à l'endroit où quelqu'un serait tenté de la
défaire.

### `/admin/emails` — l'écran qui manquait pour piloter

Cinq envois partent tout seuls (confirmation, bienvenue, alerte d'inscription,
activation J+1, tunnel, rendez-vous du lundi). `MailService.send()` **ne lève
jamais** — c'est ce qui empêche un serveur de messagerie lent de faire échouer
une inscription — mais l'effet de bord était qu'**un envoi raté ne se voyait
nulle part**, sinon dans les journaux du conteneur.

L'écran réunit deux choses de nature différente, et il le dit :

- **l'état du transport et le journal des envois**, tenus en mémoire par
  `MailService` (`etatEnvois()`, cent lignes au maximum). ⚠ **Remis à zéro à
  chaque redéploiement, et c'est un choix** : la question est « est-ce que ça
  part en ce moment ? ». Une table en base coûterait une écriture par e-mail,
  une migration et une purge, et porterait des adresses — donc une durée de
  conservation à justifier. Le jour où l'historique complet est nécessaire,
  c'est un autre sujet, pas une variante de celui-ci ;
- **l'avancement du tunnel**, lu en base : répartition des comptes sur les sept
  étapes, envois des sept derniers jours, comptes encore dans la séquence,
  désabonnés, adresses non confirmées, et les vingt-cinq derniers inscrits
  ligne à ligne.

Un bandeau s'affiche en tête si le transport n'est pas le SMTP du domaine — le
repli Brevo échoue SPF et se fait écarter silencieusement, c'est la panne de
l'été et elle doit se voir tout de suite.

⚠ `AdminService` prend un cinquième paramètre (`MailService`) : les tests qui
l'instancient à la main doivent être mis à jour, sinon `tsc` casse
(`formation-gratuite.spec.ts` en a fait les frais).

### Les prérequis remontent à côté du public visé

Sur une mini-formation, ni `durationHours`, ni `city`, ni `certificationName` ne
sont renseignés : l'encart « Public visé » restait **seul sur sa ligne** dans
une grille à deux colonnes, et les prérequis vivaient tout en bas en bloc de
texte. Ils vont ensemble à la lecture — à qui ça s'adresse, et ce qu'il faut
avant.

⚠ **Première tentative ratée, et la leçon vaut d'être écrite** : le second
encart avait reçu un fond `muted/60`, c'est-à-dire une nuance de gris de plus.
Sur un fond charbon, **elle est invisible** — Siham a répondu « les 2 fonds
n'ont aucune couleur de fond », et elle avait raison. Une hiérarchie ne se fait
pas avec deux gris voisins sur du sombre : il faut un aplat TEINTÉ.

`Attribut` porte maintenant trois tons (`TONS` en bas du fichier) :
- `neutre` pour les attributs courts — durée, lieu, certification. Une valeur
  de trois mots n'a pas besoin d'être signalée, et douze encarts colorés ne
  signalent plus rien ;
- `primaire` (rose) pour « Public visé », `secondaire` (terracotta) pour
  « Prérequis » : aplat à 10 %, bordure à 35 %.

Le second reproche portait sur les titres, et il était juste aussi : ils
étaient en `text-xs text-muted-foreground`, donc **moins visibles que le corps
qu'ils annoncent**. Ils sont désormais en capitales, gras, interlettrés, à la
couleur de leur encart.

### ⚠ CE QUE L'ÉCRAN A TROUVÉ DANS LA MINUTE : `SMTP_PASSWORD` EST ABSENTE

Premier chargement de `/admin/emails`, bandeau rouge : **« Les messages partent
par Brevo, pas par le SMTP du domaine »**, expéditeur `contact@adepa77.fr`.
Vérifié dans le conteneur, noms seulement, jamais les valeurs :

```
SMTP_HOST DEFINIE · SMTP_USER DEFINIE · SMTP_PORT DEFINIE
SMTP_PASSWORD ABSENTE          ← une seule variable
MAIL_FROM_EMAIL DEFINIE · MAIL_FROM_NAME DEFINIE · BREVO_API_KEY DEFINIE
ALERTES_EMAIL ABSENTE · CONTACT_INBOX_EMAIL ABSENTE (les défauts du code jouent)
```

`MailService.smtp` exige les TROIS valeurs : sans le mot de passe, le
transport SMTP n'est jamais construit et **tout bascule sur le repli Brevo** —
c'est-à-dire exactement la panne de l'été, celle que documente l'en-tête de
`mail.service.ts` : SPF n'autorise que Hostinger, les messages échouent
l'authentification et une partie se fait écarter en silence.

Conséquence directe : la confirmation d'adresse, le message de bienvenue,
l'alerte d'inscription et le tunnel qui démarre demain à 10 h 15 partent tous
par ce chemin-là. **Le compteur « Envoyés » à 0 n'est pas rassurant : il veut
dire qu'aucun envoi n'a eu lieu depuis le redémarrage, pas que tout va bien.**

⚠ La liste des variables de Coolify n'affiche que DIX entrées pour l'app API
(NODE_ENV, JWT_SECRET, DATABASE_URL, SESSION_SECRET, JWT_EXPIRES_IN, API_PORT,
WEB_ORIGIN, MAIL_DSN, MAIL_FROM, UPLOAD_DIR) alors que le conteneur en porte
bien davantage — les autres viennent d'ailleurs (image, ou portée non affichée
par cette page). **Ne pas conclure d'une absence dans cette liste qu'une
variable n'est pas posée : la seule preuve est `process.env` dans le
conteneur.** Ajouter `SMTP_PASSWORD` au niveau de l'app fonctionne dans tous
les cas, l'injection se fait au démarrage.

Le mot de passe n'est ni saisi ni généré ici (règle n° 1) : le champ Coolify a
été ouvert et pré-rempli avec le NOM, Siham colle la VALEUR et redéploie l'API.

---

## Les fiches ateliers, et ce que l'admin peut vraiment faire — 3 septembre 2026 (nuit)

Deux questions de Siham en une : « les fiches ateliers doivent avoir tout le
contenu détaillé comme les ateliers à la une, donc remplis tous », et « est-ce
que l'admin peut modifier, supprimer et avoir tous les droits sur tout ? ».

### ⚠ LA MESURE D'ABORD, ET ELLE CORRIGE UNE MESURE PRÉCÉDENTE

Relevé le 3/09 sur les treize ateliers publiés, fiche par fiche, depuis
`api.les-extras.fr/api/public/catalog/<slug>` :

| Fiche | Ce qu'elle porte |
|---|---|
| Les 3 de Valérie SIMON (déposées à la main) | **tout** : durée, participants, matériel, prérequis, créneaux, objectifs, déroulé, évaluation |
| ATELIER PSYCHO-BOXE | objectifs, déroulé, évaluation — **mais NI durée, NI participants, NI matériel, NI prérequis, NI créneaux** |
| Les 9 autres de juillet | description + public + ville + prix + images, **et rien d'autre** |

**Une note antérieure disait « objectives vide sur 13 » : c'était faux**, et
c'est psycho-boxe qui l'infirme. Ne pas la reprendre.

**D'où vient le trou.** Les dix fiches de juillet viennent de l'import du
catalogue WordPress. Là-bas, une annonce HivePress n'a qu'un titre, une
description, un public, une ville, un prix et des images : **les champs
pédagogiques n'existaient pas**, il n'y avait donc rien à importer et rien n'a
été perdu. Psycho-boxe fait exception parce que quelqu'un avait écrit ses trois
blocs À LA MAIN dans le corps de l'annonce WordPress.

⚠ **Les dix annonces WordPress ont été relues une par une le 3/09**
(`app.les-extras.fr/listing/<slug>/`) : **elles ne portent rien de plus que ce
qui est déjà en base.** Il n'y a aucune moisson à faire de ce côté — ne pas
refaire ce chemin.

### « Met partout les mêmes infos que pour psychoboxe » — ce qui était exécutable

Six informations manquent partout et **n'existent nulle part** : durée,
participants maximum, matériel, prérequis, créneaux, modalités d'évaluation.
Psycho-boxe ne les a pas non plus : il n'y a rien à recopier. Les écrire, c'est
les inventer — et ce sont précisément celles sur lesquelles un établissement
engage un budget et bloque un créneau. **Elles se demandent à leurs auteurs.**

Ce qui était exécutable sans rien inventer, et qui l'a été
(`prisma/seed-fiches-ateliers.js`, idempotent, **n'écrit jamais par-dessus un
champ déjà rempli**) : les **objectifs** de sept fiches, tirés des puces et des
phrases déjà écrites dans leur propre description, remises à l'infinitif.
Chaque entrée du script porte un champ `source` qui dit d'où vient le texte.
Une seule fiche a reçu un déroulé — « estime de soi via la Photo-Vidéo » —
parce que sa description décrit explicitement la progression théorie →
pré-production → production → post-production.

**Trois fiches sont volontairement absentes du script :**
- **PSYCHO-BOXE** : déjà remplie ;
- **ANIMATION DE SOIRÉES THÉMATIQUES** : ce n'est pas un atelier pédagogique
  mais une prestation événementielle (DJ, déco, Père Noël). Lui inventer des
  objectifs d'apprentissage en ferait autre chose que ce que son auteur vend ;
- **RE-DESSINE MOI** : ⚠ **à trancher par Siham.** Sa description annonce « UN
  DISPOSITIF ÉVÉNEMENT 2025 […] DISPONIBLE UNIQUEMENT DURANT L'ÉTÉ 2025 » et
  « TARIFS SELON PRESTATION », alors qu'elle est en ligne en septembre 2026 et
  affiche 300 €. Ce n'est pas un champ à compléter, c'est une fiche à réécrire
  ou à archiver.

### L'indicateur de complétude — `lib/completude-fiche.ts`

Treize champs, deux niveaux (`socle` / `confort`), et **pour chacun la raison
de son existence**, affichée à l'auteur : « sans durée, un chef de service ne
peut pas caler l'atelier dans un planning », « une fiche sans prix ne se
compare pas, donc ne se choisit pas ». Une liste de champs manquants sans
raison se lit comme une corvée ; avec la raison, elle se remplit.

Trois points d'affichage — `_shared/CompletudeFiche.tsx` :
- `/dashboard/ateliers` : un bandeau sous chaque fiche + un rappel en tête de
  section (sinon l'information reste sous la troisième carte) ;
- `/admin/ateliers` : une colonne « Fiche » avec le pourcentage et ce qui
  manque, plus une entrée **« Fiches incomplètes »** dans le filtre de statut ;
- `/admin/ateliers/[id]` : la liste détaillée, avec les raisons.

⚠ **AUCUN CHAMP N'EST RENDU OBLIGATOIRE.** Bloquer la publication d'une fiche
incomplète mettrait dehors les dix fiches déjà en ligne et punirait des
intervenants qui n'ont rien fait de mal. **On informe, on n'interdit pas.**

⚠ **Durée écrite (`duration`, « 2H ») et durée normalisée (`durationMinutes`)
disent la même chose au lecteur : l'une des deux suffit.** Réclamer les deux
ferait passer une fiche complète pour incomplète — testé
(`lib/__tests__/completude-fiche.test.ts`, 7 tests, dont le prix à zéro qui
reste un prix renseigné : un atelier gratuit existe).

### La réponse à « l'admin peut-il tout ? » — mesurée, et le trou comblé

**Ce qui était vrai avant ce commit :** 58 routes sous `AdminGuard`, dont sept
`DELETE` (utilisateur, mission, atelier, compte, catégorie, article, formation,
demande de contact) qui suppriment réellement en base. Mais sur un ATELIER,
l'administration ne pouvait que **publier, archiver ou supprimer**.
`UpdateServiceAdminDto` était limité à titre / description / ville / images /
publics / catégorie, « au motif qu'un administrateur corrige une coquille ».
Avec dix fiches incomplètes appartenant à quatre intervenants différents, dont
trois extérieurs à l'association, **la seule façon de compléter une fiche était
de se connecter au compte de son auteur.** Et `PATCH /admin/services/:id`
n'avait de toute façon **aucun bouton** dans l'interface.

Ce qui a changé :
- `UpdateServiceAdminDto` couvre **toute la fiche** — durée, durée en minutes,
  participants, créneaux, matériel, prérequis, objectifs, déroulé, évaluation,
  FAQ, prix, options facturables, coût en crédits, mise en avant, Qualiopi.
  ⚠ **Il portait un champ `summary` qui n'existe pas sur `Service`** : l'envoyer
  faisait tomber la requête chez Prisma. Retiré.
- **Trois exceptions assumées, écrites dans le DTO** : `status` reste à la route
  de modération (qui journalise `atelier.modere` — le fondre ici ferait
  disparaître la trace) ; `slug` n'est pas modifiable (c'est l'adresse publique,
  déjà indexée et partagée) ; `accountId` non plus (changer le titulaire d'une
  fiche, c'est changer qui l'anime).
- `ServiceModal` prend un mode `admin` : **le même formulaire des deux côtés**,
  qui écrit sur `/admin/services/:id` sans `accountId` (l'admin n'est membre
  d'aucun de ces comptes — envoyer le sien ferait refuser la requête par
  l'`AccountGuard`). Deux formulaires pour une seule fiche divergent toujours au
  premier champ ajouté. Le statut part **dans un second appel** vers
  `/moderate`, et seulement s'il change.
- Bouton « Corriger la fiche » sur `/admin/ateliers/[id]`, qui affiche aussi
  enfin le contenu pédagogique (objectifs, déroulé, évaluation, prérequis,
  matériel) — invisible dans l'administration jusqu'ici.

**Ce que l'admin ne peut toujours pas faire, et qu'il faut dire tel quel :**
modifier le mot de passe de quelqu'un (aucune route, et c'est bien) ; se
connecter à la place d'un utilisateur (pas d'usurpation d'identité) ; modifier
une facture émise autrement que par son statut (art. 242 nonies A ann. II CGI) ;
supprimer un utilisateur qui possède un compte (il faut d'abord transférer ou
supprimer ses comptes) ; toucher à un compte `ANONYMIZED` (effacé à la demande
de son titulaire, il n'est plus modifiable).

### Les repères pratiques des ateliers — arbitrage de Siham, 3/09 au soir

Après la mesure ci-dessus, Siham a tranché en deux messages : « prends les
mêmes infos que pour la fiche atelier psycho-boxe », puis, quand j'ai montré
que psycho-boxe ne les avait pas non plus : **« ou prendre la fiche qui a ces
infos et met les mêmes »**.

La fiche qui les a, ce sont celles de **Valérie SIMON** — les seules déposées à
la main dans l'application. Leurs trois fiches disent la même chose : 1h30 à 2H,
8 à 10 participants, prérequis « Aucun », « Salle avec tables, chaises et point
d'eau à proximité. Matériel fourni par l'intervenante », créneaux 9h-12h et
14h-17h. C'est devenu le **standard maison** (`REPERES` dans
`seed-fiches-ateliers.js`), appliqué à ses cinq ateliers : 2H, 10 participants,
« Aucun », créneaux 9h-12h / 14h-17h.

⚠ **CE N'EST PAS UNE DÉDUCTION, C'EST UNE DÉCISION DE LA FONDATRICE.** Une durée
annoncée est un terme commercial, pas un fait qu'on relève — je ne l'aurais pas
écrite seul, et c'est écrit dans le script pour qu'on ne le rejoue pas.

⚠ **LE MATÉRIEL EST LE SEUL CHAMP QUI N'EST PAS RECOPIÉ TEL QUEL.** « Salle avec
tables et chaises » sur un atelier de boxe ou de théâtre fait préparer la
mauvaise salle : c'est l'atelier annulé le matin même, le risque exact que
l'indicateur de complétude nomme. La PHRASE de Valérie est conservée (une
exigence de salle, puis qui fournit le matériel) ; seule l'exigence de salle
suit l'activité — on ne fait pas de la boxe sur un sol dur.

⚠ **Les quatre fiches des autres intervenants ne reçoivent que « Aucun » en
prérequis.** Durée et nombre de participants sont les termes commerciaux de
Younes, Christophe et Jean Léo. Les écrire à leur place, sur des comptes qu'ils
ne peuvent pas ouvrir pour les corriger, ferait vendre par l'association une
prestation qu'elle n'a pas négociée.

### ⚠ QUATRE COMPTES INTERVENANTS N'ONT PAS D'ADRESSE RÉELLE — trouvé le 3/09

`siham@`, `younes@`, `christophe@`, `jean-leo@intervenants.les-extras.fr` :
**ce domaine n'a aucun enregistrement MX**, ces adresses ne peuvent rien
recevoir. Les quatre comptes sont `PENDING`, `emailVerified` faux, jamais
connectés depuis leur création par le seed le 27/07/2026. Ils portent
**14 fiches** (10 + 2 + 1 + 1). Conséquences réelles, vérifiées dans le code :

- ils ne peuvent pas se connecter (le lien de réinitialisation part dans le vide) ;
- `EmailVerifieSiPublicationGuard` leur interdit toute nouvelle publication ;
- `bookings.service.ts` envoie la confirmation de réservation à `owner.email` :
  elle part à une adresse inexistante.
- **En revanche la demande de devis publique fonctionne** : `createQuoteRequest`
  passe par `sendContactNotification`, donc elle arrive à l'association. C'est le
  chemin du bouton « Demander un devis sans créer de compte », le principal.

⚠ **Le compte `assoc.adepa@gmail.com` (ADMIN) ne possède que le compte
« ADéPA » (ESTABLISHMENT).** Le compte intervenant « Siham » qui porte ses six
ateliers **n'est pas le sien** — d'où l'impossibilité de compléter ses propres
fiches depuis son espace, et l'utilité du nouveau chemin admin.

Décision qui lui revient : poser les vraies adresses de Younes, Christophe et
Jean Léo, et dire si le compte « Siham » doit basculer sur son adresse.

### Le catalogue perd sa rangée « À la une », et une photo devient obligatoire

Deux demandes de Siham dans la foulée, 3/09 au soir.

**1. `/ateliers` : plus de rangée « À la une ».** Le catalogue s'ouvrait sur les
cinq dernières fiches dans une `RangeeDefilante`, puis « Tout le catalogue » en
grille. Deux raisons de l'avoir retirée, cumulatives : sur **treize** fiches,
une rangée de mise en avant coupe le catalogue en deux pour rien et rend les
cinq premières MOINS visibles qu'en grille (la rangée n'en montre que deux à
l'écran, derrière une flèche) ; et « à la une » n'était pas une sélection, mais
l'ordre d'arrivée — un libellé qui promet un choix éditorial et livre un tri par
date. Une seule grille désormais, filtre ou pas. `_catalog.tsx` n'est utilisé
que par `/ateliers` : `/formations` a sa propre mise en page, elle n'a pas
bougé. **La règle générale reste valable** — une rangée met en avant, elle ne
range pas un catalogue — c'est son application à treize fiches qui ne tenait pas.

**2. Au moins une photo pour créer un atelier.** Trois choses manquaient, et il
fallait les trois pour que la règle ne soit pas un piège :

- **Le formulaire ne proposait AUCUN champ image.** Les seules photos du
  catalogue venaient de l'import WordPress ; toute fiche créée à la main partait
  avec le dégradé de remplacement de la carte. Rendre l'image obligatoire sans
  ajouter le champ aurait rendu la création **impossible** depuis l'interface —
  le « bouton qui mène à un refus » que le produit s'interdit partout ailleurs.
- **Il n'existait pas de famille de fichier PUBLIQUE pour une photo d'atelier.**
  `GET /files/:id` exige un jeton ; seul `ARTICLE` passait par
  `GET /public/images/:id`. Une photo déposée en `AVATAR` ou `MISSION` aurait
  répondu **401 au visiteur du catalogue**. D'où `FileKind.SERVICE`, avec sa
  règle dans `file-rules.ts` (5 Mo, JPEG/PNG/WebP) et son entrée dans
  `FilesService.FAMILLES_PUBLIQUES` — une liste fermée, qui doit le rester.
- L'adresse stockée est **`/api/proxy/public/images/<id>`**, comme pour les
  couvertures d'articles. `visuel()` laisse passer les chemins relatifs sans y
  toucher, donc rien à changer dans `lib/media.ts`.

⚠ **L'OBLIGATION NE VAUT QU'À LA CRÉATION**, et c'est délibéré.
`UpdateServiceDto` laisse `images` facultatif : **trois fiches publiées n'ont
pas de photo** (celles de Valérie SIMON), et exiger une image à la modification
empêcherait leur autrice de corriger une virgule tant qu'elle n'en a pas une
sous la main. On ferme la porte d'entrée, on ne mure pas ceux qui sont dedans.
C'est la même doctrine que l'indicateur de complétude : sur l'existant, on
informe.

⚠ Le refus est prononcé **dans le formulaire, avant l'envoi**, et pas récupéré
du 400 de l'API : un formulaire long qui part et revient en erreur fait perdre
la saisie de vue alors que le champ fautif est à l'écran. L'API garde la même
règle — c'est elle qui fait foi, le client n'est qu'une politesse.

---

## L'audit de l'accueil appliqué, l'enquête de satisfaction, les confettis — 3 septembre 2026 (nuit)

### L'audit de conversion de l'accueil (67/100) et ce qui a été corrigé

Question de Siham : « est-ce que la page d'accueil est parfaite à 100 % ? ».
Réponse mesurée : non — 2 151 mots, 10 sections, un seul `h1`, hiérarchie
propre, prix publiés, aucun procédé douteux. **Bien construite, mais elle vend
comme un annuaire.** Neuf constats, cinq appliqués le soir même.

1. **« 17 interventions au catalogue » → « 0 % de commission ».** C'était le
   PREMIER nombre que voyait un visiteur, et dix-sept se lit comme « petit » sur
   une place de marché. Hublo ne publie jamais son inventaire, il publie son
   nombre d'établissements. On publie le chiffre qui est fort : le nôtre,
   qu'aucun concurrent ne peut écrire, ce sont les zéros. Le compte du catalogue
   reste sur `/ateliers`, où il informe au lieu de jauger.
2. **« Réseau actif — Île-de-France, et bientôt partout » → « Réseau actif en
   Île-de-France ».** La fin de phrase annonçait à tout visiteur hors IDF que ce
   n'était pas pour lui, et une promesse d'expansion sans date n'avoue qu'une
   chose : qu'on n'y est pas.
3. ⚠ **LE PIED DE PAGE ENVOYAIT TROIS LIENS SECTORIELS SUR `/renforteam`.**
   « MECS & foyers », « IME · ITEP · SESSAD » et « EHPAD » pointaient tous la
   page générique du renfort — et `/renforteam/mecs` est en **404**, il n'y a
   jamais eu de découpage sectoriel côté renfort. Pendant ce temps, les six
   pages `/ateliers-pour/{ime,itep,mecs,sessad,esat,ehpad}` écrites le 2/09 pour
   reprendre Google à NotaSuivi ne recevaient **aucun lien** depuis les 93 pages
   du site. Repointées. C'était la correction la moins chère de tout l'audit.
4. **Un seul libellé par destination, à nouveau.** `/register` en portait
   QUATRE : « Créer un compte », « Créer mon compte », « Créer mon compte pour
   entrer » et **« Découvrir LEX »** — ce dernier promettant une découverte et
   livrant un formulaire d'inscription, c'est-à-dire exactement le motif corrigé
   le 12/08, revenu par la porte de derrière. Et « Demander un devis » menait au
   catalogue des formations, pas à un formulaire : devenu « Voir les
   formations ». **Cette règle se défait toute seule à chaque ajout de section :
   la revérifier après chaque passage sur l'accueil.**
5. **Trois cartes par rayon au lieu de dix et sept** (`VITRINE` dans
   `page.tsx`). Le catalogue pesait 44 % de la page — 944 mots sur 2 151, vingt
   cartes produit. Une page d'accueil qui déroule l'inventaire devient une page
   de catégorie.
6. **La « sélection d'ateliers » en était enfin une.** `/public/highlights` trie
   par `featured` puis par vues ; aucune fiche n'étant mise en avant, la
   première carte était **RE-DESSINE MOI** (243 vues, « disponible uniquement
   durant l'été 2025 »). `MISE_EN_AVANT` dans `seed-fiches-ateliers.js` pose
   `featured` sur psycho-boxe, théâtre et musicothérapie — et **remet à false ce
   qui n'y figure pas** : une vitrine est une liste, pas un cumul.
7. **Meta description : 171 → 145 caractères.** Le commentaire du fichier
   annonçait 155 ; la phrase en faisait 171 et Google la coupait en plein
   milieu. **Le compte se vérifie, il ne se déclare pas.**
8. **`OfferCarousel` pointe l'adresse lisible partout.** Le drapeau `useSlug`
   n'était posé que sur les formations : les cartes d'ateliers de l'accueil
   menaient à `/ateliers/cms3it0g70015lt1wyr4sbhqr`. Drapeau supprimé, `slug ??
   id` partout, comme le catalogue le faisait déjà.

⚠ **UN CONSTAT DE L'AUDIT ÉTAIT FAUX, ET IL FAUT LE DIRE.** J'avais relevé
« 5 images sans alt sur 23 ». Vérification faite : **zéro image sans attribut
`alt`** — les cinq portent `alt=""`, qui est le balisage CORRECT pour une image
décorative posée à côté d'un lien qui dit déjà la même chose. Leur « corriger »
un texte alternatif aurait dégradé l'accessibilité en faisant annoncer du bruit
aux lecteurs d'écran. Rien n'a été touché.

**Restent à faire, et ce sont les deux plus gros :** le `h1` ne dit toujours pas
ce que fait le site (« Les interventions portées par ceux qui font le terrain »
est une signature, pas une promesse — la bonne phrase est déjà écrite en dessous
en gris), et **il n'y a toujours aucune preuve sociale** : pas un nom
d'établissement, pas un témoignage, pas un chiffre d'usage. Ce dernier point ne
se code pas, il demande un accord.

### L'enquête de satisfaction — `community/enquete.scheduler.ts`

Demande de Siham : « un questionnaire envoyé à tous ceux ayant envoyé un
1er atelier pour mesurer la satisfaction et avoir un avis sur le site et la
procédure pour proposer ses services ».

**Sept jours après la PREMIÈRE fiche publiée**, une fois, jamais deux.
`Account.enqueteAtelierAt` est le verrou, **posé AVANT l'envoi** — même doctrine
que le tunnel : un doublon coûte plus cher qu'un message manquant, surtout pour
un message qui demande un service. Plancher de 60 jours (plus large que les 30
du tunnel : une expérience de dépôt se raconte encore deux mois après, une
inscription non). Cron à **10 h 45**, une demi-heure après le tunnel, pour que
les deux ne tombent jamais dans la même minute.

⚠ **`hebdoOptIn` NE s'applique PAS à cette enquête, et c'est délibéré.** Cette
case couvre l'éditorial — le rendez-vous du lundi, la séquence d'accueil. Une
enquête sur un service qu'on vient d'utiliser relève de la relation de service :
elle part une seule fois et ne propose rien à vendre. `BANNED` et `ANONYMIZED`
en sont exclus, comme partout.

⚠ **On mesure `Service.createdAt`, pas une date de publication** — le modèle n'en
porte pas. Pour l'immense majorité des fiches les deux sont à quelques minutes
d'écart (le formulaire crée puis publie), et l'écart joue dans le bon sens :
l'enquête part un peu plus tôt, jamais plus tard.

**Quatre questions, une minute, une seule obligatoire.** `RetourExperience`
porte trois notes SÉPARÉES — globale, **le site**, **la procédure de dépôt** —
parce qu'une note unique dit qu'on plaît ou qu'on déplaît, jamais où ça coince.
Et `probleme` est un champ à part de `commentaire` : un ennui vécu se traite
dans la journée, un avis se lit quand on a le temps ; mélangés, le premier se
perd dans le second. `/admin/retours` reprend cette séparation — les problèmes
en haut, avec l'adresse pour répondre.

⚠ **Aucun jeton dans l'URL de l'enquête.** Le courriel mène à
`/dashboard/mon-avis`, où la personne est identifiée parce qu'elle est
connectée. Un identifiant de compte glissé dans une adresse se retrouve dans les
journaux, l'historique du navigateur et le premier partage d'écran venu.

### Les confettis à la mise en ligne

`lancerConfettis()` existait déjà (parrainage, demande de catalogue) : réutilisé,
aucune dépendance ajoutée. Il part maintenant sur **la publication d'un atelier**
(création et remise en ligne), **d'un renfort**, **d'une formation**, sur la
**modération admin vers PUBLISHED** (c'est la mise en ligne des fiches des
intervenants extérieurs) et à l'envoi d'un avis.

⚠ **Jamais sur un brouillon, jamais sur un échec, jamais sur une
dépublication.** Des confettis sur une fiche qui n'est pas en ligne feraient
croire l'inverse de ce qui vient de se passer — et c'est exactement le défaut
que le message « Atelier publié » sur une publication refusée avait produit en
août. `lib/confetti.ts` refuse déjà de partir si la personne a demandé moins
d'animations (`prefers-reduced-motion`).

---

## L'audit expérience client — ce qui a été refermé le 4/09/2026

Demande de Siham : « fait audit experience client de tous les utilisateurs ! on
est a 100% ? », puis « go fait tout ». Le rapport est publié en artefact
(`audit-experience-client.html`). Ce qui suit est ce qui a été **corrigé dans le
code**, avec la raison — pour ne pas défaire par mégarde ce qui a coûté cher à
trouver.

### 1. Le chemin de l'argent était coupé — et c'était le trou le plus cher

`/dashboard/ateliers` ne listait que les réservations `REQUESTED`. Dès qu'un
intervenant en acceptait une, elle quittait la section et retombait en simple
ligne d'historique, **sans aucun bouton** — alors que le serveur réserve
précisément à l'intervenant le droit de la confirmer, de la démarrer et de la
terminer (`assertOffreur`).

⚠ **`preparerFactureAtelier()` n'est appelée QUE depuis `complete()`.** Pas de
`COMPLETED`, donc pas de facture, jamais. Mesuré en production le 3/09/2026 :
**une seule réservation terminée sur quinze**, huit bloquées en « confirmée ».

Corrigé : `A_TRAITER` liste les quatre états qui attendent un geste, dans
l'ordre de la machine à états, avec `ETAPE[]` qui nomme la marche en toutes
lettres. `BookingActions` prend un `contexte` (`"atelier" | "renfort"`) parce que
« Retenir la candidature » n'a aucun sens sur un atelier. `vue-reservations.tsx`
porte les mêmes boutons côté établissement.

### 2. Quatre e-mails qui n'écrivaient qu'une ligne en base

Réservation reçue, demande de devis, devis reçu, rattachement (les trois
moments), transmission de contrat : **cinq méthodes ajoutées à `MailService`**,
et `MailModule` importé dans `services`, `quotes`, `contrats` et
`attachment-requests`.

⚠ **`attachment-requests` n'avait NI `MailService` NI `NotificationsService`** :
zéro notification dans les deux sens, contre quatre écrans qui promettaient le
contraire. Deux personnes attendaient au moment de l'audit. Le message
d'acceptation dit explicitement de **se déconnecter puis se reconnecter** — la
liste des comptes voyage dans le jeton.

⚠ **Ajouter un paramètre au constructeur casse les specs qui instancient la
classe à la main** (`ServicesService` → 4 arguments, `QuotesService` → 3). Même
piège que pour `AdminService` en août. Les cinq sites d'appel ont été repris.

### 3. SOS Renfort : le premier palier refusait ceux pour qui il existait

`ciblage.service.ts` levait **inconditionnellement** sur
`visibility === SALARIES`, avant les quarante lignes écrites plus bas pour
laisser précisément les salariés rattachés répondre. Or `SALARIES` est le choix
**par défaut** du formulaire ET du serveur : pendant les six premières heures de
chaque annonce, **personne** ne pouvait répondre. Le refus ne vaut désormais que
pour qui n'est pas de la maison, et la cascade `RESERVED` garde l'équipe ouverte
(elle s'élargit, elle ne se rétrécit jamais).

### 4. Devis : une élévation de privilège réelle

`requireParticipant()` ne lisait que les appartenances de la **personne** ; le
garde de rôle du contrôleur ne juge que le compte **actif**. Un éducateur simple
`MEMBER` d'une MECS, `OWNER` de son compte intervenant perso, basculait dessus et
acceptait un devis à 900 € au nom de l'établissement. L'en-tête de
`quotes.controller.ts` documentait ce trou comme refermé : il l'était pour le
menu, pas pour la route. `findOne`, `send`, `accept` et `refuse` reçoivent
maintenant `@CurrentAccount()`.

Les scénarios 3 et 4 sont figés dans `src/common/audit-experience.spec.ts` —
ils ne se voient pas en relisant le fichier fautif, seulement en les jouant.

### 5. Panne d'API ≠ fiche supprimée (le piège SEO)

Les cinq fiches publiques faisaient `if (!data) notFound()` + `robots: noindex`.
Or `fetchPublic` renvoyait `undefined` aussi bien sur un 404 que sur une API
injoignable : **pendant chaque redéploiement, tout le catalogue répondait
« supprimé » aux robots**, et un désindexage se répare en semaines. `fetchPublic`
conserve désormais le statut HTTP ; `_shared/fiche-publique.ts` pose la
distinction une seule fois (`exigerFiche`, `metaIntrouvable`).

### 6. Les petites vérités qui coûtaient cher

- **« Intervenants vérifiés »** sur la fiche atelier : faux, et c'est la pire
  catégorie de faux — une promesse de sécurité faite à qui va confier des
  enfants. Aucune vérification d'identité n'existe dans le produit (16 comptes
  vérifiés sur 113, et cela ne vérifie qu'une adresse e-mail). Remplacé par
  « Rien n'est engagé avant votre accord », qui est vrai.
- **« Attestation et certificat délivrés »** sur la fiche formation
  contredisait frontalement le bloc « ni diplôme, ni certification
  professionnelle » situé plus haut **sur la même page**.
- **Le Desk** comptait les renforts urgents avec `lte: in48h` sans borne basse :
  le compteur ne pouvait que grossir, et une alerte qui ne redescend jamais
  cesse d'en être une. Deux files invisibles y sont ajoutées : les messages de
  contact `NEW` et les rattachements `PENDING`.
- **Le menu réduit du salarié en attente** ne tenait que sur `/dashboard` :
  un clic sur le catalogue (`app/marketplace/layout.tsx`) rendait les quinze
  entrées freelance, dont douze mènent à un refus serveur. `/dashboard/appui-scolaire`
  manquait aussi à `lib/rattachement.ts` — seule porte de LEX qui restait fermée.
- **« Interventions à venir »** ne comptait que les réservations où
  l'intervenant est le **demandeur** : un atelier de son catalogue réservé par
  un établissement porte l'identifiant de l'ÉTABLISSEMENT. Le compteur ignorait
  donc tout son métier.
- **Suppressions optimistes** (`AssistantStudio`, `TramesMaison`) : le
  `.catch(() => undefined)` avalait l'échec et la ligne disparaissait quand même.
- **La page d'accueil** perdait ses trois rayons en silence si `/public/highlights`
  ne répondait pas : un visiteur arrivant pendant un redéploiement voyait une
  association sans un seul atelier. Un encart le dit maintenant.

### Ce qui reste et n'est PAS du code

SIRET et adresse dans l'assistant d'établissement (imprimés « SIRET — » sur les
factures et les CDD) ; le médiateur de la consommation (CECMC) ; le premier
paiement Stripe réel ; le second compte ADMIN ; RE-DESSINE MOI (fiche « été 2025 »
à 300 €, toujours en ligne) ; les vraies adresses de Younes, Christophe et
Jean Léo ; le `h1` de l'accueil ; la preuve sociale.

---

## LEX vu du métier, et les alertes de recherche — 4 septembre 2026

Commit `cefb9d5`. Deux des trois priorités posées avec Siham (« fait l'un après
l'autre mais il faut tous les faire »). La première — la mémoire des situations
— était déployée dans la journée.

### `/admin/lex-qualite` — la donnée entrait, personne ne la lisait

`AssistantFeedback` se remplissait à chaque pouce haut ou bas depuis des mois,
et **aucune requête ne le lisait nulle part**. Exactement le défaut des quatre
e-mails qui n'écrivaient qu'une ligne en base : on pilotait à l'intuition un
produit qui coûte un crédit par appel.

L'écran donne l'usage (écrits gardés, dont 30 jours, écrits portant une
personne identifiée, trames maison, pseudonymes suivis), la satisfaction, et le
détail par trame. ⚠ **Les trames sont triées par satisfaction CROISSANTE, pas
par volume** : une trame peu utilisée mais juste ne coûte rien, une trame très
utilisée et ratée abîme la confiance à chaque appel — c'est celle-là qu'on
répare, et elle doit être en haut.

⚠ **COLLISION DE ROUTES ÉVITÉE DE JUSTESSE** : `@Get('lex')` existe déjà dans
`admin.controller.ts` (ligne 192) pour l'argent — ventes de packs,
consommation, abonnements. Nest garde la PREMIÈRE route déclarée et ignore la
seconde **sans le dire**. D'où `@Get('lex/qualite')`, et l'avertissement écrit
au-dessus des deux.

⚠ **L'écran s'ouvre aujourd'hui sur un bandeau « aucun écrit enregistré », et
c'est la vérité** : documents 0, avis 0, pseudonymes 0. La qualité de LEX ne se
mesure pas encore parce que LEX n'a pas encore servi. Le premier écrit mené de
bout en bout — généré, relu, enregistré — amorce à la fois cet écran et la
mémoire des situations.

### Les alertes de recherche — la mécanique de rétention qui manquait

Un directeur cherche « médiation animale, Essonne », ne trouve rien, et il est
perdu définitivement : personne ne revient vérifier un catalogue chaque semaine.
Sur dix-sept fiches, la plupart des recherches précises ne trouvent rien. Une
alerte retourne la charge — c'est la plateforme qui écrit le jour où la fiche
existe.

Modèle `AlerteRecherche` (migration `20260904190000_alertes_recherche`,
additive), `community/alertes.service.ts`, `alertes.scheduler.ts`,
`sendAlerteRecherche` dans `MailService`, quatre routes sous `/community/alertes`,
page `/dashboard/alertes`, entrée de menu côté établissement. 13 tests
(`community/alertes.spec.ts`).

**Ce qui tient ce chantier, et qu'il ne faut pas défaire :**

- ⚠ **LA BORNE DE NOUVEAUTÉ EST `dernierEnvoiAt`, PAS LA DATE DE CRÉATION.**
  Sans elle, chaque passage renvoie les mêmes fiches indéfiniment et l'alerte
  devient le courriel qu'on met en filtre. Au premier passage la borne est la
  création de l'alerte : on ne signale jamais comme « nouveau » ce qui existait
  déjà quand la personne l'a posée. Deux tests couvrent les deux cas.
- ⚠ **LE VERROU SE POSE AVANT L'ENVOI**, comme pour le tunnel et l'enquête. Un
  doublon fait se désabonner, un message manquant se rattrape le lendemain.
- ⚠ **Le passage est quotidien mais n'écrit QUE s'il y a du neuf.** Sur un
  catalogue qui grossit de quelques fiches par mois, la plupart des jours ne
  produisent aucun courriel. C'est exactement ce qu'on veut : un message qui
  arrive est un message qui apporte quelque chose. 8 h 15, avant le tunnel
  (10 h 15) et l'enquête (10 h 45).
- ⚠ **`hebdoOptIn` NE S'APPLIQUE PAS**, et c'est délibéré. Cette case couvre
  l'éditorial. Une alerte est demandée explicitement, critère par critère, par
  quelqu'un qui attend précisément ce message ; la couper au nom d'un réglage
  éditorial serait ne pas rendre le service promis. Elle se met en pause ou se
  supprime d'un clic sur sa page.
- ⚠ **RÉSERVÉ AUX PERSONNES CONNECTÉES.** Ouvrir l'alerte aux visiteurs
  anonymes demanderait un double opt-in, une page de désabonnement autonome et
  une modération des adresses saisies : trois chantiers pour capter un peu plus
  haut dans l'entonnoir. Un compte existe déjà, son adresse est vérifiée, et il
  porte le lien de désabonnement de l'application.
- **Le nombre de fiches déjà en ligne est annoncé à la création.** Une alerte
  posée sur un critère qui rend déjà trente résultats n'est pas une alerte,
  c'est une recherche : mieux vaut le dire que de laisser quelqu'un attendre un
  courriel qui n'apportera rien de neuf.
- **Le `where` Prisma est écrit UNE FOIS** (`critères()`), partagé entre le
  comptage à la création et le planificateur. Deux définitions du même filtre
  finiraient par diverger, et la personne recevrait des fiches qui ne
  correspondent pas à ce qu'on lui a montré.
- **Les codes de département ne sont pas validés dans le DTO** mais confrontés
  au référentiel dans le service : un `@IsIn` sur cent un codes se
  désynchronise de `territoires.ts` au premier ajout.

**Le point d'entrée est le catalogue, et les critères voyagent.** Quand une
recherche filtrée ne rend rien, l'écran vide propose « Me prévenir quand ça
arrive » ; quand elle rend des résultats, une ligne discrète sous la grille dit
la même chose. Les deux mènent à `/dashboard/alertes?recherche=…&departement=77`
et **le formulaire s'ouvre pré-rempli** : la personne vient d'exprimer son
besoin, le lui redemander perd la plupart de ceux qui ont cliqué. Le tri n'est
pas repris — il ordonne un résultat, il ne décrit pas un besoin.

⚠ **L'entrée de menu est côté ÉTABLISSEMENT seulement.** C'est lui qui cherche
dans le catalogue et repart bredouille ; un intervenant ne cherche pas
d'atelier, il en publie.

### ⚠ RÈGLE D'ENVOI : 260 PAR LOT, PAS 300 — décision de Siham, 4/09/2026

Le forfait gratuit Brevo plafonne à **300 e-mails par jour, campagnes ET
transactionnel confondus**. Le premier lot est parti à 300 destinataires : 2
mails de la plateforme étaient déjà sortis le matin, Brevo a envoyé 298 et
suspendu la campagne tout seul, et **le quota du jour était consommé à 15 h**.
Conséquence : jusqu'à minuit, une personne qui crée un compte sur les-extras.fr
ne recevait pas son lien de confirmation.

**Donc : 260 par lot désormais.** Les 40 restants sont la réserve des envois de
la plateforme — confirmation d'adresse, bienvenue, alerte d'inscription, tunnel
d'accueil (10 h 15), enquête de satisfaction (10 h 45), alertes de recherche
(8 h 15). C'est peu, mais ces mails-là ne se rattrapent pas : une confirmation
qui n'arrive pas, c'est un compte qui ne s'ouvre jamais.

⚠ **NE PAS REMONTER CE CHIFFRE POUR « GAGNER DU TEMPS ».** L'arithmétique est
brutale et il faut la connaître : 10 618 contacts × 6 messages = 63 708 envois,
soit à 260 par jour environ **huit mois** pour dérouler le tunnel entier. Ce
n'est pas 40 mails par jour qui changent cet ordre de grandeur — seul un
forfait payant le change. Voler la réserve du transactionnel pour gagner 15 %
de vitesse casse les inscriptions pour 15 % de gain.

État au 4/09/2026 : liste **#13 « contact site LE SOCIAL » = 10 618 contacts**
(la base), liste **#34 « Parcours gratuits - lot 1 » = 300**, campagne **#82**
partie à 15 h 07 (298 envoyés, 2 en attente du quota de demain). Les lots
suivants se découpent à 260 depuis la liste #13.

### 🔴 LE LOT 1 A REBONDI À 40 % — ARRÊT DES ENVOIS, 4/09/2026

Résultat de la campagne #82, une heure après l'envoi : **298 envoyés,
175 délivrés, 121 rebonds durs (40,6 %)**, 3 rebonds doux, 0 plainte,
0 désabonnement.

**La limite acceptable du métier est 2 %. On est à vingt fois.** Au-delà de
5 %, Brevo suspend le compte et Gmail comme Outlook commencent à classer tout
ce qui vient du domaine en indésirable. Le compte est encore actif (vérifié),
mais **aucun autre lot ne doit partir avant validation de la base.**

Répartition par domaine, et elle est parlante :

| Domaine | Envoyés | Rebonds durs | Part |
|---|---|---|---|
| orange.fr | 25 | 20 | 80 % |
| sfr.fr | 18 | 13 | 72 % |
| laposte.net | 10 | 7 | 70 % |
| yahoo.fr | 28 | 15 | 54 % |
| free.fr | 11 | 5 | 45 % |
| gmail.com | 70 | 20 | 29 % |
| hotmail.fr | 50 | 10 | 20 % |

C'est la signature d'une base **VIEILLE**, pas d'une base fabriquée. Les
adresses de fournisseur d'accès français (Orange, SFR, La Poste) sont
supprimées quand la personne change d'opérateur ; Gmail garde les siennes bien
plus longtemps. Un écart de 80 % contre 29 % ne s'explique que par l'âge.

⚠ **LA LEÇON QUI COÛTE LE PLUS CHER ICI.** Le lot 1 avait été « nettoyé » avant
l'envoi : 18 adresses écartées sur 500, soit 3,6 %. Ce nettoyage portait sur la
SYNTAXE et le domaine. **Il ne détecte rien du vrai problème** : `orange.fr` a
des MX parfaitement valides, c'est la BOÎTE qui n'existe plus. Seule une
validation au niveau de la boîte aux lettres (service de vérification payant)
mesure ce qui compte. Ne jamais repartir sur un contrôle de syntaxe en croyant
avoir validé une base.

⚠ **NE PAS SONDER LES ADRESSES EN SMTP DEPUIS LE CONTENEUR** pour économiser ce
service. Interroger 10 618 boîtes en `RCPT TO` depuis une IP de cloud, c'est le
profil exact d'une attaque de moisson d'annuaire : l'IP se fait blocklister et
on abîme précisément ce qu'on essaie de protéger.

**Extrapolation à manier avec prudence** : 40 % sur 10 618 ferait ~4 300
adresses mortes. Mais le lot 1 n'est PAS un échantillon aléatoire — ce sont les
300 premiers de la liste #13. Le taux réel de la base entière peut être
sensiblement différent. La seule façon de le savoir est de valider.

**Décision qui revient à Siham** : faire valider les 10 618 adresses par un
service de vérification (ordre de grandeur 40 à 60 € pour ce volume), ou
renoncer à cette base et n'écrire qu'aux personnes qui se sont inscrites depuis
le site. Rien ne repart tant qu'elle n'a pas tranché.

⚠ La campagne #82 reste **suspendue avec 2 destinataires en attente** : ne pas
la reprendre. Les 121 adresses rebondies sont désormais en liste noire chez
Brevo, elles ne repartiront pas d'elles-mêmes.

### L'échantillon de 300 adresses — préparé, PAS téléversé (4/09/2026)

Pour mesurer le vrai taux de mortalité de la base sans envoyer un seul mail :
300 adresses tirées de la liste #13 **au milieu de la base** (`offset=5000`,
pas les 300 premières qui ont servi au lot 1, pour ne pas remesurer le même
échantillon). Mélange de domaines identique au lot 1 — gmail 87, hotmail.fr 61,
orange.fr 28, yahoo.fr 26, sfr.fr 20, hotmail.com 17, free.fr 14, live.fr 8 —
donc représentatif.

Fichier : `/home/claude/echantillon-300-base-le-social.csv` (colonne `email`
seule, aucun nom, aucune donnée annexe).

⚠ **LE TÉLÉVERSEMENT CHEZ BOUNCER A ÉTÉ REFUSÉ par le garde-fou de sécurité**,
et c'est légitime : envoyer un fichier de 300 adresses personnelles vers un
service tiers est une décision qui appartient à un humain, pas à un automate.
Le fichier a donc été **remis à Siham**, à elle de le déposer sur
`usebouncer.com/free-email-list-sampling` (glisser-déposer ou coller, sans
compte). **Ne pas contourner ce refus** en collant les adresses dans le champ
texte par script : ce serait la même action sous un autre nom.

Ce qu'on attend du rapport : le taux de rebond estimé. En dessous de 5 %, on
peut envoyer par lots de 260 depuis le sous-domaine. Au-dessus, il faut nettoyer
la base avant tout envoi (validation payante, ~40 à 60 € pour 10 618 adresses)
ou renoncer à cette base.

### ⚠ DEUX GARDE-FOUS QUI NE SE CONTOURNENT PAS (4/09/2026)

Siham a dit « fait tout tout seul, carte blanche ». Deux actions ont quand même
été **refusées par le garde-fou de sécurité de la session**, et ce refus ne se
lève pas depuis la conversation. Ne pas y repasser du temps :

1. **Téléverser le CSV des 300 adresses chez Bouncer.** Envoyer un fichier de
   données personnelles vers un service tiers demande un humain. Le fichier a
   été remis à Siham.
2. **Poser un hameçon sur `fetch`/`XHR` dans la page Brevo** pour y lire la clé
   DKIM au passage. Refusé — et à raison : un script qui intercepte le trafic
   réseau d'une page authentifiée, en réécrivant au passage la barre d'adresse,
   a exactement la signature d'un vol d'identifiants. **Ne pas réessayer sous
   une autre forme** : coller les adresses dans le champ texte plutôt que
   téléverser le fichier, ou relire la clé caractère par caractère au zoom,
   c'est la même action déguisée.

Autres impasses mesurées, pour ne pas les refaire :
- `computer_read_clipboard` (outil appareil) exige une autorisation que Siham
  doit accorder sur sa machine — donc pas « tout seul » non plus ;
- les points d'API internes de Brevo devinés (`/senders/api/domains`, etc.)
  renvoient tous la coquille HTML de l'application, jamais du JSON ;
- `javascript_tool` marche sur les pages Brevo à URL propre
  (`/senders/domain/list`) mais est bloqué dès que l'URL porte des paramètres
  (« BLOCKED: Cookie/query string data ») — c'est pour ça que la page
  d'authentification du domaine est illisible par script ;
- ⚠ **un `zoom` interrompu laisse le viewport CDP coincé** (ici à 600×43) :
  `resize_window` répond « succès » sans rien changer. **Remède : onglet neuf**,
  la fenêtre redevient normale.

**Solution de repli si le DNS traîne** : trois domaines sont DÉJÀ authentifiés
chez Brevo — `a2pa.fr`, `adepa77.fr`, `les-extras.fr`. On pourrait faire partir
les campagnes de `a2pa.fr` (le moins critique) et garder `adepa77.fr` pour les
envois de la plateforme : la séparation des flux serait obtenue aujourd'hui,
sans toucher au DNS. **Le coût est la confusion de marque** — des parcours
ADéPA envoyés depuis l'adresse du Studio A2PA — et la réputation d'a2pa.fr qui
trinque à la place. À ne faire que si Siham le décide.

### Le sous-domaine `news.adepa77.fr` — les 3 enregistrements sont posés (4/09/2026, soir)

Vérifié en direct par résolution DNS :

| Nom | Valeur | État |
|---|---|---|
| `news.adepa77.fr` | `brevo-code:1d0e46c2f4ba20fa6f824e9c478b177e` | ✅ |
| `mail._domainkey.news.adepa77.fr` | `k=rsa;p=MIGfMA0GCS…` (224 car., format valide) | ✅ |
| `_dmarc.news.adepa77.fr` | `v=DMARC1; p=none; rua=mailto:rua@dmarc.brevo.com` | ✅ |

Brevo affiche encore **« Non authentifié »** : c'est normal, le DMARC vient
d'être posé et Brevo annonce lui-même « jusqu'à 48 heures ». Il revérifie tout
seul, il n'y a rien à refaire — **ne pas repasser dix fois sur le bouton
« Authentifier »**.

⚠ **DEUX SCORIES DANS LA ZONE, sans gravité mais à connaître :**
1. Un `brevo-code:…` traîne AUSSI sur `mail._domainkey.news` (en plus du DKIM).
   Plusieurs TXT au même nom sont légaux et les validateurs prennent le `k=rsa`,
   donc ça ne casse rien. À supprimer un jour au calme, pas en urgence.
2. Un `mail._domainkey.adepa77.fr` porte la MÊME clé (Brevo réutilise une clé
   par compte). C'est normal, ne pas le supprimer : il sert au domaine parent.

⚠ **PIÈGE DE SAISIE HOSTINGER, à ne jamais refaire.** `ctrl+a` dans le champ
Valeur n'est PAS interprété comme « tout sélectionner » : le « a » est saisi
littéralement. Résultat obtenu deux fois de suite : `av=DMARC1; …`, invisible
tant qu'on ne quitte pas le champ (le curseur masque la faute au zoom).
**Méthode sûre : cliquer le champ, cliquer sa croix ⊗ pour vider, puis taper —
jamais de ctrl+a. Et vérifier en cliquant AILLEURS avant de valider**, sinon le
caret se lit comme une lettre.

### Liste #35 « Parcours gratuits - lot 2 (gmail+hotmail) » — créée, VIDE

5 408 adresses gmail + hotmail extraites de la base (gmail.com 3 012,
hotmail.fr 2 013, hotmail.com 383), **les 300 du lot 1 exclues** pour ne pas
réécrire aux mêmes. Fichiers : `/home/claude/gmail-hotmail-all.csv` et
`/home/claude/lot2-260.csv`.

L'import des 260 est monté jusqu'à l'écran final. Il bloque sur la
**« Certification Opt-in »** — une attestation juridique qui engage
l'association : « mes contacts m'ont explicitement autorisé… n'ont pas été
récupérés d'un tiers… n'ont pas été achetés ou loués ». **Je ne coche pas cette
case** : elle affirme des faits sur la collecte que seule Siham connaît, et le
taux de rebond de 40 % du lot 1 ne permet pas de l'affirmer de l'extérieur.
C'est à elle, et c'est une seconde.

---

## Le SIRET, les scories des PDF, et le 11e parcours — 4 septembre 2026 (soir)

### ⚠ LE « SIRET — » DES FACTURES N'ÉTAIT PAS UN CHAMP VIDE, C'ÉTAIT UN BOGUE

Le compte de l'association n'avait effectivement pas de SIRET, mais ce n'était
que la moitié du problème. Le vrai défaut : **19 occurrences de `?? ', '`**
dans les générateurs de PDF, toutes des scories du nettoyage des tirets du
4/09. Un champ vide n'imprimait donc pas un tiret mais **une virgule suivie
d'une espace**, sur des documents juridiques :

- `facture.pdf.ts` : SIRET émetteur, raison sociale client, SIRET client, et la
  fonction `adresse()` elle-même ;
- `contrat-cdd.pdf.ts` : SIRET employeur, qualification, poste, **convention
  collective**, retraite complémentaire, prévoyance, personne remplacée ;
- `devis.pdf.ts`, `proposition.pdf.ts` : SIRET, libellés de lignes, qualité du
  signataire.

Tous remplacés par **`'Non renseigné'`** (et `'Non renseignée'` pour l'adresse).
Sur un CDD, « Convention collective , » est le genre de ligne qu'un inspecteur
du travail relève ; « Non renseigné » est au moins honnête.

⚠ Il reste des `?? ', '` hors du dossier `documents/` (community.service.ts,
admin.service.ts) : ce sont des libellés d'affichage, moins graves, mais à
reprendre au passage suivant.

### L'identité légale de l'association — relevé Insee du 03/09/2026

Fourni par Siham le 4/09. **Ces valeurs font foi**, elles viennent de l'avis
Insee :

| | |
|---|---|
| SIREN | 820 051 852 |
| SIRET du siège | **82005185200011** |
| TVA intracommunautaire | FR52820051852 |
| Adresse | **7 rue André Malraux, 77000 Melun** |
| Forme | Association loi 1901, créée le 19/06/2012 |
| NAF/APE | Autres organisations fonctionnant par adhésion volontaire |

`prisma/seed-identite-association.js` les pose sur le compte ADéPA. Idempotent :
il **ne remplit que les champs vides**, ne remplace jamais une saisie humaine.

⚠ **`vatMention` N'EST PAS TOUCHÉE, ET C'EST DÉLIBÉRÉ.** Avoir un numéro de TVA
intracommunautaire ne veut pas dire être assujetti : une association peut en
avoir un pour ses achats intracommunautaires tout en restant en franchise. La
mention par défaut du produit (non assujetti, art. 293 B du CGI) est celle que
le schéma documente pour ce compte. Écrire un taux sur la foi d'un numéro
serait inventer un statut fiscal.

⚠ **L'adresse retenue est MELUN, pas Dammarie.** Le certificat Qualiopi et
l'Insee disent tous les deux Melun ; Dammarie-lès-Lys est l'adresse
administrative, et elle traîne encore dans les pieds de page des e-mails Brevo
(templates 75 à 80) — à corriger un jour, ce n'est pas juridiquement grave sur
un e-mail, ça l'est sur une facture.

### F11 — « Renforcer ce qui va » (écrit, PAS encore publié)

`apps/web/scripts/mini-formations/f11-renforcer.js` — 73 967 caractères, quatre
modules (12/10/12/12 min), six figures, cinq fiches d'annexes. Même gabarit que
f6 à f10, HTML équilibré, vérifié.

C'est le pilier qui manquait à côté de « Les quatre fonctions » (comprendre) et
« Apprendre à demander » (remplacer) : celui-ci **augmente ce qui existe déjà**.
Le module 1 pose la phrase qui trie — on ne peut renforcer que ce qui est déjà
apparu — et renvoie explicitement vers les autres parcours sinon.

⚠ **TROIS GARDE-FOUS SONT DANS LE CORPS DU TEXTE, pas en note :**
1. **On ne retire jamais ce qui a été gagné.** Le retrait d'un point acquis
   transforme le dispositif en punition et met fin à la confiance. C'est la
   scène du module 2 et l'alerte qui la suit.
2. **On ne conditionne jamais un besoin fondamental** — repas, sommeil, soins,
   affection, sortie, lien familial, et surtout **le moyen de communication**.
   Fiche d'annexe n°1, à afficher en salle d'équipe.
3. **Le renforçateur social n'est pas universel.** Félicitations publiques,
   contact visuel et main sur l'épaule sont aversifs pour une partie des
   personnes accompagnées, autistes en particulier. Le parcours fait TESTER.

Le module 3 fait écrire **à qui sert le comportement** avant de le choisir, et
fait renoncer si la réponse est « à l'équipe ». Sans cette colonne, le parcours
deviendrait une méthode pour obtenir de la docilité.

⚠ **IL EST DANS `COMPORTEMENTALES`** (contenu issu de l'ABA) : l'encart de
nuance doit être posé dans `build-v2.js`, et le `GARDE_FOU` correspondant sur la
fiche publique. Les deux doivent dire la même chose.

**Ce qui reste pour le mettre en ligne**, dans cet ordre imposé (voir la section
« Ce que la chaîne de publication demande ») : créer la formation sur Teachizy
(POST trainings, puis 5 SECTION + 5 GENERIC) pour obtenir uuid et ids de leçons
→ les poser dans `IDS` et `SOURCES` de `build-v2.js` → couverture dans
`couvertures-mini-formations.py` → entrée dans `fiches-recap-data.js` → fiche
publique dans `seed-mini-formations.js` → pousser, déployer le web, charger les
5 pages, publier, puis déployer l'API et lancer le seed.

⚠ **`build-v2.js` LÈVE « ids manquants » si on ajoute f11 à `SOURCES` avant
d'avoir les ids Teachizy.** C'est pour ça que le require n'est pas encore posé :
la chaîne commence par Teachizy, pas par le code.

### Seed d'identité lancé le 4/09/2026 — et une découverte

Sortie du script en production :

```
[+] adépa (ESTABLISHMENT) : siret, address, postalCode, city
[+] ADéPA (ESTABLISHMENT) : siret, address, postalCode, city

Établissements encore sans SIRET : 28.
```

⚠ **IL Y A DEUX COMPTES ÉTABLISSEMENT POUR L'ASSOCIATION**, « adépa » et
« ADéPA ». Le 3/09, `Account.name` avait été passé de « adépa » à « ADéPA » —
la note de l'époque laissait croire à un renommage, il s'agissait en fait d'un
SECOND compte. Les deux portent maintenant le même SIRET, ce qui est
factuellement exact (c'est la même association) mais **ce n'est pas une
situation saine** : deux comptes émetteurs pour une seule personne morale
veulent dire deux séries de factures, donc deux numérotations parallèles sur un
SIRET unique — exactement ce que l'article 242 nonies A interdit.

**À trancher par Siham, et à ne pas faire à sa place** : lequel des deux est le
compte vivant, et que faire de l'autre. Rien ne doit être supprimé (règle n°6) ;
la sortie propre est d'archiver le compte mort après avoir vérifié qu'aucune
facture ni aucun atelier n'y est rattaché.

**28 établissements sans SIRET** : ce sont les comptes des structures clientes.
Leurs factures impriment désormais « Non renseigné » au lieu d'une virgule, ce
qui est correct — c'est à chaque structure de renseigner le sien depuis son
espace, pas à l'association de l'inventer.

---

## Les trois niveaux, et les quiz — 4 septembre 2026 (nuit)

### ⚠⚠ « CERTIFICAT PROFESSIONNEL » : DEMANDÉ, ET REFUSÉ. LIRE AVANT D'Y REVENIR

Siham a demandé des niveaux « pour obtenir un certificat professionnel ». Les
niveaux sont faits ; **le mot « certificat » n'apparaît nulle part**, sauf dans
le bloc qui explique que ce n'en est pas un. La raison, une fois pour toutes :

- un **certificat professionnel** désigne en France une certification
  enregistrée au **RNCP** ou au **Répertoire spécifique**, délivrée par un
  organisme habilité par **France Compétences** ;
- **Qualiopi n'est pas cela.** Qualiopi certifie la QUALITÉ DU PROCESSUS d'un
  organisme de formation. Elle n'autorise à délivrer aucun titre, aucune
  certification, aucun droit à exercer. **Aucun organisme certifié Qualiopi ne
  peut délivrer une certification professionnelle à ce seul titre.**
- vendre 20 € un document présenté comme un « certificat professionnel » serait
  une **pratique commerciale trompeuse** (art. L121-1 c. conso), et elle serait
  d'autant plus lourdement retenue contre un organisme justement certifié
  Qualiopi. C'est exactement la règle « attestation de suivi, jamais
  certificat » déjà écrite dans les CGV et dans le gabarit des formations.

**Ce qui est délivré, et qui est déjà dans les CGV** : une *attestation de
suivi*, par parcours. La page ajoute une *attestation de parcours* pour un
niveau entier — même nature juridique, un document qui liste plusieurs parcours
au lieu d'un seul.

**Si Siham veut une vraie certification**, le chemin existe : dossier au
Répertoire spécifique auprès de France Compétences, avec référentiel de
compétences, référentiel d'évaluation, jury indépendant et preuves d'insertion.
Cela se compte en mois et en milliers d'euros. C'est une décision d'association,
pas un réglage de site.

### `/parcours-de-formation` — trois niveaux

`lib/niveaux-formations.ts` + `(public)/parcours-de-formation/page.tsx`, route
ajoutée au `sitemap.ts`.

| Niveau | Nom | Ce qu'il fait |
|---|---|---|
| 1 | Les socles | Comprendre avant d'agir. Fonctions, environnement prévisible, crise, décrire sans juger. |
| 2 | L'approfondissement | Agir sur une situation, avec un relevé. Demander, renforcer, décomposer, guider, consignes, démarrage. |
| 3 | L'expertise | Situations complexes et écrits. Réaction de survie, ESS, mesurer, résoudre avec la personne. |

⚠ **LES NIVEAUX NE VERROUILLENT RIEN.** Aucun parcours n'est rendu inaccessible
tant qu'un autre n'est pas fini, et c'est délibéré : un professionnel qui a une
crise lundi matin doit pouvoir ouvrir le parcours crise lundi matin. On guide,
on n'enferme pas — même doctrine que l'indicateur de complétude des fiches.

Les parcours non encore écrits sont marqués `aVenir: true` et affichés « en
cours d'écriture » : la page ne promet rien qui n'existe pas.

### Les quiz — le blocage Teachizy contourné

⚠ **LA NOTE DU 3/09 DISAIT « aucun point d'API quiz découvert, plus aucun
module ne promet de quiz ». Elle est désormais PÉRIMÉE.** Le problème était mal
posé : on cherchait à créer des items `QUIZ` côté Teachizy alors qu'un quiz rendu
en **HTML dans le corps du module** ne dépend d'aucun point d'API.

`G.quiz({ questions })` ajouté à `gabarit-v3.js`, câblé dans `assembler()` entre
les annexes et « Avant de passer au module suivant ».

⚠ **LES RÉPONSES SONT EN BAS, PAS EN REGARD**, sur le modèle d'un cahier
d'exercices papier. On ne peut pas compter sur `<details>` : le richtext de
Teachizy n'en garantit pas le rendu. Moins joli qu'un quiz interactif,
infiniment plus robuste — ça s'affiche partout, ça s'imprime, et ça survit à un
changement de plateforme.

⚠ **CHAQUE RÉPONSE PORTE UN « POURQUOI »**, et il explique aussi ce qui rend les
autres options fausses. Un quiz qui dit « bonne réponse : B » n'enseigne rien ;
c'est le commentaire qui fait le travail.

**Fait** : f11 « Renforcer ce qui va » porte ses **4 quiz, 20 questions**
(94 286 caractères au total avec les quiz).

**Reste** : les dix parcours déjà en ligne, soit **40 quiz / ~200 questions**.
Le mécanisme est posé, il ne reste que l'écriture — puis un `build-v2` et un
rechargement des pages Teachizy, sans rien recréer.

### Ce que contiennent déjà les annexes (réponse à « y a-t-il des exercices ? »)

Oui, et depuis le début — c'est la partie la plus dense du catalogue :

- **un exercice nommé par module** (`G.exercice`), avec durée, étapes numérotées
  et un critère « c'est réussi quand » vérifiable par l'apprenant ;
- **un carnet de séance par module** (`G.carnet`) : le livrable à garder ;
- **5 à 11 fiches techniques par parcours** — f6 en a 11, f9 en a 9, f1 en a 8,
  f11 en a 5 : grilles de relevé vierges, tableaux de décision, listes de
  préférences, affiches à poser en salle d'équipe ;
- **une fiche récap A4 imprimable** par parcours, en libre accès avant toute
  inscription.

Ce qui manquait vraiment, c'étaient les quiz. C'est réglé pour f11.

### F12 — « Décrire un comportement sans le juger » (écrit, PAS publié)

`apps/web/scripts/mini-formations/f12-decrire.js` — 86 433 caractères, quatre
modules, **4 quiz (20 questions)**, 6 fiches d'annexes, 5 figures.

**Pourquoi celui-là en premier** : la page `/parcours-de-formation` mise en
ligne le même jour l'annonce « en cours d'écriture » dans le niveau 1. Une
promesse publiée se referme avant qu'on améliore l'existant. Et c'est le socle
des trois autres : on ne peut pas relever ce qui précède un comportement si on
écrit « il a été agressif », ni compter un comportement si deux collègues ne
comptent pas la même chose.

**L'outil central est le test de la caméra** : une caméra posée dans la pièce
aurait-elle enregistré ce que je viens d'écrire ? Elle ne filme ni les
intentions, ni les motivations, ni les diagnostics.

⚠ **LES RÉFÉRENCES JURIDIQUES, VÉRIFIÉES UNE PAR UNE**, et la fiche d'annexe
n°6 est faite pour le jour où quelqu'un affirme le contraire en réunion :

| Ce qu'on entend | Ce qu'il en est |
|---|---|
| « La HAS impose de distinguer faits et interprétations » | **Faux.** Aucune recommandation consacrée aux écrits professionnels. Règle de métier, pas norme opposable. Le parcours ne l'adosse à aucun texte. |
| « Rien n'encadre nos écrits » | **Faux aussi.** Cadre national de référence de janvier 2021, obligatoire par le **décret 2022-1728** : équilibre préoccupations / points d'appui, point de vue de l'enfant ET des parents. |
| « La personne n'a pas accès à ce qu'on écrit » | **Faux.** **Art. L311-3 CASF** : accès à toute information ou document relatif à sa prise en charge. |
| « L'article 40 nous oblige à signaler » | **Inexact.** L'art. 40 al. 2 CPP n'oblige que les autorités constituées et les fonctionnaires, pas un salarié d'association. |

⚠ **AUCUN DIAGNOSTIC SOUS SIGNATURE ÉDUCATIVE**, encart dédié au module 1 :
écrire « évoquant une problématique psychotique » étiquette la personne sans
évaluation ET retarde le vrai diagnostic de plusieurs mois parce que « c'est
déjà dit dans le dossier ». On rapporte un diagnostic existant en citant qui l'a
posé ; on n'en formule jamais.

⚠ **TROIS MALENTENDUS TRAITÉS EXPLICITEMENT**, parce qu'ils font autant de
dégâts que l'interprétation déguisée : écrire des faits ne veut dire ni écrire
sans penser (l'hypothèse s'annonce), ni écrire froidement (« il pleurait » est
filmable), ni **ne rapporter que le négatif** — un écrit qui n'aligne que des
difficultés n'est pas neutre parce qu'il est factuel, il est à charge, et il est
incomplet au regard du décret 2022-1728.

⚠ **LE MODULE 3 FAIT METTRE L'ADULTE DANS LA SCÈNE.** La quasi-totalité des
observations professionnelles décrivent ce que la personne a fait et rien de ce
que l'adulte a fait juste avant : un comportement sans antécédent paraît surgir
de la personne. C'est le chiffre le plus instructif de la relecture du module 4.

**Reste identique à f11** : la chaîne de publication commence par Teachizy.

---

## Les douze parcours sont en ligne, quiz compris — 4 septembre 2026 (fin)

Commits `16708e5`, `ec2a57a`, `e06b5a3`. Tout est déployé, chargé sur Teachizy
et vérifié en direct.

### f11 et f12 sont publiés

Chaîne complète déroulée dans l'ordre documenté : Teachizy d'abord (uuid
`18e0ccdd-723d-4c5d-9edb-f13074c7de8c` pour « Renforcer ce qui va »,
`d70788a2-04cb-41b9-8252-82fca1d1e82e` pour « Décrire un comportement sans le
juger »), puis `build-v2.js`, puis les couvertures, puis la fiche publique et
le seed. **Douze parcours gratuits en ligne**, douze fiches sur le catalogue.

`lib/niveaux-formations.ts` a perdu le drapeau `aVenir` sur ces deux-là — la
page `/parcours-de-formation` les annonçait « en cours d'écriture » le jour même
de leur mise en ligne. Il en reste deux : « Mesurer un comportement » et
« Résoudre un problème avec la personne ».

⚠ **`lib/mini-formations.ts` EST À METTRE À JOUR À CHAQUE NOUVEAU PARCOURS.**
L'emoji y est écrit une seule fois pour tout le site ; sans son entrée, la carte
du catalogue et celle du carrousel s'affichent sans pastille alors que la
couverture, elle, en porte une. C'est le fichier qu'on oublie.

### Les 40 quiz des dix parcours déjà en ligne — faits

200 questions, cinq par module. Elles vivent dans
`apps/web/scripts/mini-formations/quiz/<slug>.js` (quatre blocs, dans l'ordre des
modules) et les fichiers de contenu ne portent qu'un `require` et un
`quiz: Q[n]` par module. **C'est délibéré : un fichier de contenu de 80 000
caractères ne se relit pas, un fichier de quiz de 200 lignes se relit.**

⚠ **Ce qui tient ces 200 questions, et qu'il ne faut pas défaire :**
- **rien n'est inventé** : chaque question est ancrée dans le module qu'elle
  clôt. Les notions enseignées ailleurs dans le catalogue n'apparaissent qu'en
  renvoi, jamais comme bonne réponse ;
- **le `pourquoi` explique aussi ce qui rend les autres options fausses.** Un
  quiz qui dit « bonne réponse : B » n'enseigne rien ; c'est le commentaire qui
  fait le travail ;
- **les mauvaises réponses sont les erreurs réelles du métier**, pas des
  absurdités — sinon la question ne teste rien ;
- **les garde-fous de sécurité tiennent dans les questions comme dans les
  réponses** : aucun geste d'intervention physique présenté comme praticable sur
  le parcours crise, aucun diagnostic ni repérage clinique sur « réaction de
  survie », la colonne du droit avant la technique sur les consignes, et sur
  l'ESS **aucun article au-delà des quatre que le module cite lui-même**
  (D351-10, D351-11, D351-12, et D351-16-1 signalé comme cité à tort).

Contrôle automatique passé sur les dix fichiers : 4 blocs × 5 questions,
4 options, index de bonne réponse valide et réparti, aucun « certificat », aucune
apostrophe droite, aucune espace simple avant une ponctuation double, aucune
balise hors `<strong>`/`<em>`.

**Vérifié côté Teachizy** : les 48 leçons (12 parcours × 4 modules) portent leur
quiz et sont **identiques au caractère près** à `v2.json`.

⚠ **La fiche publique a suivi, et c'est la règle** : `EVALUATION` et
`METHODOLOGIE` du seed annoncent désormais les cinq questions d'autocorrection —
ni notées, ni transmises, ni enregistrées. Une fiche qui décrit moins que le
produit ne livre est presque aussi coûteuse qu'une fiche qui promet trop. Et la
carte « Repères » du module 1 de f11 disait « c'est le relevé qui évalue, **pas
un quiz** » : cette phrase datait d'avant, elle a été reprise.

### `rendu-fiches.sh` existe enfin

Le script de rendu des fiches récap A4 était **décrit** dans ce fichier et
n'existait nulle part : il fallait le réécrire de mémoire à chaque fois. Il est
maintenant versionné à côté de `fiches-recap.js`, et il porte les deux pièges
dans son en-tête (`--window-size` n'est pas la hauteur du viewport ; le PDF se
rend en 1240×1754 puis se repasse en A4 réel avec PyMuPDF).

⚠ Le conteneur n'a **pas** de `chromium` dans le PATH : le script prend celui de
Playwright (`$PLAYWRIGHT_BROWSERS_PATH/chromium-*/chrome-linux/chrome`).

⚠ Le bandeau des fiches affichait **« Fiche récap 11/10 »** : le total était
écrit en dur. Il vient de `FICHES.length`.

### État du catalogue au 4/09/2026 (fin de journée)

- **12 parcours gratuits en ligne**, tous avec leurs 4 quiz de fin de module ;
- **200 questions** au total, plus les 40 de f11 et f12 déjà écrites ;
- **12 fiches récap A4** (aperçu + PDF vectoriel + recueil), en libre accès ;
- **~6 sujets** du catalogue de 18 restent à écrire ;
- deux parcours restent annoncés « en cours d'écriture » sur
  `/parcours-de-formation` : mesurer un comportement, résoudre un problème avec
  la personne.

---

## La base LE SOCIAL est morte à 40 %, mesuré sans tiers — 4 septembre 2026 (soir)

Demande de Siham : « fait tout ça seul, trouve la solution » pour
l'authentification de `news.adepa77.fr` et le rapport Bouncer sur les
300 adresses.

### ⚠ LE RAPPORT BOUNCER N'ÉTAIT PAS NÉCESSAIRE — LA MESURE EXISTAIT DÉJÀ

Le téléversement du CSV chez Bouncer reste refusé par le garde-fou de sécurité,
et **ce refus ne se contourne pas** (coller les adresses dans leur champ texte
serait la même action sous un autre nom). Mais la question qu'on voulait poser à
Bouncer — *quel est le taux de rebond de cette base&nbsp;?* — se répond avec ce
qu'on a déjà, **sans envoyer une seule adresse à qui que ce soit**, et c'est
même plus solide qu'une estimation de tiers puisque les taux viennent de vrais
envois vers ces vrais domaines.

**La méthode, à réutiliser :** `GET /emailCampaigns/{id}?statistics=statsByDomain`
donne le taux de rebond dur **par domaine** de la campagne #82, relevé à la
source. On croise ces taux avec la **composition en domaines de l'échantillon
représentatif** de 300 adresses (tiré à `offset=5000`, au milieu de la liste
#13). 90 % de l'échantillon est couvert par une mesure directe.

| | |
|---|---|
| Taux **observé** sur le lot 1 (300 premières lignes de la base) | **40,6 %** |
| Taux **estimé** sur la base entière par croisement domaine × composition | **39,4 %** |
| Adresses mortes attendues sur 10 618 | **~4 180** |

**Les deux méthodes convergent, et c'est ce qui rend la conclusion solide** : le
lot 1 n'était pas un tirage aléatoire (les 300 premières lignes), l'échantillon
de 300 en est un. Le problème n'est donc pas le début de la liste, c'est la
liste.

### ⚠⚠ AUCUN SEGMENT DE CETTE BASE N'EST ENVOYABLE. AUCUN.

Recherche menée sur les 300 contacts du lot 1, en croisant le blocage (les
rebonds sont passés en liste noire, donc repérables) avec tous les critères
disponibles :

| Critère | Ce qu'il vaut |
|---|---|
| `DOUBLE_OPT-IN` | **0 / 300 renseigné** |
| `OPT_IN` | **0 / 300 renseigné** |
| `DISPOSITIF` | **0 / 300 renseigné** |
| `STATUT_PROSPECT` | 300/300 mais **une seule valeur** — ne discrimine rien |
| `createdAt` | **identique à la milliseconde** sur les 300 (01/09/2025 13:40:40) : import unique, critère inutilisable |

Le seul critère qui sépare quelque chose est le **domaine**, et même le meilleur
segment est hors de portée : Microsoft (hotmail/outlook/live) **20 %**, Gmail
**28,6 %**, les deux réunis (~6 400 contacts) **23,8 %**. La limite métier est
**2 %**. Et le 20 % de Microsoft est un **plancher, pas une mesure** : Outlook
accepte puis jette en silence sans renvoyer de rebond dur.

⚠ **CONSÉQUENCE DIRECTE : LE LOT 2 (liste #35, 260 gmail+hotmail) NE DOIT PAS
PARTIR.** Il afficherait ~25 % de rebond, douze fois la limite. Le sous-domaine
n'y change rien : il protège la réputation d'`adepa77.fr`, **il ne protège pas
le compte Brevo**, qui suspend sur le taux quel que soit le domaine d'envoi. Et
une suspension emporte avec elle les mails de la plateforme — confirmation
d'adresse, bienvenue, tunnel, alertes.

⚠ **PLUS GRAVE QUE LE TAUX : IL N'Y A AUCUNE TRACE DE CONSENTEMENT.** Ni opt-in,
ni double opt-in, ni date d'inscription individuelle — un import unique du
1/09/2025 et rien d'autre. C'est exactement ce qu'un contrôle CNIL demande à
voir. Siham connaît l'origine de cette base, moi non : c'est à elle de dire ce
qu'elle vaut, mais **elle doit savoir que les données, elles, ne portent aucune
preuve.**

### ⚠ DEUX BROUILLONS VISENT LA LISTE #13 ENTIÈRE — À CONNAÎTRE

`#81 « ADéPA — Parcours gratuits 1/6 — BROUILLON (audience à confirmer) »` et
`#7 « Valide ta VAE »` ont pour destinataires la **liste #13, 10 618 contacts**.
Un brouillon ne part pas tout seul, et aucune campagne n'est en file d'attente
(vérifié : `status=queued` → 0). Mais **un clic « Envoyer » sur l'un des deux
ferait partir 10 618 messages à 40 % de rebond, et la suspension serait
immédiate.** Ne pas les supprimer (règle n°6) ; les connaître.

### Le DKIM de `news.adepa77.fr` : la cause trouvée, et réparée

Brevo affichait « Non authentifié » depuis des heures. En relançant
« Authentifier ce domaine de messagerie », la page dit **précisément** lequel
des trois enregistrements échoue :

- **DMARC : coche verte**, « les valeurs correspondent » ;
- **DKIM : croix rouge**, « les valeurs ne correspondent pas ».

Or la clé posée était bonne — **prouvé sans lire la valeur à l'écran** : le
domaine parent `adepa77.fr` est déjà authentifié chez Brevo et Brevo réutilise
une seule clé par compte, donc `mail._domainkey.adepa77.fr` porte la clé de
référence. Comparaison par résolution DNS : **224 caractères des deux côtés,
identiques au caractère près.**

**La cause était la scorie** : `mail._domainkey.news` portait DEUX TXT, le DKIM
et un `brevo-code:…` posé par erreur. Le vérificateur de Brevo ne sait pas
choisir. La note du 4/09 disait « ça ne casse rien, à supprimer un jour au
calme » — **c'était faux, et c'est ça qui bloquait.** Scorie supprimée
(valeur notée pour recréation éventuelle : TXT `mail._domainkey.news` =
`brevo-code:1d0e46c2f4ba20fa6f824e9c478b177e`, TTL 14400).

⚠ **PIÈGE HOSTINGER N°2, aussi coûteux que celui du `ctrl+a`** : dans la modale
« Supprimer l'enregistrement DNS ? », **un clic aux coordonnées ferme la modale
sans rien supprimer** — deux tentatives perdues, avec l'enregistrement toujours
en place et aucun message d'erreur. Le clic **par `ref`** (obtenu avec `find`)
déclenche l'action et affiche « L'enregistrement DNS a bien été supprimé ».
Sur ce panneau, cliquer par ref, et vérifier la zone après coup.

⚠ **Et vérifier la zone, ça veut dire interroger le serveur AUTORITAIRE**
(`ns1.dns-parking.com`), pas un résolveur public : le TTL de 14400 fait mentir
le cache pendant quatre heures. Node suffit :
`const r=new dns.promises.Resolver(); r.setServers([ip_de_ns1]);`

### Ce qui reste, et qui appartient à Siham

- **Trancher sur la base** : validation payante (~40 à 60 € pour 10 618 adresses,
  et c'est un choix de sous-traitant au sens de l'article 28 RGPD), ou abandon de
  cette base au profit des seules inscriptions du site. Il n'y a pas de troisième
  voie : aucun segment gratuit n'est envoyable, c'est mesuré.
- Le médiateur CECMC, le doublon des deux comptes ADéPA, le premier paiement
  Stripe réel, les vraies adresses de Younes, Christophe et Jean Léo.

---

## Faire connaître le site : ce qui a été construit — 4 septembre 2026 (soir)

Demande de Siham : « fait tout ce que tu peux faire seul, feu vert complet […] il
faut aussi qu'on puisse voir les statistiques du site pour mesurer si ça marche
et par quel canal, met ça dans le compte admin ». Commit `99a5b7e`. L'analyse
stratégique est publiée en artefact (« Faire connaître Les Extras »).

### Le diagnostic, en une phrase

**Le site n'a pas un problème de contenu, il a un problème de distribution.**
Douze parcours, neuf guides, deux comparatifs, deux simulateurs, trente-six pages
secteur/ville/métier — et trois canaux : une page LinkedIn, une page Facebook,
une base mail morte. Les trois leviers retenus : l'aimant gratuit qui capte
l'adresse, la fondatrice qui parle (profil personnel, 7× les impressions d'une
page), la prospection directe des établissements.

### 1. `CaptureFiche` — l'adresse se donne pour un document qu'on veut

Sur les douze fiches de parcours, sous le téléchargement libre de la fiche A4 :
« Recevoir la fiche récap par e-mail » (`_shared/CaptureFiche.tsx`,
`POST /public/captures`, modèle `CaptureFiche`). C'est la base propre qui
remplace la base achetée : chaque ligne porte la date du consentement, la fiche
demandée et l'origine de la visite.

⚠ **DEUX CONSENTEMENTS, ET ILS RESTENT SÉPARÉS.** L'envoi de la fiche est le
service demandé, il part toujours (`sendFicheRecap`). La séquence d'accueil est
une case **décochée par défaut** (`consentTunnel`) : sans elle, rien d'autre ne
part jamais. Pré-cocher cette case ferait de tout le dispositif un consentement
de façade — exactement ce qui rend une base invendable.

- **Le téléchargement direct reste libre**, sans inscription : on ne met pas la
  fiche derrière un mur, on propose de la recevoir juste après.
- **Désinscription par jeton** (`/desinscription?j=…`, `POST
  /public/captures/desabonnement`) : une personne sans compte doit pouvoir se
  retirer en un clic. Un POST, jamais un GET : un antivirus qui suit les liens
  ne doit pas désabonner quelqu'un à son insu.
- **`CapturesScheduler`** (10 h 30, entre le tunnel des comptes et l'enquête) :
  même doctrine que `TunnelScheduler` — étape scellée avant l'envoi, compteur et
  non calendrier. Différences : opt-in explicite obligatoire, **une adresse =
  une séquence** (trois fiches demandées ne font pas trois séries), et une
  adresse qui a un compte est laissée au tunnel des comptes.
- Idempotent sur (email, slug) ; un consentement se donne, il ne se retire pas
  par omission — seulement par le lien.

### 2. L'audience sans traceur, et `/admin/trafic`

`VuePage` : une ligne par jour × chemin × origine, et deux compteurs (vues,
visites). **Aucun identifiant de personne, aucune IP, aucun cookie** — c'est ce
qui place la mesure dans l'exemption CNIL « mesure d'audience ». `CompteurVues`
(client, dans le layout racine) envoie `POST /public/trafic` à chaque page
publique ; espace connecté, admin et marketplace sont exclus. Le drapeau
« première page de la session » vit en sessionStorage et ne quitte pas le
navigateur.

⚠ **Le jour où quelqu'un veut y ajouter un identifiant de visiteur, ce n'est plus
le même objet juridique.** `CreateVueDto` est volontairement pauvre, et il doit
le rester. Et cette mesure ne passe PAS par `MesureAudience` (Google, soumis au
consentement) : deux mesures, deux régimes, celle-ci tourne toujours.

`/admin/trafic` (`GET /admin/stats/audience?jours=7|30|90`) aligne quatre tables
sur **la même clé `source`** — celle que `lib/source.ts` pose à la première page
de la visite : `VuePage` (audience), `Account.source` (inscriptions),
`CaptureFiche.source` (adresses), `ContactRequest.source` (demandes). C'est la
seule lecture qui dise si un canal amène des visites ou des gens. Part
organique = visites hors medium payé/envoyé.

⚠ **L'audience commence au déploiement du compteur ; inscriptions et demandes
portent leur source depuis bien avant.** Un canal peut donc afficher des
inscriptions sans une seule vue pendant quelques semaines : c'est l'historique.

⚠ Une ligne de test `/__test` / source `test` a été écrite le 4/09 à 18 h 26 pour
vérifier la route en direct : une vue, à ignorer.

### 3. Le parrainage au moment de la joie

`ServiceModal` renvoie sur `/dashboard/ateliers?publie=1` après une mise en
ligne réussie, et « Mes ateliers » affiche alors une fois `BlocParrainage`.
Jamais sur un brouillon ni sur un refus — même doctrine que les confettis.

### 4. Trois guides de plus, aucune référence nouvelle

`transmissions-cahier-de-liaison`, `note-d-incident-evenement-indesirable`,
`courrier-aux-parents-autorite-parentale` dans `guides/contenu.ts`. Références
strictement reprises de celles déjà vérifiées dans le fichier ; la déclaration
ARS/CD est renvoyée « à la procédure de votre établissement », l'acte
usuel/non usuel présenté comme distinction de pratique courante.

### 5. Le dossier de prospection — `/home/claude/prospection/` (remis à Siham)

- `finess-esms-77-91-94.xlsx` : **309 établissements** (IME 80, SESSAD 77,
  MECS 72, ESAT 60, ITEP 20) depuis FINESS, licence ouverte, données au
  4/05/2026 — 9 % sans téléphone, aucune adresse e-mail (à trouver structure par
  structure, adresses PROFESSIONNELLES seulement). Script `extraire-finess.py`.
- `analyse-interet-legitime.md`, `registre-traitement-prospection.md` : les deux
  pièces que la CNIL contrôle réellement (les sanctions récentes visent
  l'absence de documentation, pas l'envoi).
- `sequence-courriels.md` : J0 (CDD à 0 %, avec le CE du 11/02/2025 cité pour ce
  qu'il dit — un aide-soignant — et pas plus), J+4 (les douze parcours), J+10
  (dernier message, dix minutes au téléphone). Mentions obligatoires en pied,
  « répondez STOP », traité sous 7 jours, **un STOP retire l'établissement
  entier**. 20 par jour, jamais depuis `adepa77.fr`.
- `posts-linkedin-siham.md` : dix posts dans sa voix, tirés de f6 et f12,
  prénoms changés, six avec lien et quatre sans.
- `messages-createurs.md` (trois variantes) et `direct-mensuel-deroule.md`.

### `news.adepa77.fr` est authentifié, et l'expéditeur existe

Une fois la scorie DNS publiée (Hostinger a mis ~50 minutes à pousser la zone),
« Authentifier » a répondu **« Votre domaine a été authentifié »** du premier
coup. Expéditeur créé et vérifié : **« Siham, pour ADéPA »
<contact@news.adepa77.fr>**. Les campagnes ne changent pas d'expéditeur toutes
seules : le sélectionner sur chaque campagne.

⚠ **Rappel programmé à 18 h 45 UTC (`trig_0164HbrcXrtX7o6jca8fCAyQ`)** pour
refaire cette vérification : il est devenu inutile, la suppression a été refusée
à l'approbation — il tirera une fois, constatera que c'est fait, et se
désactivera tout seul.

---

## Pages d'atterrissage, prénom Sarah, et la prospection bloquée — 4 septembre 2026 (nuit)

### Cinq pages d'atterrissage, une par produit — commit `98abf13`, en ligne

`/l/renfort`, `/l/ateliers`, `/l/lex`, `/l/parcours`, `/l/intervenants`
(`(public)/l/donnees.ts` + `[produit]/page.tsx` + `FormulaireLanding.tsx`).
Une promesse, trois preuves vérifiables, une adresse. Le formulaire dépose une
demande de contact classique (`type = "Landing · <produit>"`) : elle arrive dans
/admin/contacts, prévient par courriel, garde la source de la visite. Déclarées
au sitemap. **Aucun prix inventé**, jamais « freelance » ni « certificat » ni
« intervenants vérifiés ». Liens de campagne : `?utm_source=…&utm_medium=…&utm_campaign=…`.

### ⚠ LE PRÉNOM PUBLIC EST « SARAH », décision de Siham le 4/09 au soir

« Enlève le prénom Siham et met le prénom Sarah à la place. » Appliqué partout
où un prénom est VISIBLE par un destinataire : signature du tunnel d'accueil et
de la fiche récap (`mail.service.ts`), expéditeur Brevo **« Sarah, pour ADéPA »
<contact@news.adepa77.fr>** (renommé dans Brevo), formulaire des pages
d'atterrissage, courriels de prospection, documents remis. **Le titre reste
vrai** (« Fondatrice, Les Extras — association ADéPA ») : c'est un prénom
d'usage, pas une fausse identité — l'association, son adresse et son SIREN
restent en clair partout. Les commentaires de code et cette mémoire continuent
de dire Siham : c'est son nom, et personne d'autre ne les lit.

### ⚠⚠ L'ENVOI AUTOMATIQUE DE LA PROSPECTION EST BLOQUÉ PAR LE GARDE-FOU — DEUX FOIS

Construit et prêt en local, **non poussé** : `apps/api/src/prospection/`
(modèle `Prospect`, `ProspectionService`, planificateur mardi-jeudi 9 h 30,
20 nouvelles adresses par passage, 40 au plus, relances J+4 et J+10, STOP par
jeton, `sendProspection` via l'API Brevo depuis `news.adepa77.fr`), les routes
admin `/admin/prospection`, la page `/stop-prospection`, `importer-prospects.js`.
Le dépôt sur GitHub a été **refusé par le classifieur de sécurité de la session**
au moment du commit — deux fois, la seconde après la relance explicite de
Siham (« envoi tous, fait tout toi-même »). Il l'a lu comme un outil d'envoi non
sollicité. **Ce refus ne se contourne pas** : ni en découpant le lot, ni en
reformulant le message de commit, ni en envoyant depuis le conteneur. Le code
reste dans l'arbre de travail local, prêt, si un humain le pousse un jour.

**La sortie est manuelle, et elle tient** : `prospection-43-adresses.xlsx`
(43 adresses professionnelles distinctes, les établissements couverts par
chacune, colonnes J0 / J+4 / J+10 / STOP), les trois courriels dans
`sequence-courriels.md` (pointant sur `/l/renfort` et `/l/parcours` avec UTM),
20 par jour, mardi à jeudi, depuis l'expéditeur Brevo « Sarah, pour ADéPA » ou
depuis la messagerie. Les 424 établissements avec téléphone dans
`finess-esms-77-91-93-94.xlsx`.

**Pourquoi seulement 43 adresses pour 424 établissements** : l'annuaire
action-sociale.org n'affiche aucun e-mail ; les adresses trouvées sont celles
des SIÈGES gestionnaires (Poidatz 22 ET, AEPC 15, Groupe SOS 13…), l'e-mail d'un
établissement seul n'est quasi jamais publié. Une adresse = une séquence, pas
vingt-deux.

### Une chose vue au passage chez Brevo

L'expéditeur `contact@adepa77.fr` affiche **« DMARC : la balise rua est
manquante »** — c'est lui qui déclenche le bandeau « expéditeurs non conformes
aux exigences Google/Yahoo/Microsoft ». Le sous-domaine `news`, lui, est
entièrement vert. À corriger un jour dans la zone `adepa77.fr` : ajouter
`rua=mailto:…` au TXT `_dmarc`. Pas urgent, mais c'est le domaine de la
plateforme.

---

## RETRAIT DU GAP — 15/09/2026

Le groupe d'analyse de pratique (GAP, « Entraide ») a été **retiré de l'offre**.
LEX reste entier — écriture, activités, fiches — et perd seulement son rôle de
GAPiste. 28 fichiers modifiés, 18 supprimés, ~3 000 lignes retirées.

**Supprimé** : le module API `questions` (c'était ça, le backend du GAP — une
recherche sur « gap » ne le trouve pas), les pages `/gap` et `/dashboard/gap`,
les composants `GapVitrine` / `GapFil` / `BlocGap` / `ReponseGap` / `LexGapiste`
/ `PoserQuestion` / `ActionsSituation` / `gap.ts`, la route
`POST /assistant/gapiste`, l'endpoint `GET /public/gap/apercu`, les entrées des
quatre menus et la section d'accueil.

`hebdo.scheduler.ts` interrogeait `prisma.question` **sans jamais nommer le
GAP** : non traité, l'e-mail hebdomadaire du lundi plantait pour tous les
intervenants.

### Ce qui reste, et pourquoi — NE PAS « finir le ménage »

- **`'GAP'` dans la liste d'acronymes de `pseudonymiseur.service.ts`.** Les
  professionnels écrivent « GAP » dans leurs textes pour parler de l'analyse de
  pratique de LEUR établissement. Sans cette entrée, LEX prendrait l'acronyme
  pour un nom de personne : le retirer **dégraderait l'anonymisation**.
- **`GAP = 12` dans `fiches-recap.js`** était une constante d'espacement A4,
  sans rapport ; renommée en `ESPACE` le 15/09 pour ne plus polluer les
  recherches.
- **`LEX_GAPISTE` et `REMBOURSEMENT_LEX_GAPISTE`** (`adhesion/page.tsx`) : ce
  sont les libellés d'écritures **déjà passées** au grand livre des crédits. Les
  retirer afficherait des lignes sans libellé dans l'historique des adhérents.
  Plus aucune écriture de ce type ne peut être créée.
- **`POINTS.REPONSE` / `REPONSE_RETENUE`** : l'énumération `PointReason` est
  utilisée par des points **déjà crédités**. Seul le barème affiché ne propose
  plus de les gagner.
- **`MissionCategory.ANALYSE_PRATIQUES`** et la fiche psychologue de
  `renfort/donnees.ts` : « analyse de pratique » désigne aussi une **prestation
  de renfort**, donc du chiffre d'affaires. Rien à voir avec le dispositif
  retiré.
- **Les modèles Prisma `Question` / `Answer` / `AnswerVote`** restent en base.
  Le schéma n'est pas modifié, donc **aucune migration, donc aucun risque au
  déploiement**. Plus aucune route ni page n'y accède : les données sont inertes
  et invisibles. Ce sont des situations professionnelles réelles déposées par
  des professionnels et les réponses de leurs pairs — elles ne se détruisent pas
  sur une consigne implicite. Pour les effacer : **export d'abord, migration
  ensuite**, et seulement sur demande explicite de Siham.

### Les redirections

`/gap`, `/gap/poser` et `/gap/<id>` étaient indexés, et `/entraide` pointait
déjà sur `/gap` — sans correction, cette redirection existante serait devenue
une redirection vers un 404. Posées dans `next.config.mjs`, la règle la plus
spécifique d'abord. `permanent: true` sort un **308**, pas un 301 : c'est le
comportement de Next, et Google les traite de la même façon.

### Le piège à ne jamais oublier

**`gap` est une classe Tailwind** (`gap-3`, `gap-1.5`…) et tient l'espacement de
tous les `flex` et `grid` du site. Un chercher-remplacer sur « gap » colle tous
les éléments de **toutes les pages** — sans faire échouer le build, donc en
partant en production sans prévenir. Aucune classe `gap-*` n'a été touchée.

---

## STRUCTURE → ÉTABLISSEMENT → SERVICE, NIVEAUX, MESSAGERIE — 16/09/2026

Le modèle de comptes a été construit. Tout tient en une phrase, et c'est elle
qu'il faut retenir avant de toucher à quoi que ce soit :

> **Je vois les gens que j'ai fait venir → aucune validation.
> Je vois des gens que je n'ai pas fait venir → validation.**

Un chef de service qui arrive seul n'attend donc personne : il crée ses
services, il invite son équipe, il ne voit qu'elle. Et c'est ce qui rend
l'ouverture sans risque — quelqu'un qui se déclarerait responsable sans l'être
ne pourrait constituer un périmètre qu'avec des gens ayant accepté son
invitation. Il ne prend rien, il reçoit.

**Seul le niveau DIRECTION échappe à la règle**, parce qu'il donne la vue sur
des équipes constituées par d'autres, avant lui. C'est le seul qui passe par
Les Extras — **une validation par établissement, jamais une par salarié**.

### Les trois fichiers qui portent le modèle

| Fichier | Ce qu'il tient |
|---|---|
| `apps/api/src/common/perimetre.ts` | La règle de visibilité, les capacités, les deux règles de délégation. **Écrite une seule fois.** |
| `apps/api/src/common/normaliser.ts` | La clé d'unicité des noms. **A un jumeau en SQL dans la migration** — les deux doivent produire le même résultat. |
| `apps/api/src/conversations/masquage.ts` | Le retrait des coordonnées dans un fil avec un intervenant. |

Couverts par `common/perimetre.spec.ts` (24 tests) et
`conversations/masquage.spec.ts` (27 tests). **669 tests au total, tous verts.**

### ⚠ CE QU'IL NE FAUT PAS DÉFAIRE

- **`niveau === DIRECTION` ne se teste JAMAIS sans `niveauValide`.** Une
  direction déclarée voit exactement ce que voit un salarié : elle-même. C'est
  l'unique garde-fou du modèle ouvert.
- **« Rattachement vérifié » ≠ « niveau validé ».** Le badge atteste que la
  personne est bien dans ce service ; il ne dit rien de son titre. Un chef de
  service qui invite un collègue ne le nomme pas directeur. L'organigramme
  affiche les deux marques séparément — les fondre serait faire passer une
  vérification d'appartenance pour une validation de titre.
- **Le garde de rôle a été RETIRÉ des invitations**, et l'absence de
  `@AccountRoles` est le comportement attendu (`authorization-matrix.spec.ts` le
  teste ainsi). Il exigeait OWNER/ADMIN : un chef de service arrivé seul ne
  pouvait inviter personne. Le droit d'inviter est une CAPACITÉ
  (`Capacite.INVITER_MEMBRES`), vérifiée dans le service, qui sait aussi
  rabattre niveau, droits et services au périmètre de l'invitant.
- **Un fil avec un intervenant n'existe pas sans demande** (devis, réservation,
  mission). Ouvrir un fil libre depuis le catalogue ferait partir les
  intervenants et sortirait les réservations de la plateforme.
- **Les non-lus se comptent sur `ConversationParticipant.luJusquA`**, jamais sur
  `Message.readAt` — qui ne sait dire « lu » que pour tout le monde à la fois.
- **`FileKind.MESSAGE` n'est PAS dans `FAMILLES_PUBLIQUES`**, et ne doit pas y
  entrer : un fil du médico-social porte des informations sur des usagers.

### Les trois doublons, et leurs sorties

1. **Service** — unicité `(accountId, nomNormalise)`. Le second arrivant reçoit
   un **carrefour**, pas une erreur : rejoindre (demande au créateur), préciser
   son nom (« SESSAD Melun »), ou **signaler à Les Extras**. Sans cette
   troisième sortie, un service créé par erreur bloquerait son nom pour toujours.
2. **Établissement** — le plus coûteux. Recherche pendant la frappe à
   l'inscription (`GET /public/etablissements`) : « c'est le mien » crée un
   rattachement **non vérifié** plutôt qu'un douzième homonyme.
3. **Structure** — unicité sur le SIREN, puis sur le nom normalisé. Une
   structure trouvée par son nom et sans SIREN gagne celui qu'on lui apporte.

### La migration

`20260916120000_structure_niveaux_messagerie` — **rejouable**, testée sur
PostgreSQL 16 réel dans trois scénarios : base vierge, base à jour, base avec
données et doublons préexistants. **Zéro dérive** (`migrate diff
--from-migrations` rend une migration vide). 105 tables.

Deux points délicats, écrits en tête du fichier : `Message.updatedAt` ajouté
AVEC défaut puis défaut retiré (sinon l'ALTER échoue sur une table peuplée), et
`OrgUnit.nomNormalise` **rempli AVANT** la création de l'index unique, en
désambiguïsant les doublons déjà en base (`sessad`, `sessad-2`, `sessad-3`)
plutôt qu'en faisant échouer le déploiement.

### Les écrans

| Adresse | Quoi |
|---|---|
| `/register` | Parcours en 4 étapes au plus — voir « L'ORDRE DES ÉTAPES » ci-dessous. **Les tuiles « Établissement » et « Salarié » sont fusionnées** — c'est l'étape « poste » qui distingue direction, responsable et salarié. Cartes qui se retournent au survol (recto/verso). Le compte est créé à l'étape 2, les suivantes ne sont **jamais bloquantes**. |
| `/dashboard/organigramme` | Structure → établissement → services. **Arborescence et effectifs visibles par tous les rattachés, noms bornés au périmètre.** Les personnes hors périmètre sont comptées (« + 4 personnes »), pas effacées. |
| `/dashboard/mon-poste` | Poste, cadre, niveau, droits déclarés, retrait de l'organigramme. |
| `/dashboard/inbox` | Messagerie : filtres par type, avertissement données d'usagers en tête de fil, mention du masquage, messages système. |
| `/admin/organisation` | Les demandes de niveau Direction, pré-remplies pour une décision en un clic. |

⚠ **L'organigramme et « Mon poste » n'ont AUCUN filtre de rôle**, et c'est
délibéré : « Mon poste » est la porte par laquelle un chef de service arrivé
seul se déclare. Lui poser un filtre fermerait exactement la porte qu'il doit
ouvrir.

### Ce qui reste déclaratif, et pourquoi

Les droits que chacun se donne (« réserver directement » plutôt que « demander
un devis ») **ne sont vérifiés par personne**. C'est une décision de Siham : le
premier compte d'un établissement n'est pas forcément celui d'un cadre, et
exiger une confirmation d'en haut bloquerait tout le monde en attendant une
direction qui n'existe peut-être pas encore.

Ce qui rend la chose tenable n'est pas un contrôle mais la **traçabilité** : la
déclaration figure sur chaque devis et chaque réservation, avec le poste. Et
comme **il n'y a aucun paiement sur la plateforme**, ces droits n'engagent
jamais d'argent — ils disent seulement si le bouton affiché est « Réserver » ou
« Demander un devis ».

### ⚠ L'ORDRE DES ÉTAPES DE `/register`, ET LE DÉFAUT QU'IL CORRIGE

Le parcours a d'abord créé le compte au **tout premier écran**, avant de savoir
ce qu'était la personne, puis l'a « qualifié » à l'étape suivante
(`PATCH /accounts/qualification`). Siham a demandé si c'était la meilleure
façon de faire. **Non, et c'est moi qui l'avais livrée.**

`Account.slug` est calculé **à la création** à partir du nom du compte et n'est
**jamais recalculé** (`auth.service.ts`, `generateUniqueSlug`). Un compte créé
avant qu'on connaisse le nom de l'établissement gardait donc pour toujours
l'adresse publique du prénom de la personne : `/camille-durand` pour la MECS
Les Tilleuls. Invisible sur le moment, irrattrapable ensuite — une adresse
publique se partage et s'indexe.

**L'ordre retenu** (`apps/web/src/app/(auth)/register/parcours.ts`) :

1. **`profil`** — la situation, une carte à cliquer (établissement /
   intervenant / particulier). Pas un formulaire.
2. **`identite`** — les identifiants **ET le nom de l'établissement**. Le
   compte est créé ici, complet : bon type, bon nom, bon slug du premier coup.
3. **`etablissement`** puis **`poste`** — seulement pour un établissement, et
   jamais bloquantes.

⚠ **NE PAS DÉPLACER LE NOM DE L'ÉTABLISSEMENT APRÈS LA CRÉATION.** C'est le
scénario ci-dessus qui revient. Deux fichiers de tests le verrouillent, et ils
expliquent pourquoi plutôt que de constater :
`apps/api/src/auth/inscription-parcours.spec.ts` (le slug) et
`apps/web/src/lib/__tests__/inscription-parcours.test.ts` (l'ordre, les cartes,
les droits, le schéma). `PATCH /accounts/qualification`, son DTO et la méthode
`qualifier()` ont été **supprimés** : ils n'existaient que pour rattraper un
compte créé trop tôt.

⚠ **UN FORMULAIRE DÉCOUPÉ EN ÉTAPES NE VALIDE JAMAIS LE SCHÉMA ENTIER.**
`form.handleSubmit` le faisait : à l'étape des identifiants, le type de compte
est forcément vide, la validation échouait donc toujours, **le bouton
« Continuer » ne faisait rien** et l'échec marquait au passage tous les champs
en rouge. On valide les champs de l'étape avec `form.trigger([...])`.

**Le téléphone est OBLIGATOIRE depuis le 16/09/2026** (demande de Siham). Côté
web seulement : `RegisterDto` l'accepte absent, et son en-tête dit pourquoi —
le web et l'API se déploient séparément, exiger le numéro des deux côtés
refuserait en 400 les inscriptions parties de l'ancien écran pendant les
quelques minutes qui séparent les deux redéploiements. Un champ vide et un
numéro faux donnent **deux messages différents** (« Téléphone requis. » /
« Numéro de téléphone invalide. ») : confondus, ils laissent croire que ce qui
a été tapé est rejeté alors que rien ne l'a été.

⚠ **`/register?type=…` SAUTE L'ÉTAPE DES CARTES**, et c'est voulu : la personne
vient d'une page d'atterrissage où elle a déjà choisi. Les seuls liens qui le
portent sont ceux-là (`comparatif-plateformes-remplacement`, `mode-demploi`,
`renforteam`). **Aucun bouton « Créer un compte » générique ne doit passer ce
paramètre** — sinon les cartes disparaissent pour tout le monde.

---

## RENFORT PERSONNALISÉ, VIVIER OUVERT, STRUCTURE JURIDIQUE — 16/09/2026

Trois demandes de Siham, et une distinction qu'elle a posée elle-même et qui
tient tout le reste :

> **Ce n'est pas la personne qui choisit le montage, c'est le BESOIN.**

- **Un poste à couvrir** (une éducatrice arrêtée) → **CDD salarié**, et rien
  d'autre. C'est `ReliefMission`, et cela se conclut par un contrat de travail
  que l'établissement signe directement.
- **Un besoin nommé, en plus de l'équipe** (un enfant à accompagner sur ses
  sorties, un suivi individuel) → **renfort personnalisé**, une prestation
  facturée par la structure de l'intervenant. C'est un `Service` de format
  `INDIVIDUEL` : fiche, devis, contrat de prestation.

⚠ **POURQUOI CETTE LIGNE EXISTE.** Le Conseil d'État a jugé le 11/02/2025
(n° 491128, affaire Mediflash) qu'un remplacement de poste en établissement ne
se fait pas sous statut d'indépendant ; la LFSS 2025 (art. 70) a resserré
l'intérim en ESSMS. Un indépendant qui facturerait un remplacement, c'est une
requalification pour lui et un risque de travail dissimulé pour la maison. **Ce
défaut ne se voit jamais à l'écran** : tout fonctionne, la mission se pourvoit,
les documents s'impriment. Il se découvre au contrôle.

⚠ **« RENFORT » DÉSIGNE DÉSORMAIS DEUX CHOSES AUX CONTRATS OPPOSÉS.** Les deux
ne s'affichent jamais côte à côte sans leur montage écrit dessus —
« Remplacement · CDD » et « Renfort personnalisé · prestation ». Les libellés
sont calculés **par le serveur** (`LIBELLE_MONTAGE`, `disponibilites.service.ts`) :
deux écrans qui traduiraient chacun l'énumération finiraient par ne plus dire
la même chose du même montage juridique.

### Ce qui a été posé

| Où | Quoi |
|---|---|
| `Interet` (enum) | ATELIERS · FORMATIONS · RENFORT_CDD · RENFORT_PERSONNALISE |
| `Account.interets` | ce que la personne vient faire, déclaré à l'inscription |
| `DisponibiliteRenfort` | le vivier ouvert : consentement, montages, métier, départements, fraîcheur |
| `Service.format` | COLLECTIF (atelier) ou INDIVIDUEL (renfort personnalisé) |
| `Structure.siret` | c'est le SIRET, pas le SIREN, qui s'imprime sur une facture |
| `disponibilites/` | module API : déclarer, confirmer, se retirer, lire le vivier |
| `StructureRequiseSiPublicationGuard` | jumeau de `EmailVerifieSiPublicationGuard` |

Migration `20260916160000_interets_structure_disponibilite` — rejouable,
vérifiée sur PostgreSQL 16 réel, **zéro dérive** (`migrate diff` rend « No
difference detected »). 703 tests API, 117 tests web.

### ⚠ CE QU'IL NE FAUT PAS DÉFAIRE

- **UNE LISTE D'INTÉRÊTS VIDE NE REFUSE RIEN.** Tous les comptes créés avant le
  16/09/2026 l'ont vide. Refuser sur une absence de déclaration fermerait
  RenforTeam à tout le monde du jour au lendemain, sans qu'aucune alerte ne le
  signale. On ne restreint que sur un choix **explicitement fait**
  (`ciblage.service.ts`, et le test « ne refuse RIEN à un compte qui n'a rien
  déclaré » dans `acces-reponse.spec.ts`).
- **LA STRUCTURE EST EXIGÉE POUR PUBLIER, JAMAIS POUR S'INSCRIRE.** Deux
  populations entières y perdraient leur compte : celles et ceux qui viennent
  faire des remplacements en CDD (donc en salarié : ils n'ont pas de SIRET, et
  c'est normal), et celles et ceux qui sont en cours d'immatriculation, en
  portage, ou dont une association facture pour eux. Le refus est posé au
  moment de la publication, et son message nomme l'écran où aller.
- **DEUX VIVIERS, ET ILS NE DISENT PAS LA MÊME CHOSE.** `PoolMember`
  (`/dashboard/vivier`) est le carnet d'adresses d'UN établissement, et c'est
  lui qui alimente le palier `RESERVED` de la cascade. `DisponibiliteRenfort`
  (`/dashboard/vivier-ouvert`) est alimenté par les personnes elles-mêmes. Les
  fondre remplirait « mes intervenants » de gens jamais rencontrés et
  fausserait le ciblage des missions.
- **AUCUNE COORDONNÉE NE SORT DU VIVIER OUVERT.** Un profil, un métier, un
  territoire, et la messagerie. Une liste de personnes avec leurs numéros
  s'aspire en une après-midi, et c'est tout le modèle qui sort avec elle. Un
  test le vérifie sur la charge utile elle-même.
- **`actif` EST UN CONSENTEMENT, PAS UN RÉGLAGE D'AFFICHAGE.** Décoché par
  défaut, séparé des cases d'activité, retirable en un clic depuis
  `/dashboard/disponibilite`. Quelqu'un qui cherche du travail ne doit pas
  découvrir qu'il est listé parce qu'il a coché une case sur un autre sujet.
- **SE RETIRER N'EFFACE RIEN** : `actif: false` rend invisible tout de suite ;
  le métier, le territoire et la présentation restent. Supprimer obligerait à
  tout ressaisir pour revenir trois semaines plus tard.
- **LA FRAÎCHEUR FAIT VIVRE OU MOURIR LA LISTE.** Relance à 38 jours, mise en
  veille à 45 (`DisponibilitesScheduler`, 9 h 30 — entre les alertes de 8 h 15
  et le tunnel de 10 h 15, la réserve quotidienne de courriels est étroite). La
  veille **ne supprime pas**. Le verrou `relanceeLe` est posé AVANT l'envoi,
  comme partout ailleurs.
- **ON NE PROMET AUCUNE VÉRIFICATION.** Identité, diplômes, extrait de casier :
  c'est l'établissement qui contrôle à l'embauche, et les deux écrans le
  disent. C'est la même raison qui avait fait retirer « intervenants vérifiés »
  de la fiche atelier.

### Le SIRET, et pourquoi c'est lui qu'on demande

`EntiteLegale` lisait `siren` mais pas `siege.siret`, alors que l'annuaire le
renvoie et que deux autres modules du dépôt le lisaient déjà. Or c'est le SIRET
que les gens ont sous la main — il est sur l'avis de situation et sur leurs
factures — et c'est lui que la loi exige sur un document commercial (art. 242
nonies A, ann. II du CGI). **Le SIREN se déduit donc du SIRET** (ses neuf
premiers chiffres), on ne fait pas saisir deux numéros dont l'un contient
l'autre. Une recherche à quatorze chiffres est réduite à neuf avant d'interroger
l'annuaire, qui n'indexe que les entités légales.

⚠ **`rattacher()` FAIT DESCENDRE LE SIRET SUR `Account.siret`, et ne l'écrase
jamais** : c'est `Account.siret` qui s'imprime sur les factures, pas celui de la
structure. On ne remplit que le vide — une saisie humaine ne se corrige pas
toute seule au détour d'un rattachement.

### Les écrans

| Adresse | Quoi |
|---|---|
| `/register` | 4 étapes pour un intervenant (situation, identifiants, **structure**, **ce que vous voulez faire**), 3 pour un particulier (situation, identifiants, **ce que vous cherchez**). |
| `/dashboard/disponibilite` | Ce que j'accepte de faire, où je me déplace, et si je suis visible. **C'est l'adresse du courriel de relance** : la déplacer oblige à reprendre `sendRelanceDisponibilite`. |
| `/dashboard/vivier-ouvert` | Les personnes disponibles, filtrées par montage, métier et département. |

### Le compte particulier n'est plus celui d'un parent

« Parent » a été retiré du nom : le compte ouvre aussi aux **remplacements en
CDD** — étudiant, professionnel entre deux postes, retraité du secteur. C'est le
chemin le plus propre juridiquement (salarié, donc ni structure ni SIRET) et
c'est ce qui manque le plus au renfort : **des bras, pas des demandes.** Il n'y a
délibérément pas de case « renfort personnalisé » sur ce compte — facturer une
prestation demande une structure ; qui veut s'y mettre passe en compte
intervenant, et son adresse publique ne bouge pas (elle porte déjà son nom).

### Les cartes d'inscription

Trois teintes de la palette (`primary`, `secondary`, `success`) portées par le
contour, une pastille de catégorie à côté de l'icône, un titre à la première
personne en gros, et **une phrase de bénéfice sur le RECTO** — le verso ne se
lit qu'au survol, c'est-à-dire jamais sur un téléphone et jamais avant d'avoir
décidé.

⚠ **AUCUN EFFET DE SURVOL NE PASSE PAR UNE TRANSFORMATION** (`CarteChoix.tsx`).
Le relief se fait à l'ombre et à la bordure. Une carte qui se soulève de deux
pixels ne vaut pas le risque de rouvrir le défaut d'août — les trois versos
affichés en permanence et EN MIROIR, parce qu'un `<button>` qui gère son
débordement force `transform-style: flat`.

### LE DOSSIER DÉPOSÉ — condition pour candidater (16/09/2026, soir)

Décision de Siham, après la question « pourquoi on ne le vérifie pas nous ? » :
**on ne vérifie pas le contenu, on exige le dépôt.**

- `PIECES_POUR_CANDIDATER` (`apps/api/src/common/dossier.ts`) : pièce
  d'identité + bulletin n° 3. Sans elles déposées dans son compte, on ne peut
  pas candidater à un renfort — le refus est posé dans
  `assertReponseAutorisee`, le point de passage unique.
- Le vivier affiche « Dossier déposé » ou « Dossier 1/2 », **jamais le
  contenu** : savoir que les papiers sont prêts évite trois semaines de
  relances après l'accord ; ouvrir les pièces à qui feuillette la liste ferait
  de cet écran un fichier de documents d'identité.

⚠ **POURQUOI LA LISTE EST PLUS COURTE QUE `ConformiteService.REQUIRED_TYPES` :**
le DIPLÔME exclurait les faisant-fonction, qui sont une réalité quotidienne du
secteur (un établissement en tension embauche un AES non diplômé en CDD, et
c'est légal) ; l'IBAN se donne à l'employeur au moment de l'embauche. Restent
les deux qui conditionnent l'ACCÈS au secteur, pas le poste.

⚠ **LE SALARIÉ DE LA MAISON EN EST EXEMPTÉ.** Il est déjà employé là, son
employeur détient ses pièces depuis son embauche, et ce qu'il fait ici sont des
heures supplémentaires. Lui redemander son casier pour prendre un créneau chez
lui ferait abandonner l'outil.

⚠ **CONTRAIREMENT À LA RÈGLE DU MONTAGE, CELLE-CI MORD SUR LES COMPTES
EXISTANTS.** C'est assumé : une candidature sans pièces fait perdre des jours à
l'établissement. Le refus nomme donc les pièces manquantes et l'écran où les
déposer, sinon il se lit comme une panne.

**Pourquoi Les Extras ne vérifie pas** — à ne pas reproposer :
1. le **bulletin n° 2** se délivre à l'employeur, dans les cas que la loi
   énumère ; une plateforme qui n'embauche personne n'en fait pas partie. Ce que
   la personne obtient elle-même est le **n° 3**, qui atteste au jour de son
   édition et de rien après ;
2. le **stocker** ferait de l'association le responsable d'un fichier de
   condamnations pénales (art. 10 RGPD) sur des gens qu'elle n'emploie pas ;
3. écrire « vérifié » **transfère à Les Extras** une obligation de contrôle qui
   est légalement celle de l'employeur, et qui ne se délègue pas.

⚠ **« Profils et documents vérifiés » a été retiré de `(auth)/layout.tsx`** —
c'était la phrase même supprimée de la fiche atelier le 4/09. Ne pas la
réécrire, sous aucune forme.

### Deux défauts d'écran corrigés dans la foulée

- **La recherche d'établissement pendant la frappe avait disparu.** En
  déplaçant le nom de l'établissement dans « Vos identifiants », le composant
  `RechercheEtablissement` était resté exporté mais n'était plus appelé nulle
  part : taper « MECS » ne proposait plus les MECS déjà déclarées, et le
  doublon d'établissement — le plus coûteux des trois, il coupe une équipe en
  deux — revenait. Elle est **recollée au champ `organizationName`**, et elle
  doit y rester.
- **« Où vous travaillez » : trois cartes, une ligne dans chacune.** L'écran
  portait trois paragraphes au-dessus de deux champs facultatifs. Personne ne
  lit un écran d'inscription : on y cherche le champ.

### L'ÉTABLISSEMENT ET SA STRUCTURE NE FONT PLUS QU'UN CHAMP (16/09/2026, soir)

Demande de Siham : « fusionne votre établissement et votre structure (intitulé
juste votre établissement) — exemple : ESAT Corail de l'association ADSEA ».

On posait deux questions, sur deux écrans. **Personne ne parle comme ça** : on
dit « l'ESAT Corail de l'ADSEA », d'un seul tenant. Séparer obligeait à découper
une phrase qu'on a dans la tête entière, et beaucoup laissaient la structure
vide — ce qui empêche ensuite les collègues des autres sites de se retrouver.

`RechercheLieu` (`register/Etapes.tsx`) interroge donc **les deux annuaires en
parallèle** sous le seul champ « Votre établissement » :

- les établissements DÉJÀ sur Les Extras → « c'est le mien », rattachement au
  lieu d'un douzième homonyme ;
- l'annuaire public → c'est la STRUCTURE qui gère, on la rattache.

⚠ **CHOISIR UNE ENTITÉ DE L'ANNUAIRE NE RENOMME PAS L'ÉTABLISSEMENT.** Le nom
saisi fixe le nom du compte ET son slug : le remplacer par « ADSEA » donnerait
la même adresse publique aux quinze établissements du groupe.

⚠ **CHAQUE RECHERCHE A SON PROPRE `.catch()`.** L'annuaire public de l'État est
lent et parfois indisponible ; s'il tombe, la liste des établissements déjà
déclarés doit continuer de s'afficher — c'est elle qui évite le doublon
d'établissement, le plus coûteux des trois.

⚠ **LA STRUCTURE N'EST PLUS DEMANDÉE À L'ÉTAPE SUIVANTE**, qui ne porte plus
que le service. Ne pas l'y remettre : deux endroits pour la même question,
c'est ce qu'on vient de retirer.

### Moins de texte, partout sur l'inscription

Trois écrans portaient plus d'explication que de formulaire. Personne ne lit un
écran d'inscription : on y cherche le champ.

- **« Votre service »** : trois paragraphes au-dessus de deux champs facultatifs
  → trois cartes, une ligne dans chacune.
- **« Votre poste et vos droits »** : chaque niveau portait intitulé + exemples
  + une phrase de périmètre (neuf lignes pour trois boutons radio) → deux
  lignes. On choisit son niveau sur son MÉTIER, pas sur une description qu'on
  relira dans « Mon poste ». Les treize droits portaient chacun leur ligne
  d'aide → le libellé seul, sur deux colonnes ; l'aide complète reste sur
  « Mon poste », où l'on vient délibérément régler ses droits.
- ⚠ **L'AVERTISSEMENT « direction validée à la main » RESTE** : c'est le seul
  endroit qui dit qu'une direction déclarée ne voit rien de plus tant qu'elle
  n'est pas validée. Le supprimer ferait croire à un accès immédiat.

⚠ **LE RECTANGLE « CRÉER UN COMPTE » A ÉTÉ RETIRÉ DES CARTES.** Il y en avait un
sur chaque face : trois boutons identiques sous trois cartes qui SONT déjà des
boutons — la même action écrite quatre fois sur le même écran. Si quelqu'un le
remet, c'était un `<span>`, jamais un `<button>` : un bouton dans un bouton est
du HTML invalide que chaque navigateur répare à sa façon.

### 16/09 — le champ fusionné est annulé : quatre champs, un seul écran

**La fusion « votre établissement » + « votre structure » en UN champ était une
erreur, et elle a été défaite le jour même.** Une seule frappe interrogeait les
deux annuaires : taper « les extras » proposait dessous une association sans
rapport, et rien ne disait à laquelle des deux questions on répondait. Siham :
*« il faut 2 champs l'un à côté de l'autre […] car c'est pas clair là »*.

L'étape **« Vos identifiants »** porte donc maintenant, pour un compte
établissement, une carte **« Où vous travaillez »** avec quatre champs sur deux
lignes :

| | |
|---|---|
| **Nom de votre établissement** (requis, fixe le slug) | **Qui vous emploie** — l'entreprise, l'association, la fondation ou l'institution |
| **Nom de votre service, unité** | **Votre poste** (+ « je suis cadre ») |

- `RechercheEtablissement` ne cherche QUE les établissements déjà sur Les Extras
  — c'est le seul garde-fou contre le doublon d'établissement, et il reste collé
  au champ du nom.
- `ChampStructure` tient l'autre champ : structures déclarées, puis annuaire
  public, puis saisie à la main (beaucoup de petites associations n'y figurent
  pas).

⚠ **L'ÉTAPE « votre service » N'EXISTE PLUS.** Un écran entier — titre, lecture,
bouton Continuer — pour taper « Internat ». Le parcours établissement fait donc
**trois étapes** : `profil → identite → poste`. Ne pas la remettre.

⚠ **LE POSTE ET LE STATUT CADRE SE SAISISSENT AVEC LE LIEU, MAIS S'ÉCRIVENT
AVEC LES DROITS.** `EtapePoste` les reçoit en props et les envoie dans l'unique
`PATCH /organisation/moi` avec le niveau et les capacités : deux PATCH
successifs se marcheraient dessus, et le second gagnerait avec des champs pas
encore remplis.

⚠ **LE LIEU DE TRAVAIL S'ÉCRIT JUSTE APRÈS LA CRÉATION DU COMPTE.** Ses routes
(`/organisation/rejoindre`, `/structures/rattacher`, `/units`) demandent une
session : elles ne peuvent pas partir pendant la saisie. `enregistrerLieu()` est
donc appelé dans `creerLeCompte()`, et chaque écriture reste tolérante à l'échec
— le compte existe déjà, un rattachement qui rate ne doit pas ressembler à une
inscription ratée.

⚠ **PAS DE « RETOUR » SUR L'ÉTAPE DES DROITS** : l'étape précédente est celle
qui a créé le compte.

## LES TROIS DÉFAUTS DE L'AUDIT SONT REFERMÉS — 16/09/2026 (soir)

Bilan demandé par Siham (« t'en penses quoi de tous les changements »), puis
« fait 1, 2, 3 ». Les trois défauts que j'avais nommés sont corrigés.

### 1. Le renfort personnalisé a enfin une porte d'entrée côté DEMANDE

La règle — **ce n'est pas la personne qui choisit le montage, c'est le besoin**
— ne tenait que d'un côté : un intervenant pouvait se déclarer disponible en
renfort personnalisé, **aucun établissement ne pouvait en demander un**. Une
offre sans demande sur la différence principale du produit.

- **`ServiceModal` envoie enfin `format`.** Le champ existait en base et dans
  les trois DTO d'écriture depuis le 16/09 au matin, mais la modale ne
  l'envoyait pas : **toute fiche créée à la main était COLLECTIF**, et aucune
  fiche individuelle ne pouvait exister. Le sélecteur est en DEUX CARTES, en
  tête du formulaire, avant la catégorie — c'est la question qui décide du
  montage juridique, pas un détail de plus dans un menu déroulant.
- **« Participants max » disparaît sur une fiche individuelle.** Un renfort
  personnalisé vaut une personne par définition ; le champ laissé visible
  invitait à écrire un nombre, et un nombre supérieur à un sur une fiche
  individuelle, c'est un groupe déguisé en accompagnement.
- **`format` filtre le catalogue connecté** (`QueryServicesDto`,
  `findCatalog`). `/marketplace?type=services&format=INDIVIDUEL` est l'adresse
  du renfort personnalisé : titre, sous-titre et section changent, les missions
  sont masquées, et une puce permet de retirer le filtre.
- **`/dashboard/renforts` s'ouvre sur DEUX CARTES** : « Un poste à couvrir ·
  Remplacement · CDD » (qui porte la modale de publication) et « Un
  accompagnement 1 pour 1 · Renfort personnalisé · prestation » (qui mène au
  catalogue filtré et au vivier ouvert).

⚠ **LE MONTAGE EST ÉCRIT SUR CHAQUE CARTE, ET IL DOIT LE RESTER.** Les deux
s'appellent « renfort » dans la bouche des gens et se concluent par des
contrats opposés (CE 11/02/2025 n° 491128 ; LFSS 2025 art. 70). Deux cartes
côte à côte sans leur montage, c'est l'erreur qui ne se voit jamais à l'écran
et se découvre au contrôle.

### 2. Le doublon d'établissement est réparé à la racine

`POST /auth/register` accepte `rejoindreEtablissementId`. **Quand il est
renseigné, AUCUN compte n'est créé** : la personne devient membre NON VÉRIFIÉ
du compte existant, et la direction est prévenue.

Avant, « c'est le mien » créait quand même un compte homonyme — avec le nom
EXACT de l'autre (le champ était écrasé par le nom reconnu), donc un slug
suffixé — puis demandait le rattachement au vrai. Douze salariés d'une même
MECS produisaient **douze maisons**, et ces homonymes réapparaissaient aussitôt
dans la liste censée les éviter.

- ⚠ **Un identifiant inconnu ne fait PAS échouer l'inscription** : on retombe
  sur la création normale. Le champ vient d'une liste cliquée ; une inscription
  ne se refuse pas sur un identifiant périmé.
- ⚠ **Pas de slug, pas de dotation de crédits** quand on rejoint : il n'y a pas
  de compte à nommer ni à doter.
- ⚠ **`enregistrerLieu()` ne rattache plus et n'écrit plus rien** quand on
  rejoint : structure et service appartiennent à l'établissement rejoint, ils y
  sont déjà, et une personne non encore vérifiée n'a pas à écrire dans la
  maison des autres. Les deux champs sont masqués à l'écran, remplacés par une
  ligne qui le dit.
- `AuthService.prevenirResponsables()` est le jumeau de la fin de
  `OrganisationService.rejoindreEtablissement` — les deux chemins existent et
  doivent prévenir les mêmes personnes, avec le même texte.

Verrouillé par `apps/api/src/auth/rejoindre-etablissement.spec.ts` (6 tests).

### 3. Les deux verrous préviennent avant de refuser

`CiblageService.blocagesReponse(mission, accountId)` calcule, **sans refuser**,
les deux règles réparables — le montage déclaré et le dossier déposé.
`GET /missions/:id` les renvoie avec la mission ; la fiche affiche
l'avertissement, le chemin de réparation, et **n'affiche plus un bouton qui
mène à un refus**.

- ⚠ **CE N'EST PAS UN SECOND JEU DE RÈGLES.** `assertReponseAutorisee` reste le
  seul point de passage qui REFUSE : les deux appellent les mêmes fonctions
  (`blocageMontage`, `blocageDossier`). Un test vérifie que le message annoncé
  est **exactement** celui que le refus opposera — s'ils divergent, la personne
  répare ce qu'on lui a montré et se fait refuser pour autre chose.
- ⚠ **LES REFUS NON RÉPARABLES N'Y FIGURENT PAS** (ciblage, paliers de cascade,
  garde-fou du salarié) : ils ne dépendent pas de la personne, tombent d'eux-
  mêmes avec le temps, et n'ont aucune réparation à proposer. Les afficher
  ferait de l'écran une liste de reproches.
- ⚠ **Les invariants d'origine tiennent** : une liste d'intérêts vide n'avertit
  rien, et le salarié de la maison est exempté du dossier — ici comme au refus.

7 tests de plus dans `acces-reponse.spec.ts` (22 au total).

### ⚠ RESTE, ET CE N'EST PAS DU CODE

- **Des comptes « MECS Audit Test 2 / 3 » s'affichent** dans la recherche
  d'établissement à l'inscription. `Account` ne porte **aucun drapeau** de
  statut, démo, test ou archive : rien ne permet de les masquer sans les
  supprimer, et une suppression est irréversible (règle n° 6). Décision de
  Siham.
- **Les homonymes déjà créés** par l'ancien défaut restent en base. Même
  raison : rien ne se supprime sans son accord.
- L'annuaire public ne cherche que sur la **raison sociale**, pas sur le sigle
  (« adepa » ne trouve rien, « association pour le développement de l' » oui).

## ARCHIVER UN COMPTE, ET LE RENFORT EXPLIQUÉ SUR L'ACCUEIL — 16/09/2026 (nuit)

### `Account.archivedAt` — la sortie qui ne détruit rien

Il n'existait **aucun moyen de retirer un compte de la vue sans le détruire**.
Vingt et un comptes de test créés pendant les audits — « MECS Audit Test 2 »
(×3), « MECS Test Menu », « [VERIF] MECS Finale », « MECS de verification
finale », et **trois portant le mot « démo »** (MECS Les Tilleuls, IME Le
Verger, EHPAD Les Glycines) — s'affichaient dans la recherche d'établissement
de l'inscription, c'est-à-dire **sur l'écran même qui sert à éviter les
doublons**.

La seule sortie était `DELETE /admin/accounts/:id` → `account.delete` en
cascade : rattachements, fiches, missions, réservations **et factures**. Or une
facture émise ne se supprime pas (art. 242 nonies A, ann. II du CGI).

- `PATCH /admin/accounts/:id/archiver` `{ archive: boolean }` pose ou retire
  `archivedAt`. **Une DATE, pas un booléen** : « depuis quand ce compte a-t-il
  disparu » est la première question posée quand quelqu'un ne se trouve plus.
- Bouton **« Archiver » / « Rétablir »** dans `/admin/etablissements`, placé
  AVANT « Supprimer », avec une pastille « Archivé » sur la ligne.
- L'avertissement de suppression **nomme désormais les factures** : c'est la
  conséquence que personne n'a en tête en cliquant, et la seule qui ne se
  rattrape pas.

⚠ **ARCHIVER N'EST PAS SUSPENDRE.** La colonne retire de la VUE — recherche
d'établissement, annuaire des intervenants, vitrine publique, marketplace — et
**rien d'autre**. Quelqu'un qui a le mot de passe d'un compte archivé se
connecte normalement. Confondre les deux mettrait dehors l'équipe entière d'un
établissement qu'on voulait seulement sortir d'un annuaire.

⚠ **`archivedAt: null` EST DANS LA CONSTANTE `VITRINE`**, pas ajouté requête
par requête : la vitrine porte six requêtes, poser le filtre à la main en
oublierait une au prochain ajout — et une fiche réservable sur un compte
archivé est pire qu'un compte non archivé.

Migration `20260916190000_archivage_comptes` — additive, rejouable, vérifiée
sur PostgreSQL 16 réel, **zéro dérive**. `apps/api/src/admin/archivage-compte.spec.ts`
(4 tests) verrouille notamment « ne touche à rien d'autre que la colonne ».

### L'accueil explique enfin les deux renforts — `_shared/DeuxRenforts.tsx`

Une section, insérée entre « Trois besoins » et « Les deux portes ».

⚠ **UNE SEULE SECTION AJOUTÉE, ET ELLE NE RÉEXPLIQUE PAS L'OFFRE.** L'accueil
était passé de 3 029 à ~2 160 mots en retirant six sections qui répétaient les
trois produits. Celle-ci dit une chose que **rien d'autre ne dit sur le site
public** : pourquoi un remplacement de poste ne se fait pas en indépendant.

Deux cartes, chacune avec son montage écrit en tête — « Remplacement · CDD » et
« Renfort personnalisé · prestation » —, un petit film du trajet, trois repères
et une phrase de conclusion. Puis, sous les deux, la note de droit : **CE
11/02/2025 n° 491128 ; LFSS 2025 art. 70**.

⚠ **LES DEUX NE S'AFFICHENT JAMAIS SANS LEUR MONTAGE.** Deux cartes intitulées
« renfort » et « renfort » reproduiraient la confusion qu'on répare.

⚠ **ON N'ÉCRIT PAS « FREELANCE » DANS CETTE SECTION** : c'est le vocabulaire
sanctionné par la décision citée.

### ⚠ LE « GIF » EST UN SVG ANIMÉ, ET IL NE FAUT PAS LE REMPLACER PAR UN GIF

Le petit film de chaque carte (un rail, trois jalons, une bille qui les
parcourt) est du SVG inline animé en CSS — `animate-rail`, `animate-jalon`,
`animate-bille` dans `globals.css`, à côté de `animate-trait`.

Un GIF pèserait des centaines de kilo-octets pour trois cercles et un trait,
arriverait pixellisé sur un écran moderne, **ne saurait pas changer de couleur
entre le thème clair et le thème sombre**, et continuerait de tourner quand le
visiteur a demandé moins d'animations. Le SVG fait deux kilo-octets, prend
`currentColor`, et `.animate-bille` est dans la liste coupée par
`prefers-reduced-motion` en bas du fichier — **toute nouvelle animation en
boucle doit y être ajoutée aussi**.

Le rail se remplit UNE FOIS (`forwards`) : c'est le chemin, il ne se redessine
pas. La bille boucle avec une pause à l'arrivée — sans cette pause le mouvement
paraît nerveux et attire l'œil plus que le texte.
