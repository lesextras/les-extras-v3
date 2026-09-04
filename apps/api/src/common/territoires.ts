/**
 * LE RÉFÉRENTIEL DE TERRITOIRES — une seule façon d'écrire un lieu.
 *
 * ⚠ CE FICHIER EXISTE PARCE QUE LE FILTRE DE LIEU ÉTAIT CASSÉ EN PRODUCTION.
 *
 * `Service.city` est un champ de texte libre, et le catalogue le filtrait avec
 * un `contains` insensible à la casse — mais pas aux accents ni à la
 * ponctuation. Mesuré en direct le 4/09/2026 sur les dix-sept fiches en ligne :
 *
 *     city=Île-de-France  →  10 résultats
 *     city=Ile de France  →   3 résultats
 *     city=Seine-et-Marne →   3 résultats
 *     city=Melun          →   1 résultat
 *     city=Créteil        →   0 résultat
 *
 * La même région écrite de deux façons, et AUCUNE requête ne rendait les
 * dix-sept. Pire : la liste déroulante du catalogue était construite à partir
 * des valeurs distinctes trouvées en base — elle proposait donc « Ile de
 * France » ET « Île-de-France » comme deux lieux différents. Un directeur à
 * Créteil tapait sa ville, obtenait zéro, et repartait, alors que treize fiches
 * annonçaient couvrir l'Île-de-France, donc Créteil.
 *
 * Et seize fiches sur dix-sept mettaient une RÉGION dans un champ nommé
 * « ville ». Le champ ne disait pas ce que le lecteur croyait lire.
 *
 * ⚠ CE N'EST PAS UNE CARTE, ET C'EST DÉLIBÉRÉ. Un atelier se tient CHEZ
 * l'établissement, pas à une adresse fixe : la question n'est jamais « où est
 * l'atelier » mais « est-ce que l'intervenant vient jusqu'à moi ». Une carte
 * avec des épingles répondrait à la mauvaise question. Une liste fermée de
 * départements couverts répond à la bonne.
 *
 * ⚠ TOUTE LA FRANCE, DEPUIS LE 4/09/2026 (demande de Siham). La liste s'était
 * d'abord arrêtée à l'Île-de-France, là où l'association intervient
 * aujourd'hui. C'était une erreur de cadrage : un référentiel fermé sur huit
 * départements interdit à un intervenant lyonnais de seulement DÉCRIRE son
 * territoire, donc de s'inscrire utilement. Le référentiel décrit désormais les
 * cent un départements français, DOM compris, groupés par région. Les facettes
 * du catalogue, elles, ne proposent que les territoires où il y a
 * effectivement quelque chose : la liste reste courte tant que l'offre l'est.
 *
 * ⚠ MIROIR : `apps/web/src/lib/territoires.ts`. Les deux fichiers doivent
 * rester identiques dans leurs données. Le référentiel se lit des deux côtés —
 * le serveur pour filtrer, le navigateur pour proposer.
 */

export interface Departement {
  /** Code INSEE, qui sert d'identifiant stable dans `Service.departements`. */
  code: string;
  /** Adresse lisible, pour les URL et les pages de référencement. */
  slug: string;
  nom: string;
  region: string;
}

export const DEPARTEMENTS: readonly Departement[] = [
  // Auvergne-Rhône-Alpes
  { code: "01", slug: "ain", nom: "Ain", region: "Auvergne-Rhône-Alpes" },
  { code: "03", slug: "allier", nom: "Allier", region: "Auvergne-Rhône-Alpes" },
  { code: "07", slug: "ardeche", nom: "Ardèche", region: "Auvergne-Rhône-Alpes" },
  { code: "15", slug: "cantal", nom: "Cantal", region: "Auvergne-Rhône-Alpes" },
  { code: "26", slug: "drome", nom: "Drôme", region: "Auvergne-Rhône-Alpes" },
  { code: "38", slug: "isere", nom: "Isère", region: "Auvergne-Rhône-Alpes" },
  { code: "42", slug: "loire", nom: "Loire", region: "Auvergne-Rhône-Alpes" },
  { code: "43", slug: "haute-loire", nom: "Haute-Loire", region: "Auvergne-Rhône-Alpes" },
  { code: "63", slug: "puy-de-dome", nom: "Puy-de-Dôme", region: "Auvergne-Rhône-Alpes" },
  { code: "69", slug: "rhone", nom: "Rhône", region: "Auvergne-Rhône-Alpes" },
  { code: "73", slug: "savoie", nom: "Savoie", region: "Auvergne-Rhône-Alpes" },
  { code: "74", slug: "haute-savoie", nom: "Haute-Savoie", region: "Auvergne-Rhône-Alpes" },
  // Bourgogne-Franche-Comté
  { code: "21", slug: "cote-d-or", nom: "Côte-d'Or", region: "Bourgogne-Franche-Comté" },
  { code: "25", slug: "doubs", nom: "Doubs", region: "Bourgogne-Franche-Comté" },
  { code: "39", slug: "jura", nom: "Jura", region: "Bourgogne-Franche-Comté" },
  { code: "58", slug: "nievre", nom: "Nièvre", region: "Bourgogne-Franche-Comté" },
  { code: "70", slug: "haute-saone", nom: "Haute-Saône", region: "Bourgogne-Franche-Comté" },
  { code: "71", slug: "saone-et-loire", nom: "Saône-et-Loire", region: "Bourgogne-Franche-Comté" },
  { code: "89", slug: "yonne", nom: "Yonne", region: "Bourgogne-Franche-Comté" },
  { code: "90", slug: "territoire-de-belfort", nom: "Territoire de Belfort", region: "Bourgogne-Franche-Comté" },
  // Bretagne
  { code: "22", slug: "cotes-d-armor", nom: "Côtes-d'Armor", region: "Bretagne" },
  { code: "29", slug: "finistere", nom: "Finistère", region: "Bretagne" },
  { code: "35", slug: "ille-et-vilaine", nom: "Ille-et-Vilaine", region: "Bretagne" },
  { code: "56", slug: "morbihan", nom: "Morbihan", region: "Bretagne" },
  // Centre-Val de Loire
  { code: "18", slug: "cher", nom: "Cher", region: "Centre-Val de Loire" },
  { code: "28", slug: "eure-et-loir", nom: "Eure-et-Loir", region: "Centre-Val de Loire" },
  { code: "36", slug: "indre", nom: "Indre", region: "Centre-Val de Loire" },
  { code: "37", slug: "indre-et-loire", nom: "Indre-et-Loire", region: "Centre-Val de Loire" },
  { code: "41", slug: "loir-et-cher", nom: "Loir-et-Cher", region: "Centre-Val de Loire" },
  { code: "45", slug: "loiret", nom: "Loiret", region: "Centre-Val de Loire" },
  // Corse
  { code: "2A", slug: "corse-du-sud", nom: "Corse-du-Sud", region: "Corse" },
  { code: "2B", slug: "haute-corse", nom: "Haute-Corse", region: "Corse" },
  // Grand Est
  { code: "08", slug: "ardennes", nom: "Ardennes", region: "Grand Est" },
  { code: "10", slug: "aube", nom: "Aube", region: "Grand Est" },
  { code: "51", slug: "marne", nom: "Marne", region: "Grand Est" },
  { code: "52", slug: "haute-marne", nom: "Haute-Marne", region: "Grand Est" },
  { code: "54", slug: "meurthe-et-moselle", nom: "Meurthe-et-Moselle", region: "Grand Est" },
  { code: "55", slug: "meuse", nom: "Meuse", region: "Grand Est" },
  { code: "57", slug: "moselle", nom: "Moselle", region: "Grand Est" },
  { code: "67", slug: "bas-rhin", nom: "Bas-Rhin", region: "Grand Est" },
  { code: "68", slug: "haut-rhin", nom: "Haut-Rhin", region: "Grand Est" },
  { code: "88", slug: "vosges", nom: "Vosges", region: "Grand Est" },
  // Hauts-de-France
  { code: "02", slug: "aisne", nom: "Aisne", region: "Hauts-de-France" },
  { code: "59", slug: "nord", nom: "Nord", region: "Hauts-de-France" },
  { code: "60", slug: "oise", nom: "Oise", region: "Hauts-de-France" },
  { code: "62", slug: "pas-de-calais", nom: "Pas-de-Calais", region: "Hauts-de-France" },
  { code: "80", slug: "somme", nom: "Somme", region: "Hauts-de-France" },
  // Île-de-France
  { code: "75", slug: "paris", nom: "Paris", region: "Île-de-France" },
  { code: "77", slug: "seine-et-marne", nom: "Seine-et-Marne", region: "Île-de-France" },
  { code: "78", slug: "yvelines", nom: "Yvelines", region: "Île-de-France" },
  { code: "91", slug: "essonne", nom: "Essonne", region: "Île-de-France" },
  { code: "92", slug: "hauts-de-seine", nom: "Hauts-de-Seine", region: "Île-de-France" },
  { code: "93", slug: "seine-saint-denis", nom: "Seine-Saint-Denis", region: "Île-de-France" },
  { code: "94", slug: "val-de-marne", nom: "Val-de-Marne", region: "Île-de-France" },
  { code: "95", slug: "val-d-oise", nom: "Val-d'Oise", region: "Île-de-France" },
  // Normandie
  { code: "14", slug: "calvados", nom: "Calvados", region: "Normandie" },
  { code: "27", slug: "eure", nom: "Eure", region: "Normandie" },
  { code: "50", slug: "manche", nom: "Manche", region: "Normandie" },
  { code: "61", slug: "orne", nom: "Orne", region: "Normandie" },
  { code: "76", slug: "seine-maritime", nom: "Seine-Maritime", region: "Normandie" },
  // Nouvelle-Aquitaine
  { code: "16", slug: "charente", nom: "Charente", region: "Nouvelle-Aquitaine" },
  { code: "17", slug: "charente-maritime", nom: "Charente-Maritime", region: "Nouvelle-Aquitaine" },
  { code: "19", slug: "correze", nom: "Corrèze", region: "Nouvelle-Aquitaine" },
  { code: "23", slug: "creuse", nom: "Creuse", region: "Nouvelle-Aquitaine" },
  { code: "24", slug: "dordogne", nom: "Dordogne", region: "Nouvelle-Aquitaine" },
  { code: "33", slug: "gironde", nom: "Gironde", region: "Nouvelle-Aquitaine" },
  { code: "40", slug: "landes", nom: "Landes", region: "Nouvelle-Aquitaine" },
  { code: "47", slug: "lot-et-garonne", nom: "Lot-et-Garonne", region: "Nouvelle-Aquitaine" },
  { code: "64", slug: "pyrenees-atlantiques", nom: "Pyrénées-Atlantiques", region: "Nouvelle-Aquitaine" },
  { code: "79", slug: "deux-sevres", nom: "Deux-Sèvres", region: "Nouvelle-Aquitaine" },
  { code: "86", slug: "vienne", nom: "Vienne", region: "Nouvelle-Aquitaine" },
  { code: "87", slug: "haute-vienne", nom: "Haute-Vienne", region: "Nouvelle-Aquitaine" },
  // Occitanie
  { code: "09", slug: "ariege", nom: "Ariège", region: "Occitanie" },
  { code: "11", slug: "aude", nom: "Aude", region: "Occitanie" },
  { code: "12", slug: "aveyron", nom: "Aveyron", region: "Occitanie" },
  { code: "30", slug: "gard", nom: "Gard", region: "Occitanie" },
  { code: "31", slug: "haute-garonne", nom: "Haute-Garonne", region: "Occitanie" },
  { code: "32", slug: "gers", nom: "Gers", region: "Occitanie" },
  { code: "34", slug: "herault", nom: "Hérault", region: "Occitanie" },
  { code: "46", slug: "lot", nom: "Lot", region: "Occitanie" },
  { code: "48", slug: "lozere", nom: "Lozère", region: "Occitanie" },
  { code: "65", slug: "hautes-pyrenees", nom: "Hautes-Pyrénées", region: "Occitanie" },
  { code: "66", slug: "pyrenees-orientales", nom: "Pyrénées-Orientales", region: "Occitanie" },
  { code: "81", slug: "tarn", nom: "Tarn", region: "Occitanie" },
  { code: "82", slug: "tarn-et-garonne", nom: "Tarn-et-Garonne", region: "Occitanie" },
  // Pays de la Loire
  { code: "44", slug: "loire-atlantique", nom: "Loire-Atlantique", region: "Pays de la Loire" },
  { code: "49", slug: "maine-et-loire", nom: "Maine-et-Loire", region: "Pays de la Loire" },
  { code: "53", slug: "mayenne", nom: "Mayenne", region: "Pays de la Loire" },
  { code: "72", slug: "sarthe", nom: "Sarthe", region: "Pays de la Loire" },
  { code: "85", slug: "vendee", nom: "Vendée", region: "Pays de la Loire" },
  // Provence-Alpes-Côte d'Azur
  { code: "04", slug: "alpes-de-haute-provence", nom: "Alpes-de-Haute-Provence", region: "Provence-Alpes-Côte d'Azur" },
  { code: "05", slug: "hautes-alpes", nom: "Hautes-Alpes", region: "Provence-Alpes-Côte d'Azur" },
  { code: "06", slug: "alpes-maritimes", nom: "Alpes-Maritimes", region: "Provence-Alpes-Côte d'Azur" },
  { code: "13", slug: "bouches-du-rhone", nom: "Bouches-du-Rhône", region: "Provence-Alpes-Côte d'Azur" },
  { code: "83", slug: "var", nom: "Var", region: "Provence-Alpes-Côte d'Azur" },
  { code: "84", slug: "vaucluse", nom: "Vaucluse", region: "Provence-Alpes-Côte d'Azur" },
  // Guadeloupe
  { code: "971", slug: "guadeloupe", nom: "Guadeloupe", region: "Guadeloupe" },
  // Martinique
  { code: "972", slug: "martinique", nom: "Martinique", region: "Martinique" },
  // Guyane
  { code: "973", slug: "guyane", nom: "Guyane", region: "Guyane" },
  // La Réunion
  { code: "974", slug: "la-reunion", nom: "La Réunion", region: "La Réunion" },
  // Mayotte
  { code: "976", slug: "mayotte", nom: "Mayotte", region: "Mayotte" },
] as const;

/** Les régions, dans l'ordre du référentiel, sans doublon. */
export const REGIONS: readonly string[] = [
  ...new Set(DEPARTEMENTS.map((d) => d.region)),
];

/** Les codes d'une région donnée. */
export function codesDeLaRegion(region: string): string[] {
  return DEPARTEMENTS.filter((d) => d.region === region).map((d) => d.code);
}

/**
 * Réduit un texte à sa forme comparable : minuscules, sans accent, sans
 * ponctuation. « Île-de-France », « Ile de France » et « ILE DE FRANCE »
 * donnent tous « ile de france ». C'est exactement l'égalité qui manquait.
 */
export function normaliserLieu(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Les communes que l'association nomme déjà quelque part, plus celles
 * réellement écrites sur les fiches existantes.
 *
 * ⚠ ON NE VISE PAS L'EXHAUSTIVITÉ COMMUNALE — trente-cinq mille communes dans
 * un fichier source ne se maintiennent pas, et l'intervenant coche désormais
 * ses départements lui-même. Cette table sert à LIRE l'existant : les fiches
 * saisies avant que le champ n'existe, et les recherches tapées à la main.
 */
const COMMUNES: Record<string, string> = {
  // 77 — la maison
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
  // 91
  'evry courcouronnes': '91',
  evry: '91',
  'corbeil essonnes': '91',
  massy: '91',
  etampes: '91',
  palaiseau: '91',
  // 94
  creteil: '94',
  'vitry sur seine': '94',
  'champigny sur marne': '94',
  'ivry sur seine': '94',
  // 93
  bobigny: '93',
  'saint denis': '93',
  montreuil: '93',
  'aulnay sous bois': '93',
  aubervilliers: '93',
  // 92 / 95 / 78
  nanterre: '92',
  'boulogne billancourt': '92',
  versailles: '78',
  cergy: '95',
  pontoise: '95',
  // 28 — écrit sur la fiche « sécurité incendie et gestes qui sauvent »
  hanches: '28',
  chartres: '28',
  dreux: '28',
  // Les grandes villes, parce qu'on les tape dans une recherche
  lyon: '69',
  marseille: '13',
  toulouse: '31',
  nice: '06',
  nantes: '44',
  montpellier: '34',
  strasbourg: '67',
  bordeaux: '33',
  lille: '59',
  rennes: '35',
  reims: '51',
  'le havre': '76',
  'saint etienne': '42',
  toulon: '83',
  grenoble: '38',
  dijon: '21',
  angers: '49',
  nimes: '30',
  'clermont ferrand': '63',
  tours: '37',
  amiens: '80',
  limoges: '87',
  metz: '57',
  besancon: '25',
  caen: '14',
  orleans: '45',
  rouen: '76',
  nancy: '54',
  avignon: '84',
  poitiers: '86',
  'fort de france': '972',
  'pointe a pitre': '971',
  cayenne: '973',
  'saint denis de la reunion': '974',
  mamoudzou: '976',
};

/** Le département portant ce code, ce slug ou ce nom — sinon `undefined`. */
export function trouverDepartement(valeur: string): Departement | undefined {
  const n = normaliserLieu(valeur);
  return DEPARTEMENTS.find(
    (d) => d.code === valeur.trim() || normaliserLieu(d.slug) === n || normaliserLieu(d.nom) === n,
  );
}

/** La région portant ce nom ou ce slug — sinon `undefined`. */
export function trouverRegion(valeur: string): string | undefined {
  const n = normaliserLieu(valeur);
  return REGIONS.find((r) => normaliserLieu(r) === n);
}

/**
 * LIT un lieu écrit à la main et rend les départements qu'il désigne.
 *
 * ⚠ CETTE FONCTION LIT, ELLE N'INVENTE PAS. Une fiche qui annonce
 * « Île-de-France » couvre bien les huit départements franciliens : c'est ce
 * qu'elle dit d'elle-même, pas une extrapolation. Une fiche qui annonce
 * « Melun » couvre la Seine-et-Marne — le département de Melun, pas ses
 * voisins. Un texte qu'on ne sait pas lire rend un tableau vide, et la fiche
 * garde son `city` d'origine : mieux vaut une fiche sans territoire qu'une
 * fiche à qui l'on a prêté une couverture qu'elle n'a jamais annoncée.
 */
export function departementsDepuisTexte(texte?: string | null): string[] {
  if (!texte) return [];
  const n = normaliserLieu(texte);
  if (!n) return [];

  // « Toute la France », « France entière » : tout le référentiel.
  if (n === 'france' || n === 'toute la france' || n === 'france entiere') {
    return DEPARTEMENTS.map((d) => d.code);
  }

  // Une région entière — le cas des treize fiches « Île-de-France ».
  if (n === 'idf') return codesDeLaRegion('Île-de-France');
  for (const r of REGIONS) {
    const nr = normaliserLieu(r);
    if (n === nr || n === `region ${nr}`) return codesDeLaRegion(r);
  }

  // Paris et ses arrondissements : « Paris 12e », « Paris 18e ».
  if (/^paris\b/.test(n)) return ['75'];

  // Correspondance exacte sur un code ou un nom : elle prime sur tout.
  const exact = DEPARTEMENTS.find((d) => n === d.code || n === normaliserLieu(d.nom));
  if (exact) return [exact.code];

  const trouves = new Set<string>();

  // ⚠ LA CORRESPONDANCE SE FAIT SUR DES MOTS ENTIERS, ET LES NOMS ENGLOBÉS
  // SONT ÉCARTÉS. Une simple inclusion de chaîne rattachait « Seine-et-Marne »
  // à la Marne (51), « Indre-et-Loire » à l'Indre (36) et à la Loire (42),
  // « Eure-et-Loir » à l'Eure (27) : le test l'a attrapé au premier essai.
  // On ne retient donc que les noms délimités par des mots, puis on retire
  // ceux qui sont contenus dans un autre nom déjà reconnu — le plus précis
  // gagne.
  const nomsRetenus: string[] = [];
  for (const d of DEPARTEMENTS) {
    const nom = normaliserLieu(d.nom);
    if (contientMot(n, nom)) {
      trouves.add(d.code);
      nomsRetenus.push(nom);
    }
  }
  for (const d of DEPARTEMENTS) {
    const nom = normaliserLieu(d.nom);
    if (trouves.has(d.code) && nomsRetenus.some((autre) => autre !== nom && contientMot(autre, nom))) {
      trouves.delete(d.code);
    }
  }

  for (const [commune, code] of Object.entries(COMMUNES)) {
    if (contientMot(n, commune)) trouves.add(code);
  }

  return [...trouves].sort();
}

/** `aiguille` apparaît-elle comme suite de mots entiers dans `botte` ? */
function contientMot(botte: string, aiguille: string): boolean {
  if (!aiguille) return false;
  if (botte === aiguille) return true;
  return (
    botte.startsWith(`${aiguille} `) ||
    botte.endsWith(` ${aiguille}`) ||
    botte.includes(` ${aiguille} `)
  );
}

/** Les noms lisibles, dans l'ordre du référentiel. Pour l'affichage. */
export function nomsDepartements(codes: readonly string[]): string[] {
  return DEPARTEMENTS.filter((d) => codes.includes(d.code)).map((d) => d.nom);
}

/**
 * Résumé court pour une carte de catalogue.
 *
 * On remonte d'un cran dès qu'une région est entièrement couverte : huit
 * départements franciliens se disent « Toute l'Île-de-France », pas en huit
 * noms qui débordent de la vignette. Et cent un départements se disent
 * « Toute la France ».
 */
export function resumeTerritoire(codes: readonly string[]): string | null {
  if (!codes.length) return null;
  const set = new Set(codes);
  if (DEPARTEMENTS.every((d) => set.has(d.code))) return 'Toute la France';

  // Les régions entièrement couvertes, puis les départements isolés restants.
  const morceaux: string[] = [];
  const restants = new Set(set);
  for (const r of REGIONS) {
    const codesRegion = codesDeLaRegion(r);
    if (codesRegion.every((c) => set.has(c))) {
      morceaux.push(codesRegion.length === 1 ? r : `Toute la ${r}`.replace('Toute la Î', "Toute l'Î"));
      for (const c of codesRegion) restants.delete(c);
    }
  }
  for (const nom of nomsDepartements([...restants])) morceaux.push(nom);

  if (morceaux.length === 0) return null;
  if (morceaux.length <= 2) return morceaux.join(' et ');
  return `${morceaux.slice(0, 2).join(', ')} +${morceaux.length - 2}`;
}
