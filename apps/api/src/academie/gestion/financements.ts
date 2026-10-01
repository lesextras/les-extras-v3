import { EtapeProspect, StatutPriseEnCharge } from '@prisma/client';

/**
 * LES RÈGLES DES PRISES EN CHARGE ET DES PROSPECTS, sans base de données.
 *
 * Tout ce qui se calcule (montant demandé, date limite de dépôt, retards,
 * résumés) vit ici, en fonctions pures : les services s'en servent, le test
 * les vérifie, et une règle n'est écrite qu'une fois.
 */

const JOUR = 86_400_000;

/** Délai de dépôt par défaut avant le début de la formation (OPCO). */
export const DELAI_DEPOT_JOURS = 15;
/** Au-delà, une facture envoyée au financeur et toujours impayée est en retard. */
export const DELAI_PAIEMENT_JOURS = 45;
/** Une date limite de dépôt à moins de sept jours s'affiche en alerte. */
export const ALERTE_DEPOT_JOURS = 7;

/** La checklist pré-remplie à la création d'un dossier, dans l'ordre où on s'en sert. */
export const PIECES_PAR_DEFAUT = [
  'Devis signé',
  'Programme',
  'Convention signée',
  'Demande déposée sur le portail du financeur',
  'Accord de prise en charge reçu',
  "Feuilles d'émargement",
  'Certificat de réalisation',
  'Facture envoyée au financeur',
] as const;

/** Le chemin normal d'un dossier. REFUSE et ANNULE en sortent. */
export const ETAPES_DOSSIER: StatutPriseEnCharge[] = [
  StatutPriseEnCharge.A_DEPOSER,
  StatutPriseEnCharge.DEPOSE,
  StatutPriseEnCharge.ACCORDE,
  StatutPriseEnCharge.EN_FORMATION,
  StatutPriseEnCharge.A_FACTURER,
  StatutPriseEnCharge.FACTURE,
  StatutPriseEnCharge.PAYE,
];

/** La date qu'un changement de statut renseigne (si elle est encore vide). */
export const DATE_DU_STATUT: Partial<Record<StatutPriseEnCharge, 'dateDepot' | 'dateAccord' | 'dateFinFormation' | 'dateFacturation' | 'datePaiement'>> = {
  DEPOSE: 'dateDepot',
  ACCORDE: 'dateAccord',
  A_FACTURER: 'dateFinFormation',
  FACTURE: 'dateFacturation',
  PAYE: 'datePaiement',
};

/** La pièce de la checklist qu'un changement de statut coche d'office. */
export const PIECE_DU_STATUT: Partial<Record<StatutPriseEnCharge, string>> = {
  DEPOSE: 'Demande déposée sur le portail du financeur',
  ACCORDE: 'Accord de prise en charge reçu',
  FACTURE: 'Facture envoyée au financeur',
};

/** Stagiaires × heures × tarif horaire, en centimes arrondis. */
export function montantDemande(nbStagiaires: number, heures: number, tarifHoraireCents: number): number {
  if (!(nbStagiaires > 0) || !(heures > 0) || !(tarifHoraireCents > 0)) return 0;
  return Math.round(nbStagiaires * heures * tarifHoraireCents);
}

/** Début de la formation moins quinze jours. */
export function dateLimiteParDefaut(debut: Date | null | undefined): Date | null {
  if (!debut || Number.isNaN(debut.getTime())) return null;
  return new Date(debut.getTime() - DELAI_DEPOT_JOURS * JOUR);
}

/** Le numéro du jour (UTC) : on compare des jours, pas des heures. */
const numeroJour = (d: Date) => Math.floor(d.getTime() / JOUR);

export interface DossierPourEtat {
  statut: StatutPriseEnCharge;
  dateLimiteDepot: Date | null;
  dateFacturation: Date | null;
}

export interface EtatDossier {
  /** Jours avant la date limite de dépôt (négatif = dépassée), tant que le dossier n'est pas déposé. */
  joursAvantDepot: number | null;
  depotProche: boolean;
  depotEnRetard: boolean;
  paiementEnRetard: boolean;
  enRetard: boolean;
}

export function etatDossier(d: DossierPourEtat, maintenant = new Date()): EtatDossier {
  const aDeposer = d.statut === StatutPriseEnCharge.A_DEPOSER;
  const joursAvantDepot = aDeposer && d.dateLimiteDepot ? numeroJour(d.dateLimiteDepot) - numeroJour(maintenant) : null;
  const depotEnRetard = joursAvantDepot !== null && joursAvantDepot < 0;
  const depotProche = joursAvantDepot !== null && joursAvantDepot >= 0 && joursAvantDepot < ALERTE_DEPOT_JOURS;
  const paiementEnRetard =
    d.statut === StatutPriseEnCharge.FACTURE &&
    !!d.dateFacturation &&
    maintenant.getTime() - d.dateFacturation.getTime() > DELAI_PAIEMENT_JOURS * JOUR;
  return { joursAvantDepot, depotProche, depotEnRetard, paiementEnRetard, enRetard: depotEnRetard || paiementEnRetard };
}

export interface DossierPourResume extends DossierPourEtat {
  montantDemandeCents: number;
  montantAccordeCents: number | null;
}

const HORS_JEU: StatutPriseEnCharge[] = [StatutPriseEnCharge.REFUSE, StatutPriseEnCharge.ANNULE];
const ACCORDES: StatutPriseEnCharge[] = [
  StatutPriseEnCharge.ACCORDE,
  StatutPriseEnCharge.EN_FORMATION,
  StatutPriseEnCharge.A_FACTURER,
  StatutPriseEnCharge.FACTURE,
  StatutPriseEnCharge.PAYE,
];

export function resumeDossiers(dossiers: DossierPourResume[], maintenant = new Date()) {
  const actifs = dossiers.filter((d) => !HORS_JEU.includes(d.statut));
  const etats = dossiers.map((d) => etatDossier(d, maintenant));
  const accordes = actifs.filter((d) => ACCORDES.includes(d.statut));
  return {
    total: dossiers.length,
    enCours: actifs.filter((d) => d.statut !== StatutPriseEnCharge.PAYE).length,
    demandeCents: actifs.reduce((t, d) => t + d.montantDemandeCents, 0),
    accordeCents: accordes.reduce((t, d) => t + (d.montantAccordeCents ?? d.montantDemandeCents), 0),
    payeCents: actifs
      .filter((d) => d.statut === StatutPriseEnCharge.PAYE)
      .reduce((t, d) => t + (d.montantAccordeCents ?? d.montantDemandeCents), 0),
    aDeposerBientot: etats.filter((e) => e.depotProche).length,
    depotsEnRetard: etats.filter((e) => e.depotEnRetard).length,
    paiementsEnRetard: etats.filter((e) => e.paiementEnRetard).length,
    enRetard: etats.filter((e) => e.enRetard).length,
  };
}

/* ------------------------------------------------------------ prospects */

export const ETAPES_PROSPECT: EtapeProspect[] = [
  EtapeProspect.NOUVEAU,
  EtapeProspect.CONTACTE,
  EtapeProspect.DEVIS_ENVOYE,
  EtapeProspect.GAGNE,
  EtapeProspect.PERDU,
];

const PROSPECT_OUVERT: EtapeProspect[] = [EtapeProspect.NOUVEAU, EtapeProspect.CONTACTE, EtapeProspect.DEVIS_ENVOYE];

/** Une prochaine action datée d'avant aujourd'hui, sur un prospect encore ouvert. */
export function actionEnRetard(p: { etape: EtapeProspect; dateProchaineAction: Date | null }, maintenant = new Date()): boolean {
  if (!PROSPECT_OUVERT.includes(p.etape) || !p.dateProchaineAction) return false;
  return numeroJour(p.dateProchaineAction) < numeroJour(maintenant);
}

export function resumeProspects(
  prospects: { etape: EtapeProspect; montantEstimeCents: number | null; dateProchaineAction: Date | null }[],
  maintenant = new Date(),
) {
  const parEtape = Object.fromEntries(ETAPES_PROSPECT.map((e) => [e, 0])) as Record<EtapeProspect, number>;
  for (const p of prospects) parEtape[p.etape] += 1;
  return {
    total: prospects.length,
    parEtape,
    enCoursCents: prospects.filter((p) => PROSPECT_OUVERT.includes(p.etape)).reduce((t, p) => t + (p.montantEstimeCents ?? 0), 0),
    gagneCents: prospects.filter((p) => p.etape === EtapeProspect.GAGNE).reduce((t, p) => t + (p.montantEstimeCents ?? 0), 0),
    actionsEnRetard: prospects.filter((p) => actionEnRetard(p, maintenant)).length,
  };
}
