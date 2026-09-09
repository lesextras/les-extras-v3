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

/**
 * DÉPOSE UN MÉDIA DANS LA MÉDIATHÈQUE DE L'ACADÉMIE.
 *
 * Renvoie l'adresse publique du fichier, celle qu'on colle dans un bloc vidéo,
 * audio, image ou document. On ne pose PAS de « Content-Type » : c'est le
 * navigateur qui doit écrire la frontière du formulaire, et l'imposer à la
 * main casse l'envoi sans message clair.
 */
export async function deposerMedia(fichier: File): Promise<{ id: string; nom: string; url: string; taille: number; type: string }> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const espace = espaceCourant();
  if (espace) headers['x-account-id'] = espace;
  const corps = new FormData();
  corps.append('file', fichier);
  const res = await fetch('/api/proxy/files/media', {
    method: 'POST',
    headers,
    credentials: 'include',
    body: corps,
  });
  const texte = await res.text();
  const data = texte ? JSON.parse(texte) : {};
  if (!res.ok) {
    throw new Error(
      typeof data?.message === 'string' ? data.message : "Le dépôt du fichier n'a pas abouti.",
    );
  }
  const media = data as { id: string; nom: string; url: string; taille: number; type: string };
  // L'API renvoie une adresse relative à elle-même ; le navigateur, lui, passe
  // toujours par le proxy de même origine.
  return { ...media, url: `/api/proxy${media.url}` };
}
