export type SituationPiece = 'DEDUITE' | 'A_JOUR' | 'BIENTOT_PERIMEE' | 'PERIMEE' | 'MANQUANTE';
export type EtatDossier = 'REPERE' | 'EN_ECRITURE' | 'DEPOSE' | 'ACCORDE' | 'REFUSE' | 'SOLDE';

export interface TypeDePiece {
  code: string;
  libelle: string;
  categorie: string;
  pourquoi: string;
  ouLaTrouver: string;
  dureeValiditeMois?: number;
  parExercice?: boolean;
  deductible?: 'RNA' | 'SIRENE';
}

export interface PieceDecoree {
  typeCode: string;
  etat: 'A_FOURNIR' | 'DEDUITE' | 'PRESENTE';
  situation: SituationPiece;
  preuve: string | null;
  fileId: string | null;
  dateEmission: string | null;
  dateExpiration: string | null;
  exercice: number | null;
  note: string | null;
  updatedAt: string;
}

export interface LigneClasseur {
  type: TypeDePiece;
  piece: PieceDecoree | null;
  situation: SituationPiece;
}

export interface Dossier {
  id: string;
  dispositifCode: string | null;
  financeur: string;
  intitule: string;
  etat: EtatDossier;
  montantDemande: number | null;
  montantAccorde: number | null;
  dateLimiteDepot: string | null;
  dateDepot: string | null;
  dateDecision: string | null;
  dateCompteRendu: string | null;
  piecesExigees: string[];
  notes: string | null;
}

export interface Dispositif {
  code: string;
  nom: string;
  financeur: string;
  description: string;
  piecesExigees: string[];
  modeDepot: string;
  lien?: string;
}

export interface Organisation {
  id: string;
  nom: string;
  sigle: string | null;
  rna: string | null;
  siren: string | null;
  siret: string | null;
  natureJuridique: string | null;
  adresse: string | null;
  codePostal: string | null;
  commune: string | null;
  dateCreation: string | null;
  niveau: 'PETITE' | 'GESTIONNAIRE' | 'RESEAU';
  moisClotureExercice: number;
  etapesFaites: string[];
}

export interface Espace {
  organisation: Organisation;
  classeur: LigneClasseur[];
  dossiers: Dossier[];
  chemin: { etapes: { numero: number; slug: string; titre: string; faite: boolean; verifiee: boolean }[]; faites: number; total: number; pourcentage: number };
  lundi: {
    perime: { typeCode: string; libelle: string; dateExpiration: string; jours: number; gravite: 'ROUGE' | 'AMBRE'; action: string }[];
    du: { dossierId: string; intitule: string; financeur: string; echeance: string; nature: 'DEPOT' | 'COMPTE_RENDU'; jours: number; gravite: 'ROUGE' | 'AMBRE' }[];
    enCours: { enEcriture: number; deposes: number; accordesAJustifier: number; refuses: number; reperes: number };
    manque: { typeCode: string; libelle: string; dossiers: number }[];
    cetteAnnee: { annee: number; obtenu: number; dossiersAccordes: number; dossiersDecides: number; tauxReussite: number | null; piecesPerimees: number; etapesFaites: number };
  };
  versionReferentiel: string;
  dispositifs: Dispositif[];
}

export const LIBELLES_ETAT: Record<EtatDossier, string> = {
  REPERE: 'Repéré',
  EN_ECRITURE: 'En écriture',
  DEPOSE: 'Déposé',
  ACCORDE: 'Accordé, à justifier',
  REFUSE: 'Refusé',
  SOLDE: 'Soldé',
};

export const LIBELLES_SITUATION: Record<SituationPiece, string> = {
  DEDUITE: 'Prouvée par les répertoires',
  A_JOUR: 'À jour',
  BIENTOT_PERIMEE: 'Expire bientôt',
  PERIMEE: 'Périmée',
  MANQUANTE: 'À fournir',
};

export const CATEGORIES: Record<string, string> = {
  IDENTITE: "Pièces d'identité",
  GOUVERNANCE: "Vie de l'association",
  FINANCIER: 'Pièces financières',
  ASSURANCE: 'Assurance',
  AGREMENT: 'Agréments',
  RH: 'Employeur',
};

export function dateCourte(iso: string | null | undefined) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function pourInput(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}
