'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { nomCourt } from './_nom';
import { choisirEspace, deconnecter as fermerSession } from './_client';

export interface EspaceAffiche {
  id: string;
  nom: string;
  /** ASSOCIATION ou ACADEMIE : la pastille change de couleur selon la nature. */
  type: string;
}

export interface CompteAffiche {
  /** Le nom de l'association (ou le prénom si aucune association encore). */
  nom: string;
  /** Le prénom de la personne connectée. */
  prenom: string;
  /** Vrai quand la personne a un espace d'association ouvert. */
  espaceOuvert: boolean;
  /** Tous ses espaces, associations ET académies : le menu « Mes espaces » les liste. */
  espaces?: EspaceAffiche[];
  /** Celui sur lequel on travaille en ce moment. */
  active?: string | null;
  /** Vrai quand la personne porte le rôle d'administration de Piloter. */
  administration?: boolean;
}

interface Entree {
  href: string;
  libelle: string;
  icone: ReactNode;
  /** Une pastille à côté du libellé. */
  pastille?: string;
  /** L'entrée porte la troisième couleur du site, le rouge rosé. */
  accent?: boolean;
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
  formulaire: i('M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3M9 4a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4v1H9zM8 12h8M8 16h5'),
  association: i('M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01M9 14h.01M15 14h.01'),
  sortir: i('M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9'),
  menu: i('M3 6h18M3 12h18M3 18h18'),
  fermer: i('M18 6L6 18M6 6l12 12'),
  aide: i('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01'),
  /** L'enveloppe : écrire à quelqu'un. */
  enveloppe: i('M3 6h18v12H3zM3 7l9 6 9-6'),
  chevron: i('M6 9l6 6 6-6'),
  /** Trois points reliés : celui qui recommande, et ce que ça rapporte. */
  affiliation: i('M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4'),
  /** La boussole de la marque : « Piloter mon association ». */
  boussole: i('M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM16.5 7.5l-2.6 6.4-6.4 2.6 2.6-6.4z'),
  courrier: i('M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 7l-10 6L2 7'),
  personne: i('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'),
  page: i('M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM15 4v5h5M8 13h8M8 17h5'),
  versements: i('M2 7h20v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zM2 11h20M6 16h4'),
  reglages: i('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4.6 15.5l-1.7 1a9.6 9.6 0 0 1 0-9l1.7 1M19.4 8.5l1.7-1a9.6 9.6 0 0 1 0 9l-1.7-1M8.5 4.6l-1-1.7a9.6 9.6 0 0 1 9 0l-1 1.7M8.5 19.4l-1 1.7a9.6 9.6 0 0 0 9 0l-1-1.7'),
  cles: i('M21 2l-2 2m-7.6 7.6a5 5 0 1 1-7.1 7.1 5 5 0 0 1 7.1-7.1zM15.5 7.5L19 4l2 2-3.5 3.5z'),
  /// L'auvent d'une boutique : le tracé le plus lisible à 18 pixels.
  boutique: i('M4 9h16l-1 11H5zM8 9V6a4 4 0 0 1 8 0v3'),
  administration: i('M12 2l8 4v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6zM12 9v4M12 16h.01'),
};

/**
 * UNE SEULE LISTE. « Tableau de bord » est l'accueil : la marque et la
 * porte d'entrée, en rouge rosé. « Ce lundi » est la même page une fois
 * connectée ; « Mon association » porte le classeur, les documents, la fiche
 * publique, les agréments et le secrétariat ; « Ce à quoi j'ai droit » porte les
 * outils utiles.
 */
const MENU: Entree[] = [
  { href: '/', libelle: 'Tableau de bord', icone: ICONES.boussole, accent: true },
  { href: '/chemin', libelle: 'Le chemin', icone: ICONES.chemin, pastille: 'Commence ici' },
  { href: '/espace/association', libelle: 'Mon association', icone: ICONES.association },
  { href: '/espace/projets', libelle: 'Mes projets', icone: ICONES.actions },
  { href: '/espace/repertoire', libelle: 'Mon équipe', icone: ICONES.droits },
  { href: '/espace/partenaires', libelle: 'Mes contacts', icone: ICONES.partenaires },
  { href: '/espace/formulaires', libelle: 'Mes formulaires', icone: ICONES.formulaire },
  { href: '/espace/boutique', libelle: 'Ma boutique', icone: ICONES.boutique },
  { href: '/avantages', libelle: "Ce à quoi j'ai droit", icone: ICONES.cadeau },
  { href: '/presence-en-ligne', libelle: 'Être visible en ligne', icone: ICONES.globe },
  { href: '/se-former', libelle: 'Se former', icone: ICONES.former },
  { href: '/affiliation', libelle: 'Affiliation', icone: ICONES.affiliation },
];

/**
 * MON COMPTE. Le groupe dépliable du bas : la vitrine publique, l'argent qui
 * arrive, les réglages, et qui a le droit d'entrer.
 */
const MON_COMPTE: Entree[] = [
  { href: '/ma-page', libelle: 'Ma page association', icone: ICONES.page },
  { href: '/parametres', libelle: 'Paramètres', icone: ICONES.reglages },
  { href: '/droits-acces', libelle: "Droits d'accès", icone: ICONES.cles },
];

/** Les seules entrées qui s'ouvrent sans compte. Le reste attend la connexion. */
const PUBLIC = ['/', '/association', '/chemin', '/association/chemin'];

/** Les pages qui n'ont plus d'entrée à elles : elles éclairent l'entrée qui les porte. */
const PORTEES: Record<string, string> = {
  '/versements': '/espace/comptabilite',
  '/espace': '/',
  '/association': '/',
  '/espace/actions': '/espace/projets',
  '/espace/financeurs': '/espace/projets',
  '/espace/budget': '/espace/association',
  '/espace/comptabilite': '/espace/association',
  '/espace/secretariat': '/espace/association',
  '/espace/documents': '/espace/association',
  '/espace/classeur': '/espace/association',
  '/mon-profil': '/espace/association',
  '/ajouter-une-association': '/espace/association',
  '/verifier': '/espace/association',
  '/agrements': '/espace/association',
  '/outils': '/avantages',
};

/**
 * L'ENTRÉE « LE CHEMIN » N'OUVRE PAS LA MÊME PAGE SELON QU'ON EST CHEZ SOI.
 *
 * Sans espace, elle ouvre `/chemin` : les deux parcours, expliqués, pour
 * choisir. Avec un espace ouvert, elle ouvre le chemin DE CET ESPACE — celui
 * de l'autre n'a plus rien à faire là.
 */
const CHEMIN_COMMUN = '/chemin';
const CHEMIN_ESPACE = '/association/chemin';

function actif(chemin: string, href: string) {
  // Le chemin commun et celui de l'espace éclairent la même entrée.
  if (href === CHEMIN_ESPACE || href === CHEMIN_COMMUN) {
    return chemin === CHEMIN_COMMUN || chemin === CHEMIN_ESPACE || chemin.startsWith(`${CHEMIN_ESPACE}/`);
  }
  const porte = PORTEES[chemin];
  if (porte) return porte === href;
  if (href === '/' || href === '/espace') return chemin === href;
  return chemin === href || chemin.startsWith(`${href}/`);
}

function initiale(nom: string) {
  return (nom.trim()[0] ?? '?').toUpperCase();
}

export async function deconnecter() {
  await fermerSession();
  window.location.href = '/';
}

/** La barre latérale sombre : la marque en haut, les entrées, la personne en bas. */
export function BarreLaterale({ compte }: { compte: CompteAffiche | null }) {
  const chemin = usePathname() ?? '/';
  // La plateforme (l'accueil et la page des deux chemins) porte la marque DORÉE ;
  // l'espace association porte la sienne, en rouge rosé.
  const surLaPlateforme = chemin === '/' || chemin === '/chemin' || chemin === '/centre-d-aide';
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
            estActif ? 'bg-[#4F46E5] text-white' : 'text-[#D9D7F2] hover:bg-white/10 hover:text-white'
          }`}
        >
          {/* Seule l'icône porte le rouge rosé ; le libellé reste comme les autres. */}
          <span className={`shrink-0 ${e.accent ? 'text-[#F3B0C2]' : estActif ? 'text-white' : 'text-[#A9A6D9]'}`}>{e.icone}</span>
          {/* Une entrée, une ligne. Le libellé accentué garde EXACTEMENT la même
              taille et le même interlettrage que les autres : seule l'icône le distingue. */}
          <span className="flex-1 whitespace-nowrap">{e.libelle}</span>
          {e.pastille && !estActif ? (
            <span className="rounded-full bg-[#F5B400] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#1D1B5C]">{e.pastille}</span>
          ) : null}
        </Link>
      </li>
    );
  };

  // Sans espace, on ne montre que ce qui s'ouvre vraiment ; avec un espace,
  // « Le chemin » ouvre celui de l'espace, pas la page des deux parcours.
  const entrees = (compte?.espaceOuvert ? MENU : MENU.filter((e) => PUBLIC.includes(e.href))).map((e) =>
    e.href === CHEMIN_COMMUN && compte?.espaceOuvert ? { ...e, href: CHEMIN_ESPACE } : e,
  );

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
            <span className="mt-0.5 text-xs text-[#A9A6D9]">{compte.espaceOuvert ? 'Espace association ouvert' : 'Compte connecté'}</span>
          </>
        ) : (
          <Link href={surLaPlateforme ? '/' : '/association'} className="flex flex-col items-center gap-2 no-underline">
            {/* Sur la plateforme, qui présente les deux espaces, la marque est dorée ;
                dans l'espace association, elle reprend le rouge rosé de l'espace. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={surLaPlateforme ? '/pilote/marque.svg' : '/association/marque.svg'}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-2xl"
            />
            <span className="text-sm font-extrabold leading-snug text-white">
              {surLaPlateforme ? 'Piloter' : 'Piloter mon association'}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#A9A6D9]">par Toulali</span>
          </Link>
        )}
      </div>

      {/* Sans compte, on ne montre que ce qui s'ouvre vraiment : l'accueil et le chemin. */}
      <nav aria-label="Navigation">
        <ul className="space-y-0.5">{entrees.map(lien)}</ul>

        {/* Mon compte : replié par défaut, déplié quand on est dessus. */}
        {compte?.espaceOuvert ? (
          <div className="mt-3 border-t border-white/10 pt-3">
            <button
              type="button"
              onClick={() => setCompteOuvert((o) => !o)}
              aria-expanded={compteOuvert}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-bold text-[#D9D7F2] transition hover:bg-white/10 hover:text-white"
            >
              <span className="shrink-0 text-[#A9A6D9]">{ICONES.personne}</span>
              <span className="flex-1 text-left">Mon compte</span>
              <span className={`shrink-0 text-[#A9A6D9] transition-transform ${compteOuvert ? 'rotate-180' : ''}`}>{ICONES.chevron}</span>
            </button>
            {compteOuvert ? <ul className="mt-0.5 space-y-0.5 pl-3">{entreesDuCompte(compte).map(lien)}</ul> : null}
          </div>
        ) : null}
      </nav>

      <div className="mt-auto space-y-2 pt-6">
        {/* Nous écrire est à portée de main. Se déconnecter vit en haut à droite. */}
        <Link
          href="/nous-contacter"
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/25 px-4 py-2.5 text-sm font-bold text-white no-underline transition hover:border-white/60 hover:bg-white/10"
        >
          {ICONES.courrier} Nous contacter
        </Link>
        {/* La signature, tout en bas : d'où vient l'outil. */}
        <Link href="/" className="flex items-center justify-center gap-2 pt-3 no-underline">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/pilote/marque.svg" alt="" width={26} height={26} className="h-[26px] w-[26px] rounded-lg" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#A9A6D9]">créé par Toulali</span>
        </Link>
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
          <img src="/pilote/marque.svg" alt="" width={30} height={30} className="h-[30px] w-[30px] rounded-lg" />
          <span className="text-[15px] font-extrabold text-[#1D1B5C]">Piloter</span>
        </Link>
        {compte && (compte.espaceOuvert || (compte.espaces?.length ?? 0) > 0) ? <MenuEspaces compte={compte} /> : null}
        <Link href="/centre-d-aide" className="hidden items-center gap-2 text-[15px] font-bold text-[#1D1B5C] no-underline hover:text-[#4F46E5] md:flex">
          {ICONES.aide} Centre d&apos;aide
        </Link>
      </div>

      {/* Au centre : l'entrée la plus importante, l'argent. Elle n'existe qu'avec un
          compte. Le rouge plein écrasait la page : dégradé depuis le blanc, encre rose foncée. */}
      {compte?.espaceOuvert ? (
        <Link
          href="/espace/dossiers"
          className="shrink-0 rounded-xl border border-[#F3B0C2] bg-gradient-to-r from-white to-[#FDE7EC] px-3 py-2 text-center text-[13px] font-extrabold leading-tight text-[#8A1B3D] no-underline shadow-sm transition hover:from-[#FDE7EC] hover:to-[#F9C9D6] sm:px-5 sm:text-[15px]"
        >
          <span className="sm:hidden">Mes subventions</span>
          <span className="hidden sm:inline">Mes subventions et appels à projet</span>
        </Link>
      ) : null}

      <div className="relative flex flex-1 items-center justify-end gap-2">
        {/* Pouvoir écrire à quelqu'un, depuis n'importe quel écran. */}
        <Link
          href="/nous-contacter"
          className="hidden shrink-0 items-center gap-2 rounded-xl border border-[#E6E4F3] px-3.5 py-2 text-[14px] font-bold text-[#1D1B5C] no-underline transition hover:border-[#4F46E5] hover:bg-[#ECEBFC] hover:text-[#4338CA] sm:flex"
        >
          {ICONES.enveloppe} Nous contacter
        </Link>
        <Link
          href="/nous-contacter"
          aria-label="Nous contacter"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E6E4F3] text-[#1D1B5C] no-underline hover:bg-[#ECEBFC] sm:hidden"
        >
          {ICONES.enveloppe}
        </Link>
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
              <div className="absolute right-0 top-full mt-1 w-64 rounded-2xl border border-[#E6E4F3] bg-white p-2 shadow-lg">
                <Link href="/mon-profil" className="block rounded-xl px-3 py-2 text-sm font-bold text-[#1D1B5C] no-underline hover:bg-[#F5F4FC]">
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
            <Link href="/connexion" className="rounded-xl border-2 border-[#C7C4F2] bg-white px-3 py-1.5 text-[15px] font-bold text-[#1D1B5C] no-underline transition hover:border-[#4F46E5] hover:bg-[#F5F4FC]">
              Connexion
            </Link>
            <MenuCreerEspace />
          </>
        )}
      </div>
    </header>
  );
}

/**
 * MES ESPACES. Une personne peut porter plusieurs associations, une académie,
 * ou les deux. Le menu les liste toutes : cliquer sur l'une pose la préférence
 * et l'ouvre — une académie part vers son propre espace.
 */
function MenuEspaces({ compte }: { compte: CompteAffiche }) {
  const [ouvert, setOuvert] = useState(false);
  const liste = compte.espaces?.length ? compte.espaces : [{ id: 'active', nom: compte.nom, type: 'ASSOCIATION' }];
  const plusieurs = liste.length > 1;

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
        className="flex max-w-[260px] items-center gap-2 rounded-xl px-2 py-1.5 text-[15px] font-bold text-[#1D1B5C] hover:bg-[#F5F4FC]"
      >
        <span className="truncate">{plusieurs ? 'Mes espaces' : nomCourt(compte.nom)}</span>
        {ICONES.chevron}
      </button>
      {ouvert ? (
        <div className="absolute left-0 top-full z-30 mt-1 w-[300px] rounded-2xl border border-[#E6E4F3] bg-white p-2 shadow-lg">
          {liste.map((e) => {
            const academie = e.type === 'ACADEMIE';
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => basculer(e)}
                title={e.nom}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-[#F5F4FC]"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white ${
                    academie ? 'bg-[#1E9E6A]' : 'bg-[#4F46E5]'
                  }`}
                >
                  {initiale(e.nom)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[#1D1B5C]">{nomCourt(e.nom, 24)}</span>
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-[#6B6A8A]">
                    {academie ? 'Académie' : 'Association'}
                  </span>
                </span>
                {compte.active === e.id ? <span className="shrink-0 text-sm font-bold text-[#4F46E5]">✓</span> : null}
              </button>
            );
          })}
          <Link
            href="/ajouter-une-association"
            onClick={() => setOuvert(false)}
            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 no-underline hover:bg-[#F5F4FC]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ECEBFC] text-lg font-extrabold text-[#4338CA]">+</span>
            <span className="text-sm font-bold text-[#1D1B5C]">Ajouter une association</span>
          </Link>
          <Link
            href="/academie/ouvrir-mon-espace"
            onClick={() => setOuvert(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 no-underline hover:bg-[#F5F4FC]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E3F5EC] text-lg font-extrabold text-[#0F5F3E]">+</span>
            <span className="text-sm font-bold text-[#1D1B5C]">Ajouter une académie</span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Les entrées du groupe « Mon compte ».
 *
 * L'administration de Piloter n'apparaît que pour qui la porte : l'entrée est
 * un raccourci, pas un droit — la page et l'API vérifient le rôle chacune de
 * leur côté.
 */
function entreesDuCompte(compte: CompteAffiche | null): Entree[] {
  if (!compte?.administration) return MON_COMPTE;
  return [...MON_COMPTE, { href: '/administration', libelle: 'Administration', icone: ICONES.administration }];
}

/* ========================================================================== */

/** Les trois portes d'entrée, et ce que chacune veut dire. */
const PORTES = [
  {
    cle: 'particulier',
    href: '/inscription?type=particulier',
    titre: 'Espace particulier',
    ligne: "Je n'ai encore rien créé",
    info:
      "Tu n'as ni association ni organisme de formation pour l'instant. Tu ouvres un compte à ton nom, tu lis le chemin, et tu créeras ta structure en route : l'espace se transformera tout seul le jour où elle existera.",
    pastille: 'bg-[#4F46E5]',
    icone: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1',
  },
  {
    cle: 'association',
    href: '/inscription?type=association',
    titre: 'Espace association',
    ligne: "J'ai une association loi 1901",
    info:
      "Ton association existe déjà, ou tu es en train de la déclarer. L'espace porte son classeur de pièces, ses projets, ses demandes de subvention, ses comptes et son équipe. Sa fiche est pré-remplie à partir de son nom ou de son numéro.",
    pastille: 'bg-[#C42B57]',
    icone: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
  },
  {
    cle: 'academie',
    href: '/academie/inscription',
    titre: 'Espace académie',
    ligne: "Je forme, ou je vais former",
    info:
      "Un organisme de formation n'est pas une association : c'est la déclaration d'activité à la DREETS qui le fait, pas la forme juridique. L'espace porte la déclaration, la certification Qualiopi, le catalogue, les sessions, les apprenants et les émargements.",
    pastille: 'bg-[#0F5F3E]',
    icone: 'M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5',
  },
];

/**
 * CRÉER UN ESPACE. Un seul bouton, et une liste qui s'ouvre : trois portes,
 * chacune avec un « i » qui explique à qui elle s'adresse. Trois boutons côte à
 * côte obligeaient à deviner ; ici on choisit en lisant.
 */
function MenuCreerEspace() {
  const [ouvert, setOuvert] = useState(false);
  const [explique, setExplique] = useState<string | null>(null);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-haspopup="menu"
        className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-[#4F46E5] px-3 py-2 text-[13px] font-bold text-white transition hover:bg-[#4338CA] sm:px-4 sm:text-[15px]"
      >
        Créer un espace
        <span className={`transition-transform ${ouvert ? 'rotate-180' : ''}`}>{ICONES.chevron}</span>
      </button>

      {ouvert ? (
        <>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setOuvert(false)}
            className="fixed inset-0 z-20 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-30 mt-1.5 w-[min(92vw,380px)] rounded-2xl border border-[#E6E4F3] bg-white p-2 shadow-lg"
          >
            {PORTES.map((p) => (
              <div key={p.cle} className="rounded-xl p-1 hover:bg-[#F5F4FC]">
                <div className="flex items-center gap-2">
                  <Link
                    href={p.href}
                    onClick={() => setOuvert(false)}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 no-underline"
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ${p.pastille}`} aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d={p.icone} />
                      </svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-extrabold text-[#1D1B5C]">{p.titre}</span>
                      <span className="block text-[13px] text-[#6B6A8A]">{p.ligne}</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setExplique((e) => (e === p.cle ? null : p.cle))}
                    aria-expanded={explique === p.cle}
                    aria-label={`À qui s'adresse l'${p.titre.toLowerCase()} ?`}
                    title="Ce que c'est"
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-[13px] font-extrabold transition ${
                      explique === p.cle
                        ? 'border-[#4F46E5] bg-[#4F46E5] text-white'
                        : 'border-[#C7C4F2] bg-white text-[#4F46E5] hover:border-[#4F46E5]'
                    }`}
                  >
                    i
                  </button>
                </div>
                {explique === p.cle ? (
                  <p className="mx-2 mb-2 mt-1 rounded-xl bg-[#F5F4FC] p-3 text-[13px] leading-relaxed text-[#3B3A66]">{p.info}</p>
                ) : null}
              </div>
            ))}

            <p className="mx-3 mb-2 mt-1 text-[12px] leading-relaxed text-[#6B6A8A]">
              Tu peux changer plus tard : un même compte porte plusieurs espaces.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
