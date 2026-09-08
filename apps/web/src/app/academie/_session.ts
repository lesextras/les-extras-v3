import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { apiRequest, ApiError } from '@/lib/api';
import type { Session, SessionAccount } from '@/lib/types';

/**
 * LA SESSION D'UNE ACADÉMIE.
 *
 * Le cookie de session est le même que partout ailleurs ; ce qui change, c'est
 * le compte qu'on retient : un compte de type ACADEMIE de la personne.
 *
 * QUAND ELLE EN A PLUSIEURS — une association et une académie, ou deux
 * académies — un second cookie, `pilote_espace`, dit lequel est actif. Il ne
 * porte AUCUN droit : on ne le suit que si l'identifiant qu'il contient est
 * bien l'un des comptes de la session. Sinon on retombe sur le premier. C'est
 * une préférence d'affichage, pas une autorisation.
 */
export const TYPE_ACADEMIE = 'ACADEMIE';
export const COOKIE_ESPACE = 'pilote_espace';

export interface SessionAcademie {
  session: Session;
  compte: SessionAccount;
  /** Tous les comptes de la personne, quel que soit leur type : le sélecteur en a besoin. */
  espaces: SessionAccount[];
}

function comptesDe(session: Session): SessionAccount[] {
  const liste = session.accounts ?? [];
  if (liste.length) return liste;
  return session.account ? [session.account] : [];
}


/**
 * LES COMPTES VUS PAR L'API.
 *
 * Le cookie de session est écrit à la connexion : un espace ouvert APRÈS ne
 * s'y trouve pas. Plutôt que d'obliger la personne à se reconnecter pour voir
 * l'espace qu'elle vient d'ouvrir, on redemande la liste à l'API. On ne le
 * fait que lorsque la session ne connaît aucun compte du type cherché : le cas
 * courant ne coûte donc rien.
 */
interface AdhesionBrute {
  account?: SessionAccount | null;
}

async function comptesFrais(session: Session): Promise<SessionAccount[]> {
  try {
    const moi = (await apiRequest('/auth/me', { token: session.token, cache: 'no-store' })) as {
      memberships?: AdhesionBrute[];
      user?: { memberships?: AdhesionBrute[] };
    } | null;
    const adhesions = moi?.memberships ?? moi?.user?.memberships ?? [];
    return adhesions
      .map((a) => a?.account)
      .filter((c): c is SessionAccount => Boolean(c && c.id && c.type));
  } catch {
    // L'API ne répond pas : on s'en tient à ce que la session connaît.
    return [];
  }
}

/** Le compte actif parmi ceux d'un type donné, en respectant la préférence. */
async function choisir(session: Session, type: string): Promise<SessionAccount | null> {
  let candidats = comptesDe(session).filter((c) => (c.type as string) === type);
  if (!candidats.length) {
    candidats = (await comptesFrais(session)).filter((c) => (c.type as string) === type);
  }
  if (!candidats.length) return null;
  try {
    const voulu = (await cookies()).get(COOKIE_ESPACE)?.value;
    const trouve = voulu ? candidats.find((c) => c.id === voulu) : null;
    if (trouve) return trouve;
  } catch {
    // Pas de requête en cours (rendu statique) : la préférence ne s'applique pas.
  }
  return candidats[0];
}

export async function sessionAcademie(chemin = '/academie'): Promise<SessionAcademie> {
  const session = await getSession();
  if (!session) redirect(`/academie/connexion?next=${encodeURIComponent(chemin)}`);
  const compte = await choisir(session, TYPE_ACADEMIE);
  if (!compte) redirect('/academie/ouvrir-mon-espace');
  // L'espace qu'on vient d'ouvrir n'est pas encore dans le cookie de session :
  // on l'ajoute à la liste, sinon le sélecteur ne le montrerait pas.
  const connus = comptesDe(session);
  const espaces = connus.some((c) => c.id === compte.id) ? connus : [...connus, compte];
  return { session, compte, espaces };
}

/** L'académie de la personne connectée, s'il y en a une. Ne redirige jamais. */
export async function academieConnectee(): Promise<SessionAccount | null> {
  const session = await getSession();
  if (!session) return null;
  return choisir(session, TYPE_ACADEMIE);
}

/** Appel à l'API au nom de l'académie, côté serveur, jamais mis en cache. */
export async function apiAcademie<T>(
  s: SessionAcademie,
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
    if (status === 401) redirect('/academie/connexion?motif=expiree');
    return { error: err instanceof Error ? err.message : 'Erreur inconnue', status };
  }
}
