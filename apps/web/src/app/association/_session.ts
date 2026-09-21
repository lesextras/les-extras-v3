import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { apiRequest, ApiError } from '@/lib/api';
import type { Session, SessionAccount } from '@/lib/types';

/**
 * LA SESSION D'UNE ASSOCIATION.
 *
 * Le cookie est le même que celui du reste du déploiement ; ce qui change,
 * c'est le compte qu'on retient : le premier compte de type ASSOCIATION de la
 * personne. Sans session, on renvoie vers la connexion en gardant la page
 * demandée. Avec une session mais sans compte d'association — quelqu'un qui a
 * commencé sans association — on renvoie vers l'ouverture de son espace.
 */
export const TYPE_ASSOCIATION = 'ASSOCIATION';

/**
 * QUAND UNE PERSONNE EN PILOTE PLUSIEURS. Un cookie de préférence dit sur quel
 * espace elle travaille. Il ne porte AUCUN droit : on ne le suit que si
 * l'identifiant qu'il contient est bien l'un des comptes de la session. Sinon
 * on retombe sur le premier, comme avant.
 */
export const COOKIE_ESPACE = 'pilote_espace';

async function espaceVoulu(): Promise<string | null> {
  try {
    return (await cookies()).get(COOKIE_ESPACE)?.value ?? null;
  } catch {
    return null;
  }
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

/** Le compte association actif : la préférence si elle est valable, sinon le premier. */
async function choisirAssociation(session: Session): Promise<SessionAccount | null> {
  const comptes = session.accounts ?? [];
  let candidats = comptes.filter((c) => (c.type as string) === TYPE_ASSOCIATION);
  if (!candidats.length && (session.account.type as string) === TYPE_ASSOCIATION) {
    candidats = [session.account];
  }
  if (!candidats.length) {
    candidats = (await comptesFrais(session)).filter((c) => (c.type as string) === TYPE_ASSOCIATION);
  }
  if (!candidats.length) return null;
  const voulu = await espaceVoulu();
  return (voulu ? candidats.find((c) => c.id === voulu) : null) ?? candidats[0];
}

export interface SessionAssociation {
  session: Session;
  compte: SessionAccount;
}

export async function sessionAssociation(chemin = '/espace'): Promise<SessionAssociation> {
  const session = await getSession();
  if (!session) redirect(`/connexion?next=${encodeURIComponent(chemin)}`);
  const compte = await choisirAssociation(session);
  if (!compte) redirect('/ouvrir-mon-espace');
  return { session, compte };
}

/** Le compte association de la personne connectée, s'il y en a un. Ne redirige jamais. */
export async function associationConnectee(): Promise<SessionAccount | null> {
  const session = await getSession();
  if (!session) return null;
  return choisirAssociation(session);
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
  if (n === null || n === undefined) return 'Non renseigné';
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
  const compte = await choisirAssociation(session);
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

/** Ce qu'une page du chemin sait de l'association connectée : ses étapes, son classeur, de quoi pré-remplir. */
export interface ContexteChemin {
  faites: Set<string>;
  verifiees: Set<string>;
  nomAssociation: string;
  /** Par code de pièce : où elle en est, et le fichier s'il y en a un. */
  classeur: Record<string, { situation: string; fileId: string | null; libelle: string }>;
  prerempli: Record<string, unknown>;
}

interface EspaceBrut {
  organisation?: { nom?: string; adresse?: string | null; codePostal?: string | null; commune?: string | null };
  chemin?: { etapes?: { slug: string; faite: boolean; verifiee?: boolean }[] };
  classeur?: { type: { code: string; libelle: string }; situation: string; piece?: { fileId?: string | null } | null }[];
  repertoire?: { membresAJour?: number; benevoles?: number; bureau?: { nom: string; roles: string[] }[]; resume?: { membresAJour?: number; benevoles?: number; bureau?: { nom: string; roles: string[] }[] } };
  actions?: { intitule: string; dateDebut?: string | null; beneficiaires?: number | null }[];
  projet?: { pourQui?: string | null; quoi?: string | null; comment?: string | null; apres?: string | null; demande?: string | null };
}

/**
 * Comme `etapesFaitesSiConnecte`, avec en plus le classeur et les valeurs
 * pré-remplies pour fabriquer un document. Ne redirige jamais.
 */
export async function contexteChemin(): Promise<ContexteChemin | null> {
  const session = await getSession();
  if (!session) return null;
  const compte = await choisirAssociation(session);
  if (!compte) return null;
  try {
    const data = (await apiRequest('/association/espace', {
      method: 'GET',
      token: session.token,
      accountId: compte.id,
      cache: 'no-store',
    })) as EspaceBrut;
    const etapes = data.chemin?.etapes ?? [];
    const classeur: ContexteChemin['classeur'] = {};
    for (const l of data.classeur ?? []) classeur[l.type.code] = { situation: l.situation, fileId: l.piece?.fileId ?? null, libelle: l.type.libelle };
    const o = data.organisation ?? {};
    const repertoire = data.repertoire?.resume ?? data.repertoire ?? {};
    const bureau = repertoire.bureau ?? [];
    const nomRole = (role: string) => bureau.find((b) => b.roles.includes(role))?.nom ?? '';
    const p = data.projet ?? {};
    const prerempli: Record<string, unknown> = {
      'organisation.nom': o.nom ?? '',
      'organisation.adresse': [o.adresse, [o.codePostal, o.commune].filter(Boolean).join(' ')].filter(Boolean).join(', '),
      'organisation.commune': o.commune ?? '',
      'bureau.president': nomRole('PRESIDENT'),
      'bureau.tresorier': nomRole('TRESORIER'),
      'bureau.secretaire': nomRole('SECRETAIRE'),
      'bureau.liste': bureau.map((b) => {
        const [prenom, ...reste] = b.nom.split(' ');
        const fonction = b.roles.includes('PRESIDENT') ? 'Président·e' : b.roles.includes('TRESORIER') ? 'Trésorier·ère' : b.roles.includes('SECRETAIRE') ? 'Secrétaire' : 'Membre du bureau';
        return { prenom, nom: reste.join(' '), fonction };
      }),
      'repertoire.membresAJour': repertoire.membresAJour ?? '',
      'repertoire.benevoles': repertoire.benevoles ?? '',
      'projet.pourQui': p.pourQui ?? '',
      'projet.quoi': p.quoi ?? '',
      'projet.comment': p.comment ?? '',
      'projet.apres': p.apres ?? '',
      'projet.demande': p.demande ?? '',
      'projet.texteCourt': p.quoi ?? '',
      'actions.liste': (data.actions ?? []).map((a) => ({
        titre: a.intitule,
        quand: a.dateDebut ? new Date(a.dateDebut).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '',
        personnes: a.beneficiaires ?? '',
      })),
    };
    return {
      faites: new Set(etapes.filter((e) => e.faite).map((e) => e.slug)),
      verifiees: new Set(etapes.filter((e) => e.verifiee).map((e) => e.slug)),
      nomAssociation: o.nom ?? compte.name,
      classeur,
      prerempli,
    };
  } catch {
    return null;
  }
}
