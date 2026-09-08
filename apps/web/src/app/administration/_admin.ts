import 'server-only';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { apiRequest, ApiError } from '@/lib/api';
import type { Session } from '@/lib/types';

/**
 * L'ADMINISTRATION DE PILOTER, CÔTÉ SERVEUR.
 *
 * Deux verrous, et pas un de moins : une session valide, et le rôle global
 * ADMIN. Le premier est vérifié ici pour éviter d'afficher une page vide ; le
 * second l'est ici ET par l'API, qui refuse la requête quoi qu'affiche
 * l'écran. Le navigateur n'est jamais l'autorité.
 */
export async function sessionAdministration(chemin = '/administration'): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/connexion?next=${encodeURIComponent(chemin)}`);
  if (session.user?.role !== 'ADMIN') redirect('/');
  return session;
}

export async function apiAdministration<T>(
  session: Session,
  path: string,
  init?: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown },
): Promise<{ data?: T; error?: string }> {
  try {
    const data = (await apiRequest(path, {
      method: init?.method ?? 'GET',
      body: init?.body,
      token: session.token,
      cache: 'no-store',
    })) as T;
    return { data };
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 0;
    if (status === 401) redirect('/connexion?motif=expiree');
    return { error: err instanceof Error ? err.message : 'Erreur inconnue' };
  }
}

/* ------------------------------------------------------------------ types */

export interface Tableau {
  comptes: { total: number; associations: number; academies: number; etablissements: number; intervenants: number };
  personnes: { total: number; administration: number };
  fiches: { organisations: number; academies: number };
  formulaires: { total: number; reponses: number };
  ecole: { cours: number; apprenants: number; ventes: number; chiffreCents: number };
  derniersComptes: { id: string; nom: string; type: string; slug: string; courriel: string | null; creeLe: string }[];
  dernieresPersonnes: { id: string; email: string; nom: string | null; role: string; statut: string; creeLe: string }[];
}

export interface CompteAdmin {
  id: string;
  nom: string;
  type: string;
  slug: string;
  commune: string | null;
  siret: string | null;
  creeLe: string;
  proprietaire: { id: string; email: string; statut: string } | null;
  association: { nom: string; rna: string | null; siret: string | null } | null;
  academie: { nom: string; nda: string | null; qualiopi: string } | null;
  nbFormulaires: number;
  nbCours: number;
  nbMembres: number;
}

export interface PersonneAdmin {
  id: string;
  email: string;
  nom: string | null;
  role: 'USER' | 'ADMIN';
  statut: 'PENDING' | 'VERIFIED' | 'BANNED' | 'ANONYMIZED';
  courrielVerifie: boolean;
  derniereConnexion: string | null;
  creeLe: string;
  espaces: { id: string; nom: string; type: string }[];
}

export interface FormulaireAdmin {
  id: string;
  titre: string;
  slug: string;
  statut: string;
  modifieLe: string;
  espace: { id: string; nom: string; type: string } | null;
  nbReponses: number;
}

export interface CoursAdmin {
  id: string;
  titre: string;
  slug: string;
  statut: string;
  gratuit: boolean;
  prixCents: number;
  modifieLe: string;
  espace: { id: string; nom: string; type: string } | null;
  nbApprenants: number;
}
