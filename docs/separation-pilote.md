# Dissocier Pilote de Les Extras : le plan

Décision de Siham (28/09/2026) : « ce sont 2 produits distincts, ça doit être
entièrement indépendant ». Ce document dit où en est l'indépendance, ce qui
est déjà fait, et le chemin pour la rendre complète, avec les décisions qui lui
reviennent. Il se lit avant de toucher à quoi que ce soit du sujet.

## Ce que « indépendant » veut dire, couche par couche

| Couche | Aujourd'hui | Indépendant veut dire |
|---|---|---|
| Marque et textes | Pilote a ses écrans, ses titres, son robots.txt, son sitemap, son manifeste, ses pages légales. Deux fuites restaient (corrigées le 28/09 : « via Les Extras » dans les e-mails d'école, l'hôte `api.les-extras.fr` sur la page API de l'académie). | Aucune mention de Les Extras nulle part : écrans, e-mails, documents PDF, adresses. |
| Domaines | `pilote.toulali.fr` sert Pilote, `toulali.fr` en est l'accueil. L'API répond sur `api.les-extras.fr`. | Une API sous un domaine Pilote (`api.pilote.toulali.fr`), un expéditeur d'e-mails Pilote (`contact@toulali.fr` ou `@pilote.toulali.fr`). |
| Déploiement | Une seule app web et une seule app API dans Coolify servent les deux produits ; le middleware choisit selon l'hôte. | Deux apps web et deux apps API : déployer Pilote ne redémarre pas Les Extras, et inversement. |
| Code | Un seul dépôt, un seul monorepo. Les modules Pilote (`association/`, `ecole/`, `factures/`, `financeurs/`…) vivent à côté de ceux de Les Extras et partagent la base commune (auth, fichiers, mail, moteur, paiement). | Un dépôt Pilote à part, ou au minimum une frontière de modules explicite et testée. |
| Base de données | Une seule base Postgres. Un `User` peut posséder des comptes des deux produits (c'est le cas de Siham). | Une base Pilote, des utilisateurs Pilote. Quelqu'un qui a les deux produits a deux identifiants. |
| Paiement | Un seul compte Stripe (l'association), un seul webhook. | Un compte ou au moins un webhook et des clés propres à Pilote, pour que les abonnements « Mes factures » et les ventes d'école s'encaissent et se lisent à part. |
| E-mail | Un seul `MailService`, un seul expéditeur SMTP/Brevo. Depuis le 28/09, un gabarit `layoutPilote` sans rien de Les Extras. | Un expéditeur, un domaine authentifié (SPF/DKIM) et un DMARC propres à Pilote. |

## Ce qui est fait

- Écrans, menus, titres, robots, sitemap, manifeste, pages légales et DPA de
  Pilote sont propres à Pilote (travaux du 24 et du 28/09).
- Les e-mails de Pilote passent par `layoutPilote` (nom, adresse de contact et
  site pris dans `PILOTE_NOM`, `PILOTE_MAIL_CONTACT`, `PILOTE_WEB_URL`) ; ceux
  des écoles ne citent plus Les Extras.
- L'API publique de l'académie annonce `NEXT_PUBLIC_PILOTE_API_URL` dès que la
  variable existe.
- Les comptes Pilote (`ASSOCIATION`, `ACADEMIE`) ne peuvent plus s'ouvrir
  depuis les-extras.fr (`auth/trois-comptes.spec.ts`).
- **Étape 2, côté code (29/09/2026)** : `MailService` choisit la boîte d'envoi
  selon le produit. Un message de Pilote ou d'une école (`expediteurPilote`,
  `expediteurEcole`, qui portent `produit: 'pilote'`) part par
  `PILOTE_SMTP_HOST` / `PILOTE_SMTP_USER` / `PILOTE_SMTP_PASSWORD`
  (`PILOTE_SMTP_PORT`, 465 par défaut) avec l'adresse `PILOTE_MAIL_FROM` si elle
  est du même domaine. Sans ces variables, rien ne change. Reste la boîte
  elle-même (hPanel, toulali.fr) et son mot de passe, que Siham pose dans
  Coolify. 3 tests dans `mail.service.spec.ts`.
- **Étape 3, côté code** : le middleware lit `PRODUIT` (`pilote` ou
  `les-extras`) et répond 421 à un hôte de l'autre produit. ⚠ Une SECONDE app
  API n'est pas encore possible sans risque : tous les planificateurs (tunnel,
  enquêtes, relances de factures, gestion de l'académie) tourneraient deux
  fois sur la même base. Il faut d'abord les répartir par produit.
- Sur téléphone, le menu de Pilote s'ouvre depuis un bouton « Menu » dans la
  barre du haut, plus depuis un rond flottant.

## Le chemin, dans l'ordre, et ce que chaque étape coûte

1. **Un domaine d'API pour Pilote (une heure, aucun risque).** Dans Coolify,
   ajouter `https://api.pilote.toulali.fr` aux domaines de l'app API, poser le
   CNAME chez Hostinger, poser `NEXT_PUBLIC_PILOTE_API_URL` sur l'app web.
   Rien ne change pour Les Extras.
2. **Un expéditeur Pilote (une heure).** Authentifier `toulali.fr` (ou
   `pilote.toulali.fr`) chez Brevo ou en SMTP Hostinger, poser
   `PILOTE_MAIL_FROM` / `PILOTE_MAIL_CONTACT`, et faire choisir l'expéditeur par
   `MailService` selon le produit de l'e-mail (aujourd'hui l'expéditeur est
   unique). Coût : une variable de plus par produit et un `if` dans `send()`.
3. **Deux déploiements (une demi-journée, sans toucher aux données).** Créer
   dans Coolify une seconde app web et une seconde app API depuis le MÊME
   dépôt, avec une variable `PRODUIT=pilote` ; le middleware et `main.ts`
   refusent alors tout ce qui n'est pas Pilote (et l'inverse sur les apps Les
   Extras). Basculer le DNS de `pilote.toulali.fr` et `api.pilote.toulali.fr`
   vers ces apps. Résultat : plus aucun déploiement commun, plus aucune page
   de l'un servie par l'autre. La base reste commune à cette étape.
4. **Deux bases (un à deux jours, avec une fenêtre de coupure).** Créer une
   base Postgres Pilote dans Coolify, y copier les tables Pilote et les
   `User` / `Membership` / `Account` de type ASSOCIATION et ACADEMIE (script
   `prisma/exporter-pilote.js`, à écrire : il part du schéma, pas d'une liste à
   la main), pointer l'app API Pilote dessus, vérifier, puis archiver ces
   comptes côté Les Extras. **Décision de Siham avant** : une personne qui a
   un compte des deux côtés (elle) garde le même mot de passe copié, mais les
   deux comptes vivent ensuite séparément.
5. **Un dépôt Pilote (une journée).** `git subtree split` des dossiers Pilote
   plus les briques communes copiées (auth, fichiers, mail, moteur, xlsx). À
   partir de là, une correction commune se fait deux fois : c'est le prix de
   l'indépendance, et il est assumé.
6. **Stripe (à trancher).** Soit un second compte Stripe (la même association
   peut en avoir plusieurs), soit le même compte avec un second webhook et des
   clés propres à l'app Pilote. Sans cela, un abonnement « Mes factures » et
   un crédit LEX se lisent au même endroit.

Les étapes 1 à 3 peuvent se faire maintenant, sans risque pour les données.
Les étapes 4 à 6 demandent une décision écrite de Siham et une fenêtre de
maintenance annoncée aux utilisateurs de Pilote.

## Ce qui NE change pas

- Les règles de la fondatrice (aucun mot de passe saisi, aucun prix inventé,
  rien de supprimé de façon irréversible) valent pour les deux produits.
- Les tests communs continuent de tourner sur le monorepo tant que l'étape 5
  n'est pas faite.
