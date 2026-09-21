/**
 * FICHES RÉCAP — les données.
 *
 * Une fiche A4 par mini-formation : la page qu'on imprime et qu'on punaise,
 * celle qui se lit en deux minutes et qui rappelle tout le parcours.
 *
 * ⚠ RÈGLE ABSOLUE DE CE FICHIER : rien n'est inventé ici.
 * Chaque encadré reprend un contenu qui existe déjà dans les modules
 * (f1-fonctions.js … f10-demarrer.js) ou dans les trois schémas de chaque
 * parcours (schemas.js). Une fiche récap qui promettrait autre chose que la
 * formation serait pire qu'une absence de fiche : elle ferait mentir le
 * catalogue. Quand un chiffre apparaît (sept jours, cinq secondes, 0 à 7),
 * il vient du module, pas de moi.
 *
 * Les couleurs sont choisies par thématique, pas au hasard :
 *   bleu    — comprendre le comportement
 *   vert    — apprentissages et autonomie
 *   violet  — environnement et repères
 *   orange  — moments difficiles
 *   rose    — parcours et institutions
 */

const FICHES = [
  /* ══════════════════════════════════════════════════════════════════════ 1 */
  {
    slug: 'les-quatre-fonctions-d-un-comportement',
    titre: 'LES QUATRE FONCTIONS',
    titre2: "D’UN COMPORTEMENT",
    accent: '#2563eb',
    accentDoux: '#eff6ff',
    thematique: 'Comprendre le comportement',
    ruban: 'Observer avant d’agir',
    emoji: '🔍',
    duree: '4 modules · 46 min de lecture · 7 jours de relevé',
    competence:
      'Formuler une hypothèse de fonction à partir d’un relevé, et l’écrire de façon qu’elle circule dans une équipe.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        '<b>Un comportement n’est pas un symptôme</b> : c’est une action qui a marché. S’il revient, c’est qu’il obtient quelque chose.',
        '<b>Forme ≠ fonction.</b> Deux personnes qui font exactement la même chose ne le font presque jamais pour la même raison — et n’appellent donc pas la même réponse.',
        'On ne travaille pas sur ce qui se voit (la colonne du milieu), on travaille sur <b>ce qui se passe juste après</b>.',
      ],
      test: 'Qu’est-ce que la personne a obtenu, ou évité, dans les dix secondes qui ont suivi&nbsp;?',
    },
    parcours: [
      { quoi: 'La théorie : forme, fonction, les quatre moteurs', produit: 'la grille en trois temps' },
      { quoi: 'Une scène qui dérape : l’atelier cuisine du mardi', produit: 'votre scène analysée' },
      { quoi: 'La grille en quatre colonnes, et le bon créneau', produit: 'votre grille de la semaine' },
      { quoi: 'Sept jours de relevé, puis la lecture guidée', produit: 'une hypothèse transmissible' },
    ],
    releve: 'Entre le module 3 et le module 4 : <b>sept jours de relevé, une minute par jour.</b> Le module 4 se lit le septième jour, la grille sous les yeux.',
    figure: {
      titre: 'POURQUOI UN COMPORTEMENT SE RÉPÈTE',
      type: 'boucle',
      cases: [
        { t: 'AVANT', d: 'ce qui se passait juste avant' },
        { t: 'COMPORTEMENT', d: 'ce qui se voit et s’entend' },
        { t: 'APRÈS', d: 'ce que ça a obtenu' },
      ],
      retour: 'et comme ça a marché, ça recommence',
      legende:
        'La colonne du milieu est celle qu’on regarde, et c’est la seule qui ne décide de rien.',
    },
    arbre: {
      titre: 'LIRE LA COLONNE « APRÈS » : LES QUATRE MOTEURS',
      question: 'Qu’est-ce que le comportement a obtenu, juste après&nbsp;?',
      branches: [
        { si: 'Quelqu’un est venu', alors: 'ATTENTION', d: 'regard, parole, contact — même un reproche' },
        { si: 'Une demande a cessé', alors: 'ÉCHAPPÉE', d: 'la tâche s’arrête, se reporte, s’allège' },
        { si: 'Un objet est arrivé', alors: 'OBTENTION', d: 'l’objet, l’écran, le trajet, le tour' },
        { si: 'Rien de l’extérieur', alors: 'SENSATION', d: 'le comportement se suffit à lui-même' },
      ],
    },
    erreurs: [
      'Décrire en jugeant : « provocateur », « caprice », « exprès ». Ces mots ferment l’analyse avant qu’elle commence.',
      'Conclure sur deux jours. C’est la <b>répétition d’un même « après »</b> qui rend l’hypothèse crédible, jamais une occurrence.',
      'Changer les réponses de l’équipe pendant qu’on observe : on ne mesure plus rien.',
      'Traiter la sensation comme un problème par défaut : ce n’en est pas un.',
    ],
    retenir: [
      'Un seul comportement, écrit sans adjectif.',
      'La colonne « Après » avant tout le reste.',
      'Une hypothèse qu’aucune observation ne pourrait démentir n’est pas une hypothèse.',
    ],
    grille: {
      titre: 'LA GRILLE À RECOPIER — 7 JOURS, 1 MIN PAR JOUR',
      colonnes: ['Quand', 'Avant', 'Comportement', 'Après'],
      note:
        'Le comportement observé s’écrit UNE FOIS en haut de la feuille, en termes observables : on ne le réécrit pas à chaque ligne.',
    },
    astuces: [
      { i: '✏️', t: 'Une feuille dans la poche, pas un fichier : une grille qu’on va chercher n’est jamais remplie.' },
      { i: '⏱️', t: 'Si une ligne prend plus d’une minute, simplifiez la grille avant de commencer.' },
      { i: '🗣️', t: 'Prévenez l’équipe : « je relève cette semaine, je ne change rien d’autre. »' },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════ 2 */
  {
    slug: 'apprendre-a-demander-plutot-qu-a-crier',
    titre: 'APPRENDRE À DEMANDER',
    titre2: 'PLUTÔT QU’À CRIER',
    accent: '#2563eb',
    accentDoux: '#eff6ff',
    thematique: 'Comprendre le comportement',
    ruban: 'Remplacer, jamais effacer',
    emoji: '💬',
    duree: '4 modules · 44 min de lecture · 14 jours d’application',
    competence:
      'Construire un plan de remplacement en six lignes, l’appliquer quatorze jours, et lire le relevé sans se tromper de conclusion.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        '<b>Retirer sans donner, c’est retirer un outil.</b> Un comportement ne s’efface pas : il se remplace, ou il revient.',
        'Le remplacement doit obtenir <b>exactement la même chose</b> que le comportement d’avant — pas quelque chose de mieux, la même chose.',
        'On enseigne la demande <b>quand tout va bien</b>. Au moment de la crise, il est déjà trop tard.',
      ],
      test: 'Si j’étais à sa place, est-ce que je choisirais le nouveau comportement&nbsp;? Si j’hésite, c’est non.',
    },
    parcours: [
      { quoi: 'Pourquoi un comportement se remplace, et les quatre conditions', produit: 'le test des quatre conditions' },
      { quoi: 'Une scène où presque tout a été bien fait', produit: 'l’audit de votre terrain' },
      { quoi: 'Le plan de remplacement en six lignes', produit: 'votre plan en six lignes' },
      { quoi: 'Quatorze jours, la remontée passagère, la lecture', produit: 'une décision datée' },
    ],
    releve: 'Entre le module 3 et le module 4 : <b>quatorze jours d’application, une minute de relevé par jour.</b> Comptez deux bonnes semaines entre le premier et le dernier module.',
    figure: {
      titre: 'CE QU’UN REMPLACEMENT DOIT FAIRE',
      type: 'paires',
      gauche: 'Le comportement actuel',
      droite: 'Le comportement de remplacement',
      lignes: [
        { g: 'Obtient quelque chose de précis', d: 'Doit obtenir <b>exactement la même chose</b>' },
        { g: 'Marche vite', d: 'Doit marcher <b>plus vite</b>' },
        { g: 'Coûte peu à la personne', d: 'Doit coûter <b>moins</b> — moins d’effort, moins d’attente' },
        { g: 'Marche à tous les coups', d: 'Doit marcher <b>à tous les coups</b>, au début' },
      ],
      legende: 'Les quatre lignes sont indispensables ensemble. Un remplacement plus lent ne sera pas choisi — et c’est un calcul juste.',
    },
    arbre: {
      titre: 'LIRE LE RELEVÉ AU QUATORZIÈME JOUR',
      question: 'Que montrent les deux colonnes sur quatorze jours&nbsp;?',
      branches: [
        { si: 'La demande monte, l’ancien baisse', alors: 'ÇA MARCHE', d: 'on continue sans rien changer, et on prépare l’espacement' },
        { si: 'La demande ne vient pas', alors: 'TROP COÛTEUSE', d: 'on simplifie la forme, ou on aide davantage au départ' },
        { si: 'Les deux montent ensemble', alors: 'L’ANCIEN MARCHE ENCORE', d: 'on revoit la ligne 5 : que produit le comportement d’avant ?' },
        { si: 'Rien ne bouge du tout', alors: 'MAUVAISE FONCTION', d: 'on reprend la grille des quatre fonctions' },
      ],
    },
    erreurs: [
      '<b>Arrêter au cinquième jour</b> à cause de la remontée passagère : elle est attendue, elle est le signe que le plan mord.',
      'Répondre plus vite à l’ancien comportement qu’à la nouvelle demande. La personne compare, et elle a raison.',
      'Choisir une forme trop coûteuse : une phrase complète quand un geste suffirait.',
      'Piéger la personne : provoquer la situation difficile pour « faire travailler » la demande.',
    ],
    retenir: [
      'Même fonction, plus vite, moins cher, à tous les coups.',
      'La ligne 5 se décide avant, pas dans l’instant.',
      'La sécurité prime sur le plan, toujours.',
    ],
    grille: {
      titre: 'LA GRILLE À RECOPIER — 14 JOURS, 1 MIN PAR JOUR',
      colonnes: ['Jour', 'Demande de remplacement utilisée', 'Comportement ancien'],
      note:
        'Deux colonnes, deux croix. On compte semaine par semaine : quatre nombres suffisent à lire quatorze jours.',
    },
    astuces: [
      { i: '📌', t: 'Une phrase affichée pour les remplaçants : « quand il fait X, ça veut dire Y, il faut Z ».' },
      { i: '⚡', t: 'Cherchez la version auto-servie : celle qui n’attend aucun adulte.' },
      { i: '🗓️', t: 'Deux nombres par semaine suffisent à lire quatorze jours.' },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════ 3 */
  {
    slug: 'guider-puis-s-effacer',
    titre: 'GUIDER',
    titre2: 'PUIS S’EFFACER',
    accent: '#16a34a',
    accentDoux: '#f0fdf4',
    thematique: 'Apprentissages et autonomie',
    ruban: 'L’aide se retire, ou elle s’installe',
    emoji: '🪜',
    duree: '4 modules · 46 min de lecture · 15 jours de relevé',
    competence:
      'Mesurer le niveau d’aide réellement donné, écrire un plan d’estompage en quatre lignes, et le tenir quinze jours.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        'L’aide est <b>le seul outil éducatif qui devient nuisible quand il marche trop bien</b> : elle règle le problème du jour et installe la dépendance du mois suivant.',
        'On donne <b>le niveau le plus bas qui débloque</b>, jamais celui qui marche à coup sûr. C’est le coût du retrait qui décide.',
        '<b>Cinq secondes de silence</b> avant d’aider. Comptées, pas ressenties.',
      ],
      test: 'Quel niveau d’aide je donnais il y a trois mois&nbsp;? Si c’est le même qu’aujourd’hui, rien n’est en train de s’apprendre.',
    },
    parcours: [
      { quoi: 'L’échelle des aides, et le délai qu’on ne laisse jamais', produit: 'votre niveau réel, mesuré' },
      { quoi: 'Une aide qui a très bien marché pendant six mois', produit: 'la photo d’il y a trois mois' },
      { quoi: 'Le plan d’estompage en quatre lignes', produit: 'votre plan en quatre lignes' },
      { quoi: 'Quinze jours de relevé, et la phrase de bilan', produit: 'un bilan qui décrit le dispositif' },
    ],
    releve: 'Entre le module 3 et le module 4 : <b>quinze jours de relevé, trente secondes par jour.</b> Quinze parce qu’un niveau d’aide se lit en moyenne hebdomadaire — il en faut deux pour comparer.',
    figure: {
      titre: 'L’ÉCHELLE DES AIDES, DE 0 À 7',
      type: 'echelle',
      lignes: [
        { n: '7', l: 'Guidance physique complète — la main de l’adulte fait le geste' },
        { n: '6', l: 'Guidance physique partielle — un contact qui lance le mouvement' },
        { n: '5', l: 'Démonstration — l’adulte fait devant, la personne refait' },
        { n: '4', l: 'Consigne verbale directe' },
        { n: '3', l: 'Indice indirect — une consigne raccourcie, un mot' },
        { n: '2', l: 'Geste montré' },
        { n: '1', l: 'Indice de position — l’objet est posé devant, prêt' },
        { n: '0', l: 'Rien' },
      ],
      legende: 'On cote une séance, pas un geste. Et on note le niveau donné, pas la réussite obtenue.',
    },
    arbre: {
      titre: 'LE PLAN D’ESTOMPAGE, DE BOUT EN BOUT',
      question: 'Quatre lignes, décidées AVANT de commencer',
      branches: [
        { si: 'Ligne 1', alors: 'NIVEAU DE DÉPART', d: 'celui que vous donnez réellement, mesuré sur deux séances' },
        { si: 'Ligne 2', alors: 'CRITÈRE DE PASSAGE', d: 'deux jours de suite, avec deux adultes différents' },
        { si: 'Ligne 3', alors: 'NIVEAU D’ARRIVÉE', d: 'traduit en mots concrets — pas forcément zéro' },
        { si: 'Ligne 4', alors: 'DATE DE REVUE', d: 'écrite, dans un agenda partagé' },
      ],
    },
    erreurs: [
      'Décider le critère en cours de route : il se déplace toujours au moment où l’on est fatigué ou pressé.',
      'Confondre <b>stabilité et réussite</b>. Un niveau qui ne bouge pas depuis six mois est un signal d’alerte, pas un succès.',
      'Aider avant les cinq secondes « parce qu’on est pressé » — c’est la donnée la plus utile du relevé, et la plus cachée.',
      'Écrire un bilan qui décrit la personne au lieu du dispositif : c’est ce qui coûte cher dans un dossier MDPH.',
    ],
    retenir: [
      'Le niveau le plus bas qui débloque.',
      'Cinq secondes comptées, pas estimées.',
      'Un plan qui ne survit pas à votre absence n’est pas un plan.',
    ],
    grille: {
      titre: 'LA GRILLE À RECOPIER — 15 JOURS, 30 SECONDES PAR JOUR',
      colonnes: ['Jour', 'Niveau donné (0-7)', 'Réussi seul ensuite ?', 'Remarque (facultatif)'],
      note:
        'Le relevé suit l’aide, pas la réussite. C’est la première colonne qui mesure ce que vous cherchez.',
    },
    astuces: [
      { i: '📷', t: 'Cherchez la trace d’il y a trois mois : cahier de liaison, transmissions, compte rendu.' },
      { i: '✂️', t: 'Palier de plus de cinq jours ? Fabriquez un cran intermédiaire.' },
      { i: '📣', t: 'Annoncez le retrait à la personne. Elle n’a pas à le découvrir.' },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════ 4 */
  {
    slug: 'decomposer-une-routine-en-etapes',
    titre: 'DÉCOMPOSER UNE ROUTINE',
    titre2: 'EN ÉTAPES',
    accent: '#16a34a',
    accentDoux: '#f0fdf4',
    thematique: 'Apprentissages et autonomie',
    ruban: 'Une chaîne, pas un geste',
    emoji: '🔗',
    duree: '4 modules · 44 min de lecture · 10 jours d’enseignement',
    competence:
      'Découper une routine en étapes exécutables, choisir le mode d’enseignement par une règle écrite, et travailler une seule étape cible.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        '<b>« Il ne sait pas s’habiller » ne se travaille pas.</b> « Il bloque à l’étape 5 » se travaille — et c’est la même personne, la même semaine.',
        'Une routine est une <b>chaîne</b> : chaque étape sert de signal à la suivante, et chacune s’apprend séparément.',
        '<b>Une seule étape cible à la fois.</b> Le reste de la chaîne, on l’accompagne comme d’habitude.',
      ],
      test: 'Le test du témoin : quelqu’un qui n’a jamais vu la routine pourrait-il l’exécuter avec votre liste&nbsp;? Là où il devrait deviner, il manque une étape.',
    },
    parcours: [
      { quoi: 'La chaîne, le test du témoin, la ligne de base', produit: 'votre chaîne en huit lignes' },
      { quoi: 'Une séance de trois minutes qui n’a rien produit', produit: 'une séance analysée' },
      { quoi: 'Ligne de base, règle du mode, étape cible', produit: 'votre étape cible entourée' },
      { quoi: 'Dix jours d’enseignement, et la lecture du relevé', produit: 'une phrase de bilan' },
    ],
    releve: 'Entre le module 3 et le module 4 : <b>une observation, puis dix jours d’enseignement, une minute de relevé par jour.</b> La séance elle-même dure vingt à trente secondes.',
    figure: {
      titre: 'UNE ROUTINE N’EST PAS UN GESTE, C’EST UNE CHAÎNE',
      type: 'flux',
      cases: [
        { t: '1', d: 'poser le manteau à l’endroit' },
        { t: '2', d: 'enfiler le bras droit' },
        { t: '3', d: 'passer derrière le dos' },
        { t: '4', d: 'enfiler le bras gauche' },
        { t: '5', d: 'joindre la fermeture' },
        { t: '6', d: 'la remonter' },
      ],
      legende: 'Chaque étape se cote S (seul), A (avec aide) ou N (non fait). Trois colonnes, une feuille.',
    },
    arbre: {
      titre: 'PAR QUELLE EXTRÉMITÉ ENSEIGNER : LA RÈGLE EN TROIS LIGNES',
      question: 'Combien d’étapes sont déjà réussies seules (S)&nbsp;? On applique dans l’ordre, on s’arrête à la première ligne qui répond.',
      branches: [
        { si: 'Les premières sont N, les dernières S', alors: 'CHAÎNAGE AVANT', d: 'étape cible : la première' },
        { si: 'S strictement supérieur à la moitié', alors: 'CHAÎNE ENTIÈRE, AIDE DÉGRESSIVE', d: 'cible : la première A ou N depuis le début' },
        { si: 'Tous les autres cas — la moitié comprise', alors: 'CHAÎNAGE ARRIÈRE', d: 'cible : la première non acquise en remontant depuis la fin' },
      ],
    },
    erreurs: [
      'Écrire la liste du point de vue de l’adulte. Chaque étape décrit ce que fait <b>la personne</b>.',
      'Mettre « et » dans une étape : c’est qu’il y en a deux.',
      'Programmer la séance à une heure où vous n’avez pas cinq secondes de silence disponibles.',
      'Nommer la personne dans le retour (« tu es super ») au lieu du geste (« tu as remonté la fermeture tout seul »).',
    ],
    retenir: [
      'Entre cinq et douze étapes, un verbe par étape.',
      'La ligne de base se prend avant d’enseigner.',
      'Une seule étape cible, un seul critère de passage.',
    ],
    grille: {
      titre: 'LA GRILLE À RECOPIER — 10 JOURS, 1 MIN PAR JOUR',
      colonnes: ['Jour', 'Étape cible', 'Aide utilisée (0-7)', 'Réussi ?'],
      note:
        'Une seule étape cible pendant les dix jours. Le reste de la chaîne s’accompagne comme d’habitude.',
    },
    astuces: [
      { i: '🧪', t: 'Demandez la routine complète une fois, sans corriger ni encourager. C’est la ligne de base.' },
      { i: '🕐', t: 'Comptez les jours où vous avez aidé avant cinq secondes : c’est la donnée la plus honnête.' },
      { i: '➗', t: 'L’aide ne bouge pas ? Coupez l’étape cible en deux sous-étapes.' },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════ 5 */
  {
    slug: 'rendre-l-environnement-previsible',
    titre: 'RENDRE L’ENVIRONNEMENT',
    titre2: 'PRÉVISIBLE',
    accent: '#7c3aed',
    accentDoux: '#f5f3ff',
    thematique: 'Environnement et repères',
    ruban: 'Un support se tient, ou il tombe',
    emoji: '🗓️',
    duree: '4 modules · 42 min de lecture · 14 jours d’usage',
    competence:
      'Fabriquer un support visuel consultable, lui écrire une ligne de responsabilité, et décider honnêtement au quatorzième jour.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        'Un support visuel ne remplace pas une explication : il remplace <b>une question qu’on n’a pas les moyens de poser</b>.',
        'Trois objets différents finissent sur le même mur : l’emploi du temps, la séquence d’une tâche, le support de choix. Ce ne sont pas les mêmes outils.',
        '<b>Un support affiché n’est pas un support utilisé.</b> Ce qui le fait vivre, c’est que quelque chose s’y déplace.',
      ],
      test: 'Le test des trente secondes : la mise à jour quotidienne prend-elle moins de trente secondes&nbsp;? Sinon, elle ne sera pas faite.',
    },
    parcours: [
      { quoi: 'Ce qui rend un support consultable, les cinq causes d’abandon', produit: 'le test du niveau' },
      { quoi: 'Un support qui fonctionnait, et qu’on a enterré', produit: 'l’autopsie d’un support existant' },
      { quoi: 'Fabriquer, et écrire la ligne de responsabilité', produit: 'votre support fabriqué' },
      { quoi: 'Quatorze jours d’usage, et la décision honnête', produit: 'une décision datée' },
    ],
    releve: 'Entre le module 3 et le module 4 : <b>quatorze jours d’utilisation, trente secondes de relevé par jour.</b> Quatorze, parce qu’un support tient presque toujours la première semaine — c’est la deuxième qui dit s’il survivra.',
    figure: {
      titre: 'LES CINQ CAUSES D’ABANDON, ET CE QUI LES LÈVE',
      type: 'paires',
      gauche: 'Ce qui tue un support',
      droite: 'Ce qui le fait survivre',
      lignes: [
        { g: 'Il est affiché, pas manipulé', d: 'Quelque chose s’y déplace : une carte, une pochette « fini »' },
        { g: 'Il n’a pas de marque de fin', d: 'Une fin visible : la dernière case, le bac vide' },
        { g: 'Il est trop chargé', d: 'Quatre à six cases, une demi-journée, pas la semaine' },
        { g: 'Personne n’est chargé de le tenir', d: '<b>Un nom et un moment</b>, écrits' },
        { g: 'Le niveau de représentation est trop abstrait', d: 'Le niveau testé, jamais supposé' },
      ],
      legende: 'La quatrième ligne décide de tout : fabriquer un support est valorisant, l’entretenir ne l’est pas.',
    },
    arbre: {
      titre: 'LIRE LE RELEVÉ AU QUATORZIÈME JOUR',
      question: 'Que disent les trois colonnes — à jour&nbsp;? consulté&nbsp;? le moment est-il mieux&nbsp;?',
      branches: [
        { si: 'Colonne 1 souvent « non »', alors: 'RIEN N’A ÉTÉ TESTÉ', d: 'réduire le nombre de cases, redésigner un responsable' },
        { si: '1 oui, 2 non', alors: 'TENU MAIS PAS CONSULTÉ', d: 'le rapprocher, puis descendre d’un niveau' },
        { si: '1 et 2 oui, 3 « pareil »', alors: 'CE N’EST PAS LA PRÉVISIBILITÉ', d: 'chercher ailleurs : fonction, tâche, avis médical' },
        { si: 'Colonne 3 « mieux »', alors: 'ÇA FONCTIONNE', d: 'garder tel quel un mois, puis une extension à la fois' },
      ],
    },
    erreurs: [
      'Supposer le niveau de représentation au lieu de le tester. <b>Une photo prise chez vous bat un pictogramme du commerce.</b>',
      'Afficher la semaine entière quand quatre à six cases suffisent.',
      'Laisser la mise à jour « à l’équipe » : dans neuf cas sur dix, le responsable s’appelle personne.',
      'Conclure « ça n’a pas marché » quand le support n’a jamais été tenu à jour. Rien n’a été testé.',
    ],
    retenir: [
      'Une question, écrite avec les mots de la personne.',
      'Un prénom et une heure, écrits avant la première case.',
      'La carte « changement » se rode à froid, pas le jour du changement.',
    ],
    grille: {
      titre: 'LA GRILLE À RECOPIER — 14 JOURS, 30 SECONDES PAR JOUR',
      colonnes: ['Jour', 'Support à jour ?', 'Consulté de sa propre initiative ?', 'Le moment s’est passé…'],
      note:
        'La deuxième colonne est celle qui compte : elle mesure l’autonomie, qui est l’objectif réel du support.',
    },
    astuces: [
      { i: '📸', t: 'Deux images côte à côte, « montre le bain » : la réponse donne le niveau.' },
      { i: '🧲', t: 'Le frigo bat le mur du couloir : on met le support là où l’on passe.' },
      { i: '⏳', t: 'Chronométrez la première mise à jour. Au-delà de trente secondes, simplifiez.' },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════ 6 */
  {
    slug: 'les-premieres-minutes-d-une-crise',
    titre: 'LES PREMIÈRES MINUTES',
    titre2: 'D’UNE CRISE',
    accent: '#ea580c',
    accentDoux: '#fff7ed',
    thematique: 'Moments difficiles',
    ruban: 'Ne rien ajouter',
    emoji: '⏱️',
    duree: '4 modules · 52 min de lecture · 10 jours de relevé',
    competence:
      'Écrire une fiche à froid en cinq lignes, retirer un ajout à la fois, et relire dix jours de relevé sans se tromper d’indicateur.',
    avertissement:
      'Ce parcours n’arrête pas les crises et ne le promet nulle part. Il ne remplace ni un avis médical, ni un protocole d’établissement. Aucune pratique de contrainte n’y est enseignée.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        '<b>Le mot « crise » ne décrit rien.</b> On écrit l’heure, ce qui précédait, ce qui s’est produit — des verbes, pas des adjectifs.',
        'L’adulte ajoute presque toujours quelque chose sans le vouloir : des mots, une demande, du public, de la proximité, une menace, du volume.',
        '<b>La deuxième crise</b> est la plus dangereuse, et elle naît d’une reprise trop tôt.',
      ],
      test: 'Qu’est-ce que je peux retirer&nbsp;? — et non : qu’est-ce que je peux faire de plus&nbsp;?',
    },
    parcours: [
      { quoi: 'Les quatre temps, les six ajouts, les trois réductions', produit: 'un ajout à retirer, choisi' },
      { quoi: 'Le goûter de Sofiane : la scène minute par minute', produit: 'votre scène découpée' },
      { quoi: 'La fiche à froid en cinq lignes', produit: 'votre fiche à froid' },
      { quoi: 'Dix jours de relevé, et ce qu’on écrit après', produit: 'une décision et sa date' },
    ],
    releve: 'Entre le module 3 et le module 4 : <b>dix jours de relevé, une minute par épisode</b> — et rien les jours sans épisode.',
    figure: {
      titre: 'LES QUATRE TEMPS, ET OÙ L’ON A UNE PRISE',
      type: 'frise',
      segments: [
        { n: 'AVANT', w: 28, fort: true, q: 'Le seul moment où l’on change vraiment quelque chose : alléger, prévenir, offrir une sortie' },
        { n: 'MONTÉE', w: 20, fort: true, q: 'Réduire : moins de mots, moins de demandes, moins de public. Sécuriser l’espace' },
        { n: 'PIC', w: 16, fort: false, q: 'Presque rien. Rester visible, attendre, ne pas ajouter' },
        { n: 'DESCENTE · RÉCUPÉRATION', w: 36, fort: false, q: 'Du temps. Ne rien redemander — c’est ici que naît la deuxième crise' },
      ],
      legende: 'La barre pleine marque les deux moments où l’adulte a une prise réelle. Les deux autres se traversent.',
    },
    arbre: {
      titre: 'LA FICHE À FROID, EN CINQ LIGNES',
      question: 'Elle s’écrit maintenant, pas pendant. Cinq lignes, et elles suffisent.',
      branches: [
        { si: 'Ligne 1', alors: 'LES SIGNES DE CETTE PERSONNE', d: 'deux à quatre, avec des verbes — le plus utile est presque toujours le plus banal' },
        { si: 'Ligne 2', alors: 'CE QUE JE FAIS DE MOINS', d: 'un ajout à retirer, deux au maximum, à la première personne' },
        { si: 'Ligne 3', alors: 'LA PHRASE, MOT POUR MOT', d: 'relue à voix haute : si elle sonne faux, elle ne sortira pas' },
        { si: 'Lignes 4 et 5', alors: 'LIMITE DE SÉCURITÉ · REPRISE', d: 'ce qui déclenche, qui j’appelle — puis une durée, un nom, et ce qu’on redemande (souvent : rien)' },
      ],
    },
    erreurs: [
      'Prendre la <b>durée du pic</b> comme indicateur : elle bouge lentement et dépend de beaucoup de choses hors de vous.',
      'Reprendre trop tôt. C’est le mécanisme direct de la deuxième crise.',
      'Retirer les six ajouts d’un coup : on en retire un, on le tient dix jours.',
      'Écrire « ingérable », « n’importe quoi », « gros » dans un cahier de transmission.',
    ],
    retenir: [
      'Avant et montée : c’est là qu’on agit.',
      'Un seul ajout retiré à la fois.',
      'La sécurité passe avant le reste, et les limites sont absolues.',
    ],
    grille: {
      titre: 'LA GRILLE À RECOPIER — 10 JOURS, 1 MIN PAR ÉPISODE',
      colonnes: ['Quand', 'Avant', 'Ce qui s’est produit', 'Ce que j’ai ajouté', 'Après'],
      note:
        'Rien les jours sans épisode. La colonne 4 est la seule qui porte sur vous — c’est celle qui bouge le plus vite.',
    },
    astuces: [
      { i: '📝', t: 'Rien les jours sans épisode : un relevé qui devient un travail est un relevé qui s’arrête.' },
      { i: '🔇', t: 'Moins de mots, moins de demandes, moins de public. Les trois réductions.' },
      { i: '📈', t: 'Comptez les « rien » en semaine 1 puis en semaine 2 : c’est ce qui dépend de vous.' },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════ 7 */
  {
    slug: 'l-enfant-qui-dit-non-a-tout',
    titre: 'L’ENFANT QUI DIT',
    titre2: 'NON À TOUT',
    accent: '#db2777',
    accentDoux: '#fdf2f8',
    thematique: 'Moments difficiles',
    ruban: 'La consigne avant l’obéissance',
    emoji: '🙅',
    duree: '4 modules · 46 min de lecture · 10 jours de relevé',
    competence:
      'Écrire cinq consignes exécutables pour un moment précis, tenir cinq secondes de silence, et lire le relevé ligne par ligne.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        '<b>« Il dit non à tout » n’est pas une donnée.</b> Comptez une heure : le nombre de consignes surprend toujours plus que le nombre de refus.',
        'Il y a <b>cinq « non » différents</b>, et on n’y répond pas pareil. Le refus est une communication, y compris quand il dérange.',
        'Ce relevé <b>ne mesure pas la personne d’en face</b> : il mesure votre feuille.',
      ],
      test: 'Sauriez-vous filmer quelqu’un en train d’exécuter cette consigne&nbsp;? Si l’image n’existe pas, ce n’est pas encore une consigne.',
    },
    parcours: [
      { quoi: 'Les cinq « non », les sept défauts, les cinq secondes', produit: 'votre comptage d’une heure' },
      { quoi: 'Le rangement du samedi, consigne par consigne', produit: 'votre scène analysée' },
      { quoi: 'La feuille des cinq consignes', produit: 'votre feuille du moment difficile' },
      { quoi: 'Dix jours de relevé, et ce qu’on écrit après', produit: 'une feuille corrigée' },
    ],
    releve: 'Entre le module 3 et le module 4 : <b>dix jours, cinq croix par jour</b> à la fin du moment choisi. Une minute. Puis on recommence : la progression normale tient en trois cycles de dix jours.',
    figure: {
      titre: 'CE QUI REND UNE CONSIGNE INEXÉCUTABLE',
      type: 'paires',
      gauche: 'La consigne telle qu’elle sort',
      droite: 'La consigne qui s’exécute',
      lignes: [
        { g: '« Tu peux ranger ? » <i>— une question autorise un non</i>', d: '« Mets les Lego dans la caisse bleue. »' },
        { g: '« Ne cours pas » <i>— dit ce qu’il faut arrêter</i>', d: '« Tu marches jusqu’à la porte. »' },
        { g: '« Range et va te laver » <i>— deux consignes</i>', d: 'Une seule. La suivante quand celle-là est finie.' },
        { g: '« Sois sage » <i>— ne se filme pas</i>', d: '« Tu restes assis jusqu’au dessert. »' },
        { g: 'Lancée d’une autre pièce <i>— peut-être jamais entendue</i>', d: 'En face, après le prénom, à portée de voix.' },
      ],
      legende: 'Puis cinq secondes de silence — comptées, pas estimées. C’est la partie la plus dure.',
    },
    arbre: {
      titre: 'LIRE LE RELEVÉ, LIGNE PAR LIGNE',
      question: 'Pour UNE consigne : que montrent ses dix jours&nbsp;? (F = faite, A = avec aide, N = non faite)',
      branches: [
        { si: 'Surtout des F', alors: 'ELLE EST BONNE', d: 'on la garde, on peut en ajouter une au cycle suivant' },
        { si: 'Surtout des A', alors: 'LA TÂCHE EST TROP GROSSE', d: 'on la découpe en deux, ou on réduit l’aide d’un cran' },
        { si: 'Surtout des N, toujours la même', alors: 'CE N’EST PAS L’OBÉISSANCE', d: 'la réécrire, changer son moment, ou la retirer un mois' },
        { si: 'Des N partout, certains jours', alors: 'CE SONT LES JOURNÉES', d: 'fatigue, retour de week-end, douleur : on allège ces jours-là' },
      ],
    },
    erreurs: [
      'Faire une moyenne sur les cinq consignes : elle ne dit rien. <b>L’information est ligne par ligne.</b>',
      'Trier avant : ce qui est négociable et ce qui ne l’est pas se décide à froid, pas dans l’instant.',
      'Répéter la consigne pendant les cinq secondes : on recommence le compteur à zéro.',
      'Plus de trois essais sur une consigne. Au quatrième, le problème n’est plus la consigne.',
    ],
    retenir: [
      'Cinq mots, un verbe d’action, une seule chose.',
      'Cinq secondes de silence, comptées.',
      'Décidez maintenant ce qui se passe au bout des cinq secondes.',
    ],
    grille: {
      titre: 'LA GRILLE À RECOPIER — 10 JOURS, 5 CROIX PAR JOUR',
      colonnes: ['Jour', 'Consigne 1', 'Consigne 2', 'Consigne 3', 'Consigne 4', 'Consigne 5'],
      note:
        'F = faite après la consigne seule · A = faite avec aide · N = pas faite · — = la consigne ne s’appliquait pas ce jour-là.',
    },
    astuces: [
      { i: '🔢', t: 'Comptez une heure de consignes avant de conclure quoi que ce soit.' },
      { i: '🎯', t: 'Un seul moment, et moins de consignes qu’aujourd’hui.' },
      { i: '👥', t: 'La feuille doit être applicable par quelqu’un d’autre que vous.' },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════ 8 */
  {
    slug: 'lire-un-comportement-comme-une-reaction-de-survie',
    titre: 'LIRE UN COMPORTEMENT',
    titre2: 'COMME UNE RÉACTION DE SURVIE',
    accent: '#0d9488',
    accentDoux: '#f0fdfa',
    thematique: 'Comprendre le comportement',
    ruban: 'Changer de question',
    emoji: '🧭',
    duree: '4 modules · 48 min de lecture · 15 jours de réglage',
    competence:
      'Transformer une lecture en réglage concret du quotidien, l’appliquer quinze jours, et l’écrire dans un rapport sans poser de diagnostic.',
    avertissement:
      'Cette lecture n’est pas un diagnostic et ne dit rien de l’histoire réelle d’une personne. Elle ne remplace ni une évaluation, ni un accompagnement thérapeutique.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        'On abandonne « <i>pourquoi il me fait ça&nbsp;?</i> » — qui mène à l’intention, donc à l’affrontement, et presque toujours sans réponse.',
        'On adopte « <i>à quoi cela a-t-il pu servir, là d’où il vient&nbsp;?</i> » — qui mène à une hypothèse, donc à quelque chose à essayer.',
        '<b>Une lecture qui ne change rien n’a servi qu’aux adultes.</b> Chaque lecture doit aboutir à un réglage du quotidien.',
      ],
      test: 'Dans quel contexte cette conduite serait-elle une bonne idée&nbsp;? Il y en a presque toujours un.',
    },
    parcours: [
      { quoi: 'Changer de question, sept conduites, les trois pièges', produit: 'une conduite relue' },
      { quoi: 'Les provisions de Yasmine : une réponse qui confirme tout', produit: 'ce que notre réponse enseigne' },
      { quoi: 'De la lecture au réglage, et les huit réglages qui reviennent', produit: 'votre fiche lecture → réglage' },
      { quoi: 'Quinze jours, et ce qu’on écrit dans un rapport', produit: 'un paragraphe sans diagnostic' },
    ],
    releve: 'Entre le module 3 et le module 4 : <b>quinze jours de réglage, trente secondes de relevé par jour.</b>',
    figure: {
      titre: 'LA BOUCLE QUE PERSONNE NE VOIT',
      type: 'boucle',
      cases: [
        { t: 'CE QU’IL A APPRIS', d: 'ailleurs, et qui était vrai là-bas' },
        { t: 'LA CONDUITE', d: 'qui protégeait, et qui déroute ici' },
        { t: 'NOTRE RÉPONSE', d: 'raisonnable, bien intentionnée' },
      ],
      retour: 'et elle confirme, sans le vouloir, ce qu’il avait appris',
      legende: 'La réponse ordinaire redit à l’enfant que la nourriture n’est pas garantie, que les adultes partent. Le réglage sert à casser cette boucle-là.',
    },
    arbre: {
      titre: 'DEUX QUESTIONS, DEUX DESTINATIONS',
      question: 'Devant une conduite qui déroute, laquelle des deux vous posez-vous&nbsp;?',
      branches: [
        { si: '« Pourquoi il me fait ça ? »', alors: 'VERS L’INTENTION', d: 'donc vers la relation, donc vers l’affrontement — et presque toujours sans réponse' },
        { si: '« À quoi cela a-t-il pu servir, là d’où il vient ? »', alors: 'VERS UNE HYPOTHÈSE', d: 'donc vers quelque chose à essayer, à tester en quinze jours' },
      ],
    },
    erreurs: [
      'Prendre l’hypothèse pour une histoire vraie et la raconter à d’autres comme un fait.',
      'Tout lire comme une réaction de survie : douleur, effet médicamenteux, trouble sensoriel ne se lisent <b>pas</b> ainsi.',
      'S’arrêter à la lecture, sans réglage. C’est le piège le plus fréquent, et le plus confortable.',
      'Écrire la ligne 3 en accusant quelqu’un : ni la famille, ni le collègue, ni l’institution d’avant.',
    ],
    retenir: [
      'La question décide de la destination.',
      'Cinq lignes : de la conduite au réglage.',
      'Un réglage n’est jamais une récompense, ni une faveur.',
    ],
    grille: {
      titre: 'LA GRILLE À RECOPIER — 15 JOURS, 30 SECONDES PAR JOUR',
      colonnes: ['Jour', 'La conduite', 'Le réglage a été tenu', 'Autre chose ce jour-là'],
      note:
        'La deuxième colonne explique la première : un jour où le réglage n’a pas tenu n’est pas un jour testé.',
    },
    astuces: [
      { i: '🔁', t: 'Demandez-vous ce que votre réponse enseigne, pas ce qu’elle corrige.' },
      { i: '🧾', t: 'Un rapport décrit ce qui a été essayé et observé — jamais un diagnostic.' },
      { i: '🤝', t: 'Un réglage qui tient est un réglage qu’un collègue peut appliquer sans vous.' },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════ 9 */
  {
    slug: 'preparer-une-equipe-de-suivi-de-la-scolarisation',
    titre: 'PRÉPARER UNE ÉQUIPE DE SUIVI',
    titre2: 'DE LA SCOLARISATION (ESS)',
    accent: '#c026d3',
    accentDoux: '#fdf4ff',
    thematique: 'Parcours et institutions',
    ruban: 'Ce qui est écrit, pas ce qui est dit',
    emoji: '🏫',
    duree: '4 modules · 50 min de lecture · la réunion, puis 15 jours',
    competence:
      'Préparer une page recto qui produit de l’écrit dans le GEVA-Sco, et vérifier après la réunion ce qui a réellement été écrit.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        '<b>L’ESS n’attribue aucun droit.</b> Elle constate, elle propose, et surtout elle <b>écrit</b>. Ce qu’elle écrit, la MDPH le lit.',
        'Le compte rendu que vous cherchez n’existe pas : c’est le <b>GEVA-Sco réexamen</b>, rempli par l’enseignant référent, qui en tient lieu.',
        'On ne travaille donc pas à être entendu. <b>On travaille à ce qui sera écrit.</b>',
      ],
      test: 'Chaque phrase que je prépare pourrait-elle être recopiée telle quelle dans un document officiel&nbsp;?',
    },
    parcours: [
      { quoi: 'Ce qu’est une ESS, et ce qu’elle peut écrire', produit: 'le repérage avant la réunion' },
      { quoi: 'L’ESS de Noam : une réunion cordiale qui ne produit rien', produit: 'votre dernière réunion relue' },
      { quoi: 'La feuille d’une page, en trois blocs', produit: 'votre feuille d’une page' },
      { quoi: 'La relecture du GEVA-Sco, et la suite', produit: 'un écrit vérifié' },
    ],
    releve: 'Entre le module 3 et le module 4 : <b>la réunion, puis quinze jours</b> pour vérifier ce qui a été écrit et ce qui a été fait. Le module 4 se lit une fois le GEVA-Sco reçu — ou quinze jours après, ce qui est déjà une information.',
    figure: {
      titre: 'OÙ VA CE QUI SE DIT EN RÉUNION',
      type: 'flux',
      cases: [
        { t: 'L’ESS', d: 'constate, propose, et surtout ÉCRIT' },
        { t: 'GEVA-Sco réexamen', d: 'rempli par l’enseignant référent, il vaut compte rendu' },
        { t: 'Équipe pluridisciplinaire', d: 'à la MDPH, elle évalue sur ce qu’elle lit' },
        { t: 'CDAPH', d: 'décide les droits : aide humaine, matériel, orientation' },
      ],
      legende: 'Quatre étapes, et une seule à laquelle vous assistez. D’où la règle du parcours.',
    },
    arbre: {
      titre: 'LA FEUILLE D’UNE PAGE, EN TROIS BLOCS',
      question: 'Une page recto, lue à voix haute en moins de trois minutes.',
      branches: [
        { si: 'Bloc 1', alors: 'CE QUI A CHANGÉ', d: 'trois lignes datées, dans les deux sens — les progrès comme les reculs' },
        { si: 'Bloc 2', alors: 'DEUX OU TROIS FAITS', d: 'situation · mesure · période · ce qui a été essayé' },
        { si: 'Bloc 3', alors: 'UNE DEMANDE', d: 'écrite pour être recopiée telle quelle dans le GEVA-Sco' },
      ],
    },
    erreurs: [
      'Confondre l’ESS et la CDAPH : demander à la réunion une décision qu’elle n’a pas le pouvoir de prendre.',
      'Arriver avec un ressenti plutôt qu’avec deux ou trois faits datés et mesurés.',
      'Repartir sans avoir entendu quelqu’un dire ce qui sera écrit. La phrase se demande, poliment, avant la fin.',
      'Ne pas réclamer le GEVA-Sco. Ne pas l’avoir reçu au bout de quinze jours est en soi une information à traiter.',
    ],
    retenir: [
      'Une page recto, trois blocs, trois minutes.',
      'Des faits datés, jamais un ressenti seul.',
      'Ce qui compte est ce qui reste écrit après la réunion.',
    ],
    grille: {
      titre: 'LA GRILLE DE RELECTURE DU GEVA-SCO',
      colonnes: ['Mes faits', 'Ma demande', 'Les décisions', 'Ce qui est écrit sur l’enfant'],
      note:
        'Une demande transformée en « vigilance » ou en « à réfléchir » a disparu. Une décision sans nom ni date est une intention.',
    },
    astuces: [
      { i: '📄', t: 'Apportez la feuille en trois exemplaires : elle circule mieux qu’elle ne se raconte.' },
      { i: '🗣️', t: 'Trois façons de dire les choses difficiles sont travaillées au module 2.' },
      { i: '📬', t: 'Notez la date de la réunion et celle où vous relancerez pour le GEVA-Sco.' },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════ 10 */
  {
    slug: 'aider-a-demarrer-une-tache',
    titre: 'AIDER QUELQU’UN',
    titre2: 'À DÉMARRER UNE TÂCHE',
    accent: '#16a34a',
    accentDoux: '#f0fdf4',
    thematique: 'Apprentissages et autonomie',
    ruban: 'Les trente premières secondes',
    emoji: '🚀',
    duree: '4 modules · 40 min de lecture · 10 jours de relevé',
    competence:
      'Identifier ce qui coûte à l’entrée d’une tâche, agir sur les six leviers correspondants, et mesurer un délai plutôt qu’une motivation.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        '<b>Ce n’est presque jamais la tâche qui bloque, c’est l’entrée dans la tâche.</b> Une fois la première action faite, la suite s’enchaîne souvent seule.',
        'Conséquence : expliquer mieux, motiver, encourager n’a presque aucun effet. Ce qui en a un, c’est <b>réduire le coût des trente premières secondes</b>.',
        'On mesure <b>un délai</b> — le temps avant le premier geste — jamais une motivation.',
      ],
      test: 'Combien de secondes entre la consigne et le premier geste&nbsp;? Un seul chiffre, chaque jour.',
    },
    parcours: [
      { quoi: 'Les six coûts d’entrée et les six leviers', produit: 'vos deux leviers choisis' },
      { quoi: 'Une matinée en ESAT, chronomètre en main', produit: 'une matinée analysée' },
      { quoi: 'La fiche de démarrage', produit: 'votre fiche de démarrage' },
      { quoi: 'Dix jours, un chiffre par jour, la lecture', produit: 'une décision datée' },
    ],
    releve: 'Entre le module 3 et le module 4 : <b>dix jours, un seul chiffre par jour</b> — le délai avant le premier geste. C’est le relevé le plus court du catalogue, et celui qui bouge le plus vite.',
    figure: {
      titre: 'SIX COÛTS, SIX LEVIERS',
      type: 'paires',
      gauche: 'Ce qui coûte à l’entrée',
      droite: 'Ce qui le lève',
      lignes: [
        { g: 'Le matériel est à réunir', d: 'Il est prêt et visible <b>avant</b> qu’on demande' },
        { g: 'La première action est indéterminée', d: 'Une première action nommée, une seule, au mot près' },
        { g: 'On ne sait pas quand ça finit', d: 'Une fin visible : un nombre, un bac qui se vide' },
        { g: 'La page a l’air difficile', d: 'Une première marche très basse : masquer le reste' },
        { g: 'Il faut arrêter ce qui est en cours', d: 'Une transition annoncée, avec une fin donnée à l’activité' },
        { g: 'Cette tâche a déjà raté quinze fois', d: 'Le droit à l’imparfait, dit : « on essaie, on efface »' },
      ],
      legende: 'Deux leviers tenus tous les jours valent mieux que six tenus trois jours. Commencez par les deux premiers.',
    },
    arbre: {
      titre: 'LIRE LE RELEVÉ AU DIXIÈME JOUR',
      question: 'Le délai a-t-il bougé — et la préparation a-t-elle été faite&nbsp;?',
      branches: [
        { si: 'Le délai baisse, préparation faite', alors: 'LA FICHE FONCTIONNE', d: 'on la garde un mois, puis on retire l’amorçage' },
        { si: 'Le délai ne bouge pas, préparation faite', alors: 'CE N’EST PAS LE DÉMARRAGE', d: 'on change de parcours plutôt que d’insister' },
        { si: 'Préparation faite moins de 8 jours sur 10', alors: 'RIEN N’A ÉTÉ TESTÉ', d: 'on réduit la préparation jusqu’à ce qu’elle tienne' },
        { si: 'Le délai baisse, l’amorçage reste nécessaire', alors: 'UNE ÉTAPE, PAS UN ÉCHEC', d: 'on garde, et on prépare le retrait' },
      ],
    },
    erreurs: [
      'Travailler la motivation. Elle n’est pas mesurable, et ce n’est pas là que le blocage se trouve.',
      'Tenir les six leviers d’un coup : deux tenus dix jours valent mieux que six tenus trois.',
      'Oublier la deuxième colonne du relevé : <b>un jour sans préparation n’est pas un jour testé.</b>',
      'Garder l’amorçage indéfiniment : il se retire, comme toute aide.',
    ],
    retenir: [
      'Le matériel prêt avant qu’on demande.',
      'Une première action nommée, une seule, au mot près.',
      'Une fin visible change plus qu’un encouragement.',
    ],
    grille: {
      titre: 'LA GRILLE À RECOPIER — 10 JOURS, UN CHIFFRE PAR JOUR',
      colonnes: ['Jour', 'Délai avant le 1er geste', 'Préparation faite ?', 'Amorçage nécessaire ?', 'Tâche terminée ?'],
      note:
        'La dernière colonne protège d’une erreur de lecture : un démarrage rapide suivi d’un abandon n’est pas un progrès.',
    },
    astuces: [
      { i: '⏲️', t: 'Un chronomètre de téléphone suffit. Un chiffre, pas une appréciation.' },
      { i: '🧰', t: 'Préparez le matériel la veille : c’est le levier le plus rentable des six.' },
      { i: '🧽', t: '« On essaie, on efface » : le droit à l’imparfait lève la peur d’entrer.' },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════ 11 */
  {
    slug: 'renforcer-ce-qui-va',
    titre: 'RENFORCER',
    titre2: 'CE QUI VA',
    accent: '#0d9488',
    accentDoux: '#f0fdfa',
    thematique: 'Comportements-défis et opposition',
    ruban: 'À l’effet, jamais à l’intention',
    emoji: '🌱',
    duree: '4 modules · 46 min de lecture · 10 jours de relevé',
    competence:
      'Poser une fiche de renforcement sur un comportement qui existe déjà, la tenir dix jours, lire le relevé et espacer sans tout perdre.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        '<b>On ne peut renforcer que ce qui existe déjà.</b> Même rarement, même mal — mais cela doit être apparu. Sinon c’est un objectif d’enseignement, pas de renforcement.',
        '<b>Est renforçateur ce qui fait augmenter le comportement</b>, et rien d’autre. L’intention de l’adulte n’entre pas dans la définition : cela se constate, cela ne se décide pas.',
        'Trois réglages décident du résultat, et un seul est gratuit : <b>le délai</b>, le critère, la fréquence.',
      ],
      test: 'Est-ce que ce comportement est déjà apparu au moins une fois cette semaine&nbsp;? Si non, ce n’est pas ce parcours.',
    },
    parcours: [
      { quoi: 'La phrase qui trie, la définition, les trois réglages', produit: 'la règle des trois réglages' },
      { quoi: 'Un tableau qui s’effondre en neuf jours, disséqué', produit: 'un dispositif disséqué' },
      { quoi: 'La fiche de renforcement, rubrique par rubrique', produit: 'votre fiche de renforcement' },
      { quoi: 'Dix jours de relevé, la lecture, puis l’espacement', produit: 'une décision, et un plan de retrait' },
    ],
    releve: 'Entre le module 3 et le module 4 : <b>dix jours, deux chiffres par jour</b> — combien de fois le comportement est apparu, combien de fois vous l’avez remarqué. Moins de dix jours ne montre aucune tendance.',
    figure: {
      titre: 'CE QU’ON CROIT RENFORÇANT, ET CE QUI L’EST',
      type: 'paires',
      gauche: 'Ce que l’adulte met en place',
      droite: 'Ce que ça vaut vraiment',
      lignes: [
        { g: '« Bravo&nbsp;! » lancé à la cantonade', d: 'Souvent rien : trop vague pour dire QUEL comportement est visé' },
        { g: 'Une image en fin de semaine', d: 'Trop tard de plusieurs jours. Ce qui est renforcé, c’est le vendredi' },
        { g: 'Un compliment devant le groupe', d: 'Renforçateur pour certains, <b>punition pour d’autres</b>. Cela se teste' },
        { g: 'Un bonbon quand l’adulte y pense', d: 'Irrégulier, donc illisible — et l’effet tombe dès qu’elle n’a plus faim' },
        { g: 'Nommer le comportement en 3 secondes', d: '<b>Le seul qui marche à tous les coups</b>, et il est gratuit' },
      ],
      legende: 'Quatre lignes sur cinq coûtent de l’argent ou du matériel ; la cinquième, gratuite, est la plus efficace.',
    },
    arbre: {
      titre: 'ÇA N’AUGMENTE PAS. DANS QUEL ORDRE CHERCHER',
      question: 'Après dix jours, la colonne « apparu » ne monte pas. Que regarder, et dans cet ordre&nbsp;?',
      branches: [
        { si: '1. Le délai', alors: 'CHRONOMÈTRE EN MAIN', d: 'sur trois occasions. Au-delà de 30 s, le reste ne sert à rien' },
        { si: '2. Le renforçateur', alors: 'REPRENDRE LA LISTE', d: 'ce que vous donnez n’en est peut-être pas un pour cette personne' },
        { si: '3. Le critère', alors: 'L’ABAISSER', d: 'jusqu’à ce que le comportement apparaisse au moins une fois par jour' },
        { si: '« Remarqué » ≪ « apparu »', alors: 'RIEN N’A ÉTÉ TESTÉ', d: 'le dispositif n’a pas été tenu : le relevé ne dit rien de la personne' },
      ],
    },
    erreurs: [
      '<b>Retirer un point déjà gagné.</b> Le dispositif devient une punition, et la confiance ne revient pas.',
      'Mettre un besoin fondamental dans le dispositif — repas, sommeil, soins, sortie, lien familial, et surtout <b>le moyen de communication</b>. Ce sont des droits.',
      'Supposer qu’un compliment public est un renforçateur : il est aversif pour une partie des personnes accompagnées. Cela se teste.',
      'Ne pas écrire à qui sert le comportement. Si la réponse est « à l’équipe », on renonce.',
    ],
    retenir: [
      'Un renforçateur se reconnaît à l’effet, jamais à l’intention.',
      'Trois secondes, un critère juste en dessous du niveau observé.',
      'On espace, on n’arrête jamais net : l’irrégulier est plus solide que le continu.',
    ],
    grille: {
      titre: 'LA GRILLE À RECOPIER — 10 JOURS, DEUX CHIFFRES PAR JOUR',
      colonnes: ['Jour', 'Apparu (combien de fois)', 'Remarqué (combien de fois)', 'Un mot s’il s’est passé quelque chose'],
      note:
        'Les deux colonnes ne disent pas la même chose : la seconde mesure ce que l’équipe a tenu, pas ce que la personne a fait.',
    },
    astuces: [
      { i: '⏱️', t: 'Écrivez la phrase de remarque mot pour mot : improvisée, elle arrive trop tard et trop vague.' },
      { i: '📋', t: 'Notez les noms de qui tient le dispositif. Tenu par une personne sur trois, il ne produit rien de lisible.' },
      { i: '🌡️', t: 'Une chute de deux ou trois jours est du bruit. Comparez semaine à semaine, jamais jour à jour.' },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════ 12 */
  {
    slug: 'decrire-un-comportement-sans-le-juger',
    titre: 'DÉCRIRE UN COMPORTEMENT',
    titre2: 'SANS LE JUGER',
    accent: '#4f46e5',
    accentDoux: '#eef2ff',
    thematique: 'Observer et écrire',
    ruban: 'Le test de la caméra',
    emoji: '📹',
    duree: '4 modules · 46 min de lecture · 7 jours de relevé',
    competence:
      'Écrire une observation qu’une caméra aurait pu enregistrer, annoncer ses hypothèses comme telles, et relire un écrit avant qu’il ne circule.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        '<b>Le test de la caméra</b> : une caméra posée dans la pièce aurait-elle enregistré ce que je viens d’écrire&nbsp;? Elle ne filme ni les intentions, ni les motivations, ni les diagnostics.',
        'Penser est le métier. <b>Une hypothèse s’annonce</b> — « je fais l’hypothèse que… » — elle ne se glisse pas au milieu des faits.',
        'Chaque recopie perd du contexte et garde les adjectifs : <b>seuls les faits survivent au trajet</b> du cahier jusqu’au dossier suivant.',
      ],
      test: 'Une caméra aurait-elle filmé cette phrase&nbsp;? Si non, c’est une pensée — elle s’annonce ou elle s’enlève.',
    },
    parcours: [
      { quoi: 'Le test de la caméra, et les mots qui trompent', produit: 'le test de la caméra' },
      { quoi: 'Comment une phrase du soir devient une orientation', produit: 'un écrit qui a fait dérailler une décision' },
      { quoi: 'La grille en trois colonnes, et le gabarit en trois lignes', produit: 'votre grille en trois colonnes' },
      { quoi: 'Sept jours de vos écrits, relus en quatre passes', produit: 'la relecture de vos propres écrits' },
    ],
    releve: 'Entre le module 3 et le module 4 : <b>sept jours, une observation écrite par jour, trois lignes</b>. Le seul relevé du catalogue qui porte sur ce que VOUS produisez.',
    figure: {
      titre: 'LES MOTS QUI FONT PASSER UNE OPINION POUR UN FAIT',
      type: 'paires',
      gauche: 'Ce qui s’écrit spontanément',
      droite: 'Ce qui a réellement été vu',
      lignes: [
        { g: '« Il a été agressif »', d: '« Il a jeté sa chaise contre le mur. » Le lecteur jugera lui-même' },
        { g: '« Il refuse de participer »', d: '« Il est resté assis pendant les vingt minutes de l’atelier »' },
        { g: '« Il cherche l’attention »', d: 'Une motivation ne se voit pas. Écrivez ce qu’il a fait, et ce qui a suivi' },
        { g: '« Il est manipulateur »', d: 'Aucune caméra ne filme une manipulation. Ce mot collera des années' },
        { g: '« La mère est dans le déni »', d: 'Rapportez ses mots : « Mme X nous a dit ne pas constater… »' },
        { g: '« Comportement inadapté »', d: 'Inadapté à quoi, et selon qui&nbsp;? Nommez situation et comportement' },
      ],
      legende: 'Aucun de ces mots n’est interdit : ils sont à leur place dans une hypothèse annoncée, jamais dans le récit des faits.',
    },
    arbre: {
      titre: 'LE TEST DE LA CAMÉRA, TROIS ISSUES',
      question: 'Une caméra aurait-elle enregistré ce que vous venez d’écrire&nbsp;?',
      branches: [
        { si: 'Oui, elle l’aurait filmé', alors: 'C’EST UN FAIT', d: 'ça s’écrit tel quel, avec l’heure et le lieu' },
        { si: 'Non, mais je l’ai déduit', alors: 'C’EST UNE HYPOTHÈSE', d: 'elle s’annonce : « je fais l’hypothèse que… »' },
        { si: 'Non, c’est un mot de métier', alors: 'C’EST UN JUGEMENT', d: '« opposant », « immature », « en demande » : on le remplace par ce qui a été vu' },
        { si: 'Ce n’est que du négatif', alors: 'C’EST INCOMPLET', d: 'le cadre de 2021 impose l’équilibre : difficultés ET points d’appui' },
      ],
    },
    erreurs: [
      'Écrire un diagnostic sous une signature éducative. On rapporte un diagnostic existant en citant qui l’a posé ; on n’en formule jamais.',
      'Oublier ce que l’adulte a fait juste avant : <b>c’est l’élément le plus souvent absent</b>, et un comportement sans antécédent paraît surgir de la personne.',
      'Croire qu’écrire des faits, c’est écrire sans penser ou écrire froidement. « Il pleurait » est filmable.',
      'Ne rapporter que les difficultés : un écrit factuel mais à charge reste à charge.',
    ],
    retenir: [
      'Une caméra ne filme ni les intentions ni les diagnostics.',
      'Ce qui a précédé, écrit à chaque fois — y compris ce que l’adulte a dit.',
      'La personne a accès à son dossier (art. L311-3 CASF). Écrivez en le sachant.',
    ],
    grille: {
      titre: 'LA GRILLE À RECOPIER — 7 JOURS, TROIS COLONNES',
      colonnes: ['Ce que j’ai vu (filmable)', 'Ce que j’en ai pensé', 'Ce que j’écris'],
      note:
        'On remplit la colonne 2 en premier, puis on cherche ce qui l’a produite. Ce n’est pas une colonne de honte : elle existe pour que la pensée ne se déguise pas en observation.',
    },
    astuces: [
      { i: '🕰️', t: 'Écrivez le jour même. Une observation reconstituée le vendredi est déjà une interprétation.' },
      { i: '🧾', t: 'Trois lignes suffisent : quand, où, ce qui a précédé, ce qui s’est passé.' },
      { i: '👀', t: 'Relisez en cherchant les adjectifs : ce sont eux qui survivent aux recopies.' },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════ 13 */
  {
    slug: 'mesurer-un-comportement-ligne-de-base',
    titre: 'MESURER UN COMPORTEMENT',
    titre2: 'LIGNE DE BASE ET COURBE',
    accent: '#b45309',
    accentDoux: '#fef3c7',
    thematique: 'Observer et écrire',
    ruban: 'Trois jours ne font pas une tendance',
    emoji: '📊',
    duree: '4 modules · 46 min de lecture · 10 jours de relevé',
    competence:
      'Choisir une unité, tenir dix jours de ligne de base, tracer la courbe et la lire sans se laisser avoir par trois bonnes journées.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        '<b>La ligne de base</b> : dix jours où l’on ne change RIEN. C’est la partie que tout le monde saute, et sans elle la suite ne veut rien dire — on ne sait pas d’où l’on part.',
        '<b>Une seule unité</b>, choisie sur ce qui pose problème : fréquence si ça revient trop, durée si ça dure trop, latence si ça met trop de temps à démarrer.',
        '<b>La médiane, jamais la moyenne.</b> Une journée exceptionnelle déplace une moyenne et vous fait voir un progrès qui n’existe pas.',
      ],
      test: 'Une caméra aurait-elle compté la même chose que moi&nbsp;? Si deux collègues ne comptent pas pareil, la courbe mesure qui était de service.',
    },
    parcours: [
      { quoi: 'Ce qu’on mesure, et ce qu’on ne mesure pas', produit: 'l’unité de mesure de VOTRE situation' },
      { quoi: 'La ligne de base, et pourquoi on ne change rien pendant', produit: 'la décision sur la ligne de base' },
      { quoi: 'La feuille, le test d’accord, les dix jours', produit: 'votre feuille de relevé, testée à deux' },
      { quoi: 'Lire la courbe : progrès, variation, ou rien', produit: 'la lecture de votre courbe' },
    ],
    releve: 'Entre le module 3 et le module 4 : <b>dix jours de relevé, une ligne par jour, même les jours à zéro</b>. Le module 4 porte sur VOTRE courbe — il ne peut pas être fait avant.',
    figure: {
      titre: 'LES TROIS QUESTIONS À POSER À UNE COURBE',
      type: 'paires',
      gauche: 'Ce qu’on regarde',
      droite: 'Ce que ça veut dire, et ce que ça ne veut pas dire',
      lignes: [
        { g: '<b>Le niveau</b><br>Où se situe le nuage de points&nbsp;?', d: 'La médiane des dix points d’après, comparée à celle des dix d’avant. Le signal le plus simple et le plus solide' },
        { g: '<b>La pente</b><br>Ça monte, ça descend, ou c’est plat&nbsp;?', d: 'Une pente était peut-être déjà là AVANT. Si la ligne de base descendait déjà, le dispositif n’a peut-être rien fait' },
        { g: '<b>La variabilité</b><br>Points serrés ou dispersés&nbsp;?', d: 'Une courbe qui se resserre sans descendre est un vrai progrès : les journées catastrophiques ont disparu' },
        { g: '<b>Et l’intensité&nbsp;?</b><br>L’échelle de 1 à 5', d: 'Elle s’estime au lieu de se compter : elle varie avec la fatigue de celui qui note. On la remplace par une question fermée' },
      ],
      legende: 'On répond aux trois dans cet ordre. Beaucoup d’équipes ne regardent que la pente, qui est la plus trompeuse des trois.',
    },
    arbre: {
      titre: 'LA RÈGLE DES TROIS POINTS',
      question: 'Combien de points consécutifs sont sortis de la zone habituelle&nbsp;?',
      branches: [
        { si: 'Un ou deux', alors: 'CE N’EST RIEN', d: 'une bonne journée existe, une mauvaise aussi. On ne change rien et on continue de relever' },
        { si: 'Trois ou plus', alors: 'C’EST UN SIGNAL', d: 'on le note, on continue cinq jours, on regarde si ça tient. Un signal n’est pas une conclusion' },
        { si: 'Tous, d’un coup', alors: 'MÉFIANCE', d: 'un changement brutal et total vient plus souvent d’ailleurs : vacances, absence d’un collègue, maladie' },
        { si: 'Rien en quatre semaines', alors: 'L’HYPOTHÈSE ÉTAIT FAUSSE', d: 'ce n’est pas la personne qui est en cause. Retour aux quatre fonctions' },
      ],
    },
    erreurs: [
      'Attendre dix jours de ligne de base quand quelqu’un se met en danger. <b>Il n’y a pas de ligne de base quand il y a danger</b> : on agit immédiatement, et on écrit « pas de ligne de base, motif sécurité ».',
      'Mesurer ce qui gêne l’équipe plutôt que ce qui coûte à la personne. C’est le seul point qui transforme l’outil en son contraire.',
      'Changer trois choses le même jour : la courbe bougera, et on ne saura jamais laquelle a agi.',
      'Laisser une case vide au lieu d’écrire zéro. Au module 4, on ne saura plus si c’était un jour calme ou un jour non relevé.',
    ],
    retenir: [
      'Dix jours sans rien changer, puis UNE chose, avec la date écrite sur la feuille.',
      'Trois points consécutifs font un signal, jamais une conclusion.',
      'On mesure un comportement dans un contexte, jamais quelqu’un : aucun chiffre accolé à un nom. La personne a accès à son dossier (art. L311-3 CASF).',
    ],
    grille: {
      titre: 'LA FEUILLE À RECOPIER — 10 JOURS, SIX COLONNES',
      colonnes: ['Date', 'Qui relève', 'La mesure', 'Créneau respecté ?', 'Inhabituel (3 mots)', 'Question fermée'],
      note:
        'Affichée là où le comportement se produit, avec un stylo accroché. La colonne « inhabituel » n’est pas facultative : c’est elle qui évite de croire à un progrès qui n’était que les vacances scolaires.',
    },
    astuces: [
      { i: '✌️', t: 'Le test d’accord : deux personnes comptent le même créneau, séparément. Si les nombres diffèrent, c’est la définition qu’il faut reprendre.' },
      { i: '📐', t: 'Un point par jour, tracé à la main sur du papier quadrillé. Le tableur que personne n’ouvre ne vaut pas la feuille punaisée.' },
      { i: '🛑', t: 'Quand ça ne coûte plus rien à la personne, on arrête. Une mesure qui ne s’arrête jamais devient une habitude de service.' },
    ],
  },

  /* ═══════════════════════════════════════════════════════════════════════ 14 */
  {
    slug: 'resoudre-un-probleme-avec-la-personne',
    titre: 'RÉSOUDRE UN PROBLÈME AVEC LA PERSONNE',
    titre2: 'PLUTÔT QUE CONTRE ELLE',
    accent: '#0f766e',
    accentDoux: '#ccfbf1',
    thematique: 'Observer et écrire',
    ruban: 'Chercher la solution à deux',
    emoji: '🤝',
    duree: '4 modules · 46 min de lecture · 10 jours avant la relecture',
    competence:
      'Trier ce qui se cherche à deux, tenir les trois temps d’une conversation, écrire un accord que l’autre peut redire, et le relire dix jours plus tard.',
    notion: {
      titre: 'LA NOTION CLÉ',
      points: [
        '<b>Une solution imposée obtient l’arrêt</b>, souvent tout de suite. Elle ne marche que tant que vous êtes là — c’est le comportement normal d’une solution à laquelle une des deux personnes n’a pas participé.',
        '<b>Trois temps, dans cet ordre&nbsp;:</b> son point de vue jusqu’au «&nbsp;oui, c’est ça&nbsp;», le vôtre en deux phrases, puis la recherche à deux. Commencer par le temps 2 transforme la conversation en annonce.',
        '<b>Un accord se juge à une seule chose&nbsp;: qui a eu l’idée.</b> Proposé par la personne, il tient&nbsp;; accepté poliment, il déplace juste l’effort sur vous.',
      ],
      test: 'Est-ce que je connais déjà la solution&nbsp;? Si oui, ce n’est pas une recherche, c’est une annonce — et l’autre le sentira avant vous.',
    },
    parcours: [
      { quoi: 'Ce qu’une solution imposée ne peut pas faire', produit: 'le tri de vos trois problèmes' },
      { quoi: 'La conversation qui s’est arrêtée à la troisième réplique', produit: 'une conversation ratée, disséquée' },
      { quoi: 'Les trois temps, écrits mot pour mot', produit: 'votre conversation préparée, puis tenue' },
      { quoi: 'Tenir l’accord, et quand il ne tient pas', produit: 'l’accord relu, et le deuxième tour' },
    ],
    releve: 'Entre le module 3 et le module 4&nbsp;: vous tenez la conversation, puis <b>dix jours</b> avant la relecture. Une ligne par OCCASION, pas une par jour — compter les jours où rien ne pouvait se produire fabrique un faux échec.',
    figure: {
      titre: 'CE QUI FERME, ET CE QUI OUVRE',
      type: 'paires',
      gauche: 'Ce qui vient spontanément',
      droite: 'Ce qui laisse la conversation ouverte',
      lignes: [
        { g: '«&nbsp;Pourquoi tu as fait ça&nbsp;?&nbsp;»', d: '«&nbsp;J’ai remarqué que… Qu’est-ce qui se passe, à ce moment-là&nbsp;?&nbsp;» — une information, pas une justification' },
        { g: '«&nbsp;Tu sais bien que c’est interdit.&nbsp;»', d: 'Rien. On ne rappelle pas la règle au temps 1&nbsp;: elle la connaît' },
        { g: '«&nbsp;Ce qu’il faudrait, c’est que tu…&nbsp;»', d: '«&nbsp;Comment on pourrait faire pour que ça marche pour toi ET pour moi&nbsp;?&nbsp;»' },
        { g: '«&nbsp;Tu es d’accord&nbsp;?&nbsp;»', d: '«&nbsp;Redis-moi ce qu’on a décidé&nbsp;?&nbsp;» — un accord qu’on ne peut pas redire n’a pas été compris' },
        { g: 'Le silence qu’on remplit au bout de trois secondes', d: 'Le silence qu’on laisse durer dix. Ce que vous y mettez est ce que l’autre n’aura pas dit' },
      ],
      legende: 'Aucune de ces phrases n’est mauvaise en soi. Elles le sont AU TEMPS 1, où elles annoncent que la solution est déjà trouvée.',
    },
    arbre: {
      titre: 'QUELLE SORTE DE PROBLÈME AVEZ-VOUS DEVANT VOUS&nbsp;?',
      question: 'Avant d’ouvrir la bouche&nbsp;: de quoi s’agit-il exactement&nbsp;?',
      branches: [
        { si: 'Quelqu’un est en danger, maintenant', alors: 'ON AGIT', d: 'la conversation viendra à froid, plus tard' },
        { si: 'C’est une limite qui ne se négocie pas', alors: 'ON L’ANNONCE', d: 'au début, dans la même phrase que l’invitation — jamais à la fin' },
        { si: 'Ça revient, et ça coûte à la personne', alors: 'C’EST ICI', d: 'le terrain de ce parcours' },
        { si: 'Ça ne gêne que l’équipe', alors: 'ON LAISSE', d: 'lui demander de résoudre notre problème, il le sentira' },
      ],
    },
    erreurs: [
      'Ouvrir la conversation sur un problème qui ne gêne que l’équipe. C’est le seul point qui transforme l’outil en son contraire&nbsp;: une participation de façade.',
      'Annoncer la limite à la FIN, après avoir laissé chercher. Le plus de dégâts pour le moins d’intention&nbsp;: ça apprend que l’invitation était décorative.',
      'Passer au temps 2 avant le «&nbsp;oui, c’est ça&nbsp;». La faute la plus fréquente, et elle annule tout ce qui précède.',
      '<b>Négocier ce qui ne se négocie pas</b>&nbsp;: sécurité, soins, repas, sommeil, lien familial, et surtout le moyen de communication.',
      'Répéter plus fermement un accord irréaliste. Ça ne le rend pas réaliste&nbsp;: ça l’use, et ça use la personne avec.',
    ],
    retenir: [
      'On trie AVANT de parler, et à froid — jamais pendant, jamais juste après.',
      'Si la personne ne veut pas parler maintenant, on reporte. Une résolution «&nbsp;à deux&nbsp;» imposée reste imposée.',
      'Un accord qui ne tient pas accuse l’accord, pas la personne — et la personne a accès à ce qui est écrit sur elle (art. L311-3 CASF).',
    ],
    grille: {
      titre: 'L’ACCORD À RECOPIER — TROIS LIGNES, DEUX EXEMPLAIRES',
      colonnes: ['Le problème (les deux préoccupations)', 'Ce qu’on a décidé', 'Ce qui dépend d’un tiers', 'On se revoit le'],
      note:
        'Écrit devant la personne, pendant la conversation — jamais après au calme, un accord écrit hors de la pièce n’est plus le sien. Ni sanction, ni promesse d’effort, ni signature&nbsp;: une signature transforme un accord en preuve.',
    },
    astuces: [
      { i: '⏱️', t: 'Comptez dix secondes dans votre tête après chaque réponse. C’est ridicule, et c’est le geste qui change le plus de conversations.' },
      { i: '✍️', t: 'Préparez vos QUESTIONS, pas votre conclusion. Si vous avez déjà la solution, annoncez-la franchement plutôt que de la faire deviner.' },
      { i: '🔄', t: 'Un deuxième tour est normal&nbsp;: la première conversation sert souvent à découvrir le vrai problème. Un quatrième dit qu’on s’est trompé de parcours.' },
    ],
  },

];

module.exports = { FICHES };
