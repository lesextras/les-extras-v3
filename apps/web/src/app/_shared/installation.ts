'use client';

/**
 * L'INSTALLATION DE PILOTER, PARTAGÉE ENTRE LA FENÊTRE ET LE BLOC D'ACCUEIL.
 *
 * Le navigateur n'annonce qu'une fois par page qu'il sait installer
 * (`beforeinstallprompt`). La fenêtre de la première visite et le bloc de
 * l'accueil ont tous deux besoin de cet événement : on l'attrape ici, une
 * seule fois, dès le chargement du module, et chacun vient le lire.
 *
 * ⚠ LA FENÊTRE NE S'OUVRE QU'UNE FOIS DANS LA VIE DU NAVIGATEUR (demande de
 * Siham, 24/09/2026). Elle revenait à chaque visite, sur chaque page : on la
 * fermait dix fois par jour. Ensuite, l'installation reste à portée de main
 * dans un bloc de l'accueil, et nulle part ailleurs.
 */

export interface EvenementInstallation extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** La marque « la fenêtre a déjà été montrée ». */
export const CLE_FENETRE_VUE = 'pilote_installation_proposee';

let evenement: EvenementInstallation | null = null;
let installee = false;
const abonnes = new Set<() => void>();

function prevenir() {
  abonnes.forEach((f) => f());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    evenement = e as EvenementInstallation;
    prevenir();
  });
  window.addEventListener('appinstalled', () => {
    evenement = null;
    installee = true;
    prevenir();
  });
}

export function evenementInstallation() {
  return evenement;
}

/** Ouvert dans l'application installée, ou installée pendant cette visite. */
export function dejaInstallee() {
  if (installee) return true;
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(display-mode: standalone)').matches);
}

export function abonnerInstallation(f: () => void) {
  abonnes.add(f);
  return () => {
    abonnes.delete(f);
  };
}

/** Le navigateur installe lui-même. Rend vrai si la personne a accepté. */
export async function lancerInstallation() {
  const e = evenement;
  if (!e) return false;
  try {
    await e.prompt();
    const choix = await e.userChoice;
    evenement = null;
    prevenir();
    return choix.outcome === 'accepted';
  } catch {
    return false;
  }
}

/**
 * iPhone ou iPad sous Safari. Depuis iPadOS 13, un iPad se présente comme un
 * Macintosh : on le reconnaît à son écran tactile. Chrome ou Firefox sur iOS
 * n'ajoutent rien à l'écran d'accueil.
 */
export function surIphone() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const pomme = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  return pomme && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

export function fenetreDejaVue() {
  try {
    return window.localStorage.getItem(CLE_FENETRE_VUE) !== null;
  } catch {
    return false;
  }
}

export function marquerFenetreVue() {
  try {
    window.localStorage.setItem(CLE_FENETRE_VUE, new Date().toISOString());
  } catch {
    /* navigation privée : la fenêtre reviendra, tant pis */
  }
}
