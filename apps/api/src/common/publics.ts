/**
 * LES PUBLICS D'UN ATELIER, SANS DOUBLONS DE GRAMMAIRE (24/09/2026).
 *
 * Les fiches sont saisies à la main : « Enfant » sur l'une, « Enfants » sur
 * l'autre, « Sénior » et « Séniors », « Adolescent » et « Adolescents ». Le
 * filtre du catalogue les proposait comme des publics différents, et choisir
 * « Enfant » CACHAIT les fiches marquées « Enfants ».
 *
 * On ne réécrit pas les fiches (c'est la saisie de leur auteur) : on regroupe
 * à la lecture. Même clé = même public : minuscules, sans accents, sans le
 * pluriel final. Le libellé affiché est la forme la plus fréquente, au pluriel
 * en cas d'égalité ; le filtre interroge TOUTES les variantes de la clé.
 */
export function clePublic(libelle: string): string {
  return libelle
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((m) => (m.length > 3 ? m.replace(/[sx]$/, '') : m))
    .join(' ');
}

/** Regroupe les libellés : une entrée par public, avec toutes ses variantes. */
export function regrouperPublics(libelles: string[]): { libelle: string; variantes: string[] }[] {
  const groupes = new Map<string, Map<string, number>>();
  for (const l of libelles) {
    if (!l?.trim()) continue;
    const cle = clePublic(l);
    const g = groupes.get(cle) ?? new Map<string, number>();
    g.set(l.trim(), (g.get(l.trim()) ?? 0) + 1);
    groupes.set(cle, g);
  }
  return [...groupes.values()]
    .map((g) => {
      const variantes = [...g.keys()];
      const libelle = [...g.entries()].sort(
        (a, b) => b[1] - a[1] || b[0].length - a[0].length || a[0].localeCompare(b[0], 'fr'),
      )[0][0];
      return { libelle, variantes };
    })
    .sort((a, b) => a.libelle.localeCompare(b.libelle, 'fr'));
}

/** Toutes les variantes connues du public demandé (lui compris). */
export function variantesDe(demande: string, connus: string[]): string[] {
  const cle = clePublic(demande);
  const v = new Set([demande, ...connus.filter((c) => clePublic(c) === cle)]);
  return [...v];
}

/**
 * Variantes probables sans lecture de la base (singulier, pluriel) : pour les
 * requêtes construites de façon synchrone, comme les alertes de recherche.
 */
export function variantesSimples(libelle: string): string[] {
  const l = libelle.trim();
  const v = new Set([l]);
  if (/[sx]$/i.test(l) && l.length > 3) v.add(l.slice(0, -1));
  else v.add(`${l}s`);
  return [...v];
}
