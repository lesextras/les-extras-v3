'use client';

// L'ATTENTE PENDANT QUE LEX ÉCRIT.
//
// Une génération prend cinq à vingt secondes. Jusqu'ici, seul le bouton
// changeait de libellé : rien ne bougeait à l'écran, et un écran qui ne bouge
// pas ressemble à un écran en panne. On recliquait, ou on quittait la page —
// en emportant l'idée que « ça ne marche pas ».
//
// Ce panneau montre le travail réel, dans son ordre réel : la pseudonymisation
// a bien lieu AVANT l'envoi au moteur, et les vrais prénoms sont rétablis APRÈS,
// ici, sur nos serveurs. Les étapes ne sont donc pas un habillage : elles
// décrivent ce qui se passe, et c'est ce qui les rend rassurantes.

import * as React from 'react';
import { Sparkles, Check } from 'lucide-react';

/** Les temps de la génération, dans l'ordre où ils ont lieu. */
const ETAPES = [
  'Je masque les prénoms, les dates et les coordonnées',
  'Je relis vos notes',
  'Je construis le plan',
  'J’écris le brouillon',
  'Je rétablis les vrais prénoms, ici',
] as const;

/** Cadence d'avancement. La dernière étape reste affichée jusqu'au résultat. */
const RYTHME_MS = 2600;

export function LexTravaille({
  titre = 'LEX rédige…',
  etapes = ETAPES,
  className,
}: {
  titre?: string;
  etapes?: readonly string[];
  className?: string;
}) {
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    // On n'atteint jamais la fin tout seul : si le moteur met plus longtemps
    // que prévu, la dernière étape continue de battre plutôt que d'annoncer
    // une fin qui n'est pas arrivée. Promettre « terminé » avant le résultat
    // serait pire que de faire attendre.
    const t = setInterval(() => setI((n) => Math.min(n + 1, etapes.length - 1)), RYTHME_MS);
    return () => clearInterval(t);
  }, [etapes.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`rounded-2xl border border-primary/25 bg-primary/[0.04] p-5 md:p-6 ${className ?? ''}`}
    >
      <div className="flex items-center gap-3">
        <span className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <span className="absolute inset-0 rounded-xl bg-primary/25 animate-anneau" aria-hidden />
          <Sparkles className="relative size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{titre}</p>
          <p className="text-sm text-muted-foreground">
            Une quinzaine de secondes. Ne fermez pas la page.
          </p>
        </div>
      </div>

      <ol className="mt-5 space-y-2">
        {etapes.map((e, n) => {
          const faite = n < i;
          const encours = n === i;
          return (
            <li
              key={e}
              className={`flex items-center gap-2.5 text-sm transition-colors duration-300 ${
                faite ? 'text-muted-foreground' : encours ? 'text-foreground' : 'text-muted-foreground/50'
              }`}
            >
              <span className="grid size-4 shrink-0 place-items-center">
                {faite ? (
                  <Check className="size-4 text-success" aria-hidden />
                ) : encours ? (
                  <span className="size-2 rounded-full bg-primary animate-pulse" aria-hidden />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted-foreground/30" aria-hidden />
                )}
              </span>
              <span className={encours ? 'font-medium' : undefined}>{e}</span>
            </li>
          );
        })}
      </ol>

      {/* Le texte qui s'écrit : trois lignes qui pulsent, de largeurs
          différentes pour évoquer un paragraphe et non un bloc de chargement. */}
      <div className="mt-5 space-y-2" aria-hidden>
        <div className="h-3 w-full animate-pulse rounded bg-primary/10" />
        <div className="h-3 w-11/12 animate-pulse rounded bg-primary/10 [animation-delay:150ms]" />
        <div className="h-3 w-3/5 animate-pulse rounded bg-primary/10 [animation-delay:300ms]" />
      </div>
    </div>
  );
}
