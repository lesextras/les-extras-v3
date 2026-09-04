/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * REPRISE DES TERRITOIRES — lire ce que les fiches disent déjà d'elles-mêmes.
 *
 * Le champ `city` des fiches contient, en production au 4/09/2026 :
 *
 *     « Île-de-France »   10 fiches
 *     « Ile de France »    3 fiches   ← la même chose, écrite autrement
 *     « Seine-et-Marne »   3 fiches
 *     « Melun »            1 fiche
 *
 * Soit seize fiches sur dix-sept qui ne portent pas une ville dans un champ
 * nommé « ville », et deux graphies de la même région que le filtre traitait
 * comme deux lieux distincts.
 *
 * ⚠ CE SCRIPT LIT, IL N'INVENTE PAS. Une fiche qui annonce « Île-de-France »
 * couvre les huit départements franciliens — c'est ce qu'elle dit, pas une
 * extrapolation. Une fiche qui annonce « Melun » couvre la Seine-et-Marne, et
 * la Seine-et-Marne seule : on ne lui prête pas les départements voisins.
 * Un texte illisible laisse la fiche sans territoire plutôt que de lui
 * attribuer une couverture qu'elle n'a jamais annoncée.
 *
 * ⚠ IL N'ÉCRASE JAMAIS UN TERRITOIRE DÉJÀ POSÉ. Dès qu'un intervenant aura
 * coché ses départements à la main, sa saisie fait foi — relancer ce script ne
 * doit pas défaire son travail.
 *
 * Usage :
 *   node prisma/seed-territoires-ateliers.js              (aperçu, n'écrit rien)
 *   node prisma/seed-territoires-ateliers.js --appliquer  (écrit)
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const APPLIQUER = process.argv.includes('--appliquer');

// ── Référentiel, recopié de src/common/territoires.ts ────────────────────────
// Un script de seed tourne en JavaScript brut dans le conteneur, sans passer
// par la compilation TypeScript : il ne peut pas importer le module. La copie
// est volontaire et se limite aux données ; toute évolution du référentiel doit
// être reportée ici. C'est le même compromis que pour les autres seeds.
const DEPARTEMENTS = [
  { code: '75', nom: 'Paris' },
  { code: '77', nom: 'Seine-et-Marne' },
  { code: '78', nom: 'Yvelines' },
  { code: '91', nom: 'Essonne' },
  { code: '92', nom: 'Hauts-de-Seine' },
  { code: '93', nom: 'Seine-Saint-Denis' },
  { code: '94', nom: 'Val-de-Marne' },
  { code: '95', nom: "Val-d'Oise" },
];
const CODES_IDF = DEPARTEMENTS.map((d) => d.code);

const COMMUNES = {
  melun: '77',
  'dammarie les lys': '77',
  'le mee sur seine': '77',
  'vaux le penil': '77',
  'savigny le temple': '77',
  meaux: '77',
  chelles: '77',
  fontainebleau: '77',
  provins: '77',
  coulommiers: '77',
  'evry courcouronnes': '91',
  evry: '91',
  'corbeil essonnes': '91',
  massy: '91',
  etampes: '91',
  palaiseau: '91',
  creteil: '94',
  'vitry sur seine': '94',
  'champigny sur marne': '94',
  'ivry sur seine': '94',
  bobigny: '93',
  'saint denis': '93',
  montreuil: '93',
  'aulnay sous bois': '93',
  aubervilliers: '93',
  nanterre: '92',
  'boulogne billancourt': '92',
  versailles: '78',
  cergy: '95',
  pontoise: '95',
};

function normaliserLieu(texte) {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function departementsDepuisTexte(texte) {
  if (!texte) return [];
  const n = normaliserLieu(texte);
  if (!n) return [];
  if (n === 'ile de france' || n === 'idf' || n === 'region ile de france') {
    return [...CODES_IDF];
  }
  const trouves = new Set();
  if (/^paris\b/.test(n)) trouves.add('75');
  for (const d of DEPARTEMENTS) {
    if (n === d.code || n.includes(normaliserLieu(d.nom))) trouves.add(d.code);
  }
  for (const [commune, code] of Object.entries(COMMUNES)) {
    if (n === commune || n.includes(commune)) trouves.add(code);
  }
  return [...trouves].sort();
}

const nom = (codes) =>
  codes.length === CODES_IDF.length
    ? "toute l'Île-de-France"
    : DEPARTEMENTS.filter((d) => codes.includes(d.code))
        .map((d) => d.nom)
        .join(', ');

async function main() {
  const fiches = await prisma.service.findMany({
    select: { id: true, title: true, city: true, departements: true },
    orderBy: { createdAt: 'asc' },
  });

  let poses = 0;
  let deja = 0;
  let illisibles = 0;

  for (const f of fiches) {
    if (f.departements && f.departements.length > 0) {
      deja += 1;
      continue;
    }
    const codes = departementsDepuisTexte(f.city);
    if (codes.length === 0) {
      illisibles += 1;
      console.log(`  ?  ${f.title} — city=${JSON.stringify(f.city)} : illisible, laissée vide`);
      continue;
    }
    console.log(`  →  ${f.title} — ${JSON.stringify(f.city)} → ${nom(codes)}`);
    if (APPLIQUER) {
      await prisma.service.update({ where: { id: f.id }, data: { departements: codes } });
    }
    poses += 1;
  }

  console.log(
    `\n${fiches.length} fiches · ${poses} territoire(s) ${APPLIQUER ? 'posé(s)' : 'à poser'} · ` +
      `${deja} déjà renseignée(s) · ${illisibles} illisible(s)`,
  );
  if (!APPLIQUER) console.log('Aperçu seul. Relancer avec --appliquer pour écrire.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
