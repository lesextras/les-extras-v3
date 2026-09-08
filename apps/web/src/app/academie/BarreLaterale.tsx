'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { choisirEspace, deconnecter as fermerSession } from './_client';

export interface EspaceAffiche {
  id: string;
  nom: string;
  /** ACADEMIE ou ASSOCIATION : la pastille change de couleur selon la nature. */
  type: string;
}

export interface CompteAffiche {
  /** Le nom de l'académie (ou le prénom si aucune académie encore). */
  nom: string;
  /** Le prénom de la personne connectée. */
  prenom: string;
  /** Vrai quand la personne a un espace d'académie ouvert. */
  espaceOuvert: boolean;
  /** Tous ses espaces, académies ET associations : le menu « Mes espaces » les liste. */
  espaces?: EspaceAffiche[];
  /** Celui sur lequel on travaille en ce moment. */
  active?: string | null;
}

interface Entree {
  href: string;
  libelle: string;
  icone: ReactNode;
  pastille?: string;
  /** L'entrée porte la couleur de marque de la plateforme, le rouge rosé. */
  accent?: boolean;
}

const i = (d: string) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export const ICONES = {
  /** La toque : « Piloter mon académie ». */
  toque: i('M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5'),
  chemin: i('M4 20V9a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v0M4 20h16M8 4v4M16 16v4M12 10v10'),
  academie: i('M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01'),
  catalogue: i('M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'),
  sessions: i('M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'),
  apprenants: i('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'),
  enLigne: i('M23 7l-7 5 7 5zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z'),
  presentiel: i('M2 3h20v12H2zM8 21h8M12 15v6'),
  formateurs: i('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'),
  certification: i('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.8L7 22l5-3 5 3-1.2-8.2'),
  comptabilite: i('M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'),
  secretariat: i('M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7zM15 3v4h4M9 13h6M9 17h6'),
  courrier: i('M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 7l-10 6L2 7'),
  aide: i('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01'),
  chevron: i('M6 9l6 6 6-6'),
  personne: i('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'),
  page: i('M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM15 4v5h5M8 13h8M8 17h5'),
  versements: i('M2 7h20v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zM2 11h20M6 16h4'),
  reglages: i('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H1a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 2.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 7 2.6h.1A1.6 1.6 0 0 0 9 1V1a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1'),
  cles: i('M21 2l-2 2m-7.6 7.6a5 5 0 1 1-7.1 7.1 5 5 0 0 1 7.1-7.1zM15.5 7.5L19 4l2 2-3.5 3.5z'),
  menu: i('M3 6h18M3 12h18M3 18h18'),
  fermer: i('M18 6L6 18M6 6l12 12'),
};

/**
 * LE MENU. La même charpente que l'espace association : l'accueil, le chemin,
 * puis « Mon académie » qui regroupe l'administratif derrière trois cartes, et
 * ensuite le métier.
 */
const MENU: Entree[] = [
  { href: '/academie', libelle: 'Tableau de bord', icone: ICONES.toque, accent: true },
  { href: '/academie/chemin', libelle: 'Le chemin', icone: ICONES.chemin, pastille: 'Commence ici' },
  { href: '/academie/mon-academie', libelle: 'Mon académie', icone: ICONES.academie },
  { href: '/academie/catalogue', libelle: 'Mon catalogue', icone: ICONES.catalogue },
  { href: '/academie/sessions', libelle: 'Mes sessions', icone: ICONES.sessions },
  { href: '/academie/apprenants', libelle: 'Mes apprenants', icone: ICONES.apprenants },
  { href: '/academie/cours-en-ligne', libelle: 'Mes cours en ligne', icone: ICONES.enLigne },
  { href: '/academie/cours-en-presentiel', libelle: 'Mes cours en présentiel', icone: ICONES.presentiel },
  { href: '/academie/formateurs', libelle: 'Mes formateurs', icone: ICONES.formateurs },
];

/**
 * MON COMPTE. Le groupe dépliable du bas : la vitrine publique, l'argent qui
 * arrive, les réglages, et qui a le droit d'entrer.
 */
const MON_COMPTE: Entree[] = [
  { href: '/academie/ma-page', libelle: 'Ma page académie', icone: ICONES.page },
  { href: '/academie/versements', libelle: 'Versements', icone: ICONES.versements },
  { href: '/academie/parametres', libelle: 'Paramètres', icone: ICONES.reglages },
  { href: '/academie/droits-acces', libelle: "Droits d'accès", icone: ICONES.cles },
];

/** Les seules entrées qui s'ouvrent sans compte. Le reste attend la connexion. */
const PUBLIC = ['/academie', '/academie/chemin'];

/** Les pages qui n'ont pas d'entrée à elles : elles éclairent celle qui les porte. */
const PORTEES: Record<string, string> = {
  '/academie/certification': '/academie/mon-academie',
  '/academie/comptabilite': '/academie/mon-academie',
  '/academie/secretariat': '/academie/mon-academie',
  '/academie/veille': '/academie/mon-academie',
  '/academie/reclamations': '/academie/mon-academie',
  '/academie/mon-profil': '/academie/mon-academie',
  '/academie/ajouter-une-academie': '/academie/mon-academie',
};

function actif(chemin: string, href: string) {
  const porte = PORTEES[chemin];
  if (porte) return porte === href;
  if (href === '/academie') return chemin === href;
  return chemin === href || chemin.startsWith(`${href}/`);
}

function initiale(nom: string) {
  return (nom.trim()[0] ?? '?').toUpperCase();
}

function court(nom: string, max = 30) {
  const n = nom.trim();
  return n.length > max ? `${n.slice(0, max - 1)}…` : n;
}

export async function deconnecter() {
  await fermerSession();
  window.location.href = '/academie';
}

/** La barre latérale sombre : la marque en haut, les entrées, la personne en bas. */
export function BarreLaterale({ compte }: { compte: CompteAffiche | null }) {
  const chemin = usePathname() ?? '/academie';
  const [ouvert, setOuvert] = useState(false);
  // Le groupe « Mon compte » s'ouvre tout seul quand on est sur l'une de ses pages.
  const [compteOuvert, setCompteOuvert] = useState(() => MON_COMPTE.some((e) => chemin.startsWith(e.href)));

  useEffect(() => {
    setOuvert(false);
    if (MON_COMPTE.some((e) => chemin.startsWith(e.href))) setCompteOuvert(true);
  }, [chemin]);

  const lien = (e: Entree) => {
    const estActif = actif(chemin, e.href);
    return (
      <li key={e.href}>
        <Link
          href={e.href}
          aria-current={estActif ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-bold no-underline transition ${
            estActif ? 'bg-[#1E9E6A] text-white' : 'text-[#D3E7DC] hover:bg-white/10 hover:text-white'
          }`}
        >
          <span className={`shrink-0 ${e.accent ? 'text-[#F3B0C2]' : estActif ? 'text-white' : 'text-[#8CBBA4]'}`}>{e.icone}</span>
          {/* Même taille, même interlettrage que les autres entrées : seule l'icône distingue. */}
          <span className="flex-1 whitespace-nowrap">{e.libelle}</span>
          {e.pastille && !estActif ? (
            <span className="rounded-full bg-[#F5B400] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#12312A]">{e.pastille}</span>
          ) : null}
        </Link>
      </li>
    );
  };

  const contenu = (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex flex-col items-center px-2 text-center">
        {compte ? (
          <>
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1E9E6A] text-2xl font-extrabold text-white">
              {initiale(compte.nom)}
            </span>
            <Link href="/academie/mon-academie" className="mt-3 line-clamp-2 text-sm font-bold text-white no-underline hover:underline" title={compte.nom}>
              {court(compte.nom)}
            </Link>
            <span className="mt-0.5 text-xs text-[#8CBBA4]">{compte.espaceOuvert ? 'Espace académie ouvert' : 'Compte connecté'}</span>
          </>
        ) : (
          <Link href="/academie" className="flex flex-col items-center gap-2 no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/academie/marque.svg" alt="" width={56} height={56} className="h-14 w-14 rounded-2xl" />
            <span className="text-sm font-extrabold leading-snug text-white">Piloter mon académie</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8CBBA4]">par Toulali</span>
          </Link>
        )}
      </div>

      <nav aria-label="Navigation">
        <ul className="space-y-0.5">{(compte ? MENU : MENU.filter((e) => PUBLIC.includes(e.href))).map(lien)}</ul>

        {/* Mon compte : replié par défaut, déplié quand on est dessus. */}
        {compte ? (
          <div className="mt-3 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => setCompteOuvert((o) => !o)}
              aria-expanded={compteOuvert}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-bold text-[#D3E7DC] transition hover:bg-white/10 hover:text-white"
            >
              <span className="shrink-0 text-[#8CBBA4]">{ICONES.personne}</span>
              <span className="flex-1 text-left">Mon compte</span>
              <span className={`shrink-0 text-[#8CBBA4] transition-transform ${compteOuvert ? 'rotate-180' : ''}`}>{ICONES.chevron}</span>
            </button>
            {compteOuvert ? <ul className="mt-0.5 space-y-0.5 pl-3">{MON_COMPTE.map(lien)}</ul> : null}
          </div>
        ) : null}
      </nav>

      <div className="mt-auto space-y-2 pt-6">
        <Link
          href="/academie/nous-contacter"
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/25 px-4 py-2.5 text-sm font-bold text-white no-underline transition hover:border-white/60 hover:bg-white/10"
        >
          {ICONES.courrier} Nous contacter
        </Link>
        <Link href="/academie" className="flex items-center justify-center gap-2 pt-3 no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/academie/marque.svg" alt="" width={26} height={26} className="h-[26px] w-[26px] rounded-lg" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8CBBA4]">créé par Toulali</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-controls="menu-lateral-academie"
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#12312A] text-white shadow-lg lg:hidden"
      >
        <span className="sr-only">{ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
        {ouvert ? ICONES.fermer : ICONES.menu}
      </button>
      {ouvert ? (
        <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-[#12312A]/50" aria-label="Fermer le menu" onClick={() => setOuvert(false)} />
          <div id="menu-lateral-academie" className="absolute inset-y-0 left-0 w-[300px] max-w-[88vw] overflow-y-auto bg-[#12312A] p-4 shadow-2xl">
            {contenu}
          </div>
        </div>
      ) : null}

      <aside className="sticky top-0 hidden h-screen overflow-y-auto bg-[#12312A] p-4 pt-6 lg:block">{contenu}</aside>
    </>
  );
}

/** La barre du haut : l'espace à gauche, l'aide, la personne à droite. */
export function BarreHaut({ compte }: { compte: CompteAffiche | null }) {
  const [menu, setMenu] = useState(false);
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#DDEBE4] bg-white px-4 py-2.5 sm:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Link href="/academie" className="flex items-center gap-2 no-underline lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/academie/marque.svg" alt="" width={30} height={30} className="h-[30px] w-[30px] rounded-lg" />
          <span className="text-[15px] font-extrabold text-[#12312A]">Piloter</span>
        </Link>
        {compte?.espaceOuvert ? <MenuEspaces compte={compte} /> : null}
        <Link href="/academie/chemin" className="hidden items-center gap-2 text-[15px] font-bold text-[#12312A] no-underline hover:text-[#0F5F3E] md:flex">
          {ICONES.aide} Centre d&apos;aide
        </Link>
      </div>

      {/* Au centre : l'entrée la plus importante d'un organisme, sa certification. */}
      {compte ? (
        <Link
          href="/academie/certification"
          className="shrink-0 rounded-xl bg-[#1E9E6A] px-3 py-2 text-center text-[13px] font-extrabold leading-tight text-white no-underline transition hover:bg-[#17845A] sm:px-5 sm:text-[15px]"
        >
          <span className="sm:hidden">Ma certification</span>
          <span className="hidden sm:inline">Ma certification Qualiopi</span>
        </Link>
      ) : null}

      <div className="relative flex flex-1 items-center justify-end gap-2">
        {compte ? (
          <>
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[15px] font-bold text-[#12312A] hover:bg-[#F2F7F5]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E9E6A] text-sm font-extrabold text-white">{initiale(compte.prenom)}</span>
              <span className="hidden sm:inline">{compte.prenom}</span>
              {ICONES.chevron}
            </button>
            {menu ? (
              <div className="absolute right-0 top-full mt-1 w-56 rounded-2xl border border-[#DDEBE4] bg-white p-2 shadow-lg">
                <Link href="/academie/mon-academie" className="block rounded-xl px-3 py-2 text-sm font-bold text-[#12312A] no-underline hover:bg-[#F2F7F5]">
                  Mon académie
                </Link>
                <Link href="/academie/mon-profil" className="block rounded-xl px-3 py-2 text-sm font-bold text-[#12312A] no-underline hover:bg-[#F2F7F5]">
                  Mon profil
                </Link>
                <button type="button" onClick={deconnecter} className="block w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-[#8A2419] hover:bg-[#FDE8E6]">
                  Se déconnecter
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <Link href="/academie/connexion" className="rounded-xl border-2 border-[#CFE4D9] bg-white px-3 py-1.5 text-[15px] font-bold text-[#12312A] no-underline transition hover:border-[#0F5F3E] hover:bg-[#F2F7F5]">
              Connexion
            </Link>
            <Link
              href="/association/inscription?type=association"
              className="hidden whitespace-nowrap rounded-xl bg-[#C42B57] px-3 py-2 text-[13px] font-bold text-white no-underline transition hover:bg-[#8A1B3D] md:inline-flex"
            >
              Créer espace association
            </Link>
            <Link
              href="/academie/inscription"
              className="hidden whitespace-nowrap rounded-xl bg-[#0F5F3E] px-3 py-2 text-[13px] font-bold text-white no-underline transition hover:bg-[#0B4A30] sm:inline-flex"
            >
              Créer espace académie
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

/**
 * MES ESPACES. Une personne peut porter une association ET une académie, ou
 * plusieurs de chaque. Le menu les liste toutes : cliquer sur l'une pose la
 * préférence et l'ouvre. Une association renvoie vers son propre espace.
 */
function MenuEspaces({ compte }: { compte: CompteAffiche }) {
  const [ouvert, setOuvert] = useState(false);
  const liste = compte.espaces?.length ? compte.espaces : [{ id: 'active', nom: compte.nom, type: 'ACADEMIE' }];

  function basculer(espace: EspaceAffiche) {
    choisirEspace(espace.id);
    window.location.href = espace.type === 'ACADEMIE' ? '/academie/mon-academie' : '/espace/association';
  }

  return (
    <div className="relative hidden sm:block">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        title={compte.nom}
        className="flex max-w-[260px] items-center gap-2 rounded-xl px-2 py-1.5 text-[15px] font-bold text-[#12312A] hover:bg-[#F2F7F5]"
      >
        <span className="truncate">{liste.length > 1 ? 'Mes espaces' : court(compte.nom, 24)}</span>
        {ICONES.chevron}
      </button>
      {ouvert ? (
        <div className="absolute left-0 top-full z-30 mt-1 w-[300px] rounded-2xl border border-[#DDEBE4] bg-white p-2 shadow-lg">
          {liste.map((e) => {
            const academie = e.type === 'ACADEMIE';
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => basculer(e)}
                title={e.nom}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#F2F7F5]"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white ${
                    academie ? 'bg-[#1E9E6A]' : 'bg-[#4F46E5]'
                  }`}
                >
                  {initiale(e.nom)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[#12312A]">{court(e.nom, 24)}</span>
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-[#5E7A6E]">
                    {academie ? 'Académie' : 'Association'}
                  </span>
                </span>
                {compte.active === e.id ? <span className="shrink-0 text-sm font-bold text-[#1E9E6A]">✓</span> : null}
              </button>
            );
          })}
          <Link
            href="/academie/ajouter-une-academie"
            onClick={() => setOuvert(false)}
            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 no-underline hover:bg-[#F2F7F5]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E3F5EC] text-lg font-extrabold text-[#0F5F3E]">+</span>
            <span className="text-sm font-bold text-[#12312A]">Ajouter une académie</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
