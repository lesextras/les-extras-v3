'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, X, LayoutDashboard, CircleUserRound } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { BasculeTheme } from '@/app/_shared/BasculeTheme';
import { useVisiteur } from '@/app/_shared/Visiteur';

// Ordre = ordre de la strategie : l'atelier et la formation sont les produits
// d'appel, le renfort vient ensuite.
const links = [
  { label: 'Ateliers', href: '/ateliers' },
  { label: 'Formations', href: '/formations' },
  { label: 'RenforTeam', href: '/renforteam' },
  { label: 'Le GAP', href: '/gap' },
  { label: 'Édublog', href: '/edublog' },
  // « Tarifs » et « Aide » ont quitté la barre le 5/8/2026 (demande Siham).
  // Sept entrées, c'était trop : les produits — ce qu'on est venu chercher —
  // se disputaient la place avec deux pages de réassurance. Elles n'ont pas
  // disparu : elles ont chacune leur section sur la page d'accueil (#tarifs
  // et #aide), et restent dans le pied de page, qui est exactement l'endroit
  // où on va les chercher.
];

export interface UtilisateurEnTete {
  prenom?: string | null;
  compte?: string | null;
}

/**
 * En-tête public.
 *
 * Il affichait « Se connecter / Créer un compte » en toutes circonstances,
 * y compris à quelqu'un déjà connecté qui venait du tableau de bord : la
 * session était pourtant intacte, mais l'en-tête ne la lisait pas. Résultat,
 * on croyait avoir été déconnecté en consultant le catalogue.
 *
 * DEPUIS LE 20/08/2026, la session n'est PLUS lue pendant le rendu serveur.
 * Elle l'était uniquement pour cet en-tête, et cette seule lecture de cookie
 * rendait toutes les pages publiques personnalisées, donc non cachables
 * (`cache-control: no-store`) — 0,44 s à 0,90 s de temps de réponse sur chaque
 * visite. Voir `app/api/visiteur/route.ts`.
 *
 * L'état arrive maintenant du navigateur, après l'affichage. Tant qu'il n'est
 * pas connu, on n'affiche NI le prénom NI « Se connecter » : la place est
 * réservée, rien ne clignote, et personne ne lit une information fausse
 * pendant 200 ms. Le prop `utilisateur` reste accepté pour les rendus qui
 * connaissent déjà la réponse (tests, aperçus) et court-circuite l'attente.
 */
export function SiteHeader({ utilisateur }: { utilisateur?: UtilisateurEnTete | null }) {
  const [open, setOpen] = React.useState(false);
  const visiteur = useVisiteur();
  // `null` = on ne sait pas encore. Le troisième état est ce qui évite le
  // clignotement : `undefined` ≠ `false`.
  const connecte: boolean | null = utilisateur
    ? true
    : visiteur === null
      ? null
      : visiteur.connecte;
  const compte = utilisateur?.compte ?? visiteur?.compte ?? null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-6">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex min-h-10 items-center rounded-lg px-3.5 py-2 text-[15.5px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <BasculeTheme />
          {connecte === null ? (
            // Réserve de place pendant qu'on interroge /api/visiteur : la barre
            // ne doit pas se réorganiser sous le curseur au bout de 200 ms.
            <div className="h-9 w-[168px]" aria-hidden />
          ) : connecte ? (
            <>
              {compte && (
                // L'icône rend le nom identifiable comme « le compte connecté »
                // plutôt que comme un mot posé là. `shrink-0` la protège :
                // sans ça, un nom d'établissement long l'écraserait avant de
                // se tronquer lui-même.
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CircleUserRound className="size-4 shrink-0" aria-hidden />
                  <span className="max-w-[200px] truncate">{compte}</span>
                </span>
              )}
              <Button asChild size="sm">
                <Link href="/dashboard">
                  <LayoutDashboard />
                  Mon espace
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Créer un compte</Link>
              </Button>
            </>
          )}
        </div>

        {/* Sur mobile la bascule reste hors du menu : on change d'ambiance sans
            avoir à déplier quoi que ce soit. */}
        <div className="flex items-center gap-1 md:hidden">
          <BasculeTheme />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2.5 text-foreground"
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-[1200px] flex-col gap-1 px-6 py-4">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-foreground hover:bg-accent"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {connecte === null ? (
                <div className="h-10" aria-hidden />
              ) : connecte ? (
                <Button asChild>
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    <LayoutDashboard />
                    Mon espace
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link href="/login">Se connecter</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Créer un compte</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
