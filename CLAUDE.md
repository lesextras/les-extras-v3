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

## Ce qui reste (rien de bloquant)

- Siham : créer un projet Sentry et poser `SENTRY_DSN` (optionnel).
- Siham : contenu réel (fiches ateliers, catalogue Qualiopi, recrutement du
  réseau) ; faire relire CGU/mentions légales par un juriste.
- Optionnel : sauvegardes BDD vers S3/MinIO ; SDK Sentry côté web.
- adepa.fr : PDF bilan de compétences 404, vidéo SMP Teachizy.
- Premier paiement réel Stripe à surveiller sur `/admin/lex` (le circuit est
  testé par signature/idempotence, pas encore par un vrai paiement).
