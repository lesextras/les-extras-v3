/** Les réglages de la suite de l'école (domaine, référencement, légal, calendrier, communauté). */
export interface ReglagesSuite {
  domaine: string | null;
  domaineVerifieLe: string | null;
  seoTitre: string | null;
  seoDescription: string | null;
  indexable: boolean;
  cgu: string | null;
  confidentialite: string | null;
  calendrierVisible: boolean;
  communauteActive: boolean;
  communauteDescription: string | null;
  parDefaut: { cgu: string; confidentialite: string };
  ipServeur: string;
  hotePilote: string;
}

export interface Evenement {
  id: string;
  titre: string;
  description: string | null;
  debut: string;
  fin: string | null;
  lieu: string | null;
  lien: string | null;
  coursIds: string[];
}

export interface Demarrage {
  faites: number;
  total: number;
  etapes: { cle: string; titre: string; fait: boolean; lien: string; aide: string }[];
}
