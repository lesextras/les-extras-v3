import type { Metadata } from 'next';

/**
 * LE TITRE D'UNE PAGE DE PILOTE, DANS LA LIMITE DE 65 CARACTÈRES.
 *
 * Le gabarit des espaces ajoute « · Piloter mon association » (25 caractères) :
 * « Étape 4 : Le compte en banque et l'assurance » passait à 70 et Google le
 * coupait. On garde le nom de l'espace quand il tient, on le retire sinon.
 */
const LIMITE = 65;

export function titrePilote(titre: string, espace: string): Metadata['title'] {
  const complet = `${titre} · ${espace}`;
  if (complet.length <= LIMITE) return { absolute: complet };
  const court = `${titre} · Piloter`;
  return { absolute: court.length <= LIMITE ? court : titre };
}
