import type { EtapeProspect, StatutDossier, TypeFinanceur } from './types';

/**
 * LES LIBELLÉS DES FINANCEMENTS ET DES PROSPECTS, partagés par les écrans.
 * Les montants voyagent en centimes ; on ne convertit qu'à l'affichage.
 */

type Ton = 'ok' | 'attention' | 'alerte' | 'neutre' | 'accent';

export const STATUT_DOSSIER: Record<StatutDossier, { libelle: string; ton: Ton }> = {
  A_DEPOSER: { libelle: 'À déposer', ton: 'attention' },
  DEPOSE: { libelle: 'Déposé', ton: 'neutre' },
  ACCORDE: { libelle: 'Accordé', ton: 'ok' },
  REFUSE: { libelle: 'Refusé', ton: 'alerte' },
  EN_FORMATION: { libelle: 'En formation', ton: 'accent' },
  A_FACTURER: { libelle: 'À facturer', ton: 'attention' },
  FACTURE: { libelle: 'Facturé', ton: 'neutre' },
  PAYE: { libelle: 'Payé', ton: 'ok' },
  ANNULE: { libelle: 'Annulé', ton: 'neutre' },
};

/** Le chemin normal d'un dossier ; « Refusé » et « Annulé » en sortent. */
export const ETAPES_DOSSIER: StatutDossier[] = ['A_DEPOSER', 'DEPOSE', 'ACCORDE', 'EN_FORMATION', 'A_FACTURER', 'FACTURE', 'PAYE'];

export const FINANCEUR: Record<TypeFinanceur, string> = {
  OPCO: 'OPCO',
  FRANCE_TRAVAIL: 'France Travail',
  CPF: 'Mon Compte Formation',
  ENTREPRISE: 'Entreprise',
  REGION: 'Région',
  AUTRE: 'Autre',
};

export const ETAPE_PROSPECT: Record<EtapeProspect, { libelle: string; ton: Ton }> = {
  NOUVEAU: { libelle: 'Nouveau', ton: 'neutre' },
  CONTACTE: { libelle: 'Contacté', ton: 'accent' },
  DEVIS_ENVOYE: { libelle: 'Devis envoyé', ton: 'attention' },
  GAGNE: { libelle: 'Gagné', ton: 'ok' },
  PERDU: { libelle: 'Perdu', ton: 'alerte' },
};

export const ETAPES_PROSPECT: EtapeProspect[] = ['NOUVEAU', 'CONTACTE', 'DEVIS_ENVOYE', 'GAGNE', 'PERDU'];

/** 189000 → « 1 890,00 € ». */
export const eurosCents = (c: number | null | undefined) =>
  c === null || c === undefined ? '' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c / 100);

/** « 45,50 » → 4550 ; vide ou illisible → null. */
export const centsDepuis = (t: string): number | null => {
  const v = Number(t.replace(/\s/g, '').replace(',', '.'));
  return t.trim() && Number.isFinite(v) && v >= 0 ? Math.round(v * 100) : null;
};

/** 4550 → « 45,5 » (pour un champ de saisie). */
export const saisieCents = (c: number | null | undefined) => (c === null || c === undefined ? '' : String(c / 100).replace('.', ','));

/** « 2026-11-16T00:00:00.000Z » → « 2026-11-16 » (champ date). */
export const champDate = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');

/** « 16/11 » : le jour et le mois, sans l'année. */
export const jourMois = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : '';

/** « 16 nov. 2026 », lu en UTC : les dates saisies sont des jours, pas des instants. */
export const jourCourt = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';
