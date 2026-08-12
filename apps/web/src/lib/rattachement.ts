/**
 * LE COMPTE SALARIÉ QUI ATTEND SON RATTACHEMENT.
 *
 * Miroir web de `apps/api/src/common/guards/rattachement.ts`. Le serveur
 * refuse déjà tout le reste ; ce fichier sert à ne pas laisser la personne
 * découvrir ce refus écran après écran. Une porte fermée qu'on annonce n'est
 * pas la même chose qu'une porte fermée qu'on découvre.
 *
 * Ce qui reste ouvert : LEX (c'est ce qu'un professionnel peut faire seul dès
 * le premier jour), son dossier, ses crédits, ses notifications, et la
 * demande de rattachement elle-même — la seule action qui le sortira de là.
 */
export const CHEMINS_OUVERTS_SANS_RATTACHEMENT = [
  // `/dashboard` n'y figure pas volontairement : c'est LÀ que l'écran
  // d'attente s'affiche. L'y ajouter ouvrirait d'ailleurs tout le reste,
  // puisque la comparaison se fait aussi par préfixe.
  '/dashboard/assistant',
  '/dashboard/activites',
  '/dashboard/adhesion',
  '/dashboard/mon-dossier',
  '/dashboard/account',
  '/dashboard/notifications',
  '/dashboard/donnees-personnelles',
] as const;

/** Ce chemin est-il accessible à un salarié pas encore rattaché ? */
export function cheminOuvertSansRattachement(chemin: string): boolean {
  const propre = (chemin.split('?')[0] ?? '').replace(/\/+$/, '') || '/';
  return CHEMINS_OUVERTS_SANS_RATTACHEMENT.some(
    (ouvert) => propre === ouvert || propre.startsWith(`${ouvert}/`),
  );
}
