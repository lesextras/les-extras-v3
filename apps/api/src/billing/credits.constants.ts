/**
 * CONSTANTES DE LA DOTATION LEX.
 *
 * Elles vivaient dans `billing.service.ts`, à côté de Stripe. Or la création
 * d'un compte doit désormais accorder la dotation gratuite au moment même où
 * le compte naît — et `auth.service.ts` n'a rien à faire d'un client Stripe.
 * On isole donc les deux valeurs ici : un fichier sans dépendance, importable
 * de partout sans traîner tout le module de facturation derrière lui.
 *
 * `billing.service.ts` les réexporte, pour ne rien casser de ce qui existait.
 */

/**
 * Offre GRATUITE PERMANENTE — elle a remplacé l'essai de 7 jours.
 * Le cycle de production d'écrits en médico-social est mensuel à
 * trimestriel : sept jours ne suffisaient pas à rencontrer un seul cas
 * d'usage à forte valeur. Tout compte reçoit cette dotation chaque mois,
 * sans carte bancaire et sans date de fin.
 */
export const FREE_MONTHLY_CREDITS = 15;

/** Nombre de mois de report du quota mensuel (plafond d'accumulation). */
export const ROLLOVER_MONTHS = 3;

/**
 * Motif d'écriture de la dotation au grand livre.
 *
 * C'est aussi la clé d'idempotence : une dotation n'est accordée qu'une fois
 * par mois parce qu'on cherche une écriture portant ce motif depuis le 1er.
 * La dotation d'amorçage posée à la création du compte utilise donc le MÊME
 * motif, sinon le compte serait doté deux fois le mois de son inscription.
 */
export const MOTIF_DOTATION = 'DOTATION_MENSUELLE';
