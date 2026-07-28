'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

// Ordre = ordre de la strategie : l'atelier et la formation sont les produits
// d'appel, le renfort vient ensuite.
const links = [
  { label: 'Ateliers', href: '/ateliers' },
  { label: 'Formations', href: '/formations' },
  { label: 'Intervenants', href: '/intervenants' },
  { label: 'SOS Renfort', href: '/#renfort' },
  { label: 'Entraide', href: '/entraide' },
  { label: 'Édublog', href: '/edublog' },
  { label: 'Comment ça marche', href: '/#comment' },
];

/** En-tête public sticky avec navigation d'ancres et CTA connexion/inscription. */
export function SiteHeader() {
  const [open, setOpen] = React.useState(false);

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
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Se connecter</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Créer un compte</Link>
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2.5 text-foreground md:hidden"
          aria-label="Menu"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
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
              <Button asChild variant="outline">
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Créer un compte</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
