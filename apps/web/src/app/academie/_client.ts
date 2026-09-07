'use client';

/**
 * Appels à l'API depuis le navigateur, toujours par le relais du site
 * (/api/proxy) : c'est lui qui porte le jeton et le compte actif.
 */
export async function appel<T = unknown>(
  path: string,
  init?: { method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; body?: unknown; form?: FormData },
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (init?.form) body = init.form;
  else if (init?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.body);
  }
  const res = await fetch(`/api/proxy${path.startsWith('/') ? path : `/${path}`}`, {
    method: init?.method ?? 'GET',
    headers,
    body,
    credentials: 'include',
  });
  const texte = await res.text();
  let charge: unknown = null;
  try {
    charge = texte ? JSON.parse(texte) : null;
  } catch {
    charge = null;
  }
  if (!res.ok) {
    if (res.status === 401) {
      window.location.href = `/academie/connexion?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new Error(messageLisible(res.status, charge));
  }
  return charge as T;
}

function messageLisible(status: number, charge: unknown): string {
  const repli: Record<number, string> = {
    400: 'Certains champs ne sont pas valides.',
    401: 'Votre session a expiré, reconnectez-vous.',
    403: "Vous n'avez pas les droits pour cette action.",
    404: 'Introuvable.',
    409: 'Cette action entre en conflit avec une autre.',
    413: 'Ce fichier est trop lourd.',
    429: 'Trop de tentatives, patientez un instant.',
    500: 'Erreur du serveur, réessayez dans un instant.',
  };
  const brut = charge && typeof charge === 'object' && 'message' in charge ? (charge as { message: unknown }).message : null;
  const textes = (Array.isArray(brut) ? brut : [brut]).filter((m): m is string => typeof m === 'string' && m.trim().length > 0);
  const techniques = new Set(['Bad Request', 'Unauthorized', 'Forbidden', 'Not Found', 'Conflict', 'Internal server error']);
  const utiles = textes.filter((t) => !techniques.has(t));
  return utiles.length ? utiles.join(' · ') : (repli[status] ?? `Erreur ${status}.`);
}

interface ResultatConnexion {
  accessToken?: string;
  user?: { memberships?: { account?: { id: string; type?: string } }[] };
}

/**
 * Connexion depuis l'espace académie : jeton par l'API, puis cookie de session
 * posé par le site, sur le compte ACADEMIE quand il y en a un.
 */
export async function connecter(email: string, password: string): Promise<{ ouvert: boolean }> {
  const r = await appel<ResultatConnexion>('/auth/login', { method: 'POST', body: { email, password } });
  const jeton = r.accessToken;
  if (!jeton) throw new Error('Connexion impossible : jeton manquant.');
  const comptes = (r.user?.memberships ?? []).map((m) => m.account).filter(Boolean) as { id: string; type?: string }[];
  const compte = comptes.find((c) => c.type === 'ACADEMIE');
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(compte ? { token: jeton, accountId: compte.id } : { token: jeton }),
  });
  if (!res.ok) throw new Error("La session n'a pas pu être ouverte.");
  if (compte) choisirEspace(compte.id);
  return { ouvert: Boolean(compte) };
}

/**
 * L'espace sur lequel on travaille. Ce cookie ne donne aucun droit : le serveur
 * ne le suit que si l'identifiant est bien l'un des comptes de la session.
 */
export function choisirEspace(accountId: string) {
  const unAn = 60 * 60 * 24 * 365;
  document.cookie = `pilote_espace=${encodeURIComponent(accountId)}; path=/; max-age=${unAn}; samesite=lax`;
}

/** Ouvre l'espace d'une académie. Avec `autre`, on en ajoute une DE PLUS. */
export async function ouvrirAcademie(
  nom: string,
  options?: { siren?: string; siret?: string; nda?: string; qualiopi?: string; autre?: boolean },
): Promise<{ accountId: string; existant?: boolean }> {
  const r = await appel<{ accountId: string; existant?: boolean }>('/academie/ouvrir', {
    method: 'POST',
    body: {
      nom: nom.trim(),
      ...(options?.siren ? { siren: options.siren } : {}),
      ...(options?.siret ? { siret: options.siret } : {}),
      ...(options?.nda ? { nda: options.nda } : {}),
      ...(options?.qualiopi ? { qualiopi: options.qualiopi } : {}),
      ...(options?.autre ? { autre: true } : {}),
    },
  });
  if (r.accountId) choisirEspace(r.accountId);
  return r;
}

export async function deconnecter(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE' });
  document.cookie = 'pilote_espace=; path=/; max-age=0';
}
