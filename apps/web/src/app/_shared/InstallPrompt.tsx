'use client';

import { useEffect, useRef, useState } from 'react';

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
 *
 * ⚠ ET SUR LES AUTRES NAVIGATEURS QUI SE TAISENT. On n'ouvrait la bannière
 * QUE si le navigateur avait prévenu. Il se tait dans bien des cas ordinaires
 * (Firefox, Safari de bureau, Chrome qui juge le moment mal choisi), et alors
 * plus rien ne proposait l'installation, alors qu'elle reste possible à la
 * main dans tous ces navigateurs. On ouvre donc dans tous les cas, et c'est
 * le chemin proposé qui change : un bouton quand le navigateur sait le faire,
 * les deux gestes à suivre quand c'est à la personne de le faire.
 *
 * ⚠ SUR IPHONE, IL N'Y A PAS D'ÉVÉNEMENT. `beforeinstallprompt` est une
 * invention de Chromium. Safari ne l'émet jamais et n'expose aucune API
 * d'installation : sur iPhone et iPad, la proposition ne s'affichait donc
 * jamais, alors que l'ajout à l'écran d'accueil y fonctionne parfaitement. Il
 * se fait à la main, par le menu Partager. On montre donc la même bannière,
 * avec le chemin à suivre à la place du bouton, puisque c'est la personne qui
 * appuie.
 */

interface EvenementInstallation extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * iPhone ou iPad. Depuis iPadOS 13, un iPad se présente comme un Macintosh :
 * on le reconnaît à son écran tactile. Et il faut que ce soit Safari, car un
 * Chrome ou un Firefox sur iOS n'ajoute rien à l'écran d'accueil.
 */
function surIphone() {
  const ua = navigator.userAgent;
  const pomme = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const safari = !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return pomme && safari;
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
  /** Comment on installe ici : le navigateur le fait, ou la personne le fait. */
  const [voie, setVoie] = useState<'navigateur' | 'iphone' | 'manuel'>('navigateur');
  /** Le navigateur a-t-il parlé ? Une référence, car le minuteur ne verrait pas l'état. */
  const recu = useRef(false);

  useEffect(() => {
    setNom(marque(window.location.hostname));

    // Déjà installé : rien à proposer.
    if (window.matchMedia?.('(display-mode: standalone)').matches) return;

    const surProposition = (e: Event) => {
      e.preventDefault();
      recu.current = true;
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

    // Douze secondes plus tard, si le navigateur n'a rien dit, c'est qu'il ne
    // dira rien : on ouvre nous-mêmes, avec les gestes à faire.
    const attente = window.setTimeout(() => {
      if (recu.current) return;
      setVoie(surIphone() ? 'iphone' : 'manuel');
      setEtat('ouvert');
    }, 12_000);

    return () => {
      window.removeEventListener('beforeinstallprompt', surProposition);
      window.removeEventListener('appinstalled', surInstallation);
      if (attente) window.clearTimeout(attente);
    };
  }, []);

  const aLaMain = voie !== 'navigateur';
  if (etat === 'cache' || (!evenement && !aLaMain)) return null;

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
          {voie === 'iphone' ? (
            <ol className="mt-3 space-y-1.5 text-[15px] leading-relaxed text-[#444]">
              <li>1. Appuyez sur le bouton Partager, en bas de Safari</li>
              <li>2. Choisissez « Sur l&apos;écran d&apos;accueil »</li>
              <li>3. Appuyez sur « Ajouter »</li>
            </ol>
          ) : null}
          {voie === 'manuel' ? (
            <ol className="mt-3 space-y-1.5 text-[15px] leading-relaxed text-[#444]">
              <li>1. Ouvrez le menu du navigateur, à droite de la barre d&apos;adresse</li>
              <li>2. Choisissez « Installer » ou « Ajouter à l&apos;écran d&apos;accueil »</li>
            </ol>
          ) : null}
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
        {aLaMain ? null : (
          <button
            type="button"
            onClick={installer}
            className="rounded-xl bg-[#4F46E5] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#4338CA]"
          >
            Installer
          </button>
        )}
      </div>
    </div>
  );
}
