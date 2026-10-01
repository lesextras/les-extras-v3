import { fetchPublic } from '../_shared/server';

/** Le chemin de l'académie, tel que l'API le renvoie (apps/api/src/academie/chemin.ts). */

export interface EtapeChemin {
  slug: string;
  numero: number;
  titre: string;
  resume: string;
  pourPasser: string;
  deduite?: string;
  /** Revient chaque année : repasse « À faire » au 1er janvier. */
  chaqueAnnee?: boolean;
  /** Peut être marquée « Pas concerné ». */
  peutNePasConcerner?: boolean;
  /** Les pages officielles pour faire l'étape. */
  liens?: { nom: string; lien: string }[];
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
 * Les temps du chemin, pour donner un rythme à la liste : on ne lit pas toutes
 * les étapes d'affilée, on lit des moments de deux à cinq étapes. Les bornes
 * suivent les numéros de l'API (apps/api/src/academie/chemin.ts) : une étape
 * ajoutée là-bas doit tomber dans un temps ici. « Chaque année » et « Être
 * finançable » ont été ajoutés le 01/10/2026.
 */
export const TEMPS = [
  { titre: 'Exister', de: 1, a: 5, resume: "Vérifier que c'est bien de la formation, choisir le porteur, obtenir le SIRET, signer la première convention, déclarer l'activité." },
  { titre: 'Se tenir', de: 6, a: 8, resume: 'Les documents socles, le référent handicap, la première fiche programme conforme.' },
  { titre: 'Se certifier', de: 9, a: 12, resume: "Le dossier Qualiopi, le certificateur, l'audit, puis les financements." },
  {
    titre: 'Chaque année',
    de: 13,
    a: 17,
    resume: 'Le bilan pédagogique et financier, Qualiopi dans la durée, les preuves des sessions, les réclamations, les formateurs. Ces étapes repassent dans « À faire » chaque 1er janvier.',
  },
  {
    titre: 'Être finançable',
    de: 18,
    a: 99,
    resume: "Mon Compte Formation, le Carif-Oref et France Travail. Une étape ne te concerne pas ? Marque-la « Pas concerné ».",
  },
] as const;

/** « étapes 13 à 17 », d'après les étapes réellement rangées dans le temps. */
export function libelleNumeros(numeros: number[]): string {
  if (!numeros.length) return '';
  const de = Math.min(...numeros);
  const a = Math.max(...numeros);
  return de === a ? `étape ${de}` : `étapes ${de} à ${a}`;
}

export function tempsDe(numero: number) {
  return TEMPS.find((t) => numero >= t.de && numero <= t.a) ?? TEMPS[0];
}

/** Une teinte par temps : vert clair, ambre, indigo, sarcelle pour « Chaque année », ardoise pour « Être finançable ». */
export const TEINTES: Record<string, { fond: string; texte: string; bord: string; pastille: string }> = {
  Exister: { fond: 'bg-[#E3F5EC]', texte: 'text-[#0F5F3E]', bord: 'border-[#B7E4CE]', pastille: 'bg-[#1E9E6A]' },
  'Se tenir': { fond: 'bg-[#FEF3E2]', texte: 'text-[#7C3E06]', bord: 'border-[#F5D6A8]', pastille: 'bg-[#F5B400]' },
  'Se certifier': { fond: 'bg-[#ECEBFC]', texte: 'text-[#4338CA]', bord: 'border-[#C7C4F2]', pastille: 'bg-[#4F46E5]' },
  'Chaque année': { fond: 'bg-[#E0F4F3]', texte: 'text-[#115E59]', bord: 'border-[#A7DCD8]', pastille: 'bg-[#0D9488]' },
  'Être finançable': { fond: 'bg-[#EEF0F4]', texte: 'text-[#3F4A5C]', bord: 'border-[#D3D8E2]', pastille: 'bg-[#64748B]' },
};
