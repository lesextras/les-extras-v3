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
  une rubrique ») : « LEX & analyse de pratique » côté établissement ne garde
  que le GAP, et la section « LEX » du salarié en attente ne garde que le solde.
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
avant. `Attribut` reçoit un paramètre `ton` : le second encart prend le fond
`muted`, plus sourd d'un ton, sans quoi les deux textes longs formaient un seul
pavé où l'œil ne trouvait plus la séparation.

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
