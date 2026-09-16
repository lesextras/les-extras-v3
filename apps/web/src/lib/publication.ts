import type { AccountRole } from './types';

/**
 * QUI PEUT PUBLIER — la règle du serveur, recopiée une seule fois.
 *
 * ⚠ Côté API, créer une fiche de service ou une mission de renfort exige un
 * rôle OWNER, ADMIN ou MANAGER sur le compte actif (`AccountRolesGuard`). Un
 * MEMBER consulte et candidate, il ne publie pas.
 *
 * ⚠⚠ ELLE ÉTAIT ÉCRITE DANS `ActionsPublication.tsx` ET NULLE PART AILLEURS.
 * `/dashboard/ateliers` montait `ServiceModal` à TROIS endroits — l'en-tête,
 * l'état vide et le bouton « Compléter la fiche » de chaque carte — sans
 * jamais regarder le rôle. Un membre simple voyait donc « Créer un atelier »,
 * remplissait le formulaire en entier, et se faisait refuser à l'envoi. C'est
 * le « bouton qui mène à un refus » que le reste du produit s'interdit
 * partout, et il coûte ici un formulaire long perdu.
 *
 * ⚠ CE N'EST PAS UN SECOND JEU DE RÈGLES : c'est le serveur qui refuse, et lui
 * seul fait foi. Cette fonction ne sert qu'à ne pas proposer un geste qu'on
 * sait déjà refusé. Si les deux divergent, c'est celle-ci qu'on corrige.
 */
export const ROLES_QUI_PUBLIENT: AccountRole[] = ['OWNER', 'ADMIN', 'MANAGER'];

export function peutPublier(role: AccountRole | undefined | null): boolean {
  return Boolean(role && ROLES_QUI_PUBLIENT.includes(role));
}
