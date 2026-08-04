'use client';

import * as React from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Petit « i » cliquable qui affiche une explication courte à côté d'un
 * libellé de champ. Volontairement au clic (pas au survol) : ça marche pareil
 * à la souris et au doigt, et ça évite les bulles qui s'ouvrent toutes seules
 * en balayant le formulaire — même logique que <DropdownMenu> (clic
 * extérieur + Échap pour fermer), sans dépendance supplémentaire.
 */
export interface InfoHintProps {
  /** Texte explicatif, une à deux phrases. */
  children: React.ReactNode;
  className?: string;
}

export function InfoHint({ children, className }: InfoHintProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const bulleId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <span ref={rootRef} className={cn('relative inline-flex shrink-0', className)}>
      <button
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
      {open && (
        <span
          id={bulleId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-1.5 w-60 -translate-x-1/2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-normal normal-case leading-snug text-foreground shadow-soft"
        >
          {children}
        </span>
      )}
    </span>
  );
}
