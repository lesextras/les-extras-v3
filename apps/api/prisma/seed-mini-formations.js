/**
 * MINI-FORMATIONS GRATUITES — creation des fiches publiques du catalogue.
 *
 * ── POURQUOI UN SCRIPT ──────────────────────────────────────────────────────
 * Les fiches pourraient etre saisies dans l'ecran d'administration. Trois
 * raisons de ne pas le faire :
 *  1. le catalogue va compter une vingtaine de mini-formations : les ressaisir
 *     a la main une par une, c'est vingt occasions de se tromper d'URL ou
 *     d'oublier `freeOnline` — auquel cas la fiche affiche « Tarif sur devis »
 *     sur une formation gratuite ;
 *  2. le texte de la fiche est du contenu versionne : il se relit en revue,
 *     il se corrige par un commit, et on sait qui a ecrit quoi ;
 *  3. l'ecran d'administration ne connait pas encore les deux champs du mode
 *     gratuit — il les connaitra, mais les fiches n'ont pas a attendre.
 *
 * ── IDEMPOTENT ──────────────────────────────────────────────────────────────
 * Le SLUG fait foi. Relancer le script ne cree pas de doublon. Il MET A JOUR
 * les champs de la fiche (le texte vient du depot, c'est la source de verite),
 * mais il ne touche JAMAIS aux compteurs `views` / `requestsCount`, ni au
 * statut d'une fiche que quelqu'un aurait volontairement depubliee : une fiche
 * remise en ARCHIVED a la main le reste.
 *
 * Aucune suppression, jamais : conformement a la regle du projet, le script
 * n'efface aucune donnee, y compris une fiche qui aurait disparu de la liste.
 *
 * ── COMPTE PROPRIETAIRE ─────────────────────────────────────────────────────
 * Meme regle que `AdminService.resolveOwnerAccountId` : le compte ADéPA
 * d'abord, sinon le plus ancien compte etablissement. On ne code pas en dur un
 * identifiant de jeu d'essai (`seed-acc-*`) : il n'existe pas forcement en
 * production, et une fiche rattachee au mauvais organisme afficherait le
 * mauvais nom sous « Organisme de formation ».
 *
 * ── TYPE CERTIFIANTE, ET POURQUOI ───────────────────────────────────────────
 * `FormationType` n'a que deux valeurs. INTERNE designe une formation montee
 * par un etablissement pour ses propres salaries — elle est volontairement
 * exclue du site public. CERTIFIANTE est donc la seule valeur qui met une
 * fiche au catalogue public. Le nom du type ne promet rien : la certification
 * reelle se declare par `certifying` et `cpfEligible`, tous deux a `false`
 * ici, et aucun badge Qualiopi ne s'affiche.
 *
 *   node prisma/seed-mini-formations.js            (depuis /app/apps/api)
 *
 * Options : --brouillon  cree en DRAFT au lieu de PUBLISHED (relecture avant
 *                        mise en ligne).
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BROUILLON = process.argv.includes('--brouillon');

/** Racine de la plateforme pedagogique qui heberge les parcours. */
const PLATEFORME = 'https://toulali.teachizy.fr/formations/';

/**
 * Racine des couvertures, servies par le site lui-meme.
 *
 * Contrairement aux 142 visuels du catalogue, ces images-la ne viennent PAS de
 * la mediatheque WordPress (cf. `apps/web/src/lib/media.ts`, qui a deja
 * deplace la mediatheque deux fois en un mois). Elles vivent dans le depot,
 * sous `apps/web/public/images/mini-formations/`, et sont produites par
 * `apps/web/scripts/couvertures-mini-formations.py`. Un chemin relatif traverse
 * `visuel()` sans etre reecrit : rien a declarer dans `remotePatterns`, et rien
 * a recasser au prochain demenagement.
 */
const COUVERTURES = '/images/mini-formations/';

/**
 * Bloc commun a toutes les mini-formations gratuites.
 *
 * ⚠ « ATTESTATION DE SUIVI », JAMAIS « CERTIFICAT ». Un certificat evoque une
 * certification professionnelle (RNCP, RS) ; ces mini-formations n'en sont pas
 * une. Vendre un document en l'appelant « certificat » serait une pratique
 * commerciale trompeuse — et l'association est par ailleurs certifiee Qualiopi,
 * ce qui rend l'erreur d'autant plus couteuse.
 */
const EVALUATION = `La progression est enregistrée module par module : chaque module porte une durée minimale de consultation, et la formation est réputée suivie lorsque les quatre modules ont été parcourus.

Chaque module se termine par trois critères vérifiables — « Avant de passer au module suivant » — que vous cochez vous-même. Ce ne sont pas des questions de connaissance : ce sont des productions (une grille remplie, une phrase écrite, un relevé compté).

Chaque module se termine aussi par cinq questions d’autocorrection, avec leurs réponses commentées juste en dessous : elles ne sont ni notées, ni transmises, ni enregistrées. Elles servent à vérifier qu’une notion est passée avant d’avancer, et le commentaire explique aussi ce qui rend les autres réponses fausses.

Il n’y a ni examen, ni note. Ce qui est évalué, c’est votre propre relevé : chaque formation se termine par une période d’auto-observation avec une grille à remplir, et une lecture guidée de ce que vous y aurez noté.

Attestation de suivi nominative, facultative, au prix indiqué sur cette fiche. Elle se demande une fois les modules terminés, et les conditions vous sont communiquées avant tout paiement. Elle atteste que vous avez suivi la formation ; ce n’est ni un diplôme, ni une certification professionnelle, ni une action de formation certifiée Qualiopi. La formation elle-même reste gratuite, avec ou sans attestation.`;

/**
 * ⚠ LE DEROULEMENT VIENT AVANT LA PEDAGOGIE.
 * La fiche decrivait tres bien la methode et ne disait nulle part ce qui se
 * passe quand on clique sur « Commencer la formation » : qu'on quitte le site,
 * qu'on arrive sur un espace de formation qui porte un autre nom, et qu'aucune
 * carte bancaire n'est demandee. Sur une offre gratuite, c'est exactement la
 * qu'on perd les gens.
 */
const METHODOLOGIE = `Comment ça se passe, concrètement.

1. Vous cliquez sur « Commencer la formation ». Vous quittez le site Les Extras : le parcours est hébergé sur notre espace de formation en ligne.
2. L’accès s’y ouvre avec une adresse e-mail. Aucune carte bancaire n’est demandée, à aucun moment — la formation est gratuite du premier au dernier module.
3. Vous suivez les quatre modules dans l’ordre, à votre rythme. L’accès reste ouvert, sans date de fin, et vous pouvez revenir autant de fois que vous voulez.
4. Le module 3 lance une période de relevé de sept à quinze jours selon la formation, à raison d’une minute par jour, dans votre quotidien. Le module 4 se lit une fois cette période terminée, ce relevé sous les yeux.
5. L’attestation de suivi, si vous la souhaitez, se demande ensuite : les conditions vous sont communiquées avant tout paiement. Elle est facultative et ne change rien à l’accès.

Quatre modules, toujours dans le même ordre, plus une section d’annexes.

Chaque module s’ouvre sur une carte « Repères du module » — durée, prérequis, modalité, évaluation — et se ferme sur cinq questions d’autocorrection puis sur « Avant de passer au module suivant », trois critères que vous pouvez cocher vous-même.

1. La théorie, en quelques minutes. Le strict nécessaire pour comprendre ce qu’on va faire, pas un cours.
2. Une situation qui dérape. On ne vous montre pas un modèle parfait : on vous montre une scène réelle qui échoue, on vous demande de chercher pourquoi, et l’analyse ne vient qu’ensuite. C’est vous qui produisez la réponse — c’est ce qui la rend transposable.
3. Un exercice guidé, à faire sur votre propre situation, pas sur un cas d’école.
4. Une mise en pratique avec auto-observation : un protocole court, un relevé de quelques lignes par jour, et la lecture de ce relevé au bout de la période.

Chaque parcours porte trois schémas : la carte du parcours, la figure de la notion centrale, et l’arbre de décision qui dit quoi faire selon ce que votre relevé montre. Ils sont en noir et blanc, lisibles à l’impression, et chacun porte sa légende en toutes lettres.

La section « Annexes — fiches techniques et exercices » réunit les grilles vierges, les mémos, les exemples corrigés et les tableaux de reformulation. Ils sont écrits en clair, recopiables à la main et imprimables depuis le navigateur : une grille qu’il faut aller chercher dans un ordinateur n’est jamais remplie sur le terrain.

Le format est volontairement court et se suit en complément d’autres : plusieurs mini-formations partagent la même thématique tout en travaillant une compétence différente.`;

const PREREQUIS = `Aucun prérequis de diplôme ni d’expérience.

La formation s’adresse aux parents comme aux professionnels : ce sont les mêmes gestes des deux côtés, et chaque module distingue explicitement ce qui change à la maison et ce qui change en équipe.

Il faut en revanche une situation réelle sous la main : chaque exercice se fait sur une personne que vous accompagnez ou que vous élevez, jamais sur un cas fictif.`;

/*
 * ⚠⚠ AUCUN MONTANT N'EST ÉCRIT DANS CES TEXTES — 16/09/2026.
 *
 * Le prix de l'attestation vivait en toutes lettres à cinq endroits : ici (deux
 * fois), sur la fiche publique, sur /informations-reglementaires (deux fois) et
 * dans le contenu chargé sur la plateforme pédagogique. Le jour où il change —
 * et il a changé le 16/09/2026 — il faut les retrouver tous, dont un qui vit
 * chez un tiers. Un seul oubli fait afficher deux prix différents pour le même
 * document, ce qui est précisément la pratique commerciale trompeuse que toute
 * cette chaîne évite (art. L121-1 c. conso).
 *
 * LA SOURCE DE VÉRITÉ EST `Formation.attestationPrixCents`, en base, fiche par
 * fiche — c'est déjà elle qui décide si la vente est ouverte. La fiche publique
 * l'affiche depuis la base ; les textes, eux, renvoient à la fiche. Ne
 * réintroduisez pas de montant ici.
 */
const FAQ_COMMUNE = [
  {
    question: 'La formation est-elle vraiment gratuite ?',
    answer:
      "Oui, du premier au dernier module, sans carte bancaire et sans date de fin. Seule l’attestation de suivi nominative est payante, et elle est facultative : son prix est indiqué sur la fiche de la formation.",
  },
  {
    question: "L’attestation est-elle un diplôme ?",
    answer:
      "Non. C’est une attestation de suivi : elle indique que vous avez suivi la formation. Ce n’est ni un diplôme, ni une certification professionnelle inscrite au RNCP ou au RS, ni une action de formation certifiée Qualiopi. Elle sert à alimenter un dossier de formation continue ou un entretien professionnel.",
  },
  {
    question: 'Est-ce que cela remplace un accompagnement ?',
    answer:
      "Non. Ces formations ne posent aucun diagnostic et ne remplacent ni un avis médical, ni un accompagnement éducatif, ni un suivi psychologique. Elles transmettent un geste professionnel, transposable à la maison. Si une situation vous inquiète, parlez-en à un professionnel qui connaît la personne concernée.",
  },
  {
    question: 'Combien de temps faut-il y consacrer ?',
    answer:
      "Environ 45 minutes de lecture, que vous pouvez fractionner comme vous voulez : l’accès est illimité et sans date de fin. Mais le parcours ne se termine pas le jour où vous l’ouvrez : le module 3 lance un relevé qui dure de sept à quinze jours selon la formation, à raison d’une minute par jour, et le module 4 se lit ce relevé sous les yeux. Comptez donc une à deux semaines entre le premier et le dernier module — c’est écrit sur chaque fiche, et rappelé dans le module 3 lui-même.",
  },
  {
    question: 'Puis-je suivre plusieurs mini-formations ?',
    answer:
      "C’est le principe. Chacune travaille une compétence précise, et plusieurs peuvent porter sur la même thématique sans se répéter — elles se suivent en complément, en formation continue.",
  },
];

/**
 * ⚠ NUANCE OBLIGATOIRE SUR LES CONTENUS COMPORTEMENTAUX.
 * Les principes enseignes viennent de l'analyse appliquee du comportement.
 * Ils sont efficaces et ils ont ete critiques, notamment par des personnes
 * autistes adultes. Le contenu porte cette critique dans chaque parcours ; la
 * fiche publique doit la porter aussi, sinon la fiche promet autre chose que
 * la formation. Ne pas retirer ce paragraphe.
 */
const GARDE_FOU = `Ce que cette approche ne doit jamais devenir. Les principes enseignés ici viennent de l’analyse appliquée du comportement. Ils sont efficaces, et ils ont été critiqués — notamment par des personnes autistes adultes, dont certaines décrivent des prises en charge vécues comme de la mise en conformité. Quatre garde-fous traversent la formation : on n’éteint jamais un comportement sans le remplacer ; on travaille sur ce qui coûte à la personne, pas sur ce qui gêne l’entourage ; le refus est une communication ; et ces outils s’inscrivent dans un projet construit avec la personne et sa famille.`;

/**
 * PUBLICS VISES ET THEMATIQUE, par fiche.
 *
 * Sur le catalogue des ateliers, on cherche d'abord « pour qui », ensuite
 * « quoi » : c'est l'entree la plus utilisee du site. Les formations n'avaient
 * ni etiquette de public ni thematique rattachee — leurs cartes affichaient
 * donc un titre, un resume et rien d'autre, la ou une carte atelier affiche le
 * concepteur, le lieu et le public. C'est ce que ce bloc repare.
 *
 * ⚠ Le vocabulaire est FERME. Six etiquettes, pas une de plus : une etiquette
 * qui n'apparait que sur une fiche ne sert a personne, elle allonge seulement
 * la liste deroulante. Chaque affectation ci-dessous se lit dans le
 * `targetAudience` de la fiche correspondante — rien n'est ajoute au passage.
 *
 * La duree est celle ecrite en toutes lettres dans le resume (« Environ 45
 * minutes de lecture »). Les deux doivent dire le meme nombre : une carte a 46
 * et un resume a 45 sur la meme page, c'est une fiche qui se contredit.
 */
const PUBLICS = {
  PARENTS: 'Parents et proches',
  MEDICO: 'Professionnels du médico-social',
  ASE: 'Protection de l’enfance',
  ECOLE: 'École, enseignants et AESH',
  FAMILLES: 'Assistants familiaux',
  CADRES: 'Encadrement et direction',
};

const PROFIL = {
  'les-quatre-fonctions-d-un-comportement': {
    minutes: 45,
    categorie: 'TSA, communication et comportement',
    publics: [PUBLICS.PARENTS, PUBLICS.MEDICO, PUBLICS.ASE, PUBLICS.ECOLE],
  },
  'apprendre-a-demander-plutot-qu-a-crier': {
    minutes: 45,
    categorie: 'TSA, communication et comportement',
    publics: [PUBLICS.PARENTS, PUBLICS.MEDICO],
  },
  'guider-puis-s-effacer': {
    minutes: 45,
    categorie: 'TSA, communication et comportement',
    publics: [PUBLICS.PARENTS, PUBLICS.MEDICO, PUBLICS.ECOLE],
  },
  'decomposer-une-routine-en-etapes': {
    minutes: 45,
    categorie: 'TSA, communication et comportement',
    publics: [PUBLICS.PARENTS, PUBLICS.MEDICO, PUBLICS.ECOLE],
  },
  'rendre-l-environnement-previsible': {
    minutes: 45,
    categorie: 'TSA, communication et comportement',
    publics: [PUBLICS.PARENTS, PUBLICS.MEDICO, PUBLICS.ECOLE],
  },
  'les-premieres-minutes-d-une-crise': {
    minutes: 45,
    categorie: 'Comportements-défis et situations de crise',
    publics: [PUBLICS.PARENTS, PUBLICS.MEDICO, PUBLICS.ASE, PUBLICS.ECOLE, PUBLICS.FAMILLES],
  },
  'l-enfant-qui-dit-non-a-tout': {
    minutes: 45,
    categorie: 'Consignes, refus et coopération',
    publics: [PUBLICS.PARENTS, PUBLICS.MEDICO, PUBLICS.ASE, PUBLICS.ECOLE, PUBLICS.FAMILLES],
  },
  'lire-un-comportement-comme-une-reaction-de-survie': {
    minutes: 45,
    categorie: 'Protection de l’enfance et conduites d’adaptation',
    publics: [PUBLICS.ASE, PUBLICS.FAMILLES, PUBLICS.MEDICO, PUBLICS.ECOLE],
  },
  'preparer-une-equipe-de-suivi-de-la-scolarisation': {
    minutes: 45,
    categorie: 'Scolarité, MDPH et équipe de suivi (ESS)',
    publics: [PUBLICS.PARENTS, PUBLICS.MEDICO, PUBLICS.ECOLE],
  },
  'aider-a-demarrer-une-tache': {
    minutes: 40,
    categorie: 'Apprentissages et autonomie',
    publics: [PUBLICS.PARENTS, PUBLICS.MEDICO, PUBLICS.ECOLE],
  },
  'renforcer-ce-qui-va': {
    minutes: 46,
    categorie: 'Comportements-défis et situations de crise',
    publics: [PUBLICS.PARENTS, PUBLICS.MEDICO, PUBLICS.FAMILLES],
  },
  // ⚠ Pas de PUBLICS.PARENTS ici, et c'est voulu : ce parcours porte sur
  // l'ecrit professionnel qui circule et engage. Un parent n'ecrit pas de
  // rapport ; le module 2 lui parle du cahier de liaison, mais la fiche ne
  // doit pas lui promettre un contenu qui n'est pas fait pour lui.
  'decrire-un-comportement-sans-le-juger': {
    minutes: 46,
    categorie: 'Analyse des pratiques',
    publics: [PUBLICS.MEDICO, PUBLICS.ASE, PUBLICS.FAMILLES, PUBLICS.CADRES],
  },
};

/**
 * Les trois formations Qualiopi payantes ne sont pas creees par ce script :
 * elles ont ete saisies a la main dans le back-office. On ne les recree donc
 * pas — on complete seulement ce qui leur manquait pour apparaitre dans les
 * memes filtres que les autres. Une fiche absente est ignoree en silence.
 */
const PROFIL_PAYANTES = {
  'analyse-des-pratiques-professionnelles': {
    categorie: 'Analyse des pratiques',
    publics: [PUBLICS.MEDICO, PUBLICS.CADRES],
  },
  'accueil-du-public-difficile-et-ou-en-difficulte-sociale': {
    categorie: 'Accueil et publics en difficulté',
    publics: [PUBLICS.MEDICO, PUBLICS.ASE],
  },
  'gestion-de-la-violence-anticiper-et-ge-rer-les-conflits': {
    categorie: 'Prévention et gestion de la violence',
    publics: [PUBLICS.MEDICO, PUBLICS.ASE, PUBLICS.CADRES],
  },
};

/**
 * Retrouve — ou cree — la categorie portant ce titre.
 *
 * `Category` est partagee par les articles, les missions, les services et les
 * formations ; le champ `type` est ce qui les separe. On filtre donc dessus,
 * sinon une categorie d'atelier du meme nom serait reutilisee par erreur.
 */
async function categorie(titre) {
  const existante = await prisma.category.findFirst({
    where: { title: titre, type: 'formation' },
    select: { id: true },
  });
  if (existante) return existante.id;
  const creee = await prisma.category.create({
    data: { title: titre, type: 'formation' },
    select: { id: true },
  });
  console.log(`  categorie creee : ${titre}`);
  return creee.id;
}

const FICHES = [
  {
    slug: 'les-quatre-fonctions-d-un-comportement',
    image: 'les-quatre-fonctions-d-un-comportement.jpg',
    slugPlateforme: 'les-quatre-fonctions-dun-comportement',
    title: 'Les quatre fonctions d’un comportement',
    summary: `Thématique : TSA, communication et comportement. Une seule compétence travaillée : identifier à quoi sert un comportement avant de chercher à le modifier.

Un comportement qui se répète se répète parce qu’il marche : il obtient quelque chose. Tant qu’on ignore quoi, on traite la forme et pas la fonction — et on se trompe de cible. Quatre fonctions possibles, une grille en quatre colonnes pour trancher, et la règle qui évite l’erreur la plus coûteuse.

45 minutes de lecture sur quatre modules, plus un relevé de sept jours entre le module 3 et le module 4 : comptez une bonne semaine en tout.

${GARDE_FOU}`,
    objectives: `À l’issue de cette mini-formation, vous serez capable de :

— nommer les quatre fonctions possibles d’un comportement et les distinguer entre elles ;
— décrire un comportement en termes observables, sans interprétation ni jugement ;
— remplir une grille antécédent / comportement / conséquence sur une situation réelle et en déduire la fonction la plus probable ;
— repérer les deux erreurs qui font échouer la plupart des plans d’action : traiter la forme plutôt que la fonction, et renforcer sans le vouloir le comportement qu’on cherche à réduire ;
— tenir un relevé de quelques lignes par jour pendant une semaine et en tirer une conclusion argumentée.`,
    program: `Module 1 — La théorie, en huit minutes. Un comportement n’est pas un symptôme, c’est une fonction. Les quatre fonctions, et pourquoi la question utile n’est pas « comment le faire arrêter ».

Module 2 — Une situation qui dérape, et pourquoi. Une scène réelle, analysée par vous avant de lire la réponse.

Module 3 — Exercice guidé : la grille en quatre colonnes. Sur votre propre situation, pas sur un cas d’école.

Module 4 — Mise en pratique et auto-observation. Le protocole, le relevé quotidien, et la lecture du relevé au septième jour.`,
    targetAudience: `Parents et proches d’une personne avec un trouble du neurodéveloppement ; professionnels du médico-social et de la protection de l’enfance (éducateurs, moniteurs-éducateurs, AES, AESH, enseignants, psychologues, personnels d’IME, ITEP, SESSAD, MECS) ; équipes qui cherchent un langage commun avant d’écrire un projet d’accompagnement.`,
  },
  {
    slug: 'apprendre-a-demander-plutot-qu-a-crier',
    image: 'apprendre-a-demander-plutot-qu-a-crier.jpg',
    slugPlateforme: 'apprendre-a-demander-plutot-qua-crier',
    title: 'Apprendre à demander plutôt qu’à crier',
    summary: `Thématique : TSA, communication et comportement. Une seule compétence travaillée : construire et enseigner un comportement de remplacement.

Retirer un comportement sans en donner un autre, c’est retirer un outil à quelqu’un qui n’en a pas d’autre. La suite logique de la grille des fonctions : une fois qu’on sait ce que le comportement obtient, on enseigne un moyen d’obtenir la même chose — qui doit être plus facile, plus rapide et aussi fiable que celui qu’on veut voir disparaître.

45 minutes de lecture sur quatre modules, plus quatorze jours d’application entre le module 3 et le module 4 : comptez deux bonnes semaines en tout.

${GARDE_FOU}`,
    objectives: `À l’issue de cette mini-formation, vous serez capable de :

— choisir un comportement de remplacement qui obtient exactement la même chose que le comportement problématique ;
— vérifier les trois conditions sans lesquelles un remplacement échoue : plus facile, plus rapide, toujours honoré ;
— adapter la forme de la demande au niveau de la personne (geste, image, mot, phrase) sans exiger d’emblée la forme la plus coûteuse ;
— répondre à la demande de remplacement de façon immédiate et systématique pendant la phase d’apprentissage, puis l’espacer progressivement ;
— reconnaître la remontée passagère du comportement au début de l’apprentissage et ne pas l’interpréter comme un échec.`,
    program: `Module 1 — La théorie, en huit minutes. Pourquoi un comportement ne se retire pas, il se remplace. Les trois conditions du remplacement.

Module 2 — Une situation qui dérape, et pourquoi. Une scène réelle où le remplacement a été enseigné, puis abandonné — et ce que cela a appris.

Module 3 — Exercice guidé : construire le remplacement. Forme, condition de réussite, et ce que vous vous engagez à honorer.

Module 4 — Mise en pratique et auto-observation. Le protocole sur deux semaines, le relevé, et la lecture au quatorzième jour.`,
    targetAudience: `Parents et proches d’une personne avec un trouble du neurodéveloppement ou des difficultés de communication ; professionnels du médico-social confrontés à des comportements-défis ; équipes qui ont déjà identifié la fonction d’un comportement et cherchent la suite.`,
  },
  {
    slug: 'decomposer-une-routine-en-etapes',
    image: 'decomposer-une-routine-en-etapes.jpg',
    slugPlateforme: 'decomposer-une-routine-en-etapes',
    title: 'Décomposer une routine en étapes',
    summary: `Thématique : TSA, communication et comportement. Une seule compétence travaillée : découper une routine du quotidien en étapes enseignables et choisir par quelle extrémité commencer.

« Il ne sait pas s’habiller » ne se travaille pas : la phrase ne dit ni ce qui est acquis, ni où exactement ça s’arrête. « Il bloque à l’étape 4 sur 9 » se travaille. Écrire la chaîne, mesurer ce qui est déjà là, choisir par quelle extrémité enseigner — et n’en enseigner qu’une à la fois.

45 minutes de lecture sur quatre modules, plus dix jours d’enseignement entre le module 3 et le module 4 : comptez une dizaine de jours en tout.

${GARDE_FOU}`,
    objectives: `À l’issue de cette mini-formation, vous serez capable de :

— écrire la chaîne d’une routine en étapes observables, qui passent le test du témoin ;
— prendre une ligne de base et dire quelles étapes sont acquises seules, aidées, ou non réussies ;
— choisir entre chaînage arrière, chaînage avant et chaîne entière à aide dégressive, et justifier ce choix ;
— fixer un critère de passage à l’avance plutôt qu’au ressenti du jour, et tenir un relevé de dix lignes ;
— reconnaître qu’une étape est trop grosse — l’aide ne diminue pas — et la découper en deux.`,
    program: `Module 1 — La théorie, en huit minutes. Une routine n’est pas une compétence, c’est une suite de compétences. Écrire la chaîne, mesurer, puis choisir entre trois façons d’enseigner.

Module 2 — Une situation qui dérape, et pourquoi. Une séance d’habillage qui n’a produit ni apprentissage ni information, et ce qui manquait avant la séance.

Module 3 — Exercice guidé : écrire la chaîne et prendre la ligne de base. Sur une routine que vous accompagnez tous les jours.

Module 4 — Mise en pratique et auto-observation. Dix jours, une seule étape, et trois questions au dixième jour.`,
    targetAudience: `Parents et proches d’une personne avec un trouble du neurodéveloppement ou une déficience intellectuelle ; professionnels du médico-social et de l’école (éducateurs, moniteurs-éducateurs, AES, AESH) ; équipes qui veulent écrire un objectif d’autonomie vérifiable dans un projet d’accompagnement.`,
  },
  {
    slug: 'rendre-l-environnement-previsible',
    image: 'rendre-l-environnement-previsible.jpg',
    slugPlateforme: 'rendre-lenvironnement-previsible',
    title: 'Rendre l’environnement prévisible',
    summary: `Thématique : TSA, communication et comportement. Une seule compétence travaillée : construire un support visuel qui est réellement consulté, et rendre le temps qui passe visible.

Tout le monde fabrique des pictogrammes ; presque personne ne s’en sert encore trois semaines plus tard. Un support n’est pas une aide à la compréhension, c’est une aide à l’autonomie : il permet de savoir ce qui vient sans dépendre de la disponibilité d’un adulte. Les cinq raisons qui le font abandonner, et la ligne qui décide s’il existe encore dans un mois.

45 minutes de lecture sur quatre modules, plus quatorze jours d’observation du support entre le module 3 et le module 4 : comptez deux bonnes semaines en tout.`,
    objectives: `À l’issue de cette mini-formation, vous serez capable de :

— formuler la question unique à laquelle un support répond, et ne pas en mélanger trois sur le même mur ;
— choisir le niveau de représentation que la personne reconnaît aujourd’hui, en le testant plutôt qu’en le supposant ;
— construire un support manipulable, borné à quatre ou six cases, avec une marque de fin ;
— écrire la ligne de responsabilité — qui met à jour, et quand — sans laquelle aucun support ne survit à un mois ;
— préparer et roder une carte « changement » avant d’en avoir besoin ;
— lire un relevé de quatorze jours et décider s’il faut corriger le support, le déplacer ou l’abandonner.`,
    program: `Module 1 — La théorie, en sept minutes. Ce qu’un support visuel remplace vraiment, les trois objets qu’on confond, les cinq raisons d’un abandon, et comment rendre le temps visible.

Module 2 — Une situation qui dérape, et pourquoi. Un planning plastifié fabriqué en deux après-midi et abandonné en trois semaines — le support n’avait pas échoué.

Module 3 — Exercice guidé : construire un support qui tient. Question, niveau de représentation, trois contraintes, et la ligne de responsabilité.

Module 4 — Mise en pratique et auto-observation. Quatorze jours, trois colonnes, et une décision honnête au bout.`,
    targetAudience: `Parents et proches d’une personne avec un trouble du spectre de l’autisme ou une anxiété liée à l’imprévu ; professionnels du médico-social et de l’école ; équipes qui ont déjà fabriqué des supports visuels et constatent qu’ils ne servent plus.`,
  },
  {
    slug: 'guider-puis-s-effacer',
    image: 'guider-puis-s-effacer.jpg',
    slugPlateforme: 'guider-puis-seffacer',
    title: 'Guider puis s’effacer',
    summary: `Thématique : TSA, communication et comportement. Une seule compétence travaillée : doser une aide, puis la retirer.

L’aide est le seul outil éducatif qui devient nuisible quand il fonctionne trop bien. Une aide efficace et jamais retirée produit une dépendance à l’adulte, et cette dépendance est ensuite reprochée à la personne. Cette formation apprend à choisir le niveau d’aide le plus léger qui marche, et surtout à le retirer selon un plan décidé à l’avance.

45 minutes de lecture sur quatre modules, plus quinze jours d’application du plan entre le module 3 et le module 4 : comptez deux bonnes semaines en tout.

${GARDE_FOU}`,
    objectives: `À l’issue de cette mini-formation, vous serez capable de :

— classer les aides du plus léger au plus lourd et nommer celle que vous utilisez réellement ;
— appliquer la règle du délai : laisser un temps de silence avant d’aider, et ne jamais aider avant qu’il soit écoulé ;
— construire un plan d’estompage écrit, avec un critère de passage fixé à l’avance plutôt qu’apprécié sur le moment ;
— reconnaître une dépendance à l’aide installée et la défaire sans repartir de zéro ;
— tenir un relevé qui montre la diminution de l’aide, et non la seule réussite de la tâche.`,
    program: `Module 1 — La théorie, en sept minutes. Les niveaux d’aide, la règle du délai, et pourquoi l’estompage se décide avant de commencer.

Module 2 — Une situation qui dérape, et pourquoi. Une aide qui a bien marché pendant six mois, et ce qu’elle a produit.

Module 3 — Exercice guidé : le plan d’estompage. Niveau de départ, critères de passage, niveau d’arrivée.

Module 4 — Mise en pratique et auto-observation. Le relevé qui suit l’aide plutôt que la réussite.`,
    targetAudience: `Parents et proches ; professionnels du médico-social et de l’école (AESH, AES, éducateurs, enseignants) ; toute équipe qui constate qu’une personne « n’y arrive que si quelqu’un est à côté ».`,
  },
  {
    slug: 'les-premieres-minutes-d-une-crise',
    image: 'les-premieres-minutes-d-une-crise.jpg',
    slugPlateforme: 'les-premieres-minutes-dune-crise',
    title: 'Les premières minutes d’une crise',
    summary: `Thématique : comportements-défis et situations de crise. Une seule compétence travaillée : réduire ce que l’adulte ajoute pendant une crise, et écrire à froid ce qui se passera la prochaine fois.

Une crise ne s’arrête pas sur commande, et cette formation ne le promet nulle part. Ce qui se travaille se travaille vraiment : les six choses que l’adulte ajoute sans le vouloir — les mots, les demandes, le public, la proximité, les menaces, le volume —, la conduite décidée à froid, et le moment de la reprise, où se produisent presque toujours les épisodes les plus graves.

Aucun geste d’intervention physique n’est enseigné : ni prise, ni maintien, ni portage. Ces gestes blessent quand ils s’apprennent dans un texte ; ils relèvent du protocole écrit d’un établissement et d’une formation en présentiel avec mise en situation. La contrainte physique, l’enfermement et la privation ne sont jamais des techniques éducatives, et la formation le redit à chaque module.

45 minutes de lecture sur quatre modules, plus un relevé de dix jours entre le module 3 et le module 4 : comptez une dizaine de jours en tout.

${GARDE_FOU}`,
    objectives: `À l’issue de cette mini-formation, vous serez capable de :

— décrire une crise en termes observables — horaire, ce qui précédait, ce qui s’est produit, durée — plutôt que de la qualifier ;
— situer les quatre temps d’une crise et dire ce qui est possible à chacun ;
— nommer les six ajouts de l’adulte et en retirer au moins un, de façon mesurable ;
— écrire une fiche de conduite à froid en cinq lignes, applicable par quelqu’un qui n’était pas dans la réunion ;
— tenir un relevé de dix jours et en tirer une décision datée ;
— rédiger, après un épisode, un écrit qui tient devant une équipe et devant un dossier ;
— reconnaître les situations où l’on ne continue pas seul.`,
    program: `Module 1 — Les quatre temps, les six ajouts, les trois réductions. Ce qu’on appelle « crise » et pourquoi le mot ne décrit rien ; ce qui est possible avant, pendant et après ; les limites absolues.

Module 2 — Une scène qui dérape, et la deuxième crise. Quatorze minutes analysées minute par minute, et la découverte que la blessure n’arrive pas au pic mais à la reprise.

Module 3 — Exercice guidé : la fiche à froid en cinq lignes. Les signes, ce que je retire, ma phrase, la limite de sécurité, la reprise.

Module 4 — Dix jours de relevé, et ce qu’on écrit après. La lecture en quatre questions, les phrases de compte rendu, et à qui s’adresser quand cela ne suffit plus.`,
    targetAudience: `Parents et proches confrontés à des crises répétées ; professionnels du médico-social et de la protection de l’enfance (MECS, IME, ITEP, SESSAD, ESAT, foyers, ASE) ; AESH, assistants familiaux, animateurs et enseignants ; équipes qui veulent une conduite commune, écrite, tenue de la même façon quel que soit l’adulte présent.`,
  },
  {
    slug: 'l-enfant-qui-dit-non-a-tout',
    image: 'l-enfant-qui-dit-non-a-tout.jpg',
    slugPlateforme: 'lenfant-qui-dit-non-a-tout',
    title: 'L’enfant qui dit non à tout',
    summary: `Thématique : consignes, refus et coopération. Une seule compétence travaillée : formuler une consigne qui peut être exécutée, et savoir lire un « non » avant d’y répondre.

« Il dit non à tout » n’est pas une donnée : c’est une impression, et elle est presque toujours fausse dans les proportions qu’elle annonce. Cette formation travaille l’autre moitié de la scène — la consigne de l’adulte, sa forme, son nombre, son moment. C’est une compétence qui s’exerce sans rien savoir de la personne d’en face, et qui produit des résultats en quelques jours, parce qu’elle ne demande de changer que soi.

Ce n’est pas une méthode pour faire obéir. Une partie des refus sont légitimes et doivent être entendus — sur le corps, l’intimité, les objets personnels, le droit de dire qu’on n’aime pas. Le module 3 fait écrire cette liste avant de travailler la forme des consignes, et c’est l’ordre qui compte.

45 minutes de lecture sur quatre modules, plus un relevé de dix jours entre le module 3 et le module 4 : comptez une dizaine de jours en tout.`,
    objectives: `À l’issue de cette mini-formation, vous serez capable de :

— compter les consignes réellement données sur une heure et en tirer une proportion de refus ;
— distinguer les cinq choses qu’un « non » peut vouloir dire, et y répondre différemment ;
— repérer les sept défauts qui rendent une consigne inexécutable, et les corriger ;
— écrire ce qui est négociable, ce qui ne l’est pas, et ce qui ne vous appartient pas ;
— réduire un moment difficile à cinq consignes écrites mot pour mot, applicables par un autre adulte ;
— tenir un relevé de dix jours et en tirer une décision par consigne ;
— écrire un refus dans un écrit professionnel sans prêter d’intention.`,
    program: `Module 1 — Les cinq « non », les sept défauts, les cinq secondes. Compter avant de corriger, et cinq façons différentes de dire non.

Module 2 — Une scène qui dérape, consigne par consigne. Six minutes de rangement, six défauts de consigne, une consigne abandonnée — et un seul vrai refus, à la sixième minute.

Module 3 — Exercice guidé : la feuille des cinq consignes. Ce qui est négociable d’abord, le moment ensuite, les cinq consignes mot pour mot, et ce qui se passe au bout des cinq secondes.

Module 4 — Dix jours de relevé, et ce qu’on écrit après. La lecture ligne par ligne, et les phrases d’écrit professionnel qui ne prêtent aucune intention.`,
    targetAudience: `Parents et proches qui ont l’impression que « tout est une bataille » ; professionnels du médico-social, de l’école et de la protection de l’enfance (IME, ITEP, SESSAD, MECS, ESAT, foyers, AESH, assistants familiaux) ; équipes qui veulent des consignes communes, formulées de la même façon quel que soit l’adulte présent.`,
  },
  {
    slug: 'lire-un-comportement-comme-une-reaction-de-survie',
    image: 'lire-un-comportement-comme-une-reaction-de-survie.jpg',
    slugPlateforme: 'lire-un-comportement-comme-une-reaction-de-survie',
    title: 'Lire un comportement comme une réaction de survie',
    summary: `Thématique : protection de l’enfance et conduites d’adaptation. Une seule compétence travaillée : relire une conduite comme une stratégie qui a été utile ailleurs, et en tirer un réglage concret du quotidien.

La lecture « c’est le traumatisme » est devenue le lieu commun du secteur, et elle produit trois dégâts bien identifiés : elle explique tout, elle excuse tout, et surtout elle remplace l’action — la réunion est excellente, tout le monde est ému, et rien ne change dans la maison le lendemain. Cette formation ne s’arrête donc jamais à la lecture : chaque module la fait aboutir à un réglage du quotidien, écrit et testé quinze jours.

Ce n’est ni un cours sur le psychotraumatisme, ni un outil de repérage clinique, ni une aide au diagnostic. Un éducateur n’écrit pas de diagnostic, et une mini-formation gratuite n’en apprend pas. Le premier module dit ce qui ne se lit pas comme une réaction de survie — douleur, faim, sommeil, vue, audition, effet d’un traitement, trouble du neurodéveloppement non repéré — parce que c’est là que cette grille fait le plus de dégâts quand elle est appliquée à tout.

45 minutes de lecture sur quatre modules, plus un réglage testé quinze jours entre le module 3 et le module 4 : comptez deux bonnes semaines en tout.`,
    objectives: `À l’issue de cette mini-formation, vous serez capable de :

— poser la question « à quoi cela a-t-il pu servir » plutôt que « pourquoi il me fait ça » ;
— reconnaître sept conduites fréquentes et les contextes où elles étaient adaptées ;
— nommer les trois pièges de cette lecture, dont le plus fréquent : elle remplace l’action ;
— distinguer ce qui ne se lit pas comme une réaction de survie, et vérifier le corps avant l’histoire ;
— écrire une fiche « lecture → réglage » en cinq lignes et la porter en réunion ;
— tenir un relevé de quinze jours et reconnaître les quatre issues, dont deux sont des réussites ;
— écrire dans un rapport une hypothèse signalée comme telle, sans poser de diagnostic.`,
    program: `Module 1 — Changer de question, et les trois pièges. Sept conduites et les contextes où elles étaient adaptées ; ce qui ne se lit pas comme ça ; et pourquoi une lecture qui ne change rien n’a servi qu’aux adultes.

Module 2 — Une réponse raisonnable qui confirme tout. Six semaines d’accueil, une règle fondée, une équipe attentive — et une rupture. Ce que chaque étape a enseigné sans le vouloir.

Module 3 — Exercice guidé : de la lecture au réglage. La fiche en cinq lignes, les huit réglages du quotidien, et les cinq conditions pour qu’un réglage tienne.

Module 4 — Quinze jours, et ce qu’on écrit dans un rapport. Les quatre issues du relevé, dont deux sont des réussites, et les phrases d’écrit professionnel qui ne posent aucun diagnostic.`,
    targetAudience: `Professionnels de la protection de l’enfance (MECS, foyers, lieux de vie, pôles ASE, AEMO, placement à domicile) ; assistants familiaux et familles d’accueil ; professionnels du médico-social accompagnant des enfants confiés (IME, ITEP, SESSAD) ; enseignants et AESH qui accueillent un élève placé.`,
  },
  {
    slug: 'preparer-une-equipe-de-suivi-de-la-scolarisation',
    image: 'preparer-une-equipe-de-suivi-de-la-scolarisation.jpg',
    slugPlateforme: 'preparer-une-equipe-de-suivi-de-la-scolarisation',
    title: 'Préparer une équipe de suivi de la scolarisation',
    summary: `Thématique : scolarité, MDPH et équipe de suivi (ESS). Une seule compétence travaillée : arriver à une ESS avec trois éléments écrits, et formuler ses demandes de façon à ce qu’elles deviennent des décisions écrites.

Le point de départ est un fait que peu de gens connaissent : le compte rendu d’ESS que tout le monde cherche n’existe pas séparément. C’est le GEVA-Sco réexamen, rempli par l’enseignant référent pendant la réunion, qui en tient lieu — et il remonte à la MDPH. On ne travaille donc pas à être entendu : on travaille à ce qui sera écrit.

Ce n’est pas un conseil juridique. Cette formation ne rédige pas de recours et ne dit pas ce qu’une MDPH accordera. Les références citées sont vérifiées et limitées : articles D351-10, D351-11 et D351-12 du code de l’éducation — et le D351-16-1, qui traite de l’aide humaine et qu’on voit partout cité à tort pour l’ESS.

45 minutes de lecture sur quatre modules. Le module 4 se lit après la réunion, une fois le GEVA-Sco reçu — ou quinze jours après si vous ne l’avez pas reçu, ce qui est en soi une information.`,
    objectives: `À l’issue de cette mini-formation, vous serez capable de :

— dire qui réunit l’ESS, à quelle fréquence, et sous quels articles ;
— distinguer ce que l’ESS propose de ce que la CDAPH décide ;
— transformer une appréciation en fait daté et mesuré (situation, mesure, période, ce qui a été essayé) ;
— écrire une feuille d’une page : ce qui a changé, deux ou trois faits, une demande recopiable ;
— formuler les deux phrases qui font écrire, et dire les choses difficiles sans mettre personne en accusation ;
— relire un GEVA-Sco en quatre passages et écrire un courriel de complément ;
— vérifier à quinze jours ce qui a été fait, et préparer la réunion suivante.`,
    program: `Module 1 — Ce qu’est une ESS, et ce qu’elle peut écrire. Les textes, les deux GEVA-Sco, ce que l’ESS ne décide pas, et les cinq raisons pour lesquelles une réunion ne produit rien.

Module 2 — Une réunion cordiale qui ne produit rien. Cinquante minutes, sept personnes, aucune tension — et un document qui ne dit rien. Analyse intervention par intervention.

Module 3 — Exercice guidé : la feuille d’une page. Ce qui a changé, deux ou trois faits mesurés, une demande écrite pour être recopiée, et les trois phrases à ne pas oublier.

Module 4 — Relire, compléter, et vérifier à quinze jours. La grille de relecture en quatre passages, le courriel de complément, et la page de la prochaine réunion.`,
    targetAudience: `Parents qui siègent à une ESS et en ressortent avec l’impression que rien n’a été décidé ; professionnels de SESSAD, d’IME et d’ITEP qui y représentent leur service ; AESH, dont l’information sur les créneaux et les volumes est souvent la plus décisive de la réunion ; enseignants et coordonnateurs qui préparent ces réunions.`,
  },
  {
    slug: 'aider-a-demarrer-une-tache',
    image: 'aider-a-demarrer-une-tache.jpg',
    slugPlateforme: 'aider-quelquun-a-demarrer-une-tache',
    title: 'Aider quelqu’un à démarrer une tâche',
    summary: `Thématique : apprentissages et autonomie. Une seule compétence travaillée : réduire le coût du démarrage d’une tâche — identifier ce qui coûte à l’entrée, et agir sur les six leviers correspondants.

Regardez une séance de près, chronomètre en main : ce n’est presque jamais la tâche qui bloque, c’est l’entrée dans la tâche. Une fois la première action faite, la suite s’enchaîne souvent sans difficulté. La conséquence est considérable : tout ce qui porte sur la tâche elle-même — l’expliquer mieux, motiver, encourager — n’a presque aucun effet. Ce qui en a un, c’est de réduire le coût des trente premières secondes.

La scène du module 2 se passe en ESAT, avec un travailleur adulte : l’inertie de démarrage est un des motifs les plus fréquents en ESAT, en foyer de vie et en accompagnement d’adultes, et elle y produit les mêmes phrases de bilan qu’ailleurs.

40 minutes de lecture sur quatre modules, plus dix jours d’application entre le module 3 et le module 4 : comptez une dizaine de jours en tout.

${GARDE_FOU}`,
    objectives: `À l’issue de cette mini-formation, vous serez capable de :

— distinguer un blocage à l’entrée d’une difficulté dans l’exécution ;
— nommer les six coûts du démarrage et repérer ceux qui jouent dans votre situation ;
— appliquer le levier correspondant à chaque coût, en termes matériels ;
— amorcer une tâche sans la faire à la place, et savoir prouver la différence ;
— écrire une fiche de démarrage en cinq lignes, applicable par quelqu’un d’autre ;
— mesurer un délai avant le premier geste plutôt que d’estimer une motivation ;
— écrire une phrase de bilan qui décrit le dispositif et non la personne ;
— reconnaître ce qui n’est pas un problème de démarrage, et vers quel parcours aller.`,
    program: `Module 1 — Les six coûts du démarrage, et les six leviers. Le blocage est à l’entrée, pas dans l’exécution ; l’amorçage ; et ce qui n’est pas un problème de démarrage.

Module 2 — Une matinée perdue, et le geste arrivé trop tard. Vingt-cinq minutes perdues chaque matin en atelier, un moniteur attentif, et une phrase de bilan qui suivra le travailleur des années.

Module 3 — Exercice guidé : la fiche de démarrage. La préparation avec un nom et une heure, la première action au mot près, la fin visible, et ce qu’on fait si rien ne démarre.

Module 4 — Dix jours, et la phrase de bilan. On mesure un délai, pas une motivation — et une phrase utile contient deux chiffres et une durée.`,
    targetAudience: `Parents devant les devoirs, l’habillage, la douche, le rangement ; moniteurs d’atelier et professionnels d’ESAT, de foyer de vie et de SAVS ; professionnels du médico-social et de l’école (IME, ITEP, SESSAD, AESH, enseignants) ; toute personne qui accompagne quelqu’un dont on dit qu’il « ne fait rien » alors qu’il travaille très bien une fois lancé.`,
  },
  {
    slug: 'renforcer-ce-qui-va',
    image: 'renforcer-ce-qui-va.jpg',
    slugPlateforme: 'renforcer-ce-qui-va',
    title: 'Renforcer ce qui va',
    summary: `Thématique : comportements-défis et opposition. Une seule compétence travaillée : faire augmenter un comportement qui existe déjà, en le remarquant au bon moment et au bon rythme.

Un renforçateur se reconnaît à son effet, jamais à l’intention de l’adulte : est renforçateur ce qui rend un comportement plus fréquent, et cela se constate après coup, en comptant. C’est la phrase qui défait le plus de malentendus, à commencer par « les félicitations, ça marche avec lui » — qui est une croyance tant que personne n’a compté.

Trois réglages décident du résultat, et presque jamais le contenu de la récompense : le délai d’abord, le critère ensuite, la fréquence enfin. Le parcours fait régler le critère SOUS le niveau déjà atteint, pour que le dispositif se déclenche dès le premier jour.

46 minutes de lecture sur quatre modules, avec un quiz d’autocorrection par module, plus dix jours de relevé entre le module 3 et le module 4 : comptez une dizaine de jours en tout.

${GARDE_FOU}`,
    objectives: `À l’issue de cette mini-formation, vous serez capable de :

— énoncer ce qu’est un renforçateur sans employer le mot « plaisir » ;
— distinguer un comportement à renforcer d’un comportement à enseigner, et savoir vers quel parcours renvoyer ;
— régler un délai, un critère et une fréquence, dans cet ordre d’importance ;
— établir une liste de préférences avec la personne, et non à sa place ;
— écrire une phrase de remarque qui nomme le comportement, en trois secondes et sur un ton normal ;
— tenir un relevé à deux colonnes et y lire votre propre régularité ;
— espacer le renforcement par paliers sans que le comportement s’effondre ;
— reconnaître les quatre situations où un dispositif ne doit pas être posé du tout.`,
    program: `Module 1 — Un renforçateur se reconnaît à l’effet, jamais à l’intention. La phrase qui trie, les trois réglages par ordre d’importance, et les quatre situations où l’on ne pose pas de dispositif.

Module 2 — Le tableau qui s’est effondré en neuf jours. Un dispositif réel disséqué : critère hors de portée, délai de plusieurs semaines, récompense choisie sans la personne, et une gommette retirée.

Module 3 — Exercice guidé : la fiche de renforcement. La liste de préférences et ses trois modes de passation, le critère réglé par le bas, la phrase de remarque écrite mot pour mot.

Module 4 — Dix jours, puis espacer sans tout perdre. Lire les deux colonnes, décider sur une tendance et non sur trois jours, monter d’un palier, et passer au renforcement irrégulier.`,
    targetAudience: `Professionnels du médico-social (IME, ITEP, SESSAD, MECS, ESAT, foyer de vie, SAVS) ; assistants familiaux ; parents et proches ; toute personne qui a déjà vu un tableau de points s’éteindre en trois semaines et qui veut comprendre lequel des trois réglages était faux.`,
  },
  {
    slug: 'decrire-un-comportement-sans-le-juger',
    image: 'decrire-un-comportement-sans-le-juger.jpg',
    slugPlateforme: 'decrire-un-comportement-sans-le-juger',
    title: 'Décrire un comportement sans le juger',
    summary: `Thématique : observer et écrire. Une seule compétence travaillée : écrire ce qu’on a vu, et non ce qu’on en a pensé — puis reconnaître, dans ses propres écrits, les mots qui font passer une interprétation pour un fait.

L’outil tient en une question : une caméra posée dans la pièce aurait-elle enregistré ce que je viens d’écrire ? Elle n’enregistre ni les intentions, ni les motivations, ni les diagnostics. Tout ce qui n’est pas filmable est une interprétation — elle a sa place, annoncée comme telle, jamais glissée au milieu des faits.

Ce n’est pas une exigence de style. Un écrit professionnel produit des décisions, il est recopié dans le dossier suivant, il survit à l’équipe qui l’a produit, et l’article L311-3 du CASF donne à la personne accompagnée le droit de le lire. À chaque recopie, le contexte disparaît et les adjectifs restent : c’est la raison technique pour laquelle on écrit des faits.

46 minutes de lecture sur quatre modules, avec un quiz d’autocorrection par module, plus sept jours de relevé entre le module 3 et le module 4 : une observation écrite par jour, trois lignes.`,
    objectives: `À l’issue de cette mini-formation, vous serez capable de :

— appliquer le test de la caméra à une phrase et trancher fait ou interprétation ;
— repérer les formulations qui font passer une opinion pour une observation ;
— reconnaître le glissement d’un épisode daté à un trait de caractère, et les verbes qui le signalent ;
— écrire une observation en trois lignes : quand, où, ce qui a précédé, ce qui s’est passé ;
— annoncer une hypothèse au lieu de la glisser dans les faits ;
— faire figurer ce que l’adulte a dit ou fait juste avant ;
— relire vos propres écrits selon quatre critères mesurables ;
— distinguer ce qu’aucun texte n’impose de ce que le décret 2022-1728 exige réellement.`,
    program: `Module 1 — Le test de la caméra. Ce que l’écrit produit, le droit d’accès de la personne à son dossier, les mots qui trahissent, et pourquoi aucun terme clinique ne s’écrit sous une signature éducative.

Module 2 — Comment une phrase du soir devient une orientation. Une transmission de novembre suivie jusqu’à une décision de mars, et les trois moments où quelqu’un aurait pu remonter à la source.

Module 3 — Exercice guidé : la grille en trois colonnes. Ce que j’ai vu, ce que j’en ai pensé, ce que j’écris — et sept jours d’observations, dont au moins trois sur des moments ordinaires.

Module 4 — Se relire, et transmettre à l’équipe. La relecture en quatre passes, l’équilibre exigé par le cadre national de référence, le point de vue de la personne, et une règle commune par mois.`,
    targetAudience: `Professionnels du médico-social et de la protection de l’enfance qui produisent des écrits : transmissions, comptes rendus, rapports de situation, notes pour une ESS ou pour le juge ; assistants familiaux ; référents de parcours ; encadrement et direction qui relisent et valident les écrits de leur équipe.`,
  },
];

async function compteProprietaire() {
  const adepa = await prisma.account.findFirst({
    where: {
      type: 'ESTABLISHMENT',
      OR: [
        { name: { contains: 'adépa', mode: 'insensitive' } },
        { name: { contains: 'adepa', mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });
  if (adepa) return adepa;
  const secours = await prisma.account.findFirst({
    where: { type: 'ESTABLISHMENT' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  });
  if (secours) return secours;
  throw new Error(
    "Aucun compte etablissement en base : impossible de rattacher les fiches a un organisme de formation.",
  );
}

async function main() {
  const owner = await compteProprietaire();
  console.log(`Organisme retenu : ${owner.name} (${owner.id})`);

  let crees = 0;
  let majs = 0;
  let ignores = 0;

  for (const f of FICHES) {
    const profil = PROFIL[f.slug];
    if (!profil) throw new Error(`profil (publics, duree, categorie) manquant pour ${f.slug}`);
    const donnees = {
      title: f.title,
      summary: f.summary,
      objectives: f.objectives,
      program: f.program,
      prerequisites: PREREQUIS,
      targetAudience: f.targetAudience,
      methodology: METHODOLOGIE,
      evaluation: EVALUATION,
      faq: FAQ_COMMUNE,
      // Ni Qualiopi ni CPF : ces mini-formations ne sont couvertes par aucune
      // des deux, et cocher l'un ou l'autre afficherait un badge mensonger.
      certifying: false,
      cpfEligible: false,
      // La duree reelle est de 36 a 39 MINUTES. Le champ est en heures
      // entieres : le remplir donnerait « 1 h », c'est-a-dire une duree
      // fausse sur une fiche que des financeurs peuvent lire. On le laisse
      // vide, et la duree exacte est ecrite en toutes lettres dans le resume.
      durationHours: null,
      // ... mais la duree en MINUTES, elle, est exacte et affichable : c'est le
      // nombre ecrit en toutes lettres dans le resume de la meme fiche.
      durationMinutes: profil.minutes,
      publicTargets: profil.publics,
      categoryId: await categorie(profil.categorie),
      freeOnline: true,
      enrollUrl: PLATEFORME + f.slugPlateforme,
      images: [COUVERTURES + f.image],
    };

    const existante = await prisma.formation.findUnique({
      where: { slug: f.slug },
      select: { id: true, status: true },
    });

    if (!existante) {
      await prisma.formation.create({
        data: {
          ...donnees,
          slug: f.slug,
          type: 'CERTIFIANTE',
          ownerAccountId: owner.id,
          status: BROUILLON ? 'DRAFT' : 'PUBLISHED',
        },
      });
      crees += 1;
      console.log(`  cree      ${f.slug}`);
      continue;
    }

    // Une fiche volontairement archivee le reste : on met son texte a jour,
    // mais on ne la republie pas dans le dos de celui qui l'a retiree.
    if (existante.status === 'ARCHIVED') {
      await prisma.formation.update({ where: { id: existante.id }, data: donnees });
      ignores += 1;
      console.log(`  archivee  ${f.slug} (texte mis a jour, statut inchange)`);
      continue;
    }

    await prisma.formation.update({
      where: { id: existante.id },
      data: { ...donnees, status: BROUILLON ? existante.status : 'PUBLISHED' },
    });
    majs += 1;
    console.log(`  mise a jour ${f.slug}`);
  }

  console.log(
    `\n${crees} creee(s), ${majs} mise(s) a jour, ${ignores} archivee(s) laissee(s) en l'etat.`,
  );

  // Les formations Qualiopi payantes : on ne touche QUE les deux champs qui
  // leur manquaient pour entrer dans les filtres. Ni titre, ni resume, ni
  // statut — ces fiches sont tenues a la main dans le back-office.
  let completees = 0;
  for (const [slug, profil] of Object.entries(PROFIL_PAYANTES)) {
    const fiche = await prisma.formation.findUnique({ where: { slug }, select: { id: true } });
    if (!fiche) {
      console.log(`  absente   ${slug} (ignoree)`);
      continue;
    }
    await prisma.formation.update({
      where: { id: fiche.id },
      data: { publicTargets: profil.publics, categoryId: await categorie(profil.categorie) },
    });
    completees += 1;
    console.log(`  completee ${slug}`);
  }
  console.log(`${completees} formation(s) payante(s) completee(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
