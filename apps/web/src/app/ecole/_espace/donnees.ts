import 'server-only';
import { fetchPublic } from '../../_shared/server';
import { apiApprenant } from '../../_shared/apprenant-serveur';
import type { EcoleAffichee } from './coque';

export interface Moi {
  apprenant: { email: string; prenom: string | null; nom: string | null };
  ecole: EcoleAffichee;
  formations: {
    id: string;
    coursId: string;
    titre: string;
    sousTitre: string | null;
    imageUrl: string | null;
    progression: number;
    statut: 'ACTIVE' | 'SUSPENDUE' | 'TERMINEE';
    termineLe: string | null;
    inscritLe: string;
    derniereVisite: string | null;
    expireLe: string | null;
    expire: boolean;
    lien: string;
    devoirs: { aCorriger: number; aReprendre: number };
  }[];
  catalogue: { titre: string; slug: string; sousTitre: string | null; imageUrl: string | null; prixCents: number; gratuit: boolean }[];
}

/** L'école d'une adresse, telle que la page de connexion l'affiche. */
export async function ecoleDuSlug(slug: string): Promise<EcoleAffichee | null> {
  const { data } = await fetchPublic<EcoleAffichee>(`/public/ecole/ecoles/${encodeURIComponent(slug)}/espace`, { revalidate: 0 });
  return data && (data as EcoleAffichee).slug ? (data as EcoleAffichee) : null;
}

/** L'apprenant connecté À CETTE ÉCOLE, ou null (session absente, expirée, ou d'une autre école). */
export async function moiSurEcole(slug: string): Promise<Moi | null> {
  const r = await apiApprenant<Moi>('/apprenant/moi');
  if (!r.data || r.data.ecole?.slug !== slug) return null;
  return r.data;
}
