export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { ShieldCheck, Siren, GraduationCap, Star } from 'lucide-react';
import { Logo } from '@/components/brand/logo';

/**
 * Layout des pages d'authentification : panneau de marque à gauche (desktop),
 * formulaire centré à droite.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Panneau de marque */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-[hsl(182_80%_20%)] p-12 text-primary-foreground lg:flex lg:flex-col">
        <div className="absolute inset-0 bg-grid opacity-10" aria-hidden />
        <div
          className="absolute -right-24 top-1/4 size-80 rounded-full bg-secondary/25 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -bottom-24 -left-16 size-72 rounded-full bg-primary-foreground/10 blur-3xl"
          aria-hidden
        />
        <div className="relative">
          <Link href="/" className="inline-flex">
            <span className="inline-flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-primary-foreground/15 text-[11px] font-bold tracking-wide">
                LEX
              </span>
              <span className="text-[15px] font-bold tracking-tight">LES EXTRAS</span>
            </span>
          </Link>
        </div>

        <div className="relative my-auto max-w-md">
          <h2 className="text-3xl font-bold leading-tight text-white text-balance drop-shadow-sm">
            Le renfort médico-social, réuni au même endroit.
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            SOS Renfort, ateliers, planning, messagerie et factures. Un espace clair pour les
            établissements et les professionnels indépendants.
          </p>

          <ul className="mt-10 space-y-4">
            {[
              { icon: Siren, text: 'Missions urgentes diffusées intelligemment' },
              { icon: GraduationCap, text: 'Catalogue d’ateliers clé en main' },
              { icon: ShieldCheck, text: 'Profils et documents vérifiés' },
            ].map((item) => (
              <li
                key={item.text}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-primary-foreground/[0.07]"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-primary-foreground/15 ring-1 ring-inset ring-primary-foreground/10">
                  <item.icon className="size-5" />
                </span>
                <span className="text-sm font-medium">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-3 rounded-2xl bg-primary-foreground/10 p-4 ring-1 ring-inset ring-primary-foreground/10 backdrop-blur-sm">
          <span className="grid size-10 place-items-center rounded-xl bg-primary-foreground/15 text-warning">
            <Star className="size-5 fill-current" />
          </span>
          <div>
            <p className="text-sm font-semibold">Formations certifiées Qualiopi</p>
            <p className="text-xs text-primary-foreground/70">
              Certification portée par l’association ADéPA — finançables OPCO
            </p>
          </div>
        </div>
      </aside>

      {/* Zone formulaire */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Logo />
        </div>
        <main id="main" className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">{children}</div>
        </main>
      </div>
    </div>
  );
}
