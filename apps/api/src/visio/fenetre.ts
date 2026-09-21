/**
 * LA FENÊTRE D'OUVERTURE D'UN RENDEZ-VOUS.
 *
 * ⚠⚠ UN LIEN QUI MARCHE POUR TOUJOURS FINIT PAR CIRCULER. C'est la raison
 * d'être de ce fichier, et c'est la différence entre un rendez-vous et une
 * salle permanente : le lien d'une visioconsultation n'ouvre la porte que
 * dans un intervalle borné autour de l'heure prévue. En dehors, il ne dit pas
 * « refusé », il dit QUAND il s'ouvre — un refus sec sur un lien reçu par
 * courriel se lit comme une panne, et on appelle le secrétariat.
 *
 * Les deux bornes ne sont pas symétriques, et c'est voulu :
 *
 *  - AVANT (15 min) : le temps d'installer une famille, de trouver le bon
 *    navigateur, d'autoriser le micro. Une ouverture à l'heure pile fait
 *    commencer toutes les séances avec cinq minutes de retard.
 *  - APRÈS (30 min au-delà de la fin prévue) : une séance déborde, un parent
 *    arrive en retard, une connexion se coupe et il faut revenir. Fermer à la
 *    minute prévue couperait la parole au milieu d'une phrase.
 *
 * ⚠ CES DEUX NOMBRES SONT DES DÉCISIONS DE PRODUIT, PAS DES CONSTANTES
 * TECHNIQUES. Les allonger « pour être tranquille » rapproche le lien de
 * rendez-vous d'un lien permanent, ce qu'on refuse précisément.
 */

export const MINUTES_AVANT = 15;
export const MINUTES_APRES = 30;

export interface Fenetre {
  ouvertureLe: Date;
  fermetureLe: Date;
}

export function fenetre(debutPrevu: Date, dureeMinutes: number): Fenetre {
  const debut = debutPrevu.getTime();
  return {
    ouvertureLe: new Date(debut - MINUTES_AVANT * 60_000),
    fermetureLe: new Date(debut + (dureeMinutes + MINUTES_APRES) * 60_000),
  };
}

export type EtatFenetre = 'TROP_TOT' | 'OUVERTE' | 'TERMINEE';

export function etatFenetre(debutPrevu: Date, dureeMinutes: number, maintenant = new Date()): EtatFenetre {
  const { ouvertureLe, fermetureLe } = fenetre(debutPrevu, dureeMinutes);
  if (maintenant < ouvertureLe) return 'TROP_TOT';
  if (maintenant > fermetureLe) return 'TERMINEE';
  return 'OUVERTE';
}

/**
 * Combien de temps le jeton d'accès au serveur média doit rester valable.
 *
 * ⚠ IL EXPIRE AVEC LA FENÊTRE, PAS AU BOUT D'UNE DURÉE FIXE. Un jeton de
 * vingt-quatre heures délivré à 9 h pour un rendez-vous de 9 h 30 resterait
 * utilisable toute la journée, et la borne de fermeture ne servirait plus à
 * rien : il suffirait d'avoir ouvert la page une fois, à la bonne heure, pour
 * garder la salle ouverte jusqu'au soir.
 *
 * Le plancher de cinq minutes évite l'autre extrémité : un jeton qui expire
 * pendant la poignée de main avec le serveur média, pour quelqu'un qui arrive
 * à la toute fin de la fenêtre.
 */
export function secondesDeValidite(
  debutPrevu: Date,
  dureeMinutes: number,
  maintenant = new Date(),
): number {
  const { fermetureLe } = fenetre(debutPrevu, dureeMinutes);
  const restant = Math.floor((fermetureLe.getTime() - maintenant.getTime()) / 1000);
  return Math.max(restant, 5 * 60);
}
