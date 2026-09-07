'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { nomCourt } from './_nom';

export interface CompteAffiche {
  /** Le nom de l'association (ou le prénom si aucune association encore). */
  nom: string;
  /** Le prénom de la personne connectée. */
  prenom: string;
  /** Vrai quand la personne a un espace d'association ouvert. */
  espaceOuvert: boolean;
}

interface Entree {
  href: string;
  libelle: string;
  icone: ReactNode;
  /** Une pastille à côté du libellé. */
  pastille?: string;
}

const i = (d: string) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export const ICONES = {
  accueil: i('M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z'),
  chemin: i('M4 20V9a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v0M4 20h16M8 4v4M16 16v4M12 10v10'),
  subvention: i('M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5s2.2 3 5 3 5 1.1 5 3-2.2 3-5 3-5-1.1-5-3'),
  cadeau: i('M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'),
  globe: i('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'),
  verifier: i('M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.3-4.3'),
  outils: i('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-7 7a2.1 2.1 0 0 1-3-3l7-7a6 6 0 0 1 7.9-7.9z'),
  former: i('M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5'),
  lundi: i('M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'),
  classeur: i('M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'),
  dossiers: i('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 15h6M9 11h2'),
  repertoire: i('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8'),
  actions: i('M13 2L3 14h7l-1 8 10-12h-7z'),
  budget: i('M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'),
  agrement: i('M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.2 13.8L7 22l5-3 5 3-1.2-8.2'),
  droits: i('M12 2l8 4v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6zM9 12l2 2 4-4'),
  partenaires: i('M12 21s-7-4.4-9.3-8.4A5.3 5.3 0 0 1 12 6.6a5.3 5.3 0 0 1 9.3 6C19 16.6 12 21 12 21z'),
  documents: i('M15 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7zM15 3v4h4M9 13h6M9 17h6'),
  association: i('M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01M9 14h.01M15 14h.01'),
  sortir: i('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'),
  menu: i('M3 6h18M3 12h18M3 18h18'),
  fermer: i('M18 6L6 18M6 6l12 12'),
  aide: i('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01'),
  chevron: i('M6 9l6 6 6-6'),
};

/**
 * UNE SEULE LISTE. « Accueil » et « Ce lundi » sont la même page (le tableau de
 * bord quand on est connectée) ; « Mon association » porte le classeur, les
 * documents, la fiche publique et les agréments ; « Ce à quoi j'ai droit »
 * porte les outils utiles.
 */
const MENU: Entree[] = [
  { href: '/', libelle: 'Accueil', icone: ICONES.accueil },
  { href: '/chemin', libelle: 'Le chemin', icone: ICONES.chemin, pastille: 'Commence ici' },
  { href: '/espace/projets', libelle: 'Mes projets', icone: ICONES.actions },
  { href: '/espace/secretariat', libelle: 'Mon secrétariat', icone: ICONES.budget },
  { href: '/espace/association', libelle: 'Mon association', icone: ICONES.association },
  { href: '/espace/repertoire', libelle: 'Mon équipe', icone: ICONES.droits },
  { href: '/espace/partenaires', libelle: 'Mes partenaires', icone: ICONES.partenaires },
  { href: '/avantages', libelle: "Ce à quoi j'ai droit", icone: ICONES.cadeau },
  { href: '/presence-en-ligne', libelle: 'Être visible en ligne', icone: ICONES.globe },
  { href: '/se-former', libelle: 'Se former', icone: ICONES.former },
];

/** Les pages qui n'ont plus d'entrée à elles : elles éclairent l'entrée qui les porte. */
const PORTEES: Record<string, string> = {
  '/espace': '/',
  '/espace/actions': '/espace/projets',
  '/espace/financeurs': '/espace/projets',
  '/espace/budget': '/espace/secretariat',
  '/espace/documents': '/espace/association',
  '/espace/classeur': '/espace/association',
  '/verifier': '/espace/association',
  '/agrements': '/espace/association',
  '/outils': '/avantages',
};

function actif(chemin: string, href: string) {
  const porte = PORTEES[chemin];
  if (porte) return porte === href;
  if (href === '/' || href === '/espace') return chemin === href;
  return chemin === href || chemin.startsWith(`${href}/`);
}

function initiale(nom: string) {
  return (nom.trim()[0] ?? '?').toUpperCase();
}

export async function deconnecter() {
  await fetch('/api/auth/session', { method: 'DELETE' });
  window.location.href = '/';
}

/** La barre latérale sombre : la marque en haut, les entrées, la personne en bas. */
export function BarreLaterale({ compte }: { compte: CompteAffiche | null }) {
  const chemin = usePathname() ?? '/';
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => {
    setOuvert(false);
  }, [chemin]);

  const lien = (e: Entree) => {
    const estActif = actif(chemin, e.href);
    return (
      <li key={e.href}>
        <Link
          href={e.href}
          aria-current={estActif ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-bold no-underline transition ${
            estActif ? 'bg-[#4F46E5] text-white' : 'text-[#D9D7F2] hover:bg-white/10 hover:text-white'
          }`}
        >
          <span className={estActif ? 'text-white' : 'text-[#A9A6D9]'}>{e.icone}</span>
          <span className="flex-1">{e.libelle}</span>
          {e.pastille && !estActif ? (
            <span className="rounded-full bg-[#F5B400] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#1D1B5C]">{e.pastille}</span>
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
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#4F46E5] text-2xl font-extrabold text-white">
              {initiale(compte.nom)}
            </span>
            <Link href="/espace/association" className="mt-3 line-clamp-2 text-sm font-bold text-white no-underline hover:underline" title={compte.nom}>
              {nomCourt(compte.nom)}
            </Link>
            <span className="mt-0.5 text-xs text-[#A9A6D9]">{compte.espaceOuvert ? 'Espace ouvert' : 'Compte connecté'}</span>
          </>
        ) : (
          <Link href="/" className="flex flex-col items-center gap-2 no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/association/marque.svg" alt="" width={56} height={56} className="h-14 w-14 rounded-2xl" />
            <span className="text-sm font-extrabold text-white">Piloter mon association</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#A9A6D9]">par Toulali</span>
          </Link>
        )}
      </div>

      <nav aria-label="Navigation">
        <ul className="space-y-0.5">{MENU.map(lien)}</ul>
      </nav>

      <div className="mt-auto pt-6">
        {compte ? (
          <button
            type="button"
            onClick={deconnecter}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-bold text-[#D9D7F2] hover:bg-white/10 hover:text-white"
          >
            <span className="text-[#A9A6D9]">{ICONES.sortir}</span> Se déconnecter
          </button>
        ) : (
          <div className="flex flex-col gap-2 px-1">
            <Link href="/inscription" className="inline-flex items-center justify-center rounded-xl bg-[#4F46E5] px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-[#4338CA]">
              Créer mon espace, gratuit
            </Link>
            <Link href="/connexion" className="inline-flex items-center justify-center rounded-xl border-2 border-white/30 px-4 py-2 text-sm font-bold text-white no-underline hover:border-white">
              Se connecter
            </Link>
          </div>
        )}
        {compte ? (
          <Link href="/" className="mt-4 flex items-center justify-center gap-2 no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/association/marque.svg" alt="" width={28} height={28} className="h-7 w-7 rounded-lg" />
            <span className="text-sm font-extrabold text-white">Piloter mon association</span>
          </Link>
        ) : null}
      </div>
    </div>
  );

  return (
    <>
      {/* Petit écran : bouton de menu (dans la barre du haut) et tiroir. */}
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-controls="menu-lateral"
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1D1B5C] text-white shadow-lg lg:hidden"
      >
        <span className="sr-only">{ouvert ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
        {ouvert ? ICONES.fermer : ICONES.menu}
      </button>
      {ouvert ? (
        <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-[#1D1B5C]/50" aria-label="Fermer le menu" onClick={() => setOuvert(false)} />
          <div id="menu-lateral" className="absolute inset-y-0 left-0 w-[300px] max-w-[88vw] overflow-y-auto bg-[#1D1B5C] p-4 shadow-2xl">
            {contenu}
          </div>
        </div>
      ) : null}

      {/* Grand écran : la barre latérale fixe. */}
      <aside className="sticky top-0 hidden h-screen overflow-y-auto bg-[#1D1B5C] p-4 pt-6 lg:block">{contenu}</aside>
    </>
  );
}

/** La barre du haut : l'association à gauche, l'aide, la personne à droite. */
export function BarreHaut({ compte }: { compte: CompteAffiche | null }) {
  const [menu, setMenu] = useState(false);
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#E6E4F3] bg-white px-4 py-2.5 sm:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 no-underline lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/association/marque.svg" alt="" width={30} height={30} className="h-[30px] w-[30px] rounded-lg" />
          <span className="text-[15px] font-extrabold text-[#1D1B5C]">Piloter</span>
        </Link>
        {compte?.espaceOuvert ? (
          <Link
            href="/espace/association"
            title={compte.nom}
            className="hidden items-center gap-2 truncate text-[15px] font-bold text-[#1D1B5C] no-underline hover:text-[#4F46E5] sm:flex"
          >
            <span className="truncate">{nomCourt(compte.nom)}</span>
            {ICONES.chevron}
          </Link>
        ) : null}
        <Link href="/chemin" className="hidden items-center gap-2 text-[15px] font-bold text-[#1D1B5C] no-underline hover:text-[#4F46E5] md:flex">
          {ICONES.aide} Centre d&apos;aide
        </Link>
      </div>

      {/* Au centre : l'entrée la plus importante, l'argent. */}
      <Link
        href="/espace/dossiers"
        className="shrink-0 rounded-xl bg-[#D6335C] px-3 py-2 text-center text-[13px] font-extrabold leading-tight text-white no-underline transition hover:bg-[#BC2A4E] sm:px-5 sm:text-[15px]"
      >
        <span className="sm:hidden">Mes subventions</span>
        <span className="hidden sm:inline">Mes subventions et appels à projet</span>
      </Link>

      <div className="relative flex flex-1 items-center justify-end gap-2">
        {compte ? (
          <>
            <button
              type="button"
              onClick={() => setMenu((m) => !m)}
              aria-expanded={menu}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[15px] font-bold text-[#1D1B5C] hover:bg-[#F5F4FC]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4F46E5] text-sm font-extrabold text-white">{initiale(compte.prenom)}</span>
              <span className="hidden sm:inline">{compte.prenom}</span>
              {ICONES.chevron}
            </button>
            {menu ? (
              <div className="absolute right-0 top-full mt-1 w-56 rounded-2xl border border-[#E6E4F3] bg-white p-2 shadow-lg">
                <Link href="/espace/association" className="block rounded-xl px-3 py-2 text-sm font-bold text-[#1D1B5C] no-underline hover:bg-[#F5F4FC]">
                  Mon association
                </Link>
                <Link href="/espace" className="block rounded-xl px-3 py-2 text-sm font-bold text-[#1D1B5C] no-underline hover:bg-[#F5F4FC]">
                  Ce lundi
                </Link>
                <button type="button" onClick={deconnecter} className="block w-full rounded-xl px-3 py-2 text-left text-sm font-bold text-[#8A2419] hover:bg-[#FDE8E6]">
                  Se déconnecter
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <Link href="/connexion" className="rounded-xl px-3 py-2 text-[15px] font-bold text-[#1D1B5C] no-underline hover:bg-[#F5F4FC]">
              Se connecter
            </Link>
            <Link href="/inscription" className="hidden rounded-xl bg-[#4F46E5] px-4 py-2 text-[15px] font-bold text-white no-underline hover:bg-[#4338CA] sm:inline-flex">
              Créer mon espace
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
