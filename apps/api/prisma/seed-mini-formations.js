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
 * une. Vendre 20 € un document en l'appelant « certificat » serait une pratique
 * commerciale trompeuse — et l'association est par ailleurs certifiee Qualiopi,
 * ce qui rend l'erreur d'autant plus couteuse.
 */
const EVALUATION = `La progression est enregistrée module par module : chaque module porte une durée minimale de consultation, et la formation est réputée suivie lorsque les quatre modules ont été parcourus.

Il n’y a ni examen, ni note. Ce qui est évalué, c’est votre propre relevé : chaque formation se termine par une période d’auto-observation avec une grille à remplir, et une lecture guidée de ce que vous y aurez noté.

Attestation de suivi nominative : 20 €, facultative. Elle se demande une fois les modules terminés, et les conditions vous sont communiquées avant tout paiement. Elle atteste que vous avez suivi la formation ; ce n’est ni un diplôme, ni une certification professionnelle, ni une action de formation certifiée Qualiopi. La formation elle-même reste gratuite, avec ou sans attestation.`;

const METHODOLOGIE = `Quatre modules, toujours dans le même ordre.

1. La théorie, en quelques minutes. Le strict nécessaire pour comprendre ce qu’on va faire, pas un cours.
2. Une situation qui dérape. On ne vous montre pas un modèle parfait : on vous montre une scène réelle qui échoue, on vous demande de chercher pourquoi, et l’analyse ne vient qu’ensuite. C’est vous qui produisez la réponse — c’est ce qui la rend transposable.
3. Un exercice guidé, à faire sur votre propre situation, pas sur un cas d’école.
4. Une mise en pratique avec auto-observation : un protocole court, un relevé de quelques lignes par jour, et la lecture de ce relevé au bout de la période.

Le format est volontairement court et se suit en complément d’autres : plusieurs mini-formations partagent la même thématique tout en travaillant une compétence différente.`;

const PREREQUIS = `Aucun prérequis de diplôme ni d’expérience.

La formation s’adresse aux parents comme aux professionnels : ce sont les mêmes gestes des deux côtés, et chaque module distingue explicitement ce qui change à la maison et ce qui change en équipe.

Il faut en revanche une situation réelle sous la main : chaque exercice se fait sur une personne que vous accompagnez ou que vous élevez, jamais sur un cas fictif.`;

const FAQ_COMMUNE = [
  {
    question: 'La formation est-elle vraiment gratuite ?',
    answer:
      "Oui, du premier au dernier module, sans carte bancaire et sans date de fin. Seule l’attestation de suivi nominative est payante (20 €), et elle est facultative.",
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
      "Moins de quarante minutes à l’écran. La mise en pratique, elle, se déroule dans votre quotidien sur une à deux semaines, à raison de quelques minutes par jour.",
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

const FICHES = [
  {
    slug: 'les-quatre-fonctions-d-un-comportement',
    image: 'les-quatre-fonctions-d-un-comportement.jpg',
    slugPlateforme: 'les-quatre-fonctions-dun-comportement',
    title: 'Les quatre fonctions d’un comportement',
    summary: `Thématique : TSA, communication et comportement. Une seule compétence travaillée : identifier à quoi sert un comportement avant de chercher à le modifier.

Un comportement qui se répète se répète parce qu’il marche : il obtient quelque chose. Tant qu’on ignore quoi, on traite la forme et pas la fonction — et on se trompe de cible. Quatre fonctions possibles, une grille en quatre colonnes pour trancher, et la règle qui évite l’erreur la plus coûteuse.

Environ 39 minutes, dont sept minutes de lecture à l’écran : le reste se passe chez vous ou dans votre service.

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

Environ 39 minutes, dont sept minutes de lecture à l’écran.

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
    slug: 'guider-puis-s-effacer',
    image: 'guider-puis-s-effacer.jpg',
    slugPlateforme: 'guider-puis-seffacer',
    title: 'Guider puis s’effacer',
    summary: `Thématique : TSA, communication et comportement. Une seule compétence travaillée : doser une aide, puis la retirer.

L’aide est le seul outil éducatif qui devient nuisible quand il fonctionne trop bien. Une aide efficace et jamais retirée produit une dépendance à l’adulte, et cette dépendance est ensuite reprochée à la personne. Cette formation apprend à choisir le niveau d’aide le plus léger qui marche, et surtout à le retirer selon un plan décidé à l’avance.

Environ 36 minutes, dont sept minutes de lecture à l’écran.

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
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
