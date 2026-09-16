/**
 * NORMALISATION D'UN NOM — clé de rapprochement, jamais un libellé.
 *
 * Sert à deux unicités : le nom d'un service dans un établissement
 * (`OrgUnit.nomNormalise`) et le nom d'une structure (`Structure.nomNormalise`).
 *
 * ⚠ CETTE FONCTION A UN JUMEAU EN SQL, dans la migration
 * `20260916120000_structure_niveaux_messagerie`. Les deux doivent produire
 * exactement le même résultat : la migration remplit les lignes existantes, ce
 * fichier remplit les nouvelles, et une divergence laisserait passer le doublon
 * que l'index unique est censé interdire. Si vous changez la règle ici,
 * changez-la là-bas, et prévoyez une migration de remplissage.
 *
 * La règle : minuscules, accents retirés, tout ce qui n'est ni lettre ni
 * chiffre supprimé. C'est ce qui fait tomber « SESSAD », « Sessad » et
 * « S.E.S.S.A.D. » sur la même clé — les trois orthographes qu'un même
 * établissement produit vraiment.
 */
export function normaliserNom(valeur: string): string {
  return (valeur ?? '')
    .normalize('NFD')
    // Diacritiques combinants : c'est ce que NFD vient de séparer des lettres.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Vrai quand deux noms désignent le même service ou la même structure, aux
 * variations d'écriture près.
 */
export function memeNom(a: string, b: string): boolean {
  const na = normaliserNom(a);
  return na !== '' && na === normaliserNom(b);
}
