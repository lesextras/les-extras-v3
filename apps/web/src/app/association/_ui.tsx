import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * LA COQUE DE « PILOTER MON ASSOCIATION ».
 *
 * Un seul site, trois entrées : vérifier, le chemin, les outils. Pas de
 * connexion au premier lot : tout est public, tout est gratuit. La coque est
 * volontairement sobre pour que les pages, elles, parlent simplement.
 */

export const NOM_SITE = 'Piloter mon association';
export const ORIGINE_SITE = 'https://association.toulali.fr';

const NAV = [
  { href: '/verifier', libelle: 'Vérifier mon association' },
  { href: '/chemin', libelle: 'Le chemin' },
  { href: '/outils', libelle: 'Les outils' },
];

export function Coque({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F6F4EE] text-[#1E2A25]">
      <header className="border-b border-[#DDD8CC] bg-[#F6F4EE]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-4">
          <Link href="/" className="flex items-center gap-3 no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/association/marque.svg" alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
            <span className="flex flex-col leading-tight sm:flex-row sm:items-baseline sm:gap-2">
              <span className="text-lg font-semibold tracking-tight text-[#1E2A25]">{NOM_SITE}</span>
              <span className="text-xs uppercase tracking-[0.14em] text-[#5C6B63]">par Toulali</span>
            </span>
          </Link>
          <nav aria-label="Navigation principale" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-[#1E2A25] underline decoration-[#C9C3B5] underline-offset-4 hover:decoration-[#1F6A4E]"
              >
                {n.libelle}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-[1080px] px-5 py-10 sm:py-14">
        {children}
      </main>
      <footer className="mt-16 border-t border-[#DDD8CC]">
        <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-start justify-between gap-6 px-5 py-8 text-sm text-[#5C6B63]">
          <p className="max-w-[52ch] leading-relaxed">
            {NOM_SITE} est un outil de{' '}
            <a href="https://toulali.fr" className="underline underline-offset-4">
              Toulali
            </a>
            , centre de formation. Les données d&apos;identité des associations viennent des répertoires publics
            (RNA, SIRENE). Rien de ce que vous cherchez ici n&apos;est enregistré.
          </p>
          <p className="leading-relaxed">
            Gratuit, sans compte.
            <br />
            Référentiel des pièces daté, à jour au mieux de nos vérifications.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function Titre({ surtitre, children, sousTitre }: { surtitre?: string; children: ReactNode; sousTitre?: ReactNode }) {
  return (
    <div className="mb-8 max-w-[64ch]">
      {surtitre ? <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[#5C6B63]">{surtitre}</p> : null}
      <h1 className="text-3xl font-semibold leading-tight tracking-tight [text-wrap:balance] sm:text-4xl">{children}</h1>
      {sousTitre ? <p className="mt-4 text-lg leading-relaxed text-[#3E4A44]">{sousTitre}</p> : null}
    </div>
  );
}

export function Encart({ ton = 'neutre', children }: { ton?: 'neutre' | 'ok' | 'attention'; children: ReactNode }) {
  const styles =
    ton === 'ok'
      ? 'border-[#B9D6C6] bg-[#E4EFE8]'
      : ton === 'attention'
        ? 'border-[#E4C9A0] bg-[#F7EBD6]'
        : 'border-[#DDD8CC] bg-white';
  return <div className={`rounded-md border px-5 py-4 leading-relaxed ${styles}`}>{children}</div>;
}

export function Pastille({ ton, children }: { ton: 'ok' | 'attention' | 'neutre'; children: ReactNode }) {
  const styles =
    ton === 'ok'
      ? 'bg-[#1F6A4E] text-white'
      : ton === 'attention'
        ? 'bg-[#F7EBD6] text-[#7A4A0E] border border-[#E4C9A0]'
        : 'bg-white text-[#5C6B63] border border-[#DDD8CC]';
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide ${styles}`}>
      {children}
    </span>
  );
}

export function FormulaireRecherche({ valeur = '', autoFocus = false }: { valeur?: string; autoFocus?: boolean }) {
  return (
    <form method="get" action="/verifier" className="flex w-full max-w-[640px] flex-col gap-3 sm:flex-row">
      <label htmlFor="q" className="sr-only">
        Nom, sigle, numéro SIREN ou RNA de l&apos;association
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={valeur}
        autoFocus={autoFocus}
        minLength={3}
        required
        placeholder="Nom de l'association, SIREN ou numéro RNA (W…)"
        className="flex-1 rounded-md border border-[#C9C3B5] bg-white px-4 py-3 text-base text-[#1E2A25] placeholder:text-[#8A968F] focus:border-[#1F6A4E] focus:outline-none focus:ring-2 focus:ring-[#B9D6C6]"
      />
      <button
        type="submit"
        className="rounded-md bg-[#1F6A4E] px-5 py-3 text-base font-medium text-white hover:bg-[#185540] focus:outline-none focus:ring-2 focus:ring-[#B9D6C6]"
      >
        Vérifier
      </button>
    </form>
  );
}

export function Barre({ pourcentage }: { pourcentage: number }) {
  const p = Math.max(0, Math.min(100, pourcentage));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#E6E2D8]" role="img" aria-label={`${p} %`}>
      <div className="h-full rounded-full bg-[#1F6A4E]" style={{ width: `${p}%` }} />
    </div>
  );
}

export function formaterDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
