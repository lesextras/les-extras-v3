import Link from 'next/link';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

/**
 * LA COQUE DE L'ADMINISTRATION.
 *
 * Sombre, dense, sans fioriture : ce n'est pas un espace où l'on travaille des
 * heures, c'est un poste où l'on vérifie et où l'on corrige. Le contraste avec
 * les deux espaces est voulu — on sait tout de suite où l'on est.
 */
export default function AdministrationLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0C0B1A] text-[#C9C7E8]" style={{ fontFamily: 'var(--font-pilote), system-ui, sans-serif' }}>
      <header className="border-b border-[#252344]">
        <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4F46E5] text-sm font-extrabold text-white" aria-hidden="true">
              A
            </span>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#8F8CB8]">Piloter</p>
              <p className="text-lg font-extrabold leading-tight tracking-tight text-white">L&apos;administration</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Link href="/" className="rounded-xl border border-[#312F55] px-4 py-2 text-sm font-bold text-[#C9C7E8] no-underline transition hover:border-[#4F46E5]">
              La plateforme
            </Link>
            <Link href="/espace" className="rounded-xl border border-[#312F55] px-4 py-2 text-sm font-bold text-[#C9C7E8] no-underline transition hover:border-[#4F46E5]">
              Mon espace
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-8">{children}</main>
      <footer className="mx-auto w-full max-w-[1180px] px-4 pb-10 text-sm leading-relaxed text-[#6B6890] sm:px-8">
        Rien ne se supprime depuis cet écran : on corrige, on suspend, on rend l&apos;accès. Une suppression se fait dans
        l&apos;espace concerné, par la personne qui le porte.
      </footer>
    </div>
  );
}
