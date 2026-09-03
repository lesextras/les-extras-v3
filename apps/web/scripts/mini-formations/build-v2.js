/**
 * Assemble le fichier source v2 des mini-formations.
 *
 * Ce fichier est servi par le site (`/formations-source/v2.json`, en-tête CORS)
 * et lu par UN SEUL appel JavaScript depuis la plateforme pédagogique, qui pose
 * le contenu de chaque module et de chaque page d'annexes. Sans lui, il faudrait
 * vingt-cinq copier-coller — et cent quatre pour les dix-huit formations prévues.
 *
 * Les trois encarts obligatoires (nuance comportementale, avertissement,
 * attestation) sont ajoutés ICI, à la fin du dernier module, pour qu'aucune
 * formation ne puisse partir sans eux.
 */

const fs = require('fs');
const {
  ATTESTATION,
  AVERTISSEMENT,
  NUANCE_COMPORTEMENTALE,
} = require('./catalogue-mini-formations.js');

const f1 = require('./f1-fonctions.js');
const f1annexes = require('./f1-annexes.js');
const f2 = require('./f2-demander.js');
const f3 = require('./f3-guider.js');
const f4 = require('./f4-chainage.js');
const f5 = require('./f5-previsible.js');

/** ids des items Teachizy, relevés après la création des sections. */
const IDS = {
  'les-quatre-fonctions-d-un-comportement': { lecons: [1470796, 1470797, 1470798, 1470799], annexes: 1470871 },
  'apprendre-a-demander-plutot-qu-a-crier': { lecons: [1470800, 1470801, 1470802, 1470803], annexes: 1470877 },
  'guider-puis-s-effacer': { lecons: [1470804, 1470805, 1470806, 1470807], annexes: 1470883 },
  'decomposer-une-routine-en-etapes': { lecons: [1470811, 1470812, 1470813, 1470814], annexes: 1470889 },
  'rendre-l-environnement-previsible': { lecons: [1470815, 1470816, 1470817, 1470818], annexes: 1470895 },
};

/**
 * Les formations dont le contenu vient de l'analyse appliquée du comportement
 * portent l'encart de nuance. « Rendre l'environnement prévisible » n'en est
 * pas : y coller l'encart serait aussi faux que de l'omettre ailleurs.
 */
const COMPORTEMENTALES = new Set([
  'les-quatre-fonctions-d-un-comportement',
  'apprendre-a-demander-plutot-qu-a-crier',
  'guider-puis-s-effacer',
  'decomposer-une-routine-en-etapes',
]);

const SOURCES = [
  { f: f1, annexes: f1annexes.HTML },
  { f: f2, annexes: f2.annexes },
  { f: f3, annexes: f3.annexes },
  { f: f4, annexes: f4.annexes },
  { f: f5, annexes: f5.annexes },
];

const formations = SOURCES.map(({ f, annexes }) => {
  const ids = IDS[f.slug];
  if (!ids) throw new Error('ids manquants pour ' + f.slug);
  const pied =
    (COMPORTEMENTALES.has(f.slug) ? NUANCE_COMPORTEMENTALE : '') +
    AVERTISSEMENT +
    ATTESTATION;
  return {
    slug: f.slug,
    uuid: f.uuid,
    modules: f.modules.map((m, i) => ({
      id: ids.lecons[i],
      // Le titre part aussi : les items Teachizy s'appelaient « Leçon — … » et
      // le sommaire affichait quatre lignes presque identiques. Le chargeur
      // pose `name` en même temps que le contenu.
      nom: m.titre,
      minutes: m.minutes,
      // Le pied obligatoire ne s'ajoute qu'au dernier module.
      html: i === f.modules.length - 1 ? m.html + '\n' + pied : m.html,
    })),
    annexes: { id: ids.annexes, html: annexes + '\n' + pied },
  };
});

const sortie = { genere: '2026-09-03', version: 2, formations };
const chemin = require('path').join(__dirname, '..', '..', 'public', 'formations-source', 'v2.json');
fs.writeFileSync(chemin, JSON.stringify(sortie, null, 2));

let total = 0;
for (const f of formations) {
  const n = f.modules.reduce((a, m) => a + m.html.length, 0) + f.annexes.html.length;
  total += n;
  console.log(
    f.slug.padEnd(40),
    f.modules.map((m) => String(m.html.length).padStart(6)).join(' '),
    '| annexes',
    String(f.annexes.html.length).padStart(6),
  );
}
console.log('\ntotal', total, 'caracteres —', fs.statSync(chemin).size, 'octets dans v2.json');
