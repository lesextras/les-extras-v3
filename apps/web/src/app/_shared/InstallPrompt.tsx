'use client';

import { useEffect, useState } from 'react';

/**
 * « AJOUTER À L'ÉCRAN D'ACCUEIL ».
 *
 * Le navigateur prévient quand le site peut s'installer ; on attrape
 * l'événement, on le garde, et on propose l'installation au bon moment plutôt
 * qu'au premier écran — une bannière qui saute à la figure ne s'installe pas,
 * elle se ferme.
 *
 * LE NOM AFFICHÉ SUIT L'ADRESSE. Le même code sert deux sites : Les Extras et
 * Piloter. Proposer « Ajoutez Les Extras » à quelqu'un qui pilote son
 * association n'a aucun sens — c'est l'hôte qui décide du nom, pas le
 * déploiement.
 *
 * Refusée, la bannière ne revient pas avant trois mois : le refus se retient.
 */

interface EvenementInstallation extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const MEMOIRE = 'installation-refusee-le';
const TROIS_MOIS = 90 * 24 * 3600 * 1000;

/** Ce que le site s'appelle, là où on est. */
function marque(hote: string) {
  if (hote.startsWith('pilote.') || hote.includes('toulali')) {
    return {
      nom: 'Pilote de TOULALI',
      titre: "Installer l'application Pilote de TOULALI",
      texte:
        "Ajoutez Pilote de TOULALI à votre écran d'accueil : votre chemin, vos pièces et vos dossiers s'ouvrent en un geste, même sans connexion.",
    };
  }
  return {
    nom: 'Les Extras',
    titre: "Installer l'application Les Extras",
    texte:
      "Ajoutez Les Extras à votre écran d'accueil : vos missions de renfort en un geste, et les alertes qui arrivent au bon moment.",
  };
}

function refusRecent() {
  try {
    const quand = Number(window.localStorage.getItem(MEMOIRE) ?? '0');
    return Number.isFinite(quand) && quand > 0 && Date.now() - quand < TROIS_MOIS;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [evenement, setEvenement] = useState<EvenementInstallation | null>(null);
  const [visible, setVisible] = useState(false);
  const [nom, setNom] = useState(() => marque(''));

  useEffect(() => {
    setNom(marque(window.location.hostname));

    // Déjà installé : rien à proposer.
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;
    if (refusRecent()) return;

    const surProposition = (e: Event) => {
      e.preventDefault();
      setEvenement(e as EvenementInstallation);
      // On laisse la personne arriver sur la page avant de proposer quoi que ce soit.
      window.setTimeout(() => setVisible(true), 12_000);
    };

    const surInstallation = () => {
      setVisible(false);
      setEvenement(null);
    };

    window.addEventListener('beforeinstallprompt', surProposition);
    window.addEventListener('appinstalled', surInstallation);
    return () => {
      window.removeEventListener('beforeinstallprompt', surProposition);
      window.removeEventListener('appinstalled', surInstallation);
    };
  }, []);

  if (!visible || !evenement) return null;

  function refuser() {
    try {
      window.localStorage.setItem(MEMOIRE, String(Date.now()));
    } catch {
      /* navigation privée : on oublie, ce n'est pas grave */
    }
    setVisible(false);
  }

  async function installer() {
    if (!evenement) return;
    setVisible(false);
    try {
      await evenement.prompt();
      await evenement.userChoice;
    } catch {
      /* le navigateur a repris la main : on ne force rien */
    }
    setEvenement(null);
  }

  return (
    <div
      role="dialog"
      aria-label={nom.titre}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-[520px] rounded-2xl border border-black/10 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4F46E5] text-white" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12M8 11l4 4 4-4M4 21h16" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-base font-extrabold tracking-tight text-[#111]">{nom.titre}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-[#444]">{nom.texte}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={refuser}
          className="rounded-xl border-2 border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#333] transition hover:border-black/25"
        >
          Plus tard
        </button>
        <button
          type="button"
          onClick={installer}
          className="rounded-xl bg-[#4F46E5] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#4338CA]"
        >
          Installer
        </button>
      </div>
    </div>
  );
}
