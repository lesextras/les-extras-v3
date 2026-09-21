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
const f6 = require('./f6-crise.js');
const f7 = require('./f7-consignes.js');
const f8 = require('./f8-survie.js');
const f9 = require('./f9-ess.js');
const f10 = require('./f10-demarrer.js');
const f11 = require('./f11-renforcer.js');
const f12 = require('./f12-decrire.js');
const f13 = require('./f13-mesurer.js');

/** ids des items Teachizy, relevés après la création des sections. */
const IDS = {
  'les-quatre-fonctions-d-un-comportement': { lecons: [1470796, 1470797, 1470798, 1470799], annexes: 1470871 },
  'apprendre-a-demander-plutot-qu-a-crier': { lecons: [1470800, 1470801, 1470802, 1470803], annexes: 1470877 },
  'guider-puis-s-effacer': { lecons: [1470804, 1470805, 1470806, 1470807], annexes: 1470883 },
  'decomposer-une-routine-en-etapes': { lecons: [1470811, 1470812, 1470813, 1470814], annexes: 1470889 },
  'rendre-l-environnement-previsible': { lecons: [1470815, 1470816, 1470817, 1470818], annexes: 1470895 },
  'les-premieres-minutes-d-une-crise': { lecons: [1471071, 1471073, 1471075, 1471077], annexes: 1471079 },
  'l-enfant-qui-dit-non-a-tout': { lecons: [1471173, 1471175, 1471177, 1471179], annexes: 1471181 },
  'lire-un-comportement-comme-une-reaction-de-survie': { lecons: [1471249, 1471251, 1471253, 1471255], annexes: 1471257 },
  'preparer-une-equipe-de-suivi-de-la-scolarisation': { lecons: [1471320, 1471322, 1471324, 1471326], annexes: 1471328 },
  'aider-a-demarrer-une-tache': { lecons: [1471644, 1471646, 1471648, 1471650], annexes: 1471652 },
  'renforcer-ce-qui-va': { lecons: [1474350, 1474352, 1474354, 1474356], annexes: 1474358 },
  'decrire-un-comportement-sans-le-juger': { lecons: [1474360, 1474362, 1474364, 1474366], annexes: 1474368 },
  'mesurer-un-comportement-ligne-de-base': { lecons: [1499516, 1499518, 1499520, 1499522], annexes: 1499524 },
};

/**
 * Les formations dont le contenu vient de l'analyse appliquée du comportement
 * portent l'encart de nuance. « Rendre l'environnement prévisible » n'en est
 * pas : y coller l'encart serait aussi faux que de l'omettre ailleurs.
 *
 * « L'enfant qui dit non à tout » n'en est pas non plus : elle porte sur la
 * FORME DE LA CONSIGNE de l'adulte, pas sur le comportement de la personne, et
 * elle a son propre garde-fou, plus adapté — la colonne « son droit », écrite
 * au module 3 avant toute technique. Coller l'encart ABA ici laisserait croire
 * que le contenu en vient, ce qui n'est pas le cas.
 */
const COMPORTEMENTALES = new Set([
  'les-quatre-fonctions-d-un-comportement',
  'apprendre-a-demander-plutot-qu-a-crier',
  'guider-puis-s-effacer',
  'decomposer-une-routine-en-etapes',
  // Le parcours « crise » porte l'encart pour une raison de plus que les
  // autres : c'est le seul dont les contenus voisinent avec des pratiques de
  // contrainte, et l'encart est le seul endroit qui dise que ces pratiques
  // n'appartiennent pas à cette approche.
  'les-premieres-minutes-d-une-crise',
  // « Aider quelqu'un à démarrer une tâche » : l'amorçage et son retrait
  // viennent du même corpus. La fiche publique porte le garde-fou (GARDE_FOU
  // dans le seed) : les deux doivent dire la même chose, sinon la fiche promet
  // autre chose que la formation.
  'aider-a-demarrer-une-tache',
  // « Renforcer ce qui va » vient directement de l'analyse appliquee du
  // comportement : c'est le parcours ou l'encart est le plus necessaire.
  // « Decrire un comportement sans le juger » ne le porte PAS : il traite de
  // l'ecrit professionnel, pas d'une technique comportementale.
  'renforcer-ce-qui-va',
  // « Mesurer un comportement » : ligne de base, unites de mesure et lecture de
  // courbe viennent en droite ligne de l'analyse appliquee du comportement.
  // C'est meme le parcours ou l'encart compte le plus : il enseigne a produire
  // un CHIFFRE sur quelqu'un, et l'encart est le seul endroit qui rappelle que
  // ce chiffre ne se met jamais au service de l'equipe contre la personne.
  'mesurer-un-comportement-ligne-de-base',
]);

const SOURCES = [
  { f: f1, annexes: f1annexes.HTML },
  { f: f2, annexes: f2.annexes },
  { f: f3, annexes: f3.annexes },
  { f: f4, annexes: f4.annexes },
  { f: f5, annexes: f5.annexes },
  { f: f6, annexes: f6.annexes },
  { f: f7, annexes: f7.annexes },
  { f: f8, annexes: f8.annexes },
  { f: f9, annexes: f9.annexes },
  { f: f10, annexes: f10.annexes },
  { f: f11, annexes: f11.annexes },
  { f: f12, annexes: f12.annexes },
  { f: f13, annexes: f13.annexes },
];

/**
 * LA FICHE RÉCAP, en tête des annexes.
 *
 * C'est la page A4 qui résume tout le parcours (voir `fiches-recap.js`). Elle
 * arrive AVANT les fiches techniques parce que c'est celle qu'on imprime en
 * premier, et qu'elle porte la grille de relevé vierge.
 *
 * ⚠ Un LIEN, pas une image. L'API stocke sans doute une balise <img>, mais le
 * rendu côté apprenant n'a pas pu être vérifié sans compte élève — et une image
 * cassée en tête des annexes serait pire que pas d'image du tout. Même règle
 * que pour le SVG dans `schemas.js`.
 */
function ficheRecap(slug) {
  const url = 'https://les-extras.fr/fiches/' + slug + '.pdf';
  return `<div style="border:2px solid #cf6f56;border-radius:10px;padding:16px 18px;margin:0 0 22px">
<h3 style="margin-top:0;color:#8a3a2e">La fiche récap — une page A4, à imprimer</h3>
<p>Tout le parcours tient sur une page&nbsp;: la notion clé et son test, les quatre
modules et ce qu’ils produisent, le schéma central, l’arbre de décision du relevé,
<strong>la grille de relevé vierge à recopier</strong>, les erreurs qui coûtent le
plus, et l’essentiel à retenir.</p>
<p style="margin-bottom:0"><strong>Téléchargement direct, sans inscription&nbsp;:</strong><br>
<a href="${url}" target="_blank" rel="noopener">${url}</a></p>
</div>`;
}

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
    annexes: { id: ids.annexes, html: ficheRecap(f.slug) + '\n' + annexes + '\n' + pied },
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
