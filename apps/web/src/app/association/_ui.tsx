import Link from 'next/link';
import type { ReactNode } from 'react';
import { BarreHaut, BarreLaterale, type CompteAffiche } from './BarreLaterale';

/**
 * LA COQUE DE « PILOTER MON ASSOCIATION ».
 *
 * Une interface d'outil, pas un site : une barre latérale à gauche avec les
 * grandes entrées, le contenu à droite en cartes blanches sur fond doux. Les
 * associations connaissent déjà cette disposition : on garde leurs habitudes.
 *
 * Palette : fond lavande #F5F4FC, encre marine #1D1B5C, texte #3B3A66,
 * sourdine #6B6A8A, accent indigo #4F46E5 (foncé #4338CA, clair #ECEBFC),
 * bordure #E6E4F3, jaune #F5B400, vert #1E9E6A / #E3F5EC, ambre #B45309 /
 * #FEF3E2. TROISIÈME COULEUR DU SITE : le rouge rosé #C42B57 (plein
 * #D6335C, foncé #8A1B3D, clair #FDE7EC, bordure #F3B0C2) — il porte le mot
 * mis en valeur dans les titres, ce qui presse, et l'argent.
 */

export const NOM_SITE = 'Cockpit associatif';
export const ORIGINE_SITE = 'https://association.toulali.fr';

/* --------------------------------------------------------------- classes */

export const CHAMP =
  'w-full rounded-xl border border-[#D9D6EE] bg-white px-4 py-3 text-base text-[#1D1B5C] placeholder:text-[#9A99B5] focus:border-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC]';
export const BTN_PRIMAIRE =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#4F46E5] px-5 py-3 text-base font-bold text-white no-underline shadow-sm transition hover:bg-[#4338CA] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC] disabled:opacity-60';
export const BTN_SECONDAIRE =
  'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#D9D6EE] bg-white px-5 py-[10px] text-base font-bold text-[#1D1B5C] no-underline transition hover:border-[#4F46E5] hover:text-[#4F46E5] focus:outline-none focus:ring-4 focus:ring-[#ECEBFC] disabled:opacity-60';
export const BTN_DISCRET =
  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-[#4F46E5] no-underline hover:bg-[#ECEBFC]';
export const CARTE = 'rounded-2xl border border-[#E6E4F3] bg-white shadow-[0_1px_2px_rgba(29,27,92,0.04)]';
/** La même carte, qui se soulève un peu au survol : pour ce qui se clique ou se déplie. */
export const CARTE_VIVE = `${CARTE} transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#C7C4F2] hover:shadow-[0_10px_28px_rgba(29,27,92,0.09)] motion-reduce:transition-none motion-reduce:hover:translate-y-0`;

/* ------------------------------------------------------------------ coque */

export function Coque({ children, compte }: { children: ReactNode; compte: CompteAffiche | null }) {
  return (
    <div className="min-h-screen bg-[#F5F4FC] text-[#3B3A66]" style={{ fontFamily: 'var(--font-pilote), system-ui, sans-serif' }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Aller au contenu
      </a>
      <div className="lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
        <BarreLaterale compte={compte} />
        <div className="min-w-0">
          <BarreHaut compte={compte} />
          <main id="main" className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-8 sm:py-8">
            {children}
          </main>
          <footer className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-6 text-sm text-[#6B6A8A] sm:px-8">
            <p className="max-w-[70ch] leading-relaxed">
              {NOM_SITE} est un outil de l&apos;association ADéPA, avec{' '}
              <a href="https://toulali.fr" className="font-bold text-[#4F46E5] underline underline-offset-4">
                Toulali
              </a>
              , son centre de formation. Les informations sur les associations viennent des répertoires publics (RNA,
              SIRENE). Gratuit, pour toutes les associations, pendant que l&apos;outil se construit.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- typographie */

/** Un mot mis en valeur dans un titre : italique serif, en rouge rosé. */
export function Accent({ children }: { children: ReactNode }) {
  return (
    <em
      className="text-[#C42B57]"
      style={{ fontFamily: 'var(--font-pilote-serif), Georgia, serif', fontStyle: 'italic', fontWeight: 600 }}
    >
      {children}
    </em>
  );
}

export function Titre({
  surtitre,
  children,
  sousTitre,
  actions,
}: {
  surtitre?: string;
  children: ReactNode;
  sousTitre?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-[64ch]">
        {surtitre ? <p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-[#6B6A8A]">{surtitre}</p> : null}
        <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-4xl">
          {children}
        </h1>
        {sousTitre ? <p className="mt-3 text-lg leading-relaxed text-[#3B3A66]">{sousTitre}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SousTitre({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mb-4 text-xl font-extrabold tracking-tight text-[#1D1B5C] sm:text-2xl">
      {children}
    </h2>
  );
}

/* ------------------------------------------------------------------ cartes */

export function Carte({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`${CARTE} p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function Encart({ ton = 'neutre', children }: { ton?: 'neutre' | 'ok' | 'attention' | 'alerte' | 'info'; children: ReactNode }) {
  const styles =
    ton === 'ok'
      ? 'border-[#BFE6D2] bg-[#E3F5EC] text-[#0F5F3E]'
      : ton === 'attention'
        ? 'border-[#F5D6A8] bg-[#FEF3E2] text-[#7C3E06]'
        : ton === 'alerte'
          ? 'border-[#F3B0C2] bg-[#FDE7EC] text-[#8A1B3D]'
          : ton === 'info'
            ? 'border-[#C7C4F2] bg-[#ECEBFC] text-[#1D1B5C]'
            : 'border-[#E6E4F3] bg-white text-[#3B3A66]';
  return <div className={`rounded-2xl border px-5 py-4 leading-relaxed ${styles}`}>{children}</div>;
}

export function Pastille({ ton, children }: { ton: 'ok' | 'attention' | 'alerte' | 'neutre' | 'accent'; children: ReactNode }) {
  const styles =
    ton === 'ok'
      ? 'bg-[#E3F5EC] text-[#0F5F3E]'
      : ton === 'attention'
        ? 'bg-[#FEF3E2] text-[#7C3E06]'
        : ton === 'alerte'
          ? 'bg-[#FDE7EC] text-[#8A1B3D]'
          : ton === 'accent'
            ? 'bg-[#ECEBFC] text-[#4338CA]'
            : 'bg-[#F0EFF7] text-[#6B6A8A]';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${styles}`}>{children}</span>;
}

/** Une grosse tuile chiffrée, comme sur un tableau de bord. */
export function Tuile({
  libelle,
  valeur,
  detail,
  ton = 'neutre',
  href,
}: {
  libelle: string;
  valeur: ReactNode;
  detail?: ReactNode;
  ton?: 'neutre' | 'ok' | 'attention' | 'alerte';
  href?: string;
}) {
  const couleur =
    ton === 'ok' ? 'text-[#1E9E6A]' : ton === 'attention' ? 'text-[#B45309]' : ton === 'alerte' ? 'text-[#C42B57]' : 'text-[#1D1B5C]';
  const contenu = (
    <>
      <p className="text-sm font-bold text-[#6B6A8A]">{libelle}</p>
      <p className={`mt-1 text-3xl font-extrabold tabular-nums ${couleur}`}>{valeur}</p>
      {detail ? <p className="mt-1 text-sm text-[#6B6A8A]">{detail}</p> : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={`${CARTE_VIVE} block p-5 no-underline`}>
        {contenu}
      </Link>
    );
  }
  return <div className={`${CARTE} p-5`}>{contenu}</div>;
}

/** Le fil d'étapes numérotées (1 › 2 › 3), comme dans un parcours d'inscription. */
export function FilEtapes({ total, courante }: { total: number; courante: number }) {
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-2" aria-label="Progression">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <li key={n} className="flex items-center gap-2">
          <span
            className={
              n < courante
                ? 'flex h-8 w-8 items-center justify-center rounded-full bg-[#1D1B5C] text-sm font-bold text-white'
                : n === courante
                  ? 'flex h-8 min-w-[2.75rem] items-center justify-center rounded-full border-2 border-[#4F46E5] px-3 text-sm font-bold text-[#4F46E5]'
                  : 'flex h-8 w-8 items-center justify-center rounded-full border border-[#C7C4F2] text-sm font-bold text-[#6B6A8A]'
            }
            aria-current={n === courante ? 'step' : undefined}
          >
            {n < courante ? '✓' : n}
          </span>
          {n < total ? <span className="text-[#9A99B5]">›</span> : null}
        </li>
      ))}
    </ol>
  );
}

export function Barre({ pourcentage, ton = 'accent' }: { pourcentage: number; ton?: 'accent' | 'ok' }) {
  const p = Math.max(0, Math.min(100, pourcentage));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#ECEBFC]" role="img" aria-label={`${p} %`}>
      <div className={`h-full rounded-full ${ton === 'ok' ? 'bg-[#1E9E6A]' : 'bg-[#4F46E5]'}`} style={{ width: `${p}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------- formulaires */

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
        placeholder="Le nom de ton association, son SIREN ou son numéro W…"
        className={`flex-1 ${CHAMP}`}
      />
      <button type="submit" className={BTN_PRIMAIRE}>
        Vérifier
      </button>
    </form>
  );
}

export function formaterDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
