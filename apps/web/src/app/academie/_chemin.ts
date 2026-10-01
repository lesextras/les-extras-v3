import { fetchPublic } from '../_shared/server';
import type { ObligationEtape } from '../_shared/chemin-obligations';

/** Le chemin de l'académie, tel que l'API le renvoie (apps/api/src/academie/chemin.ts). */

/**
 * Avec, pour chaque étape : obligatoire ou non, déclencheur, échéance,
 * prérequis, priorité et financements débloqués (01/10/2026). Les numéros
 * suivent l'ordre par priorité dans chaque temps : chaque temps garde le même
 * nombre d'étapes, donc les bornes de TEMPS restent justes.
 */
export interface EtapeChemin extends ObligationEtape {
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
 * finançable » ont été ajoutés le 01/10/2026, puis « À chaque session ».
 */
export const TEMPS = [
  { titre: 'Exister', de: 1, a: 5, resume: "Vérifier que c'est bien de la formation, choisir le porteur, obtenir le SIRET, signer la première convention, déclarer l'activité." },
  { titre: 'Se tenir', de: 6, a: 8, resume: 'Les documents socles, le référent handicap, la première fiche programme conforme.' },
  { titre: 'Se certifier', de: 9, a: 12, resume: "Le dossier Qualiopi, le certificateur, l'audit, puis les financements." },
  {
    titre: 'À chaque session',
    de: 13,
    a: 15,
    resume: "Ce qui se refait pour chaque formation vendue : une convention ou un contrat conforme, l'information avant l'entrée, l'attestation de fin.",
  },
  {
    titre: 'Chaque année',
    de: 16,
    a: 22,
    resume:
      'Le bilan pédagogique et financier, Qualiopi dans la durée, les preuves des sessions, les réclamations, les formateurs, les changements à déclarer, les résultats à publier. Une fois la date de l\'année passée, ou au 1er janvier sans date, elles reviennent dans « À faire » pour l\'année suivante.',
  },
  {
    titre: 'Être finançable',
    de: 23,
    a: 99,
    resume:
      "L'agrément ESUS, le Carif-Oref (Dokelio en Île-de-France) et France Travail, Mon Compte Formation, la TVA. Une étape ne te concerne pas ? Marque-la « Pas concerné ».",
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

/** Une teinte par temps : vert clair, ambre, indigo, bleu ciel pour « À chaque session », sarcelle pour « Chaque année », ardoise pour « Être finançable ». */
export const TEINTES: Record<string, { fond: string; texte: string; bord: string; pastille: string }> = {
  Exister: { fond: 'bg-[#E3F5EC]', texte: 'text-[#0F5F3E]', bord: 'border-[#B7E4CE]', pastille: 'bg-[#1E9E6A]' },
  'Se tenir': { fond: 'bg-[#FEF3E2]', texte: 'text-[#7C3E06]', bord: 'border-[#F5D6A8]', pastille: 'bg-[#F5B400]' },
  'Se certifier': { fond: 'bg-[#ECEBFC]', texte: 'text-[#4338CA]', bord: 'border-[#C7C4F2]', pastille: 'bg-[#4F46E5]' },
  'À chaque session': { fond: 'bg-[#E0F2FE]', texte: 'text-[#075985]', bord: 'border-[#BAE6FD]', pastille: 'bg-[#0284C7]' },
  'Chaque année': { fond: 'bg-[#E0F4F3]', texte: 'text-[#115E59]', bord: 'border-[#A7DCD8]', pastille: 'bg-[#0D9488]' },
  'Être finançable': { fond: 'bg-[#EEF0F4]', texte: 'text-[#3F4A5C]', bord: 'border-[#D3D8E2]', pastille: 'bg-[#64748B]' },
};
