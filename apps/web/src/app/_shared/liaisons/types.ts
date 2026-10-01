/** Espaces interconnectés : ce que renvoie l'API (`/liaisons`, `/academie/association`). Sans 'server-only'. */

export type StatutLiaison = 'EN_ATTENTE' | 'ACTIVE' | 'REFUSEE';
export type TypeEspace = 'ASSOCIATION' | 'ACADEMIE';

export interface LienEspace {
  id: string;
  statut: StatutLiaison;
  /** Ce que le compte courant a à faire de ce lien. */
  sens: 'ACTIF' | 'A_REPONDRE' | 'ENVOYEE' | 'REFUSEE';
  autre: { type: TypeEspace; nom: string; accountId: string };
  createdAt: string;
  accepteeLe: string | null;
}

export interface ListeLiaisons {
  espace: { type: TypeEspace; nom: string };
  /** Propriétaire ou administrateur de l'espace courant. */
  peutGerer: boolean;
  liens: LienEspace[];
  /** Mes autres espaces, de l'autre type, pas encore reliés. */
  reliables: { accountId: string; nom: string; type: TypeEspace; jeSuisAdmin: boolean }[];
}

export interface AgrementRelie {
  etat: 'A_FOURNIR' | 'DEDUITE' | 'PRESENTE';
  preuve: string | null;
  dateEmission: string | null;
  dateExpiration: string | null;
  note: string | null;
  aUnFichier: boolean;
  updatedAt: string;
}

export interface AssociationReliee {
  id: string;
  nom: string;
  sigle: string | null;
  siren: string | null;
  siret: string | null;
  rna: string | null;
  commune: string | null;
  codePostal: string | null;
  agrement: AgrementRelie | null;
}
