'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Etape } from './parcours';

/**
 * LA BARRE D'AVANCEMENT.
 *
 * Elle dit trois choses, et il faut les trois : où j'en suis, combien il reste,
 * et ce que la prochaine étape va demander. Une barre qui n'affiche qu'un
 * pourcentage laisse craindre un questionnaire sans fin.
 *
 * ⚠ SUR TÉLÉPHONE, on n'affiche PAS six pastilles serrées et illisibles : une
 * seule ligne « Étape 3 sur 6 » plus le titre courant. Le détail revient dès
 * qu'il y a la place.
 */
export function Progression({
  etapes,
  index,
}: {
  etapes: Etape[];
  index: number;
}) {
  const pourcent = Math.round(((index + 1) / etapes.length) * 100);

  return (
    <div className="mb-7">
      {/* Téléphone : le strict nécessaire. */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Étape {index + 1} sur {etapes.length}
          </p>
          <p className="text-xs text-muted-foreground">{pourcent} %</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pourcent}%` }}
          />
        </div>
      </div>

      {/* À partir du petit écran : la carte complète du parcours. */}
      <ol className="hidden sm:flex sm:items-center sm:gap-1.5">
        {etapes.map((e, i) => {
          const faite = i < index;
          const courante = i === index;
          return (
            <li key={e.cle} className="flex min-w-0 flex-1 items-center gap-1.5">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div
                  className={cn(
                    'h-1.5 rounded-full transition-colors duration-300',
                    faite || courante ? 'bg-primary' : 'bg-muted',
                  )}
                />
                <span
                  className={cn(
                    'flex items-center gap-1 truncate text-[11px] leading-tight',
                    courante
                      ? 'font-semibold text-foreground'
                      : faite
                        ? 'text-muted-foreground'
                        : 'text-muted-foreground/60',
                  )}
                >
                  {faite && <Check aria-hidden className="size-3 shrink-0 text-primary" />}
                  <span className="truncate">{e.titre}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
