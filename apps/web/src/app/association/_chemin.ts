import { fetchPublic } from '../_shared/server';
import type { ModeleFabrique } from './_fabrique';

/** Les types du chemin, tels que l'API les renvoie (voir apps/api/src/association/chemin.ts). */

export type PartieChemin = 'NAITRE' | 'VIVRE' | 'SUBVENTION';

export interface DescriptionPartie {
  code: PartieChemin;
  numero: 1 | 2 | 3;
  titre: string;
  enUnMot: string;
  resultat: string;
}

export type GenreDocument = 'CERFA' | 'MODELE' | 'EXEMPLE' | 'SITE';

export interface DocumentEtape {
  titre: string;
  lien: string;
  genre: GenreDocument;
  numero?: string;
  aQuoiCaSert: string;
}

export interface EtapeChemin {
  numero: number;
  slug: string;
  titre: string;
  partie: PartieChemin;
  enUnMot: string;
  pourquoi: string;
  ilTeFaut: string[];
  commentFaire: { titre: string; detail: string }[];
  quoiFaire: string[];
  dureeEstimee: string;
  cout: string;
  documents: DocumentEtape[];
  renvois: { nom: string; lien: string; pourQuoi: string }[];
  quandCestFini: string;
  debloque: string;
  lexique: { mot: string; explication: string }[];
  piecesAjoutees: string[];
  verifiableAvec?: 'RNA' | 'SIRENE';
}

export interface CheminComplet {
  parties: DescriptionPartie[];
  etapes: EtapeChemin[];
  total: number;
}

export interface EtapeDetaillee {
  etape: EtapeChemin;
  partie: DescriptionPartie;
  pieces: { code: string; libelle: string; pourquoi: string; ouLaTrouver: string }[];
  total: number;
  precedente: { numero: number; slug: string; titre: string } | null;
  suivante: { numero: number; slug: string; titre: string } | null;
}

export async function chargerChemin(): Promise<CheminComplet | null> {
  const { data } = await fetchPublic<CheminComplet>('/public/association/chemin', { revalidate: 300 });
  return data && Array.isArray((data as CheminComplet).etapes) ? (data as CheminComplet) : null;
}

export async function chargerEtape(slug: string): Promise<EtapeDetaillee | null> {
  const { data } = await fetchPublic<EtapeDetaillee>(`/public/association/chemin/${encodeURIComponent(slug)}`, { revalidate: 300 });
  return data && (data as EtapeDetaillee).etape ? (data as EtapeDetaillee) : null;
}

/** Les modèles de documents qu'on peut fabriquer sur place. */
export async function chargerModeles(): Promise<ModeleFabrique[]> {
  const { data } = await fetchPublic<{ modeles: ModeleFabrique[] }>('/public/association/fabrique', { revalidate: 300 });
  return data && Array.isArray((data as { modeles?: unknown }).modeles) ? (data as { modeles: ModeleFabrique[] }).modeles : [];
}

export const LIBELLES_GENRE: Record<GenreDocument, string> = {
  CERFA: 'Formulaire officiel',
  MODELE: 'Modèle officiel',
  EXEMPLE: 'Exemple à recopier',
  SITE: 'Site officiel',
};

/** Les couleurs de chaque partie du chemin : une teinte par partie, la troisième en indigo. */
export const TEINTES_PARTIE: Record<PartieChemin, { fond: string; texte: string; bord: string; pastille: string }> = {
  NAITRE: { fond: 'bg-[#E3F5EC]', texte: 'text-[#0F5F3E]', bord: 'border-[#BFE6D2]', pastille: 'bg-[#1E9E6A]' },
  VIVRE: { fond: 'bg-[#FEF3E2]', texte: 'text-[#7C3E06]', bord: 'border-[#F5D6A8]', pastille: 'bg-[#F5B400]' },
  SUBVENTION: { fond: 'bg-[#ECEBFC]', texte: 'text-[#4338CA]', bord: 'border-[#C7C4F2]', pastille: 'bg-[#4F46E5]' },
};
