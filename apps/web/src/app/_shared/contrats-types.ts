// Miroir des contrats renvoyés par /contrats — partagé entre la liste et le
// détail pour qu'il n'existe qu'une seule définition de la forme des données.

export type StatutContratCDD = 'BROUILLON' | 'TRANSMIS' | 'SIGNE' | 'EN_COURS' | 'TERMINE' | 'ROMPU';

export type CauseFinContrat =
  | 'TERME_NORMAL'
  | 'REFUS_CDI'
  | 'RUPTURE_SALARIE'
  | 'FAUTE_GRAVE'
  | 'FORCE_MAJEURE';

export interface MotifRecoursOption {
  code: string;
  libelle: string;
  aide: string;
  exigeSalarieRemplace: boolean;
  ouvreIndemnitePrecarite: boolean;
  article: string;
}

export interface SalariePossible {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  origine: string;
}

export interface MentionManquante {
  champ: string;
  message: string;
  article: string;
}

export interface Contrat {
  id: string;
  statut: StatutContratCDD;
  motif: string;
  salarieRemplaceNom: string | null;
  salarieRemplaceQualification: string | null;
  dateDebut: string;
  dateFin: string | null;
  dureeMinimaleJours: number | null;
  poste: string | null;
  qualification: string | null;
  posteARisques: boolean | null;
  conventionCollective: string | null;
  remunerationBrute: string | number | null;
  remunerationDetail: string | null;
  caisseRetraiteComplementaire: string | null;
  organismePrevoyance: string | null;
  periodeEssaiJours: number | null;
  dpaeEffectueeLe: string | null;
  dpaeReference: string | null;
  transmisLe: string | null;
  causeFin: string | null;
  termineLe: string | null;
  user?: { id: string; firstName: string | null; lastName: string | null; email?: string } | null;
  mission?: { id: string; title: string } | null;
  /** Ajouté par la liste : le contrat est-il prêt à être transmis ? */
  emissible?: boolean;
}

export interface SyntheseContrat {
  emissible: boolean;
  mentionsManquantes: MentionManquante[];
  dureeJours: number;
  termePrecis: boolean;
  periodeEssaiMaxJours: number;
  indemniteFinDeContrat: {
    due: boolean;
    taux: number;
    montant: number;
    motif: string;
    article: string;
  };
  carenceApres: { jours: number; fraction: number; message: string; article: string };
  limiteTransmission: string;
  dpaeAuPlusTot: string;
  motifLibelle: string | null;
  motifArticle: string | null;
  avertissement: string;
}

export const STATUT_LABEL: Record<StatutContratCDD, string> = {
  BROUILLON: 'Brouillon',
  TRANSMIS: 'Transmis au salarié',
  SIGNE: 'Signé',
  EN_COURS: 'En cours',
  TERMINE: 'Terminé',
  ROMPU: 'Rompu',
};

export const CAUSE_FIN_LABEL: Record<CauseFinContrat, string> = {
  TERME_NORMAL: 'Le contrat est arrivé à son terme',
  REFUS_CDI: 'Le salarié a refusé un CDI sur le même poste',
  RUPTURE_SALARIE: 'Rupture anticipée à l’initiative du salarié',
  FAUTE_GRAVE: 'Rupture anticipée pour faute grave',
  FORCE_MAJEURE: 'Rupture pour cas de force majeure',
};
