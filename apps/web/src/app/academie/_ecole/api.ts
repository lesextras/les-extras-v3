'use client';

/**
 * LES APPELS DE L'ÉCOLE, CÔTÉ NAVIGATEUR.
 *
 * Tout passe par `/api/proxy…` : le jeton reste dans un cookie, il ne traverse
 * jamais le JavaScript. Une seule fonction, pour que le message d'erreur soit
 * le même partout — celui que l'API a écrit, en français.
 */
export async function appel<T>(
  chemin: string,
  init?: { methode?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; corps?: unknown },
): Promise<T> {
  const res = await fetch(`/api/proxy${chemin}`, {
    method: init?.methode ?? 'GET',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    credentials: 'include',
    body: init?.corps === undefined ? undefined : JSON.stringify(init.corps),
  });
  const texte = await res.text();
  const data = texte ? JSON.parse(texte) : {};
  if (!res.ok) throw new Error(typeof data?.message === 'string' ? data.message : "L'opération n'a pas abouti.");
  return data as T;
}

export function messageDe(e: unknown) {
  return e instanceof Error ? e.message : 'Erreur inconnue';
}
