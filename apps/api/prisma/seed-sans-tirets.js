/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * RETIRER LES TIRETS CADRATINS DU CONTENU STOCKÉ EN BASE.
 *
 * Demande de Siham, 4/09/2026 : « enlève ce sigle, tu le mets partout et ça
 * montre que c'est une IA qui a écrit, ce n'est pas utilisé par les vrais
 * gens ». Elle a raison, et le code ne suffisait pas : après le passage sur
 * les fichiers, il restait 36 tirets sur /formations et 27 sur la fiche d'un
 * parcours. Ceux-là vivent dans Postgres, pas dans le dépôt.
 *
 * ⚠ CE QUI REMPLACE QUOI. Un tiret cadratin joue trois rôles différents en
 * français, et les confondre produit du charabia :
 *   - il encadre une incise, comme deux parenthèses  → deux virgules ;
 *   - il annonce une explication en fin de phrase    → deux-points ;
 *   - il décore un intitulé ou un début de liste     → il disparaît.
 * Le choix se fait phrase par phrase, pas par un remplacement aveugle.
 *
 * ⚠ AUCUN CHAMP N'EST VIDÉ, AUCUNE LIGNE SUPPRIMÉE. On ne réécrit qu'une
 * ponctuation, et seulement dans les champs qu'un visiteur lit.
 *
 * Usage :
 *   node prisma/seed-sans-tirets.js              (aperçu, n'écrit rien)
 *   node prisma/seed-sans-tirets.js --appliquer  (écrit)
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const APPLIQUER = process.argv.includes('--appliquer');

const CADRATIN = '—';
const DEMI = '–';

/** Remplace les tirets d'un texte par la ponctuation que le lecteur attend. */
function sansTirets(texte) {
  if (typeof texte !== 'string') return texte;
  if (!texte.includes(CADRATIN) && !texte.includes(DEMI)) return texte;
  let t = texte.split(DEMI).join(CADRATIN);

  // En tête ou en fin de ligne, le tiret ne remplace rien : il décore.
  t = t
    .split('\n')
    .map((ligne) =>
      ligne
        .replace(new RegExp(`^\\s*${CADRATIN}\\s+`), '')
        .replace(new RegExp(`\\s+${CADRATIN}\\s*$`), ''),
    )
    .join('\n');

  const phrases = t.split(/(?<=[.!?:])(\s+)/);
  return phrases
    .map((bout, i) => {
      if (i % 2 === 1) return bout;
      const n = (bout.match(new RegExp(CADRATIN, 'g')) || []).length;
      if (n === 0) return bout;
      if (n > 1 || bout.includes(' : ')) {
        // Deux tirets encadrent une incise, et on n'ajoute pas un second
        // deux-points dans une phrase qui en porte déjà un.
        return bout.split(new RegExp(`\\s*${CADRATIN}\\s*`)).join(', ');
      }
      const [avant, apres] = bout.split(CADRATIN);
      const reste = apres.trim();
      if (reste.length >= 25 && reste[0] && reste[0] === reste[0].toLowerCase()) {
        return `${avant.trimEnd()} : ${reste}`;
      }
      return `${avant.trimEnd()}, ${reste}`;
    })
    .join('');
}

/** Applique `sansTirets` en profondeur dans une valeur JSON (FAQ, options…). */
function sansTiretsJson(valeur) {
  if (typeof valeur === 'string') return sansTirets(valeur);
  if (Array.isArray(valeur)) return valeur.map(sansTiretsJson);
  if (valeur && typeof valeur === 'object') {
    return Object.fromEntries(Object.entries(valeur).map(([k, v]) => [k, sansTiretsJson(v)]));
  }
  return valeur;
}

/** Les champs lus par un visiteur, table par table. */
const CIBLES = [
  {
    modele: 'formation',
    etiquette: 'Formations',
    textes: [
      'title', 'summary', 'objectives', 'prerequisites', 'program',
      'targetAudience', 'methodology', 'evaluation', 'certificationName', 'city',
    ],
    json: ['faq'],
    listes: ['publicTargets'],
  },
  {
    modele: 'service',
    etiquette: 'Ateliers',
    textes: [
      'title', 'description', 'objectives', 'prerequisites', 'material',
      'methodology', 'evaluation', 'publicTarget', 'duration', 'city',
    ],
    json: ['faq', 'priceExtras'],
    listes: ['publicTargets', 'timeSlots'],
  },
  {
    modele: 'article',
    etiquette: 'Édublog',
    textes: ['title', 'excerpt', 'content'],
    json: [],
    listes: [],
  },
  {
    modele: 'reliefMission',
    etiquette: 'Renforts',
    textes: ['title', 'description', 'city'],
    json: [],
    listes: [],
  },
];

async function main() {
  let totalLignes = 0;
  let totalChamps = 0;

  for (const cible of CIBLES) {
    const champs = [...cible.textes, ...cible.json, ...cible.listes];
    const select = Object.fromEntries([['id', true], ...champs.map((c) => [c, true])]);
    const lignes = await prisma[cible.modele].findMany({ select }).catch((e) => {
      console.log(`  ! ${cible.etiquette} : lecture impossible (${e.message.split('\n')[0]})`);
      return [];
    });

    let touchees = 0;
    for (const ligne of lignes) {
      const data = {};
      for (const c of cible.textes) {
        const neuf = sansTirets(ligne[c]);
        if (neuf !== ligne[c]) data[c] = neuf;
      }
      for (const c of cible.json) {
        if (ligne[c] == null) continue;
        const neuf = sansTiretsJson(ligne[c]);
        if (JSON.stringify(neuf) !== JSON.stringify(ligne[c])) data[c] = neuf;
      }
      for (const c of cible.listes) {
        const avant = ligne[c] ?? [];
        const neuf = avant.map(sansTirets);
        if (JSON.stringify(neuf) !== JSON.stringify(avant)) data[c] = neuf;
      }
      const noms = Object.keys(data);
      if (noms.length === 0) continue;
      touchees += 1;
      totalChamps += noms.length;
      const titre = ligne.title ?? ligne.id;
      console.log(`  ${APPLIQUER ? '✓' : '→'} ${cible.etiquette} · ${titre} (${noms.join(', ')})`);
      if (APPLIQUER) {
        await prisma[cible.modele].update({ where: { id: ligne.id }, data });
      }
    }
    console.log(`${cible.etiquette} : ${touchees}/${lignes.length} ligne(s)\n`);
    totalLignes += touchees;
  }

  console.log(
    `${totalLignes} ligne(s) et ${totalChamps} champ(s) ${APPLIQUER ? 'nettoyés' : 'à nettoyer'}.`,
  );
  if (!APPLIQUER) console.log('Aperçu seul. Relancer avec --appliquer pour écrire.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
