import { fetchPublic } from '../_shared/server';

/** Le chemin de l'académie, tel que l'API le renvoie (apps/api/src/academie/chemin.ts). */

export interface EtapeChemin {
  slug: string;
  numero: number;
  titre: string;
  resume: string;
  pourPasser: string;
  deduite?: string;
}

export interface CheminPublic {
  version: string;
  total: number;
  etapes: EtapeChemin[];
}

export interface EtapeDetaillee {
  etape: EtapeChemin;
  total: number;
  precedente: { numero: number; slug: string; titre: string } | null;
  suivante: { numero: number; slug: string; titre: string } | null;
}

export async function chargerChemin(): Promise<CheminPublic | null> {
  const { data } = await fetchPublic<CheminPublic>('/public/academie/chemin', { revalidate: 300 });
  return data && Array.isArray((data as CheminPublic).etapes) ? (data as CheminPublic) : null;
}

export async function chargerEtape(slug: string): Promise<EtapeDetaillee | null> {
  const { data } = await fetchPublic<EtapeDetaillee>(`/public/academie/chemin/${encodeURIComponent(slug)}`, { revalidate: 300 });
  return data && (data as EtapeDetaillee).etape ? (data as EtapeDetaillee) : null;
}

/**
 * Les trois temps du chemin, pour donner un rythme à la liste : on ne lit pas
 * douze étapes d'affilée, on lit trois moments de trois ou quatre étapes.
 */
export const TEMPS = [
  { titre: 'Exister', de: 1, a: 5, resume: "Vérifier que c'est bien de la formation, choisir le porteur, obtenir le SIRET, signer la première convention, déclarer l'activité." },
  { titre: 'Se tenir', de: 6, a: 8, resume: 'Les documents socles, le référent handicap, la première fiche programme conforme.' },
  { titre: 'Se certifier', de: 9, a: 12, resume: "Le dossier Qualiopi, le certificateur, l'audit, puis les financements." },
] as const;

export function tempsDe(numero: number) {
  return TEMPS.find((t) => numero >= t.de && numero <= t.a) ?? TEMPS[0];
}

/** Une teinte par temps : vert clair, ambre, vert plein. */
export const TEINTES: Record<string, { fond: string; texte: string; bord: string; pastille: string }> = {
  Exister: { fond: 'bg-[#E3F5EC]', texte: 'text-[#0F5F3E]', bord: 'border-[#B7E4CE]', pastille: 'bg-[#1E9E6A]' },
  'Se tenir': { fond: 'bg-[#FEF3E2]', texte: 'text-[#7C3E06]', bord: 'border-[#F5D6A8]', pastille: 'bg-[#F5B400]' },
  'Se certifier': { fond: 'bg-[#ECEBFC]', texte: 'text-[#4338CA]', bord: 'border-[#C7C4F2]', pastille: 'bg-[#4F46E5]' },
};
