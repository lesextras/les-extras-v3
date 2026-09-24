/**
 * LES RÔLES N'EXISTENT PLUS SUR LES EXTRAS (24/09/2026, décision de Siham).
 *
 * Depuis le modèle du 23/09 — « le compte, c'est la personne » — un compte
 * Les Extras (établissement, intervenant, particulier) n'a qu'un titulaire.
 * Direction, administration, chef de service, salarié, et les droits
 * déclarés qui les complétaient (« Réserver directement », « Utiliser les
 * générations LEX »…) ne veulent plus rien dire : ils sont retirés des
 * routes et des services. Toute personne active sur un compte Les Extras y
 * fait tout.
 *
 * ⚠ LES ESPACES PILOTER GARDENT LEURS DROITS D'ACCÈS. Une association ou une
 * académie invite son équipe et décide jusqu'où chacun va (écran « Droits
 * d'accès », parité Teachizy). Là, le rôle reste lu : c'est la seule raison
 * d'être de ce fichier.
 *
 * ⚠ La colonne `Membership.role` et l'énumération `AccountRole` restent en
 * base : les retirer serait une migration destructive pour une donnée que
 * plus rien ne lit côté Les Extras. Rien n'est supprimé, tout se rétablit en
 * une ligne.
 */
export const TYPES_AVEC_ROLES: ReadonlySet<string> = new Set(['ASSOCIATION', 'ACADEMIE']);

/** Le rôle compte-t-il pour ce type de compte ? Non sur Les Extras, oui sur Piloter. */
export function rolesActifs(typeCompte: string | null | undefined): boolean {
  return Boolean(typeCompte && TYPES_AVEC_ROLES.has(typeCompte));
}
