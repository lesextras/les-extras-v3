'use client';

// Encart d'aide contextuelle : disponible sous le fil d'Ariane sur chaque page
// connue du dictionnaire lib/page-help.
//
// REPLIÉE PAR DÉFAUT (12/08/2026). Elle s'ouvrait d'office sur chaque page :
// à la connexion, l'utilisateur recevait un pavé d'explication avant même
// d'avoir regardé son écran, et sur toutes les pages à la fois. Une aide qui
// s'impose n'est plus une aide, c'est du bruit — et on finit par la fermer
// sans la lire. Elle attend maintenant derrière son bouton « ? Aide », et
// s'ouvre pour qui la demande. Le choix reste mémorisé par page.
import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Info, X, HelpCircle } from 'lucide-react';
import { getPageHelp } from '@/lib/page-help';

const STORE_PREFIX = 'lex-aide-v1:';

export function PageHelp() {
  const pathname = usePathname() || '/';
  const match = getPageHelp(pathname);
  // null = pas encore lu localStorage (évite les écarts d'hydratation)
  const [visible, setVisible] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (!match) return;
    try {
      // Fermée sauf demande explicite : seul un « on » écrit par l'utilisateur
      // l'ouvre. L'ancienne logique ouvrait tout ce qui n'avait pas été fermé.
      setVisible(window.localStorage.getItem(STORE_PREFIX + match.key) === 'on');
    } catch {
      setVisible(false);
    }
  }, [match?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!match || visible === null) return null;
  const { key, aide } = match;

  function toggle(next: boolean) {
    setVisible(next);
    try {
      window.localStorage.setItem(STORE_PREFIX + key, next ? 'on' : 'off');
    } catch {
      /* stockage indisponible : l'état reste en mémoire */
    }
  }

  if (!visible) {
    return (
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => toggle(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          aria-label="Afficher l’aide de cette page"
        >
          <HelpCircle className="size-3.5" aria-hidden />
          Aide
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label={`Aide : ${aide.titre}`}
      className="mb-6 rounded-xl border border-primary/15 bg-primary/[0.04] p-4 md:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Info className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{aide.titre}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{aide.texte}</p>
          {aide.etapes && aide.etapes.length > 0 && (
            <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
              {aide.etapes.map((etape, i) => (
                <li key={i} className="flex items-baseline gap-2 text-xs text-foreground/75">
                  <span className="font-semibold text-primary">{i + 1}.</span>
                  {etape}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => toggle(false)}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
          aria-label="Masquer l’aide de cette page"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </aside>
  );
}
