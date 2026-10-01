export interface FormateurOrg {
  id: string;
  prenom: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  statut: 'INTERNE' | 'EXTERNE';
  structure: string | null;
  siret: string | null;
  metier: string | null;
  competences: string[];
  diplomes: string | null;
  actif: boolean;
  _count?: { sessions: number; creneaux: number };
}

export interface SalleOrg {
  id: string;
  nom: string;
  adresse: string | null;
  capacite: number | null;
  accessiblePmr: boolean;
  equipements: string | null;
  actif: boolean;
}

export interface LigneSessionAdmin {
  id: string;
  titre: string;
  formation: { id: string; title: string };
  startDate: string;
  endDate: string | null;
  status: string;
  location: string | null;
  modalite: string;
  maxSeats: number | null;
  formateur: { id: string; prenom: string; nom: string } | null;
  salle: { id: string; nom: string } | null;
  creneaux: number;
  stagiaires: number;
  convoques: number;
  evaluesChaud: number;
  evaluesFroid: number;
  conventionsSignees: number;
  conventions: number;
  facturee: boolean;
}

export interface Creneau {
  id: string;
  debut: string;
  fin: string;
  intitule: string | null;
  distanciel: boolean;
  formateurId: string | null;
  salleId: string | null;
  formateur: { id: string; prenom: string; nom: string } | null;
  salle: { id: string; nom: string } | null;
}

export interface EmargementLigne {
  id: string;
  slotDate: string;
  slot: 'MORNING' | 'AFTERNOON';
  present: boolean;
  signatureTrace: string | boolean | null;
  signeParStagiaireLe: string | null;
}

export interface InscriptionAdmin {
  id: string;
  learnerName: string | null;
  learnerEmail: string | null;
  telephone: string | null;
  status: string;
  typeStagiaire: string;
  financing: string;
  origineFinancement: string | null;
  entrepriseNom: string | null;
  entrepriseSiret: string | null;
  entrepriseAdresse: string | null;
  entrepriseContact: string | null;
  entrepriseEmail: string | null;
  financeurNom: string | null;
  numeroDossier: string | null;
  prixHt: string | number | null;
  jetonStagiaire: string | null;
  convocationEnvoyeeLe: string | null;
  satisfactionAt: string | null;
  coldAt: string | null;
  positionnementEntree: Record<string, number> | null;
  positionnementSortie: Record<string, number> | null;
  evalResult: string | null;
  heuresRealisees: number;
  heuresEstimees: boolean;
  emargements: EmargementLigne[];
}

export interface Seance {
  id: string;
  slotDate: string;
  slot: 'MORNING' | 'AFTERNOON';
  code: string;
  ouverteLe: string;
  fermeeLe: string | null;
  formateurNom: string | null;
  formateurSigneLe: string | null;
}

export interface Conflit {
  creneauId?: string;
  avec: string;
  sessionId: string;
  quoi: 'formateur' | 'salle';
  nom: string;
  debut: string;
  fin: string;
}

export interface SessionDetail {
  id: string;
  title: string | null;
  startDate: string;
  endDate: string | null;
  location: string | null;
  maxSeats: number | null;
  priceHt: string | number | null;
  status: string;
  modalite: 'PRESENTIEL' | 'DISTANCIEL' | 'MIXTE';
  tauxDistanciel: number | null;
  intra: boolean;
  sousTraitance: 'AUCUNE' | 'RECUE' | 'CONFIEE';
  organismePartenaire: string | null;
  dureeHeures: string | number | null;
  infosPratiques: string | null;
  enquetesAuto: boolean;
  convocationsAuto: boolean;
  delaiFroidJours: number;
  formateurOrganismeId: string | null;
  salleId: string | null;
  formation: {
    id: string;
    title: string;
    objectives: string | null;
    natureAction: string;
    objectifBpf: string;
    codeNsf: string | null;
    codeCertification: string | null;
    durationHours: number | null;
  };
  objectifs: string[];
  dureePrevue: number | null;
  planning: { cle: string; slotDate: string; slot: 'MORNING' | 'AFTERNOON'; heures: number }[];
  conflits: Conflit[];
  creneaux: Creneau[];
  inscriptions: InscriptionAdmin[];
  seances: Seance[];
}

export interface DocumentRegistre {
  id: string;
  type: string;
  titre: string;
  inscriptionId: string | null;
  envoyeLe: string | null;
  envoyeA: string | null;
  statut: 'PRODUIT' | 'ENVOYE' | 'A_SIGNER' | 'SIGNE' | 'REFUSE';
  signeLe: string | null;
  signataireNom: string | null;
  createdAt: string;
}

export interface Registre {
  documents: DocumentRegistre[];
  clients: { nom: string; email: string | null; stagiaires: number }[];
  stagiaires: { id: string; nom: string | null; email: string | null; particulier: boolean; convocationEnvoyeeLe: string | null; heuresRealisees: number }[];
}

export interface ResultatEnvoi {
  envoyes: number;
  sansAdresse: string[];
  echecs: string[];
}

export interface FactureOrg {
  id: string;
  type: 'FACTURE' | 'AVOIR' | 'DEVIS';
  statut: 'BROUILLON' | 'EMISE' | 'PAYEE' | 'ANNULEE' | 'ACCEPTE' | 'REFUSE';
  numero: string | null;
  client: { nom: string; email?: string | null; siret?: string | null; adresse?: string | null; codePostal?: string | null; ville?: string | null; contact?: string | null; genre: string };
  lignes: { libelle: string; quantite: number; prixUnitaireHt: number; tauxTva: number }[];
  totalHt: number;
  totalTva: number;
  totalTtc: number;
  montantPaye: number;
  dateEmission: string | null;
  echeance: string | null;
  sessionId: string | null;
  numeroDossier: string | null;
  referenceClient: string | null;
  origineBpf: string | null;
  relances: number;
  relancesActives: boolean;
  enRetard?: boolean;
  factureOrigineId: string | null;
  devisId: string | null;
  mentionTva: string | null;
  notes: string | null;
  session?: { id: string; title: string | null; startDate: string; formation: { title: string } } | null;
}

export interface ListeFactures {
  factures: FactureOrg[];
  resume: {
    annee: number;
    chiffreAffairesHt: number;
    aEncaisser: number;
    enRetard: number;
    montantEnRetard: number;
    devisOuverts: number;
    montantDevis: number;
    brouillons: number;
  };
}

export interface RapportSession {
  effectifs: { inscrits: number; actifs: number; abandons: number };
  assiduite: { moyenne: number | null };
  chaud: { reponses: number; taux: number | null; note: number | null; objectifs: number | null; pedagogie: number | null; organisation: number | null; recommandation: number | null };
  froid: { reponses: number; taux: number | null; note: number | null; miseEnOeuvre: { oui: number; partiellement: number; non: number } };
  commanditaires: { reponses: number; note: number | null };
  positionnement: { mesures: number; progression: number | null };
  commentaires: { type: string; nom: string | null; texte: string }[];
}

/* ------------------------------------------------------------ financements et prospects (01/10/2026) */

export type StatutDossier = 'A_DEPOSER' | 'DEPOSE' | 'ACCORDE' | 'REFUSE' | 'EN_FORMATION' | 'A_FACTURER' | 'FACTURE' | 'PAYE' | 'ANNULE';
export type TypeFinanceur = 'OPCO' | 'FRANCE_TRAVAIL' | 'CPF' | 'ENTREPRISE' | 'REGION' | 'AUTRE';
export type EtapeProspect = 'NOUVEAU' | 'CONTACTE' | 'DEVIS_ENVOYE' | 'GAGNE' | 'PERDU';

export interface PieceDossier {
  id: string;
  ordre: number;
  libelle: string;
  cochee: boolean;
  cocheeLe: string | null;
}

/** Une prise en charge par un financeur. Les montants sont en centimes. */
export interface DossierFinancement {
  id: string;
  sessionId: string | null;
  session: { id: string; title: string | null; startDate: string; endDate: string | null; formation: { title: string } } | null;
  entrepriseNom: string;
  entrepriseSiret: string | null;
  contactNom: string | null;
  contactEmail: string | null;
  financeur: TypeFinanceur;
  nomFinanceur: string | null;
  numeroDossier: string | null;
  nbStagiaires: number;
  heures: number;
  tarifHoraireCents: number;
  montantDemandeCents: number;
  montantAccordeCents: number | null;
  salairesRembourses: boolean | null;
  subrogation: boolean;
  dateDebutFormation: string | null;
  dateLimiteDepot: string | null;
  dateDepot: string | null;
  dateAccord: string | null;
  dateFinFormation: string | null;
  dateFacturation: string | null;
  datePaiement: string | null;
  statut: StatutDossier;
  factureId: string | null;
  facture: { id: string; numero: string | null; statut: string; totalTtc: number } | null;
  notes: string | null;
  pieces: PieceDossier[];
  piecesFaites: number;
  joursAvantDepot: number | null;
  depotProche: boolean;
  depotEnRetard: boolean;
  paiementEnRetard: boolean;
  enRetard: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeFinancements {
  total: number;
  enCours: number;
  demandeCents: number;
  accordeCents: number;
  payeCents: number;
  aDeposerBientot: number;
  depotsEnRetard: number;
  paiementsEnRetard: number;
  enRetard: number;
}

export interface ListeFinancements {
  dossiers: DossierFinancement[];
  resume: ResumeFinancements;
}

export interface ProspectOrg {
  id: string;
  nom: string;
  contactNom: string | null;
  contactEmail: string | null;
  telephone: string | null;
  source: string | null;
  besoin: string | null;
  montantEstimeCents: number | null;
  etape: EtapeProspect;
  prochaineAction: string | null;
  dateProchaineAction: string | null;
  notes: string | null;
  priseEnChargeId: string | null;
  priseEnCharge: { id: string; statut: StatutDossier } | null;
  factureId: string | null;
  facture: { id: string; numero: string | null; type: string; statut: string } | null;
  actionEnRetard: boolean;
  updatedAt: string;
}

export interface ResumeProspects {
  total: number;
  parEtape: Record<EtapeProspect, number>;
  enCoursCents: number;
  gagneCents: number;
  actionsEnRetard: number;
}

export interface ListeProspects {
  prospects: ProspectOrg[];
  resume: ResumeProspects;
}
