/**
 * QUI REGARDE LA PAGE — lu par le navigateur, après l'affichage.
 *
 * POURQUOI CETTE ROUTE EXISTE.
 *
 * Le layout public lisait la session pendant le rendu serveur, pour deux
 * choses seulement : afficher le prénom dans l'en-tête, et allumer les cœurs
 * « mis de côté » du catalogue. Lire un cookie pendant le rendu rend la page
 * PERSONNALISÉE aux yeux de Next, qui la déclare alors dynamique et la sert
 * avec `cache-control: private, no-cache, no-store`. Résultat mesuré le
 * 20/08/2026 : 0,44 s à 0,90 s de temps de première réponse sur CHAQUE visite,
 * y compris répétée, sur des pages dont 99 % du contenu est identique pour
 * tout le monde. Deux détails d'affichage bloquaient tout le cache du site.
 *
 * On inverse : la page est rendue pour un visiteur anonyme, et le navigateur
 * demande ici, après coup, ce qui le concerne. Une seule requête pour les deux
 * usages — un en-tête et des favoris qui interrogeraient séparément feraient
 * deux allers-retours là où un suffit.
 *
 * `force-dynamic` et `no-store` sont ICI à leur place : c'est une route de
 * données personnelles, elle ne doit jamais être mise en cache, ni par le
 * navigateur ni par un intermédiaire. C'est justement pour qu'elle porte seule
 * cette contrainte que le reste de la page en est libéré.
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { apiRequest } from '@/lib/api';

export const dynamic = 'force-dynamic';

export interface Visiteur {
  connecte: boolean;
  prenom: string | null;
  compte: string | null;
  /** Identifiants des ateliers mis de côté. Vide si non connecté. */
  favoris: string[];
}

const ANONYME: Visiteur = { connecte: false, prenom: null, compte: null, favoris: [] };

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(ANONYME, { headers: { 'Cache-Control': 'no-store' } });

  // Un échec sur les favoris ne doit pas faire disparaître le prénom de
  // l'en-tête : on rend ce qu'on a. Le cœur restera éteint, il se rallumera
  // au prochain chargement — c'est un désagrément, pas une panne.
  let favoris: string[] = [];
  try {
    favoris =
      ((await apiRequest('/favorites/ids', {
        token: session.token,
        accountId: session.account?.id,
      })) as string[]) ?? [];
  } catch {
    favoris = [];
  }

  return NextResponse.json(
    {
      connecte: true,
      prenom: session.user?.firstName ?? null,
      compte: session.activeAccount?.name ?? session.account?.name ?? null,
      favoris,
    } satisfies Visiteur,
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
