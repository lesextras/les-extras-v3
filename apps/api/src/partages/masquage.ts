import type { NiveauPartage } from '@prisma/client';
import type { EvenementAgenda, SourceEvenement } from '../agenda/agenda.service';

/**
 * CE QU'UN AGENDA PARTAGÉ LAISSE VOIR, NIVEAU PAR NIVEAU.
 *
 * Écrit une seule fois, et c'est la seule porte : le calendrier partagé ne
 * renvoie JAMAIS un événement qui ne soit pas passé par `masquer()`.
 *
 *  - DISPONIBILITES : « Occupé », l'heure de début et de fin. Rien d'autre,
 *    pas même la nature de l'événement (une visio dit déjà quelque chose).
 *  - TITRES : le titre, l'horaire et le lieu.
 *  - DETAILS : tout ce que l'agenda sait, description et participants compris.
 *  - MODIFICATION : comme DETAILS, et les rendez-vous notés à la main
 *    deviennent modifiables par la personne invitée.
 *
 * ⚠ `href` est TOUJOURS retiré : il mène à un écran du compte titulaire, que
 * la personne invitée n'a pas le droit d'ouvrir. Un lien qui répond 403 se
 * lit comme une panne.
 */

/** Ce qui compte comme « réservation » quand le partage les exclut. */
export const SOURCES_RESERVATION: SourceEvenement[] = ['RESERVATION', 'RESERVATION_EN_LIGNE', 'VISIO', 'MISSION', 'CRENEAU'];

export const RANG_NIVEAU: Record<NiveauPartage, number> = {
  DISPONIBILITES: 0,
  TITRES: 1,
  DETAILS: 2,
  MODIFICATION: 3,
};

export function masquer(e: EvenementAgenda, niveau: NiveauPartage, prefixe: string): EvenementAgenda {
  const base: EvenementAgenda = {
    ...e,
    id: `${prefixe}:${e.id}`,
    href: null,
    modifiable: false,
    rendezVousId: null,
  };
  if (niveau === 'DISPONIBILITES') {
    return {
      ...base,
      source: 'OCCUPE',
      titre: 'Occupé',
      detail: null,
      lieu: null,
      lien: null,
      categorie: null,
      participants: [],
      par: null,
    };
  }
  if (niveau === 'TITRES') {
    return { ...base, detail: null, lien: null, participants: [], par: null };
  }
  if (niveau === 'MODIFICATION' && e.source === 'RENDEZ_VOUS' && e.rendezVousId) {
    return { ...base, modifiable: true, rendezVousId: e.rendezVousId };
  }
  return base;
}

export function filtrerEtMasquer(
  evenements: EvenementAgenda[],
  niveau: NiveauPartage,
  inclutReservations: boolean,
  prefixe: string,
): EvenementAgenda[] {
  return evenements
    .filter((e) => inclutReservations || !SOURCES_RESERVATION.includes(e.source))
    .map((e) => masquer(e, niveau, prefixe));
}

export const LIBELLE_NIVEAU: Record<NiveauPartage, string> = {
  DISPONIBILITES: 'ses disponibilités (libre ou occupé)',
  TITRES: 'les titres, horaires et lieux',
  DETAILS: 'tous les détails',
  MODIFICATION: 'tous les détails, avec le droit d’ajouter et de modifier des rendez-vous',
};
