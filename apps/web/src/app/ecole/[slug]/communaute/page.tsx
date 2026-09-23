import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { apiApprenant } from '../../../_shared/apprenant-serveur';
import { CoqueEcole } from '../../_espace/coque';
import { ecoleDuSlug, moiSurEcole } from '../../_espace/donnees';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: { absolute: 'Communauté' }, robots: { index: false, follow: false } };

interface Accueil {
  description: string | null;
  collections: { id: string; titre: string }[];
  espaces: { id: string; titre: string; description: string | null; icone: string | null; collectionId: string | null; publications: number }[];
}

/** `/ecole/<slug>/communaute` : les espaces, rangés par collection. */
export default async function PageCommunaute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ecole = await ecoleDuSlug(slug);
  if (!ecole) notFound();
  const moi = await moiSurEcole(slug);
  if (!moi) redirect(`/ecole/${slug}/connexion`);
  const { data, error } = await apiApprenant<Accueil>('/apprenant/communaute');

  const groupes = data
    ? [
        ...data.collections.map((c) => ({ titre: c.titre, espaces: data.espaces.filter((e) => e.collectionId === c.id) })),
        { titre: data.collections.length ? 'Autres espaces' : null, espaces: data.espaces.filter((e) => !e.collectionId || !data.collections.some((c) => c.id === e.collectionId)) },
      ].filter((g) => g.espaces.length)
    : [];

  return (
    <CoqueEcole ecole={moi.ecole} actif="communaute" connecte>
      <h1 className="text-3xl font-extrabold tracking-tight text-[#12312A] sm:text-4xl">Communauté</h1>
      {!data ? (
        <p className="mt-4 leading-relaxed">{error ?? 'La communauté ne se charge pas pour le moment.'}</p>
      ) : (
        <>
          {data.description ? <p className="mt-2 max-w-[68ch] whitespace-pre-line text-lg leading-relaxed">{data.description}</p> : null}
          {groupes.length === 0 ? <p className="mt-6">Aucun espace n’est encore ouvert.</p> : null}
          {groupes.map((g, n) => (
            <section key={`${g.titre}-${n}`} className="mt-8">
              {g.titre ? <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#5E7A6E]">{g.titre}</h2> : null}
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {g.espaces.map((e) => (
                  <li key={e.id}>
                    <Link href={`/ecole/${slug}/communaute/${e.id}`} className="flex items-start gap-3 rounded-2xl border border-[#DDEBE4] bg-white p-5 no-underline hover:border-[#B7E4CE]">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${moi.ecole.couleur}1A` }}>
                        {e.icone || '#'}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-lg font-extrabold leading-tight text-[#12312A]">{e.titre}</span>
                        {e.description ? <span className="mt-1 block text-[15px] leading-relaxed text-[#334A42]">{e.description}</span> : null}
                        <span className="mt-1 block text-sm text-[#5E7A6E]">
                          {e.publications} publication{e.publications > 1 ? 's' : ''}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </CoqueEcole>
  );
}
