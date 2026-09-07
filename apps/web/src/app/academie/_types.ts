/** Les types de l'espace académie, tels que l'API les renvoie (apps/api/src/academie/). */

export type EtatQualiopi = 'PAS_ENGAGE' | 'EN_PREPARATION' | 'AUDIT_PLANIFIE' | 'CERTIFIE' | 'SUSPENDU';
export type TypeVeille = 'LEGALE' | 'METIER' | 'HANDICAP' | 'INNOVATION' | 'EMPLOI';
export type StatutReclamation = 'OUVERTE' | 'EN_COURS' | 'RESOLUE' | 'CLASSEE';
export type OrigineReclamation = 'APPRENANT' | 'ENTREPRISE' | 'FINANCEUR' | 'FORMATEUR' | 'AUTRE';

export const LIBELLES_QUALIOPI: Record<EtatQualiopi, string> = {
  PAS_ENGAGE: 'Pas encore engagée',
  EN_PREPARATION: 'En préparation',
  AUDIT_PLANIFIE: 'Audit planifié',
  CERTIFIE: 'Certifiée',
  SUSPENDU: 'Suspendue',
};

export const LIBELLES_VEILLE: Record<TypeVeille, string> = {
  LEGALE: 'Veille légale',
  METIER: 'Veille métier',
  HANDICAP: 'Veille handicap',
  INNOVATION: 'Innovation pédagogique',
  EMPLOI: 'Emploi et compétences',
};

export interface FicheAcademie {
  id: string;
  accountId: string;
  nom: string;
  sigle: string | null;
  nda: string | null;
  ndaDeposeLe: string | null;
  dreets: string | null;
  siren: string | null;
  siret: string | null;
  ape: string | null;
  adresse: string | null;
  codePostal: string | null;
  commune: string | null;
  telephone: string | null;
  courriel: string | null;
  siteWeb: string | null;
  qualiopi: EtatQualiopi;
  certificateur: string | null;
  auditPrevuLe: string | null;
  certifieDu: string | null;
  certifieAu: string | null;
  referentHandicap: string | null;
  referentPedagogique: string | null;
  resume: string | null;
  presentation: string | null;
  etapesFaites: string[];
}

export interface EtapeAcademie {
  slug: string;
  numero: number;
  titre: string;
  resume: string;
  pourPasser: string;
  faite: boolean;
  /** Cochée toute seule parce que la donnée est arrivée : on ne la décoche pas à la main. */
  automatique: boolean;
}

export interface CheminAcademie {
  version: string;
  etapes: EtapeAcademie[];
  faites: number;
  total: number;
  courante: string | null;
}

export interface SessionAVenir {
  id: string;
  titre: string;
  debut: string;
  fin: string | null;
  lieu: string | null;
  places: number | null;
  inscrits: number;
  statut: string;
}

export interface EspaceAcademie {
  academie: FicheAcademie;
  chemin: CheminAcademie;
  catalogue: {
    total: number;
    publiees: number;
    formations: { id: string; title: string; slug: string; status: string; durationHours: number | null; updatedAt: string }[];
  };
  sessions: SessionAVenir[];
  apprenants: { total: number; confirmes: number; presents: number; certifies: number };
  qualiopi: {
    etat: EtatQualiopi;
    indicateurs: number;
    validees: number;
    deposees: number;
    couverture: number;
    auditPrevuLe: string | null;
    certifieAu: string | null;
  };
  veille: { dernieres: { id: string; type: TypeVeille; date: string; titre: string }[]; total: number };
  reclamations: { ouvertes: number };
}
