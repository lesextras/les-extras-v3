import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { apiApprenant } from '../../../_shared/apprenant-serveur';
import { CoqueEcole, formaterDateHeure } from '../../_espace/coque';
import { ecoleDuSlug, moiSurEcole } from '../../_espace/donnees';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: { absolute: 'Calendrier' }, robots: { index: false, follow: false } };

interface Element {
  genre: 'evenement' | 'classe' | 'lecon';
  id: string;
  titre: string;
  sousTitre: string | null;
  debut: string;
  fin: string | null;
  lien: string | null;
  lieu: string | null;
}

const GENRE: Record<Element['genre'], { libelle: string; fond: string; texte: string }> = {
  evenement: { libelle: 'Événement', fond: '#EEF2FF', texte: '#3730A3' },
  classe: { libelle: 'Classe virtuelle', fond: '#E3F5EC', texte: '#0F5F3E' },
  lecon: { libelle: 'Nouvelle leçon', fond: '#FEF3E2', texte: '#7C3E06' },
};

/**
 * `/ecole/<slug>/calendrier` : CE QUI ARRIVE, DANS L'ORDRE.
 *
 * Les événements de l'école, les classes virtuelles de ses formations, et les
 * dates où ses leçons à ouverture différée s'ouvrent : les trois sources du
 * calendrier apprenant de Teachizy.
 */
export default async function PageCalendrier({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ecole = await ecoleDuSlug(slug);
  if (!ecole) notFound();
  const moi = await moiSurEcole(slug);
  if (!moi) redirect(`/ecole/${slug}/connexion`);
  const { data } = await apiApprenant<{ visible: boolean; elements: Element[] }>('/apprenant/calendrier');
  const elements = data?.elements ?? [];
  const maintenant = Date.now();
  const aVenir = elements.filter((e) => new Date(e.fin ?? e.debut).getTime() >= maintenant - 3600_000);
  const passes = elements.filter((e) => new Date(e.fin ?? e.debut).getTime() < maintenant - 3600_000).reverse();

  const ligne = (e: Element) => {
    const g = GENRE[e.genre];
    return (
      <li key={`${e.genre}-${e.id}`} className="flex flex-wrap items-start gap-4 rounded-2xl border border-[#DDEBE4] bg-white p-5">
        <div className="min-w-[170px] text-[15px] font-bold text-[#12312A] first-letter:uppercase">{formaterDateHeure(e.debut)}</div>
        <div className="min-w-0 flex-1">
          <span className="rounded-full px-2.5 py-0.5 text-xs font-extrabold" style={{ backgroundColor: g.fond, color: g.texte }}>
            {g.libelle}
          </span>
          <p className="mt-1.5 text-lg font-extrabold leading-tight text-[#12312A]">{e.titre}</p>
          {e.sousTitre ? <p className="mt-0.5 text-[15px] leading-relaxed">{e.sousTitre}</p> : null}
          {e.lieu ? <p className="mt-0.5 text-sm text-[#5E7A6E]">{e.lieu}</p> : null}
        </div>
        {e.lien ? (
          e.lien.startsWith('/') ? (
            <Link href={e.lien} className="rounded-xl px-4 py-2 text-sm font-extrabold text-white no-underline" style={{ backgroundColor: moi.ecole.couleur }}>
              {e.genre === 'lecon' ? 'Ouvrir la formation' : 'Rejoindre'}
            </Link>
          ) : (
            <a href={e.lien} target="_blank" rel="noreferrer" className="rounded-xl px-4 py-2 text-sm font-extrabold text-white no-underline" style={{ backgroundColor: moi.ecole.couleur }}>
              Ouvrir le lien
            </a>
          )
        ) : null}
      </li>
    );
  };

  return (
    <CoqueEcole ecole={moi.ecole} actif="calendrier" connecte>
      <h1 className="text-3xl font-extrabold tracking-tight text-[#12312A] sm:text-4xl">Calendrier</h1>
      {!data?.visible ? (
        <p className="mt-4 leading-relaxed">Le calendrier de cette école n’est pas ouvert aux apprenants.</p>
      ) : (
        <>
          <p className="mt-2 text-lg leading-relaxed">Les événements, les classes virtuelles et les leçons qui s’ouvrent pour vous.</p>
          {aVenir.length ? <ul className="mt-6 grid gap-3">{aVenir.map(ligne)}</ul> : <p className="mt-6 rounded-2xl border-2 border-dashed border-[#DDEBE4] px-5 py-8 text-center">Rien de prévu pour le moment.</p>}
          {passes.length ? (
            <details className="mt-8">
              <summary className="cursor-pointer font-bold text-[#12312A]">Le mois écoulé ({passes.length})</summary>
              <ul className="mt-3 grid gap-3 opacity-80">{passes.map(ligne)}</ul>
            </details>
          ) : null}
        </>
      )}
    </CoqueEcole>
  );
}
