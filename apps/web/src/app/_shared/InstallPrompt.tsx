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
 * ELLE S'OUVRE À CHAQUE VISITE, ET SE RANGE À GAUCHE. Deux corrections du
 * 9/09/2026 :
 *
 *  1. Elle ne s'ouvrait qu'une fois dans la vie du navigateur. Une seule
 *     occasion de voir la proposition, souvent au mauvais moment — et si on
 *     répondait « Plus tard » ce jour-là, on ne la revoyait plus jamais. Elle
 *     revient donc à chaque ouverture du site, douze secondes après l'arrivée.
 *     Fermer reste sans effet sur la visite suivante : c'est le sens de
 *     « Plus tard ».
 *
 *  2. La pastille réduite était en bas à DROITE, exactement là où vivent déjà
 *     le retour en haut de page et l'assistant : elle les cachait. Elle passe
 *     à gauche, où rien ne se trouve.
 *
 * La réduction ne vaut donc que pour la visite en cours : le site ne rouvre
 * pas la bannière après un « Plus tard », mais il la reproposera demain.
 */

interface EvenementInstallation extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Ce que le site s'appelle, là où on est. */
function marque(hote: string) {
  if (hote.startsWith('pilote.') || hote.includes('toulali')) {
    return {
      nom: 'Piloter',
      titre: "Installer l'application Piloter",
      texte:
        "Ajoutez Piloter à votre écran d'accueil : votre chemin, vos pièces et vos dossiers s'ouvrent en un geste, même sans connexion.",
    };
  }
  return {
    nom: 'Les Extras',
    titre: "Installer l'application Les Extras",
    texte:
      "Ajoutez Les Extras à votre écran d'accueil : vos missions de renfort en un geste, et les alertes qui arrivent au bon moment.",
  };
}

export function InstallPrompt() {
  const [evenement, setEvenement] = useState<EvenementInstallation | null>(null);
  const [etat, setEtat] = useState<'cache' | 'ouvert' | 'reduit'>('cache');
  const [nom, setNom] = useState(() => marque(''));

  useEffect(() => {
    setNom(marque(window.location.hostname));

    // Déjà installé : rien à proposer.
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;

    const surProposition = (e: Event) => {
      e.preventDefault();
      setEvenement(e as EvenementInstallation);
      // Douze secondes : le temps d'arriver, de regarder, de comprendre où on
      // est. Une bannière qui saute à la figure au premier pixel ne s'installe
      // pas, elle se ferme.
      window.setTimeout(() => setEtat('ouvert'), 12_000);
    };

    const surInstallation = () => {
      setEtat('cache');
      setEvenement(null);
    };

    window.addEventListener('beforeinstallprompt', surProposition);
    window.addEventListener('appinstalled', surInstallation);
    return () => {
      window.removeEventListener('beforeinstallprompt', surProposition);
      window.removeEventListener('appinstalled', surInstallation);
    };
  }, []);

  if (etat === 'cache' || !evenement) return null;

  /** « Plus tard » : rangée pour cette visite, reproposée à la suivante. */
  function reduire() {
    setEtat('reduit');
  }

  async function installer() {
    if (!evenement) return;
    setEtat('cache');
    try {
      await evenement.prompt();
      await evenement.userChoice;
    } catch {
      /* le navigateur a repris la main : on ne force rien */
    }
    setEvenement(null);
  }

  // RÉDUITE : une pastille discrète EN BAS À GAUCHE. À droite, elle recouvrait
  // le retour en haut de page et l'assistant — trois ronds au même endroit,
  // dont deux invisibles.
  if (etat === 'reduit') {
    return (
      <button
        type="button"
        onClick={() => setEtat('ouvert')}
        aria-label={nom.titre}
        title={nom.titre}
        className="fixed bottom-5 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#4F46E5] shadow-[0_10px_30px_rgba(0,0,0,0.2)] ring-1 ring-black/10 transition hover:bg-[#ECEBFC]"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12M8 11l4 4 4-4M4 21h16" />
        </svg>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label={nom.titre}
      className="fixed inset-x-3 bottom-[88px] z-50 mx-auto max-w-[520px] rounded-2xl border border-black/10 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:bottom-3 sm:p-5"
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
          onClick={reduire}
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
