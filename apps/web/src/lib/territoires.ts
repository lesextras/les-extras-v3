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
 * dix-sept. Pire : la liste déroulante du catalogue est construite à partir des
 * valeurs distinctes trouvées en base — elle proposait donc « Ile de France »
 * ET « Île-de-France » comme deux lieux différents. Un directeur à Créteil
 * tapait sa ville, obtenait zéro, et repartait, alors que treize fiches
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
 * ⚠ MIROIR : `apps/api/src/common/territoires.ts`. Les deux fichiers doivent
 * rester identiques dans leurs données. Le référentiel se lit des deux côtés —
 * le serveur pour filtrer, le navigateur pour proposer.
 *
 * La liste s'arrête à l'Île-de-France parce que c'est là qu'ADéPA intervient.
 * Elle s'allongera le jour où l'association s'étendra ; d'ici là, une liste qui
 * propose la Creuse à un directeur de Melun n'aide personne.
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
  { code: '75', slug: 'paris', nom: 'Paris', region: 'Île-de-France' },
  { code: '77', slug: 'seine-et-marne', nom: 'Seine-et-Marne', region: 'Île-de-France' },
  { code: '78', slug: 'yvelines', nom: 'Yvelines', region: 'Île-de-France' },
  { code: '91', slug: 'essonne', nom: 'Essonne', region: 'Île-de-France' },
  { code: '92', slug: 'hauts-de-seine', nom: 'Hauts-de-Seine', region: 'Île-de-France' },
  { code: '93', slug: 'seine-saint-denis', nom: 'Seine-Saint-Denis', region: 'Île-de-France' },
  { code: '94', slug: 'val-de-marne', nom: 'Val-de-Marne', region: 'Île-de-France' },
  { code: '95', slug: "val-d-oise", nom: "Val-d'Oise", region: 'Île-de-France' },
] as const;

export const CODES_IDF = DEPARTEMENTS.map((d) => d.code);

/**
 * Réduit un texte à sa forme comparable : minuscules, sans accent, sans
 * ponctuation. « Île-de-France », « Ile de France » et « ILE DE FRANCE »
 * donnent tous « ile de france ». C'est exactement l'égalité qui manquait.
 */
export function normaliserLieu(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Les communes que l'association nomme déjà quelque part — les mêmes que
 * `apps/web/src/app/(public)/renfort/donnees.ts`, plus le chef-lieu de chaque
 * département. On ne cherche pas l'exhaustivité communale : on veut pouvoir
 * lire ce qui est ÉCRIT sur les fiches existantes sans rien inventer.
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
  // 92 / 95 / 78 — chefs-lieux, pour que la liste ne soit pas bancale
  nanterre: '92',
  'boulogne billancourt': '92',
  versailles: '78',
  cergy: '95',
  pontoise: '95',
};

/** Le département portant ce code, ce slug ou ce nom — sinon `undefined`. */
export function trouverDepartement(valeur: string): Departement | undefined {
  const n = normaliserLieu(valeur);
  return DEPARTEMENTS.find(
    (d) => d.code === valeur.trim() || normaliserLieu(d.slug) === n || normaliserLieu(d.nom) === n,
  );
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

  // La région entière, sous toutes ses graphies — le cas des treize fiches.
  if (n === 'ile de france' || n === 'idf' || n === 'region ile de france') {
    return [...CODES_IDF];
  }

  const trouves = new Set<string>();

  // Paris et ses arrondissements : « Paris 12e », « Paris 18e ».
  if (/^paris\b/.test(n)) trouves.add('75');

  for (const d of DEPARTEMENTS) {
    if (n === d.code || n.includes(normaliserLieu(d.nom))) trouves.add(d.code);
  }
  for (const [commune, code] of Object.entries(COMMUNES)) {
    if (n === commune || n.includes(commune)) trouves.add(code);
  }

  return [...trouves].sort();
}

/** Les noms lisibles, dans l'ordre du référentiel. Pour l'affichage. */
export function nomsDepartements(codes: readonly string[]): string[] {
  return DEPARTEMENTS.filter((d) => codes.includes(d.code)).map((d) => d.nom);
}

/**
 * Résumé court pour une carte de catalogue. Huit départements franciliens,
 * c'est « Toute l'Île-de-France » — pas une liste de huit noms qui déborde de
 * la vignette.
 */
export function resumeTerritoire(codes: readonly string[]): string | null {
  if (!codes.length) return null;
  const idf = CODES_IDF.every((c) => codes.includes(c));
  if (idf) return "Toute l'Île-de-France";
  const noms = nomsDepartements(codes);
  if (noms.length <= 2) return noms.join(' et ');
  return `${noms.slice(0, 2).join(', ')} +${noms.length - 2}`;
}
