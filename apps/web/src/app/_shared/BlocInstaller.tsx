'use client';

import { useEffect, useState } from 'react';
import { abonnerInstallation, dejaInstallee, evenementInstallation, lancerInstallation, surIphone } from './installation';

/**
 * LE BLOC « INSTALLER L'APPLICATION » DE L'ACCUEIL.
 *
 * La fenêtre ne s'ouvre qu'une fois ; ensuite c'est ici, et seulement ici,
 * que l'on installe. Le bloc disparaît de lui-même quand l'application est
 * installée ou ouverte depuis l'écran d'accueil.
 *
 * Les couleurs viennent de l'espace qui l'affiche (association en indigo,
 * académie en vert) : on passe la classe de carte et la teinte d'accent.
 */
const TEINTES = {
  association: { titre: 'text-[#1D1B5C]', texte: 'text-[#6B6A8A]', pastille: 'bg-[#ECEBFC] text-[#4F46E5]', bouton: 'bg-[#4F46E5] hover:bg-[#4338CA]' },
  academie: { titre: 'text-[#12312A]', texte: 'text-[#5E7A6E]', pastille: 'bg-[#E3F5EC] text-[#0F5F3E]', bouton: 'bg-[#1E9E6A] hover:bg-[#0F5F3E]' },
} as const;

export function BlocInstaller({ carte, espace }: { carte: string; espace: keyof typeof TEINTES }) {
  const [pret, setPret] = useState(false);
  const [installee, setInstallee] = useState(false);
  const [peutInstaller, setPeutInstaller] = useState(false);
  const [iphone, setIphone] = useState(false);

  useEffect(() => {
    const suivre = () => {
      setInstallee(dejaInstallee());
      setPeutInstaller(Boolean(evenementInstallation()));
    };
    setIphone(surIphone());
    suivre();
    setPret(true);
    return abonnerInstallation(suivre);
  }, []);

  // Rien avant l'hydratation (on ne sait pas encore si c'est installé), rien après l'installation.
  if (!pret || installee) return null;
  const t = TEINTES[espace];

  return (
    <div className={`${carte} flex items-center gap-4 p-5`}>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.pastille}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v12M8 11l4 4 4-4M4 21h16" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-extrabold ${t.titre}`}>L&apos;application Piloter</p>
        <p className={`text-sm ${t.texte}`}>
          {peutInstaller ? 'Sur ton écran d’accueil, en un geste.' : iphone ? 'Safari › Partager › « Sur l’écran d’accueil ».' : 'Menu du navigateur › « Installer ».'}
        </p>
      </div>
      {peutInstaller ? (
        <button
          type="button"
          onClick={() => void lancerInstallation()}
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white transition ${t.bouton}`}
        >
          Installer
        </button>
      ) : null}
    </div>
  );
}
