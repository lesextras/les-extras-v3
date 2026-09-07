import 'server-only';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { apiRequest, ApiError } from '@/lib/api';
import type { Session, SessionAccount } from '@/lib/types';

/**
 * LA SESSION D'UNE ASSOCIATION.
 *
 * Le cookie est le même que celui du reste du déploiement ; ce qui change,
 * c'est le compte qu'on retient : le premier compte de type ASSOCIATION de la
 * personne. Sans session, ou sans compte de ce type, on renvoie vers la
 * connexion en gardant la page demandée.
 */
export const TYPE_ASSOCIATION = 'ASSOCIATION';

export interface SessionAssociation {
  session: Session;
  compte: SessionAccount;
}

export async function sessionAssociation(chemin = '/espace'): Promise<SessionAssociation> {
  const session = await getSession();
  if (!session) redirect(`/connexion?next=${encodeURIComponent(chemin)}`);
  const comptes = session.accounts ?? [];
  const compte =
    comptes.find((c) => (c.type as string) === TYPE_ASSOCIATION) ??
    ((session.account.type as string) === TYPE_ASSOCIATION ? session.account : null);
  if (!compte) redirect('/connexion?motif=compte');
  return { session, compte };
}

/** Appel à l'API au nom de l'association, côté serveur, jamais mis en cache. */
export async function apiEspace<T>(
  s: SessionAssociation,
  path: string,
  init?: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown },
): Promise<{ data?: T; error?: string; status?: number }> {
  try {
    const data = (await apiRequest(path, {
      method: init?.method ?? 'GET',
      body: init?.body,
      token: s.session.token,
      accountId: s.compte.id,
      cache: 'no-store',
    })) as T;
    return { data };
  } catch (err) {
    const status = err instanceof ApiError ? err.status : 0;
    if (status === 401) redirect('/connexion?motif=expiree');
    return { error: err instanceof Error ? err.message : 'Erreur inconnue', status };
  }
}

export function formaterEuros(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

/**
 * Les étapes du chemin déjà cochées, si la personne est connectée avec une
 * association ; sinon null. Ne redirige jamais : les pages publiques s'en
 * servent pour afficher « fait » sans exiger de compte.
 */
export async function etapesFaitesSiConnecte(): Promise<{ faites: Set<string>; verifiees: Set<string>; nomAssociation: string } | null> {
  const session = await getSession();
  if (!session) return null;
  const comptes = session.accounts ?? [];
  const compte =
    comptes.find((c) => (c.type as string) === TYPE_ASSOCIATION) ??
    ((session.account.type as string) === TYPE_ASSOCIATION ? session.account : null);
  if (!compte) return null;
  try {
    const data = (await apiRequest('/association/espace', {
      method: 'GET',
      token: session.token,
      accountId: compte.id,
      cache: 'no-store',
    })) as { chemin?: { etapes?: { slug: string; faite: boolean; verifiee?: boolean }[] }; organisation?: { nom?: string } };
    const etapes = data.chemin?.etapes ?? [];
    const faites = new Set(etapes.filter((e) => e.faite).map((e) => e.slug));
    const verifiees = new Set(etapes.filter((e) => e.verifiee).map((e) => e.slug));
    return { faites, verifiees, nomAssociation: data.organisation?.nom ?? compte.name };
  } catch {
    return null;
  }
}
