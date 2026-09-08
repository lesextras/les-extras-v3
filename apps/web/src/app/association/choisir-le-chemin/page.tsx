import Link from 'next/link';
import type { Metadata } from 'next';
import { chargerChemin as chargerCheminAssociation } from '../_chemin';
import { chargerChemin as chargerCheminAcademie } from '../../academie/_chemin';
import { Accent } from '../_ui';

export const metadata: Metadata = {
  title: 'Le chemin — Piloter',
  description:
    "Un chemin, c'est la suite des étapes à passer, dans l'ordre où elles se posent vraiment. Il y en a deux : celui d'une association, celui d'un organisme de formation.",
  alternates: { canonical: '/chemin' },
};

/**
 * `/chemin` — CE QU'EST UN CHEMIN, ET LES DEUX CHEMINS.
 *
 * Cette page ne fait pas partie d'un espace : c'est la porte commune. On
 * explique d'abord le mot — beaucoup de gens n'ont jamais vu la liste complète
 * des démarches — puis on ouvre les deux chemins, chacun dans sa couleur.
 *
 * Les nombres d'étapes viennent de l'API : si un chemin change, la page suit.
 */
export default async function ChoisirLeChemin() {
  const [association, academie] = await Promise.all([chargerCheminAssociation(), chargerCheminAcademie()]);

  const chemins = [
    {
      href: '/association/chemin',
      titre: "Le chemin de l'association",
      total: association?.total ?? 12,
      pour: 'Pour une association loi 1901',
      resume:
        "Déclarer l'association, obtenir son récépissé et son numéro RNA, ouvrir un compte, tenir ses comptes, puis demander sa première subvention.",
      moments: association?.parties?.map((p) => p.titre) ?? ['Naître', 'Vivre', 'Demander'],
      fin: 'À la fin : un dossier de subvention envoyé, avec ses pièces.',
      fond: 'border-2 border-[#C7C4F2] bg-[#ECEBFC]',
      pastille: 'bg-[#4F46E5]',
      titreCouleur: 'text-[#1D1B5C]',
      texte: 'text-[#3B3A66]',
      pilule: 'bg-white text-[#4338CA]',
      bouton: 'bg-[#4F46E5] hover:bg-[#4338CA]',
      icone: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
    },
    {
      href: '/academie/chemin',
      titre: "Le chemin de l'académie",
      total: academie?.total ?? 12,
      pour: "Pour un organisme de formation",
      resume:
        "Vérifier que c'est bien de la formation, obtenir le SIRET, signer la première convention, déclarer l'activité à la DREETS, puis se certifier Qualiopi.",
      moments: ['Exister', 'Se tenir', 'Se certifier'],
      fin: 'À la fin : le certificat Qualiopi, et les financements ouverts.',
      fond: 'border-2 border-[#B7E4CE] bg-[#E3F5EC]',
      pastille: 'bg-[#1E9E6A]',
      titreCouleur: 'text-[#12312A]',
      texte: 'text-[#334A42]',
      pilule: 'bg-white text-[#0F5F3E]',
      bouton: 'bg-[#1E9E6A] hover:bg-[#17845A]',
      icone: 'M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5',
    },
  ];

  return (
    <>
      {/* --------------------------------------------------- ce qu'est un chemin */}
      <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#6B6A8A]">Par Toulali, centre de formation</p>
      <h1 className="mt-2 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-5xl">
        Un chemin, c&apos;est <Accent>l&apos;ordre</Accent> des choses.
      </h1>
      <p className="mt-4 max-w-[58ch] text-lg leading-relaxed text-[#3B3A66]">
        Personne ne te donne la liste complète des démarches au départ. On la découvre au fur et à mesure, souvent trop tard.
        Un chemin, ici, c&apos;est cette liste : les étapes dans l&apos;ordre où elles se posent vraiment, avec ce qu&apos;il te faut
        pour chacune.
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {CE_QUE_DIT_UNE_ETAPE.map((e) => (
          <div key={e.titre} className="rounded-2xl border border-[#E6E4F3] bg-white p-5">
            <p className="text-sm font-extrabold uppercase tracking-[0.1em] text-[#6B6A8A]">{e.titre}</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[#3B3A66]">{e.texte}</p>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------- les deux chemins */}
      <h2 className="mt-12 text-2xl font-extrabold tracking-tight text-[#1D1B5C] sm:text-3xl">Il y en a deux. Prends le tien.</h2>
      <p className="mt-2 max-w-[58ch] leading-relaxed text-[#3B3A66]">
        Une association et un organisme de formation ne passent pas par les mêmes portes. Les deux chemins sont écrits en entier,
        et ils se cochent tout seuls quand ton espace est ouvert.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {chemins.map((c) => (
          <div key={c.href} className={`flex flex-col rounded-[24px] p-7 sm:p-8 ${c.fond}`}>
            <span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${c.pastille}`} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={c.icone} />
              </svg>
            </span>

            <p className={`mt-5 text-sm font-extrabold uppercase tracking-[0.12em] ${c.texte}`}>{c.pour}</p>
            <h3 className={`mt-1 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl ${c.titreCouleur}`}>
              {c.titre}
            </h3>
            <p className={`mt-1.5 text-lg font-bold ${c.titreCouleur}`}>{c.total} étapes</p>

            <p className={`mt-3 leading-relaxed ${c.texte}`}>{c.resume}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {c.moments.map((m) => (
                <span key={m} className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${c.pilule}`}>
                  {m}
                </span>
              ))}
            </div>

            <p className={`mt-5 text-[15px] font-bold ${c.titreCouleur}`}>{c.fin}</p>

            <Link
              href={c.href}
              className={`mt-6 inline-flex items-center justify-center gap-2 self-start rounded-xl px-5 py-3 text-base font-extrabold text-white no-underline transition ${c.bouton}`}
            >
              Ouvrir ce chemin
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------- les deux */}
      <div className="mt-8 rounded-[24px] border-2 border-[#F3B0C2] bg-[#FDE7EC] p-7 text-center sm:p-9">
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-[#8A1B3D] [text-wrap:balance] sm:text-3xl">
          Une association qui forme suit <Accent>les deux</Accent>.
        </h2>
        <p className="mx-auto mt-3 max-w-[54ch] leading-relaxed text-[#8A1B3D]/85">
          Une association reste une association quand elle forme : c&apos;est la déclaration d&apos;activité, pas la forme
          juridique, qui fait l&apos;organisme de formation. Un même compte porte les deux espaces.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/association"
            className="rounded-xl bg-[#4F46E5] px-6 py-3.5 text-base font-extrabold text-white no-underline transition hover:bg-[#4338CA]"
          >
            L&apos;espace association
          </Link>
          <Link
            href="/academie"
            className="rounded-xl bg-[#1E9E6A] px-6 py-3.5 text-base font-extrabold text-white no-underline transition hover:bg-[#17845A]"
          >
            L&apos;espace académie
          </Link>
        </div>
      </div>
    </>
  );
}

const CE_QUE_DIT_UNE_ETAPE = [
  { titre: 'Ce qu’il te faut', texte: "Les pièces et les informations à avoir sous la main avant de commencer l'étape." },
  { titre: 'Comment faire', texte: 'Les gestes, dans l’ordre, avec les formulaires officiels et des documents d’exemple.' },
  { titre: 'Quand c’est fini', texte: 'La preuve que l’étape est passée — et ce que ça débloque pour la suite.' },
];
