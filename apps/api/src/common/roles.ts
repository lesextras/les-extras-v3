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

/**
 * SUR LES EXTRAS, SEUL LE TITULAIRE ACCÈDE À SON COMPTE (24/09/2026,
 * décision de Siham, « 1 compte = 1 personne »).
 *
 * Les rattachements MANAGER / MEMBER / ADMIN créés avant cette date sur un
 * compte établissement, intervenant ou particulier restent en base (rien
 * n'est supprimé ni modifié, tout se rétablit en une ligne), mais ils
 * n'ouvrent plus rien : seul le rattachement OWNER donne accès. Les espaces
 * Piloter (ASSOCIATION, ACADEMIE) gardent leurs membres et leurs rôles.
 */
export function rattachementDonneAcces(
  typeCompte: string | null | undefined,
  role: string | null | undefined,
): boolean {
  return rolesActifs(typeCompte) || role === 'OWNER';
}

/**
 * Le même filtre, écrit pour une requête Prisma sur `Membership` : OWNER, ou
 * compte Piloter. À combiner avec le reste du `where` (statut ACTIVE…).
 */
export const FILTRE_RATTACHEMENTS_ACCESSIBLES = {
  OR: [
    { role: 'OWNER' as const },
    { account: { type: { in: [...TYPES_AVEC_ROLES] as ('ASSOCIATION' | 'ACADEMIE')[] } } },
  ],
};

/** Ce qu'on répond à un ancien membre qui tente d'ouvrir un compte Les Extras. */
export const MESSAGE_COMPTE_D_UNE_AUTRE_PERSONNE =
  'Ce compte appartient à une autre personne : sur Les Extras, un compte = une personne.';
