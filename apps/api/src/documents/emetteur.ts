import { logoAdepa, LOGO_ADEPA_RATIO } from './logo-adepa';

/**
 * À QUI APPARTIENT LE LOGO IMPRIMÉ EN TÊTE D'UN DOCUMENT.
 *
 * Un devis et une facture portent l'identité de CELUI QUI LES ÉMET, jamais
 * celle de la plateforme. C'est le sens même de ces pièces : le SIRET imprimé
 * en tête engage son porteur, et un logo posé au-dessus d'un SIRET qui n'est
 * pas le sien laisserait croire que l'association émet une facture qu'elle
 * n'émet pas.
 *
 * Aujourd'hui, un seul émetteur a un logo : l'association, pour les documents
 * qu'elle émet elle-même — les devis et factures de formation, et les crédits
 * LEX. Les intervenants indépendants facturent sous leur propre SIRET et n'ont
 * pas déposé de logo ; leurs documents sortent donc sans, ce qui est correct.
 *
 * ── Pourquoi une reconnaissance par le nom, et ce qu'elle vaut ─────────────
 *
 * Le schéma ne distingue pas l'association d'un autre compte établissement :
 * `AccountType` ne connaît que ESTABLISHMENT et FREELANCE. Le produit s'appuie
 * déjà sur le nom pour la retrouver — voir `AdminService`, qui rattache les
 * formations au premier compte dont le nom contient « adepa ». On applique ici
 * la MÊME règle plutôt qu'une seconde, différente, qui divergerait un jour.
 *
 * C'est une reconnaissance par convention, pas par identité : le jour où un
 * autre émetteur voudra son logo, le bon geste sera un champ `logoUrl` sur le
 * compte et un dépôt de fichier, pas une deuxième exception ici.
 */
export interface LogoEmetteur {
  image: Buffer;
  /** largeur / hauteur, pour ne jamais déformer la marque. */
  ratio: number;
}

/** Vrai quand la raison sociale désigne l'association. */
export function estLAssociation(nom: string | null | undefined): boolean {
  if (!nom) return false;
  // Sans accents ni casse : « ADéPA », « ADEPA », « Adepa 77 » sont le même
  // compte, et l'orthographe saisie un jour d'inscription ne doit pas décider
  // si le document sort avec ou sans logo.
  const normalise = nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return normalise.includes('adepa');
}

/**
 * Le logo à imprimer pour cet émetteur, ou `null`.
 *
 * On passe la raison sociale ET le nom d'usage : un compte peut porter
 * « ADéPA » en raison sociale et un nom d'usage différent, ou l'inverse.
 */
export function logoDeLEmetteur(
  legalName: string | null | undefined,
  name?: string | null,
): LogoEmetteur | null {
  if (!estLAssociation(legalName) && !estLAssociation(name)) return null;
  return { image: logoAdepa(), ratio: LOGO_ADEPA_RATIO };
}
