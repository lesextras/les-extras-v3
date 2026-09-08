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
 * ELLE NE S'OUVRE QU'UNE FOIS D'ELLE-MÊME. Ensuite elle vit en pastille, en
 * bas à droite : « Plus tard » la réduit, la pastille la rouvre, et le site ne
 * la remet plus jamais devant les yeux tout seul. Le choix se retient d'une
 * visite à l'autre.
 */

interface EvenementInstallation extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const MEMOIRE = 'installation-reduite';

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

function dejaReduite() {
  try {
    return window.localStorage.getItem(MEMOIRE) === 'oui';
  } catch {
    return false;
  }
}

function retenirReduction(reduite: boolean) {
  try {
    if (reduite) window.localStorage.setItem(MEMOIRE, 'oui');
    else window.localStorage.removeItem(MEMOIRE);
  } catch {
    /* navigation privée : on oublie, ce n'est pas grave */
  }
}

export function InstallPrompt() {
  const [evenement, setEvenement] = useState<EvenementInstallation | null>(null);
  const [etat, setEtat] = useState<'cache' | 'ouvert' | 'reduit'>('cache');
  const [nom, setNom] = useState(() => marque(''));

  useEffect(() => {
    setNom(marque(window.location.hostname));

    // Déjà installé : rien à proposer.
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;
    const reduite = dejaReduite();

    const surProposition = (e: Event) => {
      e.preventDefault();
      setEvenement(e as EvenementInstallation);
      // Réduite une fois, elle le reste : c'est la pastille qui la rouvre.
      if (reduite) {
        setEtat('reduit');
        return;
      }
      // On laisse la personne arriver sur la page avant de proposer quoi que ce
      // soit — et on ne le propose QU'UNE FOIS. Dès cette ouverture, on retient
      // la réduction : à partir de là, c'est la pastille qui rouvre, jamais le
      // site de lui-même.
      window.setTimeout(() => {
        retenirReduction(true);
        setEtat('ouvert');
      }, 12_000);
    };

    const surInstallation = () => {
      setEtat('cache');
      setEvenement(null);
      retenirReduction(false);
    };

    window.addEventListener('beforeinstallprompt', surProposition);
    window.addEventListener('appinstalled', surInstallation);
    return () => {
      window.removeEventListener('beforeinstallprompt', surProposition);
      window.removeEventListener('appinstalled', surInstallation);
    };
  }, []);

  if (etat === 'cache' || !evenement) return null;

  function reduire() {
    retenirReduction(true);
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

  // RÉDUITE : une pastille discrète, au-dessus de la boussole, qui la rouvre.
  if (etat === 'reduit') {
    return (
      <button
        type="button"
        onClick={() => setEtat('ouvert')}
        aria-label={nom.titre}
        title={nom.titre}
        className="fixed bottom-[88px] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#4F46E5] shadow-[0_10px_30px_rgba(0,0,0,0.2)] ring-1 ring-black/10 transition hover:bg-[#ECEBFC]"
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
