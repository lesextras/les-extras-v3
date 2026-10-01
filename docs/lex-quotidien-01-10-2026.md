# LEX au quotidien, ressources gratuites, accueil sans prix (01/10/2026)

Décisions de Siham, le 1er octobre 2026.

## LEX : trois tâches, acheté par la personne ou par l'équipe

- Premier écran de `/dashboard/assistant` : `app/_shared/LexQuotidien.tsx`,
  « Que voulez-vous terminer ? ». Trois tâches : préparer ou adapter une
  activité (`POST /assistant/activite`), améliorer mon écrit
  (`POST /assistant/ameliorer`, nouveau : plus clair, plus factuel, plus court,
  objectifs observables), transformer mes notes en compte rendu
  (`POST /assistant/generer` : réunion, activité ou intervention, bilan
  d'action en écrit libre, note d'observation, transmission).
- Le métier choisi (éducation, animation, protection de l'enfance, handicap,
  social, associatif) change les outils proposés, jamais le moteur.
  Définitions uniques : `apps/web/src/lib/lex-taches.ts`.
- L'ancien studio complet (trames maison, export Word, mémoire, documents)
  reste entier derrière `/dashboard/assistant?mode=complet`. Aucun code retiré.
- L'aperçu « ce qui part vers l'IA » se demande d'un clic (route plafonnée à
  120/h, pas d'appel à chaque frappe) et dit qu'un récit peut rester
  reconnaissable : on ne promet pas l'anonymat (CNIL).
- Les liens « Adapter avec LEX » des ressources ne préremplissent que des
  réglages génériques (objectif, public, durée, lieu), jamais des notes.
  `middleware.ts` garde désormais la requête dans `next` lors du passage par
  /login.

## Grille du 1er octobre 2026 (`billing.service.ts`)

- Pack « J'en ai besoin parfois » : 20 résultats, 4,90 € (`pack-20`).
- Abonnement « Je l'utilise régulièrement » : 60 par mois, 9,90 € (`plan-lex`).
- « Pour mon équipe » : `ESTABLISHMENT_PLAN`, 89 €/mois, inchangé.
- Dotation gratuite : 15 par mois, inchangée (on mesure d'abord qui l'atteint).
- ⚠ Les anciennes formules (`ANCIENS_PLANS` 19 €/200 et 49 €/600,
  `ANCIENS_PACKS`) ne sont plus vendues mais restent reconnues : un abonné à
  l'ancienne grille garde sa dotation, l'historique garde ses libellés.
- `/dashboard/adhesion` montre les deux familles à tout compte (le filtre par
  type de compte laissait un PARTICULIER sans formule).

## Accueil sans prix (méthode Airbnb)

Plus aucun prix, taux ni délai sur l'accueil : « 0 % sur les ateliers »,
« 48 h pour un devis », « +15 % », « 19 € », « 9 € » et la carte « Devis sous
48 h » sont retirés (`page.tsx`, `QuatreSituations.tsx`, `DeuxPortes.tsx`).
Les prix restent sur les fiches, au moment du devis, sur `/renforteam`,
`/frais-de-service` et `/lex`.

## Ressources gratuites (`/ressources`)

- Données : `apps/web/src/lib/ressources.ts`. Cinq catégories : activités,
  trames et mémos d'écrits, affiches, présentations, fiches pratiques (les
  quatorze fiches récap déjà publiées dans `/fiches`).
- Seize PDF originaux dans `public/ressources/`, aperçus dans
  `public/ressources/apercus/`, produits par `scripts/ressources/gen.js`
  depuis `scripts/ressources/contenu.js`. Exemples fictifs, aucun prix,
  aucun tiret cadratin, aucun diagnostic.
- Téléchargement sans compte et sans e-mail. Sous chaque ressource,
  « Adapter avec LEX » ouvre la tâche réglée.
- `lib/__tests__/ressources.test.ts` vérifie que chaque fichier annoncé existe.
- Menu public, pied de page et sitemap portent « Ressources ».
