/**
 * LE PÉRIMÈTRE PUBLIC DE L'OFFRE.
 *
 * Décision de Siham, 19/09/2026 : le renfort de POSTE — celui qui se conclut
 * en CDD salarié — sort de l'offre publique. Les Extras ne propose plus, en
 * ligne, que le renfort assuré par des intervenants INDÉPENDANTS : une
 * prestation à objet défini, facturée par la structure de l'intervenant, pour
 * un besoin nommé.
 *
 * Pourquoi : c'est le pilier que le Conseil d'État a fragilisé le 11/02/2025
 * (n° 491128) et que l'article 70 de la LFSS 2025 plafonne depuis le
 * 01/07/2025 en ESSMS publics. Le retirer de la vitrine retire le risque,
 * sans rien coûter — il n'a jamais produit un euro.
 *
 * ⚠ RIEN N'EST SUPPRIMÉ. Tout le code du renfort salarié reste en place :
 * modèles, routes, écrans, droits. Il redevient visible en repassant la
 * variable à « complete », sans redéploiement de code.
 *
 *   NEXT_PUBLIC_OFFRE_PUBLIQUE=independants   (défaut — renfort salarié masqué)
 *   NEXT_PUBLIC_OFFRE_PUBLIQUE=complete       (tout est visible, comme avant)
 *
 * Le défaut est « independants » exprès : la décision s'applique même si
 * personne ne pense à renseigner la variable dans Coolify.
 */

export type PerimetreOffre = 'independants' | 'complete';

/** Le périmètre courant, lu à chaque appel (la valeur est inlinée au build). */
export function perimetreOffre(): PerimetreOffre {
  const brut = (process.env.NEXT_PUBLIC_OFFRE_PUBLIQUE ?? '').trim().toLowerCase();
  return brut === 'complete' ? 'complete' : 'independants';
}

/**
 * Le renfort de poste en CDD salarié est-il proposé ?
 *
 * À utiliser partout où une case, un filtre, une carte ou une phrase invite
 * quelqu'un à remplacer un poste. Jamais pour masquer une donnée déjà saisie :
 * un compte qui a coché « remplacements » avant le 19/09/2026 garde son choix,
 * on cesse seulement d'en proposer de nouveaux.
 */
export function renfortSalarieVisible(): boolean {
  return perimetreOffre() === 'complete';
}

/**
 * LA VISIOCONSULTATION EST-ELLE ANNONCÉE ?
 *
 * ⚠⚠ CE SECOND INTERRUPTEUR EXISTE POUR UNE RAISON PRÉCISE : AU 21/09/2026,
 * LA VISIOCONSULTATION N'EST PAS ENCORE CONSTRUITE.
 *
 * Elle est décidée, spécifiée, et la page RenforTeam sait la présenter — mais
 * il n'y a pas encore de salle, pas encore de lien de rendez-vous, pas encore
 * de serveur média. Annoncer en vitrine un service qu'on ne peut pas rendre,
 * c'est exactement le défaut que l'audit reprochait aux autres : la promesse
 * qui dépasse l'exécution.
 *
 * Le recentrage sur les indépendants, lui, est vrai dès maintenant. Les deux
 * décisions sont donc séparées : on met le recentrage en ligne tout de suite,
 * et on allume la visio le jour où un rendez-vous peut réellement avoir lieu.
 *
 *   NEXT_PUBLIC_VISIOCONSULTATION=1   (la page l'annonce)
 *   absente ou autre                  (défaut — la page n'en parle pas)
 *
 * ⚠ NE PAS LA PASSER À 1 AVANT D'AVOIR FAIT UN VRAI RENDEZ-VOUS DE BOUT EN
 * BOUT, depuis un autre appareil que celui du développement.
 */
export function visioconsultationVisible(): boolean {
  return (process.env.NEXT_PUBLIC_VISIOCONSULTATION ?? '').trim() === '1';
}
