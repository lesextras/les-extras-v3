'use client';

import { espaceCourant } from '../_client';

/**
 * LES APPELS DE L'ÉCOLE, CÔTÉ NAVIGATEUR.
 *
 * Tout passe par `/api/proxy…` : le jeton reste dans un cookie, il ne traverse
 * jamais le JavaScript. Une seule fonction, pour que le message d'erreur soit
 * le même partout — celui que l'API a écrit, en français.
 *
 * L'espace affiché par la page est transmis en en-tête, pour que ce que le
 * navigateur crée ou lit soit bien rangé dans la même académie que celle que
 * le serveur affiche — et pas dans un autre compte de la personne.
 */
export async function appel<T>(
  chemin: string,
  init?: { methode?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; corps?: unknown },
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  const espace = espaceCourant();
  if (espace) headers['x-account-id'] = espace;
  const res = await fetch(`/api/proxy${chemin}`, {
    method: init?.methode ?? 'GET',
    headers,
    credentials: 'include',
    body: init?.corps === undefined ? undefined : JSON.stringify(init.corps),
  });
  const texte = await res.text();
  const data = texte ? JSON.parse(texte) : {};
  if (!res.ok) throw new Error(typeof data?.message === 'string' ? data.message : "L'opération n'a pas abouti.");
  return data as T;
}

export function messageDe(e: unknown): string {
  return e instanceof Error ? e.message : 'Erreur inconnue';
}
