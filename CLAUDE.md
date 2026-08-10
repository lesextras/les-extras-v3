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
- **Prix DÉFINITIFS (validés par Siham le 3/8/2026)** : abonnement LEX
  49 €/mois (10 crédits/jour), LEX Pro 140 €/mois (30 crédits/jour).
  Packs : 10 cr/90 €, 25 cr/200 €, 60 cr/420 € (repris de la grille
  historique, ajustables par Siham seule).
- **Pack Découverte** : essai GRATUIT, une fois par compte, 7 jours de
  recharge quotidienne (10 cr/jour), sans carte bancaire.
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

### Ce qui reste à faire sur WordPress (décision de Siham)

Les FICHIERS de WordPress répondent sur `app.les-extras.fr`
(`/wp-content/uploads/…` sert les images du blog), mais ses PAGES redirigent
encore vers `les-extras.fr` : l'adresse du site est enregistrée dans WordPress
lui-même. Deux façons de le corriger, l'une ou l'autre :

- Admin WordPress → Réglages → Général → mettre les deux champs d'adresse sur
  `https://app.les-extras.fr` ;
- ou ajouter dans `public_html/wp-config.php`, avant la ligne
  « That's all, stop editing » :
  `define('WP_HOME','https://app.les-extras.fr');`
  `define('WP_SITEURL','https://app.les-extras.fr');`

Tant que ce n'est pas fait, le blog de la plateforme fonctionne parfaitement —
seule la navigation dans l'ancien site WordPress est indisponible.

**Conséquence assumée de l'inversion** : tous les liens déjà envoyés par e-mail
avant le 10/08/2026 (vérification de compte, contrats, factures) pointaient sur
`app.les-extras.fr` et ne fonctionnent plus. Les e-mails émis depuis le
basculement pointent sur `les-extras.fr`.

## Ce qui reste (rien de bloquant)

- Siham : créer un projet Sentry et poser `SENTRY_DSN` (optionnel).
- Siham : contenu réel (fiches ateliers, catalogue Qualiopi, recrutement du
  réseau) ; faire relire CGU/mentions légales par un juriste.
- Optionnel : sauvegardes BDD vers S3/MinIO ; SDK Sentry côté web.
- adepa.fr : PDF bilan de compétences 404, vidéo SMP Teachizy.
- Premier paiement réel Stripe à surveiller sur `/admin/lex` (le circuit est
  testé par signature/idempotence, pas encore par un vrai paiement).
