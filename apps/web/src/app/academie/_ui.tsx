import Link from 'next/link';
import type { ReactNode } from 'react';
import { BarreHaut, BarreLaterale, type CompteAffiche } from './BarreLaterale';
import { BotAide } from '../_shared/BotAide';

/**
 * LA COQUE DE « PILOTER MON ACADÉMIE ».
 *
 * La même disposition que l'espace association — barre latérale sombre à
 * gauche, cartes blanches à droite — parce que c'est le même produit et qu'une
 * personne qui porte les deux ne doit pas réapprendre.
 *
 * Ce qui change, c'est la couleur : l'association est indigo, l'académie est
 * VERTE (#1E9E6A plein, #17845A au survol, #E3F5EC clair, #B7E4CE bordure,
 * #0F5F3E foncé). Le rouge rosé #C42B57 reste la couleur de marque de la
 * plateforme : il porte le mot mis en valeur dans les titres, dans les deux
 * espaces.
 */

export const NOM_SITE = 'Piloter mon académie';
export const ORIGINE_SITE = 'https://pilote.toulali.fr';
export const RACINE = '/academie';

/* --------------------------------------------------------------- classes */

export const CHAMP =
  'w-full rounded-xl border border-[#CFE4D9] bg-white px-4 py-3 text-base text-[#12312A] placeholder:text-[#8FA79B] focus:border-[#1E9E6A] focus:outline-none focus:ring-4 focus:ring-[#E3F5EC]';
export const BTN_PRIMAIRE =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#1E9E6A] px-5 py-3 text-base font-bold text-white no-underline shadow-sm transition hover:bg-[#17845A] focus:outline-none focus:ring-4 focus:ring-[#E3F5EC] disabled:opacity-60';
export const BTN_SECONDAIRE =
  'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#CFE4D9] bg-white px-5 py-[10px] text-base font-bold text-[#12312A] no-underline transition hover:border-[#1E9E6A] hover:text-[#0F5F3E] focus:outline-none focus:ring-4 focus:ring-[#E3F5EC] disabled:opacity-60';
export const BTN_DISCRET =
  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-[#0F5F3E] no-underline hover:bg-[#E3F5EC]';
export const CARTE = 'rounded-2xl border border-[#DDEBE4] bg-white shadow-[0_1px_2px_rgba(15,95,62,0.05)]';
/** La même carte, qui se soulève un peu au survol : pour ce qui se clique. */
export const CARTE_VIVE = `${CARTE} transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#B7E4CE] hover:shadow-[0_10px_28px_rgba(15,95,62,0.10)] motion-reduce:transition-none motion-reduce:hover:translate-y-0`;

/* --------------------------------------------------------------- mouvement */

/**
 * LE MOUVEMENT DE LA PLATEFORME.
 *
 * Une seule animation, réutilisée partout : le contenu monte de dix pixels en
 * apparaissant. Elle se joue une fois, à l'ouverture ; elle ne dépend d'aucun
 * défilement, donc rien ne reste invisible si le JavaScript ne part pas. Et
 * elle se tait entièrement pour qui a demandé moins d'animations.
 */
export const MOUVEMENT = `
@keyframes piloteMonte { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.monte { animation: piloteMonte .45s cubic-bezier(.22,1,.36,1) both; }
.monte-1 { animation-delay: .04s; } .monte-2 { animation-delay: .08s; } .monte-3 { animation-delay: .12s; }
.monte-4 { animation-delay: .16s; } .monte-5 { animation-delay: .2s; } .monte-6 { animation-delay: .24s; }
@media (prefers-reduced-motion: reduce) { .monte, .monte-1, .monte-2, .monte-3, .monte-4, .monte-5, .monte-6 { animation: none; } }
`;

/* ------------------------------------------------------------------ coque */

export function Coque({
  children,
  compte,
  mentions = false,
}: {
  children: ReactNode;
  compte: CompteAffiche | null;
  /** Le pied de page légal ne s'affiche que sur le tableau de bord, le chemin et le profil. */
  mentions?: boolean;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F2F7F5] text-[#334A42]" style={{ fontFamily: 'var(--font-pilote), system-ui, sans-serif' }}>
      <style dangerouslySetInnerHTML={{ __html: MOUVEMENT }} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Aller au contenu
      </a>
      <div className="lg:grid lg:grid-cols-[282px_minmax(0,1fr)]">
        <BarreLaterale compte={compte} />
        <div className="min-w-0">
          <BarreHaut compte={compte} />
          {/* ⚠ PAS DE `.monte` ICI : son `transform` faisait de <main> le bloc de
              référence de tout `position: fixed` écrit dedans, et les fenêtres
              se retrouvaient enfermées dans la colonne. Les blocs de contenu
              gardent leur propre `monte-1..6`. Voir `_ecole/Portail.tsx`. */}
          <main id="main" className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-8 sm:py-8">
            {children}
          </main>
          {mentions ? (
            <footer className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-6 text-sm text-[#5E7A6E] sm:px-8">
              <p className="max-w-[70ch] leading-relaxed">
                {NOM_SITE} est un outil de{' '}
                <a href="https://toulali.fr" className="font-bold text-[#0F5F3E] underline underline-offset-4">
                  Toulali
                </a>
                , centre de formation. Le référentiel qualité affiché est le référentiel national qualité (Qualiopi) ;
                cet outil ne délivre aucune certification. Gratuit, pendant que l&apos;outil se construit.
              </p>
              <p className="mt-2 max-w-[70ch] leading-relaxed">
                Le dispositif est porté par l&apos;association{' '}
                <a href="https://adepa77.fr/" target="_blank" rel="noopener noreferrer" className="font-bold text-[#C42B57] underline underline-offset-4">
                  ADéPA
                </a>{' '}
               , un don la soutient, et ouvre droit à un reçu fiscal.
              </p>
            </footer>
          ) : null}
        </div>
      </div>
      <BotAide espace="academie" />
    </div>
  );
}

/* ------------------------------------------------------- titres de section */

/**
 * LES PICTOGRAMMES DES TITRES DE SECTION.
 *
 * Un trait, jamais un aplat : le dessin reste lisible en petit et prend la
 * couleur du texte. Le jeu est volontairement court — un écran qui a besoin
 * de douze icônes différentes a surtout besoin d'être découpé autrement.
 */
const TRACES: Record<string, string> = {
  equipe: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6M22 19v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  enveloppe: 'M3 6h18v12H3zM3 7l9 6 9-6',
  agenda: 'M3 5h18v16H3zM3 9h18M8 3v4M16 3v4',
  lieu: 'M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  euro: 'M17 5.5A6.5 6.5 0 0 0 7.2 12 6.5 6.5 0 0 0 17 18.5M4 10h8M4 14h8',
  document: 'M6 2h8l5 5v15H6zM14 2v5h5M9 13h7M9 17h7',
  reglages: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H2a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 3.6 7.9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H8a1.6 1.6 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V8a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z',
  page: 'M4 4h16v16H4zM4 9h16M9 9v11',
  vitrine: 'M4 9h16l-1 11H5zM8 9V6a4 4 0 0 1 8 0v3',
  liste: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  horloge: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7v5l3 2',
  etoile: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z',
};

/**
 * Un titre de section, avec sa pastille dessinée.
 *
 * Le titre reste un vrai `h2` : l'icône est purement décorative et masquée aux
 * lecteurs d'écran, qui entendent donc le texte, une seule fois.
 */
export function TitreSection({
  icone,
  compte,
  children,
}: {
  icone: keyof typeof TRACES;
  /** Un chiffre discret à droite du titre : « (12) ». */
  compte?: number;
  children: ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2.5 text-[19px] font-extrabold text-[#12312A]">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E3F5EC] text-[#0F5F3E]"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
          <path d={TRACES[icone]} />
        </svg>
      </span>
      <span>{children}</span>
      {compte === undefined ? null : <span className="text-[#5E7A6E] font-bold">({compte})</span>}
    </h2>
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
        {surtitre ? <p className="mb-2 text-sm font-bold uppercase tracking-[0.12em] text-[#5E7A6E]">{surtitre}</p> : null}
        <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight text-[#12312A] [text-wrap:balance] sm:text-4xl">{children}</h1>
        {sousTitre ? <p className="mt-3 text-lg leading-relaxed text-[#334A42]">{sousTitre}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SousTitre({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mb-4 text-xl font-extrabold tracking-tight text-[#12312A] sm:text-2xl">
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
            ? 'border-[#B7E4CE] bg-[#E3F5EC] text-[#0F5F3E]'
            : 'border-[#DDEBE4] bg-white text-[#334A42]';
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
            ? 'bg-[#E3F5EC] text-[#0F5F3E]'
            : 'bg-[#EDF3F0] text-[#5E7A6E]';
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
    ton === 'ok' ? 'text-[#1E9E6A]' : ton === 'attention' ? 'text-[#B45309]' : ton === 'alerte' ? 'text-[#C42B57]' : 'text-[#12312A]';
  const contenu = (
    <>
      <p className="text-sm font-bold text-[#5E7A6E]">{libelle}</p>
      <p className={`mt-1 text-3xl font-extrabold tabular-nums ${couleur}`}>{valeur}</p>
      {detail ? <p className="mt-1 text-sm text-[#5E7A6E]">{detail}</p> : null}
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

export function Barre({ pourcentage, ton = 'accent' }: { pourcentage: number; ton?: 'accent' | 'ok' }) {
  const p = Math.max(0, Math.min(100, pourcentage));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E3F5EC]" role="img" aria-label={`${p} %`}>
      <div className={`h-full rounded-full ${ton === 'ok' ? 'bg-[#0F5F3E]' : 'bg-[#1E9E6A]'}`} style={{ width: `${p}%` }} />
    </div>
  );
}

export function formaterDate(iso: string | Date | null | undefined) {
  if (!iso) return null;
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formaterEuros(n: number | null | undefined) {
  if (n === null || n === undefined) return 'Non renseigné';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
