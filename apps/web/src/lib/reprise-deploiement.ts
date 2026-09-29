"use client";

import { startTransition, useEffect, useState } from "react";

/**
 * QUAND UN REDÉPLOIEMENT CASSE UNE PAGE, LA PAGE SE RÉPARE TOUTE SEULE.
 *
 * Deux pannes se produisent à chaque mise en ligne, et aucune n'est un bogue :
 *
 *  1. LE DÉCALAGE DE VERSION. Pendant les secondes où l'ancien et le nouveau
 *     conteneur du site répondent tous les deux, la page arrive de l'un et ses
 *     fichiers JavaScript sont demandés à l'autre, qui ne les a pas (leurs noms
 *     changent à chaque construction). Le chargement échoue (« ChunkLoadError »)
 *     et React remonte jusqu'à `global-error.tsx` : « La plateforme est
 *     momentanément indisponible ». Même chose pour un onglet resté ouvert
 *     depuis la version précédente. Le remède est un rechargement complet, une
 *     fois : la page et ses fichiers viennent alors de la même version.
 *
 *  2. L'API QUI REDÉMARRE. Une fiche rendue pendant que l'API bascule d'un
 *     conteneur à l'autre ne reçoit rien. Le serveur réessaie déjà et ressert la
 *     dernière réponse connue (`fetchPublic`) ; s'il n'en a aucune, l'écran
 *     d'erreur RÉESSAIE TOUT SEUL toutes les dix secondes pendant deux minutes,
 *     et dit ce qui se passe au lieu d'annoncer un incident.
 *
 * ⚠ AUCUNE BOUCLE INFINIE : le rechargement de version ne part qu'une fois par
 * tranche de vingt secondes (horodatage en sessionStorage), et la reprise
 * automatique s'arrête après douze essais sur la même adresse. Au-delà, l'écran
 * redevient l'écran d'erreur ordinaire, avec son bouton « Réessayer ».
 */

const MOTIFS_VERSION = [
  /ChunkLoadError/i,
  /Loading (CSS )?chunk [\w-]+ failed/i,
  /Failed to load chunk/i,
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
  /Failed to find Server Action/i,
];

export function estErreurDeVersion(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; message?: string };
  const texte = `${e.name ?? ""} ${e.message ?? ""}`;
  return MOTIFS_VERSION.some((m) => m.test(texte));
}

const CLE_VERSION = "reprise-version";
const DELAI_ENTRE_RECHARGEMENTS_MS = 20_000;

/** Recharge la page une fois. Rend `false` si un rechargement vient d'avoir lieu. */
export function rechargerUneFois(): boolean {
  try {
    const dernier = Number(window.sessionStorage.getItem(CLE_VERSION) ?? 0);
    if (Date.now() - dernier < DELAI_ENTRE_RECHARGEMENTS_MS) return false;
    window.sessionStorage.setItem(CLE_VERSION, String(Date.now()));
  } catch {
    /* stockage indisponible : on recharge quand même, une seule fois par montage */
  }
  window.location.reload();
  return true;
}

export const INTERVALLE_REPRISE_MS = 10_000;
export const ESSAIS_MAX = 12;

interface Suivi {
  chemin: string;
  essais: number;
  debut: number;
}

declare global {
  interface Window {
    __reprisePage?: Suivi;
  }
}

const CLE_SUIVI = "reprise-page";

/**
 * Compte les essais PAR ADRESSE, hors de React : l'écran d'erreur est démonté
 * et remonté à chaque essai raté, un état local repartirait de zéro. Et en
 * sessionStorage, pas seulement en mémoire : dans `global-error`, chaque essai
 * est un rechargement complet, qui effacerait un compteur en mémoire et ferait
 * recharger la page toutes les dix secondes pour toujours.
 */
function lireSuivi(): Suivi | undefined {
  try {
    const brut = window.sessionStorage.getItem(CLE_SUIVI);
    if (brut) return JSON.parse(brut) as Suivi;
  } catch {
    /* stockage indisponible : on retombe sur la mémoire de la page */
  }
  return window.__reprisePage;
}

function ecrireSuivi(s: Suivi) {
  window.__reprisePage = s;
  try {
    window.sessionStorage.setItem(CLE_SUIVI, JSON.stringify(s));
  } catch {
    /* stockage indisponible : la mémoire de la page suffit hors rechargement */
  }
}

function suivi(): Suivi {
  const chemin = window.location.pathname;
  const s = lireSuivi();
  if (!s || s.chemin !== chemin || Date.now() - s.debut > 5 * 60_000) {
    const neuf = { chemin, essais: 0, debut: Date.now() };
    ecrireSuivi(neuf);
    return neuf;
  }
  return s;
}

export type EtatReprise = "version" | "attente" | "abandon";

/**
 * À appeler en tête de chaque `error.tsx` / `global-error.tsx`.
 *
 * `relancer` est ce qu'on fait à chaque essai : `reset()` précédé de
 * `router.refresh()` dans les frontières ordinaires (le serveur refait le
 * rendu, sans perdre la page), `location.reload()` dans `global-error`, qui a
 * déjà perdu le layout.
 */
export function useRepriseAutomatique(error: unknown, relancer: () => void): EtatReprise {
  const version = estErreurDeVersion(error);
  // Seule une erreur du SERVEUR (elle porte un `digest`) peut être passagère :
  // une erreur de rendu dans le navigateur reviendrait à l'identique à chaque
  // essai, on ne la relance pas en boucle.
  const serveur = typeof (error as { digest?: unknown } | null)?.digest === "string";
  const [etat, setEtat] = useState<EtatReprise>(version ? "version" : serveur ? "attente" : "abandon");

  useEffect(() => {
    if (version) {
      // Une seconde et demie : le temps que le routeur ait fini de basculer
      // d'un conteneur à l'autre. Recharger aussitôt retomberait sur l'ancien.
      const t = window.setTimeout(() => {
        if (!rechargerUneFois()) setEtat("abandon");
      }, 1500);
      return () => window.clearTimeout(t);
    }
    if (!serveur) {
      setEtat("abandon");
      return;
    }
    const s = suivi();
    if (s.essais >= ESSAIS_MAX) {
      setEtat("abandon");
      return;
    }
    setEtat("attente");
    const t = window.setTimeout(() => {
      ecrireSuivi({ ...s, essais: s.essais + 1 });
      startTransition(() => relancer());
    }, INTERVALLE_REPRISE_MS);
    return () => window.clearTimeout(t);
    // `relancer` change à chaque rendu ; seule l'erreur décide d'un nouvel essai.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, version, serveur]);

  return etat;
}
