'use client';

import { useEffect, useState } from 'react';
import {
  abonnerInstallation,
  dejaInstallee,
  evenementInstallation,
  fenetreDejaVue,
  lancerInstallation,
  marquerFenetreVue,
  surIphone,
} from './installation';

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
 * ELLE NE S'OUVRE QU'UNE FOIS, PUIS PLUS JAMAIS (24/09/2026). Le 9/09 on
 * l'avait fait revenir à chaque visite, avec une pastille à gauche quand on
 * répondait « Plus tard » : Siham la fermait dix fois par jour. La première
 * visite la montre, douze secondes après l'arrivée ; ensuite l'installation
 * reste à portée de main dans le bloc de l'accueil (`BlocInstaller`), et
 * nulle part ailleurs. Plus de pastille flottante.
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

/**
 * OÙ L'ON PROPOSE D'INSTALLER, ET OÙ L'ON SE TAIT.
 *
 * Sur Piloter, oui : c'est un outil de travail qu'on rouvre dix fois par jour,
 * l'icône sur l'écran d'accueil a du sens.
 *
 * Sur Les Extras, non, pour l'instant. La proposition a été retirée le temps de
 * revoir la question : une application web ne se télécharge pas comme un
 * logiciel, et la bannière promettait quelque chose qu'elle ne tenait pas.
 * Le texte Les Extras reste écrit juste en dessous, prêt à resservir le jour où
 * on la remet.
 */
function surPilote(hote: string) {
  return hote.startsWith('pilote.') || hote.includes('toulali');
}

/** Ce que le site s'appelle, là où on est. */
function marque(hote: string) {
  if (surPilote(hote)) {
    return {
      nom: 'Piloter',
      titre: "Installer l'application Piloter",
      texte: "Ton espace en un geste, depuis l'écran d'accueil.",
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
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState(() => marque(''));
  const [peutInstaller, setPeutInstaller] = useState(false);
  const [iphone, setIphone] = useState(false);

  useEffect(() => {
    const hote = window.location.hostname;
    setNom(marque(hote));
    // Retrait provisoire côté Les Extras. Piloter garde sa proposition.
    if (!surPilote(hote)) return;
    if (dejaInstallee() || fenetreDejaVue()) return;
    setIphone(surIphone());

    const suivre = () => setPeutInstaller(Boolean(evenementInstallation()));
    suivre();
    const desabonner = abonnerInstallation(() => {
      suivre();
      if (dejaInstallee()) setOuvert(false);
    });
    // Douze secondes : le temps d'arriver et de comprendre où l'on est.
    const attente = window.setTimeout(() => {
      if (dejaInstallee()) return;
      marquerFenetreVue();
      setOuvert(true);
    }, 12_000);
    return () => {
      desabonner();
      window.clearTimeout(attente);
    };
  }, []);

  if (!ouvert) return null;

  async function installer() {
    setOuvert(false);
    await lancerInstallation();
  }

  return (
    <div
      role="dialog"
      aria-label={nom.titre}
      className="fixed inset-x-3 bottom-[88px] z-50 mx-auto max-w-[460px] rounded-2xl border border-black/10 bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:bottom-3 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#4F46E5] text-white" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12M8 11l4 4 4-4M4 21h16" />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="text-base font-extrabold tracking-tight text-[#111]">{nom.titre}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-[#444]">
            {peutInstaller ? nom.texte : iphone ? 'Safari › Partager › « Sur l’écran d’accueil ».' : 'Menu du navigateur › « Installer ».'}
          </p>
          <p className="mt-1 text-xs text-[#777]">Toujours disponible ensuite depuis ton accueil.</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="rounded-xl border-2 border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#333] transition hover:border-black/25"
        >
          Fermer
        </button>
        {peutInstaller ? (
          <button
            type="button"
            onClick={installer}
            className="rounded-xl bg-[#4F46E5] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#4338CA]"
          >
            Installer
          </button>
        ) : null}
      </div>
    </div>
  );
}
