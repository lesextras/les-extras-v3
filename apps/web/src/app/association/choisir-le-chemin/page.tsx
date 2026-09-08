import Link from 'next/link';
import type { Metadata } from 'next';
import { chargerChemin as chargerCheminAssociation } from '../_chemin';
import { chargerChemin as chargerCheminAcademie, TEMPS as TEMPS_ACADEMIE } from '../../academie/_chemin';
import { Accent } from '../_ui';

export const metadata: Metadata = {
  title: 'Le chemin — Piloter',
  description:
    "Les deux parcours en entier, étape par étape : celui d'une association loi 1901, celui d'un organisme de formation. La frise complète, gratuite, avant même d'ouvrir un espace.",
  alternates: { canonical: '/chemin' },
};

/**
 * `/chemin` — LES DEUX PARCOURS, EN FRISE.
 *
 * Cette page ne fait partie d'aucun espace : c'est la porte commune. On montre
 * les deux chemins EN ENTIER, étape par étape, avant de demander quoi que ce
 * soit. Personne n'ouvre un compte pour découvrir ce qu'il y a dedans : on
 * montre d'abord, on propose ensuite.
 *
 * Les étapes viennent de l'API : si un chemin change, la frise suit.
 */

interface EtapeFrise {
  numero: number;
  titre: string;
  resume: string;
  href: string;
  moment: string;
}

interface Parcours {
  cle: string;
  pour: string;
  titre: string;
  resume: string;
  fin: string;
  etapes: EtapeFrise[];
  moments: { titre: string; resume: string }[];
  href: string;
  hrefCreer: string;
  libelleCreer: string;
  icone: string;
  cadre: string;
  encre: string;
  texte: string;
  ligne: string;
  pastille: string;
  carte: string;
  bouton: string;
  pilule: string;
}

export default async function ChoisirLeChemin() {
  const [association, academie] = await Promise.all([chargerCheminAssociation(), chargerCheminAcademie()]);

  const momentsAssociation = (association?.parties ?? []).map((p) => ({ titre: p.titre, resume: p.resultat }));
  const titrePartie = new Map((association?.parties ?? []).map((p) => [p.code, p.titre] as const));

  const parcours: Parcours[] = [
    {
      cle: 'association',
      pour: 'Pour une association loi 1901',
      titre: "Le chemin de l'association",
      resume:
        "Déclarer l'association, recevoir son numéro RNA et son SIRET, ouvrir un compte, tenir ses comptes, puis demander sa première subvention.",
      fin: 'À la fin : un dossier de subvention déposé, avec toutes ses pièces.',
      etapes: (association?.etapes ?? []).map((e) => ({
        numero: e.numero,
        titre: e.titre,
        resume: e.enUnMot,
        href: `/association/chemin/${e.slug}`,
        moment: titrePartie.get(e.partie) ?? '',
      })),
      moments: momentsAssociation,
      href: '/association/chemin',
      hrefCreer: '/inscription?type=association',
      libelleCreer: 'Créer mon espace association',
      icone: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6',
      cadre: 'border-[#C7C4F2]',
      encre: 'text-[#1D1B5C]',
      texte: 'text-[#3B3A66]',
      ligne: 'bg-[#C7C4F2]',
      pastille: 'bg-[#4F46E5] text-white',
      carte: 'border-[#E6E4F3] bg-[#F5F4FC] hover:border-[#4F46E5]',
      bouton: 'bg-[#4F46E5] hover:bg-[#4338CA]',
      pilule: 'bg-[#ECEBFC] text-[#4338CA]',
    },
    {
      cle: 'academie',
      pour: 'Pour un organisme de formation',
      titre: "Le chemin de l'académie",
      resume:
        "Vérifier que c'est bien de la formation, obtenir le SIRET, signer la première convention, déclarer l'activité à la DREETS, puis se certifier Qualiopi.",
      fin: 'À la fin : le certificat Qualiopi, et les financements ouverts.',
      etapes: (academie?.etapes ?? []).map((e) => ({
        numero: e.numero,
        titre: e.titre,
        resume: e.pourPasser,
        href: `/academie/chemin/${e.slug}`,
        moment: TEMPS_ACADEMIE.find((t) => e.numero >= t.de && e.numero <= t.a)?.titre ?? '',
      })),
      moments: TEMPS_ACADEMIE.map((t) => ({ titre: t.titre, resume: t.resume })),
      href: '/academie/chemin',
      hrefCreer: '/inscription?type=academie',
      libelleCreer: 'Créer mon espace académie',
      icone: 'M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5',
      cadre: 'border-[#B7E4CE]',
      encre: 'text-[#12312A]',
      texte: 'text-[#334A42]',
      ligne: 'bg-[#B7E4CE]',
      pastille: 'bg-[#1E9E6A] text-white',
      carte: 'border-[#DDEBE4] bg-[#F2F7F5] hover:border-[#1E9E6A]',
      bouton: 'bg-[#1E9E6A] hover:bg-[#17845A]',
      pilule: 'bg-[#E3F5EC] text-[#0F5F3E]',
    },
  ];

  return (
    <>
      {/* ------------------------------------------------------------- l'entrée */}
      <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#6B6A8A]">Par Toulali, centre de formation</p>
      <h1 className="mt-2 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#1D1B5C] [text-wrap:balance] sm:text-5xl">
        Les deux chemins, <Accent>en entier</Accent>.
      </h1>
      <p className="mt-4 max-w-[62ch] text-lg leading-relaxed text-[#3B3A66]">
        Personne ne te donne la liste complète des démarches au départ : on la découvre au fur et à mesure, souvent trop tard.
        La voici en entier, dans l&apos;ordre où les choses se posent vraiment. Rien à ouvrir pour la lire, rien à payer.
      </p>

      <div className="mt-7 grid gap-3 sm:grid-cols-3">
        {CE_QUE_DIT_UNE_ETAPE.map((e) => (
          <div key={e.titre} className="rounded-2xl border border-[#E6E4F3] bg-white p-5">
            <p className="text-sm font-extrabold uppercase tracking-[0.1em] text-[#6B6A8A]">{e.titre}</p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[#3B3A66]">{e.texte}</p>
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------ les frises */}
      {parcours.map((p) => (
        <Frise key={p.cle} p={p} />
      ))}

      {/* ------------------------------------------------------------- les deux */}
      <div className="mt-10 rounded-[24px] border-2 border-[#F3B0C2] bg-[#FDE7EC] p-7 text-center sm:p-9">
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-[#8A1B3D] [text-wrap:balance] sm:text-3xl">
          Une association qui forme suit <Accent>les deux</Accent>.
        </h2>
        <p className="mx-auto mt-3 max-w-[54ch] leading-relaxed text-[#8A1B3D]/85">
          Une association reste une association quand elle forme : c&apos;est la déclaration d&apos;activité, pas la forme
          juridique, qui fait l&apos;organisme de formation. Un même compte porte les deux espaces, sans rien mélanger.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/inscription?type=particulier"
            className="rounded-xl bg-[#C42B57] px-6 py-3.5 text-base font-extrabold text-white no-underline transition hover:bg-[#8A1B3D]"
          >
            Créer mon compte
          </Link>
          <Link
            href="/connexion"
            className="rounded-xl border-2 border-[#C42B57] bg-white px-6 py-3.5 text-base font-extrabold text-[#8A1B3D] no-underline transition hover:bg-[#FDE7EC]"
          >
            J&apos;ai déjà un espace
          </Link>
        </div>
      </div>
    </>
  );
}

/* ========================================================================== */

/**
 * UNE FRISE. Les étapes se suivent sur un fil, de gauche à droite, groupées par
 * moment. On la fait glisser du doigt : la liste ne se coupe jamais, et on voit
 * toujours qu&apos;il y a une suite.
 */
function Frise({ p }: { p: Parcours }) {
  const dernier = p.etapes.length - 1;
  return (
    <section className={`mt-10 rounded-[28px] border-2 bg-white p-6 sm:p-8 ${p.cadre}`}>
      <div className="flex flex-wrap items-start gap-4">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${p.pastille}`} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={p.icone} />
          </svg>
        </span>
        <div className="min-w-[240px] flex-1">
          <p className={`text-sm font-extrabold uppercase tracking-[0.12em] ${p.texte}`}>{p.pour}</p>
          <h2 className={`mt-1 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl ${p.encre}`}>{p.titre}</h2>
          <p className={`mt-2 max-w-[62ch] leading-relaxed ${p.texte}`}>{p.resume}</p>
        </div>
        <span className={`rounded-full px-4 py-2 text-[15px] font-extrabold ${p.pilule}`}>{p.etapes.length} étapes</span>
      </div>

      {p.moments.length ? (
        <ol className="mt-6 grid gap-3 sm:grid-cols-3">
          {p.moments.map((m, i) => (
            <li key={m.titre} className={`rounded-2xl border p-4 ${p.carte}`}>
              <p className={`text-[13px] font-extrabold uppercase tracking-[0.1em] ${p.texte}`}>Temps {i + 1}</p>
              <p className={`mt-0.5 text-[17px] font-extrabold ${p.encre}`}>{m.titre}</p>
              <p className={`mt-1 text-[14px] leading-relaxed ${p.texte}`}>{m.resume}</p>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="-mx-6 mt-7 overflow-x-auto px-6 pb-2 sm:-mx-8 sm:px-8">
        <ol className="flex min-w-max items-stretch">
          {p.etapes.map((e, i) => (
            <li key={e.numero} className="relative w-[228px] shrink-0 pt-12">
              <span
                aria-hidden="true"
                className={`absolute top-[18px] h-[3px] ${p.ligne} ${i === 0 ? 'left-1/2' : 'left-0'} ${i === dernier ? 'right-1/2' : 'right-0'}`}
              />
              <span
                className={`absolute left-1/2 top-0 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full text-[15px] font-extrabold ${p.pastille}`}
              >
                {e.numero}
              </span>
              <Link href={e.href} className={`mx-1.5 flex h-full flex-col rounded-2xl border p-4 no-underline transition ${p.carte}`}>
                {e.moment ? <span className={`text-[11px] font-extrabold uppercase tracking-[0.1em] ${p.texte}`}>{e.moment}</span> : null}
                <span className={`mt-1 text-[15px] font-extrabold leading-snug ${p.encre}`}>{e.titre}</span>
                <span className={`mt-1.5 line-clamp-4 text-[13px] leading-relaxed ${p.texte}`}>{e.resume}</span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
      <p className={`mt-1 text-[13px] font-bold ${p.texte}`}>Fais glisser la frise pour voir la suite.</p>

      <div className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 ${p.carte}`}>
        <p className={`max-w-[46ch] text-[15px] font-extrabold ${p.encre}`}>{p.fin}</p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={p.hrefCreer}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-base font-extrabold text-white no-underline transition ${p.bouton}`}
          >
            {p.libelleCreer}
            <span aria-hidden="true">→</span>
          </Link>
          <Link
            href={p.href}
            className={`inline-flex items-center rounded-xl border-2 bg-white px-5 py-3 text-base font-extrabold no-underline transition ${p.encre} ${p.cadre}`}
          >
            Lire le chemin en détail
          </Link>
        </div>
      </div>
      <p className={`mt-3 text-[14px] leading-relaxed ${p.texte}`}>
        Avec un espace, les étapes se cochent toutes seules, tes pièces se rangent au bon endroit, et tu retrouves où tu en
        étais. Sans espace, tu peux quand même tout lire.
      </p>
    </section>
  );
}

const CE_QUE_DIT_UNE_ETAPE = [
  { titre: 'Ce qu’il te faut', texte: "Les pièces et les informations à avoir sous la main avant de commencer l'étape." },
  { titre: 'Comment faire', texte: 'Les gestes, dans l’ordre, avec les formulaires officiels et des documents d’exemple.' },
  { titre: 'Quand c’est fini', texte: 'La preuve que l’étape est passée — et ce que ça débloque pour la suite.' },
];
