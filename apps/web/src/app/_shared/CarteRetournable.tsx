'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * UNE CARTE DU CHEMIN QUI SE RETOURNE (01/10/2026).
 *
 * Recto : la carte telle qu'on la connaît. Verso : l'étape en trois lignes
 * (C'est quoi ? Pourquoi ? Comment ?), ce qu'elle débloque et « Ouvrir
 * l'étape ». Avec une souris, la carte se retourne au survol (après un court
 * instant, pour laisser le temps d'attraper la carte) et revient quand la
 * souris part. Sans survol (téléphone, tablette), le petit bouton « ↻ » la
 * retourne. Si le système demande moins d'animations, les faces s'échangent
 * sans rotation.
 *
 * Le glisser-déposer reste au parent : la carte se remet sur le recto dès
 * qu'on appuie dessus ou qu'on commence à la glisser.
 */
export interface VersoEtape {
  cestQuoi?: string;
  pourquoi?: string;
  comment?: string;
  debloque?: string[];
  href: string;
}

const DELAI_SURVOL = 250;

export function CarteRetournable({
  recto,
  verso,
  theme,
  titre,
  className = '',
}: {
  /**
   * Le recto. En fonction (depuis un composant client), il reçoit le bouton
   * « ↻ » à placer où il veut ; en simple contenu (depuis une page serveur, qui
   * ne peut pas passer de fonction), le bouton se pose en bas à droite.
   */
  recto: ReactNode | ((boutonRetourner: ReactNode) => ReactNode);
  verso: VersoEtape;
  theme: 'association' | 'academie';
  /** Le titre de l'étape, pour les libellés d'accessibilité. */
  titre: string;
  className?: string;
}) {
  const [retournee, setRetournee] = useState(false);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Une souris qui survole : la carte se retourne seule. Sinon, le bouton « ↻ ». */
  const [survolPossible, setSurvolPossible] = useState(false);

  useEffect(() => {
    const requete = window.matchMedia('(hover: hover) and (pointer: fine)');
    const lire = () => setSurvolPossible(requete.matches);
    lire();
    requete.addEventListener('change', lire);
    return () => {
      requete.removeEventListener('change', lire);
      if (minuterie.current) clearTimeout(minuterie.current);
    };
  }, []);

  const annuler = () => {
    if (minuterie.current) clearTimeout(minuterie.current);
    minuterie.current = null;
  };
  const surEntree = () => {
    if (!survolPossible) return;
    annuler();
    minuterie.current = setTimeout(() => setRetournee(true), DELAI_SURVOL);
  };
  const surSortie = () => {
    annuler();
    setRetournee(false);
  };
  const auRecto = () => {
    annuler();
    setRetournee(false);
  };

  const c =
    theme === 'association'
      ? { fond: 'bg-[#1D1B5C]', doux: 'text-[#C9C6F5]', puce: 'bg-[#F5B400] text-[#1D1B5C]', bouton: 'bg-[#F5B400] text-[#1D1B5C] hover:bg-[#FFC933]', bord: 'focus-visible:ring-[#4F46E5]' }
      : { fond: 'bg-[#0F3D2C]', doux: 'text-[#BFE6D2]', puce: 'bg-[#E3F5EC] text-[#0F5F3E]', bouton: 'bg-[#1E9E6A] text-white hover:bg-[#17845A]', bord: 'focus-visible:ring-[#1E9E6A]' };

  const bouton = (versLeVerso: boolean) => (
    <button
      type="button"
      draggable={false}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setRetournee(versLeVerso);
      }}
      aria-label={versLeVerso ? `Voir l’explication : ${titre}` : `Revenir à la carte : ${titre}`}
      className={`h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-bold focus:outline-none focus-visible:ring-2 ${c.bord} ${
        survolPossible ? 'hidden' : 'flex'
      } ${versLeVerso ? 'border-[#D9D6EE] bg-white text-[#6B6A8A]' : 'border-white/40 bg-white/10 text-white'}`}
    >
      ↻
    </button>
  );

  const lignes = [
    { q: "C'est quoi ?", r: verso.cestQuoi },
    { q: 'Pourquoi ?', r: verso.pourquoi },
    { q: 'Comment ?', r: verso.comment },
  ].filter((l): l is { q: string; r: string } => Boolean(l.r));

  return (
    <div
      className={`[perspective:1200px] ${className}`}
      onMouseEnter={surEntree}
      onMouseLeave={surSortie}
      onMouseDown={(e) => {
        // Un appui pour attraper la carte la remet au recto ; pas un clic sur un lien ou un bouton.
        if (!(e.target as HTMLElement).closest('a, button, select, input, label')) auRecto();
      }}
      onDragStart={auRecto}
    >
      <div
        className={`grid h-full transition-transform duration-500 ease-out [transform-style:preserve-3d] motion-reduce:transition-none ${
          retournee ? '[transform:rotateY(180deg)]' : ''
        }`}
      >
        {/* Recto */}
        <div className="relative [grid-area:1/1] [backface-visibility:hidden]" aria-hidden={retournee} inert={retournee}>
          {typeof recto === 'function' ? (
            recto(bouton(true))
          ) : (
            <>
              {recto}
              <span className="absolute bottom-2 right-2">{bouton(true)}</span>
            </>
          )}
        </div>

        {/* Verso */}
        <div
          className={`flex flex-col rounded-2xl p-3 text-white [grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)] ${c.fond}`}
          aria-hidden={!retournee}
          inert={!retournee}
        >
          <dl className="space-y-1.5 text-[13px] leading-snug">
            {lignes.map((l) => (
              <div key={l.q}>
                <dt className={`text-[11px] font-extrabold uppercase tracking-[0.08em] ${c.doux}`}>{l.q}</dt>
                <dd className="line-clamp-2">{l.r}</dd>
              </div>
            ))}
          </dl>
          {verso.debloque?.length ? (
            <p className="mt-2 flex flex-wrap items-center gap-1 text-[11px]">
              <span className={`font-bold ${c.doux}`}>Débloque :</span>
              {verso.debloque.slice(0, 3).map((d) => (
                <span key={d} className={`rounded-full px-1.5 py-px font-bold ${c.puce}`}>
                  {d}
                </span>
              ))}
            </p>
          ) : null}
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <Link
              href={verso.href}
              draggable={false}
              className={`inline-flex rounded-lg px-3 py-1.5 text-sm font-bold no-underline focus:outline-none focus-visible:ring-2 ${c.bouton} ${c.bord}`}
            >
              Ouvrir l&apos;étape →
            </Link>
            {bouton(false)}
          </div>
        </div>
      </div>
    </div>
  );
}
