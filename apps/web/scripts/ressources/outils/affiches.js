const { B } = require('../dsl.js');
const { ENF } = require('./commun.js');

const base = { cat: 'affiches', theme: 'Affiches', metiers: ENF, classe: 'poster', format: 'Affiche A4', mod: ['docx'] };

module.exports = [
  {
    ...base,
    id: 'affiche-se-laver-les-mains',
    titre: 'Affiche : se laver les mains en 6 étapes',
    description: 'Six étapes en images, à coller au-dessus du lavabo, pour les petits comme pour les grands.',
    publics: ['petite-enfance', 'enfants', 'adultes'],
    theme: 'Hygiène',
    kicker: 'Affiche · hygiène',
    t1: 'Je me lave', t2: 'les mains', sous: 'six étapes, au-dessus du lavabo',
    corps: [
      B.cartes({ items: [['💧', '1. Je mouille mes mains'], ['🧴', '2. Je mets du savon'], ['👐', '3. Je frotte paumes et dos'], ['🖐️', '4. Entre les doigts et les ongles'], ['🚿', '5. Je rince'], ['🧻', '6. Je sèche bien']], cols: 2, h: 62 }),
    ],
  },
  {
    ...base,
    id: 'affiche-coin-calme',
    titre: 'Affiche : le coin calme',
    description: 'Les règles du coin calme : on y va pour se reposer, pas pour être puni, on peut y rester un moment, on revient quand on est prêt.',
    publics: ['petite-enfance', 'enfants', 'ados'],
    theme: 'Émotions',
    kicker: 'Affiche · coin calme',
    t1: 'Le coin', t2: 'calme', sous: 'pour se poser, jamais pour être puni',
    corps: [
      B.cartes({ items: [['🧸', 'J’y vais quand j’en ai besoin'], ['🤫', 'J’y parle doucement'], ['⏳', 'Je reste le temps qu’il faut'], ['🙋', 'Je peux demander un adulte'], ['🚶', 'Je reviens quand je suis prêt'], ['💛', 'Ce n’est pas une punition']], cols: 2, h: 60 }),
    ],
  },
  {
    ...base,
    id: 'affiche-les-roles-du-jour',
    titre: 'Affiche : les rôles du jour',
    description: 'Le responsable de la table, du rangement, de la météo, des plantes… huit rôles avec une case pour le prénom du jour.',
    publics: ['enfants'],
    metiers: ['education', 'animation', 'protection', 'handicap'],
    theme: 'Vie de groupe',
    kicker: 'Affiche · vie de groupe',
    t1: 'Les rôles', t2: 'du jour', sous: 'chacun son tour',
    corps: [
      B.tableau({ cols: [{ t: '', w: 14 }, { t: 'Rôle', w: 46 }, { t: 'Aujourd’hui, c’est', w: 40 }], emo: true, lignes: [['🍽️', 'Je mets la table'], ['🧹', 'Je range le matériel'], ['☀️', 'Je donne la météo'], ['🪴', 'J’arrose les plantes'], ['💡', 'J’éteins les lumières'], ['📅', 'Je change la date'], ['🔔', 'J’annonce la fin de l’activité'], ['🤝', 'J’accueille les nouveaux']].map((l) => [...l, '']), h: 22 }),
    ],
  },
  {
    ...base,
    id: 'affiche-nos-reussites',
    titre: 'Affiche : nos réussites du mois',
    description: 'Un mur des réussites à remplir au fil du mois avec le groupe : ce qu’on a appris, réussi, fait ensemble.',
    publics: ['enfants', 'ados', 'adultes'],
    metiers: ['education', 'animation', 'protection', 'handicap', 'social'],
    theme: 'Motivation',
    kicker: 'Affiche · motivation',
    t1: 'Nos réussites', t2: 'du mois', sous: 'on les écrit, on les fête',
    corps: [
      B.champs({ items: [['Mois', 1]] }),
      B.cartes({ items: [['🌟', ''], ['🌟', ''], ['🌟', ''], ['🌟', ''], ['🌟', ''], ['🌟', ''], ['🌟', ''], ['🌟', ''], ['🌟', '']], cols: 3, h: 60 }),
    ],
  },
  {
    ...base,
    id: 'affiche-on-range-ensemble',
    titre: 'Affiche : on range ensemble',
    description: 'Six gestes du rangement en images, pour que la fin d’activité se passe toujours de la même façon.',
    publics: ['petite-enfance', 'enfants'],
    theme: 'Vie de groupe',
    kicker: 'Affiche · rangement',
    t1: 'On range', t2: 'ensemble', sous: 'à la fin de chaque activité',
    corps: [
      B.cartes({ items: [['🔔', 'J’entends le signal'], ['✋', 'J’arrête ce que je fais'], ['🧺', 'Je range le jeu dans sa boîte'], ['📦', 'Je remets la boîte à sa place'], ['🪑', 'Je range ma chaise'], ['👍', 'Je vérifie avec un copain']], cols: 2, h: 62 }),
    ],
  },
];
