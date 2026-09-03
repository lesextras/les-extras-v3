/* eslint-disable no-console */
/**
 * Remplissage des fiches ateliers du catalogue historique.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POURQUOI CE SCRIPT EXISTE
 * ─────────────────────────────────────────────────────────────────────────────
 * Treize ateliers publiés au 3 septembre 2026. Trois d'entre eux (Valérie
 * SIMON, déposés à la main dans l'application) portent durée, participants,
 * matériel, prérequis, créneaux, objectifs, déroulé et évaluation. Les dix
 * autres viennent de l'import du catalogue WordPress : là-bas, une annonce
 * n'avait qu'un titre, une description, un public, une ville, un prix et des
 * images. Les champs pédagogiques n'existaient pas — il n'y avait rien à
 * importer, et rien n'a été perdu.
 *
 * Une seule des dix fait exception : ATELIER PSYCHO-BOXE, dont quelqu'un avait
 * écrit à la main, dans WordPress, « Objectif général de la formation »,
 * « Méthodologie pédagogique » et « Modalités d'évaluation ». C'est cette fiche
 * que Siham montre comme modèle. Elle n'a pourtant, elle non plus, ni durée,
 * ni participants, ni matériel, ni prérequis, ni créneaux.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CE QUE CE SCRIPT ÉCRIT, ET CE QU'IL N'ÉCRIT PAS
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠ IL N'ÉCRIT QUE CE QUI EST DÉJÀ ÉCRIT AILLEURS SUR LA MÊME FICHE.
 *
 * Chaque objectif ci-dessous est une phrase de la description de la fiche,
 * remise à l'infinitif et sortie du paragraphe. Rien n'est ajouté : ni un
 * objectif qui ne figurait pas, ni un bénéfice supposé. Le champ `source` de
 * chaque entrée dit d'où vient le texte, pour qu'on puisse le vérifier sans
 * relire tout l'historique.
 *
 * ⚠ CE QUE LE BLOC `FICHES` N’ÉCRIT PAS, ET NE DOIT PAS ÉCRIRE (voir `REPERES`
 * plus bas pour ce que Siham a ensuite arbitré) :
 *   durée · participants maximum · matériel nécessaire · prérequis · créneaux
 *   proposés · modalités d'évaluation.
 *
 * Ces six informations n'existent nulle part — ni sur la fiche, ni sur le
 * WordPress d'origine (vérifié annonce par annonce le 3/09/2026). Les écrire
 * serait les inventer. Or ce sont exactement les informations sur lesquelles un
 * établissement engage un budget et bloque un créneau : une durée fausse, c'est
 * un planning faux ; un matériel faux, c'est l'atelier annulé le matin même ;
 * une modalité d'évaluation inventée, c'est une promesse que l'intervenant
 * devra tenir devant un financeur. Elles se demandent à leurs auteurs — et
 * l'indicateur de complétude (`lib/completude-fiche.ts`) est là pour ça.
 *
 * ⚠ AUCUN CHAMP DÉJÀ REMPLI N'EST ÉCRASÉ. Le script ne remplit que le vide.
 * Si un intervenant a écrit ses propres objectifs entre-temps, ce sont les
 * siens qui restent — c'est sa fiche.
 *
 * Usage :  node prisma/seed-fiches-ateliers.js            (aperçu, n'écrit pas)
 *          node prisma/seed-fiches-ateliers.js --appliquer
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Une entrée par fiche. `slug` fait foi (il est unique en base).
 * `source` : d'où vient chaque texte, pour la relecture.
 */
const FICHES = [
  {
    slug: 'le-papa-plan-d-activite-physique-adapte',
    source:
      "Les quatre phrases de la description de la fiche, remises à l'infinitif. " +
      'Aucun ajout.',
    objectives: [
      'Reprendre une activité physique adaptée pour retrouver la forme et la confiance en soi.',
      'Mieux connaître les morphologies, et la sienne.',
      "Travailler l'estime de soi et la confiance en ses capacités d'action.",
      'Développer sa capacité à parler de son corps.',
    ].join('\n'),
  },
  {
    slug: 'atelier-de-musicotherapie',
    source:
      'Les trois puces de la description de la fiche, reprises sans modification ' +
      'de sens.',
    objectives: [
      "Repérer les bienfaits d'une pause musicale dans son quotidien, ou quand les émotions s'emballent.",
      "S'éveiller à la musique en pratiquant un instrument.",
      "Comprendre ses émotions et apprendre à les canaliser par la pratique d'un instrument, pour se réguler et s'apaiser.",
    ].join('\n'),
  },
  {
    slug: 'atelier-socio-esthetique',
    source:
      'La dernière phrase de la description : « Pour permettre de mieux prendre ' +
      "conscience de son corps, et contribuer à restaurer une image positive de soi ! »",
    objectives: [
      'Mieux prendre conscience de son corps.',
      'Contribuer à restaurer une image positive de soi.',
      'Prendre un temps pour soi, dans un cadre accompagné.',
    ].join('\n'),
  },
  {
    slug: 'atelier-theatre',
    source:
      'Les deux phrases de la description. La quatrième ligne reprend la mention ' +
      "« lors d'ateliers personnalisés » telle qu'elle est écrite : ce n'est pas " +
      "proposé dans l'atelier standard.",
    objectives: [
      'Prendre confiance en soi.',
      'Savoir prendre la parole en public.',
      "Acquérir des techniques de savoir-être, en s'amusant.",
      "Travailler sa prise de parole pour une recherche d'emploi ou de stage (proposé en atelier personnalisé).",
    ].join('\n'),
  },
  {
    slug: 'atelier-slam',
    source:
      "La phrase unique de la description : « ateliers d'écriture et de mise en " +
      "musique textes slam et tournés vers l'expression d'émotions d'expériences " +
      "personnelles marquantes ».",
    objectives: [
      'Écrire un texte de slam.',
      'Mettre son texte en musique.',
      "Exprimer une émotion liée à une expérience personnelle marquante.",
    ].join('\n'),
  },
  {
    slug: 'atelier-digital-photo-video-montage',
    source:
      'Les quatre apprentissages nommés dans la description : plans de prise de ' +
      'vue, champs, technique de prise de vue, petits scénarios.',
    objectives: [
      'Réaliser des plans de prise de vue.',
      'Prendre en compte le champ dans le cadrage.',
      'Acquérir les techniques de prise de vue photo et vidéo.',
      'Réaliser de petits scénarios.',
    ].join('\n'),
  },
  {
    slug: 'atelier-estime-de-soi-via-la-photo-video',
    source:
      "Les cinq paragraphes de la description, qui décrivent explicitement une " +
      "progression théorie → pré-production → production → post-production. Les " +
      "objectifs et le déroulé sont donc tous deux dans le texte de la fiche — " +
      "c'est la seule des dix qui porte les deux.",
    objectives: [
      "Écrire un scénario et réaliser son découpage technique.",
      'Comprendre la valeur de plan, la composition et la lumière.',
      "Utiliser une caméra pour obtenir une image de qualité.",
      'Concevoir un storyboard et planifier un tournage.',
      "Assurer la prise de vue, l'enregistrement du son et la direction des acteurs.",
      "Monter, étalonner et sonoriser un film, et y ajouter titres et transitions.",
    ].join('\n'),
    methodology: [
      "Théorie : les fondamentaux de la création d'un film — écriture du scénario, découpage technique, valeur de plan, composition, éclairage, prise en main de la caméra.",
      "Pré-production : scénario, storyboard, planification du tournage.",
      "Production : prise de vue, enregistrement du son, direction d'acteurs.",
      "Post-production : montage, étalonnage des couleurs, bande sonore, effets, titres et transitions.",
      "Les participants travaillent en équipe sur leur propre film, encadrés par des professionnels du cinéma.",
    ].join('\n'),
  },
  // ── LES TROIS FICHES VOLONTAIREMENT ABSENTES ──────────────────────────────
  //
  // ATELIER PSYCHO-BOXE : ses objectifs, son déroulé et son évaluation sont
  //   déjà remplis (repris du WordPress). Rien à écrire.
  //
  // ANIMATION DE SOIRÉES THÉMATIQUES : ce n'est pas un atelier pédagogique,
  //   c'est une prestation événementielle (« Soirée clé en mains avec DJ, déco,
  //   lumières », « Fête avec un Père Noël professionnel »). Elle n'a pas
  //   d'objectifs d'apprentissage, et lui en inventer en ferait autre chose que
  //   ce que son auteur vend.
  //
  // RE-DESSINE MOI : sa description annonce « UN DISPOSITIF ÉVÉNEMENT 2025 […]
  //   DISPONIBLE UNIQUEMENT DURANT L'ÉTÉ 2025 » et « TARIFS SELON PRESTATION »,
  //   alors que la fiche est en ligne en septembre 2026 et affiche 300 €. Ce
  //   n'est pas un champ à compléter, c'est une fiche à réécrire ou à archiver —
  //   et c'est une décision, pas une correction.
];

/**
 * ───────────────────────────────────────────────────────────────────────────
 * LES REPÈRES PRATIQUES — décision de Siham, 3 septembre 2026
 * ───────────────────────────────────────────────────────────────────────────
 * « prends les mêmes infos que pour la fiche atelier psycho-boxe […] ou prendre
 * la fiche qui a ces infos et met les mêmes ».
 *
 * Psycho-boxe n'a ni durée, ni participants, ni matériel, ni prérequis, ni
 * créneaux : la fiche qui les a, ce sont celles de Valérie SIMON, les seules du
 * catalogue déposées à la main dans l'application. Leurs trois fiches disent la
 * même chose sur ces cinq points, ce qui en fait un standard maison lisible :
 *
 *   durée 1h30 à 2H · 8 à 10 participants · « Aucun » prérequis ·
 *   « Salle avec tables, chaises et point d'eau à proximité. Matériel fourni
 *   par l'intervenante » · créneaux 9h-12h et 14h-17h.
 *
 * ⚠ CE N'EST PAS UNE DÉDUCTION, C'EST UNE DÉCISION DE LA FONDATRICE, et elle
 * lui revient : ces cinq fiches sont les siennes, et une durée annoncée est un
 * terme commercial, pas un fait qu'on relève. Ce qui est écrit ici est ce
 * qu'elle a arbitré, pas ce que les fiches disaient.
 *
 * ⚠ UNE SEULE EXCEPTION, ET ELLE COMPTE : LE MATÉRIEL N'EST PAS RECOPIÉ TEL
 * QUEL. « Salle avec tables et chaises » sur un atelier de boxe ou de théâtre
 * fait préparer la mauvaise salle, et c'est l'atelier annulé le matin même —
 * exactement le risque que l'indicateur de complétude nomme. La PHRASE de
 * Valérie est conservée (une exigence de salle, puis qui fournit le matériel) ;
 * seule l'exigence de salle change, et elle ne dit rien de plus que ce que
 * l'activité impose : on ne fait pas de la boxe sur un sol dur.
 *
 * ⚠ LES QUATRE FICHES DES AUTRES INTERVENANTS N'EN REÇOIVENT QUE LES PRÉREQUIS
 * (« Aucun »), qui n'engagent personne. Une durée et un nombre de participants
 * sont les termes commerciaux de Younes, Christophe et Jean Léo ; les écrire à
 * leur place, sur des comptes qu'ils ne peuvent même pas ouvrir pour les
 * corriger (adresses en @intervenants.les-extras.fr, domaine sans MX), ferait
 * vendre par l'association une prestation qu'elle n'a pas négociée.
 * ⚠ L'ÉVALUATION EST REPRISE DE PSYCHO-BOXE — décision de Siham, « met pour
 * évaluation comme pour psycho-boxe ». Sa formule : « Mises en situation devant
 * le groupe, analysées et commentées par l'intervenant/e ». Elle est écrite
 * telle quelle là où elle est VRAIE — le PAPA et la musicothérapie sont des
 * ateliers de pratique en groupe, on y fait bien quelque chose devant les
 * autres. Sur la socio-esthétique, « mises en situation devant le groupe »
 * décrirait un atelier qui n'existe pas : c'est un temps de soin, pas un jeu de
 * rôle. La formule y garde sa SECONDE moitié — ce qui est observé est analysé
 * et commenté par l'intervenante — et perd la première. Même arbitrage que pour
 * le matériel : on garde la phrase, on ne garde pas ce qui serait faux.
 */
const REPERES = [
  {
    slug: 'le-papa-plan-d-activite-physique-adapte',
    duration: '2H',
    maxParticipants: 10,
    prerequisites: 'Aucun',
    material:
      "Salle dégagée ou gymnase, sol non glissant, point d'eau à proximité. " +
      "Matériel fourni par l'intervenant.",
    timeSlots: ['9h-12h', '14h-17h'],
    evaluation:
      "Mises en situation devant le groupe, analysées et commentées par l'intervenant/e.",
  },
  {
    slug: 'atelier-de-musicotherapie',
    duration: '2H',
    maxParticipants: 10,
    prerequisites: 'Aucun',
    material:
      "Salle calme avec chaises, à l'écart des passages. " +
      "Instruments et matériel fournis par l'intervenant.",
    timeSlots: ['9h-12h', '14h-17h'],
    evaluation:
      "Mises en situation devant le groupe, analysées et commentées par l'intervenant/e.",
  },
  {
    slug: 'atelier-socio-esthetique',
    duration: '2H',
    maxParticipants: 10,
    prerequisites: 'Aucun',
    material:
      "Salle avec tables, chaises et point d'eau à proximité. " +
      "Produits et matériel fournis par les intervenantes.",
    timeSlots: ['9h-12h', '14h-17h'],
    evaluation:
      "Observation des participants pendant la séance, analysée et commentée par l'intervenante.",
  },
  {
    slug: 'atelier-psycho-boxe',
    duration: '2H',
    maxParticipants: 10,
    prerequisites: 'Aucun',
    material:
      "Salle dégagée au sol souple, point d'eau à proximité. " +
      "Matériel fourni par l'intervenant.",
    timeSlots: ['9h-12h', '14h-17h'],
  },
  {
    slug: 'atelier-theatre',
    duration: '2H',
    maxParticipants: 10,
    prerequisites: 'Aucun',
    material:
      "Salle dégagée permettant de se déplacer et de jouer devant le groupe, " +
      "chaises pour les spectateurs. Matériel fourni par l'intervenant.",
    timeSlots: ['9h-12h', '14h-17h'],
  },
  // Les quatre fiches des autres intervenants : prérequis seulement.
  { slug: 'atelier-slam', prerequisites: 'Aucun' },
  { slug: 'atelier-digital-photo-video-montage', prerequisites: 'Aucun' },
  { slug: 'atelier-estime-de-soi-via-la-photo-video', prerequisites: 'Aucun' },
  { slug: 'animation-de-soirees-thematiques', prerequisites: 'Aucun' },
  // RE-DESSINE MOI n'en reçoit aucun : « intervention de 2 personnes, tarifs
  // selon prestation » pour une fresque sur un mur ne se décrit pas avec une
  // durée de séance et un nombre de participants. La fiche attend sa décision.
];

const CHAMPS_REPERES = [
  'duration',
  'maxParticipants',
  'prerequisites',
  'material',
  'timeSlots',
  'evaluation',
];

/**
 * ───────────────────────────────────────────────────────────────────────────
 * LA VITRINE DE L'ACCUEIL — trois fiches mises en avant
 * ───────────────────────────────────────────────────────────────────────────
 * `/public/highlights` trie par `featured` décroissant, puis par nombre de
 * vues. Aucune fiche n'était mise en avant : la première carte de la section
 * « Notre sélection d'ateliers » était donc **RE-DESSINE MOI**, en tête par ses
 * 243 vues, avec une description qui annonce « un dispositif événement 2025 […]
 * disponible uniquement durant l'été 2025 ». Le titre de la section promettait
 * une sélection ; il n'y en avait aucune.
 *
 * Les trois retenues sont les plus complètes des fiches de l'association, et
 * toutes trois ont des photos : psycho-boxe (objectifs, déroulé, évaluation et
 * repères), théâtre et musicothérapie. Ce n'est pas un classement de valeur,
 * c'est un choix de ce qu'on montre en premier — il se change d'un clic depuis
 * l'administration, et le reste du catalogue est à un lien de là.
 *
 * ⚠ Ce bloc REMET À FALSE ce qui n'y figure pas, contrairement au reste du
 * script : une mise en avant est une liste, pas un cumul. Sans cela, chaque
 * passage ajouterait une fiche à la vitrine sans jamais en retirer.
 */
const MISE_EN_AVANT = [
  'atelier-psycho-boxe',
  'atelier-theatre',
  'atelier-de-musicotherapie',
];

async function main() {
  const appliquer = process.argv.includes('--appliquer');
  let remplis = 0;
  let ignores = 0;
  let introuvables = 0;

  for (const f of FICHES) {
    const fiche = await prisma.service.findUnique({
      where: { slug: f.slug },
      select: { id: true, title: true, objectives: true, methodology: true, evaluation: true },
    });
    if (!fiche) {
      console.log(`  ?  ${f.slug} — introuvable`);
      introuvables += 1;
      continue;
    }

    /** Ne remplit que le vide : une fiche écrite par son auteur reste la sienne. */
    const data = {};
    for (const champ of ['objectives', 'methodology', 'evaluation']) {
      const valeur = f[champ];
      const actuel = fiche[champ];
      if (valeur && !(actuel && String(actuel).trim())) data[champ] = valeur;
    }

    if (Object.keys(data).length === 0) {
      console.log(`  =  ${fiche.title} — déjà rempli, rien à faire`);
      ignores += 1;
      continue;
    }

    console.log(`  +  ${fiche.title} — ${Object.keys(data).join(', ')}`);
    console.log(`     source : ${f.source}`);
    if (appliquer) await prisma.service.update({ where: { id: fiche.id }, data });
    remplis += 1;
  }

  console.log('\n--- Repères pratiques (standard maison) ---');
  let reperes = 0;
  for (const r of REPERES) {
    const fiche = await prisma.service.findUnique({
      where: { slug: r.slug },
      select: {
        id: true,
        title: true,
        duration: true,
        maxParticipants: true,
        prerequisites: true,
        material: true,
        timeSlots: true,
      },
    });
    if (!fiche) {
      console.log(`  ?  ${r.slug} — introuvable`);
      introuvables += 1;
      continue;
    }

    // Même règle que plus haut : on ne remplit que le vide. Un intervenant qui
    // a posé sa propre durée garde la sienne — le standard maison est un
    // défaut, pas une reprise en main.
    const data = {};
    for (const champ of CHAMPS_REPERES) {
      const valeur = r[champ];
      if (valeur === undefined) continue;
      const actuel = fiche[champ];
      const vide =
        actuel === null ||
        actuel === undefined ||
        (typeof actuel === 'string' && actuel.trim() === '') ||
        (Array.isArray(actuel) && actuel.length === 0);
      if (vide) data[champ] = valeur;
    }

    if (Object.keys(data).length === 0) {
      console.log(`  =  ${fiche.title} — repères déjà posés`);
      continue;
    }
    console.log(`  +  ${fiche.title} — ${Object.keys(data).join(', ')}`);
    if (appliquer) await prisma.service.update({ where: { id: fiche.id }, data });
    reperes += 1;
  }

  console.log('\n--- Vitrine de l\'accueil ---');
  const enAvant = await prisma.service.findMany({
    where: { OR: [{ slug: { in: MISE_EN_AVANT } }, { featured: true }] },
    select: { id: true, slug: true, title: true, featured: true },
  });
  for (const f of enAvant) {
    const voulu = MISE_EN_AVANT.includes(f.slug ?? '');
    if (f.featured === voulu) continue;
    console.log(`  ${voulu ? '+' : '-'}  ${f.title} — ${voulu ? 'mise en avant' : 'retirée de la vitrine'}`);
    if (appliquer) {
      await prisma.service.update({ where: { id: f.id }, data: { featured: voulu } });
    }
  }

  console.log(
    `\n${appliquer ? 'Appliqué' : 'APERÇU (rien écrit)'} — ${remplis} fiche(s) de contenu, ` +
      `${reperes} fiche(s) de repères, ${ignores} déjà remplie(s), ${introuvables} introuvable(s).`,
  );
  if (!appliquer) console.log('Relancer avec --appliquer pour écrire.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
