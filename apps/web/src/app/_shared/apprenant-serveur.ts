import 'server-only';
import { cookies } from 'next/headers';

/**
 * L'ESPACE APPRENANT, CÔTÉ SERVEUR.
 *
 * Les pages de l'espace lisent le cookie de session apprenant et appellent
 * l'API avec l'en-tête `x-apprenant`. Jamais de throw : une page vide avec un
 * message vaut mieux qu'une page d'erreur.
 */
export const COOKIE_APPRENANT = 'pilote_apprenant';

function apiBase(): string {
  return (process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/$/, '');
}

export async function sessionApprenant(): Promise<string | null> {
  return (await cookies()).get(COOKIE_APPRENANT)?.value ?? null;
}

export async function apiApprenant<T>(chemin: string): Promise<{ data?: T; status: number; error?: string }> {
  const s = await sessionApprenant();
  try {
    const r = await fetch(`${apiBase()}/public/ecole${chemin}`, {
      headers: { Accept: 'application/json', ...(s ? { 'x-apprenant': s } : {}) },
      cache: 'no-store',
    });
    const texte = await r.text();
    const corps = texte ? JSON.parse(texte) : null;
    if (!r.ok) return { status: r.status, error: typeof corps?.message === 'string' ? corps.message : 'Erreur' };
    return { data: corps as T, status: r.status };
  } catch {
    return { status: 0, error: 'Service indisponible pour le moment.' };
  }
}
