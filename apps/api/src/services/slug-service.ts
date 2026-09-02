/**
 * L'ADRESSE LISIBLE D'UNE FICHE.
 *
 * Une fiche vivait à `/ateliers/cms3it0g70015lt1wyr4sbhqr`. Le mot-clé le plus
 * fort de la fiche — « psycho-boxe », « socio-esthétique » — n'apparaissait
 * nulle part dans son adresse, et l'adresse était impartageable telle quelle :
 * collée dans un mail à une direction ou sur LinkedIn, elle ne dit rien de ce
 * qu'elle ouvre.
 *
 * La migration `20260902113000_service_slug` a servi l'existant ; ce module
 * sert les fiches créées ENSUITE. Sans lui, la correction n'aurait tenu que
 * jusqu'au prochain atelier publié.
 */

/** Correspondance accent → lettre nue. Miroir exact du `translate` SQL. */
const SANS_ACCENT: Record<string, string> = {
  à: 'a', á: 'a', â: 'a', ã: 'a', ä: 'a', å: 'a', æ: 'a',
  è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', í: 'i', î: 'i', ï: 'i',
  ò: 'o', ó: 'o', ô: 'o', õ: 'o', ö: 'o', ø: 'o', œ: 'o',
  ù: 'u', ú: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n', ÿ: 'y',
};

/**
 * Le slug nu d'un titre. Peut renvoyer une chaîne VIDE (titre fait
 * uniquement de ponctuation) : l'appelant doit alors s'en passer et laisser
 * la fiche sur son identifiant.
 *
 * On normalise en NFD puis on retire les diacritiques : c'est la même
 * opération que le `translate` de la migration, mais elle couvre en plus les
 * accents que la table n'énumère pas. Surtout, elle ne fabrique JAMAIS un
 * « the-a-tre » — le défaut qui a valu douze adresses illisibles à l'Édublog
 * venait d'un découpage qui remplaçait le diacritique par un tiret au lieu de
 * le supprimer.
 */
export function slugDepuisTitre(titre: string): string {
  return titre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[à-ÿœæ]/g, (c) => SANS_ACCENT[c] ?? c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120)
    .replace(/-$/, '');
}

/**
 * Un slug LIBRE, à partir du titre.
 *
 * `estPris` interroge la base. On suffixe `-2`, `-3`… comme le fait la
 * migration, pour que les deux voies produisent les mêmes formes. Au-delà de
 * quelques homonymes on rend `null` : la fiche garde son identifiant, ce qui
 * est un défaut d'esthétique, jamais une panne.
 */
export async function slugLibre(
  titre: string,
  estPris: (slug: string) => Promise<boolean>,
  maxTentatives = 20,
): Promise<string | null> {
  const base = slugDepuisTitre(titre);
  if (!base) return null;
  for (let n = 1; n <= maxTentatives; n += 1) {
    const candidat = n === 1 ? base : `${base}-${n}`;
    if (!(await estPris(candidat))) return candidat;
  }
  return null;
}
