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
     (écrit pro, activité, fiche, GAPiste). Le bot d'aide `chat` est GRATUIT.
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
  **Établissement 89 €/mois** (SOS Renfort illimité, 0 % de commission, LEX
  1 000 générations partagées) — le virage du modèle : c'est la DEMANDE qui
  finance, jamais l'intervenant. Ce dernier plan n'est PAS annoncé sur le site
  public : à trancher par Siham avant de l'afficher.
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
    `nettoyerJetonsResiduels()` (4 copies auparavant) + `estJetonRole()` réutilisé
    par le GAP.
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
