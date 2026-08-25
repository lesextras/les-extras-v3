'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Petit « i » cliquable qui affiche une explication courte à côté d'un
 * libellé de champ. Volontairement au clic (pas au survol) : ça marche pareil
 * à la souris et au doigt, et ça évite les bulles qui s'ouvrent toutes seules
 * en balayant le formulaire — même logique que <DropdownMenu> (clic
 * extérieur + Échap pour fermer), sans dépendance supplémentaire.
 *
 * LA BULLE EST SORTIE DU FLUX (25/08/2026).
 *
 * Elle était posée en `absolute` dans le menu de gauche. Or ce menu est étroit
 * et ouvre son propre contexte d'empilement : la bulle, plus large que lui,
 * passait sous le contenu de la page et se lisait à moitié. On la rend donc
 * dans un portail sur `document.body`, en position fixe calculée depuis le
 * bouton — elle n'a plus de parent qui puisse la rogner.
 */
export interface InfoHintProps {
  /** Texte explicatif, une à deux phrases. */
  children: React.ReactNode;
  className?: string;
}

/** Largeur de la bulle, en pixels. Sert au calcul de position. */
const LARGEUR = 260;
/** Marge minimale avec les bords de la fenêtre. */
const MARGE = 8;

export function InfoHint({ children, className }: InfoHintProps) {
  const [open, setOpen] = React.useState(false);
  const [place, setPlace] = React.useState<{ top: number; left: number } | null>(null);
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const bulleRef = React.useRef<HTMLSpanElement>(null);
  const boutonRef = React.useRef<HTMLButtonElement>(null);
  const bulleId = React.useId();

  /**
   * Où poser la bulle : au-dessus du « i » si la place existe, sinon dessous.
   * Le calcul est refait à chaque ouverture, et pendant qu'elle est ouverte au
   * défilement — une bulle qui reste accrochée à un ancien point est pire
   * qu'une bulle absente.
   */
  const placer = React.useCallback(() => {
    const b = boutonRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const hauteur = bulleRef.current?.offsetHeight ?? 72;
    const dessus = r.top - hauteur - 8;
    const top = dessus >= MARGE ? dessus : r.bottom + 8;
    const brut = r.left + r.width / 2 - LARGEUR / 2;
    const left = Math.min(
      Math.max(MARGE, brut),
      Math.max(MARGE, window.innerWidth - LARGEUR - MARGE),
    );
    setPlace({ top, left });
  }, []);

  React.useLayoutEffect(() => {
    if (open) placer();
  }, [open, placer]);

  React.useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      const cible = e.target as Node;
      if (rootRef.current?.contains(cible)) return;
      if (bulleRef.current?.contains(cible)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    function onBouge() {
      placer();
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onBouge, true);
    window.addEventListener('resize', onBouge);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onBouge, true);
      window.removeEventListener('resize', onBouge);
    };
  }, [open, placer]);

  const bulle =
    open && typeof document !== 'undefined'
      ? createPortal(
          <span
            ref={bulleRef}
            id={bulleId}
            role="tooltip"
            style={{
              position: 'fixed',
              top: place?.top ?? -9999,
              left: place?.left ?? -9999,
              width: LARGEUR,
            }}
            className="z-[200] block rounded-lg border border-border bg-card px-3 py-2 text-xs font-normal normal-case leading-snug text-foreground shadow-soft"
          >
            {children}
          </span>,
          document.body,
        )
      : null;

  return (
    <span ref={rootRef} className={cn('relative inline-flex shrink-0', className)}>
      <button
        ref={boutonRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-expanded={open}
        aria-describedby={open ? bulleId : undefined}
        aria-label="Plus d’informations sur ce champ"
        className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground/70 outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="size-3.5" aria-hidden />
      </button>
      {bulle}
    </span>
  );
}
