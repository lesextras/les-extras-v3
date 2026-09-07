/**
 * LE NOM COURT DE L'ASSOCIATION.
 *
 * Les noms officiels sont longs : « Association pour le développement de
 * l'éducation par l'animation (ADéPA) ». Écrit en entier dans la barre
 * latérale, dans la barre du haut et dans les titres, il mange tout l'écran.
 * On garde le nom complet dans la fiche (et en infobulle) ; ailleurs on
 * affiche le sigle s'il y en a un, sinon les deux premiers mots.
 */

/** Un sigle entre parenthèses : « … (ADéPA) ». */
const SIGLE = /\(([\p{L}\p{N}&'’.\- ]{2,14})\)/u;

export function nomCourt(nom: string | null | undefined, limite = 28): string {
  const complet = (nom ?? '').trim().replace(/\s+/g, ' ');
  if (!complet || complet.length <= limite) return complet;

  const sigle = complet.match(SIGLE)?.[1]?.trim();
  if (sigle && sigle.length <= limite) return sigle;

  const mots = complet.split(' ');
  if (mots.length <= 2) return complet;
  return `${mots.slice(0, 2).join(' ')}…`;
}
